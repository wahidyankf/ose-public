package agents

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func makeSyncResult(withFailures bool) *SyncResult {
	r := &SyncResult{
		AgentsConverted: 3,
		SkillsCopied:    2,
		Duration:        time.Second,
		FailedFiles:     []string{},
	}
	if withFailures {
		r.AgentsFailed = 1
		r.SkillsFailed = 1
		r.FailedFiles = []string{"bad-agent.md", "bad-skill.md"}
	}
	return r
}

func makeValidationResult(withFailures bool) *ValidationResult {
	r := &ValidationResult{
		TotalChecks:  3,
		PassedChecks: 3,
		FailedChecks: 0,
		Duration:     time.Second,
		Checks: []ValidationCheck{
			{Name: "Agent Count", Status: "passed", Message: "Counts match"},
		},
	}
	if withFailures {
		r.PassedChecks = 2
		r.FailedChecks = 1
		r.Checks = append(r.Checks, ValidationCheck{
			Name:     "Agent: bad-agent.md",
			Status:   "failed",
			Expected: "matching",
			Actual:   "mismatch",
			Message:  "Body mismatch",
		})
	}
	return r
}

// FormatSyncResult dispatcher tests

func TestFormatSyncResult_Text(t *testing.T) {
	result := makeSyncResult(false)
	out := FormatSyncResult(result, "text", false)
	if !strings.Contains(out, "Sync Complete") {
		t.Errorf("expected 'Sync Complete' in text output, got %q", out)
	}
	if !strings.Contains(out, "Agents: 3 converted") {
		t.Errorf("expected agents count, got %q", out)
	}
}

func TestFormatSyncResult_JSON(t *testing.T) {
	result := makeSyncResult(false)
	out := FormatSyncResult(result, "json", false)
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
}

func TestFormatSyncResult_Markdown(t *testing.T) {
	result := makeSyncResult(false)
	out := FormatSyncResult(result, "markdown", false)
	if !strings.Contains(out, "# Sync Results") {
		t.Errorf("expected '# Sync Results' header, got %q", out)
	}
}

func TestFormatSyncResult_DefaultToText(t *testing.T) {
	result := makeSyncResult(false)
	out := FormatSyncResult(result, "unknown", false)
	if !strings.Contains(out, "Agents:") {
		t.Errorf("expected text format for unknown format, got %q", out)
	}
}

// formatSyncResultText tests

func TestFormatSyncResultText_Quiet(t *testing.T) {
	result := makeSyncResult(false)
	out := formatSyncResultText(result, true)
	if strings.Contains(out, "Sync Complete") {
		t.Errorf("expected no header in quiet mode, got %q", out)
	}
	if !strings.Contains(out, "Agents:") {
		t.Errorf("expected summary in quiet mode, got %q", out)
	}
}

func TestFormatSyncResultText_WithFailures(t *testing.T) {
	result := makeSyncResult(true)
	out := formatSyncResultText(result, false)
	if !strings.Contains(out, "Failed Files:") {
		t.Errorf("expected 'Failed Files:' in output, got %q", out)
	}
	if !strings.Contains(out, "bad-agent.md") {
		t.Errorf("expected failed file name, got %q", out)
	}
	if !strings.Contains(out, "FAILED") {
		t.Errorf("expected FAILED status, got %q", out)
	}
}

func TestFormatSyncResultText_Success(t *testing.T) {
	result := makeSyncResult(false)
	out := formatSyncResultText(result, false)
	if !strings.Contains(out, "SUCCESS") {
		t.Errorf("expected SUCCESS status, got %q", out)
	}
}

func TestFormatSyncResultText_AgentAndSkillFailures(t *testing.T) {
	result := &SyncResult{
		AgentsConverted: 2,
		AgentsFailed:    1,
		SkillsCopied:    1,
		SkillsFailed:    2,
		FailedFiles:     []string{"bad-skill.md"},
		Duration:        time.Second,
	}
	out := formatSyncResultText(result, false)
	if !strings.Contains(out, "1 failed") {
		t.Errorf("expected agent failure count, got %q", out)
	}
}

