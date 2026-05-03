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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/bcregistry"
)

var specsDirUnitBcValidate = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type bcValidateUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *bcValidateUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	bcSeverity = ""
	s.cmdErr = nil
	s.cmdOutput = ""
	_ = os.Unsetenv("ORGANICLEVER_RHINO_DDD_SEVERITY")

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return nil, nil
	}
	return context.Background(), nil
}

func (s *bcValidateUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	bcValidateAllFn = bcregistry.ValidateAll
	osGetwd = os.Getwd
	osStat = os.Stat
	_ = os.Unsetenv("ORGANICLEVER_RHINO_DDD_SEVERITY")
	return context.Background(), nil
}

func (s *bcValidateUnitSteps) registryWithOneContextClean() error {
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return nil, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) glossaryFileExistsAtPath() error { return nil }

func (s *bcValidateUnitSteps) gherkinFolderExistsWithFeatureFile() error { return nil }

func (s *bcValidateUnitSteps) codeFolderContainsDeclaredLayers() error { return nil }

func (s *bcValidateUnitSteps) registryNotListingPhantom() error {
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "apps/organiclever-web/src/contexts/phantom",
			Message:  `orphan code directory "phantom" not registered in bounded-contexts.yaml`,
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) phantomFolderExists() error { return nil }

func (s *bcValidateUnitSteps) registryWithMissingGlossary() error {
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "specs/apps/organiclever/ubiquitous-language/journal.md",
			Message:  `missing glossary for context "journal"`,
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) glossaryFileDoesNotExist() error { return nil }

func (s *bcValidateUnitSteps) registryWithMissingLayer() error {
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "apps/organiclever-web/src/contexts/journal/infrastructure",
			Message:  `missing layer "infrastructure" for context "journal"`,
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) codeFolderMissingInfrastructure() error { return nil }

func (s *bcValidateUnitSteps) registryWithExtraLayer() error {
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "apps/organiclever-web/src/contexts/journal/infrastructure",
			Message:  `extra layer "infrastructure" found on filesystem but not declared in registry for context "journal"`,
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) codeFolderHasExtraInfrastructure() error { return nil }

func (s *bcValidateUnitSteps) registryWithMissingGherkin() error {
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "specs/apps/organiclever/fe/gherkin/journal",
			Message:  `missing gherkin directory for context "journal"`,
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) gherkinFolderDoesNotExist() error { return nil }

func (s *bcValidateUnitSteps) registryWithEmptyGherkin() error {
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "specs/apps/organiclever/fe/gherkin/journal",
			Message:  `no feature files found in gherkin directory for context "journal"`,
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) gherkinFolderExistsButEmpty() error {
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "specs/apps/organiclever/fe/gherkin/journal",
			Message:  `no feature files found in gherkin directory for context "journal"`,
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) registryWithRelationshipAsymmetry() error {
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "specs/apps/organiclever/bounded-contexts.yaml",
			Message:  `relationship asymmetry: "workout-session" → "journal" (customer-supplier) but "journal" has no reciprocal entry`,
			Severity: "error",
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) journalNoReciprocal() error { return nil }

