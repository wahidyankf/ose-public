// Package governance provides validators for governance layer conventions,
// including vendor-independence auditing of markdown files.
//
// The vendor audit scanner detects forbidden vendor-specific terms in prose
// and reports them with suggested replacements. Certain regions are exempt
// from scanning: code fences, binding-example fences, inline code spans,
// link URL portions, HTML comments, and sections under "Platform Binding
// Examples" headings.
package governance

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// forbiddenConvention is the path suffix of the definition file, which is
// exempt from scanning (it defines the convention and must be allowed to
// name the terms).
const forbiddenConvention = "governance/conventions/structure/governance-vendor-independence.md"

// forbiddenTerms maps each forbidden regex pattern to its suggested
// replacement. The order matters: longer/more-specific patterns must appear
// before shorter/overlapping ones to avoid partial matches shadowing them.
var forbiddenTerms = []struct {
	re          *regexp.Regexp
	displayTerm string
	replacement string
}{
	{regexp.MustCompile(`Claude Code`), "Claude Code", `"the coding agent"`},
	{regexp.MustCompile(`OpenCode`), "OpenCode", `"the coding agent" or drop where redundant`},
	{regexp.MustCompile(`Anthropic`), "Anthropic", `"the model vendor" or drop`},
	{regexp.MustCompile(`\.claude/`), ".claude/", `"primary binding directory"`},
	{regexp.MustCompile(`\.opencode/`), ".opencode/", `"secondary binding directory"`},
	{regexp.MustCompile(`\bSonnet\b`), "Sonnet", `"execution-grade"`},
	{regexp.MustCompile(`\bOpus\b`), "Opus", `"planning-grade"`},
	{regexp.MustCompile(`\bHaiku\b`), "Haiku", `"fast"`},
}

// Finding describes a single vendor-term violation found in a file.
type Finding struct {
	Path        string
	Line        int
	Match       string
	Replacement string
}

// ScanFile reads the file at path and returns all vendor-term findings.
func ScanFile(path string) ([]Finding, error) {
	data, err := os.ReadFile(path) //nolint:gosec // trusted repo path
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", path, err)
	}
	return scanLines(path, string(data)), nil
}

// Walk walks all .md files under root recursively and returns all findings.
// It skips the governance-vendor-independence.md convention definition file.
// A missing root directory yields an empty slice, not an error.
func Walk(root string) ([]Finding, error) {
	var findings []Finding
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			if os.IsNotExist(err) {
				return filepath.SkipAll
			}
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(d.Name(), ".md") {
			return nil
		}
		// Skip the convention definition file itself.
		if strings.HasSuffix(filepath.ToSlash(path), forbiddenConvention) {
			return nil
		}
		ff, err := ScanFile(path)
		if err != nil {
			return err
		}
		findings = append(findings, ff...)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return findings, nil
}

// scanLines performs the core line-by-line scanning of content, tracking
// exemption state for code fences and Platform Binding Examples headings.
func scanLines(path, content string) []Finding {
	lines := strings.Split(content, "\n")

	var findings []Finding
	inCodeFence := false
	inPlatformBindingSection := false
	platformBindingHeadingLevel := 0

	for i, line := range lines {
		lineNum := i + 1

		// Detect code fence toggles (``` with optional language tag).
		if isFenceLine(line) {
			inCodeFence = !inCodeFence
			continue
		}

		// Lines inside a code fence are fully exempt.
		if inCodeFence {
			continue
		}

		// Detect headings to manage Platform Binding Examples section.
		if level, ok := parseHeading(line); ok {
			if isPlatformBindingHeading(line) {
				inPlatformBindingSection = true
				platformBindingHeadingLevel = level
				continue
			}
			// A heading at same or higher level (lower number) ends the section.
			if inPlatformBindingSection && level <= platformBindingHeadingLevel {
				inPlatformBindingSection = false
				platformBindingHeadingLevel = 0
			}
		}

		// Lines inside the Platform Binding Examples section are exempt.
		if inPlatformBindingSection {
			continue
		}

		// Strip non-prose regions from the line before scanning.
		stripped := stripNonProse(line)

		// Scan for each forbidden term.
		for _, ft := range forbiddenTerms {
			if ft.re.MatchString(stripped) {
				findings = append(findings, Finding{
					Path:        path,
					Line:        lineNum,
					Match:       ft.displayTerm,
					Replacement: ft.replacement,
				})
				// Only report the first matching term per line per pattern
				// (the regex may match multiple times, but we report once per term).
			}
		}
	}
	return findings
}

// isFenceLine reports whether line is a code fence delimiter (``` with any
// optional language tag, possibly preceded by whitespace).
func isFenceLine(line string) bool {
	trimmed := strings.TrimSpace(line)
	return strings.HasPrefix(trimmed, "```")
}

// stripNonProse removes regions of a line that are exempt from vendor-term
// scanning: inline code spans, link URL portions, and HTML comments.
// The returned string is safe to scan for forbidden terms in prose.
func stripNonProse(line string) string {
	// Strip HTML comments <!-- ... -->
	line = htmlCommentRe.ReplaceAllString(line, "")
	// Strip inline code spans `...`
	line = inlineCodeRe.ReplaceAllString(line, "``")
	// Strip link URL portions [text](url) → [text]
	line = linkURLRe.ReplaceAllString(line, "[$1]")
	return line
}

var (
	htmlCommentRe = regexp.MustCompile(`<!--.*?-->`)
	inlineCodeRe  = regexp.MustCompile("`[^`]*`")
	linkURLRe     = regexp.MustCompile(`\[([^\]]*)\]\([^)]*\)`)
)

// parseHeading detects ATX headings (## Heading) and returns (level, true).
// Returns (0, false) if the line is not a heading.
func parseHeading(line string) (int, bool) {
	trimmed := strings.TrimSpace(line)
	if !strings.HasPrefix(trimmed, "#") {
		return 0, false
	}
	level := 0
	for _, ch := range trimmed {
		if ch == '#' {
			level++
		} else {
			break
		}
	}
	if level > 6 {
		return 0, false
	}
	// Must be followed by a space (standard ATX heading).
	if len(trimmed) <= level || trimmed[level] != ' ' {
		return 0, false
	}
	return level, true
}

// isPlatformBindingHeading reports whether the heading line text contains
// "Platform Binding Examples" (case-insensitive).
func isPlatformBindingHeading(line string) bool {
	return strings.Contains(strings.ToLower(line), "platform binding examples")
}
