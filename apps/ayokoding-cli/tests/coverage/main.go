package main

import (
	"bufio"
	"errors"
	"flag"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Static coverage failures, wrapped with the offending location.
var (
	errCoverageBlockMismatch  = errors.New("inconsistent coverage block statement count")
	errCoverageNoMatch        = errors.New("coverage selection matched no statements")
	errCoverageExcludeFormat  = errors.New("coverage exclusion rule must be `<repo-relpath>:<startline> # <reason>`")
	errCoverageExcludeStale   = errors.New("coverage exclusion rule matched no blocks")
	errCoverageExcludeCovered = errors.New("coverage exclusion rule matched a covered block")
)

func run() int {
	profile := flag.String("profile", "", "Go coverage profile")
	files := flag.String("files", "", "comma-separated production files")
	directories := flag.String("directories", "", "comma-separated deterministic production directories")
	minimum := flag.Float64("minimum", 99, "minimum covered statement percentage")
	excludeBlocks := flag.String("exclude-blocks", "", "owner-granted exemption rule file")

	flag.Parse()

	selected := map[string]bool{}

	for file := range strings.SplitSeq(*files, ",") {
		if cleaned := strings.TrimSpace(file); cleaned != "" {
			selected[cleaned] = true
		}
	}

	for directory := range strings.SplitSeq(*directories, ",") {
		directory = strings.TrimSpace(directory)
		if directory == "" {
			continue
		}

		entries, readError := os.ReadDir(directory)
		if readError != nil {
			panic(readError)
		}

		for _, entry := range entries {
			name := entry.Name()
			if !entry.Type().IsRegular() || !strings.HasSuffix(name, ".go") || strings.HasSuffix(name, "_test.go") {
				continue
			}

			selected[directory+"/"+name] = true
		}
	}

	// Declaration-only files have no blocks in a Go coverage profile. Discover
	// bodies rather than excluding filenames, so methods and global closures
	// remain selected even when their bodies contain zero statements.
	for file := range selected {
		source, readError := os.ReadFile(file)
		if readError != nil {
			panic(readError)
		}
		hasBody, parseError := coverageHasBody(source)
		if parseError != nil {
			panic(parseError)
		}
		if !hasBody {
			delete(selected, file)
		}
	}

	input, err := os.Open(*profile)
	if err != nil {
		panic(err)
	}
	defer func() { _ = input.Close() }()

	var exclusions []exclusionRule
	if strings.TrimSpace(*excludeBlocks) != "" {
		fsys, name := exclusionRuleFS(*excludeBlocks)
		rules, loadError := loadExclusionRules(fsys, name)
		if loadError != nil {
			panic(loadError)
		}
		exclusions = rules
	}

	counts, excluded, countError := countCoverageExcluding(input, selected, exclusions)
	if countError != nil {
		panic(countError)
	}
	covered, total := counts.covered, counts.total

	if exclusions != nil {
		_, _ = fmt.Fprintf(os.Stdout, "excluded %d statements in %d blocks via %s\n", excluded.total, excluded.blocks, *excludeBlocks)
	}
	percentage := float64(covered) * 100 / float64(total)
	_, _ = fmt.Fprintf(os.Stdout, "selected production line coverage: %.2f%% (%d/%d statements)\n", percentage, covered, total)

	if percentage < *minimum {
		return 1
	}

	return 0
}

func main() {
	os.Exit(run())
}

func coverageHasBody(source []byte) (bool, error) {
	file, err := parser.ParseFile(token.NewFileSet(), "", source, parser.SkipObjectResolution)
	if err != nil {
		return false, fmt.Errorf("coverage: parse file: %w", err)
	}
	hasBody := false
	ast.Inspect(file, func(node ast.Node) bool {
		switch value := node.(type) {
		case *ast.FuncDecl:
			hasBody = hasBody || value.Body != nil
		case *ast.FuncLit:
			hasBody = hasBody || value.Body != nil
		}
		return !hasBody
	})
	return hasBody, nil
}

type statementCoverage struct{ covered, total int }

func countCoverage(input io.Reader, selected map[string]bool) (statementCoverage, error) {
	counts, _, err := countCoverageExcluding(input, selected, nil)
	return counts, err
}

func countCoverageExcluding(input io.Reader, selected map[string]bool, exclusions []exclusionRule) (statementCoverage, excludedCoverage, error) {
	blocks, matchedFiles, err := scanProfileBlocks(input, selected)
	if err != nil {
		return statementCoverage{}, excludedCoverage{}, err
	}
	if err := ensureSelectedMatched(selected, matchedFiles); err != nil {
		return statementCoverage{}, excludedCoverage{}, err
	}
	excludedByBlock, err := indexExclusions(blocks, exclusions)
	if err != nil {
		return statementCoverage{}, excludedCoverage{}, err
	}
	return tallyCoverage(blocks, excludedByBlock)
}

// scanProfileBlocks unions per-location blocks across measured test packages,
// recording which selected files the profile covers.
func scanProfileBlocks(input io.Reader, selected map[string]bool) (map[string]coverageBlock, map[string]bool, error) {
	blocks := map[string]coverageBlock{}
	matchedFiles := map[string]bool{}
	scanner := bufio.NewScanner(input)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) != 3 || fields[0] == "mode:" {
			continue
		}
		location := fields[0]
		colon := strings.LastIndex(location, ":")
		if colon < 0 {
			continue
		}
		if !matchSelectedFile(location[:colon], selected, matchedFiles) {
			continue
		}
		statements, err := strconv.Atoi(fields[1])
		if err != nil {
			return nil, nil, fmt.Errorf("coverage: parse statement count: %w", err)
		}
		count, err := strconv.Atoi(fields[2])
		if err != nil {
			return nil, nil, fmt.Errorf("coverage: parse hit count: %w", err)
		}
		block, exists := blocks[location]
		if exists && block.statements != statements {
			return nil, nil, fmt.Errorf("%w for %s", errCoverageBlockMismatch, location)
		}
		blocks[location] = coverageBlock{statements: statements, covered: block.covered || count > 0}
	}
	if err := scanner.Err(); err != nil {
		return nil, nil, fmt.Errorf("coverage: scan profile: %w", err)
	}
	return blocks, matchedFiles, nil
}

