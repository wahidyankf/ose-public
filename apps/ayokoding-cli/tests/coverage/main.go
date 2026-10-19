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
	"os"
	"strconv"
	"strings"
)

// Static coverage failures, wrapped with the offending location.
var (
	errCoverageBlockMismatch = errors.New("inconsistent coverage block statement count")
	errCoverageNoMatch       = errors.New("coverage selection matched no statements")
)

func run() int {
	profile := flag.String("profile", "", "Go coverage profile")
	files := flag.String("files", "", "comma-separated production files")
	directories := flag.String("directories", "", "comma-separated deterministic production directories")
	minimum := flag.Float64("minimum", 99, "minimum covered statement percentage")

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

	counts, countError := countCoverage(input, selected)
	if countError != nil {
		panic(countError)
	}
	covered, total := counts.covered, counts.total

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
	counts := statementCoverage{}
	matchedFiles := map[string]bool{}
	blocks := map[string]coverageBlock{}
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
		path := location[:colon]
		matched := false
		for file := range selected {
			if strings.HasSuffix(path, file) {
				matched = true
				matchedFiles[file] = true
				break
			}
		}
		if !matched {
			continue
		}
		statements, err := strconv.Atoi(fields[1])
		if err != nil {
			return statementCoverage{}, fmt.Errorf("coverage: parse statement count: %w", err)
		}
		count, err := strconv.Atoi(fields[2])
		if err != nil {
			return statementCoverage{}, fmt.Errorf("coverage: parse hit count: %w", err)
		}
		block, exists := blocks[location]
		if exists && block.statements != statements {
			return statementCoverage{}, fmt.Errorf("%w for %s", errCoverageBlockMismatch, location)
		}
		blocks[location] = coverageBlock{statements: statements, covered: block.covered || count > 0}
	}
	if err := scanner.Err(); err != nil {
		return statementCoverage{}, fmt.Errorf("coverage: scan profile: %w", err)
	}
	for file := range selected {
		if !matchedFiles[file] {
			return statementCoverage{}, fmt.Errorf("%w for %s", errCoverageNoMatch, file)
		}
	}
	for _, block := range blocks {
		counts.total += block.statements
		if block.covered {
			counts.covered += block.statements
		}
	}
	if counts.total == 0 {
		return statementCoverage{}, errCoverageNoMatch
	}
	return counts, nil
}

// coverageBlock is one location's union across all measured test packages.
type coverageBlock struct {
	statements int
	covered    bool
}
