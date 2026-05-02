package agents

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func TestValidateClaude_AllValid(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create 2 skills
	createValidSkill(t, skillsDir, "skill-1")
	createValidSkill(t, skillsDir, "skill-2")

	// Create 2 agents referencing the skills
	agent1Content := `---
name: agent-1
description: Test agent 1
tools: Read, Write
model: sonnet
color: blue
skills:
  - skill-1
---
Agent 1 body`

	agent2Content := `---
name: agent-2
description: Test agent 2
tools: Read, Write, Edit
model: haiku
color: green
skills:
  - skill-2
---
Agent 2 body`

	if err := os.WriteFile(filepath.Join(agentsDir, "agent-1.md"), []byte(agent1Content), 0644); err != nil {
		t.Fatalf("Failed to create agent-1: %v", err)
	}
	if err := os.WriteFile(filepath.Join(agentsDir, "agent-2.md"), []byte(agent2Content), 0644); err != nil {
		t.Fatalf("Failed to create agent-2: %v", err)
	}

	result, err := ValidateClaude(ValidateClaudeOptions{
		RepoRoot: tmpDir,
	})

	if err != nil {
		t.Fatalf("ValidateClaude returned error: %v", err)
	}

	// 2 skills × 7 checks + 2 agents × 11 checks = 14 + 22 = 36 checks
	if result.TotalChecks != 36 {
		t.Errorf("Expected 36 total checks, got %d", result.TotalChecks)
	}

	if result.PassedChecks != 36 {
		t.Errorf("Expected 36 passed checks, got %d", result.PassedChecks)
	}

	if result.FailedChecks != 0 {
		t.Errorf("Expected 0 failed checks, got %d", result.FailedChecks)
	}

	if result.Duration == 0 {
		t.Error("Expected non-zero duration")
	}
}

func TestValidateClaude_AgentsOnly(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create 1 skill
	createValidSkill(t, skillsDir, "skill-1")

	// Create 1 agent
	createValidAgent(t, agentsDir, "test-agent")

	result, err := ValidateClaude(ValidateClaudeOptions{
		RepoRoot:   tmpDir,
		AgentsOnly: true,
	})

	if err != nil {
		t.Fatalf("ValidateClaude returned error: %v", err)
	}

	// Should have only agent checks (11 checks)
	if result.TotalChecks != 11 {
		t.Errorf("Expected 11 checks (agents only), got %d", result.TotalChecks)
	}

	if result.PassedChecks != 11 {
		t.Errorf("Expected 11 passed checks, got %d", result.PassedChecks)
	}
}

func TestValidateClaude_SkillsOnly(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create 2 skills
	createValidSkill(t, skillsDir, "skill-1")
	createValidSkill(t, skillsDir, "skill-2")

	// Create 1 agent (should be ignored)
	createValidAgent(t, agentsDir, "test-agent")

	result, err := ValidateClaude(ValidateClaudeOptions{
		RepoRoot:   tmpDir,
		SkillsOnly: true,
	})

	if err != nil {
		t.Fatalf("ValidateClaude returned error: %v", err)
	}

	// Should have only skill checks (2 skills × 7 checks = 14)
	if result.TotalChecks != 14 {
		t.Errorf("Expected 14 checks (skills only), got %d", result.TotalChecks)
	}

	if result.PassedChecks != 14 {
		t.Errorf("Expected 14 passed checks, got %d", result.PassedChecks)
	}
}

func TestValidateClaude_InvalidAgent(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create invalid agent (missing required fields)
	invalidAgent := `---
name:invalid-agent
description:
tools:Read, InvalidTool
model:gpt-4
color:red
skills:
---
Invalid agent`

	if err := os.WriteFile(filepath.Join(agentsDir, "invalid-agent.md"), []byte(invalidAgent), 0644); err != nil {
		t.Fatalf("Failed to create invalid agent: %v", err)
	}

	result, err := ValidateClaude(ValidateClaudeOptions{
		RepoRoot: tmpDir,
	})

	if err != nil {
		t.Fatalf("ValidateClaude returned error: %v", err)
	}

	if result.FailedChecks == 0 {
		t.Error("Expected some failed checks for invalid agent")
	}

	if result.PassedChecks+result.WarningChecks+result.FailedChecks != result.TotalChecks {
		t.Errorf("Total checks should equal passed + warning + failed; got %d+%d+%d != %d",
			result.PassedChecks, result.WarningChecks, result.FailedChecks, result.TotalChecks)
	}
}