// matchSelectedFile reports whether path selects a production file, recording
// the match for fail-closed validation.
func matchSelectedFile(path string, selected, matchedFiles map[string]bool) bool {
	for file := range selected {
		if strings.HasSuffix(path, file) {
			matchedFiles[file] = true
			return true
		}
	}
	return false
}

// ensureSelectedMatched fails closed when a selected file has no profile blocks.
func ensureSelectedMatched(selected, matchedFiles map[string]bool) error {
	for file := range selected {
		if !matchedFiles[file] {
			return fmt.Errorf("%w for %s", errCoverageNoMatch, file)
		}
	}
	return nil
}

// indexExclusions maps each exempted block location to its rule index, failing
// closed on rules that never match.
func indexExclusions(blocks map[string]coverageBlock, exclusions []exclusionRule) (map[string]int, error) {
	excludedByBlock := map[string]int{}
	matchedRules := map[int]bool{}
	for location := range blocks {
		for index, rule := range exclusions {
			if !matchExclusionRule(location, rule) {
				continue
			}
			matchedRules[index] = true
			excludedByBlock[location] = index
		}
	}
	for index, rule := range exclusions {
		if !matchedRules[index] {
			return nil, fmt.Errorf("%w: %s:%d", errCoverageExcludeStale, rule.path, rule.line)
		}
	}
	return excludedByBlock, nil
}

// matchExclusionRule reports whether a rule exempts a profile block: the file
// suffix plus the block start line both match.
func matchExclusionRule(location string, rule exclusionRule) bool {
	blockPath, start, ok := parseBlockStart(location)
	return ok && start == rule.line && strings.HasSuffix(blockPath, rule.path)
}

