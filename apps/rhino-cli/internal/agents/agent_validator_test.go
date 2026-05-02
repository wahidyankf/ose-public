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

	// Expected checks for a valid agent (no generated-reports check):
	//   1. YAML formatting
	//   2. YAML syntax
	//   3. Required fields
	//   4. Field order
	//   5. Valid tools
	//   6. Valid model
	//   7. Valid color (color is set, so this check is included)
	//   8. Filename match
	//   9. Name uniqueness
	//  10. Skills exist
	//  11. No comments
	if len(checks) != 11 {
		t.Errorf("Expected 11 checks, got %d", len(checks))
		for i, c := range checks {
			t.Logf("  %d: %s [%s]", i, c.Name, c.Status)
		}
	}

	for _, check := range checks {
		if check.Status == "failed" {
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
		Tools:       []string{"Read", "Write"},
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
		Tools:       []string{"Read", "Write"},
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
		Tools:       []string{"Read"},
		Model:       "",
		Color:       "",
	}

	check := validateRequiredFields("test-agent.md", agent)

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

// TestValidateRequiredFields_ToolsAndColorOptional asserts that the relaxed
// required-field rule (P1.6) treats tools and color as optional, not
// required. The Claude Code spec only mandates name + description.
func TestValidateRequiredFields_ToolsAndColorOptional(t *testing.T) {
	agent := ClaudeAgentFull{
		Name:        "test",
		Description: "desc",
		// Tools, Model, Color, Skills all empty
	}
	check := validateRequiredFields("test.md", agent)
	if check.Status != "passed" {
		t.Errorf("Expected 'passed' when only name+description set; got %q (msg=%s)", check.Status, check.Message)
	}
}

func TestValidateTools_ValidTools(t *testing.T) {
	tests := []struct {
		name  string
		tools []string
	}{
		{"single tool", []string{"Read"}},
		{"multiple tools", []string{"Read", "Write", "Edit"}},
		{
			"all original valid tools",
			[]string{"Read", "Write", "Edit", "Glob", "Grep", "Bash", "TodoWrite", "WebFetch", "WebSearch"},
		},
		{"with extra spaces (already trimmed by parser)", []string{"Read", "Write", "Edit"}},
		{"new orchestration tools", []string{"Agent", "Task", "SlashCommand"}},
		{"plan-mode tools", []string{"ExitPlanMode", "EnterPlanMode"}},
		{"shell tools", []string{"BashOutput", "KillShell"}},
		{"mcp tools", []string{"ListMcpResourcesTool", "ReadMcpResourceTool"}},
		{"notebook + question", []string{"NotebookEdit", "AskUserQuestion"}},
		{"parameterized agent", []string{"Agent(general-purpose)", "Read"}},
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
	check := validateTools("test.md", []string{"Read", "InvalidTool", "Write"})

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}

	if check.Actual != "Invalid tools: [InvalidTool]" {
		t.Errorf("Expected invalid tools message, got '%s'", check.Actual)
	}
}

func TestValidateTools_MultipleInvalid(t *testing.T) {
	check := validateTools("test.md", []string{"Read", "BadTool", "AnotherBad"})

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

// TestValidateTools_AcceptsCommaStringViaParser verifies the upstream
// shape-tolerance: a comma-separated string passed through ParseClaudeTools
// yields a []string that validateTools accepts.
func TestValidateTools_AcceptsCommaStringViaParser(t *testing.T) {
	tools := ParseClaudeTools("Read, Write, Edit")
	check := validateTools("test.md", tools)
	if check.Status != "passed" {
		t.Errorf("Expected 'passed' for comma-string parsed tools, got '%s': %s", check.Status, check.Message)
	}
}

// TestValidateTools_AcceptsArrayViaParser verifies the upstream
// shape-tolerance: a YAML []interface{} (sequence form) passed through
// ParseClaudeTools yields a []string that validateTools accepts.
func TestValidateTools_AcceptsArrayViaParser(t *testing.T) {
	tools := ParseClaudeTools([]interface{}{"Read", "Write", "Bash"})
	check := validateTools("test.md", tools)
	if check.Status != "passed" {
		t.Errorf("Expected 'passed' for array-form parsed tools, got '%s': %s", check.Status, check.Message)
	}
}

func TestValidateModel_ValidModelAliases(t *testing.T) {
	validModels := []string{"", "sonnet", "opus", "haiku", "inherit"}

	for _, model := range validModels {
		t.Run("model: "+model, func(t *testing.T) {
			check := validateModel("test.md", model)
			if check.Status != "passed" {
				t.Errorf("Expected status 'passed' for model '%s', got '%s'", model, check.Status)
			}
		})
	}
}

func TestValidateModel_ValidFullModelIDs(t *testing.T) {
	fullIDs := []string{
		"claude-opus-4-7",
		"claude-sonnet-4-6",
		"claude-haiku-4-5",
		"claude-3-5-sonnet",
		"claude-opus-4-7-1m",
	}
	for _, id := range fullIDs {
		t.Run("full id: "+id, func(t *testing.T) {
			check := validateModel("test.md", id)
			if check.Status != "passed" {
				t.Errorf("Expected status 'passed' for model '%s', got '%s'", id, check.Status)
			}
		})
	}
}

func TestValidateModel_InvalidModel(t *testing.T) {
	for _, m := range []string{"gpt-4", "random", "Claude-Opus", "claude_opus", "anthropic/claude-3"} {
		t.Run("invalid: "+m, func(t *testing.T) {
			check := validateModel("test.md", m)
			if check.Status != "failed" {
				t.Errorf("Expected status 'failed' for %q, got '%s'", m, check.Status)
			}
		})
	}
}

func TestValidateColor_ValidColors(t *testing.T) {
	// Updated 2026-05-02 — Claude Code spec allows all eight named colors.
	validColors := []string{"red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"}

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
	// magenta is not in the documented Claude Code color set.
	check := validateColor("test.md", "magenta")

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed' for unknown color 'magenta', got '%s'", check.Status)
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
	check := validateGeneratedReportsTools("test.md", []string{"Read", "Write", "Bash", "Grep"})

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
}

func TestValidateGeneratedReportsTools_MissingWrite(t *testing.T) {
	check := validateGeneratedReportsTools("test.md", []string{"Read", "Bash", "Grep"})

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateGeneratedReportsTools_MissingBash(t *testing.T) {
	check := validateGeneratedReportsTools("test.md", []string{"Read", "Write", "Grep"})

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
}

func TestValidateGeneratedReportsTools_MissingBoth(t *testing.T) {
	check := validateGeneratedReportsTools("test.md", []string{"Read", "Grep"})

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

	failedCount := 0
	for _, check := range checks {
		if check.Status == "failed" {
			failedCount++
			t.Logf("Unexpected failure: %s — %s", check.Name, check.Message)
		}
	}

	if failedCount != 0 {
		t.Errorf("Expected zero failed checks, got %d", failedCount)
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

func TestValidateAgent_NoClosingFrontmatter(t *testing.T) {
	// Tests the ExtractFrontmatter error path (line 42-48) when file passes formatting
	// but has no closing --- marker. This is different from TestValidateAgent_InvalidYAML
	// which has name:value (no space) and fails the formatting check first.
	tmpDir := t.TempDir()

	// Content has proper formatting (spaces after colons) but no closing ---
	// validateYAMLFormatting will pass (formatting is fine), but ExtractFrontmatter will fail
	content := "---\nname: test-agent\ndescription: Test desc\n"
	agentPath := filepath.Join(tmpDir, "test-agent.md")
	if err := os.WriteFile(agentPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	agentNames := make(map[string]bool)
	skillNames := make(map[string]bool)
	checks := validateAgent(agentPath, "test-agent.md", agentNames, skillNames)

	foundFailed := false
	for _, c := range checks {
		if c.Status == "failed" {
			foundFailed = true
			break
		}
	}
	if !foundFailed {
		t.Error("expected at least one failed check for missing closing ---")
	}
}

// TestValidateRequiredFields_EmptyTools — under the relaxed spec, an empty
// tools field is now ACCEPTED (tools is optional). This test asserts the
// new behaviour.
func TestValidateRequiredFields_EmptyTools(t *testing.T) {
	agent := ClaudeAgentFull{
		Name:        "test",
		Description: "desc",
		// Tools nil/empty
		Model: "sonnet",
		Color: "blue",
	}
	check := validateRequiredFields("test.md", agent)
	if check.Status != "passed" {
		t.Errorf("expected 'passed' for missing tools (now optional), got %q", check.Status)
	}
}

func TestValidateTools_EmptyEntryInTools(t *testing.T) {
	// A nil-or-empty slice should pass validateTools.
	check := validateTools("test.md", []string{"Read", "", "Write"})
	if check.Status != "passed" {
		t.Errorf("expected 'passed' when empty entries are skipped, got %q: %s", check.Status, check.Message)
	}
}

// TestValidateFieldOrder_OptionalAfterRequired confirms that the relaxed
// rule allows optional fields in any order, including extra unknown fields
// (which should now appear as warnings, not failures).
func TestValidateFieldOrder_OptionalAfterRequired(t *testing.T) {
	frontmatter := []byte("name: test\ndescription: desc\ntools: Read\nmodel: sonnet\ncolor: blue\nskills:\nextra: value\n")
	checks := validateFieldOrder("test.md", frontmatter)

	// First check is the Field Order check; expect passed because required
	// fields come first.
	if len(checks) == 0 || checks[0].Status != "passed" {
		t.Errorf("expected first check 'passed' (required fields appear first), got %+v", checks)
	}

	// Subsequent check(s) should be warnings naming the unknown field.
	foundUnknownWarning := false
	for _, c := range checks[1:] {
		if c.Status == "warning" && c.Actual == "Unknown field: extra" {
			foundUnknownWarning = true
		}
	}
	if !foundUnknownWarning {
		t.Errorf("expected a warning for unknown field 'extra'; got: %+v", checks)
	}
}

func TestValidateFieldOrder_OptionalReordered(t *testing.T) {
	// Optional fields in a different order — previously a FAIL, now PASS.
	frontmatter := []byte("name: test\ndescription: desc\ncolor: blue\nmodel: sonnet\ntools: Read\nskills:\n")
	checks := validateFieldOrder("test.md", frontmatter)

	if len(checks) == 0 || checks[0].Status != "passed" {
		t.Errorf("expected first check 'passed' for reordered optional fields, got %+v", checks)
	}
	for _, c := range checks {
		if c.Status == "failed" {
			t.Errorf("did not expect any 'failed' check; got %s", c.Name)
		}
	}
}

func TestValidateFieldOrder_RequiredAfterOptional_Fails(t *testing.T) {
	// description (required) appears AFTER tools (optional) → required-first violation.
	frontmatter := []byte("name: test\ntools: Read\ndescription: desc\nmodel: sonnet\n")
	checks := validateFieldOrder("test.md", frontmatter)

	if len(checks) == 0 || checks[0].Status != "failed" {
		t.Errorf("expected first check 'failed' for required-after-optional, got %+v", checks)
	}
}

func TestValidateFieldOrder_MultipleUnknownFields(t *testing.T) {
	frontmatter := []byte("name: test\ndescription: desc\nfoo: 1\nbar: 2\nbaz: 3\n")
	checks := validateFieldOrder("test.md", frontmatter)

	warningNames := map[string]bool{}
	for _, c := range checks {
		if c.Status == "warning" {
			warningNames[c.Actual] = true
		}
	}
	for _, expected := range []string{"Unknown field: foo", "Unknown field: bar", "Unknown field: baz"} {
		if !warningNames[expected] {
			t.Errorf("expected warning for %q; got: %+v", expected, warningNames)
		}
	}
}

// TestValidateFieldOrder_DescriptionBeforeName — under the relaxed rule,
// both name and description are required, so description appearing before
// name is still acceptable (no required-after-optional violation).
func TestValidateFieldOrder_RequiredFieldsCanReorder(t *testing.T) {
	frontmatter := []byte("description: desc\nname: test\n")
	checks := validateFieldOrder("test.md", frontmatter)
	if len(checks) == 0 || checks[0].Status != "passed" {
		t.Errorf("expected passed when required fields appear in any order before optional, got %+v", checks)
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

func TestValidateFieldOrder_InvalidYAML(t *testing.T) {
	// Tests the yaml.Unmarshal error path in validateFieldOrder
	// Invalid YAML that causes Unmarshal to fail
	badFrontmatter := []byte(": invalid yaml {\n  unclosed: [bracket")
	checks := validateFieldOrder("test.md", badFrontmatter)
	// When YAML parsing fails inside validateFieldOrder, it returns a "failed" check
	if len(checks) == 0 || checks[0].Status != "failed" {
		t.Errorf("expected 'failed' for invalid YAML in validateFieldOrder, got %+v", checks)
	}
}

func TestValidateAgent_ValidFormattingButNoClosingDashes(t *testing.T) {
	// Tests agent_validator.go ExtractFrontmatter error path.
	// The file has valid YAML formatting (space after colon) so it passes
	// validateYAMLFormatting, but has no closing --- so ExtractFrontmatter fails.
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}

	// Valid formatting (space after colon) but no closing ---
	content := "---\nname: test-agent\ndescription: A test\nNo closing dashes here"
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

	if len(checks) == 0 {
		t.Fatal("expected at least 1 check")
	}
	// The ExtractFrontmatter error should produce a failed check
	failed := false
	for _, c := range checks {
		if c.Status == "failed" {
			failed = true
			break
		}
	}
	if !failed {
		t.Error("expected at least one failed check for missing closing ---")
	}
}

func TestValidateAgent_ValidFrontmatterBadYAMLParse(t *testing.T) {
	// Tests agent_validator.go yaml.Unmarshal into ClaudeAgentFull failure
	// Need valid YAML formatting + valid frontmatter markers but YAML that fails
	// to unmarshal into ClaudeAgentFull.
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}

	// Frontmatter that extracts fine but has YAML that causes Unmarshal error
	// Using invalid YAML after the opening ---
	content := "---\n: invalid yaml {\n  unclosed: [bracket\n---\n\nBody.\n"
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

	if len(checks) == 0 {
		t.Fatal("expected at least 1 check")
	}
	failed := false
	for _, c := range checks {
		if c.Status == "failed" {
			failed = true
			break
		}
	}
	if !failed {
		t.Error("expected at least one failed check for invalid YAML frontmatter")
	}
}

// TestValidateAgent_OptionalClaudeOnlyFields verifies an agent that uses
// Claude-only optional fields (memory, isolation, background) validates
// without failures (the fields are documented in ValidClaudeAgentFields).
func TestValidateAgent_OptionalClaudeOnlyFields(t *testing.T) {
	tmpDir := t.TempDir()
	agentsDir := filepath.Join(tmpDir, ".claude", "agents")
	if err := os.MkdirAll(agentsDir, 0755); err != nil {
		t.Fatalf("Failed to create agents dir: %v", err)
	}

	content := `---
name: test-agent
description: Test agent with optional fields
tools: Read, Write
model: inherit
color: orange
isolation: worktree
memory: project
background: true
effort: high
---
Body.`
	agentPath := filepath.Join(agentsDir, "test-agent.md")
	if err := os.WriteFile(agentPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	agentNames := make(map[string]bool)
	skillNames := make(map[string]bool)
	checks := validateAgent(agentPath, "test-agent.md", agentNames, skillNames)

	for _, c := range checks {
		if c.Status == "failed" {
			t.Errorf("unexpected failure: %s — %s", c.Name, c.Message)
		}
	}
}
