package agents

import (
	"testing"

	"gopkg.in/yaml.v3"
)

func TestClaudeAgent(t *testing.T) {
	agent := ClaudeAgent{
		Name:   "test-agent",
		Tools:  []string{"Read", "Write", "Edit"},
		Skills: []string{"skill-1", "skill-2"},
	}

	if agent.Name != "test-agent" {
		t.Errorf("Expected name 'test-agent', got '%s'", agent.Name)
	}
	if len(agent.Tools) != 3 {
		t.Errorf("Expected 3 tools, got %d", len(agent.Tools))
	}
	if len(agent.Skills) != 2 {
		t.Errorf("Expected 2 skills, got %d", len(agent.Skills))
	}
}

func TestOpenCodeAgent(t *testing.T) {
	tools := map[string]bool{
		"read":  true,
		"write": true,
		"edit":  true,
	}

	agent := OpenCodeAgent{
		Description: "Test agent description",
		Model:       "zai-coding-plan/glm-5.1",
		Tools:       tools,
	}

	if agent.Description != "Test agent description" {
		t.Errorf("Expected description 'Test agent description', got '%s'", agent.Description)
	}
	if agent.Model != "zai-coding-plan/glm-5.1" {
		t.Errorf("Expected model 'zai-coding-plan/glm-5.1', got '%s'", agent.Model)
	}
	if len(agent.Tools) != 3 {
		t.Errorf("Expected 3 tools, got %d", len(agent.Tools))
	}
	if !agent.Tools["read"] {
		t.Error("Expected 'read' tool to be true")
	}
}

func TestSyncOptions(t *testing.T) {
	opts := SyncOptions{
		RepoRoot: "/path/to/repo",
		DryRun:   true,
		Verbose:  true,
	}

	if opts.RepoRoot != "/path/to/repo" {
		t.Errorf("Expected RepoRoot '/path/to/repo', got '%s'", opts.RepoRoot)
	}
	if !opts.DryRun {
		t.Error("Expected DryRun to be true")
	}
	if !opts.Verbose {
		t.Error("Expected Verbose to be true")
	}
}

func TestSyncResult(t *testing.T) {
	result := SyncResult{
		AgentsConverted: 45,
		SkillsCopied:    23,
		FailedFiles:     []string{},
	}

	if result.AgentsConverted != 45 {
		t.Errorf("Expected 45 agents converted, got %d", result.AgentsConverted)
	}
	if result.SkillsCopied != 23 {
		t.Errorf("Expected 23 skills copied, got %d", result.SkillsCopied)
	}
	if len(result.FailedFiles) != 0 {
		t.Errorf("Expected 0 failed files, got %d", len(result.FailedFiles))
	}
}

func TestSyncResultWithFailures(t *testing.T) {
	result := SyncResult{
		AgentsFailed: 2,
		SkillsFailed: 1,
		FailedFiles:  []string{"agent1.md", "skill1.md"},
	}

	if result.AgentsFailed != 2 {
		t.Errorf("Expected 2 failed agents, got %d", result.AgentsFailed)
	}
	if result.SkillsFailed != 1 {
		t.Errorf("Expected 1 failed skill, got %d", result.SkillsFailed)
	}
	if len(result.FailedFiles) != 2 {
		t.Errorf("Expected 2 failed files, got %d", len(result.FailedFiles))
	}
}

func TestValidationResult(t *testing.T) {
	checks := []ValidationCheck{
		{Name: "Count check", Status: "passed", Expected: "45", Actual: "45", Message: "Agent count matches"},
		{Name: "Format check", Status: "passed", Expected: "valid", Actual: "valid", Message: "Format valid"},
	}

	result := ValidationResult{
		TotalChecks:  2,
		PassedChecks: 2,
		FailedChecks: 0,
		Checks:       checks,
	}

	if result.TotalChecks != 2 {
		t.Errorf("Expected 2 total checks, got %d", result.TotalChecks)
	}
	if result.PassedChecks != 2 {
		t.Errorf("Expected 2 passed checks, got %d", result.PassedChecks)
	}
	if result.FailedChecks != 0 {
		t.Errorf("Expected 0 failed checks, got %d", result.FailedChecks)
	}
	if len(result.Checks) != 2 {
		t.Errorf("Expected 2 checks, got %d", len(result.Checks))
	}
}

// TestValidationResult_TriState exercises the new WarningChecks tally and
// confirms passed + warning + failed == total.
func TestValidationResult_TriState(t *testing.T) {
	r := ValidationResult{
		TotalChecks:   6,
		PassedChecks:  3,
		WarningChecks: 2,
		FailedChecks:  1,
	}
	if r.PassedChecks+r.WarningChecks+r.FailedChecks != r.TotalChecks {
		t.Errorf("expected counters to sum to total; got %d+%d+%d != %d",
			r.PassedChecks, r.WarningChecks, r.FailedChecks, r.TotalChecks)
	}
}

func TestValidationCheck(t *testing.T) {
	check := ValidationCheck{
		Status:   "passed",
		Expected: "expected value",
		Actual:   "expected value",
	}

	if check.Status != "passed" {
		t.Errorf("Expected status 'passed', got '%s'", check.Status)
	}
	if check.Expected != check.Actual {
		t.Errorf("Expected and Actual should match: '%s' != '%s'", check.Expected, check.Actual)
	}
}

