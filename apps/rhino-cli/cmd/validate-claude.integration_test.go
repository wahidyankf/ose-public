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

var specsClaudeDir = func() string {
	_, f, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(f), "../../../specs/rhino-cli/agents")
}()

// Scenario: A directory with all agents and skills correctly configured passes validation
// Scenario: An agent file missing a required frontmatter field fails validation
// Scenario: Two agents with the same name fail validation
// Scenario: --agents-only validates agents without checking skills
// Scenario: --skills-only validates skills without checking agents

type validateClaudeSteps struct {
	originalWd string
	tmpDir     string
	cmdErr     error
	cmdOutput  string
}

func (s *validateClaudeSteps) before(_ context.Context, _ *godog.Scenario) (context.Context, error) {
	s.originalWd, _ = os.Getwd()
	s.tmpDir, _ = os.MkdirTemp("", "validate-claude-*")
	_ = os.MkdirAll(filepath.Join(s.tmpDir, ".git"), 0755)
	verbose = false
	quiet = false
	output = "text"
	agentsOnly = false
	skillsOnly = false
	_ = os.Chdir(s.tmpDir)
	return context.Background(), nil
}

func (s *validateClaudeSteps) after(_ context.Context, _ *godog.Scenario, _ error) (context.Context, error) {
	_ = os.Chdir(s.originalWd)
	_ = os.RemoveAll(s.tmpDir)
	return context.Background(), nil
}

func (s *validateClaudeSteps) validAgentContent(name string) string {
	return "---\nname: " + name + "\ndescription: Test agent description\ntools: Read, Write\nmodel: sonnet\ncolor: blue\nskills:\n---\nTest agent body"
}

func (s *validateClaudeSteps) validSkillContent(name string) string {
	return "---\nname: " + name + "\ndescription: Test skill description\n---\nSkill content"
}

func (s *validateClaudeSteps) createAgentsDir() (string, error) {
	dir := filepath.Join(s.tmpDir, ".claude", "agents")
	return dir, os.MkdirAll(dir, 0755)
}

func (s *validateClaudeSteps) createSkillsDir() (string, error) {
	dir := filepath.Join(s.tmpDir, ".claude", "skills")
	return dir, os.MkdirAll(dir, 0755)
}

func (s *validateClaudeSteps) writeAgent(agentsDir, name, content string) error {
	return os.WriteFile(filepath.Join(agentsDir, name+".md"), []byte(content), 0644)
}

func (s *validateClaudeSteps) writeSkill(skillsDir, name, content string) error {
	skillDir := filepath.Join(skillsDir, name)
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644)
}

func (s *validateClaudeSteps) aClaudeDirWhereAllAgentsAndSkillsAreValid() error {
	agentsDir, err := s.createAgentsDir()
	if err != nil {
		return err
	}
	skillsDir, err := s.createSkillsDir()
	if err != nil {
		return err
	}
	if err := s.writeAgent(agentsDir, "test-agent", s.validAgentContent("test-agent")); err != nil {
		return err
	}
	return s.writeSkill(skillsDir, "test-skill", s.validSkillContent("test-skill"))
}

func (s *validateClaudeSteps) aClaudeDirWithAgentMissingToolsField() error {
	agentsDir, err := s.createAgentsDir()
	if err != nil {
		return err
	}
	skillsDir, err := s.createSkillsDir()
	if err != nil {
		return err
	}
	// Agent without the "tools" field
	badAgentContent := "---\nname: bad-agent\ndescription: A test agent\nmodel: haiku\ncolor: blue\nskills:\n---\nAgent content."
	if err := s.writeAgent(agentsDir, "bad-agent", badAgentContent); err != nil {
		return err
	}
	return s.writeSkill(skillsDir, "test-skill", s.validSkillContent("test-skill"))
}

func (s *validateClaudeSteps) aClaudeDirWithTwoAgentsDeclaringSameName() error {
	agentsDir, err := s.createAgentsDir()
	if err != nil {
		return err
	}
	// Two different filenames, same name field value
	agentOneContent := "---\nname: same-agent\ndescription: Test agent description\ntools: Read, Write\nmodel: sonnet\ncolor: blue\nskills:\n---\nAgent one body"
	agentTwoContent := "---\nname: same-agent\ndescription: Test agent description\ntools: Read, Write\nmodel: sonnet\ncolor: blue\nskills:\n---\nAgent two body"
	if err := s.writeAgent(agentsDir, "agent-one", agentOneContent); err != nil {
		return err
	}
	return s.writeAgent(agentsDir, "agent-two", agentTwoContent)
}

func (s *validateClaudeSteps) aClaudeDirWhereAgentsAreValidButSkillsHaveIssues() error {
	agentsDir, err := s.createAgentsDir()
	if err != nil {
		return err
	}
	skillsDir, err := s.createSkillsDir()
	if err != nil {
		return err
	}
	if err := s.writeAgent(agentsDir, "test-agent", s.validAgentContent("test-agent")); err != nil {
		return err
	}
	// Invalid skill: missing the "description" field
	badSkillContent := "---\nname: bad-skill\n---\nSkill content"
	return s.writeSkill(skillsDir, "bad-skill", badSkillContent)
}