// tallyCoverage sums selected statements, skipping exempted uncovered blocks
// and failing closed on exempted covered blocks.
func tallyCoverage(blocks map[string]coverageBlock, excludedByBlock map[string]int) (statementCoverage, excludedCoverage, error) {
	counts := statementCoverage{}
	excluded := excludedCoverage{}
	for location, block := range blocks {
		if _, skip := excludedByBlock[location]; skip {
			if block.covered {
				return statementCoverage{}, excludedCoverage{}, fmt.Errorf("%w: %s", errCoverageExcludeCovered, location)
			}
			excluded.total += block.statements
			excluded.blocks++
			continue
		}
		counts.total += block.statements
		if block.covered {
			counts.covered += block.statements
		}
	}
	if counts.total == 0 {
		return statementCoverage{}, excludedCoverage{}, errCoverageNoMatch
	}
	return counts, excluded, nil
}

// exclusionRule exempts one uncovered profile block, identified by file
// suffix plus block start line, with the owner-granted reason recorded.
type exclusionRule struct {
	path   string
	line   int
	reason string
}

// excludedCoverage totals the statements skipped via owner-granted rules.
type excludedCoverage struct {
	total  int
	blocks int
}

// loadExclusionRules reads one `<repo-relpath>:<startline> # <reason>` rule
// per line from path in fsys. It fails closed: a missing file, a rule
// without a reason, and a rule that never matches are all errors, never
// silent skips.
func loadExclusionRules(fsys fs.FS, path string) ([]exclusionRule, error) {
	content, err := fs.ReadFile(fsys, path)
	if err != nil {
		return nil, fmt.Errorf("coverage: read exclude-blocks: %w", err)
	}
	return parseExclusionRules(strings.NewReader(string(content)))
}

// exclusionRuleFS roots an OS-supplied rule path in an fs.FS so rule loading
// stays injectable: relative paths resolve from the working directory,
// absolute paths from the filesystem root.
func exclusionRuleFS(path string) (fs.FS, string) {
	if filepath.IsAbs(path) {
		return os.DirFS("/"), strings.TrimPrefix(filepath.ToSlash(path), "/")
	}
	return os.DirFS("."), path
}

// parseExclusionRules parses one `<repo-relpath>:<startline> # <reason>`
// rule per line. It fails closed: a rule without a reason is an error,
// never a silent skip.
func parseExclusionRules(input io.Reader) ([]exclusionRule, error) {
	data, err := io.ReadAll(input)
	if err != nil {
		return nil, fmt.Errorf("coverage: read exclude-blocks: %w", err)
	}
	var rules []exclusionRule
	for number, raw := range strings.Split(string(data), "\n") {
		line := strings.TrimSpace(raw)
		if line == "" {
			continue
		}
		hash := strings.Index(line, "#")
		if hash < 0 || strings.TrimSpace(line[hash+1:]) == "" {
			return nil, fmt.Errorf("%w on line %d: %q", errCoverageExcludeFormat, number+1, raw)
		}
		target := strings.TrimSpace(line[:hash])
		colon := strings.LastIndex(target, ":")
		if colon < 0 {
			return nil, fmt.Errorf("%w on line %d: %q", errCoverageExcludeFormat, number+1, raw)
		}
		relpath := strings.TrimSpace(target[:colon])
		start, convertErr := strconv.Atoi(strings.TrimSpace(target[colon+1:]))
		if relpath == "" || convertErr != nil || start <= 0 {
			return nil, fmt.Errorf("%w on line %d: %q", errCoverageExcludeFormat, number+1, raw)
		}
		rules = append(rules, exclusionRule{path: relpath, line: start, reason: strings.TrimSpace(line[hash+1:])})
	}
	return rules, nil
}

// parseBlockStart splits a profile location into its file path and block
// start line.
func parseBlockStart(location string) (string, int, bool) {
	colon := strings.LastIndex(location, ":")
	if colon < 0 {
		return "", 0, false
	}
	rest := location[colon+1:]
	head, _, found := strings.Cut(rest, ".")
	if !found {
		return "", 0, false
	}
	start, err := strconv.Atoi(head)
	if err != nil || start <= 0 {
		return "", 0, false
	}
	return location[:colon], start, true
}

// coverageBlock is one location's union across all measured test packages.
type coverageBlock struct {
	statements int
	covered    bool
}
