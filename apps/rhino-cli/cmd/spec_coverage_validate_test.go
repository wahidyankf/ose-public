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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/speccoverage"
)

var specsDirUnitSpecCoverageValidate = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type specCoverageValidateUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *specCoverageValidateUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	sharedSteps = false
	s.cmdErr = nil
	s.cmdOutput = ""

	// Mock findGitRoot via osGetwd/osStat
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	// Default mock: no gaps
	specCoverageCheckAllFn = func(_ speccoverage.ScanOptions) (*speccoverage.CheckResult, error) {
		return &speccoverage.CheckResult{
			TotalSpecs:     0,
			TotalScenarios: 0,
			TotalSteps:     0,
			Gaps:           nil,
			ScenarioGaps:   nil,
			StepGaps:       nil,
		}, nil
	}

	return context.Background(), nil
}

func (s *specCoverageValidateUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	specCoverageCheckAllFn = speccoverage.CheckAll
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *specCoverageValidateUnitSteps) aSpecsDirEveryFeatureFileHasTest() error {
	specCoverageCheckAllFn = func(_ speccoverage.ScanOptions) (*speccoverage.CheckResult, error) {
		return &speccoverage.CheckResult{
			TotalSpecs:     2,
			TotalScenarios: 4,
			TotalSteps:     8,
			Gaps:           nil,
			ScenarioGaps:   nil,
			StepGaps:       nil,
		}, nil
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) aSpecsDirContainsFeatureFileWithNoTest() error {
	specCoverageCheckAllFn = func(_ speccoverage.ScanOptions) (*speccoverage.CheckResult, error) {
		return &speccoverage.CheckResult{
			TotalSpecs:     1,
			TotalScenarios: 0,
			TotalSteps:     0,
			Gaps: []speccoverage.CoverageGap{
				{SpecFile: "specs/user-login.feature", Stem: "user-login"},
			},
			ScenarioGaps: nil,
			StepGaps:     nil,
		}, nil
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) aFeatureFileWithScenarioNotInAnyTestFile() error {
	specCoverageCheckAllFn = func(_ speccoverage.ScanOptions) (*speccoverage.CheckResult, error) {
		return &speccoverage.CheckResult{
			TotalSpecs:     1,
			TotalScenarios: 1,
			TotalSteps:     0,
			Gaps:           nil,
			ScenarioGaps: []speccoverage.ScenarioGap{
				{SpecFile: "specs/user-login.feature", ScenarioTitle: "Successful login"},
			},
			StepGaps: nil,
		}, nil
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) aFeatureFileWithStepTextNotInAnyTestFile() error {
	specCoverageCheckAllFn = func(_ speccoverage.ScanOptions) (*speccoverage.CheckResult, error) {
		return &speccoverage.CheckResult{
			TotalSpecs:     1,
			TotalScenarios: 1,
			TotalSteps:     1,
			Gaps:           nil,
			ScenarioGaps:   nil,
			StepGaps: []speccoverage.StepGap{
				{
					SpecFile:      "specs/user-login.feature",
					ScenarioTitle: "Successful login",
					StepKeyword:   "Given",
					StepText:      "the login page is open",
				},
			},
		}, nil
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) featureFilesWithStepsInSharedStepFiles() error {
	specCoverageCheckAllFn = func(_ speccoverage.ScanOptions) (*speccoverage.CheckResult, error) {
		return &speccoverage.CheckResult{
			TotalSpecs:     1,
			TotalScenarios: 1,
			TotalSteps:     2,
			Gaps:           nil,
			ScenarioGaps:   nil,
			StepGaps:       nil,
		}, nil
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) featureFilesWithTestsInMultipleLanguages() error {
	specCoverageCheckAllFn = func(_ speccoverage.ScanOptions) (*speccoverage.CheckResult, error) {
		return &speccoverage.CheckResult{
			TotalSpecs:     2,
			TotalScenarios: 2,
			TotalSteps:     4,
			Gaps:           nil,
			ScenarioGaps:   nil,
			StepGaps:       nil,
		}, nil
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) theDeveloperRunsValidateSpecCoverage() error {
	buf := new(bytes.Buffer)
	validateSpecCoverageCmd.SetOut(buf)
	validateSpecCoverageCmd.SetErr(buf)
	s.cmdErr = validateSpecCoverageCmd.RunE(validateSpecCoverageCmd, []string{"specs/test", "apps/test"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *specCoverageValidateUnitSteps) theDeveloperRunsValidateSpecCoverageSharedSteps() error {
	sharedSteps = true
	return s.theDeveloperRunsValidateSpecCoverage()
}

func (s *specCoverageValidateUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) theOutputReportsAllSpecsAsCovered() error {
	if strings.Contains(strings.ToLower(s.cmdOutput), "gap") {
		return fmt.Errorf("expected no gaps in output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) theOutputIdentifiesFeatureFileAsUncoveredSpec() error {
	if !strings.Contains(s.cmdErr.Error(), "gap") {
		return fmt.Errorf("expected 'gap' in error but got: %v", s.cmdErr)
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) theOutputIdentifiesScenarioAsUnimplemented() error {
	if !strings.Contains(s.cmdErr.Error(), "gap") {
		return fmt.Errorf("expected 'gap' in error but got: %v", s.cmdErr)
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) theOutputIdentifiesStepAsUndefined() error {
	if !strings.Contains(s.cmdErr.Error(), "gap") {
		return fmt.Errorf("expected 'gap' in error but got: %v", s.cmdErr)
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) commandValidatesStepsAcrossAllSourceFiles() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success in shared-steps mode but got: %v", s.cmdErr)
	}
	return nil
}

func (s *specCoverageValidateUnitSteps) testFilesMatchedUsingLanguageConventions() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success in multi-language mode but got: %v", s.cmdErr)
	}
	return nil
}

func TestUnitSpecCoverageValidate(t *testing.T) {
	s := &specCoverageValidateUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepSpecsDirEveryFeatureFileHasTest, s.aSpecsDirEveryFeatureFileHasTest)
			sc.Step(stepSpecsDirContainsFeatureFileWithNoTest, s.aSpecsDirContainsFeatureFileWithNoTest)
			sc.Step(stepFeatureFileWithScenarioNotInAnyTestFile, s.aFeatureFileWithScenarioNotInAnyTestFile)
			sc.Step(stepFeatureFileWithStepTextNotInAnyTestFile, s.aFeatureFileWithStepTextNotInAnyTestFile)
			sc.Step(stepFeatureFilesWithStepsInSharedStepFiles, s.featureFilesWithStepsInSharedStepFiles)
			sc.Step(stepFeatureFilesWithTestsInMultipleLanguages, s.featureFilesWithTestsInMultipleLanguages)
			sc.Step(stepDeveloperRunsValidateSpecCoverage, s.theDeveloperRunsValidateSpecCoverage)
			sc.Step(stepDeveloperRunsValidateSpecCoverageSharedSteps, s.theDeveloperRunsValidateSpecCoverageSharedSteps)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepOutputReportsAllSpecsAsCovered, s.theOutputReportsAllSpecsAsCovered)
			sc.Step(stepOutputIdentifiesFeatureFileAsUncoveredSpec, s.theOutputIdentifiesFeatureFileAsUncoveredSpec)
			sc.Step(stepOutputIdentifiesScenarioAsUnimplemented, s.theOutputIdentifiesScenarioAsUnimplemented)
			sc.Step(stepOutputIdentifiesStepAsUndefined, s.theOutputIdentifiesStepAsUndefined)
			sc.Step(stepCommandValidatesStepsAcrossAllSourceFiles, s.commandValidatesStepsAcrossAllSourceFiles)
			sc.Step(stepTestFilesMatchedUsingLanguageConventions, s.testFilesMatchedUsingLanguageConventions)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitSpecCoverageValidate},
			TestingT: t,
			Tags:     "spec-coverage-validate",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestValidateSpecCoverageCmd_Initialization verifies command metadata.
// This is a non-BDD test because command metadata is not in Gherkin specs.
func TestValidateSpecCoverageCmd_Initialization(t *testing.T) {
	if !strings.Contains(validateSpecCoverageCmd.Use, "validate") {
		t.Errorf("expected Use to contain 'validate', got %q", validateSpecCoverageCmd.Use)
	}
}

// TestValidateSpecCoverageCmd_NoArgs verifies ExactArgs(2) validation.
// This is a non-BDD test covering the args validator not in Gherkin specs.
func TestValidateSpecCoverageCmd_NoArgs(t *testing.T) {
	err := validateSpecCoverageCmd.Args(validateSpecCoverageCmd, []string{})
	if err == nil {
		t.Error("expected error when no args provided")
	}
}

// TestValidateSpecCoverageCmd_MissingGitRoot verifies git root detection.
// This is a non-BDD test because the git-root failure path is not in Gherkin specs.
func TestValidateSpecCoverageCmd_MissingGitRoot(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/no-git-here", nil }
	osStat = func(_ string) (os.FileInfo, error) {
		return nil, os.ErrNotExist
	}

	buf := new(bytes.Buffer)
	validateSpecCoverageCmd.SetOut(buf)
	validateSpecCoverageCmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	err := validateSpecCoverageCmd.RunE(validateSpecCoverageCmd, []string{"specs/test", "apps/test"})
	if err == nil {
		t.Error("expected error when no .git directory found")
	}
	if !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error mentioning 'git', got: %v", err)
	}
}

// TestValidateSpecCoverageCmd_FnError verifies error propagation from the internal function.
// This is a non-BDD test covering the error path not in Gherkin specs.
func TestValidateSpecCoverageCmd_FnError(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := specCoverageCheckAllFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		specCoverageCheckAllFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	specCoverageCheckAllFn = func(_ speccoverage.ScanOptions) (*speccoverage.CheckResult, error) {
		return nil, fmt.Errorf("scan error")
	}

	buf := new(bytes.Buffer)
	validateSpecCoverageCmd.SetOut(buf)
	validateSpecCoverageCmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	err := validateSpecCoverageCmd.RunE(validateSpecCoverageCmd, []string{"specs/test", "apps/test"})
	if err == nil {
		t.Error("expected error when internal function fails")
	}
	if !strings.Contains(err.Error(), "spec coverage check failed") {
		t.Errorf("expected 'spec coverage check failed' error, got: %v", err)
	}
}
