// Package naming provides pure validators for agent and workflow naming
// conventions. The validators are filesystem-agnostic — callers collect the
// file lists (and content bytes for frontmatter checks) and pass them in.
//
// Two conventions are enforced:
//
//   - Agents: filename must end with one of the role suffixes
//     {maker, checker, fixer, dev, deployer, manager}; the YAML
//     frontmatter `name:` field (when present) must equal the filename
//     without the `.md` suffix; and `.claude/agents/*.md` must mirror
//     `.opencode/agents/*.md` set-wise.
//
//   - Workflows: filename must end with one of the type suffixes
//     {quality-gate, execution, setup}; `name:` field equals filename.
//     README.md and anything under `meta/` is exempt (callers filter).
package naming

import (
	"fmt"
	"path/filepath"
	"sort"
	"strings"
)

// Violation describes a single naming-rule failure.
type Violation struct {
	Path    string
	Kind    string // "role-suffix" | "type-suffix" | "frontmatter-mismatch" | "mirror-drift"
	Message string
}

// basenameSansExt returns the filename of `path` with the `.md` extension
// stripped. Non-markdown files are returned verbatim (sans extension).
func basenameSansExt(path string) string {
	base := filepath.Base(path)
	return strings.TrimSuffix(base, filepath.Ext(base))
}

// ValidateSuffix returns a Violation if `basename(path)` (without `.md`) does
// not end with any of `allowedSuffixes`. Matching is performed against the
// trailing hyphen-delimited segment(s): a filename `foo-bar-maker` matches
// suffix `maker`; `foo-quality-gate` matches suffix `quality-gate`. The
// caller is responsible for filtering out README.md and exempt paths before
// invoking this function.
//
// The `kind` argument labels the returned Violation (e.g. "role-suffix" or
// "type-suffix") so agent and workflow validators can share this function
// while still producing distinct messages.
func ValidateSuffix(path string, allowedSuffixes []string, kind string) *Violation {
	name := basenameSansExt(path)
	for _, suffix := range allowedSuffixes {
		if name == suffix {
			// A bare suffix (e.g. "maker.md") has no scope and is invalid.
			continue
		}
		if strings.HasSuffix(name, "-"+suffix) {
			return nil
		}
	}
	return &Violation{
		Path: path,
		Kind: kind,
		Message: fmt.Sprintf(
			"filename %q does not end with any allowed suffix (%s)",
			name, strings.Join(allowedSuffixes, ", "),
		),
	}
}

// extractFrontmatterName returns the value of the top-level `name:` field
// from the YAML frontmatter of `content`, or the empty string if the file
// has no frontmatter or no `name:` field. The parser is intentionally
// minimal: it reads the delimited `---` block at the top of the file and
// the first `name:` line inside it.
func extractFrontmatterName(content []byte) string {
	text := string(content)
	if !strings.HasPrefix(text, "---\n") && !strings.HasPrefix(text, "---\r\n") {
		return ""
	}
	// Find the closing delimiter.
	rest := text[4:]
	end := strings.Index(rest, "\n---")
	if end < 0 {
		return ""
	}
	frontmatter := rest[:end]
	for _, line := range strings.Split(frontmatter, "\n") {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "name:") {
			value := strings.TrimSpace(strings.TrimPrefix(trimmed, "name:"))
			// Strip optional surrounding quotes.
			value = strings.Trim(value, `"'`)
			return value
		}
	}
	return ""
}

// ValidateFrontmatterName returns a Violation if the YAML frontmatter
// `name:` field in `content` does not equal `basename(path)` (without the
// `.md` suffix). If the file has no frontmatter or no `name:` field, this
// function returns nil — callers that require the field (e.g. the agent
// validator for `.claude/agents/*.md`) must assert presence separately.
func ValidateFrontmatterName(path string, content []byte) *Violation {
	name := extractFrontmatterName(content)
	if name == "" {
		return nil
	}
	expected := basenameSansExt(path)
	if name == expected {
		return nil
	}
	return &Violation{
		Path: path,
		Kind: "frontmatter-mismatch",
		Message: fmt.Sprintf(
			"frontmatter name %q does not match filename %q",
			name, expected,
		),
	}
}

// ValidateMirror returns violations for every file present in exactly one of
// `claudeFiles` and `opencodeFiles`. Inputs are compared by basename only
// (the directory prefix differs by design). The returned slice is sorted
// by Path for stable output.
func ValidateMirror(claudeFiles, opencodeFiles []string) []Violation {
	claudeSet := map[string]string{}
	for _, p := range claudeFiles {
		claudeSet[basenameSansExt(p)] = p
	}
	opencodeSet := map[string]string{}
	for _, p := range opencodeFiles {
		opencodeSet[basenameSansExt(p)] = p
	}

	var violations []Violation
	for name, path := range claudeSet {
		if _, ok := opencodeSet[name]; !ok {
			violations = append(violations, Violation{
				Path: path,
				Kind: "mirror-drift",
				Message: fmt.Sprintf(
					"%s exists in .claude/agents/ but not in .opencode/agents/",
					name+".md",
				),
			})
		}
	}
	for name, path := range opencodeSet {
		if _, ok := claudeSet[name]; !ok {
			violations = append(violations, Violation{
				Path: path,
				Kind: "mirror-drift",
				Message: fmt.Sprintf(
					"%s exists in .opencode/agents/ but not in .claude/agents/",
					name+".md",
				),
			})
		}
	}
	sort.Slice(violations, func(i, j int) bool {
		return violations[i].Path < violations[j].Path
	})
	return violations
}
