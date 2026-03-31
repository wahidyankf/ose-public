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

var specsGitPreCommitDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

// Scenario: Running pre-commit outside a git repository fails

type gitPreCommitSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *gitPreCommitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "git-pre-commit-*")
	// No .git directory — ensures findGitRoot() fails immediately.
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *gitPreCommitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *gitPreCommitSteps) theDeveloperIsOutsideAGitRepository() error {
	// tmpDir has no .git directory — already set up in before().
	return nil
}

func (s *gitPreCommitSteps) runGitPreCommit() error {
	buf := new(bytes.Buffer)
	gitPreCommitCmd.SetOut(buf)
	gitPreCommitCmd.SetErr(buf)
	s.cmdErr = gitPreCommitCmd.RunE(gitPreCommitCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *gitPreCommitSteps) commandExitsWithFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail, but it succeeded\noutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *gitPreCommitSteps) outputMentionsGitRepositoryNotFound() error {
	combined := s.cmdOutput + s.cmdErr.Error()
	if !strings.Contains(combined, "git") {
		return fmt.Errorf("expected output or error to mention 'git', got output=%q err=%q",
			s.cmdOutput, s.cmdErr)
	}
	return nil
}

func InitializeGitPreCommitScenario(sc *godog.ScenarioContext) {
	s := &gitPreCommitSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^the developer is outside a git repository$`, s.theDeveloperIsOutsideAGitRepository)
	sc.Step(`^the developer runs rhino-cli git pre-commit$`, s.runGitPreCommit)
	sc.Step(`^the command exits with a failure code$`, s.commandExitsWithFailureCode)
	sc.Step(`^the output mentions that a git repository was not found$`, s.outputMentionsGitRepositoryNotFound)
}

func TestIntegrationGitPreCommit(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeGitPreCommitScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsGitPreCommitDir},
			Tags:     "git-pre-commit",
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
