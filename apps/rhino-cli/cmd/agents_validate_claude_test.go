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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/agents"
)

var specsDirUnitValidateClaude = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

type validateClaudeUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *validateClaudeUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	agentsOnly = false
	skillsOnly = false
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

	// Default: all valid
	agentsValidateClaudeFn = func(_ agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
		return &agents.ValidationResult{
			TotalChecks:  18,
			PassedChecks: 18,
			FailedChecks: 0,
			Checks:       makeAllPassedChecks(18),
		}, nil
	}

	return context.Background(), nil
}

func (s *validateClaudeUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	agentsValidateClaudeFn = agents.ValidateClaude
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

// makeAllPassedChecks creates n validation checks all with "passed" status.
func makeAllPassedChecks(n int) []agents.ValidationCheck {
	checks := make([]agents.ValidationCheck, n)
	for i := range checks {
		checks[i] = agents.ValidationCheck{
			Name:   fmt.Sprintf("check-%d", i+1),
			Status: "passed",
		}
	}
	return checks
}

// makeFailedResult creates a ValidationResult with one failed check.
func makeFailedResult(message string) *agents.ValidationResult {
	return &agents.ValidationResult{
		TotalChecks:  1,
		PassedChecks: 0,
		FailedChecks: 1,
		Checks: []agents.ValidationCheck{
			{Name: "check-1", Status: "failed", Message: message},
		},
	}
}

func (s *validateClaudeUnitSteps) aClaudeDirWhereAllAgentsAndSkillsAreValid() error {
	agentsValidateClaudeFn = func(_ agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
		return &agents.ValidationResult{
			TotalChecks:  18,
			PassedChecks: 18,
			FailedChecks: 0,
			Checks:       makeAllPassedChecks(18),
		}, nil
	}
	return nil
}

func (s *validateClaudeUnitSteps) aClaudeDirWithAgentMissingToolsField() error {
	agentsValidateClaudeFn = func(_ agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
		return makeFailedResult("required field 'tools' is missing"), nil
	}
	return nil
}

func (s *validateClaudeUnitSteps) aClaudeDirWithTwoAgentsDeclaringSameName() error {
	agentsValidateClaudeFn = func(_ agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
		return makeFailedResult("duplicate agent name: same-agent"), nil
	}
	return nil
}

func (s *validateClaudeUnitSteps) aClaudeDirWhereAgentsAreValidButSkillsHaveIssues() error {
	agentsValidateClaudeFn = func(opts agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
		if opts.AgentsOnly {
			return &agents.ValidationResult{
				TotalChecks:  11,
				PassedChecks: 11,
				FailedChecks: 0,
				Checks:       makeAllPassedChecks(11),
			}, nil
		}
		return makeFailedResult("skill missing required field 'description'"), nil
	}
	return nil
}

func (s *validateClaudeUnitSteps) aClaudeDirWhereSkillsAreValidButAgentsHaveIssues() error {
	agentsValidateClaudeFn = func(opts agents.ValidateClaudeOptions) (*agents.ValidationResult, error) {
		if opts.SkillsOnly {
			return &agents.ValidationResult{
				TotalChecks:  7,
				PassedChecks: 7,
				FailedChecks: 0,
				Checks:       makeAllPassedChecks(7),
			}, nil
		}
		return makeFailedResult("agent missing required field 'tools'"), nil
	}
	return nil
}

func (s *validateClaudeUnitSteps) runValidateClaude() error {
	buf := new(bytes.Buffer)
	validateClaudeCmd.SetOut(buf)
	validateClaudeCmd.SetErr(buf)
	s.cmdErr = validateClaudeCmd.RunE(validateClaudeCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateClaudeUnitSteps) runValidateClaudeWithAgentsOnlyFlag() error {
	agentsOnly = true
	return s.runValidateClaude()
}

func (s *validateClaudeUnitSteps) runValidateClaudeWithSkillsOnlyFlag() error {
	skillsOnly = true
	return s.runValidateClaude()
}

func (s *validateClaudeUnitSteps) commandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateClaudeUnitSteps) commandExitsWithFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected failure but succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateClaudeUnitSteps) outputReportsAllChecksAsPassing() error {
	if !strings.Contains(s.cmdOutput, "VALIDATION PASSED") {
		return fmt.Errorf("expected output to contain 'VALIDATION PASSED' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateClaudeUnitSteps) outputIdentifiesAgentAndMissingField() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	lc := strings.ToLower(combined)
	if !strings.Contains(lc, "failed") && !strings.Contains(lc, "validation failed") {
		return fmt.Errorf("expected output to identify validation failure but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func (s *validateClaudeUnitSteps) outputReportsDuplicateAgentName() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	lc := strings.ToLower(combined)
	if !strings.Contains(lc, "same-agent") && !strings.Contains(lc, "duplicate") && !strings.Contains(lc, "failed") {
		return fmt.Errorf("expected output to report duplicate agent name but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func TestUnitValidateClaude(t *testing.T) {
	s := &validateClaudeUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepClaudeDirWhereAllAgentsAndSkillsValid, s.aClaudeDirWhereAllAgentsAndSkillsAreValid)
			sc.Step(stepClaudeDirWhereOneAgentMissingToolsField, s.aClaudeDirWithAgentMissingToolsField)
			sc.Step(stepClaudeDirWithTwoAgentsSameName, s.aClaudeDirWithTwoAgentsDeclaringSameName)
			sc.Step(stepClaudeDirAgentsValidButSkillsHaveIssues, s.aClaudeDirWhereAgentsAreValidButSkillsHaveIssues)
			sc.Step(stepClaudeDirSkillsValidButAgentsHaveIssues, s.aClaudeDirWhereSkillsAreValidButAgentsHaveIssues)
			sc.Step(stepDeveloperRunsValidateClaude, s.runValidateClaude)
			sc.Step(stepDeveloperRunsValidateClaudeWithAgentsOnlyFlag, s.runValidateClaudeWithAgentsOnlyFlag)
			sc.Step(stepDeveloperRunsValidateClaudeWithSkillsOnlyFlag, s.runValidateClaudeWithSkillsOnlyFlag)
			sc.Step(stepExitsSuccessfully, s.commandExitsSuccessfully)
			sc.Step(stepExitsWithFailure, s.commandExitsWithFailureCode)
			sc.Step(stepOutputReportsAllChecksAsPassing, s.outputReportsAllChecksAsPassing)
			sc.Step(stepOutputIdentifiesAgentAndMissingField, s.outputIdentifiesAgentAndMissingField)
			sc.Step(stepOutputReportsDuplicateAgentName, s.outputReportsDuplicateAgentName)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitValidateClaude},
			TestingT: t,
			Tags:     "agents-validate-claude",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestValidateClaudeCommand_ConflictingFlags verifies flag conflict detection — not in Gherkin specs.
func TestValidateClaudeCommand_ConflictingFlags(t *testing.T) {
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

	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	agentsOnly = true
	skillsOnly = true
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("expected command to fail with conflicting flags")
	}
	if !strings.Contains(err.Error(), "cannot use") {
		t.Errorf("expected error message about conflicting flags, got: %v", err)
	}
}

// TestValidateClaudeCommand_MissingGitRoot verifies git root detection — not in Gherkin specs.
func TestValidateClaudeCommand_MissingGitRoot(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
	}()

	osGetwd = func() (string, error) { return "/no-git-here", nil }
	osStat = func(_ string) (os.FileInfo, error) { return nil, os.ErrNotExist }

	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	agentsOnly = false
	skillsOnly = false
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Fatal("expected error when no .git directory found")
	}
	if !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error mentioning 'git', got: %v", err)
	}
}