func TestValidateClaude_InvalidSkill(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create invalid skill (missing SKILL.md)
	invalidSkillDir := filepath.Join(skillsDir, "invalid-skill")
	if err := os.MkdirAll(invalidSkillDir, 0755); err != nil {
		t.Fatalf("Failed to create invalid skill dir: %v", err)
	}

	result, err := ValidateClaude(ValidateClaudeOptions{
		RepoRoot: tmpDir,
	})

	if err != nil {
		t.Fatalf("ValidateClaude returned error: %v", err)
	}

	if result.FailedChecks == 0 {
		t.Error("Expected some failed checks for invalid skill")
	}
}

func TestValidateClaude_AgentReferencesNonExistentSkill(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create agent referencing non-existent skill
	agentContent := `---
name: test-agent
description: Test agent
tools: Read, Write
model: sonnet
color: blue
skills:
  - non-existent-skill
---
Test agent`

	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent.md"), []byte(agentContent), 0644); err != nil {
		t.Fatalf("Failed to create agent: %v", err)
	}

	result, err := ValidateClaude(ValidateClaudeOptions{
		RepoRoot: tmpDir,
	})

	if err != nil {
		t.Fatalf("ValidateClaude returned error: %v", err)
	}

	// Should have at least 1 failed check for missing skill reference
	if result.FailedChecks == 0 {
		t.Error("Expected failed check for non-existent skill reference")
	}

	// Find the specific failed check
	foundSkillError := false
	for _, check := range result.Checks {
		if check.Status == "failed" && check.Name == "Agent: test-agent.md - Skills Exist" {
			foundSkillError = true
			break
		}
	}

	if !foundSkillError {
		t.Error("Expected specific 'Skills Exist' check to fail")
	}
}

func TestValidateClaude_EmptyRepository(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	result, err := ValidateClaude(ValidateClaudeOptions{
		RepoRoot: tmpDir,
	})

	if err != nil {
		t.Fatalf("ValidateClaude returned error: %v", err)
	}

	if result.TotalChecks != 0 {
		t.Errorf("Expected 0 checks for empty repository, got %d", result.TotalChecks)
	}

	if result.PassedChecks != 0 {
		t.Errorf("Expected 0 passed checks, got %d", result.PassedChecks)
	}

	if result.FailedChecks != 0 {
		t.Errorf("Expected 0 failed checks, got %d", result.FailedChecks)
	}
}

func TestValidateClaude_MultipleAgentsAndSkills(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create 5 skills
	for i := 1; i <= 5; i++ {
		skillName := "skill-" + string(rune('0'+i))
		createValidSkill(t, skillsDir, skillName)
	}

	// Create 10 agents
	for i := 1; i <= 10; i++ {
		agentName := fmt.Sprintf("agent-%d", i)
		createValidAgent(t, agentsDir, agentName)
	}

	result, err := ValidateClaude(ValidateClaudeOptions{
		RepoRoot: tmpDir,
	})

	if err != nil {
		t.Fatalf("ValidateClaude returned error: %v", err)
	}

	// Should have checks for all skills and agents
	if result.TotalChecks == 0 {
		t.Error("Expected non-zero total checks")
	}

	// All checks should pass
	if result.FailedChecks != 0 {
		t.Errorf("Expected 0 failed checks, got %d", result.FailedChecks)
		for _, check := range result.Checks {
			if check.Status == "failed" {
				t.Errorf("Failed check: %s - %s", check.Name, check.Message)
			}
		}
	}

	// Verify passed + warning + failed = total
	if result.PassedChecks+result.WarningChecks+result.FailedChecks != result.TotalChecks {
		t.Errorf("PassedChecks (%d) + WarningChecks (%d) + FailedChecks (%d) != TotalChecks (%d)",
			result.PassedChecks, result.WarningChecks, result.FailedChecks, result.TotalChecks)
	}
}

func TestValidateClaude_ChecksStructure(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	createValidSkill(t, skillsDir, "test-skill")
	createValidAgent(t, agentsDir, "test-agent")

	result, err := ValidateClaude(ValidateClaudeOptions{
		RepoRoot: tmpDir,
	})

	if err != nil {
		t.Fatalf("ValidateClaude returned error: %v", err)
	}

	// Verify Checks array is properly populated
	if len(result.Checks) != result.TotalChecks {
		t.Errorf("Checks array length (%d) doesn't match TotalChecks (%d)", len(result.Checks), result.TotalChecks)
	}

	// Verify each check has required fields
	for i, check := range result.Checks {
		if check.Name == "" {
			t.Errorf("Check %d has empty Name", i)
		}
		if check.Status != "passed" && check.Status != "warning" && check.Status != "failed" {
			t.Errorf("Check %d has invalid Status: %s", i, check.Status)
		}
		if check.Message == "" {
			t.Errorf("Check %d has empty Message", i)
		}
	}
}
