//go:build integration

package cmd

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/glossary"
)

var specsDirIntegUlValidate = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type ulValidateIntegSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *ulValidateIntegSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	var err error
	s.tmpDir, err = os.MkdirTemp("", "ul-validate-*")
	if err != nil {
		return nil, err
	}
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	ulSeverity = ""
	ulValidateAllFn = glossary.ValidateAll
	_ = os.Unsetenv("ORGANICLEVER_RHINO_DDD_SEVERITY")
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *ulValidateIntegSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	_ = os.Unsetenv("ORGANICLEVER_RHINO_DDD_SEVERITY")
	return context.Background(), nil
}

// writeMinimalRegistry writes a one-context bounded-contexts.yaml and the minimal artefact set.
func (s *ulValidateIntegSteps) writeMinimalRegistry(contextName string) error {
	registry := fmt.Sprintf(`version: 1
app: organiclever
contexts:
  - name: %s
    summary: test context
    layers:
      - domain
    code: apps/organiclever-web/src/contexts/%s
    glossary: specs/apps/organiclever/ubiquitous-language/%s.md
    gherkin: specs/apps/organiclever/fe/gherkin/%s
    relationships: []
`, contextName, contextName, contextName, contextName)

	regDir := filepath.Join(s.tmpDir, "specs", "apps", "organiclever")
	if err := os.MkdirAll(regDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(regDir, "bounded-contexts.yaml"), []byte(registry), 0644); err != nil {
		return err
	}

	// Create code dir.
	codeDir := filepath.Join(s.tmpDir, "apps", "organiclever-web", "src", "contexts", contextName, "domain")
	if err := os.MkdirAll(codeDir, 0755); err != nil {
		return err
	}
	// Write a TS file with a known identifier.
	if err := os.WriteFile(filepath.Join(codeDir, "types.ts"), []byte("export type KnownType = string;\n"), 0644); err != nil {
		return err
	}

	// Create gherkin dir with one feature file.
	gherkinDir := filepath.Join(s.tmpDir, "specs", "apps", "organiclever", "fe", "gherkin", contextName)
	if err := os.MkdirAll(gherkinDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(gherkinDir, contextName+".feature"), []byte(fmt.Sprintf("@%s\nFeature: %s\n\n  Scenario: smoke\n    Given smoke\n", contextName, contextName)), 0644); err != nil {
		return err
	}

	return nil
}

// writeGlossary writes a glossary file with the given content.
func (s *ulValidateIntegSteps) writeGlossary(contextName, content string) error {
	glossaryDir := filepath.Join(s.tmpDir, "specs", "apps", "organiclever", "ubiquitous-language")
	if err := os.MkdirAll(glossaryDir, 0755); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(glossaryDir, contextName+".md"), []byte(content), 0644)
}

func validGlossaryContent(contextName string) string {
	return fmt.Sprintf(`# Ubiquitous Language — %s

**Bounded context**: `+"`%s`"+`
**Maintainer**: test team
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| `+"`KnownType`"+` | A known type. | `+"`KnownType`"+` | %s/%s.feature |

## Forbidden synonyms

`, contextName, contextName, contextName, contextName)
}

func (s *ulValidateIntegSteps) cleanRegistry() error {
	if err := s.writeMinimalRegistry("journal"); err != nil {
		return err
	}
	return s.writeGlossary("journal", validGlossaryContent("journal"))
}

func (s *ulValidateIntegSteps) glossaryWithAllFrontmatterKeys() error { return nil }
func (s *ulValidateIntegSteps) allTermsTablesWellFormed() error       { return nil }
func (s *ulValidateIntegSteps) allCodeIdentifiersResolve() error      { return nil }
func (s *ulValidateIntegSteps) allFeatureRefsResolve() error          { return nil }

func (s *ulValidateIntegSteps) missingMaintainerKey() error {
	if err := s.writeMinimalRegistry("journal"); err != nil {
		return err
	}
	content := `# Ubiquitous Language — journal

**Bounded context**: ` + "`journal`" + `
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
`
	return s.writeGlossary("journal", content)
}

