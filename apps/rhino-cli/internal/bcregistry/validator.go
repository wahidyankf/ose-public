package bcregistry

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// osStatFn and osReadDirFn are injectable for unit tests.
var (
	osStatFn    = os.Stat
	osReadDirFn = os.ReadDir
)

// ValidateAll loads the registry and performs all structural parity checks.
func ValidateAll(opts ValidateOptions) ([]Finding, error) {
	sev := opts.Severity
	if sev == "" {
		sev = "error"
	}

	reg, err := Load(opts.RepoRoot, opts.App)
	if err != nil {
		return nil, err
	}
	return validate(opts.RepoRoot, reg, sev), nil
}

func validate(repoRoot string, reg *Registry, severity string) []Finding {
	var findings []Finding

	registeredCode := make(map[string]bool)
	registeredGlossary := make(map[string]bool)
	registeredGherkin := make(map[string]bool)
	contextByName := make(map[string]*Context)

	for i := range reg.Contexts {
		ctx := &reg.Contexts[i]
		contextByName[ctx.Name] = ctx
		registeredCode[filepath.Join(repoRoot, ctx.Code)] = true
		registeredGlossary[filepath.Join(repoRoot, ctx.Glossary)] = true
		registeredGherkin[filepath.Join(repoRoot, ctx.Gherkin)] = true
	}

	// Check each registered context.
	for _, ctx := range reg.Contexts {
		findings = append(findings, checkContext(repoRoot, ctx, severity)...)
	}

	// Detect orphans (only when contexts exist to infer roots).
	if len(reg.Contexts) > 0 {
		findings = append(findings, detectOrphans(repoRoot, reg, registeredCode, registeredGlossary, registeredGherkin, severity)...)
	}

	// Check relationship symmetry.
	findings = append(findings, checkRelationshipSymmetry(reg, contextByName, severity)...)

	sort.SliceStable(findings, func(i, j int) bool {
		return findings[i].File < findings[j].File
	})
	return findings
}

func checkContext(repoRoot string, ctx Context, severity string) []Finding {
	var findings []Finding
	codePath := filepath.Join(repoRoot, ctx.Code)

	// Code directory must exist.
	if _, err := osStatFn(codePath); err != nil {
		findings = append(findings, Finding{
			File:     ctx.Code,
			Message:  fmt.Sprintf("missing code directory for context %q", ctx.Name),
			Severity: severity,
		})
		return findings // can't check layers if dir missing
	}

	// Layers must match exactly.
	findings = append(findings, checkLayers(repoRoot, ctx, severity)...)

	// Glossary file must exist.
	glossaryPath := filepath.Join(repoRoot, ctx.Glossary)
	if _, err := osStatFn(glossaryPath); err != nil {
		findings = append(findings, Finding{
			File:     ctx.Glossary,
			Message:  fmt.Sprintf("missing glossary for context %q", ctx.Name),
			Severity: severity,
		})
	}

	// Gherkin directory must exist with ≥1 .feature file.
	findings = append(findings, checkGherkin(repoRoot, ctx, severity)...)

	return findings
}

func checkLayers(repoRoot string, ctx Context, severity string) []Finding {
	var findings []Finding
	codePath := filepath.Join(repoRoot, ctx.Code)

	// Read actual layer subdirs on filesystem.
	entries, err := osReadDirFn(codePath)
	if err != nil {
		return []Finding{{
			File:     ctx.Code,
			Message:  fmt.Sprintf("cannot read code directory for context %q: %v", ctx.Name, err),
			Severity: severity,
		}}
	}

	actual := map[string]bool{}
	for _, e := range entries {
		if e.IsDir() {
			actual[e.Name()] = true
		}
	}

	declared := map[string]bool{}
	for _, l := range ctx.Layers {
		declared[l] = true
	}

	// Missing layers.
	for _, l := range ctx.Layers {
		if !actual[l] {
			findings = append(findings, Finding{
				File:     filepath.Join(ctx.Code, l),
				Message:  fmt.Sprintf("missing layer %q for context %q", l, ctx.Name),
				Severity: severity,
			})
		}
	}

	// Extra layers.
	for name := range actual {
		if !declared[name] {
			findings = append(findings, Finding{
				File:     filepath.Join(ctx.Code, name),
				Message:  fmt.Sprintf("extra layer %q found on filesystem but not declared in registry for context %q", name, ctx.Name),
				Severity: severity,
			})
		}
	}

	return findings
}

