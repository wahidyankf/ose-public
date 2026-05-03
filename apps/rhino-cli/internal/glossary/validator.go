package glossary

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/bcregistry"
)

// osStatFn is injectable for unit tests.
var osStatFn = os.Stat

// loadRegistryFn is injectable for unit tests.
var loadRegistryFn = bcregistry.Load

// grepFn searches for a pattern in all files matching ext under root.
// Returns the count of matching lines. Injectable for tests.
var grepFn = grepFiles

// ValidateAll loads the registry and validates all glossary files.
func ValidateAll(opts ValidateOptions) ([]Finding, error) {
	sev := opts.Severity
	if sev == "" {
		sev = "error"
	}

	reg, err := loadRegistryFn(opts.RepoRoot, opts.App)
	if err != nil {
		return nil, err
	}

	var findings []Finding
	glossaries := make(map[string]*Glossary) // contextName → parsed glossary

	for _, ctx := range reg.Contexts {
		glossaryPath := filepath.Join(opts.RepoRoot, ctx.Glossary)
		g := Parse(glossaryPath)
		glossaries[ctx.Name] = g

		// Parse errors.
		for _, pe := range g.ParseErrors {
			findings = append(findings, Finding{
				File:     ctx.Glossary,
				Message:  pe.Message,
				Severity: sev,
			})
		}

		// Frontmatter completeness.
		findings = append(findings, checkFrontmatter(ctx.Glossary, g, sev)...)

		// Table header.
		findings = append(findings, checkTableHeader(ctx.Glossary, g, sev)...)

		// Per-term checks.
		codePath := filepath.Join(opts.RepoRoot, ctx.Code)
		gherkinPath := filepath.Join(opts.RepoRoot, ctx.Gherkin)
		findings = append(findings, checkTerms(ctx.Glossary, g, codePath, gherkinPath, sev)...)

		// Forbidden synonym usage.
		findings = append(findings, checkForbiddenSynonyms(ctx.Glossary, g, codePath, gherkinPath, sev)...)
	}

	// Cross-context term collision.
	findings = append(findings, checkTermCollisions(reg, glossaries, sev)...)

	sort.SliceStable(findings, func(i, j int) bool {
		return findings[i].File < findings[j].File
	})
	return findings, nil
}

func checkFrontmatter(file string, g *Glossary, sev string) []Finding {
	var findings []Finding
	for _, key := range requiredFrontmatterKeys {
		if _, ok := g.Frontmatter[key]; !ok {
			findings = append(findings, Finding{
				File:     file,
				Message:  fmt.Sprintf("missing frontmatter key: %s", key),
				Severity: sev,
			})
		}
	}
	return findings
}

func checkTableHeader(file string, g *Glossary, sev string) []Finding {
	var findings []Finding
	for _, pe := range g.ParseErrors {
		if strings.Contains(pe.Message, "malformed terms table header") {
			findings = append(findings, Finding{
				File:     file,
				Message:  pe.Message,
				Severity: sev,
			})
		}
	}
	return findings
}

func checkTerms(file string, g *Glossary, codePath, gherkinPath, sev string) []Finding {
	var findings []Finding
	for _, term := range g.Terms {
		// Code identifier existence.
		for _, id := range term.CodeIdentifiers {
			count := grepFn(id, codePath, []string{"*.ts", "*.tsx"})
			if count == 0 {
				findings = append(findings, Finding{
					File:     file,
					Message:  fmt.Sprintf("stale identifier: `%s` (term %q, not found in %s)", id, term.Term, codePath),
					Severity: sev,
				})
			}
		}
		// Feature reference existence.
		for _, ref := range term.UsedInFeatures {
			featurePath := filepath.Join(gherkinPath, filepath.Base(ref))
			// ref may include a subdir like "journal/journal-mechanism.feature"
			if strings.Contains(ref, "/") {
				parts := strings.SplitN(ref, "/", 2)
				featurePath = filepath.Join(filepath.Dir(gherkinPath), parts[0], parts[1])
			}
			if strings.Contains(featurePath, "*") {
				// Glob pattern — at least one match required.
				matches, _ := filepath.Glob(featurePath)
				if len(matches) == 0 {
					findings = append(findings, Finding{
						File:     file,
						Message:  fmt.Sprintf("missing feature reference: %s", ref),
						Severity: sev,
					})
				}
			} else if _, err := osStatFn(featurePath); err != nil {
				findings = append(findings, Finding{
					File:     file,
					Message:  fmt.Sprintf("missing feature reference: %s", ref),
					Severity: sev,
				})
			}
		}
	}
	return findings
}

