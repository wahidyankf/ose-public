package cmd

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateClaudeCommand_AllValid(t *testing.T) {
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

	// Create valid skill
	createTestSkill(t, skillsDir, "test-skill")

	// Create valid agent
	createTestAgent(t, agentsDir, "test-agent")

	// Test command execution
	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	agentsOnly = false
	skillsOnly = false
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

func TestValidateClaudeCommand_InvalidAgent_MissingName(t *testing.T) {
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

	// Create invalid agent (missing name field)
	invalidAgentContent := `---
description: Test agent description
tools: Read
model: sonnet
color: blue
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent.md"), []byte(invalidAgentContent), 0644); err != nil {
		t.Fatalf("Failed to create invalid agent: %v", err)
	}

	// Test command execution
	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	agentsOnly = false
	skillsOnly = false
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should fail)
	err = cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("Expected command to fail with invalid agent")
	}

	outputStr := buf.String()
	t.Logf("Command output:\n%s", outputStr)

	// Verify error indicates validation failure
	if !strings.Contains(outputStr, "Failed:") && !strings.Contains(err.Error(), "validation failed") {
		t.Error("Expected output or error to indicate validation failure")
	}
}

func TestValidateClaudeCommand_InvalidSkill_MissingName(t *testing.T) {
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

	// Create invalid skill (missing name field)
	skillDir := filepath.Join(skillsDir, "test-skill")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	invalidSkillContent := `---
description: Test skill description
---
Skill content`
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(invalidSkillContent), 0644); err != nil {
		t.Fatalf("Failed to create invalid skill: %v", err)
	}

	// Test command execution
	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	agentsOnly = false
	skillsOnly = false
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should fail)
	err = cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("Expected command to fail with invalid skill")
	}

	outputStr := buf.String()
	t.Logf("Command output:\n%s", outputStr)

	// Verify error indicates validation failure
	if !strings.Contains(outputStr, "Failed:") && !strings.Contains(err.Error(), "validation failed") {
		t.Error("Expected output or error to indicate validation failure")
	}
}

func TestValidateClaudeCommand_AgentsOnly(t *testing.T) {
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

	// Create valid agent and skill
	createTestAgent(t, agentsDir, "test-agent")
	createTestSkill(t, skillsDir, "test-skill")

	// Test agents-only command
	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Set agents-only flag
	agentsOnly = true
	skillsOnly = false
	output = "text"
	verbose = false
	quiet = false

	// Execute command
	err = cmd.RunE(cmd, []string{})
	if err != nil {
		t.Errorf("Command failed: %v", err)
	}

	outputStr := buf.String()
	t.Logf("Agents-only output:\n%s", outputStr)

	// Verify success and that only agents were validated
	if !strings.Contains(outputStr, "✓ VALIDATION PASSED") {
		t.Error("Expected output to contain validation passed message")
	}
	// Should show agent checks (11 checks per agent)
	if !strings.Contains(outputStr, "Total Checks: 11") {
		t.Error("Expected output to show 11 checks (agents-only mode)")
	}
}

func TestValidateClaudeCommand_SkillsOnly(t *testing.T) {
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

	// Create valid agent and skill
	createTestAgent(t, agentsDir, "test-agent")
	createTestSkill(t, skillsDir, "test-skill")

	// Test skills-only command
	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Set skills-only flag
	agentsOnly = false
	skillsOnly = true
	output = "text"
	verbose = false
	quiet = false

	// Execute command
	err = cmd.RunE(cmd, []string{})
	if err != nil {
		t.Errorf("Command failed: %v", err)
	}

	outputStr := buf.String()
	t.Logf("Skills-only output:\n%s", outputStr)

	// Verify success and that only skills were validated
	if !strings.Contains(outputStr, "✓ VALIDATION PASSED") {
		t.Error("Expected output to contain validation passed message")
	}
	// Should show skill checks (7 checks per skill)
	if !strings.Contains(outputStr, "Total Checks: 7") {
		t.Error("Expected output to show 7 checks (skills-only mode)")
	}
}

func TestValidateClaudeCommand_ConflictingFlags(t *testing.T) {
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

	// Test command with conflicting flags
	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Set conflicting flags
	agentsOnly = true
	skillsOnly = true // Conflict!
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should fail)
	err = cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("Expected command to fail with conflicting flags")
	}

	if !strings.Contains(err.Error(), "cannot use") {
		t.Errorf("Expected error message about conflicting flags, got: %v", err)
	}
}

func TestValidateClaudeCommand_JSONOutput(t *testing.T) {
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

	// Create valid agent and skill
	createTestAgent(t, agentsDir, "test-agent")
	createTestSkill(t, skillsDir, "test-skill")

	// Test JSON output
	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Set JSON output flag
	agentsOnly = false
	skillsOnly = false
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

func TestValidateClaudeCommand_InvalidYAMLFormatting(t *testing.T) {
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

	// Create agent with YAML formatting error (missing space after colon)
	invalidFormatContent := `---
name:test-agent
description:Test agent description
tools:Read
model:sonnet
color:blue
skills:
---
Test agent body`
	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent.md"), []byte(invalidFormatContent), 0644); err != nil {
		t.Fatalf("Failed to create invalid agent: %v", err)
	}

	// Test command execution
	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	agentsOnly = false
	skillsOnly = false
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should fail)
	err = cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("Expected command to fail with YAML formatting errors")
	}

	outputStr := buf.String()
	t.Logf("Command output:\n%s", outputStr)

	// Verify error indicates YAML formatting issue
	if !strings.Contains(outputStr, "YAML") && !strings.Contains(outputStr, "formatting") {
		t.Error("Expected output to mention YAML formatting error")
	}
}

func TestValidateClaudeCommand_VerboseOutput(t *testing.T) {
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

	// Create valid agent and skill
	createTestAgent(t, agentsDir, "test-agent")
	createTestSkill(t, skillsDir, "test-skill")

	// Test verbose output
	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Set verbose flag
	agentsOnly = false
	skillsOnly = false
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
	if !strings.Contains(verboseOutput, "✓") || (!strings.Contains(verboseOutput, "passed") && !strings.Contains(verboseOutput, "PASSED")) {
		t.Error("Expected verbose output to contain check status indicators")
	}
}

func TestValidateClaudeCommand_MissingGitRoot(t *testing.T) {
	// Covers line 75: findGitRoot() error when not in a git repository
	// (must not use conflicting flags, since ConflictingFlags returns early before line 75)
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}
	// No .git directory — findGitRoot() will fail

	cmd := validateClaudeCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	agentsOnly = false
	skillsOnly = false
	output = "text"
	verbose = false
	quiet = false

	err = cmd.RunE(cmd, []string{})
	if err == nil {
		t.Fatal("expected error when no .git directory found")
	}
	if !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error mentioning 'git', got: %v", err)
	}
}