func (s *ulValidateIntegSteps) malformedTableHeader() error {
	if err := s.writeMinimalRegistry("journal"); err != nil {
		return err
	}
	content := `# Ubiquitous Language — journal

**Bounded context**: ` + "`journal`" + `
**Maintainer**: test
**Last reviewed**: 2026-01-01

## Terms

| Term | Description | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
`
	return s.writeGlossary("journal", content)
}

func (s *ulValidateIntegSteps) staleCodeIdentifier() error {
	if err := s.writeMinimalRegistry("journal"); err != nil {
		return err
	}
	content := `# Ubiquitous Language — journal

**Bounded context**: ` + "`journal`" + `
**Maintainer**: test
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| ` + "`GhostType`" + ` | Does not exist. | ` + "`GhostType`" + ` | journal/journal.feature |

## Forbidden synonyms

`
	return s.writeGlossary("journal", content)
}

func (s *ulValidateIntegSteps) termCollisionSetup() error {
	// Write a two-context registry where both share a term "Entry" without Forbidden synonyms cross-link.
	registry := `version: 1
app: organiclever
contexts:
  - name: journal
    summary: test journal
    layers: [domain]
    code: apps/organiclever-web/src/contexts/journal
    glossary: specs/apps/organiclever/ubiquitous-language/journal.md
    gherkin: specs/apps/organiclever/fe/gherkin/journal
    relationships: []
  - name: routine
    summary: test routine
    layers: [domain]
    code: apps/organiclever-web/src/contexts/routine
    glossary: specs/apps/organiclever/ubiquitous-language/routine.md
    gherkin: specs/apps/organiclever/fe/gherkin/routine
    relationships: []
`
	regDir := filepath.Join(s.tmpDir, "specs", "apps", "organiclever")
	if err := os.MkdirAll(regDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(regDir, "bounded-contexts.yaml"), []byte(registry), 0644); err != nil {
		return err
	}

	for _, ctx := range []string{"journal", "routine"} {
		codeDir := filepath.Join(s.tmpDir, "apps", "organiclever-web", "src", "contexts", ctx, "domain")
		if err := os.MkdirAll(codeDir, 0755); err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(codeDir, "types.ts"), []byte("export type EntryType = string;\n"), 0644); err != nil {
			return err
		}
		gherkinDir := filepath.Join(s.tmpDir, "specs", "apps", "organiclever", "fe", "gherkin", ctx)
		if err := os.MkdirAll(gherkinDir, 0755); err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(gherkinDir, ctx+".feature"), []byte(fmt.Sprintf("@%s\nFeature: %s\n\n  Scenario: smoke\n    Given smoke\n", ctx, ctx)), 0644); err != nil {
			return err
		}
		// Both glossaries define the same term "Entry" without Forbidden synonyms cross-link.
		glossaryDir := filepath.Join(s.tmpDir, "specs", "apps", "organiclever", "ubiquitous-language")
		if err := os.MkdirAll(glossaryDir, 0755); err != nil {
			return err
		}
		content := fmt.Sprintf(`# Ubiquitous Language — %s

**Bounded context**: `+"`%s`"+`
**Maintainer**: test
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| Entry | A record. | `+"`EntryType`"+` | %s/%s.feature |

## Forbidden synonyms

`, ctx, ctx, ctx, ctx)
		if err := os.WriteFile(filepath.Join(glossaryDir, ctx+".md"), []byte(content), 0644); err != nil {
			return err
		}
	}
	return nil
}

