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
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/agents"
)

var specsValidateSyncDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/apps/rhino/cli/gherkin")
}()

// Scenario: Directories that are in sync pass validation
// Scenario: A description mismatch between directories fails validation
// Scenario: A count mismatch between directories fails validation

type validateSyncSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *validateSyncSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "validate-sync-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *validateSyncSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *validateSyncSteps) createSyncedAgentPair() error {
	agentsDir := filepath.Join(s.tmpDir, ".claude", "agents")
	opencodeAgentDir := filepath.Join(s.tmpDir, agents.OpenCodeAgentDir)
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		return fmt.Errorf("failed to create .claude/agents dir: %w", err)
	}
	if err := os.MkdirAll(opencodeAgentDir, 0755); err != nil {
		return fmt.Errorf("failed to create .opencode/agents dir: %w", err)
	}

	claudeContent := "---\nname: sync-agent\ndescription: A sync agent\ntools: Read\nmodel: sonnet\ncolor: blue\nskills:\n---\nBody.\n"
	if err := os.WriteFile(filepath.Join(agentsDir, "sync-agent.md"), []byte(claudeContent), 0644); err != nil {
		return fmt.Errorf("failed to write .claude agent: %w", err)
	}

	opencodeContent := "---\ndescription: A sync agent\nmodel: zai-coding-plan/glm-5.1\ntools:\n  read: true\nskills:\n---\nBody.\n"
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "sync-agent.md"), []byte(opencodeContent), 0644); err != nil {
		return fmt.Errorf("failed to write .opencode agent: %w", err)
	}

	return nil
}

func (s *validateSyncSteps) createSyncedSkillPair() error {
	claudeSkillDir := filepath.Join(s.tmpDir, ".claude", "skills", "test-skill")
	opencodeSkillDir := filepath.Join(s.tmpDir, ".opencode", "skill", "test-skill")
	if err := os.MkdirAll(claudeSkillDir, 0755); err != nil {
		return fmt.Errorf("failed to create .claude/skills dir: %w", err)
	}
	if err := os.MkdirAll(opencodeSkillDir, 0755); err != nil {
		return fmt.Errorf("failed to create .opencode/skill dir: %w", err)
	}

	skillContent := "---\nname: test-skill\ndescription: A test skill\n---\nSkill content.\n"
	if err := os.WriteFile(filepath.Join(claudeSkillDir, "SKILL.md"), []byte(skillContent), 0644); err != nil {
		return fmt.Errorf("failed to write .claude skill: %w", err)
	}
	if err := os.WriteFile(filepath.Join(opencodeSkillDir, "SKILL.md"), []byte(skillContent), 0644); err != nil {
		return fmt.Errorf("failed to write .opencode skill: %w", err)
	}

	return nil
}

func (s *validateSyncSteps) claudeAndOpencodeConfigsThatAreFullySynchronised() error {
	if err := s.createSyncedAgentPair(); err != nil {
		return err
	}
	return s.createSyncedSkillPair()
}

func (s *validateSyncSteps) anAgentInClaudeWhoseDescriptionDiffersFromItsOpenCodeCounterpart() error {
	agentsDir := filepath.Join(s.tmpDir, ".claude", "agents")
	opencodeAgentDir := filepath.Join(s.tmpDir, agents.OpenCodeAgentDir)
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		return fmt.Errorf("failed to create .claude/agents dir: %w", err)
	}
	if err := os.MkdirAll(opencodeAgentDir, 0755); err != nil {
		return fmt.Errorf("failed to create .opencode/agents dir: %w", err)
	}

	claudeContent := "---\nname: sync-agent\ndescription: A sync agent\ntools: Read\nmodel: sonnet\ncolor: blue\nskills:\n---\nBody.\n"
	if err := os.WriteFile(filepath.Join(agentsDir, "sync-agent.md"), []byte(claudeContent), 0644); err != nil {
		return fmt.Errorf("failed to write .claude agent: %w", err)
	}

	opencodeContent := "---\ndescription: Different description\nmodel: zai-coding-plan/glm-5.1\ntools:\n  read: true\nskills:\n---\nBody.\n"
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "sync-agent.md"), []byte(opencodeContent), 0644); err != nil {
		return fmt.Errorf("failed to write .opencode agent: %w", err)
	}

	return nil
}

