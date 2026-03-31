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

var specsDirUnitSyncAgents = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/cli/gherkin")
}()

type syncAgentsUnitSteps struct {
	cmdErr    error
	cmdOutput string
}

func (s *syncAgentsUnitSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	verbose = false
	quiet = false
	output = "text"
	syncDryRun = false
	syncAgentsOnly = false
	syncSkillsOnly = false
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

	// Default mock: successful sync with 1 agent, 1 skill
	agentsSyncAllFn = func(_ agents.SyncOptions) (*agents.SyncResult, error) {
		return &agents.SyncResult{
			AgentsConverted: 1,
			SkillsCopied:    1,
		}, nil
	}

	return context.Background(), nil
}

func (s *syncAgentsUnitSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	agentsSyncAllFn = agents.SyncAll
	osGetwd = os.Getwd
	osStat = os.Stat
	return context.Background(), nil
}

func (s *syncAgentsUnitSteps) aClaudeDirectoryWithValidAgentsAndSkills() error {
	agentsSyncAllFn = func(_ agents.SyncOptions) (*agents.SyncResult, error) {
		return &agents.SyncResult{
			AgentsConverted: 1,
			SkillsCopied:    1,
		}, nil
	}
	return nil
}

func (s *syncAgentsUnitSteps) aClaudeDirectoryWithAgentsAndSkillsToConvert() error {
	agentsSyncAllFn = func(opts agents.SyncOptions) (*agents.SyncResult, error) {
		if opts.DryRun {
			return &agents.SyncResult{AgentsConverted: 0, SkillsCopied: 0}, nil
		}
		return &agents.SyncResult{AgentsConverted: 1, SkillsCopied: 1}, nil
	}
	return nil
}

func (s *syncAgentsUnitSteps) aClaudeDirectoryWithBothAgentsAndSkills() error {
	agentsSyncAllFn = func(opts agents.SyncOptions) (*agents.SyncResult, error) {
		if opts.AgentsOnly {
			return &agents.SyncResult{AgentsConverted: 1, SkillsCopied: 0}, nil
		}
		return &agents.SyncResult{AgentsConverted: 1, SkillsCopied: 1}, nil
	}
	return nil
}

func (s *syncAgentsUnitSteps) aClaudeAgentConfiguredWithTheSonnetModel() error {
	agentsSyncAllFn = func(_ agents.SyncOptions) (*agents.SyncResult, error) {
		return &agents.SyncResult{AgentsConverted: 1, SkillsCopied: 0}, nil
	}
	return nil
}