func (s *ulValidateIntegSteps) mentionsTermCollision() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "term collision") {
		return fmt.Errorf("expected 'term collision' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateIntegSteps) missingFeatureReference() error {
	if err := s.writeMinimalRegistry("journal"); err != nil {
		return err
	}
	content := `# Ubiquitous Language — journal

**Bounded context**: ` + "`journal`" + `
**Maintainer**: test
**Last reviewed**: 2026-01-01

## Terms

| Term | Definition | Code identifier(s) | Used in features |
| --- | --- | --- | --- |
| ` + "`KnownType`" + ` | A known type. | ` + "`KnownType`" + ` | journal/nonexistent.feature |

## Forbidden synonyms

`
	return s.writeGlossary("journal", content)
}

func (s *ulValidateIntegSteps) run() error {
	buf := new(bytes.Buffer)
	ulValidateCmd.SetOut(buf)
	ulValidateCmd.SetErr(buf)
	s.cmdErr = ulValidateCmd.RunE(ulValidateCmd, []string{"organiclever"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *ulValidateIntegSteps) runWithWarnFlag() error {
	buf := new(bytes.Buffer)
	ulValidateCmd.SetOut(buf)
	ulValidateCmd.SetErr(buf)
	ulSeverity = "warn"
	s.cmdErr = ulValidateCmd.RunE(ulValidateCmd, []string{"organiclever"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *ulValidateIntegSteps) exitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *ulValidateIntegSteps) exitsWithFailure() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateIntegSteps) noFindings() error {
	lc := strings.ToLower(s.cmdOutput)
	if strings.Contains(lc, "error:") || strings.Contains(lc, "warning:") {
		return fmt.Errorf("expected no findings but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateIntegSteps) mentionsMissingFrontmatterKey() error {
	if !strings.Contains(s.cmdOutput, "missing frontmatter key") {
		return fmt.Errorf("expected 'missing frontmatter key' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateIntegSteps) mentionsMalformedTableHeader() error {
	if !strings.Contains(s.cmdOutput, "malformed terms table header") {
		return fmt.Errorf("expected 'malformed terms table header' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateIntegSteps) mentionsStaleIdentifier() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "stale identifier") {
		return fmt.Errorf("expected 'stale identifier' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateIntegSteps) mentionsMissingFeatureReference() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "missing feature reference") {
		return fmt.Errorf("expected 'missing feature reference' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateIntegSteps) outputContainsWarning() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "warning") && !strings.Contains(lc, "warn") {
		return fmt.Errorf("expected 'warning' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func TestIntegrationUlValidate(t *testing.T) {
	s := &ulValidateIntegSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepUlValidRegistryCleanGlossaries, s.cleanRegistry)
			sc.Step(stepUlEveryGlossaryCorrectFrontmatter, s.glossaryWithAllFrontmatterKeys)
			sc.Step(stepUlEveryTermsTableWellFormed, s.allTermsTablesWellFormed)
			sc.Step(stepUlEveryCodeIdentifierResolves, s.allCodeIdentifiersResolve)
			sc.Step(stepUlEveryFeatureRefResolves, s.allFeatureRefsResolve)
			sc.Step(stepUlMissingFrontmatterKey, s.missingMaintainerKey)
			sc.Step(stepUlMalformedTableHeader, s.malformedTableHeader)
			sc.Step(stepUlStaleCodeIdentifier, s.staleCodeIdentifier)
			sc.Step(stepUlMissingFeatureReference, s.missingFeatureReference)
			sc.Step(stepUlTermCollision, s.termCollisionSetup)
			sc.Step(stepUlOutputMentionsTermCollision, s.mentionsTermCollision)
			sc.Step(stepUlRunValidateOrganiclever, s.run)
			sc.Step(stepUlRunValidateOrganicleverWithWarnFlag, s.runWithWarnFlag)
			sc.Step(stepExitsSuccessfully, s.exitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.exitsWithFailure)
			sc.Step(stepBcNoFindingsInOutput, s.noFindings)
			sc.Step(stepUlOutputMentionsMissingFrontmatterKey, s.mentionsMissingFrontmatterKey)
			sc.Step(stepUlOutputMentionsMalformedTableHeader, s.mentionsMalformedTableHeader)
			sc.Step(stepUlOutputMentionsStaleIdentifier, s.mentionsStaleIdentifier)
			sc.Step(stepUlOutputMentionsMissingFeatureReference, s.mentionsMissingFeatureReference)
			sc.Step(stepBcOutputContainsWarning, s.outputContainsWarning)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirIntegUlValidate},
			TestingT: t,
			Tags:     "ul-validate",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run integration ul validate feature tests")
	}
}
