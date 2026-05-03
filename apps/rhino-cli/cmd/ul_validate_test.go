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

var specsDirUlValidate = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type ulValidateSteps struct {
	savedFn   func(glossary.ValidateOptions) ([]glossary.Finding, error)
	cmdErr    error
	cmdOutput string
}

func (s *ulValidateSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.savedFn = ulValidateAllFn
	ulValidateAllFn = func(_ glossary.ValidateOptions) ([]glossary.Finding, error) {
		return nil, nil
	}
	ulSeverity = ""
	verbose = false
	quiet = false
	output = "text"
	_ = os.Unsetenv("ORGANICLEVER_RHINO_DDD_SEVERITY")
	return context.Background(), nil
}

func (s *ulValidateSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	ulValidateAllFn = s.savedFn
	_ = os.Unsetenv("ORGANICLEVER_RHINO_DDD_SEVERITY")
	return context.Background(), nil
}

// Setup helpers — override the injectable function to return preset findings.

func (s *ulValidateSteps) cleanGlossaries() error {
	ulValidateAllFn = func(_ glossary.ValidateOptions) ([]glossary.Finding, error) {
		return nil, nil
	}
	return nil
}

func (s *ulValidateSteps) allGlossaryFrontmatterOK() error  { return nil }
func (s *ulValidateSteps) allTermsTablesWellFormed() error  { return nil }
func (s *ulValidateSteps) allCodeIdentifiersResolve() error { return nil }
func (s *ulValidateSteps) allFeatureRefsResolve() error     { return nil }

func (s *ulValidateSteps) missingMaintainerKey() error {
	ulValidateAllFn = func(_ glossary.ValidateOptions) ([]glossary.Finding, error) {
		return []glossary.Finding{{
			File:     "specs/apps/organiclever/ubiquitous-language/journal.md",
			Message:  "missing frontmatter key: Maintainer",
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *ulValidateSteps) malformedTableHeader() error {
	ulValidateAllFn = func(_ glossary.ValidateOptions) ([]glossary.Finding, error) {
		return []glossary.Finding{{
			File:     "specs/apps/organiclever/ubiquitous-language/journal.md",
			Message:  "malformed terms table header",
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *ulValidateSteps) staleCodeIdentifier() error {
	ulValidateAllFn = func(opts glossary.ValidateOptions) ([]glossary.Finding, error) {
		return []glossary.Finding{{
			File:     "specs/apps/organiclever/ubiquitous-language/journal.md",
			Message:  "stale identifier: `GhostType`",
			Severity: opts.Severity,
		}}, nil
	}
	return nil
}

func (s *ulValidateSteps) missingFeatureReference() error {
	ulValidateAllFn = func(_ glossary.ValidateOptions) ([]glossary.Finding, error) {
		return []glossary.Finding{{
			File:     "specs/apps/organiclever/ubiquitous-language/journal.md",
			Message:  "missing feature reference: journal/ghost.feature",
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *ulValidateSteps) termCollision() error {
	ulValidateAllFn = func(_ glossary.ValidateOptions) ([]glossary.Finding, error) {
		return []glossary.Finding{{
			File:     "specs/apps/organiclever/bounded-contexts.yaml",
			Message:  `term collision: "Entry" defined in [journal, routine] without mutual Forbidden-synonyms cross-link`,
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *ulValidateSteps) run() error {
	buf := new(bytes.Buffer)
	ulValidateCmd.SetOut(buf)
	ulValidateCmd.SetErr(buf)
	s.cmdErr = ulValidateCmd.RunE(ulValidateCmd, []string{"organiclever"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *ulValidateSteps) runWithWarnFlag() error {
	buf := new(bytes.Buffer)
	ulValidateCmd.SetOut(buf)
	ulValidateCmd.SetErr(buf)
	ulSeverity = "warn"
	s.cmdErr = ulValidateCmd.RunE(ulValidateCmd, []string{"organiclever"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *ulValidateSteps) exitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *ulValidateSteps) exitsWithFailure() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateSteps) noFindings() error {
	lc := strings.ToLower(s.cmdOutput)
	if strings.Contains(lc, "error:") || strings.Contains(lc, "warning:") {
		return fmt.Errorf("expected no findings but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateSteps) mentionsMissingFrontmatterKey() error {
	if !strings.Contains(s.cmdOutput, "missing frontmatter key") {
		return fmt.Errorf("expected 'missing frontmatter key' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateSteps) mentionsMalformedTableHeader() error {
	if !strings.Contains(s.cmdOutput, "malformed terms table header") {
		return fmt.Errorf("expected 'malformed terms table header' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateSteps) mentionsStaleIdentifier() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "stale identifier") {
		return fmt.Errorf("expected 'stale identifier' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateSteps) mentionsMissingFeatureReference() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "missing feature reference") {
		return fmt.Errorf("expected 'missing feature reference' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateSteps) mentionsTermCollision() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "term collision") {
		return fmt.Errorf("expected 'term collision' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *ulValidateSteps) outputContainsWarning() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "warning") && !strings.Contains(lc, "warn") {
		return fmt.Errorf("expected 'warning' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func TestUlValidateCmd(t *testing.T) {
	st := &ulValidateSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(st.before)
			sc.After(st.after)
			sc.Step(stepUlValidRegistryCleanGlossaries, st.cleanGlossaries)
			sc.Step(stepUlEveryGlossaryCorrectFrontmatter, st.allGlossaryFrontmatterOK)
			sc.Step(stepUlEveryTermsTableWellFormed, st.allTermsTablesWellFormed)
			sc.Step(stepUlEveryCodeIdentifierResolves, st.allCodeIdentifiersResolve)
			sc.Step(stepUlEveryFeatureRefResolves, st.allFeatureRefsResolve)
			sc.Step(stepUlMissingFrontmatterKey, st.missingMaintainerKey)
			sc.Step(stepUlMalformedTableHeader, st.malformedTableHeader)
			sc.Step(stepUlStaleCodeIdentifier, st.staleCodeIdentifier)
			sc.Step(stepUlMissingFeatureReference, st.missingFeatureReference)
			sc.Step(stepUlTermCollision, st.termCollision)
			sc.Step(stepUlRunValidateOrganiclever, st.run)
			sc.Step(stepUlRunValidateOrganicleverWithWarnFlag, st.runWithWarnFlag)
			sc.Step(stepExitsSuccessfully, st.exitsSuccessfully)
			sc.Step(stepExitsWithFailure, st.exitsWithFailure)
			sc.Step(stepBcNoFindingsInOutput, st.noFindings)
			sc.Step(stepUlOutputMentionsMissingFrontmatterKey, st.mentionsMissingFrontmatterKey)
			sc.Step(stepUlOutputMentionsMalformedTableHeader, st.mentionsMalformedTableHeader)
			sc.Step(stepUlOutputMentionsStaleIdentifier, st.mentionsStaleIdentifier)
			sc.Step(stepUlOutputMentionsMissingFeatureReference, st.mentionsMissingFeatureReference)
			sc.Step(stepUlOutputMentionsTermCollision, st.mentionsTermCollision)
			sc.Step(stepBcOutputContainsWarning, st.outputContainsWarning)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUlValidate},
			TestingT: t,
			Tags:     "ul-validate",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run ul validate feature tests")
	}
}
