package cmd

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateSyncCommand_InSync(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create .claude structure
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create .opencode structure
	opencodeAgentDir := filepath.Join(tmpDir, ".opencode", "agent")
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")
	if err := os.MkdirAll(opencodeAgentDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode agent dir: %v", err)
	}
	if err := os.MkdirAll(opencodeSkillDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode skill dir: %v", err)
	}

	// Create synced agent in .claude/
	claudeAgentContent := `---
name: test-agent
description: Test agent description
tools: Read, Write
model: sonnet
color: blue
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent.md"), []byte(claudeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create claude agent: %v", err)
	}

	// Create corresponding synced agent in .opencode/ (with proper conversion)
	opencodeAgentContent := `---
description: Test agent description
model: zai/glm-4.7
tools:
  read: true
  write: true
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "test-agent.md"), []byte(opencodeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create opencode agent: %v", err)
	}

	// Create synced skill in .claude/
	skillDir := filepath.Join(skillsDir, "test-skill")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}
	skillContent := `---
name: test-skill
description: Test skill description
---
Skill content`
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(skillContent), 0644); err != nil {
		t.Fatalf("Failed to create claude skill: %v", err)
	}

	// Create corresponding synced skill in .opencode/ (directory structure: {name}/SKILL.md)
	if err := os.MkdirAll(filepath.Join(opencodeSkillDir, "test-skill"), 0755); err != nil {
		t.Fatalf("Failed to create opencode skill dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(opencodeSkillDir, "test-skill", "SKILL.md"), []byte(skillContent), 0644); err != nil {
		t.Fatalf("Failed to create opencode skill: %v", err)
	}

	// Test command execution
	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	output = "text"
	verbose = false
	quiet = false

	// Execute command
	err = cmd.RunE(cmd, []string{})
	if err != nil {
		t.Errorf("Command failed: %v", err)
	}

	outputStr := buf.String()
	t.Logf("Command output:\n%s", outputStr)

	// Verify success message
	if !strings.Contains(outputStr, "✓ VALIDATION PASSED") {
		t.Error("Expected output to contain validation passed message")
	}
	if !strings.Contains(outputStr, "Failed: 0") {
		t.Error("Expected output to show 0 failed checks")
	}
}

func TestValidateSyncCommand_OutOfSync_AgentCount(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create .claude structure
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}

	// Create .opencode structure
	opencodeAgentDir := filepath.Join(tmpDir, ".opencode", "agent")
	if err := os.MkdirAll(opencodeAgentDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode agent dir: %v", err)
	}

	// Create 2 agents in .claude/ but only 1 in .opencode/ (out of sync)
	claudeAgentContent := `---
name: test-agent-1
description: Test agent description
tools: Read
model: sonnet
color: blue
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent-1.md"), []byte(claudeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create claude agent 1: %v", err)
	}

	claudeAgentContent2 := `---
name: test-agent-2
description: Test agent description
tools: Write
model: haiku
color: green
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent-2.md"), []byte(claudeAgentContent2), 0644); err != nil {
		t.Fatalf("Failed to create claude agent 2: %v", err)
	}

	// Only create one agent in .opencode/
	opencodeAgentContent := `---
description: Test agent description
model: zai/glm-4.7
tools:
  read: true
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "test-agent-1.md"), []byte(opencodeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create opencode agent: %v", err)
	}

	// Test command execution
	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should fail)
	err = cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("Expected command to fail with mismatched agent counts")
	}

	outputStr := buf.String()
	t.Logf("Command output:\n%s", outputStr)

	// Verify error indicates count mismatch
	if !strings.Contains(outputStr, "Failed:") && !strings.Contains(err.Error(), "validation failed") {
		t.Error("Expected output or error to indicate validation failure")
	}
}

func TestValidateSyncCommand_OutOfSync_SkillContent(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create .claude structure
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create .opencode structure
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")
	if err := os.MkdirAll(opencodeSkillDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode skill dir: %v", err)
	}

	// Create skill in .claude/
	skillDir := filepath.Join(skillsDir, "test-skill")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}
	claudeSkillContent := `---
