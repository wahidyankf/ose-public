// Package governance provides validators for governance layer conventions,
// including vendor-independence auditing of markdown files.
//
// The vendor audit scanner detects forbidden vendor-specific terms in prose
// and reports them with suggested replacements. Certain regions are exempt
// from scanning: code fences (all backtick-delimited blocks), binding-example
// fences, YAML frontmatter, multi-line HTML comments, inline code spans,
// link URL portions, and sections under "Platform Binding Examples" headings.
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
// exemption state for code fences, YAML frontmatter, multi-line HTML comments,
// and Platform Binding Examples headings.
func scanLines(path, content string) []Finding {
	lines := strings.Split(content, "\n")

	var findings []Finding

	// inCodeFenceLen: 0 = not in fence; >0 = fence opened with this backtick count.
	// Per CommonMark, a fence closes only when a line has >= the opener's backtick count.
	inCodeFenceLen := 0

	// inFrontmatter: true between the first and second "---" (YAML front matter).
	inFrontmatter := false
	frontmatterSeen := false // set once the first --- is consumed

	// inHTMLComment: true inside a multi-line HTML comment.
	inHTMLComment := false

	inPlatformBindingSection := false
	platformBindingHeadingLevel := 0

	for i, line := range lines {
		lineNum := i + 1

		// ── YAML frontmatter ──────────────────────────────────────────────────
		if lineNum == 1 && strings.TrimSpace(line) == "---" {
			inFrontmatter = true
			frontmatterSeen = true
			continue
		}
		if inFrontmatter {
			if strings.TrimSpace(line) == "---" {
				inFrontmatter = false
			}
			continue
		}
		_ = frontmatterSeen

		// ── Multi-line HTML comment ───────────────────────────────────────────
		if inHTMLComment {
			if strings.Contains(line, "-->") {
				inHTMLComment = false
			}
			continue
		}
		if strings.Contains(line, "<!--") && !strings.Contains(line, "-->") {
			// Opening a multi-line comment — still process the part before <!--
			// by stripping the comment tail, but for simplicity we skip the whole line.
			inHTMLComment = true
			// Check the portion before <!-- for violations.
			beforeComment := line[:strings.Index(line, "<!--")]
			if stripped := stripNonProse(beforeComment); stripped != "" {
				for _, ft := range forbiddenTerms {
					if ft.re.MatchString(stripped) {
						findings = append(findings, Finding{
							Path:        path,
							Line:        lineNum,
							Match:       ft.displayTerm,
							Replacement: ft.replacement,
						})
					}
				}
			}
			continue
		}

		// ── Code fences (length-aware per CommonMark) ─────────────────────────
		if fl := fenceLineLen(line); fl > 0 {
			if inCodeFenceLen == 0 {
				// Opening a new fence.
				inCodeFenceLen = fl
				continue
			} else if fl >= inCodeFenceLen {
				// Closing the current fence (closer must be >= opener length).
				inCodeFenceLen = 0
				continue
			}
			// Inner fence line (shorter than opener) — it is content; fall through.
		}

		// Lines inside a code fence are fully exempt.
		if inCodeFenceLen > 0 {
			continue
		}

		// ── Platform Binding Examples heading scope ───────────────────────────
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

		// ── Scan for forbidden terms ──────────────────────────────────────────
		stripped := stripNonProse(line)

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

// fenceLineLen returns the number of leading backticks on a fence delimiter
// line (>= 3 to be a valid fence). Returns 0 if the line is not a fence line.
func fenceLineLen(line string) int {
	trimmed := strings.TrimSpace(line)
	n := 0
	for _, ch := range trimmed {
		if ch == '`' {
			n++
		} else {
			break
		}
	}
	if n >= 3 {
		return n
	}
	return 0
}

// stripNonProse removes regions of a line that are exempt from vendor-term
// scanning: inline code spans, link URL portions, and HTML comments.
// The returned string is safe to scan for forbidden terms in prose.
func stripNonProse(line string) string {
	// Strip HTML comments <!-- ... --> (single-line only; multi-line handled by state)
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
