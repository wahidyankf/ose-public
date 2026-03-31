//go:build integration

package cmd

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/cucumber/godog"
)

var specsDiffTestCoverageDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

// Scenario: No changed lines reports 100% coverage
// Scenario: Changed lines with full coverage pass threshold
// Scenario: Changed lines with missing coverage fail threshold
// Scenario: Excluded files are not counted in diff coverage

type diffTestCoverageIntegrationSteps struct {
	originalWd string
	tmpDir     string
	coverFile  string
	cmdErr     error
	cmdOutput  string
}

func (s *diffTestCoverageIntegrationSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "diff-test-coverage-integration-*")
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

	// Initialise a real git repo so findGitRoot() works and git diff runs.
	_ = exec.Command("git", "init", "-b", "main", s.tmpDir).Run()
	_ = exec.Command("git", "-C", s.tmpDir, "config", "user.email", "test@example.com").Run()
	_ = exec.Command("git", "-C", s.tmpDir, "config", "user.name", "Test User").Run()

	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *diffTestCoverageIntegrationSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

// makeInitialCommit creates an initial commit on main so that git diff main...HEAD works.
func (s *diffTestCoverageIntegrationSteps) makeInitialCommit() error {
	placeholder := filepath.Join(s.tmpDir, ".gitkeep")
	if err := os.WriteFile(placeholder, []byte(""), 0644); err != nil {
		return fmt.Errorf("write .gitkeep: %w", err)
	}
	if err := exec.Command("git", "-C", s.tmpDir, "add", ".").Run(); err != nil {
		return fmt.Errorf("git add: %w", err)
	}
	if err := exec.Command("git", "-C", s.tmpDir, "commit", "-m", "init").Run(); err != nil {
		return fmt.Errorf("git commit init: %w", err)
	}
	return nil
}

// writeCoverFile writes a Go coverage file at relPath inside tmpDir and stores relPath in s.coverFile.
func (s *diffTestCoverageIntegrationSteps) writeCoverFile(relPath, content string) error {
	absPath := filepath.Join(s.tmpDir, relPath)
	if err := os.WriteFile(absPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("write cover file: %w", err)
	}
	s.coverFile = relPath
	return nil
}

// aCoverageFileAndNoGitChanges sets up a repo where HEAD == main (no new commits),
// so git diff main...HEAD produces an empty diff.
func (s *diffTestCoverageIntegrationSteps) aCoverageFileAndNoGitChanges() error {
	if err := s.makeInitialCommit(); err != nil {
		return err
	}
	// Write a Go coverage file with 100% coverage.
	coverContent := "mode: set\n" +
		"pkg/file.go:1.1,1.9 1 1\n" +
		"pkg/file.go:2.1,2.9 1 1\n"
	return s.writeCoverFile("cover.out", coverContent)
}

// aCoverageFileWhereAllChangedLinesAreCovered creates a commit that adds a new source file,
// then writes a coverage file marking those new lines as covered.
// Uses HEAD~1 as the diff base so the new commit's changes appear in the diff.
func (s *diffTestCoverageIntegrationSteps) aCoverageFileWhereAllChangedLinesAreCovered() error {
	if err := s.makeInitialCommit(); err != nil {
		return err
	}

	// Add a new source file and commit it on main.
	srcDir := filepath.Join(s.tmpDir, "pkg")
	if err := os.MkdirAll(srcDir, 0755); err != nil {
		return fmt.Errorf("mkdir pkg: %w", err)
	}
	srcFile := filepath.Join(srcDir, "file.go")
	if err := os.WriteFile(srcFile, []byte("package pkg\n\nfunc Foo() {}\nfunc Bar() {}\nfunc Baz() {}\n"), 0644); err != nil {
		return fmt.Errorf("write src: %w", err)
	}
	if err := exec.Command("git", "-C", s.tmpDir, "add", "pkg/file.go").Run(); err != nil {
		return fmt.Errorf("git add src: %w", err)
	}
	if err := exec.Command("git", "-C", s.tmpDir, "commit", "-m", "add pkg/file.go").Run(); err != nil {
		return fmt.Errorf("git commit src: %w", err)
	}

	// Use HEAD~1 as the base so the above commit appears in the diff.
	diffBase = "HEAD~1"

	// Coverage file: lines 3-5 covered (100% of changed lines).
	coverContent := "mode: set\n" +
		"pkg/file.go:3.1,3.20 1 1\n" +
		"pkg/file.go:4.1,4.20 1 1\n" +
		"pkg/file.go:5.1,5.20 1 1\n"
	return s.writeCoverFile("cover.out", coverContent)
}

// aCoverageFileWhereSomeChangedLinesMissed creates a commit adding a source file,
// then writes a coverage file where some of those lines are uncovered.
// Uses HEAD~1 as the diff base so the new commit's changes appear in the diff.
func (s *diffTestCoverageIntegrationSteps) aCoverageFileWhereSomeChangedLinesMissed() error {
	if err := s.makeInitialCommit(); err != nil {
		return err
	}

	srcDir := filepath.Join(s.tmpDir, "pkg")
	if err := os.MkdirAll(srcDir, 0755); err != nil {
		return fmt.Errorf("mkdir pkg: %w", err)
	}
	srcFile := filepath.Join(srcDir, "file.go")
	if err := os.WriteFile(srcFile, []byte("package pkg\n\nfunc Foo() {}\nfunc Bar() {}\nfunc Baz() {}\n"), 0644); err != nil {
		return fmt.Errorf("write src: %w", err)
	}
	if err := exec.Command("git", "-C", s.tmpDir, "add", "pkg/file.go").Run(); err != nil {
		return fmt.Errorf("git add src: %w", err)
	}
	if err := exec.Command("git", "-C", s.tmpDir, "commit", "-m", "add pkg/file.go").Run(); err != nil {
		return fmt.Errorf("git commit src: %w", err)
	}

	// Use HEAD~1 as the base so the above commit appears in the diff.
	diffBase = "HEAD~1"

	// Coverage file: lines 3-5 where lines 4 and 5 are NOT covered (~33% coverage).
	coverContent := "mode: set\n" +
		"pkg/file.go:3.1,3.20 1 1\n" +
		"pkg/file.go:4.1,4.20 1 0\n" +
		"pkg/file.go:5.1,5.20 1 0\n"
	return s.writeCoverFile("cover.out", coverContent)
}