name: test-skill
description: Test skill description
---
Original skill content`
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(claudeSkillContent), 0644); err != nil {
		t.Fatalf("Failed to create claude skill: %v", err)
	}

	// Create skill in .opencode/ with DIFFERENT content (out of sync)
	opencodeSkillContent := `---
name: test-skill
description: Test skill description
---
MODIFIED skill content`
	if err := os.WriteFile(filepath.Join(opencodeSkillDir, "test-skill.md"), []byte(opencodeSkillContent), 0644); err != nil {
		t.Fatalf("Failed to create opencode skill: %v", err)
	}

	// Test command execution
	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should fail)
	err = cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("Expected command to fail with mismatched skill content")
	}

	outputStr := buf.String()
	t.Logf("Command output:\n%s", outputStr)

	// Verify error indicates content mismatch
	if !strings.Contains(outputStr, "Failed:") && !strings.Contains(err.Error(), "validation failed") {
		t.Error("Expected output or error to indicate validation failure")
	}
}

func TestValidateSyncCommand_OutOfSync_AgentDescription(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create .claude structure
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}

	// Create .opencode structure
	opencodeAgentDir := filepath.Join(tmpDir, ".opencode", "agent")
	if err := os.MkdirAll(opencodeAgentDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode agent dir: %v", err)
	}

	// Create agent in .claude/
	claudeAgentContent := `---
name: test-agent
description: Original description
tools: Read
model: sonnet
color: blue
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent.md"), []byte(claudeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create claude agent: %v", err)
	}

	// Create agent in .opencode/ with DIFFERENT description (out of sync)
	opencodeAgentContent := `---
description: MODIFIED description
model: zai/glm-4.7
tools:
  read: true
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "test-agent.md"), []byte(opencodeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create opencode agent: %v", err)
	}

	// Test command execution
	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should fail)
	err = cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("Expected command to fail with mismatched agent description")
	}

	outputStr := buf.String()
	t.Logf("Command output:\n%s", outputStr)

	// Verify error indicates validation failure
	if !strings.Contains(outputStr, "Failed:") && !strings.Contains(err.Error(), "validation failed") {
		t.Error("Expected output or error to indicate validation failure")
	}
}

func TestValidateSyncCommand_JSONOutput(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create .claude structure
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create .opencode structure
	opencodeAgentDir := filepath.Join(tmpDir, ".opencode", "agent")
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")
	if err := os.MkdirAll(opencodeAgentDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode agent dir: %v", err)
	}
	if err := os.MkdirAll(opencodeSkillDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode skill dir: %v", err)
	}

	// Create synced agent
	claudeAgentContent := `---
name: test-agent
description: Test agent description
tools: Read
model: sonnet
color: blue
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent.md"), []byte(claudeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create claude agent: %v", err)
	}

	opencodeAgentContent := `---
description: Test agent description
model: zai/glm-4.7
tools:
  read: true
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "test-agent.md"), []byte(opencodeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create opencode agent: %v", err)
	}

	// Test JSON output
	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Set JSON output flag
	output = "json"
	verbose = false
	quiet = false

	// Execute command
	err = cmd.RunE(cmd, []string{})
	if err != nil {
		t.Errorf("Command failed: %v", err)
	}

	jsonOutput := buf.String()
	t.Logf("JSON output:\n%s", jsonOutput)

	// Verify JSON structure (snake_case field names)
	if !strings.Contains(jsonOutput, `"total_checks"`) {
		t.Error("Expected JSON output to contain 'total_checks' field")
	}
	if !strings.Contains(jsonOutput, `"passed_checks"`) {
		t.Error("Expected JSON output to contain 'passed_checks' field")
	}
	if !strings.Contains(jsonOutput, `"failed_checks"`) {
		t.Error("Expected JSON output to contain 'failed_checks' field")
	}
	if !strings.Contains(jsonOutput, `"checks"`) {
		t.Error("Expected JSON output to contain 'checks' field")
	}
	if !strings.Contains(jsonOutput, `"status"`) {
		t.Error("Expected JSON output to contain 'status' field")
	}
	if !strings.Contains(jsonOutput, `"timestamp"`) {
		t.Error("Expected JSON output to contain 'timestamp' field")
	}
}

func TestValidateSyncCommand_VerboseOutput(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create .claude structure
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create .opencode structure
	opencodeAgentDir := filepath.Join(tmpDir, ".opencode", "agent")
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")
	if err := os.MkdirAll(opencodeAgentDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode agent dir: %v", err)
	}
	if err := os.MkdirAll(opencodeSkillDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode skill dir: %v", err)
	}

	// Create synced agent
	claudeAgentContent := `---
