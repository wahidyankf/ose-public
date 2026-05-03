// Package glossary provides validation for bounded-context ubiquitous-language glossary files.
package glossary

import (
	"bufio"
	"os"
	"regexp"
	"strings"
)

// osReadFileFn is injectable for unit tests.
var osReadFileFn = func(path string) ([]byte, error) { return os.ReadFile(path) } //nolint:gosec

var (
	reFrontmatter    = regexp.MustCompile(`^\*\*([^*]+)\*\*:\s*(.+)$`)
	reBacktickIdents = regexp.MustCompile("`([^`]+)`")
)

// requiredFrontmatterKeys are the keys every glossary must declare.
var requiredFrontmatterKeys = []string{"Bounded context", "Maintainer", "Last reviewed"}

// expectedTableColumns is the exact ordered header the Terms table must have.
var expectedTableColumns = []string{"Term", "Definition", "Code identifier(s)", "Used in features"}

// Parse reads and parses a glossary markdown file.
func Parse(path string) *Glossary {
	g := &Glossary{Path: path, Frontmatter: map[string]string{}}
	data, err := osReadFileFn(path)
	if err != nil {
		g.ParseErrors = append(g.ParseErrors, ParseError{Message: err.Error()})
		return g
	}
	parseContent(g, string(data))
	return g
}

func parseContent(g *Glossary, content string) {
	scanner := bufio.NewScanner(strings.NewReader(content))
	lineNum := 0
	inTermsTable := false
	headerParsed := false
	inForbidden := false

	for scanner.Scan() {
		lineNum++
		line := scanner.Text()

		// Frontmatter: bold key-value pairs before any section.
		if m := reFrontmatter.FindStringSubmatch(line); m != nil {
			g.Frontmatter[strings.TrimSpace(m[1])] = strings.TrimSpace(m[2])
			continue
		}

		// Section headers.
		if strings.HasPrefix(line, "## Terms") {
			inTermsTable = true
			inForbidden = false
			headerParsed = false
			continue
		}
		if strings.HasPrefix(line, "## Forbidden synonyms") {
			inTermsTable = false
			inForbidden = true
			continue
		}
		if strings.HasPrefix(line, "## ") {
			inTermsTable = false
			inForbidden = false
			continue
		}

		if inTermsTable {
			if strings.HasPrefix(line, "|") {
				cells := splitTableRow(line)
				if !headerParsed {
					// First pipe row is the header.
					headerParsed = true
					g.ParseErrors = append(g.ParseErrors, validateTableHeader(cells, lineNum)...)
					continue
				}
				// Separator row (dashes).
				if isSeparatorRow(cells) {
					continue
				}
				// Data row.
				if len(cells) >= 4 {
					t := Term{
						Term:            stripMarkup(cells[0]),
						Definition:      stripMarkup(cells[1]),
						CodeIdentifiers: parseBacktickList(cells[2]),
						UsedInFeatures:  parseFeatureRefs(cells[3]),
						SourceLine:      lineNum,
					}
					g.Terms = append(g.Terms, t)
				}
			}
		}

		if inForbidden {
			// Bullet list entries: - "Term" — reason
			trimmed := strings.TrimPrefix(strings.TrimSpace(line), "- ")
			if trimmed == "" || trimmed == line {
				continue
			}
			term, reason := parseForbiddenEntry(trimmed)
			if term != "" {
				g.ForbiddenSynonyms = append(g.ForbiddenSynonyms, Forbidden{
					Term:       term,
					Reason:     reason,
					SourceLine: lineNum,
				})
			}
		}
	}
}

// validateTableHeader returns ParseErrors if the header doesn't match expectedTableColumns.
func validateTableHeader(cells []string, lineNum int) []ParseError {
	if len(cells) < len(expectedTableColumns) {
		return []ParseError{{Line: lineNum, Message: "malformed terms table header: too few columns"}}
	}
	for i, expected := range expectedTableColumns {
		got := stripMarkup(cells[i])
		if got != expected {
			return []ParseError{{
				Line:    lineNum,
				Message: "malformed terms table header: column " + got + " expected " + expected,
			}}
		}
	}
	return nil
}

// splitTableRow splits a markdown table row into trimmed cell strings.
func splitTableRow(line string) []string {
	line = strings.TrimPrefix(strings.TrimSuffix(strings.TrimSpace(line), "|"), "|")
	parts := strings.Split(line, "|")
	out := make([]string, len(parts))
	for i, p := range parts {
		out[i] = strings.TrimSpace(p)
	}
	return out
}

func isSeparatorRow(cells []string) bool {
	for _, c := range cells {
		stripped := strings.TrimSpace(strings.ReplaceAll(c, "-", ""))
		if stripped != "" && stripped != ":" {
			return false
		}
	}
	return len(cells) > 0
}

// stripMarkup removes backticks and trims whitespace from a table cell.
func stripMarkup(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "`", "")
	return s
}

// parseBacktickList extracts all backtick-enclosed identifiers from a cell.
func parseBacktickList(cell string) []string {
	matches := reBacktickIdents.FindAllStringSubmatch(cell, -1)
	var out []string
	for _, m := range matches {
		id := strings.TrimSpace(m[1])
		if id != "" {
			out = append(out, id)
		}
	}
	return out
}

// parseFeatureRefs splits the "Used in features" cell into individual paths.
// Paths may be separated by commas or newlines; strips surrounding whitespace, backticks,
// and trailing parenthetical annotations like "(Scenario: foo)" or "(history-flavoured scenarios)".
func parseFeatureRefs(cell string) []string {
	cell = strings.ReplaceAll(cell, "<br>", ",")
	parts := strings.Split(cell, ",")
	var out []string
	for _, p := range parts {
		p = strings.TrimSpace(strings.ReplaceAll(p, "`", ""))
		// Strip trailing parenthetical annotation.
		if idx := strings.Index(p, "("); idx >= 0 {
			p = strings.TrimSpace(p[:idx])
		}
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

// parseForbiddenEntry parses lines like: "Term" — reason
func parseForbiddenEntry(line string) (term, reason string) {
	// Strip surrounding quotes from the term.
	sep := "—"
	idx := strings.Index(line, sep)
	if idx < 0 {
		// Try ASCII dash.
		idx = strings.Index(line, "-")
	}
	if idx < 0 {
		return strings.Trim(strings.TrimSpace(line), `"`), ""
	}
	term = strings.Trim(strings.TrimSpace(line[:idx]), `"`)
	reason = strings.TrimSpace(line[idx+len(sep):])
	return
}
