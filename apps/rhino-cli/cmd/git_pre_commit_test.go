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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/git"
)

var specsDirUnitGitPreCommit = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type gitPreCommitUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *gitPreCommitUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.cmdErr = nil
	s.cmdOutput = ""

	// Default: git root is found, Run succeeds
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	gitRunFn = func(_ string, _ git.Deps) error {
		return nil
	}
	gitDefaultDepsFn = git.DefaultDeps

	return context.Background(), nil
}

func (s *gitPreCommitUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	gitRunFn = git.Run
	gitDefaultDepsFn = git.DefaultDeps
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *gitPreCommitUnitSteps) theDeveloperIsOutsideAGitRepository() error {
	// Mock findGitRoot to fail by returning a path with no .git
	osGetwd = func() (string, error) { return "/no-git-here", nil }
	osStat = func(_ string) (os.FileInfo, error) {
		return nil, os.ErrNotExist
	}
	return nil
}

func (s *gitPreCommitUnitSteps) theDeveloperRunsGitPreCommit() error {
	buf := new(bytes.Buffer)
	gitPreCommitCmd.SetOut(buf)
	gitPreCommitCmd.SetErr(buf)
	s.cmdErr = gitPreCommitCmd.RunE(gitPreCommitCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *gitPreCommitUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *gitPreCommitUnitSteps) theOutputMentionsGitRepositoryNotFound() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	if !strings.Contains(combined, "git") {
		return fmt.Errorf("expected output or error to mention 'git' but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func TestUnitGitPreCommit(t *testing.T) {
	s := &gitPreCommitUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepDeveloperIsOutsideGitRepository, s.theDeveloperIsOutsideAGitRepository)
			sc.Step(stepDeveloperRunsGitPreCommit, s.theDeveloperRunsGitPreCommit)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepOutputMentionsGitRepositoryNotFound, s.theOutputMentionsGitRepositoryNotFound)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitGitPreCommit},
			TestingT: t,
			Tags:     "git-pre-commit",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestGitPreCommitCommand_HasCorrectUse verifies the command Use field.
// This is a non-BDD test because command metadata is not in Gherkin specs.
func TestGitPreCommitCommand_HasCorrectUse(t *testing.T) {
	if gitPreCommitCmd.Use != "pre-commit" {
		t.Errorf("expected Use='pre-commit', got %q", gitPreCommitCmd.Use)
	}
}

// TestGitPreCommitCommand_IsRegisteredWithGitCmd verifies registration under gitCmd.
// This is a non-BDD test covering command registration not in Gherkin specs.
func TestGitPreCommitCommand_IsRegisteredWithGitCmd(t *testing.T) {
	found := false
	for _, sub := range gitCmd.Commands() {
		if sub.Use == "pre-commit" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected pre-commit to be registered with gitCmd")
	}
}

// TestGitPreCommitCommand_RunError verifies that gitRunFn errors propagate.
// This is a non-BDD test covering the error propagation path not in Gherkin specs.
func TestGitPreCommitCommand_RunError(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origRunFn := gitRunFn
	origDefaultDepsFn := gitDefaultDepsFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		gitRunFn = origRunFn
		gitDefaultDepsFn = origDefaultDepsFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	gitRunFn = func(_ string, _ git.Deps) error {
		return fmt.Errorf("lint-staged failed")
	}
	gitDefaultDepsFn = git.DefaultDeps

	buf := new(bytes.Buffer)
	gitPreCommitCmd.SetOut(buf)
	gitPreCommitCmd.SetErr(buf)

	err := gitPreCommitCmd.RunE(gitPreCommitCmd, []string{})
	if err == nil {
		t.Fatal("expected error when gitRunFn fails")
	}
	if !strings.Contains(err.Error(), "lint-staged failed") {
		t.Errorf("expected error to mention 'lint-staged failed', got: %v", err)
	}
}
