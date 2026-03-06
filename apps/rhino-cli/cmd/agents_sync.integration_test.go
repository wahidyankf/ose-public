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

var specsSyncAgentsDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino-cli/agents")
}()

// Scenario: Syncing converts agents and skills to OpenCode format
// Scenario: The --dry-run flag previews changes without modifying files
// Scenario: The --agents-only flag syncs agents without touching skills
// Scenario: Model names are correctly translated to OpenCode equivalents
// Scenario: Directories that are in sync pass validation
// Scenario: A description mismatch between directories fails validation
// Scenario: A count mismatch between directories fails validation

type syncAgentsSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *syncAgentsSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "sync-agents-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	syncDryRun = false
	syncAgentsOnly = false
	syncSkillsOnly = false
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *syncAgentsSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *syncAgentsSteps) createClaudeAgent(name, description, model string) error {
	agentsDir := filepath.Join(s.tmpDir, ".claude", "agents")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		return fmt.Errorf("failed to create .claude/agents dir: %w", err)
	}
	content := fmt.Sprintf("---\nname: %s\ndescription: %s\ntools: Read\nmodel: %s\ncolor: blue\nskills:\n---\nBody.\n", name, description, model)
	if err := os.WriteFile(filepath.Join(agentsDir, name+".md"), []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write agent %s: %w", name, err)
	}
	return nil
}

func (s *syncAgentsSteps) createClaudeSkill(name string) error {
	skillDir := filepath.Join(s.tmpDir, ".claude", "skills", name)
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		return fmt.Errorf("failed to create .claude/skills/%s dir: %w", name, err)
	}
	content := fmt.Sprintf("---\nname: %s\ndescription: A test skill\n---\nSkill content.\n", name)
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write SKILL.md for %s: %w", name, err)
	}
	return nil
}

func (s *syncAgentsSteps) aClaudeDirectoryWithValidAgentsAndSkills() error {
	if err := s.createClaudeAgent("sync-agent", "A sync agent", "sonnet"); err != nil {
		return err
	}
	return s.createClaudeSkill("test-skill")
}

func (s *syncAgentsSteps) aClaudeDirectoryWithAgentsAndSkillsToConvert() error {
	if err := s.createClaudeAgent("sync-agent", "A sync agent", "sonnet"); err != nil {
		return err
	}
	return s.createClaudeSkill("test-skill")
}

func (s *syncAgentsSteps) aClaudeDirectoryWithBothAgentsAndSkills() error {
	if err := s.createClaudeAgent("sync-agent", "A sync agent", "sonnet"); err != nil {
		return err
	}
	return s.createClaudeSkill("test-skill")
}

func (s *syncAgentsSteps) aClaudeAgentConfiguredWithTheSonnetModel() error {
	if err := s.createClaudeAgent("sync-agent", "A sync agent", "sonnet"); err != nil {
		return err
	}
	// Ensure the skills directory exists so the sync command does not fail on a missing skills dir
	skillsDir := filepath.Join(s.tmpDir, ".claude", "skills")
	return os.MkdirAll(skillsDir, 0755)
}

