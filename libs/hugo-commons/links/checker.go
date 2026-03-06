// Package links provides shared link-checking utilities for Hugo site CLIs.
package links

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// BrokenLink represents a broken internal link found in a markdown file.
type BrokenLink struct {
	SourceFile string `json:"source_file"`
	Line       int    `json:"line"`
	Text       string `json:"text"`
	Target     string `json:"target"`
}

// CheckResult holds the result of checking all internal links.
type CheckResult struct {
	CheckedCount int
	ErrorCount   int
	Errors       []string
	BrokenLinks  []BrokenLink
}

var linkRegex = regexp.MustCompile(`\[([^\]]*)\]\(([^)]+)\)`)

// filepathAbs is a package-level variable for dependency injection in tests.
var filepathAbs = filepath.Abs

// osWalk is a package-level variable for dependency injection in tests.
var osWalk = filepath.Walk

// CheckLinks validates all internal links in contentDir (walks all .md files).
func CheckLinks(contentDir string) (*CheckResult, error) {
	absContentDir, err := filepathAbs(contentDir)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve path: %w", err)
	}

	if _, statErr := os.Stat(absContentDir); os.IsNotExist(statErr) {
		return nil, fmt.Errorf("content directory does not exist: %s", absContentDir)
	}

	result := &CheckResult{
		Errors:      []string{},
		BrokenLinks: []BrokenLink{},
	}

	walkErr := osWalk(absContentDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			result.ErrorCount++
			result.Errors = append(result.Errors, fmt.Sprintf("walk error for %s: %v", path, err))
			return nil
		}

		if info.IsDir() || !strings.HasSuffix(path, ".md") {
			return nil
		}

		fileResult, fileErr := checkFileLinks(path, absContentDir)
		if fileErr != nil {
			result.ErrorCount++
			result.Errors = append(result.Errors, fmt.Sprintf("error reading %s: %v", path, fileErr))
			return nil
		}

		result.CheckedCount += fileResult.checked
		result.BrokenLinks = append(result.BrokenLinks, fileResult.broken...)
		return nil
	})

	if walkErr != nil {
		return nil, fmt.Errorf("failed to walk directory: %w", walkErr)
	}

	return result, nil
}

type fileCheckResult struct {
	checked int
	broken  []BrokenLink
}

func checkFileLinks(filePath, absContentDir string) (_ *fileCheckResult, err error) {
	f, ferr := os.Open(filePath)
	if ferr != nil {
		return nil, ferr
	}
	defer func() {
		if cerr := f.Close(); cerr != nil && err == nil {
			err = cerr
		}
	}()

	result := &fileCheckResult{}
	scanner := bufio.NewScanner(f)
	lineNum := 0
	inFencedBlock := false

	for scanner.Scan() {
		lineNum++
		line := scanner.Text()

		// Track fenced code blocks (``` or ~~~) to avoid false positives
		// from code examples that contain function call syntax like map["key"](arg)
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "```") || strings.HasPrefix(trimmed, "~~~") {
			inFencedBlock = !inFencedBlock
			continue
		}
		if inFencedBlock {
			continue
		}

		matches := linkRegex.FindAllStringSubmatch(line, -1)

		for _, match := range matches {
			text := match[1]
			target := match[2]

			if !isInternalLink(target) {
				continue
			}

			target = stripFragmentAndQuery(target)
			result.checked++

			if !targetExists(absContentDir, target) {
				result.broken = append(result.broken, BrokenLink{
					SourceFile: filePath,
					Line:       lineNum,
					Text:       text,
					Target:     target,
				})
			}
		}
	}

	if scanErr := scanner.Err(); scanErr != nil && err == nil {
		err = scanErr
	}

	return result, err
}

func isInternalLink(target string) bool {
	if strings.HasPrefix(target, "http://") ||
		strings.HasPrefix(target, "https://") ||
		strings.HasPrefix(target, "mailto:") ||
		strings.HasPrefix(target, "//") {
		return false
	}
	// Same-page anchor only (starts with #)
	if strings.HasPrefix(target, "#") {
		return false
	}
	// Skip links to static assets (files with extensions like .xml, .pdf, .json, etc.)
	// Hugo-generated files (RSS feeds, sitemaps) are not markdown content pages
	if hasFileExtension(target) {
		return false
	}
	return true
}

// hasFileExtension reports whether the last path segment of target contains a dot,
// indicating a link to a file (e.g. /updates/index.xml) rather than a Hugo page.
func hasFileExtension(target string) bool {
	last := target
	if idx := strings.LastIndexByte(target, '/'); idx >= 0 {
		last = target[idx+1:]
	}
	return strings.Contains(last, ".")
}

func stripFragmentAndQuery(target string) string {
	if idx := strings.IndexByte(target, '#'); idx >= 0 {
		target = target[:idx]
	}
	if idx := strings.IndexByte(target, '?'); idx >= 0 {
		target = target[:idx]
	}
	return target
}

func targetExists(absContentDir, target string) bool {
	localPath := filepath.Join(absContentDir, filepath.FromSlash(target))

	// Check .md form
	if _, err := os.Stat(localPath + ".md"); err == nil {
		return true
	}

	// Check /_index.md form
	if _, err := os.Stat(filepath.Join(localPath, "_index.md")); err == nil {
		return true
	}

	return false
}
