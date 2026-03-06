package agents

import (
	"os"
	"path/filepath"
	"testing"
)

// Helper function to create a valid agent file
func createValidAgent(t *testing.T, dir, name string) {
	t.Helper()
	content := `---
name: ` + name + `
description: Test agent description
tools: Read, Write
model: sonnet
color: blue
skills:
---
Test agent body`

	if err := os.WriteFile(filepath.Join(dir, name+".md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create agent: %v", err)
	}
}

// Helper function to create a skill directory
func createValidSkill(t *testing.T, dir, name string) {
	t.Helper()
	skillDir := filepath.Join(dir, name)
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatalf("Failed to create skill dir: %v", err)
	}

	content := `---
name: ` + name + `
description: Test skill description
---
Skill content`

	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create SKILL.md: %v", err)
	}
}

func TestValidateAgent_ValidAgent(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	createValidAgent(t, agentsDir, "test-agent")

	agentNames := make(map[string]bool)
	skillNames := make(map[string]bool)

	checks := validateAgent(
		filepath.Join(agentsDir, "test-agent.md"),
		"test-agent.md",
		agentNames,
		skillNames,
	)

	// Should have 10 checks for a valid agent (no generated-reports check)
	if len(checks) != 11 {
		t.Errorf("Expected 11 checks, got %d", len(checks))
	}

	for _, check := range checks {
		if check.Status != "passed" {
			t.Errorf("Check '%s' failed: %s", check.Name, check.Message)
		}
	}
}

func TestValidateAgent_InvalidYAML(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}

	// Invalid YAML (no closing ---)
	content := `---
name:test-agent
description:Test`

	if err := os.WriteFile(filepath.Join(agentsDir, "test-agent.md"), []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create agent: %v", err)
	}

	agentNames := make(map[string]bool)
	skillNames := make(map[string]bool)

	checks := validateAgent(
		filepath.Join(agentsDir, "test-agent.md"),
		"test-agent.md",
		agentNames,
		skillNames,
	)

	// Should have at least 1 failed check
	if len(checks) == 0 {
		t.Fatal("Expected at least 1 check")
	}

	if checks[0].Status != "failed" {
		t.Errorf("Expected first check to fail, got '%s'", checks[0].Status)
	}
}

func TestValidateRequiredFields_AllPresent(t *testing.T) {
	agent := ClaudeAgentFull{
		Name:        "test-agent",
		Description: "Test description",
		Tools:       "Read, Write",
		Model:       "sonnet",
		Color:       "blue",
		Skills:      []string{},
	}

	check := validateRequiredFields("test-agent.md", agent)

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s': %s", check.Status, check.Message)
	}
}

func TestValidateRequiredFields_MissingName(t *testing.T) {
	agent := ClaudeAgentFull{
		Name:        "",
		Description: "Test description",
		Tools:       "Read, Write",
		Model:       "sonnet",
		Color:       "blue",
	}

	check := validateRequiredFields("test-agent.md", agent)

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}

	if check.Actual != "Missing: [name]" {
		t.Errorf("Expected missing name, got '%s'", check.Actual)
	}
}

func TestValidateRequiredFields_MissingMultiple(t *testing.T) {
	agent := ClaudeAgentFull{
		Name:        "",
		Description: "",
		Tools:       "Read",
		Model:       "",
		Color:       "",
	}

	check := validateRequiredFields("test-agent.md", agent)

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateTools_ValidTools(t *testing.T) {
	tests := []struct {
		name  string
		tools string
	}{
		{"single tool", "Read"},
		{"multiple tools", "Read, Write, Edit"},
		{"all valid tools", "Read, Write, Edit, Glob, Grep, Bash, TodoWrite, WebFetch, WebSearch"},
		{"with extra spaces", "Read,  Write,   Edit"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			check := validateTools("test.md", tt.tools)
			if check.Status != "passed" {
				t.Errorf("Expected status 'passed', got '%s': %s", check.Status, check.Message)
			}
		})
	}
}

func TestValidateTools_InvalidTool(t *testing.T) {
	check := validateTools("test.md", "Read, InvalidTool, Write")

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}

	if check.Actual != "Invalid tools: [InvalidTool]" {
		t.Errorf("Expected invalid tools message, got '%s'", check.Actual)
	}
}

