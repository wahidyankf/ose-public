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
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/testcoverage"
)

var specsDirUnitDiffTestCoverage = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

type diffTestCoverageUnitSteps struct {
	cmdErr    error
	cmdOutput string
	coverFile string
}

func (s *diffTestCoverageUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	diffBase = "main"
	diffThreshold = 0
	diffStaged = false
	diffPerFile = false
	diffExcludePatterns = nil
	s.cmdErr = nil
	s.cmdOutput = ""
	s.coverFile = "cover.out"

	// Mock findGitRoot
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	// Default: return 100% diff coverage (no changed lines)
	testCoverageComputeDiffCoverageFn = func(_ testcoverage.DiffCoverageOptions) (testcoverage.Result, error) {
		return testcoverage.Result{
			Format:    testcoverage.FormatDiff,
			Pct:       100.0,
			Threshold: 0,
			Passed:    true,
			Total:     0,
			Covered:   0,
		}, nil
	}

	return context.Background(), nil
}

func (s *diffTestCoverageUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	testCoverageComputeDiffCoverageFn = testcoverage.ComputeDiffCoverage
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *diffTestCoverageUnitSteps) aCoverageFileAndNoGitChanges() error {
	s.coverFile = "cover.out"
	testCoverageComputeDiffCoverageFn = func(_ testcoverage.DiffCoverageOptions) (testcoverage.Result, error) {
		return testcoverage.Result{
			Format:    testcoverage.FormatDiff,
			Pct:       100.0,
			Threshold: 0,
			Passed:    true,
			Total:     0,
			Covered:   0,
		}, nil
	}
	return nil
}

func (s *diffTestCoverageUnitSteps) aCoverageFileWhereAllChangedLinesAreCovered() error {
	s.coverFile = "cover.out"
	testCoverageComputeDiffCoverageFn = func(opts testcoverage.DiffCoverageOptions) (testcoverage.Result, error) {
		return testcoverage.Result{
			Format:    testcoverage.FormatDiff,
			Pct:       100.0,
			Threshold: opts.Threshold,
			Passed:    100.0 >= opts.Threshold,
			Total:     5,
			Covered:   5,
		}, nil
	}
	return nil
}

func (s *diffTestCoverageUnitSteps) aCoverageFileWhereSomeChangedLinesMissed() error {
	s.coverFile = "cover.out"
	testCoverageComputeDiffCoverageFn = func(opts testcoverage.DiffCoverageOptions) (testcoverage.Result, error) {
		pct := 40.0
		return testcoverage.Result{
			Format:    testcoverage.FormatDiff,
			Pct:       pct,
			Threshold: opts.Threshold,
			Passed:    pct >= opts.Threshold,
			Total:     5,
			Covered:   2,
			Missed:    3,
		}, nil
	}
	return nil
}

func (s *diffTestCoverageUnitSteps) aCoverageFileAndChangesInExcludedFiles() error {
	s.coverFile = "cover.out"
	testCoverageComputeDiffCoverageFn = func(opts testcoverage.DiffCoverageOptions) (testcoverage.Result, error) {
		return testcoverage.Result{
			Format:    testcoverage.FormatDiff,
			Pct:       100.0,
			Threshold: opts.Threshold,
			Passed:    true,
			Total:     0,
			Covered:   0,
		}, nil
	}
	return nil
}

func (s *diffTestCoverageUnitSteps) theDeveloperRunsTestCoverageDiff() error {
	buf := new(bytes.Buffer)
	diffTestCoverageCmd.SetOut(buf)
	diffTestCoverageCmd.SetErr(buf)
	s.cmdErr = diffTestCoverageCmd.RunE(diffTestCoverageCmd, []string{s.coverFile})
	s.cmdOutput = buf.String()
	return nil
}

func (s *diffTestCoverageUnitSteps) theDeveloperRunsTestCoverageDiffWithAThreshold() error {
	diffThreshold = 80
	return s.theDeveloperRunsTestCoverageDiff()
}

func (s *diffTestCoverageUnitSteps) theDeveloperRunsTestCoverageDiffWithAHighThreshold() error {
	diffThreshold = 90
	return s.theDeveloperRunsTestCoverageDiff()
}

func (s *diffTestCoverageUnitSteps) theDeveloperRunsTestCoverageDiffWithExclusion() error {
	diffExcludePatterns = []string{"generated/*"}
	return s.theDeveloperRunsTestCoverageDiff()
}

func (s *diffTestCoverageUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *diffTestCoverageUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *diffTestCoverageUnitSteps) theOutputReports100PercentCoverage() error {
	if !strings.Contains(s.cmdOutput, "100") {
		return fmt.Errorf("expected output to contain '100' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *diffTestCoverageUnitSteps) theExcludedFilesDoNotAffectTheDiffCoverageResult() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func TestUnitDiffTestCoverage(t *testing.T) {
	s := &diffTestCoverageUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepCoverageFileAndNoGitChanges, s.aCoverageFileAndNoGitChanges)
			sc.Step(stepCoverageFileAllChangedLinesCovered, s.aCoverageFileWhereAllChangedLinesAreCovered)
			sc.Step(stepCoverageFileSomeChangedLinesMissed, s.aCoverageFileWhereSomeChangedLinesMissed)
			sc.Step(stepCoverageFileAndChangesInExcludedFiles, s.aCoverageFileAndChangesInExcludedFiles)
			sc.Step(stepDeveloperRunsTestCoverageDiff, s.theDeveloperRunsTestCoverageDiff)
			sc.Step(stepDeveloperRunsTestCoverageDiffWithThreshold, s.theDeveloperRunsTestCoverageDiffWithAThreshold)
			sc.Step(stepDeveloperRunsTestCoverageDiffWithHighThreshold, s.theDeveloperRunsTestCoverageDiffWithAHighThreshold)
			sc.Step(stepDeveloperRunsTestCoverageDiffWithExclusion, s.theDeveloperRunsTestCoverageDiffWithExclusion)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepOutputReports100PercentCoverage, s.theOutputReports100PercentCoverage)
			sc.Step(stepExcludedFilesDoNotAffectDiffResult, s.theExcludedFilesDoNotAffectTheDiffCoverageResult)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitDiffTestCoverage},
			TestingT: t,
			Tags:     "@test-coverage-diff",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}