func TestValidationCheckFailed(t *testing.T) {
	check := ValidationCheck{
		Status:   "failed",
		Expected: "expected value",
		Actual:   "different value",
	}

	if check.Status != "failed" {
		t.Errorf("Expected status 'failed', got '%s'", check.Status)
	}
	if check.Expected == check.Actual {
		t.Error("Expected and Actual should be different for failed check")
	}
}

// TestValidationCheckWarning exercises the new tri-state "warning" status.
func TestValidationCheckWarning(t *testing.T) {
	check := ValidationCheck{
		Status:   "warning",
		Expected: "Field listed in ValidClaudeAgentFields",
		Actual:   "Unknown field: foo",
		Message:  "advisory only; does not fail validation",
	}
	if check.Status != "warning" {
		t.Errorf("Expected status 'warning', got '%s'", check.Status)
	}
	if check.Expected == "" || check.Actual == "" || check.Message == "" {
		t.Errorf("warning checks should populate Expected/Actual/Message; got %+v", check)
	}
}

// TestClaudeAgentFull_UnmarshalYAML_StringTools confirms the custom YAML
// unmarshaller normalizes a comma-separated tools string into []string.
func TestClaudeAgentFull_UnmarshalYAML_StringTools(t *testing.T) {
	yamlData := []byte(`name: my-agent
description: an agent
tools: "Read, Write, Bash"
model: sonnet
color: blue
`)
	var agent ClaudeAgentFull
	if err := yaml.Unmarshal(yamlData, &agent); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{"Read", "Write", "Bash"}
	if len(agent.Tools) != len(want) {
		t.Fatalf("expected %d tools, got %d (%v)", len(want), len(agent.Tools), agent.Tools)
	}
	for i, w := range want {
		if agent.Tools[i] != w {
			t.Errorf("tool[%d] = %q; want %q", i, agent.Tools[i], w)
		}
	}
}

// TestClaudeAgentFull_UnmarshalYAML_ArrayTools confirms the custom YAML
// unmarshaller normalizes a YAML sequence of tools into []string.
func TestClaudeAgentFull_UnmarshalYAML_ArrayTools(t *testing.T) {
	yamlData := []byte(`name: my-agent
description: an agent
tools:
  - Read
  - Write
  - Bash
model: sonnet
color: blue
`)
	var agent ClaudeAgentFull
	if err := yaml.Unmarshal(yamlData, &agent); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{"Read", "Write", "Bash"}
	if len(agent.Tools) != len(want) {
		t.Fatalf("expected %d tools, got %d (%v)", len(want), len(agent.Tools), agent.Tools)
	}
	for i, w := range want {
		if agent.Tools[i] != w {
			t.Errorf("tool[%d] = %q; want %q", i, agent.Tools[i], w)
		}
	}
}

// TestClaudeAgentFull_UnmarshalYAML_NoTools confirms the custom YAML
// unmarshaller handles a missing tools field gracefully (nil slice).
func TestClaudeAgentFull_UnmarshalYAML_NoTools(t *testing.T) {
	yamlData := []byte(`name: my-agent
description: an agent
model: sonnet
color: blue
`)
	var agent ClaudeAgentFull
	if err := yaml.Unmarshal(yamlData, &agent); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(agent.Tools) != 0 {
		t.Errorf("expected no tools, got %v", agent.Tools)
	}
	if agent.Name != "my-agent" {
		t.Errorf("expected name to be parsed; got %q", agent.Name)
	}
}

// TestClaudeAgentFull_UnmarshalYAML_PreservesOtherFields makes sure no
// field is lost when the wrapper unmarshalling runs.
func TestClaudeAgentFull_UnmarshalYAML_PreservesOtherFields(t *testing.T) {
	yamlData := []byte(`name: a
description: d
tools: "Read"
model: opus
color: orange
skills:
  - skill-1
  - skill-2
`)
	var agent ClaudeAgentFull
	if err := yaml.Unmarshal(yamlData, &agent); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if agent.Name != "a" || agent.Description != "d" || agent.Model != "opus" || agent.Color != "orange" {
		t.Errorf("scalar fields lost during unmarshal: %+v", agent)
	}
	if len(agent.Skills) != 2 || agent.Skills[0] != "skill-1" || agent.Skills[1] != "skill-2" {
		t.Errorf("skills slice not preserved: %v", agent.Skills)
	}
}

// TestValidClaudeAgentFields_RequiredKeysPresent ensures the documented
// allow-list contains the fields the validator depends on for required
// checks.
func TestValidClaudeAgentFields_RequiredKeysPresent(t *testing.T) {
	for _, k := range []string{"name", "description", "tools", "model", "color", "skills"} {
		if !ValidClaudeAgentFields[k] {
			t.Errorf("required-allow-listed field %q missing from ValidClaudeAgentFields", k)
		}
	}
}

// TestValidClaudeSkillFields_RequiredKeysPresent ensures the documented
// allow-list contains the fields the validator hard-requires.
func TestValidClaudeSkillFields_RequiredKeysPresent(t *testing.T) {
	for _, k := range []string{"name", "description"} {
		if !ValidClaudeSkillFields[k] {
			t.Errorf("required-allow-listed field %q missing from ValidClaudeSkillFields", k)
		}
	}
}