func checkForbiddenSynonyms(file string, g *Glossary, codePath, gherkinPath, sev string) []Finding {
	var findings []Finding
	for _, fb := range g.ForbiddenSynonyms {
		count := grepFn(fb.Term, codePath, []string{"*.ts", "*.tsx"})
		count += grepFn(fb.Term, gherkinPath, []string{"*.feature"})
		if count > 0 {
			findings = append(findings, Finding{
				File:     file,
				Message:  fmt.Sprintf("forbidden synonym used in own context: %q", fb.Term),
				Severity: sev,
			})
		}
	}
	return findings
}

func checkTermCollisions(reg *bcregistry.Registry, glossaries map[string]*Glossary, sev string) []Finding {
	// Build term → []contextName index.
	termContexts := map[string][]string{}
	for _, ctx := range reg.Contexts {
		g, ok := glossaries[ctx.Name]
		if !ok {
			continue
		}
		for _, t := range g.Terms {
			termContexts[t.Term] = append(termContexts[t.Term], ctx.Name)
		}
	}

	var findings []Finding
	for term, contexts := range termContexts {
		if len(contexts) < 2 {
			continue
		}
		// Check that every context with this term lists all other contexts in
		// its Forbidden synonyms.
		allCovered := true
		for _, ctxName := range contexts {
			g := glossaries[ctxName]
			others := make([]string, 0, len(contexts)-1)
			for _, c := range contexts {
				if c != ctxName {
					others = append(others, c)
				}
			}
			for _, other := range others {
				if !hasForbiddenFor(g, term, other) {
					allCovered = false
					break
				}
			}
			if !allCovered {
				break
			}
		}
		if !allCovered {
			findings = append(findings, Finding{
				File:     fmt.Sprintf("specs/apps/%s/bounded-contexts.yaml", reg.App),
				Message:  fmt.Sprintf(`term collision: %q defined in %v without mutual Forbidden-synonyms cross-link`, term, contexts),
				Severity: sev,
			})
		}
	}
	return findings
}

// hasForbiddenFor checks whether glossary g lists term in its ForbiddenSynonyms,
// implying the collision with another context is acknowledged.
func hasForbiddenFor(g *Glossary, term, _ string) bool {
	for _, fb := range g.ForbiddenSynonyms {
		if strings.EqualFold(fb.Term, term) {
			return true
		}
	}
	return false
}

// grepFiles counts lines matching pattern (whole word) across files matching
// any of the given glob extensions under root, recursively.
func grepFiles(pattern, root string, exts []string) int {
	count := 0
	re, err := regexp.Compile(`\b` + regexp.QuoteMeta(pattern) + `\b`)
	if err != nil {
		return 0
	}
	_ = filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		for _, ext := range exts {
			matched, _ := filepath.Match("*."+strings.TrimPrefix(ext, "*."), filepath.Base(path))
			if matched {
				count += grepFile(path, re)
				break
			}
		}
		return nil
	})
	return count
}

func grepFile(path string, re *regexp.Regexp) int {
	f, err := os.Open(path) //nolint:gosec
	if err != nil {
		return 0
	}
	defer f.Close()
	count := 0
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		if re.MatchString(scanner.Text()) {
			count++
		}
	}
	return count
}
