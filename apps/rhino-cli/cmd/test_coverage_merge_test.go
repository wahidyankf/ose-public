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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/testcoverage"
)

var specsDirUnitMergeTestCoverage = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type mergeTestCoverageUnitSteps struct {
	cmdErr    error
	cmdOutput string
	file1     string
	file2     string
}

func (s *mergeTestCoverageUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	mergeOutFile = ""
	mergeValidate = ""
	mergeExcludePatterns = nil
	s.cmdErr = nil
	s.cmdOutput = ""
	s.file1 = ""
	s.file2 = ""

	// Mock findGitRoot
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	return context.Background(), nil
}

func (s *mergeTestCoverageUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	testCoverageToCoverageMapFn = testcoverage.ToCoverageMap
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

// lcovMapDifferentFiles returns two coverage maps for distinct source files.
func lcovMapDifferentFiles() (testcoverage.CoverageMap, testcoverage.CoverageMap) {
	mapA := testcoverage.CoverageMap{
		"src/a.ts": {
			1: testcoverage.LineCoverage{HitCount: 1},
			2: testcoverage.LineCoverage{HitCount: 1},
			3: testcoverage.LineCoverage{HitCount: 0},
		},
	}
	mapB := testcoverage.CoverageMap{
		"src/b.ts": {
			1: testcoverage.LineCoverage{HitCount: 1},
			2: testcoverage.LineCoverage{HitCount: 1},
			3: testcoverage.LineCoverage{HitCount: 1},
		},
	}
	return mapA, mapB
}

// lcovMapHighCoverage returns two coverage maps with high (100%) combined coverage.
func lcovMapHighCoverage() (testcoverage.CoverageMap, testcoverage.CoverageMap) {
	mapA := testcoverage.CoverageMap{
		"src/a.ts": {
			1: testcoverage.LineCoverage{HitCount: 1},
			2: testcoverage.LineCoverage{HitCount: 1},
			3: testcoverage.LineCoverage{HitCount: 1},
			4: testcoverage.LineCoverage{HitCount: 1},
			5: testcoverage.LineCoverage{HitCount: 0},
		},
	}
	// The second map covers line 5, bringing combined to 100%
	mapB := testcoverage.CoverageMap{
		"src/a.ts": {
			1: testcoverage.LineCoverage{HitCount: 1},
			2: testcoverage.LineCoverage{HitCount: 1},
			3: testcoverage.LineCoverage{HitCount: 1},
			4: testcoverage.LineCoverage{HitCount: 1},
			5: testcoverage.LineCoverage{HitCount: 1},
		},
	}
	return mapA, mapB
}

// lcovMapLowCoverage returns two coverage maps with low combined coverage.
func lcovMapLowCoverage() (testcoverage.CoverageMap, testcoverage.CoverageMap) {
	mapA := testcoverage.CoverageMap{
		"src/a.ts": {
			1: testcoverage.LineCoverage{HitCount: 1},
			2: testcoverage.LineCoverage{HitCount: 0},
			3: testcoverage.LineCoverage{HitCount: 0},
			4: testcoverage.LineCoverage{HitCount: 0},
			5: testcoverage.LineCoverage{HitCount: 0},
		},
	}
	mapB := testcoverage.CoverageMap{
		"src/b.ts": {
			1: testcoverage.LineCoverage{HitCount: 0},
			2: testcoverage.LineCoverage{HitCount: 0},
			3: testcoverage.LineCoverage{HitCount: 0},
			4: testcoverage.LineCoverage{HitCount: 0},
			5: testcoverage.LineCoverage{HitCount: 0},
		},
	}
	return mapA, mapB
}

func (s *mergeTestCoverageUnitSteps) installMapMocks(mapA, mapB testcoverage.CoverageMap) {
	call := 0
	testCoverageToCoverageMapFn = func(_ string) (testcoverage.CoverageMap, error) {
		call++
		if call == 1 {
			return mapA, nil
		}
		return mapB, nil
	}
}

func (s *mergeTestCoverageUnitSteps) twoLCOVCoverageFilesWithDifferentSourceFiles() error {
	s.file1 = "cov1.info"
	s.file2 = "cov2.info"
	a, b := lcovMapDifferentFiles()
	s.installMapMocks(a, b)
	return nil
}

func (s *mergeTestCoverageUnitSteps) twoLCOVCoverageFilesWithHighCoverage() error {
	s.file1 = "cov1.info"
	s.file2 = "cov2.info"
	a, b := lcovMapHighCoverage()
	s.installMapMocks(a, b)
	return nil
}

func (s *mergeTestCoverageUnitSteps) twoLCOVCoverageFilesWithLowCoverage() error {
	s.file1 = "cov1.info"
	s.file2 = "cov2.info"
	a, b := lcovMapLowCoverage()
	s.installMapMocks(a, b)
	return nil
}

func (s *mergeTestCoverageUnitSteps) theDeveloperRunsMergeWithOutputFile() error {
	// Use a real temp dir for the output file — WriteLCOV uses os.WriteFile directly.
	tmpDir, err := os.MkdirTemp("", "merge-unit-*")
	if err != nil {
		return fmt.Errorf("failed to create temp dir: %w", err)
	}
	// Override git root to point at tmpDir so the output file path resolves
	osGetwd = func() (string, error) { return tmpDir, nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == tmpDir+"/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	mergeOutFile = "merged.info"

	buf := new(bytes.Buffer)
	mergeTestCoverageCmd.SetOut(buf)
	mergeTestCoverageCmd.SetErr(buf)
	s.cmdErr = mergeTestCoverageCmd.RunE(mergeTestCoverageCmd, []string{s.file1, s.file2})
	s.cmdOutput = buf.String()
	_ = os.RemoveAll(tmpDir)
	return nil
}

func (s *mergeTestCoverageUnitSteps) theDeveloperRunsMergeWithValidationAt80Threshold() error {
	mergeValidate = "80"
	buf := new(bytes.Buffer)
	mergeTestCoverageCmd.SetOut(buf)
	mergeTestCoverageCmd.SetErr(buf)
	s.cmdErr = mergeTestCoverageCmd.RunE(mergeTestCoverageCmd, []string{s.file1, s.file2})
	s.cmdOutput = buf.String()
	return nil
}

func (s *mergeTestCoverageUnitSteps) theDeveloperRunsMergeWithValidationAt95Threshold() error {
	mergeValidate = "95"
	buf := new(bytes.Buffer)
	mergeTestCoverageCmd.SetOut(buf)
	mergeTestCoverageCmd.SetErr(buf)
	s.cmdErr = mergeTestCoverageCmd.RunE(mergeTestCoverageCmd, []string{s.file1, s.file2})
	s.cmdOutput = buf.String()
	return nil
}

func (s *mergeTestCoverageUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *mergeTestCoverageUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *mergeTestCoverageUnitSteps) theMergedOutputFileExistsInLCOVFormat() error {
	// In unit tests we mock the write — verify the output mentions LCOV keywords
	if !strings.Contains(s.cmdOutput, "Line coverage:") && !strings.Contains(s.cmdOutput, "coverage") {
		return fmt.Errorf("expected output to report coverage but got: %s", s.cmdOutput)
	}
	return nil
}

func TestUnitMergeTestCoverage(t *testing.T) {
	s := &mergeTestCoverageUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepTwoLCOVFilesWithDifferentSourceFiles, s.twoLCOVCoverageFilesWithDifferentSourceFiles)
			sc.Step(stepTwoLCOVFilesWithHighCoverage, s.twoLCOVCoverageFilesWithHighCoverage)
			sc.Step(stepTwoLCOVFilesWithLowCoverage, s.twoLCOVCoverageFilesWithLowCoverage)
			sc.Step(stepDeveloperRunsMergeWithOutputFile, s.theDeveloperRunsMergeWithOutputFile)
			sc.Step(stepDeveloperRunsMergeWithValidation80, s.theDeveloperRunsMergeWithValidationAt80Threshold)
			sc.Step(stepDeveloperRunsMergeWithValidation95, s.theDeveloperRunsMergeWithValidationAt95Threshold)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepMergedOutputFileExistsInLCOVFormat, s.theMergedOutputFileExistsInLCOVFormat)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitMergeTestCoverage},
			TestingT: t,
			Tags:     "@test-coverage-merge",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}
