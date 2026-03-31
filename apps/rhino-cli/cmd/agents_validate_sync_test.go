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
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/agents"
)

var specsDirUnitValidateSync = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

type validateSyncUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *validateSyncUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	s.cmdErr = nil
	s.cmdOutput = ""

	// Mock findGitRoot
	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}

	// Default: fully in sync
	agentsValidateSyncFn = func(_ string) (*agents.ValidationResult, error) {
		return &agents.ValidationResult{
			TotalChecks:  2,
			PassedChecks: 2,
			FailedChecks: 0,
			Checks:       makeAllPassedChecks(2),
		}, nil
	}

	return context.Background(), nil
}

func (s *validateSyncUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	agentsValidateSyncFn = agents.ValidateSync
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *validateSyncUnitSteps) claudeAndOpencodeConfigsThatAreFullySynchronised() error {
	agentsValidateSyncFn = func(_ string) (*agents.ValidationResult, error) {
		return &agents.ValidationResult{
			TotalChecks:  2,
			PassedChecks: 2,
			FailedChecks: 0,
			Checks:       makeAllPassedChecks(2),
		}, nil
	}
	return nil
}

func (s *validateSyncUnitSteps) anAgentInClaudeWhoseDescriptionDiffersFromItsOpenCodeCounterpart() error {
	agentsValidateSyncFn = func(_ string) (*agents.ValidationResult, error) {
		return &agents.ValidationResult{
			TotalChecks:  1,
			PassedChecks: 0,
			FailedChecks: 1,
			Checks: []agents.ValidationCheck{
				{
					Name:     "sync-agent description",
					Status:   "failed",
					Expected: "A sync agent",
					Actual:   "Different description",
					Message:  "description mismatch for agent sync-agent",
				},
			},
		}, nil
	}
	return nil
}

func (s *validateSyncUnitSteps) claudeContainingMoreAgentsThanOpenCode() error {
	agentsValidateSyncFn = func(_ string) (*agents.ValidationResult, error) {
		return &agents.ValidationResult{
			TotalChecks:  1,
			PassedChecks: 0,
			FailedChecks: 1,
			Checks: []agents.ValidationCheck{
				{
					Name:     "agent count",
					Status:   "failed",
					Expected: "2",
					Actual:   "1",
					Message:  "agent count mismatch: .claude has 2, .opencode has 1",
				},
			},
		}, nil
	}
	return nil
}

func (s *validateSyncUnitSteps) theDeveloperRunsValidateSync() error {
	buf := new(bytes.Buffer)
	validateSyncCmd.SetOut(buf)
	validateSyncCmd.SetErr(buf)
	s.cmdErr = validateSyncCmd.RunE(validateSyncCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateSyncUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateSyncUnitSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateSyncUnitSteps) theOutputReportsAllSyncChecksAsPassing() error {
	if !strings.Contains(s.cmdOutput, "VALIDATION PASSED") {
		return fmt.Errorf("expected output to contain 'VALIDATION PASSED' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateSyncUnitSteps) theOutputIdentifiesTheAgentWithTheMismatchedDescription() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	lc := strings.ToLower(combined)
	if !strings.Contains(lc, "failed") && !strings.Contains(lc, "validation failed") {
		return fmt.Errorf("expected output to identify failed check but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func (s *validateSyncUnitSteps) theOutputReportsTheAgentCountMismatch() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	lc := strings.ToLower(combined)
	if !strings.Contains(lc, "failed") && !strings.Contains(lc, "validation failed") {
		return fmt.Errorf("expected output to report count mismatch but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func TestUnitValidateSync(t *testing.T) {
	s := &validateSyncUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepClaudeAndOpenCodeConfigsFullySynchronised, s.claudeAndOpencodeConfigsThatAreFullySynchronised)
			sc.Step(stepAgentInClaudeWithDescriptionMismatch, s.anAgentInClaudeWhoseDescriptionDiffersFromItsOpenCodeCounterpart)
			sc.Step(stepClaudeContainingMoreAgentsThanOpenCode, s.claudeContainingMoreAgentsThanOpenCode)
			sc.Step(stepDeveloperRunsValidateSync, s.theDeveloperRunsValidateSync)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.theCommandExitsWithAFailureCode)
			sc.Step(stepOutputReportsAllSyncChecksAsPassing, s.theOutputReportsAllSyncChecksAsPassing)
			sc.Step(stepOutputIdentifiesAgentWithMismatchedDescription, s.theOutputIdentifiesTheAgentWithTheMismatchedDescription)
			sc.Step(stepOutputReportsAgentCountMismatch, s.theOutputReportsTheAgentCountMismatch)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitValidateSync},
			TestingT: t,
			Tags:     "agents-validate-sync",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestValidateSyncCommand_MissingGitRoot verifies git root detection — not in Gherkin specs.
func TestValidateSyncCommand_MissingGitRoot(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/no-git-here", nil }
	osStat = func(_ string) (os.FileInfo, error) { return nil, os.ErrNotExist }

	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("expected error when no .git directory found")
	}
	if !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error mentioning 'git', got: %v", err)
	}
}

// TestValidateSyncCommand_ValidationError verifies error path from ValidateSync — not in Gherkin specs.
func TestValidateSyncCommand_ValidationError(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := agentsValidateSyncFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		agentsValidateSyncFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	agentsValidateSyncFn = func(_ string) (*agents.ValidationResult, error) {
		return nil, fmt.Errorf("failed to read .opencode directory")
	}

	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("expected error when ValidateSync returns error")
	}
}

// TestValidateSyncCommand_EmptyDirectories verifies empty dir sync — not in Gherkin specs.
func TestValidateSyncCommand_EmptyDirectories(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := agentsValidateSyncFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		agentsValidateSyncFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	agentsValidateSyncFn = func(_ string) (*agents.ValidationResult, error) {
		return &agents.ValidationResult{
			TotalChecks:  0,
			PassedChecks: 0,
			FailedChecks: 0,
		}, nil
	}

	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err != nil {
		t.Errorf("expected success with empty directories, got: %v", err)
	}
	if !strings.Contains(buf.String(), "VALIDATION PASSED") {
		t.Errorf("expected 'VALIDATION PASSED' in output, got: %s", buf.String())
	}
}