// formatSyncResultJSON tests

func TestFormatSyncResultJSON_Valid(t *testing.T) {
	result := makeSyncResult(false)
	out := formatSyncResultJSON(result)
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
	if parsed["AgentsConverted"] != float64(3) {
		t.Errorf("expected AgentsConverted=3, got %v", parsed["AgentsConverted"])
	}
}

// formatSyncResultMarkdown tests

func TestFormatSyncResultMarkdown_Success(t *testing.T) {
	result := makeSyncResult(false)
	out := formatSyncResultMarkdown(result)
	if !strings.Contains(out, "# Sync Results") {
		t.Errorf("expected markdown header, got %q", out)
	}
	if !strings.Contains(out, "**Agents Converted**") {
		t.Errorf("expected bold agents count, got %q", out)
	}
	if !strings.Contains(out, "SUCCESS") {
		t.Errorf("expected SUCCESS status, got %q", out)
	}
}

func TestFormatSyncResultMarkdown_WithFailures(t *testing.T) {
	result := makeSyncResult(true)
	out := formatSyncResultMarkdown(result)
	if !strings.Contains(out, "## Failed Files") {
		t.Errorf("expected '## Failed Files' section, got %q", out)
	}
	if !strings.Contains(out, "FAILED") {
		t.Errorf("expected FAILED status, got %q", out)
	}
}

func TestFormatSyncResultMarkdown_AgentAndSkillFailed(t *testing.T) {
	result := &SyncResult{
		AgentsConverted: 1,
		AgentsFailed:    2,
		SkillsCopied:    1,
		SkillsFailed:    3,
		FailedFiles:     []string{"x.md"},
		Duration:        time.Second,
	}
	out := formatSyncResultMarkdown(result)
	if !strings.Contains(out, "**Agents Failed**") {
		t.Errorf("expected agents failed line, got %q", out)
	}
	if !strings.Contains(out, "**Skills Failed**") {
		t.Errorf("expected skills failed line, got %q", out)
	}
}

// FormatValidationResult dispatcher tests

func TestFormatValidationResult_Text(t *testing.T) {
	result := makeValidationResult(false)
	out := FormatValidationResult(result, "text", false, false)
	if !strings.Contains(out, "Validation Complete") {
		t.Errorf("expected 'Validation Complete', got %q", out)
	}
}

func TestFormatValidationResult_JSON(t *testing.T) {
	result := makeValidationResult(false)
	out := FormatValidationResult(result, "json", false, false)
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
}

func TestFormatValidationResult_Markdown(t *testing.T) {
	result := makeValidationResult(false)
	out := FormatValidationResult(result, "markdown", false, false)
	if !strings.Contains(out, "# Validation Results") {
		t.Errorf("expected markdown header, got %q", out)
	}
}

func TestFormatValidationResult_DefaultToText(t *testing.T) {
	result := makeValidationResult(false)
	out := FormatValidationResult(result, "unknown", false, false)
	if !strings.Contains(out, "Total Checks:") {
		t.Errorf("expected text format for unknown format, got %q", out)
	}
}

// formatValidationResultText tests

func TestFormatValidationResultText_Quiet(t *testing.T) {
	result := makeValidationResult(false)
	out := formatValidationResultText(result, false, true)
	if strings.Contains(out, "Validation Complete") {
		t.Errorf("expected no header in quiet mode, got %q", out)
	}
	if !strings.Contains(out, "Total Checks:") {
		t.Errorf("expected summary in quiet mode, got %q", out)
	}
}

func TestFormatValidationResultText_WithFailures(t *testing.T) {
	result := makeValidationResult(true)
	out := formatValidationResultText(result, false, false)
	if !strings.Contains(out, "Failed Checks:") {
		t.Errorf("expected 'Failed Checks:' section, got %q", out)
	}
	if !strings.Contains(out, "VALIDATION FAILED") {
		t.Errorf("expected VALIDATION FAILED, got %q", out)
	}
}