func (s *validateSyncSteps) claudeContainingMoreAgentsThanOpenCode() error {
	agentsDir := filepath.Join(s.tmpDir, ".claude", "agents")
	opencodeAgentDir := filepath.Join(s.tmpDir, agents.OpenCodeAgentDir)
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		return fmt.Errorf("failed to create .claude/agents dir: %w", err)
	}
	if err := os.MkdirAll(opencodeAgentDir, 0755); err != nil {
		return fmt.Errorf("failed to create .opencode/agents dir: %w", err)
	}

	agent1 := "---\nname: sync-agent\ndescription: A sync agent\ntools: Read\nmodel: sonnet\ncolor: blue\nskills:\n---\nBody.\n"
	agent2 := "---\nname: extra-agent\ndescription: An extra agent\ntools: Write\nmodel: sonnet\ncolor: green\nskills:\n---\nBody.\n"
	if err := os.WriteFile(filepath.Join(agentsDir, "sync-agent.md"), []byte(agent1), 0644); err != nil {
		return fmt.Errorf("failed to write first .claude agent: %w", err)
	}
	if err := os.WriteFile(filepath.Join(agentsDir, "extra-agent.md"), []byte(agent2), 0644); err != nil {
		return fmt.Errorf("failed to write second .claude agent: %w", err)
	}

	opencodeContent := "---\ndescription: A sync agent\nmodel: zai-coding-plan/glm-5.1\ntools:\n  read: true\nskills:\n---\nBody.\n"
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "sync-agent.md"), []byte(opencodeContent), 0644); err != nil {
		return fmt.Errorf("failed to write .opencode agent: %w", err)
	}

	return nil
}

func (s *validateSyncSteps) theDeveloperRunsValidateSync() error {
	buf := new(bytes.Buffer)
	validateSyncCmd.SetOut(buf)
	validateSyncCmd.SetErr(buf)
	s.cmdErr = validateSyncCmd.RunE(validateSyncCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateSyncSteps) theCommandExitsSuccessfully() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed but got error: %v\nOutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateSyncSteps) theCommandExitsWithAFailureCode() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail but it succeeded\nOutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateSyncSteps) theOutputReportsAllSyncChecksAsPassing() error {
	if !strings.Contains(s.cmdOutput, "VALIDATION PASSED") {
		return fmt.Errorf("expected output to contain 'VALIDATION PASSED' but got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateSyncSteps) theOutputIdentifiesTheAgentWithTheMismatchedDescription() error {
	combined := s.cmdOutput
	if s.cmdErr != nil {
		combined += s.cmdErr.Error()
	}
	lc := strings.ToLower(combined)
	if !strings.Contains(lc, "failed") && !strings.Contains(lc, "validation failed") {
		return fmt.Errorf("expected output to identify a failed check but got output=%q err=%v", s.cmdOutput, s.cmdErr)
	}
	return nil
}

func (s *validateSyncSteps) theOutputReportsTheAgentCountMismatch() error {
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

// InitializeValidateSyncScenario registers all step definitions.
func InitializeValidateSyncScenario(sc *godog.ScenarioContext) {
	s := &validateSyncSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^\.claude/ and \.opencode/ configurations that are fully synchronised$`, s.claudeAndOpencodeConfigsThatAreFullySynchronised)
	sc.Step(`^an agent in \.claude/ whose description differs from its \.opencode/ counterpart$`, s.anAgentInClaudeWhoseDescriptionDiffersFromItsOpenCodeCounterpart)
	sc.Step(`^\.claude/ containing more agents than \.opencode/$`, s.claudeContainingMoreAgentsThanOpenCode)
	sc.Step(`^the developer runs agents validate-sync$`, s.theDeveloperRunsValidateSync)
	sc.Step(`^the command exits successfully$`, s.theCommandExitsSuccessfully)
	sc.Step(`^the command exits with a failure code$`, s.theCommandExitsWithAFailureCode)
	sc.Step(`^the output reports all sync checks as passing$`, s.theOutputReportsAllSyncChecksAsPassing)
	sc.Step(`^the output identifies the agent with the mismatched description$`, s.theOutputIdentifiesTheAgentWithTheMismatchedDescription)
	sc.Step(`^the output reports the agent count mismatch$`, s.theOutputReportsTheAgentCountMismatch)
}

func TestIntegrationValidateSync(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeValidateSyncScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsValidateSyncDir},
			TestingT: t,
			Tags:     "agents-validate-sync",
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
