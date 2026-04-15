package docs

import (
	"bufio"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/fileutil"
)

var (
	// linkRegex matches markdown links: [text](url)
	linkRegex = regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
)

// GetMarkdownFiles returns a list of markdown files to scan based on options.
func GetMarkdownFiles(opts ScanOptions) ([]string, error) {
	var files []string
	var err error

	if opts.StagedOnly {
		files, err = getStagedMarkdownFiles(opts.RepoRoot)
	} else {
		files, err = getAllMarkdownFiles(opts.RepoRoot)
	}

	if err != nil {
		return nil, err
	}

	// Filter out skip paths
	return filterSkipPaths(files, opts.RepoRoot, opts.SkipPaths), nil
}

// filterSkipPaths filters out files that match any of the skip paths.
func filterSkipPaths(files []string, repoRoot string, skipPaths []string) []string {
	if len(skipPaths) == 0 {
		return files
	}

	var filtered []string
	for _, file := range files {
		relPath, err := filepath.Rel(repoRoot, file)
		if err != nil {
			// If we can't get relative path, keep the file
			filtered = append(filtered, file)
			continue
		}

		skip := false
		for _, skipPath := range skipPaths {
			// Check if file is under skip path
			if strings.HasPrefix(relPath, skipPath) || strings.HasPrefix(relPath, filepath.Clean(skipPath)) {
				skip = true
				break
			}
		}

		if !skip {
			filtered = append(filtered, file)
		}
	}

	return filtered
}

// getStagedMarkdownFiles returns staged markdown files from git.
func getStagedMarkdownFiles(repoRoot string) ([]string, error) {
	return fileutil.GetStagedFilesFiltered(repoRoot, func(f string) bool {
		return strings.HasSuffix(f, ".md")
	})
}

// getAllMarkdownFiles returns all markdown files in core directories.
func getAllMarkdownFiles(repoRoot string) ([]string, error) {
	return fileutil.WalkMarkdownDirs(repoRoot, []string{"governance", "docs", ".claude"})
}

// ExtractLinks extracts markdown links from a file with line numbers.
func ExtractLinks(filePath string) ([]LinkInfo, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer func() { _ = file.Close() }()

	var links []LinkInfo
	scanner := bufio.NewScanner(file)
	lineNumber := 0
	inCodeBlock := false

	for scanner.Scan() {
		lineNumber++
		line := scanner.Text()

		// Track code block boundaries
		if strings.HasPrefix(strings.TrimSpace(line), "```") {
			inCodeBlock = !inCodeBlock
			continue
		}

		// Skip lines inside code blocks
		if inCodeBlock {
			continue
		}

		// Find all markdown links in the line
		matches := linkRegex.FindAllStringSubmatch(line, -1)
		for _, match := range matches {
			if len(match) < 3 {
				continue
			}
			url := match[2]

			// Strip angle brackets if present (markdown autolink syntax)
			url = strings.Trim(url, "<>")

			// Skip external URLs, anchors, and mailto
			if strings.HasPrefix(url, "http://") ||
				strings.HasPrefix(url, "https://") ||
				strings.HasPrefix(url, "#") ||
				strings.HasPrefix(url, "mailto:") {
				continue
			}

			// Skip placeholder/example/Hugo paths
			if ShouldSkipLink(url) {
				continue
			}

			links = append(links, LinkInfo{
				LineNumber: lineNumber,
				URL:        url,
				IsRelative: !strings.HasPrefix(url, "/"),
			})
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return links, nil
}

// ShouldSkipLink determines if a link should be skipped during validation.
func ShouldSkipLink(link string) bool {
	// Skip Hugo absolute paths (these are valid in Hugo sites)
	if strings.HasPrefix(link, "/") {
		return true
	}

	// Skip Hugo shortcodes
	if strings.Contains(link, "{{<") || strings.Contains(link, "{{%") {
		return true
	}

	// Skip obvious placeholder patterns
	placeholders := []string{
		"path.md", "target", "link",
		"./path/to/", "../path/to/",
		"path/to/convention.md", "path/to/practice.md",
		"path/to/rule.md", "./relative/path/to/",
	}
	for _, placeholder := range placeholders {
		if strings.Contains(link, placeholder) {
			return true
		}
	}

	// Skip links with template placeholders in square brackets
	if regexp.MustCompile(`\[[\w-]+\]`).MatchString(link) {
		return true
	}

	// Skip links that are just "path", "target", or "link"
	if link == "path" || link == "target" || link == "link" {
		return true
	}

	// Skip example image paths
	if strings.Contains(link, "/images/") && !strings.HasPrefix(link, "../") {
		return true
	}

	// Skip example file names (clearly examples, not real links)
	examplePatterns := []string{
		"./overview", "./guide.md", "./examples.md", "./reference.md",
		"./diagram.png", "./image.png", "./screenshots/",
		"./auth-guide.md", "by-concept/beginner", "./by-example/beginner",
		"swe/prog-lang/", "../parent", "./ai/", "../swe/", "../../advanced/",
		"url", "./LICENSE", "../../features.md",
		"../../.opencode/", // OpenCode references (not part of this repo)
	}
	for _, pattern := range examplePatterns {
		if strings.Contains(link, pattern) {
			return true
		}
	}

	return false
}