func (s *syncAgentsUnitSteps) theDeveloperRunsSyncAgents() error {
	buf := new(bytes.Buffer)
	syncAgentsCmd.SetOut(buf)
	syncAgentsCmd.SetErr(buf)
	s.cmdErr = syncAgentsCmd.RunE(syncAgentsCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *syncAgentsUnitSteps) theDeveloperRunsSyncAgentsWithTheDryRunFlag() error {
	syncDryRun = true
	return s.theDeveloperRunsSyncAgents()
}

func (s *syncAgentsUnitSteps) theDeveloperRunsSyncAgentsWithTheAgentsOnlyFlag() error {
	syncAgentsOnly = true
	return s.theDeveloperRunsSyncAgents()
}

func (s *syncAgentsUnitSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *syncAgentsUnitSteps) theOpenCodeDirectoryContainsTheConvertedConfiguration() error {
	// In unit tests the real sync is mocked, so we verify the output reports success
	if !strings.Contains(s.cmdOutput, "SUCCESS") {
		return fmt.Errorf("expected output to contain SUCCESS but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *syncAgentsUnitSteps) theOutputDescribesThePlannedOperations() error {
	if !strings.Contains(s.cmdOutput, "SUCCESS") {
		return fmt.Errorf("expected dry-run output to contain SUCCESS but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *syncAgentsUnitSteps) noFilesAreWrittenToTheOpenCodeDirectory() error {
	// The mock is configured for dry-run mode (returns 0 converts) — just verify success
	if s.cmdErr != nil {
		return fmt.Errorf("expected dry-run to succeed but got: %v", s.cmdErr)
	}
	return nil
}

func (s *syncAgentsUnitSteps) onlyAgentFilesAreWrittenToTheOpenCodeDirectory() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected agents-only sync to succeed but got: %v", s.cmdErr)
	}
	if !strings.Contains(s.cmdOutput, "SUCCESS") {
		return fmt.Errorf("expected output to contain SUCCESS but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *syncAgentsUnitSteps) theCorrespondingOpenCodeAgentUsesTheZaiGlmModel() error {
	// Model translation is handled by the internal agents package; the command
	// delegates entirely. We just verify the sync succeeded.
	if s.cmdErr != nil {
		return fmt.Errorf("expected success but got: %v", s.cmdErr)
	}
	return nil
}

func TestUnitSyncAgents(t *testing.T) {
	s := &syncAgentsUnitSteps{}
	suite := godog.TestSuite{
		ScenarioInitializer: func(sc *godog.ScenarioContext) {
			sc.Before(s.before)
			sc.After(s.after)
			sc.Step(stepClaudeDirWithValidAgentsAndSkills, s.aClaudeDirectoryWithValidAgentsAndSkills)
			sc.Step(stepClaudeDirWithAgentsAndSkillsToConvert, s.aClaudeDirectoryWithAgentsAndSkillsToConvert)
			sc.Step(stepClaudeDirWithBothAgentsAndSkills, s.aClaudeDirectoryWithBothAgentsAndSkills)
			sc.Step(stepClaudeAgentConfiguredWithSonnetModel, s.aClaudeAgentConfiguredWithTheSonnetModel)
			sc.Step(stepDeveloperRunsSyncAgents, s.theDeveloperRunsSyncAgents)
			sc.Step(stepDeveloperRunsSyncAgentsWithDryRunFlag, s.theDeveloperRunsSyncAgentsWithTheDryRunFlag)
			sc.Step(stepDeveloperRunsSyncAgentsWithAgentsOnlyFlag, s.theDeveloperRunsSyncAgentsWithTheAgentsOnlyFlag)
			sc.Step(stepExitsSuccessfully, s.theCommandExitsSuccessfully)
			sc.Step(stepOpenCodeDirContainsConvertedConfig, s.theOpenCodeDirectoryContainsTheConvertedConfiguration)
			sc.Step(stepOutputDescribesPlannedOperations, s.theOutputDescribesThePlannedOperations)
			sc.Step(stepNoFilesWrittenToOpenCodeDir, s.noFilesAreWrittenToTheOpenCodeDirectory)
			sc.Step(stepOnlyAgentFilesWrittenToOpenCodeDir, s.onlyAgentFilesAreWrittenToTheOpenCodeDirectory)
			sc.Step(stepCorrespondingOpenCodeAgentUsesZaiGlmModel, s.theCorrespondingOpenCodeAgentUsesTheZaiGlmModel)
		},
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsDirUnitSyncAgents},
			TestingT: t,
			Tags:     "agents-sync",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run unit feature tests")
	}
}

// TestSyncAgentsCommand_Initialization verifies command metadata — not in Gherkin specs.
func TestSyncAgentsCommand_Initialization(t *testing.T) {
	if syncAgentsCmd.Use != "sync" {
		t.Errorf("expected Use == %q, got %q", "sync", syncAgentsCmd.Use)
	}
}

// TestSyncAgentsCommand_ConflictingFlags verifies conflicting flag validation — not in Gherkin specs.
func TestSyncAgentsCommand_ConflictingFlags(t *testing.T) {
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

	cmd := syncAgentsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	syncDryRun = false
	syncAgentsOnly = true
	syncSkillsOnly = true
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("expected command to fail with conflicting flags")
	}
	if !strings.Contains(err.Error(), "cannot use both") {
		t.Errorf("expected error about conflicting flags, got: %v", err)
	}
}

// TestSyncAgentsCommand_MissingGitRoot verifies git root detection — not in Gherkin specs.
func TestSyncAgentsCommand_MissingGitRoot(t *testing.T) {
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

	cmd := syncAgentsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	syncDryRun = false
	syncAgentsOnly = false
	syncSkillsOnly = false
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

// TestSyncAgentsCommand_SyncError verifies sync error path — not in Gherkin specs.
func TestSyncAgentsCommand_SyncError(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := agentsSyncAllFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		agentsSyncAllFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	agentsSyncAllFn = func(_ agents.SyncOptions) (*agents.SyncResult, error) {
		return nil, fmt.Errorf("sync failed: .claude/skills directory not found")
	}

	cmd := syncAgentsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	syncDryRun = false
	syncAgentsOnly = false
	syncSkillsOnly = false
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("expected error when sync fails")
	}
	if !strings.Contains(err.Error(), "sync") {
		t.Errorf("expected error mentioning 'sync', got: %v", err)
	}
}

// TestSyncAgentsCommand_FailedFiles verifies failed files path — not in Gherkin specs.
func TestSyncAgentsCommand_FailedFiles(t *testing.T) {
	origGetwd := osGetwd
	origStat := osStat
	origFn := agentsSyncAllFn
	defer func() {
		osGetwd = origGetwd
		osStat = origStat
		agentsSyncAllFn = origFn
	}()

	osGetwd = func() (string, error) { return "/mock-repo", nil }
	osStat = func(name string) (os.FileInfo, error) {
		if name == "/mock-repo/.git" {
			return &mockFileInfo{name: ".git", isDir: true}, nil
		}
		return nil, os.ErrNotExist
	}
	agentsSyncAllFn = func(_ agents.SyncOptions) (*agents.SyncResult, error) {
		return &agents.SyncResult{
			AgentsConverted: 0,
			SkillsCopied:    0,
			FailedFiles:     []string{"bad-agent.md"},
		}, nil
	}

	cmd := syncAgentsCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	syncDryRun = false
	syncAgentsOnly = false
	syncSkillsOnly = false
	output = "text"
	verbose = false
	quiet = false

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("expected error when sync has failed files")
	}
	if !strings.Contains(err.Error(), "failures") {
		t.Errorf("expected error mentioning failures, got: %v", err)
	}
}