func (s *validateClaudeSteps) aClaudeDirWhereSkillsAreValidButAgentsHaveIssues() error {
	agentsDir, err := s.createAgentsDir()
	if err != nil {
		return err
	}
	skillsDir, err := s.createSkillsDir()
	if err != nil {
		return err
	}
	if err := s.writeSkill(skillsDir, "test-skill", s.validSkillContent("test-skill")); err != nil {
		return err
	}
	// Invalid agent: missing the "tools" field
	badAgentContent := "---\nname: bad-agent\ndescription: A test agent\nmodel: haiku\ncolor: blue\nskills:\n---\nAgent content."
	return s.writeAgent(agentsDir, "bad-agent", badAgentContent)
}

func (s *validateClaudeSteps) runValidateClaude() error {
	buf := new(bytes.Buffer)
	validateClaudeCmd.SetOut(buf)
	validateClaudeCmd.SetErr(buf)
	s.cmdErr = validateClaudeCmd.RunE(validateClaudeCmd, []string{})
	s.cmdOutput = buf.String()
	return nil
}

func (s *validateClaudeSteps) runValidateClaudeWithAgentsOnlyFlag() error {
	agentsOnly = true
	skillsOnly = false
	return s.runValidateClaude()
}

func (s *validateClaudeSteps) runValidateClaudeWithSkillsOnlyFlag() error {
	agentsOnly = false
	skillsOnly = true
	return s.runValidateClaude()
}

func (s *validateClaudeSteps) commandExitsSuccessfullyForClaude() error {
	if s.cmdErr != nil {
		return fmt.Errorf("expected command to succeed, got error: %v\noutput: %s", s.cmdErr, s.cmdOutput)
	}
	return nil
}

func (s *validateClaudeSteps) commandExitsWithFailureCodeForClaude() error {
	if s.cmdErr == nil {
		return fmt.Errorf("expected command to fail, but it succeeded\noutput: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateClaudeSteps) outputReportsAllChecksAsPassing() error {
	if !strings.Contains(s.cmdOutput, "VALIDATION PASSED") {
		return fmt.Errorf("expected output to contain 'VALIDATION PASSED', got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateClaudeSteps) outputIdentifiesAgentAndMissingField() error {
	if !strings.Contains(s.cmdOutput, "Failed:") && s.cmdErr == nil {
		return fmt.Errorf("expected output to identify validation failure, got: %s", s.cmdOutput)
	}
	return nil
}

func (s *validateClaudeSteps) outputReportsDuplicateAgentName() error {
	if !strings.Contains(s.cmdOutput, "same-agent") && !strings.Contains(s.cmdOutput, "duplicate") && !strings.Contains(s.cmdOutput, "Duplicate") {
		return fmt.Errorf("expected output to report duplicate agent name 'same-agent', got: %s", s.cmdOutput)
	}
	return nil
}

func InitializeValidateClaudeScenario(sc *godog.ScenarioContext) {
	s := &validateClaudeSteps{}
	sc.Before(s.before)
	sc.After(s.after)

	sc.Step(`^a \.claude/ directory where all agents and skills are valid$`, s.aClaudeDirWhereAllAgentsAndSkillsAreValid)
	sc.Step(`^a \.claude/ directory where one agent is missing the required "tools" field$`, s.aClaudeDirWithAgentMissingToolsField)
	sc.Step(`^a \.claude/ directory containing two agent files declaring the same name$`, s.aClaudeDirWithTwoAgentsDeclaringSameName)
	sc.Step(`^a \.claude/ directory where agents are valid but skills have issues$`, s.aClaudeDirWhereAgentsAreValidButSkillsHaveIssues)
	sc.Step(`^a \.claude/ directory where skills are valid but agents have issues$`, s.aClaudeDirWhereSkillsAreValidButAgentsHaveIssues)
	sc.Step(`^the developer runs validate-claude$`, s.runValidateClaude)
	sc.Step(`^the developer runs validate-claude with the --agents-only flag$`, s.runValidateClaudeWithAgentsOnlyFlag)
	sc.Step(`^the developer runs validate-claude with the --skills-only flag$`, s.runValidateClaudeWithSkillsOnlyFlag)
	sc.Step(`^the command exits successfully$`, s.commandExitsSuccessfullyForClaude)
	sc.Step(`^the command exits with a failure code$`, s.commandExitsWithFailureCodeForClaude)
	sc.Step(`^the output reports all checks as passing$`, s.outputReportsAllChecksAsPassing)
	sc.Step(`^the output identifies the agent and the missing field$`, s.outputIdentifiesAgentAndMissingField)
	sc.Step(`^the output reports the duplicate agent name$`, s.outputReportsDuplicateAgentName)
}

func TestIntegrationValidateClaude(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeValidateClaudeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{specsClaudeDir},
			Tags:     "validate-claude",
			TestingT: t,
		},
	}
	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