func checkGherkin(repoRoot string, ctx Context, severity string) []Finding {
	gherkinPath := filepath.Join(repoRoot, ctx.Gherkin)
	if _, err := osStatFn(gherkinPath); err != nil {
		return []Finding{{
			File:     ctx.Gherkin,
			Message:  fmt.Sprintf("missing gherkin directory for context %q", ctx.Name),
			Severity: severity,
		}}
	}

	entries, err := osReadDirFn(gherkinPath)
	if err != nil {
		return []Finding{{
			File:     ctx.Gherkin,
			Message:  fmt.Sprintf("cannot read gherkin directory for context %q: %v", ctx.Name, err),
			Severity: severity,
		}}
	}

	hasFeature := false
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".feature") {
			hasFeature = true
			break
		}
	}
	if !hasFeature {
		return []Finding{{
			File:     ctx.Gherkin,
			Message:  fmt.Sprintf("no feature files found in gherkin directory for context %q", ctx.Name),
			Severity: severity,
		}}
	}
	return nil
}

func detectOrphans(repoRoot string, reg *Registry, registeredCode, registeredGlossary, registeredGherkin map[string]bool, severity string) []Finding {
	var findings []Finding

	// Code root = parent of first context's code path.
	codeRoot := filepath.Join(repoRoot, filepath.Dir(reg.Contexts[0].Code))
	findings = append(findings, detectOrphanDirs(codeRoot, registeredCode, "orphan code directory", "registered in bounded-contexts.yaml", severity)...)

	// Glossary root = parent of first context's glossary path.
	glossaryRoot := filepath.Join(repoRoot, filepath.Dir(reg.Contexts[0].Glossary))
	findings = append(findings, detectOrphanFiles(glossaryRoot, registeredGlossary, "orphan glossary file", "registered in bounded-contexts.yaml", severity)...)

	// Gherkin root = parent of first context's gherkin path.
	gherkinRoot := filepath.Join(repoRoot, filepath.Dir(reg.Contexts[0].Gherkin))
	findings = append(findings, detectOrphanDirs(gherkinRoot, registeredGherkin, "orphan gherkin directory", "registered in bounded-contexts.yaml", severity)...)

	return findings
}

func detectOrphanDirs(root string, registered map[string]bool, kind, notReason, severity string) []Finding {
	entries, err := osReadDirFn(root)
	if err != nil {
		return nil
	}
	var findings []Finding
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		fullPath := filepath.Join(root, e.Name())
		if !registered[fullPath] {
			findings = append(findings, Finding{
				File:     fullPath,
				Message:  fmt.Sprintf(`%s %q not %s`, kind, e.Name(), notReason),
				Severity: severity,
			})
		}
	}
	return findings
}

func detectOrphanFiles(root string, registered map[string]bool, kind, notReason, severity string) []Finding {
	entries, err := osReadDirFn(root)
	if err != nil {
		return nil
	}
	var findings []Finding
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		if e.Name() == "README.md" {
			continue
		}
		fullPath := filepath.Join(root, e.Name())
		if !registered[fullPath] {
			findings = append(findings, Finding{
				File:     fullPath,
				Message:  fmt.Sprintf(`%s %q not %s`, kind, e.Name(), notReason),
				Severity: severity,
			})
		}
	}
	return findings
}

func checkRelationshipSymmetry(reg *Registry, contextByName map[string]*Context, severity string) []Finding {
	var findings []Finding

	// asymmetricKinds require a reciprocal entry.
	asymmetricKinds := map[string]bool{
		"customer-supplier": true,
		"conformist":        true,
	}

	for _, ctx := range reg.Contexts {
		for _, rel := range ctx.Relationships {
			if !asymmetricKinds[rel.Kind] {
				continue
			}
			target, ok := contextByName[rel.To]
			if !ok {
				findings = append(findings, Finding{
					File:     "specs/apps/" + reg.App + "/bounded-contexts.yaml",
					Message:  fmt.Sprintf("relationship target %q declared by %q does not exist in registry", rel.To, ctx.Name),
					Severity: severity,
				})
				continue
			}
			if !hasReciprocal(target, ctx.Name, rel.Kind) {
				findings = append(findings, Finding{
					File:     "specs/apps/" + reg.App + "/bounded-contexts.yaml",
					Message:  fmt.Sprintf(`relationship asymmetry: %q → %q (%s) but %q has no reciprocal entry`, ctx.Name, rel.To, rel.Kind, rel.To),
					Severity: severity,
				})
			}
		}
	}
	return findings
}

func hasReciprocal(ctx *Context, sourceName, kind string) bool {
	for _, rel := range ctx.Relationships {
		if rel.To == sourceName && rel.Kind == kind {
			return true
		}
	}
	return false
}