func TestFormatValidationResultText_VerboseAllChecks(t *testing.T) {
	result := &ValidationResult{
		TotalChecks:  2,
		PassedChecks: 1,
		FailedChecks: 1,
		Duration:     time.Second,
		Checks: []ValidationCheck{
			{Name: "Check A", Status: "passed", Message: "all good"},
			{Name: "Check B", Status: "failed", Expected: "x", Actual: "y", Message: "mismatch"},
		},
	}
	out := formatValidationResultText(result, true, false)
	if !strings.Contains(out, "All Checks:") {
		t.Errorf("expected 'All Checks:' in verbose output, got %q", out)
	}
}

func TestFormatValidationResultText_FailedCheckDetails(t *testing.T) {
	result := &ValidationResult{
		TotalChecks:  1,
		FailedChecks: 1,
		Duration:     time.Second,
		Checks: []ValidationCheck{
			{Name: "Check X", Status: "failed", Expected: "expected-val", Actual: "actual-val", Message: "detail message"},
		},
	}
	out := formatValidationResultText(result, false, false)
	if !strings.Contains(out, "Expected: expected-val") {
		t.Errorf("expected expected value in output, got %q", out)
	}
	if !strings.Contains(out, "Actual: actual-val") {
		t.Errorf("expected actual value in output, got %q", out)
	}
	if !strings.Contains(out, "Message: detail message") {
		t.Errorf("expected message in output, got %q", out)
	}
}

// formatValidationResultJSON tests

func TestFormatValidationResultJSON_Valid(t *testing.T) {
	result := makeValidationResult(false)
	out := formatValidationResultJSON(result)
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
	if parsed["TotalChecks"] != float64(3) {
		t.Errorf("expected TotalChecks=3, got %v", parsed["TotalChecks"])
	}
}

// formatValidationResultMarkdown tests

func TestFormatValidationResultMarkdown_Success(t *testing.T) {
	result := makeValidationResult(false)
	out := formatValidationResultMarkdown(result, false)
	if !strings.Contains(out, "# Validation Results") {
		t.Errorf("expected markdown header, got %q", out)
	}
	if !strings.Contains(out, "VALIDATION PASSED") {
		t.Errorf("expected VALIDATION PASSED, got %q", out)
	}
}

func TestFormatValidationResultMarkdown_WithFailures(t *testing.T) {
	result := &ValidationResult{
		TotalChecks:  2,
		PassedChecks: 1,
		FailedChecks: 1,
		Duration:     time.Second,
		Checks: []ValidationCheck{
			{Name: "Check A", Status: "passed"},
			{Name: "Check B", Status: "failed", Expected: "exp", Actual: "act", Message: "failed msg"},
		},
	}
	out := formatValidationResultMarkdown(result, false)
	if !strings.Contains(out, "## Failed Checks") {
		t.Errorf("expected '## Failed Checks' section, got %q", out)
	}
	if !strings.Contains(out, "VALIDATION FAILED") {
		t.Errorf("expected VALIDATION FAILED status, got %q", out)
	}
}

func TestFormatValidationResultMarkdown_VerboseAllChecks(t *testing.T) {
	result := &ValidationResult{
		TotalChecks:  1,
		PassedChecks: 1,
		Duration:     time.Second,
		Checks: []ValidationCheck{
			{Name: "Check A", Status: "passed", Message: "all good"},
		},
	}
	out := formatValidationResultMarkdown(result, true)
	if !strings.Contains(out, "## All Checks") {
		t.Errorf("expected '## All Checks' section in verbose, got %q", out)
	}
}

func TestFormatValidationResultMarkdown_FailedCheckDetails(t *testing.T) {
	result := &ValidationResult{
		TotalChecks:  1,
		FailedChecks: 1,
		Duration:     time.Second,
		Checks: []ValidationCheck{
			{Name: "Check X", Status: "failed", Expected: "exp-val", Actual: "act-val", Message: "msg"},
		},
	}
	out := formatValidationResultMarkdown(result, false)
	if !strings.Contains(out, "**Expected**") {
		t.Errorf("expected bold Expected field, got %q", out)
	}
	if !strings.Contains(out, "**Actual**") {
		t.Errorf("expected bold Actual field, got %q", out)
	}
}