func (s *bcValidateUnitSteps) registryWithOrphanAndWarnFlag() error {
	bcValidateAllFn = func(opts bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "apps/organiclever-web/src/contexts/phantom",
			Message:  `orphan code directory "phantom" not registered in bounded-contexts.yaml`,
			Severity: opts.Severity,
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) runWithWarnFlag() error {
	buf := new(bytes.Buffer)
	bcValidateCmd.SetOut(buf)
	bcValidateCmd.SetErr(buf)
	bcSeverity = "warn"
	s.cmdErr = bcValidateCmd.RunE(bcValidateCmd, []string{"organiclever"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *bcValidateUnitSteps) registryWithOrphanEnvWarn() error {
	bcValidateAllFn = func(opts bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return []bcregistry.Finding{{
			File:     "apps/organiclever-web/src/contexts/phantom",
			Message:  `orphan code directory "phantom" not registered in bounded-contexts.yaml`,
			Severity: opts.Severity,
		}}, nil
	}
	return nil
}

func (s *bcValidateUnitSteps) envVarWarnSet() error {
	t := os.Setenv("ORGANICLEVER_RHINO_DDD_SEVERITY", "warn")
	return t
}

func (s *bcValidateUnitSteps) run() error {
	buf := new(bytes.Buffer)
	bcValidateCmd.SetOut(buf)
	bcValidateCmd.SetErr(buf)
	s.cmdErr = bcValidateCmd.RunE(bcValidateCmd, []string{"organiclever"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *bcValidateUnitSteps) runWithEnvWarn() error {
	defer os.Unsetenv("ORGANICLEVER_RHINO_DDD_SEVERITY") //nolint:errcheck
	buf := new(bytes.Buffer)
	bcValidateCmd.SetOut(buf)
	bcValidateCmd.SetErr(buf)
	s.cmdErr = bcValidateCmd.RunE(bcValidateCmd, []string{"organiclever"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *bcValidateUnitSteps) runUnknownApp() error {
	buf := new(bytes.Buffer)
	bcValidateCmd.SetOut(buf)
	bcValidateCmd.SetErr(buf)
	bcValidateAllFn = func(_ bcregistry.ValidateOptions) ([]bcregistry.Finding, error) {
		return nil, fmt.Errorf("registry not found for app %q", "unknownapp")
	}
	s.cmdErr = bcValidateCmd.RunE(bcValidateCmd, []string{"unknownapp"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *bcValidateUnitSteps) exitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) exitsWithFailure() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) noFindingsInOutput() error {
	lc := strings.ToLower(s.cmdOutput)
	if strings.Contains(lc, "error:") || strings.Contains(lc, "warning:") {
		return fmt.Errorf("expected no findings but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsOrphan() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "orphan") {
		return fmt.Errorf("expected 'orphan' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsPhantom() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "phantom") {
		return fmt.Errorf("expected 'phantom' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsMissingGlossary() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "missing glossary") {
		return fmt.Errorf("expected 'missing glossary' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsJournal() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "journal") {
		return fmt.Errorf("expected 'journal' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsMissingLayer() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "missing layer") {
		return fmt.Errorf("expected 'missing layer' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsInfrastructure() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "infrastructure") {
		return fmt.Errorf("expected 'infrastructure' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsExtraLayer() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "extra layer") {
		return fmt.Errorf("expected 'extra layer' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsMissingGherkin() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "missing gherkin") {
		return fmt.Errorf("expected 'missing gherkin' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsNoFeatureFiles() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "no feature files") {
		return fmt.Errorf("expected 'no feature files' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsAsymmetry() error {
	if !strings.Contains(strings.ToLower(s.cmdOutput), "asymmetry") {
		return fmt.Errorf("expected 'asymmetry' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputContainsWarning() error {
	lc := strings.ToLower(s.cmdOutput)
	if !strings.Contains(lc, "warning") && !strings.Contains(lc, "warn") {
		return fmt.Errorf("expected 'warning' in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *bcValidateUnitSteps) outputMentionsNotFoundOrApp() error {
	lc := strings.ToLower(s.cmdOutput + s.cmdErr.Error())
	if !strings.Contains(lc, "not found") && !strings.Contains(lc, "unknownapp") {
		return fmt.Errorf("expected 'not found' or 'unknownapp' in output but got: %s / err: %v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func TestUnitBcValidate(t *testing.T) {
	s := &bcValidateUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepBcRegistryOneContextClean, s.registryWithOneContextClean)
			sc.Step(stepBcGlossaryFileExistsAtPath, s.glossaryFileExistsAtPath)
			sc.Step(stepBcGherkinFolderWithFeatureFile, s.gherkinFolderExistsWithFeatureFile)
			sc.Step(stepBcCodeFolderContainsDeclaredLayers, s.codeFolderContainsDeclaredLayers)
			sc.Step(stepBcRegistryNotListingPhantom, s.registryNotListingPhantom)
			sc.Step(stepBcPhantomFolderExists, s.phantomFolderExists)
			sc.Step(stepBcRegistryWithMissingGlossary, s.registryWithMissingGlossary)
			sc.Step(stepBcGlossaryFileDoesNotExist, s.glossaryFileDoesNotExist)
			sc.Step(stepBcRegistryWithMissingLayer, s.registryWithMissingLayer)
			sc.Step(stepBcCodeFolderMissingInfrastructure, s.codeFolderMissingInfrastructure)
			sc.Step(stepBcRegistryWithExtraLayer, s.registryWithExtraLayer)
			sc.Step(stepBcCodeFolderHasExtraInfrastructure, s.codeFolderHasExtraInfrastructure)
			sc.Step(stepBcRegistryWithMissingGherkin, s.registryWithMissingGherkin)
			sc.Step(stepBcGherkinFolderDoesNotExist, s.gherkinFolderDoesNotExist)
			sc.Step(stepBcRegistryWithEmptyGherkin, s.registryWithEmptyGherkin)
			sc.Step(stepBcGherkinFolderExistsButEmpty, s.gherkinFolderExistsButEmpty)
			sc.Step(stepBcRegistryWithRelationshipAsymmetry, s.registryWithRelationshipAsymmetry)
			sc.Step(stepBcJournalNoReciprocal, s.journalNoReciprocal)
			sc.Step(stepBcRegistryWithOrphanAndWarnFlag, s.registryWithOrphanAndWarnFlag)
			sc.Step(stepBcRegistryWithOrphanEnvWarn, s.registryWithOrphanEnvWarn)
			sc.Step(stepBcEnvVarWarnSet, s.envVarWarnSet)
			sc.Step(stepBcRunValidateOrganiclever, s.run)
			sc.Step(stepBcRunWithWarnFlag, s.runWithWarnFlag)
			sc.Step(stepBcRunWithEnvWarn, s.runWithEnvWarn)
			sc.Step(stepBcRunUnknownApp, s.runUnknownApp)
			sc.Step(stepExitsSuccessfully, s.exitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.exitsWithFailure)
			sc.Step(stepBcNoFindingsInOutput, s.noFindingsInOutput)
			sc.Step(stepBcOutputMentionsOrphan, s.outputMentionsOrphan)
			sc.Step(stepBcOutputMentionsPhantom, s.outputMentionsPhantom)
			sc.Step(stepBcOutputMentionsMissingGlossary, s.outputMentionsMissingGlossary)
			sc.Step(stepBcOutputMentionsJournal, s.outputMentionsJournal)
			sc.Step(stepBcOutputMentionsMissingLayer, s.outputMentionsMissingLayer)
			sc.Step(stepBcOutputMentionsInfrastructure, s.outputMentionsInfrastructure)
			sc.Step(stepBcOutputMentionsExtraLayer, s.outputMentionsExtraLayer)
			sc.Step(stepBcOutputMentionsMissingGherkin, s.outputMentionsMissingGherkin)
			sc.Step(stepBcOutputMentionsNoFeatureFiles, s.outputMentionsNoFeatureFiles)
			sc.Step(stepBcOutputMentionsAsymmetry, s.outputMentionsAsymmetry)
			sc.Step(stepBcOutputContainsWarning, s.outputContainsWarning)
			sc.Step(stepBcOutputMentionsNotFoundOrApp, s.outputMentionsNotFoundOrApp)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitBcValidate},
			TestingT: t,
			Tags:     "bc-validate",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

func TestBcValidateCmd_MissingGitRoot(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/no-git-here", nil }
	osStat = func(_ string) (os.FileInfo, error) { return nil, os.ErrNotExist }

	buf := new(bytes.Buffer)
	bcValidateCmd.SetOut(buf)
	bcValidateCmd.SetErr(buf)

	err := bcValidateCmd.RunE(bcValidateCmd, []string{"organiclever"})
	if err == nil || !strings.Contains(err.Error(), "git") {
		t.Fatalf("expected git-root error, got: %v", err)
	}
}