func (s *syncAgentsSteps) theDeveloperRunsSyncAgents() error {
	buf := new(bytes.Buffer)
	syncAgentsCmd.SetOut(buf)
	syncAgentsCmd.SetErr(buf)
	s.cmdErr = syncAgentsCmd.RunE(syncAgentsCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *syncAgentsSteps) theDeveloperRunsSyncAgentsWithTheDryRunFlag() error {
	syncDryRun = true
	buf := new(bytes.Buffer)
	syncAgentsCmd.SetOut(buf)
	syncAgentsCmd.SetErr(buf)
	s.cmdErr = syncAgentsCmd.RunE(syncAgentsCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *syncAgentsSteps) theDeveloperRunsSyncAgentsWithTheAgentsOnlyFlag() error {
	syncAgentsOnly = true
	buf := new(bytes.Buffer)
	syncAgentsCmd.SetOut(buf)
	syncAgentsCmd.SetErr(buf)
	s.cmdErr = syncAgentsCmd.RunE(syncAgentsCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *syncAgentsSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *syncAgentsSteps) theOpenCodeDirectoryContainsTheConvertedConfiguration() error {
	agentPath := filepath.Join(s.tmpDir, ".opencode", "agent", "sync-agent.md")
	if _, err := os.Stat(agentPath); os.IsNotExist(err) {
		return fmt.Errorf("expected .opencode/agent/sync-agent.md to exist but it does not")
	}
	skillPath := filepath.Join(s.tmpDir, ".opencode", "skill", "test-skill", "SKILL.md")
	if _, err := os.Stat(skillPath); os.IsNotExist(err) {
		return fmt.Errorf("expected .opencode/skill/test-skill/SKILL.md to exist but it does not")
	}
	return nil
}

func (s *syncAgentsSteps) theOutputDescribesThePlannedOperations() error {
	if !strings.Contains(s.cmdOutput, "SUCCESS") {
		return fmt.Errorf("expected dry-run output to contain 'SUCCESS' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *syncAgentsSteps) noFilesAreWrittenToTheOpenCodeDirectory() error {
	agentPath := filepath.Join(s.tmpDir, ".opencode", "agent", "sync-agent.md")
	if _, err := os.Stat(agentPath); !os.IsNotExist(err) {
		return fmt.Errorf("expected .opencode/agent/sync-agent.md to NOT exist in dry-run mode")
	}
	return nil
}

func (s *syncAgentsSteps) onlyAgentFilesAreWrittenToTheOpenCodeDirectory() error {
	agentPath := filepath.Join(s.tmpDir, ".opencode", "agent", "sync-agent.md")
	if _, err := os.Stat(agentPath); os.IsNotExist(err) {
		return fmt.Errorf("expected .opencode/agent/sync-agent.md to exist")
	}
	skillPath := filepath.Join(s.tmpDir, ".opencode", "skill", "test-skill", "SKILL.md")
	if _, err := os.Stat(skillPath); !os.IsNotExist(err) {
		return fmt.Errorf("expected .opencode/skill/test-skill/SKILL.md to NOT exist in agents-only mode")
	}
	return nil
}

func (s *syncAgentsSteps) theCorrespondingOpenCodeAgentUsesTheZaiGlmModel() error {
	agentPath := filepath.Join(s.tmpDir, ".opencode", "agent", "sync-agent.md")
	data, err := os.ReadFile(agentPath)
	if err != nil {
		return fmt.Errorf("failed to read .opencode/agent/sync-agent.md: %w", err)
	}
	if !strings.Contains(string(data), "zai/glm-4.7") {
		return fmt.Errorf("expected .opencode agent to contain 'zai/glm-4.7' but got:\n%s", string(data))
	}
	return nil
}

// InitializeSyncAgentsScenario registers all step definitions.
func InitializeSyncAgentsScenario(sc *godog.ScenarioContext) {
	s := &syncAgentsSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a \.claude/ directory with valid agents and skills$`, s.aClaudeDirectoryWithValidAgentsAndSkills)
	sc.Step(`^a \.claude/ directory with agents and skills to convert$`, s.aClaudeDirectoryWithAgentsAndSkillsToConvert)
	sc.Step(`^a \.claude/ directory with both agents and skills$`, s.aClaudeDirectoryWithBothAgentsAndSkills)
	sc.Step(`^a \.claude/ agent configured with the "sonnet" model$`, s.aClaudeAgentConfiguredWithTheSonnetModel)
	sc.Step(`^the developer runs agents sync$`, s.theDeveloperRunsSyncAgents)
	sc.Step(`^the developer runs agents sync with the --dry-run flag$`, s.theDeveloperRunsSyncAgentsWithTheDryRunFlag)
	sc.Step(`^the developer runs agents sync with the --agents-only flag$`, s.theDeveloperRunsSyncAgentsWithTheAgentsOnlyFlag)
	sc.Step(`^the command exits successfully$`, s.theCommandExitsSuccessfully)
	sc.Step(`^the \.opencode/ directory contains the converted configuration$`, s.theOpenCodeDirectoryContainsTheConvertedConfiguration)
	sc.Step(`^the output describes the planned operations$`, s.theOutputDescribesThePlannedOperations)
	sc.Step(`^no files are written to the \.opencode/ directory$`, s.noFilesAreWrittenToTheOpenCodeDirectory)
	sc.Step(`^only agent files are written to the \.opencode/ directory$`, s.onlyAgentFilesAreWrittenToTheOpenCodeDirectory)
	sc.Step(`^the corresponding \.opencode/ agent uses the "zai/glm-4\.7" model identifier$`, s.theCorrespondingOpenCodeAgentUsesTheZaiGlmModel)
}

func TestIntegrationSyncAgents(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeSyncAgentsScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsSyncAgentsDir},
			TestingT: t,
			Tags:     "agents-sync",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