// aCoverageFileAndChangesInExcludedFiles creates a commit that adds a file in a
// generated/ directory, then excludes it so the diff coverage is 100%.
// Uses HEAD~1 as the diff base so the new commit's changes appear in the diff.
func (s *diffTestCoverageIntegrationSteps) aCoverageFileAndChangesInExcludedFiles() error {
	if err := s.makeInitialCommit(); err != nil {
		return err
	}

	genDir := filepath.Join(s.tmpDir, "generated")
	if err := os.MkdirAll(genDir, 0755); err != nil {
		return fmt.Errorf("mkdir generated: %w", err)
	}
	genFile := filepath.Join(genDir, "gen.go")
	if err := os.WriteFile(genFile, []byte("package generated\n\nfunc Gen() {}\n"), 0644); err != nil {
		return fmt.Errorf("write gen: %w", err)
	}
	if err := exec.Command("git", "-C", s.tmpDir, "add", "generated/gen.go").Run(); err != nil {
		return fmt.Errorf("git add generated: %w", err)
	}
	if err := exec.Command("git", "-C", s.tmpDir, "commit", "-m", "add generated/gen.go").Run(); err != nil {
		return fmt.Errorf("git commit generated: %w", err)
	}

	// Use HEAD~1 as the base so the above commit appears in the diff.
	diffBase = "HEAD~1"

	// Coverage: the generated file has uncovered lines, but we will exclude it.
	coverContent := "mode: set\n" +
		"generated/gen.go:3.1,3.20 1 0\n"
	return s.writeCoverFile("cover.out", coverContent)
}

func (s *diffTestCoverageIntegrationSteps) theDeveloperRunsTestCoverageDiff() error {
	buf := new(bytes.Buffer)
	diffTestCoverageCmd.SetOut(buf)
	diffTestCoverageCmd.SetErr(buf)
	s.cmdErr = diffTestCoverageCmd.RunE(diffTestCoverageCmd, []string{s.coverFile})
	s.cmdOutput = buf.String()
	return nil
}

func (s *diffTestCoverageIntegrationSteps) theDeveloperRunsTestCoverageDiffWithAThreshold() error {
	diffThreshold = 80
	return s.theDeveloperRunsTestCoverageDiff()
}

func (s *diffTestCoverageIntegrationSteps) theDeveloperRunsTestCoverageDiffWithAHighThreshold() error {
	diffThreshold = 90
	return s.theDeveloperRunsTestCoverageDiff()
}

func (s *diffTestCoverageIntegrationSteps) theDeveloperRunsTestCoverageDiffWithExclusion() error {
	diffExcludePatterns = []string{"generated/*"}
	return s.theDeveloperRunsTestCoverageDiff()
}

func (s *diffTestCoverageIntegrationSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *diffTestCoverageIntegrationSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but command succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *diffTestCoverageIntegrationSteps) theOutputReports100PercentCoverage() error {
	if !strings.Contains(s.cmdOutput, "100") {
		return fmt.Errorf("expected output to contain '100' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *diffTestCoverageIntegrationSteps) theExcludedFilesDoNotAffectTheDiffCoverageResult() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func InitializeDiffTestCoverageIntegrationScenario(sc *godog.ScenarioContext) {
	s := &diffTestCoverageIntegrationSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a coverage file and no git changes$`, s.aCoverageFileAndNoGitChanges)
	sc.Step(`^a coverage file where all changed lines are covered$`, s.aCoverageFileWhereAllChangedLinesAreCovered)
	sc.Step(`^a coverage file where some changed lines are missed$`, s.aCoverageFileWhereSomeChangedLinesMissed)
	sc.Step(`^a coverage file and changes in excluded files$`, s.aCoverageFileAndChangesInExcludedFiles)
	sc.Step(`^the developer runs test-coverage diff$`, s.theDeveloperRunsTestCoverageDiff)
	sc.Step(`^the developer runs test-coverage diff with a threshold$`, s.theDeveloperRunsTestCoverageDiffWithAThreshold)
	sc.Step(`^the developer runs test-coverage diff with a high threshold$`, s.theDeveloperRunsTestCoverageDiffWithAHighThreshold)
	sc.Step(`^the developer runs test-coverage diff with exclusion$`, s.theDeveloperRunsTestCoverageDiffWithExclusion)
	sc.Step(`^the command exits successfully$`, s.theCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theCommandExitsWithAFailureCode)
	sc.Step(`^the output reports 100% coverage$`, s.theOutputReports100PercentCoverage)
	sc.Step(`^the excluded files do not affect the diff coverage result$`, s.theExcludedFilesDoNotAffectTheDiffCoverageResult)
}

func TestIntegrationTestCoverageDiff(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeDiffTestCoverageIntegrationScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDiffTestCoverageDir},
			TestingT: t,
			Tags:     "@test-coverage-diff",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
