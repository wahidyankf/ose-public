package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/testcoverage"
)

var specsDirUnitValidateTestCoverage = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type validateTestCoverageUnitSteps struct {
	cmdErr    error
	cmdOutput string
	coverFile string
	mockErr   error
}

func (s *validateTestCoverageUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	perFile = false
	belowThreshold = 0
	excludePatterns = nil
	s.cmdErr = nil
	s.cmdOutput = ""
	s.coverFile = ""
	s.mockErr = nil

	// Mock findGitRoot
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	// Default mocks — individual steps override as needed
	testCoverageComputeGoResultFn = func(_ string, _ float64) (testcoverage.Result, error) {
		return testcoverage.Result{}, fmt.Errorf("no mock configured")
	}
	testCoverageComputeLCOVResultFn = func(_ string, _ float64) (testcoverage.Result, error) {
		return testcoverage.Result{}, fmt.Errorf("no mock configured")
	}
	testCoverageComputeCoberturaResultFn = func(_ string, _ float64) (testcoverage.Result, error) {
		return testcoverage.Result{}, fmt.Errorf("no mock configured")
	}

	return context.Background(), nil
}

func (s *validateTestCoverageUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	testCoverageComputeGoResultFn = testcoverage.ComputeGoResult
	testCoverageComputeLCOVResultFn = testcoverage.ComputeLCOVResult
	testCoverageComputeCoberturaResultFn = testcoverage.ComputeCoberturaResult
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

// buildGoResult creates a testcoverage.Result for a Go coverage file scenario.
func buildGoResult(pct, threshold float64) testcoverage.Result {
	total := 20
	covered := int(float64(total) * pct / 100)
	return testcoverage.Result{
		File:      "/mock-repo/cover.out",
		Format:    testcoverage.FormatGo,
		Covered:   covered,
		Missed:    total - covered,
		Total:     total,
		Pct:       pct,
		Threshold: threshold,
		Passed:    pct >= threshold,
	}
}

// buildLCOVResult creates a testcoverage.Result for an LCOV coverage file scenario.
func buildLCOVResult(pct, threshold float64, files []testcoverage.FileResult) testcoverage.Result {
	r := testcoverage.Result{
		File:      "/mock-repo/lcov.info",
		Format:    testcoverage.FormatLCOV,
		Pct:       pct,
		Threshold: threshold,
		Passed:    pct >= threshold,
		Files:     files,
	}
	for _, f := range files {
		r.Covered += f.Covered
		r.Missed += f.Missed
		r.Total += f.Total
	}
	return r
}

// buildCoberturaResult creates a testcoverage.Result for a Cobertura coverage file scenario.
func buildCoberturaResult(pct, threshold float64) testcoverage.Result {
	total := 10
	covered := int(float64(total) * pct / 100)
	return testcoverage.Result{
		File:      "/mock-repo/cobertura.xml",
		Format:    testcoverage.FormatCobertura,
		Covered:   covered,
		Missed:    total - covered,
		Total:     total,
		Pct:       pct,
		Threshold: threshold,
		Passed:    pct >= threshold,
	}
}

func (s *validateTestCoverageUnitSteps) aGoCoverageFileRecording90PercentLineCoverage() error {
	s.coverFile = "cover.out"
	testCoverageComputeGoResultFn = func(_ string, threshold float64) (testcoverage.Result, error) {
		return buildGoResult(90.0, threshold), nil
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) aGoCoverageFileRecording70PercentLineCoverage() error {
	s.coverFile = "cover.out"
	testCoverageComputeGoResultFn = func(_ string, threshold float64) (testcoverage.Result, error) {
		return buildGoResult(70.0, threshold), nil
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) aGoCoverageFileRecording85PercentLineCoverage() error {
	s.coverFile = "cover.out"
	testCoverageComputeGoResultFn = func(_ string, threshold float64) (testcoverage.Result, error) {
		return buildGoResult(85.0, threshold), nil
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) anLCOVCoverageFileRecording90PercentLineCoverage() error {
	s.coverFile = "lcov.info"
	testCoverageComputeLCOVResultFn = func(_ string, threshold float64) (testcoverage.Result, error) {
		return buildLCOVResult(90.0, threshold, nil), nil
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) anLCOVCoverageFileWithMultipleSourceFiles() error {
	s.coverFile = "lcov.info"
	files := []testcoverage.FileResult{
		{Path: "src/a.ts", Covered: 5, Total: 5, Pct: 100.0},
		{Path: "src/b.ts", Covered: 4, Total: 5, Pct: 80.0},
	}
	testCoverageComputeLCOVResultFn = func(_ string, threshold float64) (testcoverage.Result, error) {
		return buildLCOVResult(90.0, threshold, files), nil
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) aCoberturaXMLCoverageFileRecording90PercentLineCoverage() error {
	s.coverFile = "cobertura.xml"
	testCoverageComputeCoberturaResultFn = func(_ string, threshold float64) (testcoverage.Result, error) {
		return buildCoberturaResult(90.0, threshold), nil
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) aCoberturaXMLCoverageFileWithPartialBranchCoverage() error {
	s.coverFile = "cobertura.xml"
	testCoverageComputeCoberturaResultFn = func(_ string, threshold float64) (testcoverage.Result, error) {
		return buildCoberturaResult(33.0, threshold), nil
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) noCoverageFileExistsAtTheSpecifiedPath() error {
	s.coverFile = "nonexistent_cover.out"
	mockErr := fmt.Errorf("coverage check failed: open /mock-repo/nonexistent_cover.out: no such file or directory")
	testCoverageComputeGoResultFn = func(_ string, _ float64) (testcoverage.Result, error) {
		return testcoverage.Result{}, mockErr
	}
	testCoverageComputeLCOVResultFn = func(_ string, _ float64) (testcoverage.Result, error) {
		return testcoverage.Result{}, mockErr
	}
	testCoverageComputeCoberturaResultFn = func(_ string, _ float64) (testcoverage.Result, error) {
		return testcoverage.Result{}, mockErr
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theDeveloperRunsValidateTestCoverageWithAn85PercentThreshold() error {
	buf := new(bytes.Buffer)
	validateTestCoverageCmd.SetOut(buf)
	validateTestCoverageCmd.SetErr(buf)
	s.cmdErr = validateTestCoverageCmd.RunE(validateTestCoverageCmd, []string{s.coverFile, "85"})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateTestCoverageUnitSteps) theDeveloperRunsValidateTestCoverageWithAn85PercentThresholdAndPerFileFlag() error {
	perFile = true
	return s.theDeveloperRunsValidateTestCoverageWithAn85PercentThreshold()
}

func (s *validateTestCoverageUnitSteps) theDeveloperRunsValidateTestCoverageWithAn85PercentThresholdRequestingJSONOutput() error {
	output = "json"
	return s.theDeveloperRunsValidateTestCoverageWithAn85PercentThreshold()
}

func (s *validateTestCoverageUnitSteps) theDeveloperRunsValidateWithExclusion() error {
	perFile = true
	excludePatterns = []string{"b.ts"}
	return s.theDeveloperRunsValidateTestCoverageWithAn85PercentThreshold()
}

func (s *validateTestCoverageUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theOutputReportsTheMeasuredCoveragePercentage() error {
	if !strings.Contains(s.cmdOutput, "%") {
		return fmt.Errorf("expected output to contain '%%' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theOutputIndicatesTheCoveragePassesTheThreshold() error {
	if !strings.Contains(s.cmdOutput, "PASS") {
		return fmt.Errorf("expected output to contain 'PASS' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theOutputIndicatesTheCoverageFailsTheThreshold() error {
	if !strings.Contains(s.cmdOutput, "FAIL") {
		return fmt.Errorf("expected output to contain 'FAIL' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theOutputIsValidJSON() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theJSONIncludesTheCoveragePercentageAndPassFailStatus() error {
	var parsed map[string]any
	if err := json.Unmarshal([]byte(s.cmdOutput), &parsed); err != nil {
		return fmt.Errorf("output is not valid JSON: %v\nOutput: %s", err, s.cmdOutput)
	}
	if _, ok := parsed["pct"]; !ok {
		return fmt.Errorf("expected JSON to contain 'pct' field but got: %s", s.cmdOutput)
	}
	if _, ok := parsed["status"]; !ok {
		return fmt.Errorf("expected JSON to contain 'status' field but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theOutputContainsPerFileCoverageBreakdown() error {
	if !strings.Contains(s.cmdOutput, "Per-file") && !strings.Contains(s.cmdOutput, "src/") {
		return fmt.Errorf("expected per-file output but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theOutputDoesNotContainTheExcludedFile() error {
	if strings.Contains(s.cmdOutput, "src/b.ts") {
		return fmt.Errorf("expected output to NOT contain src/b.ts but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateTestCoverageUnitSteps) theOutputDescribesTheMissingFile() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	lc := strings.ToLower(combined)
	if !strings.Contains(lc, "coverage check failed") &&
		!strings.Contains(lc, "no such file") &&
		!strings.Contains(lc, "not found") &&
		!strings.Contains(lc, "open ") {
		return fmt.Errorf("expected output to describe missing file but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func TestUnitValidateTestCoverage(t *testing.T) {
	s := &validateTestCoverageUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepGoCoverageFile90Pct, s.aGoCoverageFileRecording90PercentLineCoverage)
			sc.Step(stepGoCoverageFile70Pct, s.aGoCoverageFileRecording70PercentLineCoverage)
			sc.Step(stepGoCoverageFile85Pct, s.aGoCoverageFileRecording85PercentLineCoverage)
			sc.Step(stepLCOVCoverageFile90Pct, s.anLCOVCoverageFileRecording90PercentLineCoverage)
			sc.Step(stepLCOVCoverageFileMultipleSourceFiles, s.anLCOVCoverageFileWithMultipleSourceFiles)
			sc.Step(stepCoberturaXMLCoverageFile90Pct, s.aCoberturaXMLCoverageFileRecording90PercentLineCoverage)
			sc.Step(stepCoberturaXMLCoverageFileWithPartialBranch, s.aCoberturaXMLCoverageFileWithPartialBranchCoverage)
			sc.Step(stepNoCoverageFileExistsAtPath, s.noCoverageFileExistsAtTheSpecifiedPath)
			sc.Step(stepDeveloperRunsValidateCoverage85, s.theDeveloperRunsValidateTestCoverageWithAn85PercentThreshold)
			sc.Step(stepDeveloperRunsValidateCoverage85WithPerFile, s.theDeveloperRunsValidateTestCoverageWithAn85PercentThresholdAndPerFileFlag)
			sc.Step(stepDeveloperRunsValidateCoverage85WithJSON, s.theDeveloperRunsValidateTestCoverageWithAn85PercentThresholdRequestingJSONOutput)
			sc.Step(stepDeveloperRunsValidateCoverageWithExclusion, s.theDeveloperRunsValidateWithExclusion)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepOutputReportsMeasuredCoveragePct, s.theOutputReportsTheMeasuredCoveragePercentage)
			sc.Step(stepOutputIndicatesCoveragePasses, s.theOutputIndicatesTheCoveragePassesTheThreshold)
			sc.Step(stepOutputIndicatesCoverageFails, s.theOutputIndicatesTheCoverageFailsTheThreshold)
			sc.Step(stepOutputIsValidJSON, s.theOutputIsValidJSON)
			sc.Step(stepJSONIncludesCoveragePctAndPassFail, s.theJSONIncludesTheCoveragePercentageAndPassFailStatus)
			sc.Step(stepOutputContainsPerFileCoverageBreakdown, s.theOutputContainsPerFileCoverageBreakdown)
			sc.Step(stepOutputDoesNotContainExcludedFile, s.theOutputDoesNotContainTheExcludedFile)
			sc.Step(stepOutputDescribesMissingFile, s.theOutputDescribesTheMissingFile)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitValidateTestCoverage},
			TestingT: t,
			Tags:     "@test-coverage-validate",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestValidateTestCoverageCmd_NoArgs verifies argument validation — not in Gherkin specs.
func TestValidateTestCoverageCmd_NoArgs(t *testing.T) {
	err := validateTestCoverageCmd.Args(validateTestCoverageCmd, []string{})
	if err == nil {
		t.Error("expected error when no args provided")
	}
}

// TestValidateTestCoverageCmd_OneArg verifies argument validation — not in Gherkin specs.
func TestValidateTestCoverageCmd_OneArg(t *testing.T) {
	err := validateTestCoverageCmd.Args(validateTestCoverageCmd, []string{"cover.out"})
	if err == nil {
		t.Error("expected error with only one arg")
	}
}

// TestValidateTestCoverageCmd_InvalidThreshold verifies threshold parsing — not in Gherkin specs.
func TestValidateTestCoverageCmd_InvalidThreshold(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	cmd := validateTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	err := cmd.RunE(cmd, []string{"cover.out", "notanumber"})
	if err == nil {
		t.Error("expected error for invalid threshold")
	}
	if !strings.Contains(err.Error(), "invalid threshold") {
		t.Errorf("expected 'invalid threshold' in error, got: %v", err)
	}
}

// TestValidateTestCoverageCmd_MissingGitRoot verifies git root detection — not in Gherkin specs.
func TestValidateTestCoverageCmd_MissingGitRoot(t *testing.T) {
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

	cmd := validateTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	err := cmd.RunE(cmd, []string{"cover.out", "85"})
	if err == nil {
		t.Fatal("expected error when no .git directory found")
	}
	if !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error mentioning 'git', got: %v", err)
	}
}