name: test-agent
description: Test agent description
tools: Read
model: sonnet
color: blue
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent.md"), []byte(claudeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create claude agent: %v", err)
	}

	opencodeAgentContent := `---
description: Test agent description
model: zai/glm-4.7
tools:
  read: true
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(opencodeAgentDir, "test-agent.md"), []byte(opencodeAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create opencode agent: %v", err)
	}

	// Test verbose output
	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Set verbose flag
	output = "text"
	verbose = true
	quiet = false

	// Execute command
	err = cmd.RunE(cmd, []string{})
	if err != nil {
		t.Errorf("Command failed: %v", err)
	}

	verboseOutput := buf.String()
	t.Logf("Verbose output:\n%s", verboseOutput)

	// Verify verbose output contains check details
	// In verbose mode, we expect to see individual check names or details
	if !strings.Contains(verboseOutput, "✓") || (!strings.Contains(verboseOutput, "passed") && !strings.Contains(verboseOutput, "PASSED")) {
		t.Error("Expected verbose output to contain check status indicators")
	}
}

func TestValidateSyncCommand_EmptyDirectories(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create empty .claude and .opencode structures
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	opencodeAgentDir := filepath.Join(tmpDir, ".opencode", "agent")
	opencodeSkillDir := filepath.Join(tmpDir, ".opencode", "skill")
	if err := os.MkdirAll(opencodeAgentDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode agent dir: %v", err)
	}
	if err := os.MkdirAll(opencodeSkillDir, 0755); err != nil {
		t.Fatalf("Failed to create opencode skill dir: %v", err)
	}

	// Test command execution with empty directories
	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should succeed - empty directories are in sync)
	err = cmd.RunE(cmd, []string{})
	if err != nil {
		t.Errorf("Command failed with empty directories: %v", err)
	}

	outputStr := buf.String()
	t.Logf("Command output:\n%s", outputStr)

	// Verify success message
	if !strings.Contains(outputStr, "✓ VALIDATION PASSED") {
		t.Error("Expected output to contain validation passed message for empty directories")
	}
}

func TestValidateSyncCommand_MissingGitRoot(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	// No .git directory

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

func TestValidateSyncCommand_ValidationError(t *testing.T) {
	// Test the ValidateSync error path by having agent dirs exist
	// but causing ValidateSync to return an error (agents present in .claude
	// but .opencode is missing agents directory entirely)
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmpDir, ".git"), 0755); err != nil {
		t.Fatal(err)
	}
	// Create .claude/agents but NOT .opencode/agent — ValidateSync should handle this
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmpDir, ".claude", "skills"), 0755); err != nil {
		t.Fatal(err)
	}

	cmd := validateSyncCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	output = "text"
	verbose = false
	quiet = false

	// This may succeed (0 agents in sync) or fail — we just check it doesn't panic
	_ = cmd.RunE(cmd, []string{})

	_ = buf.String()
}