func TestValidateTools_MultipleInvalid(t *testing.T) {
	check := validateTools("test.md", "Read, BadTool, AnotherBad")

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateModel_ValidModels(t *testing.T) {
	validModels := []string{"", "sonnet", "opus", "haiku"}

	for _, model := range validModels {
		t.Run("model: "+model, func(t *testing.T) {
			check := validateModel("test.md", model)
			if check.Status != "passed" {
				t.Errorf("Expected status 'passed' for model '%s', got '%s'", model, check.Status)
			}
		})
	}
}

func TestValidateModel_InvalidModel(t *testing.T) {
	check := validateModel("test.md", "gpt-4")

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateColor_ValidColors(t *testing.T) {
	validColors := []string{"blue", "green", "yellow", "purple"}

	for _, color := range validColors {
		t.Run("color: "+color, func(t *testing.T) {
			check := validateColor("test.md", color)
			if check.Status != "passed" {
				t.Errorf("Expected status 'passed' for color '%s', got '%s'", color, check.Status)
			}
		})
	}
}

func TestValidateColor_InvalidColor(t *testing.T) {
	check := validateColor("test.md", "red")

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateFilename_Match(t *testing.T) {
	check := validateFilename("test-agent.md", "test-agent")

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
}

func TestValidateFilename_Mismatch(t *testing.T) {
	check := validateFilename("wrong-name.md", "test-agent")

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}

	if check.Expected != "Filename: test-agent.md" {
		t.Errorf("Expected filename message, got '%s'", check.Expected)
	}
}

func TestValidateUniqueness_Unique(t *testing.T) {
	agentNames := map[string]bool{
		"agent-1": true,
		"agent-2": true,
	}

	check := validateUniqueness("agent-3.md", "agent-3", agentNames)

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
}

func TestValidateUniqueness_Duplicate(t *testing.T) {
	agentNames := map[string]bool{
		"agent-1": true,
		"agent-2": true,
	}

	check := validateUniqueness("agent-1.md", "agent-1", agentNames)

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateSkillsExist_AllExist(t *testing.T) {
	skillNames := map[string]bool{
		"skill-1": true,
		"skill-2": true,
		"skill-3": true,
	}

	skills := []string{"skill-1", "skill-2"}

	check := validateSkillsExist("test.md", skills, skillNames)

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
}

func TestValidateSkillsExist_MissingSkill(t *testing.T) {
	skillNames := map[string]bool{
		"skill-1": true,
		"skill-2": true,
	}

	skills := []string{"skill-1", "missing-skill"}

	check := validateSkillsExist("test.md", skills, skillNames)

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}

	if check.Actual != "Missing skills: [missing-skill]" {
		t.Errorf("Expected missing skills message, got '%s'", check.Actual)
	}
}

func TestValidateSkillsExist_EmptySkills(t *testing.T) {
	skillNames := map[string]bool{
		"skill-1": true,
	}

	skills := []string{}

	check := validateSkillsExist("test.md", skills, skillNames)

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed' for empty skills, got '%s'", check.Status)
	}
}

func TestValidateNoComments_NoComments(t *testing.T) {
	frontmatter := []byte(`name:test-agent
description:Test description
tools:Read, Write
model:sonnet
color:blue`)

	check := validateNoComments("test.md", frontmatter)

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
}

func TestValidateNoComments_HasComments(t *testing.T) {
	frontmatter := []byte(`name:test-agent
description:Test description
# This is a comment
tools:Read, Write
model:sonnet
color:blue`)

	check := validateNoComments("test.md", frontmatter)

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateGeneratedReportsTools_HasBoth(t *testing.T) {
	check := validateGeneratedReportsTools("test.md", "Read, Write, Bash, Grep")

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
}

func TestValidateGeneratedReportsTools_MissingWrite(t *testing.T) {
	check := validateGeneratedReportsTools("test.md", "Read, Bash, Grep")

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateGeneratedReportsTools_MissingBash(t *testing.T) {
	check := validateGeneratedReportsTools("test.md", "Read, Write, Grep")

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateGeneratedReportsTools_MissingBoth(t *testing.T) {
	check := validateGeneratedReportsTools("test.md", "Read, Grep")

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateAllAgents_EmptyDirectory(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}

	skillNames := make(map[string]bool)

	checks := validateAllAgents(tmpDir, skillNames)

	if len(checks) != 0 {
		t.Errorf("Expected 0 checks for empty directory, got %d", len(checks))
	}
}

func TestValidateAllAgents_MultipleAgents(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")

	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}

	createValidAgent(t, agentsDir, "agent-1")
	createValidAgent(t, agentsDir, "agent-2")
	createValidAgent(t, agentsDir, "agent-3")

	// Create README.md (should be ignored)
	if err := os.WriteFile(filepath.Join(agentsDir, "README.md"), []byte("readme"), 0644); err != nil {
		t.Fatalf("Failed to create README: %v", err)
	}

	skillNames := make(map[string]bool)

	checks := validateAllAgents(tmpDir, skillNames)

	// 3 agents × 11 checks each = 33 checks
	if len(checks) != 33 {
		t.Errorf("Expected 33 checks (3 agents × 11), got %d", len(checks))
	}

	passedCount := 0
	for _, check := range checks {
		if check.Status == "passed" {
			passedCount++
		}
	}

	if passedCount != 33 {
		t.Errorf("Expected all 33 checks to pass, got %d passed", passedCount)
	}
}

func TestValidateAllAgents_DirectoryNotFound(t *testing.T) {
	tmpDir := t.TempDir()
	// Don't create the agents directory

	skillNames := make(map[string]bool)

	checks := validateAllAgents(tmpDir, skillNames)

	if len(checks) != 1 {
		t.Errorf("Expected 1 error check, got %d", len(checks))
	}

	if checks[0].Status != "failed" {
		t.Errorf("Expected failed status, got '%s'", checks[0].Status)
	}
}

func TestValidateAgent_FileNotFound(t *testing.T) {
	tmpDir := t.TempDir()
	agentNames := make(map[string]bool)
	skillNames := make(map[string]bool)

	// Pass a path that does not exist
	checks := validateAgent(
		filepath.Join(tmpDir, "nonexistent.md"),
		"nonexistent.md",
		agentNames,
		skillNames,
	)

	if len(checks) != 1 {
		t.Fatalf("expected 1 check for file-not-found, got %d", len(checks))
	}
	if checks[0].Status != "failed" {
		t.Errorf("expected 'failed', got %q", checks[0].Status)
	}
}

func TestValidateAgent_MissingRequiredFields_EarlyReturn(t *testing.T) {
	tmpDir := t.TempDir()

	// Valid formatting + valid frontmatter but empty name → validateRequiredFields fails → early return
	content := "---\nname: \ndescription: Test desc\ntools: Read\nmodel: sonnet\ncolor: blue\nskills:\n---\nBody\n"
	agentPath := filepath.Join(tmpDir, "no-name.md")
	if err := os.WriteFile(agentPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	agentNames := make(map[string]bool)
	skillNames := make(map[string]bool)
	checks := validateAgent(agentPath, "no-name.md", agentNames, skillNames)

	foundFailed := false
	for _, c := range checks {
		if c.Status == "failed" {
			foundFailed = true
			break
		}
	}
	if !foundFailed {
		t.Error("expected at least one failed check for missing required fields")
	}
}

func TestValidateAgent_GeneratedReportsPath(t *testing.T) {
	tmpDir := t.TempDir()
	// Create a "generated-reports" subdirectory to ensure path contains it
	genDir := filepath.Join(tmpDir, "generated-reports")
	if err := os.MkdirAll(genDir, 0755); err != nil {
		t.Fatal(err)
	}

	// Agent with Read, Write, Bash - all required for generated-reports
	content := "---\nname: test-agent\ndescription: Test agent\ntools: Read, Write, Bash\nmodel: sonnet\ncolor: blue\nskills:\n---\nBody\n"
	agentPath := filepath.Join(genDir, "test-agent.md")
	if err := os.WriteFile(agentPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	agentNames := make(map[string]bool)
	skillNames := make(map[string]bool)
	checks := validateAgent(agentPath, "test-agent.md", agentNames, skillNames)

	// Should include the generated-reports tools check
	foundGenReports := false
	for _, c := range checks {
		if c.Status == "passed" && c.Name == "Agent: test-agent.md - Generated Reports Tools" {
			foundGenReports = true
			break
		}
	}
	if !foundGenReports {
		t.Error("expected Generated Reports Tools check to be included and pass")
	}
}

func TestValidateRequiredFields_EmptyTools(t *testing.T) {
	agent := ClaudeAgentFull{
		Name:        "test",
		Description: "desc",
		Tools:       "", // empty tools
		Model:       "sonnet",
		Color:       "blue",
	}
	check := validateRequiredFields("test.md", agent)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for empty tools, got %q", check.Status)
	}
}

func TestValidateTools_EmptyEntryInTools(t *testing.T) {
	// "Read,,Write" → split gives ["Read", "", "Write"]; empty entry must be skipped
	check := validateTools("test.md", "Read,,Write")
	if check.Status != "passed" {
		t.Errorf("expected 'passed' when empty entries are skipped, got %q: %s", check.Status, check.Message)
	}
}

func TestValidateFieldOrder_TooManyFields(t *testing.T) {
	// 7 fields → more than the 6 in RequiredFieldOrder
	frontmatter := []byte("name: test\ndescription: desc\ntools: Read\nmodel: sonnet\ncolor: blue\nskills:\nextra: value\n")
	check := validateFieldOrder("test.md", frontmatter)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for too many fields, got %q", check.Status)
	}
}

func TestValidateFieldOrder_WrongOrder(t *testing.T) {
	// description before name → wrong order
	frontmatter := []byte("description: desc\nname: test\n")
	check := validateFieldOrder("test.md", frontmatter)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' for wrong field order, got %q", check.Status)
	}
}

func TestValidateYAMLFormattingRaw_ShortContent(t *testing.T) {
	// fewer than 3 lines → passes as "file too short"
	check := validateYAMLFormattingRaw("test check", []byte("---"))
	if check.Status != "passed" {
		t.Errorf("expected 'passed' for short content, got %q", check.Status)
	}
	if check.Message != "File too short to check formatting" {
		t.Errorf("expected short-content message, got %q", check.Message)
	}
}

func TestValidateYAMLFormattingRaw_NoFrontmatterStart(t *testing.T) {
	// First line is not "---"
	content := []byte("name: test\n---\nBody content")
	check := validateYAMLFormattingRaw("test check", content)
	if check.Status != "failed" {
		t.Errorf("expected 'failed' when no frontmatter start, got %q", check.Status)
	}
}
