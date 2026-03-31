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
)

var specsMergeTestCoverageDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

// Scenario: Merging two LCOV files produces correct combined coverage
// Scenario: Merging with validation passes when coverage meets threshold
// Scenario: Merging with validation fails when coverage is below threshold

type mergeTestCoverageSteps struct {
	originalWd string
	tmpDir     string
	file1      string
	file2      string
	cmdErr     error
	cmdOutput  string
}

func (s *mergeTestCoverageSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "merge-test-coverage-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	mergeOutFile = ""
	mergeValidate = ""
	mergeExcludePatterns = nil
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *mergeTestCoverageSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *mergeTestCoverageSteps) twoLCOVCoverageFilesWithDifferentSourceFiles() error {
	lcov1 := "TN:\nSF:src/a.ts\nDA:1,1\nDA:2,1\nDA:3,0\nend_of_record\n"
	lcov2 := "TN:\nSF:src/b.ts\nDA:1,1\nDA:2,1\nDA:3,1\nend_of_record\n"
	os.WriteFile(filepath.Join(s.tmpDir, "cov1.info"), []byte(lcov1), 0644)
	os.WriteFile(filepath.Join(s.tmpDir, "cov2.info"), []byte(lcov2), 0644)
	s.file1 = "cov1.info"
	s.file2 = "cov2.info"
	return nil
}

func (s *mergeTestCoverageSteps) twoLCOVCoverageFilesWithHighCoverage() error {
	lcov1 := "TN:\nSF:src/a.ts\nDA:1,1\nDA:2,1\nDA:3,1\nDA:4,1\nDA:5,0\nend_of_record\n"
	lcov2 := "TN:\nSF:src/a.ts\nDA:1,1\nDA:2,1\nDA:3,1\nDA:4,1\nDA:5,1\nend_of_record\n"
	os.WriteFile(filepath.Join(s.tmpDir, "cov1.info"), []byte(lcov1), 0644)
	os.WriteFile(filepath.Join(s.tmpDir, "cov2.info"), []byte(lcov2), 0644)
	s.file1 = "cov1.info"
	s.file2 = "cov2.info"
	return nil
}

func (s *mergeTestCoverageSteps) twoLCOVCoverageFilesWithLowCoverage() error {
	lcov1 := "TN:\nSF:src/a.ts\nDA:1,1\nDA:2,0\nDA:3,0\nDA:4,0\nDA:5,0\nend_of_record\n"
	lcov2 := "TN:\nSF:src/b.ts\nDA:1,0\nDA:2,0\nDA:3,0\nDA:4,0\nDA:5,0\nend_of_record\n"
	os.WriteFile(filepath.Join(s.tmpDir, "cov1.info"), []byte(lcov1), 0644)
	os.WriteFile(filepath.Join(s.tmpDir, "cov2.info"), []byte(lcov2), 0644)
	s.file1 = "cov1.info"
	s.file2 = "cov2.info"
	return nil
}

func (s *mergeTestCoverageSteps) theDeveloperRunsMergeWithOutputFile() error {
	mergeOutFile = "merged.info"
	buf := new(bytes.Buffer)
	mergeTestCoverageCmd.SetOut(buf)
	mergeTestCoverageCmd.SetErr(buf)
	s.cmdErr = mergeTestCoverageCmd.RunE(mergeTestCoverageCmd, []string{s.file1, s.file2})
	s.cmdOutput = buf.String()
	return nil
}

func (s *mergeTestCoverageSteps) theDeveloperRunsMergeWithValidationAt80Threshold() error {
	mergeValidate = "80"
	buf := new(bytes.Buffer)
	mergeTestCoverageCmd.SetOut(buf)
	mergeTestCoverageCmd.SetErr(buf)
	s.cmdErr = mergeTestCoverageCmd.RunE(mergeTestCoverageCmd, []string{s.file1, s.file2})
	s.cmdOutput = buf.String()
	return nil
}

func (s *mergeTestCoverageSteps) theDeveloperRunsMergeWithValidationAt95Threshold() error {
	mergeValidate = "95"
	buf := new(bytes.Buffer)
	mergeTestCoverageCmd.SetOut(buf)
	mergeTestCoverageCmd.SetErr(buf)
	s.cmdErr = mergeTestCoverageCmd.RunE(mergeTestCoverageCmd, []string{s.file1, s.file2})
	s.cmdOutput = buf.String()
	return nil
}

func (s *mergeTestCoverageSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *mergeTestCoverageSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but command succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *mergeTestCoverageSteps) theMergedOutputFileExistsInLCOVFormat() error {
	outPath := filepath.Join(s.tmpDir, "merged.info")
	data, err := os.ReadFile(outPath)
	if err != nil {
		return fmt.Errorf("merged file not found: %v", err)
	}
	content := string(data)
	if !strings.Contains(content, "SF:") || !strings.Contains(content, "DA:") {
		return fmt.Errorf("output doesn't look like LCOV: %s", content)
	}
	return nil
}

func InitializeMergeTestCoverageScenario(sc *godog.ScenarioContext) {
	s := &mergeTestCoverageSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^two LCOV coverage files with different source files$`, s.twoLCOVCoverageFilesWithDifferentSourceFiles)
	sc.Step(`^two LCOV coverage files with high coverage$`, s.twoLCOVCoverageFilesWithHighCoverage)
	sc.Step(`^two LCOV coverage files with low coverage$`, s.twoLCOVCoverageFilesWithLowCoverage)
	sc.Step(`^the developer runs test-coverage merge with an output file$`, s.theDeveloperRunsMergeWithOutputFile)
	sc.Step(`^the developer runs test-coverage merge with validation at 80% threshold$`, s.theDeveloperRunsMergeWithValidationAt80Threshold)
	sc.Step(`^the developer runs test-coverage merge with validation at 95% threshold$`, s.theDeveloperRunsMergeWithValidationAt95Threshold)
	sc.Step(`^the command exits successfully$`, s.theCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theCommandExitsWithAFailureCode)
	sc.Step(`^the merged output file exists in LCOV format$`, s.theMergedOutputFileExistsInLCOVFormat)
}

func TestIntegrationMergeTestCoverage(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeMergeTestCoverageScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsMergeTestCoverageDir},
			TestingT: t,
			Tags:     "@test-coverage-merge",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
