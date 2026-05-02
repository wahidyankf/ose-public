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

// FormatSyncText tests

func TestFormatSyncText_Default(t *testing.T) {
	result := makeSyncResult(false)
	out := FormatSyncText(result, false, false)
	if !strings.Contains(out, "Sync Complete") {
		t.Errorf("expected 'Sync Complete' in text output, got %q", out)
	}
	if !strings.Contains(out, "Agents: 3 converted") {
		t.Errorf("expected agents count, got %q", out)
	}
}

func TestFormatSyncText_Quiet(t *testing.T) {
	result := makeSyncResult(false)
	out := FormatSyncText(result, false, true)
	if strings.Contains(out, "Sync Complete") {
		t.Errorf("expected no header in quiet mode, got %q", out)
	}
	if !strings.Contains(out, "Agents:") {
		t.Errorf("expected summary in quiet mode, got %q", out)
	}
}

func TestFormatSyncText_WithFailures(t *testing.T) {
	result := makeSyncResult(true)
	out := FormatSyncText(result, false, false)
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

func TestFormatSyncText_Success(t *testing.T) {
	result := makeSyncResult(false)
	out := FormatSyncText(result, false, false)
	if !strings.Contains(out, "SUCCESS") {
		t.Errorf("expected SUCCESS status, got %q", out)
	}
}

func TestFormatSyncText_AgentAndSkillFailures(t *testing.T) {
	result := &SyncResult{
		AgentsConverted: 2,
		AgentsFailed:    1,
		SkillsCopied:    1,
		SkillsFailed:    2,
		FailedFiles:     []string{"bad-skill.md"},
		Duration:        time.Second,
	}
	out := FormatSyncText(result, false, false)
	if !strings.Contains(out, "1 failed") {
		t.Errorf("expected agent failure count, got %q", out)
	}
}

// FormatSyncJSON tests

func TestFormatSyncJSON_Success(t *testing.T) {
	result := makeSyncResult(false)
	out, err := FormatSyncJSON(result)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
	if parsed["status"] != "success" {
		t.Errorf("expected status=success, got %v", parsed["status"])
	}
	if _, ok := parsed["timestamp"]; !ok {
		t.Error("expected timestamp field in JSON")
	}
	if parsed["agents_converted"] != float64(3) {
		t.Errorf("expected agents_converted=3, got %v", parsed["agents_converted"])
	}
	if parsed["duration_ms"] != float64(1000) {
		t.Errorf("expected duration_ms=1000, got %v", parsed["duration_ms"])
	}
}

func TestFormatSyncJSON_Failure(t *testing.T) {
	result := makeSyncResult(true)
	out, err := FormatSyncJSON(result)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON: %v", err)
	}
	if parsed["status"] != "failure" {
		t.Errorf("expected status=failure, got %v", parsed["status"])
	}
	if parsed["agents_failed"] != float64(1) {
		t.Errorf("expected agents_failed=1, got %v", parsed["agents_failed"])
	}
}

func TestFormatSyncJSON_NilFailedFiles(t *testing.T) {
	result := &SyncResult{
		AgentsConverted: 1,
		Duration:        time.Second,
	}
	out, err := FormatSyncJSON(result)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Verify failed_files is an empty array, not null
	if !strings.Contains(out, `"failed_files": []`) {
		t.Errorf("expected empty array for failed_files, got %s", out)
	}
}

// FormatSyncMarkdown tests

func TestFormatSyncMarkdown_Success(t *testing.T) {
	result := makeSyncResult(false)
	out := FormatSyncMarkdown(result)
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

func TestFormatSyncMarkdown_WithFailures(t *testing.T) {
	result := makeSyncResult(true)
	out := FormatSyncMarkdown(result)
	if !strings.Contains(out, "## Failed Files") {
		t.Errorf("expected '## Failed Files' section, got %q", out)
	}
	if !strings.Contains(out, "FAILED") {
		t.Errorf("expected FAILED status, got %q", out)
	}
}

func TestFormatSyncMarkdown_AgentAndSkillFailed(t *testing.T) {
	result := &SyncResult{
		AgentsConverted: 1,
		AgentsFailed:    2,
		SkillsCopied:    1,
		SkillsFailed:    3,
		FailedFiles:     []string{"x.md"},
		Duration:        time.Second,
	}
	out := FormatSyncMarkdown(result)
	if !strings.Contains(out, "**Agents Failed**") {
		t.Errorf("expected agents failed line, got %q", out)
	}
	if !strings.Contains(out, "**Skills Failed**") {
		t.Errorf("expected skills failed line, got %q", out)
	}
}

// FormatValidationText tests

func TestFormatValidationText_Default(t *testing.T) {
	result := makeValidationResult(false)
	out := FormatValidationText(result, false, false)
	if !strings.Contains(out, "Validation Complete") {
		t.Errorf("expected 'Validation Complete', got %q", out)
	}
}

func TestFormatValidationText_Quiet(t *testing.T) {
	result := makeValidationResult(false)
	out := FormatValidationText(result, false, true)
	if strings.Contains(out, "Validation Complete") {
		t.Errorf("expected no header in quiet mode, got %q", out)
	}
	if !strings.Contains(out, "Total Checks:") {
		t.Errorf("expected summary in quiet mode, got %q", out)
	}
}

func TestFormatValidationText_WithFailures(t *testing.T) {
	result := makeValidationResult(true)
	out := FormatValidationText(result, false, false)
	if !strings.Contains(out, "Failed Checks:") {
		t.Errorf("expected 'Failed Checks:' section, got %q", out)
	}
	if !strings.Contains(out, "VALIDATION FAILED") {
		t.Errorf("expected VALIDATION FAILED, got %q", out)
	}
}

func TestFormatValidationText_VerboseAllChecks(t *testing.T) {
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
	out := FormatValidationText(result, true, false)
	if !strings.Contains(out, "All Checks:") {
		t.Errorf("expected 'All Checks:' in verbose output, got %q", out)
	}
}

func TestFormatValidationText_FailedCheckDetails(t *testing.T) {
	result := &ValidationResult{
		TotalChecks:  1,
		FailedChecks: 1,
		Duration:     time.Second,
		Checks: []ValidationCheck{
			{Name: "Check X", Status: "failed", Expected: "expected-val", Actual: "actual-val", Message: "detail message"},
		},
	}
	out := FormatValidationText(result, false, false)
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

// FormatValidationJSON tests

func TestFormatValidationJSON_Success(t *testing.T) {
	result := makeValidationResult(false)
	out, err := FormatValidationJSON(result)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
	if parsed["status"] != "success" {
		t.Errorf("expected status=success, got %v", parsed["status"])
	}
	if _, ok := parsed["timestamp"]; !ok {
		t.Error("expected timestamp field in JSON")
	}
	if parsed["total_checks"] != float64(3) {
		t.Errorf("expected total_checks=3, got %v", parsed["total_checks"])
	}
	if parsed["duration_ms"] != float64(1000) {
		t.Errorf("expected duration_ms=1000, got %v", parsed["duration_ms"])
	}
}

func TestFormatValidationJSON_Failure(t *testing.T) {
	result := makeValidationResult(true)
	out, err := FormatValidationJSON(result)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON: %v", err)
	}
	if parsed["status"] != "failure" {
		t.Errorf("expected status=failure, got %v", parsed["status"])
	}
	if parsed["failed_checks"] != float64(1) {
		t.Errorf("expected failed_checks=1, got %v", parsed["failed_checks"])
	}
	checks, ok := parsed["checks"].([]any)
	if !ok {
		t.Fatal("expected checks array in JSON")
	}
	if len(checks) != 2 {
		t.Errorf("expected 2 checks, got %d", len(checks))
	}
}

// FormatValidationMarkdown tests

func TestFormatValidationMarkdown_Success(t *testing.T) {
	result := makeValidationResult(false)
	out := FormatValidationMarkdown(result, false)
	if !strings.Contains(out, "# Validation Results") {
		t.Errorf("expected markdown header, got %q", out)
	}
	if !strings.Contains(out, "VALIDATION PASSED") {
		t.Errorf("expected VALIDATION PASSED, got %q", out)
	}
}

func TestFormatValidationMarkdown_WithFailures(t *testing.T) {
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
	out := FormatValidationMarkdown(result, false)
	if !strings.Contains(out, "## Failed Checks") {
		t.Errorf("expected '## Failed Checks' section, got %q", out)
	}
	if !strings.Contains(out, "VALIDATION FAILED") {
		t.Errorf("expected VALIDATION FAILED status, got %q", out)
	}
}

func TestFormatValidationMarkdown_VerboseAllChecks(t *testing.T) {
	result := &ValidationResult{
		TotalChecks:  1,
		PassedChecks: 1,
		Duration:     time.Second,
		Checks: []ValidationCheck{
			{Name: "Check A", Status: "passed", Message: "all good"},
		},
	}
	out := FormatValidationMarkdown(result, true)
	if !strings.Contains(out, "## All Checks") {
		t.Errorf("expected '## All Checks' section in verbose, got %q", out)
	}
}

func TestFormatValidationMarkdown_FailedCheckDetails(t *testing.T) {
	result := &ValidationResult{
		TotalChecks:  1,
		FailedChecks: 1,
		Duration:     time.Second,
		Checks: []ValidationCheck{
			{Name: "Check X", Status: "failed", Expected: "exp-val", Actual: "act-val", Message: "msg"},
		},
	}
	out := FormatValidationMarkdown(result, false)
	if !strings.Contains(out, "**Expected**") {
		t.Errorf("expected bold Expected field, got %q", out)
	}
	if !strings.Contains(out, "**Actual**") {
		t.Errorf("expected bold Actual field, got %q", out)
	}
}

// ---- Tri-state warning rendering ----

func makeValidationResultWithWarnings() *ValidationResult {
	return &ValidationResult{
		TotalChecks:   3,
		PassedChecks:  2,
		WarningChecks: 1,
		FailedChecks:  0,
		Duration:      time.Second,
		Checks: []ValidationCheck{
			{Name: "Check A", Status: "passed", Message: "ok"},
			{Name: "Check B", Status: "passed", Message: "ok"},
			{Name: "Check C - Unknown Field: foo", Status: "warning",
				Expected: "Field listed in ValidClaudeAgentFields",
				Actual:   "Unknown field: foo",
				Message:  "advisory"},
		},
	}
}

func TestFormatValidationText_WithWarnings(t *testing.T) {
	out := FormatValidationText(makeValidationResultWithWarnings(), false, false)
	if !strings.Contains(out, "Warnings: 1") {
		t.Errorf("expected 'Warnings: 1' line, got %q", out)
	}
	if !strings.Contains(out, "⚠") {
		t.Errorf("expected warning marker (⚠), got %q", out)
	}
	if !strings.Contains(out, "PASSED WITH WARNINGS") {
		t.Errorf("expected 'PASSED WITH WARNINGS' status banner, got %q", out)
	}
	if strings.Contains(out, "VALIDATION FAILED") {
		t.Errorf("warnings alone must not produce FAILED banner, got %q", out)
	}
}

func TestFormatValidationText_FailureOverridesWarnings(t *testing.T) {
	r := makeValidationResultWithWarnings()
	r.FailedChecks = 1
	r.Checks = append(r.Checks, ValidationCheck{Name: "Boom", Status: "failed", Message: "broke"})
	r.TotalChecks++
	out := FormatValidationText(r, false, false)
	if !strings.Contains(out, "VALIDATION FAILED") {
		t.Errorf("expected 'VALIDATION FAILED' when failures present, got %q", out)
	}
}

func TestFormatValidationText_VerboseShowsWarningMarker(t *testing.T) {
	out := FormatValidationText(makeValidationResultWithWarnings(), true, false)
	if !strings.Contains(out, "All Checks:") {
		t.Errorf("expected verbose section header, got %q", out)
	}
	if !strings.Contains(out, "⚠ Check C") {
		t.Errorf("expected ⚠ marker for warning check in verbose listing, got %q", out)
	}
}

func TestFormatValidationJSON_WithWarnings(t *testing.T) {
	out, err := FormatValidationJSON(makeValidationResultWithWarnings())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON: %v", err)
	}
	if parsed["status"] != "warning" {
		t.Errorf("expected status=warning, got %v", parsed["status"])
	}
	if parsed["warning_checks"] != float64(1) {
		t.Errorf("expected warning_checks=1, got %v", parsed["warning_checks"])
	}
}

func TestFormatValidationMarkdown_WithWarnings(t *testing.T) {
	out := FormatValidationMarkdown(makeValidationResultWithWarnings(), false)
	if !strings.Contains(out, "## Warnings") {
		t.Errorf("expected '## Warnings' section, got %q", out)
	}
	if !strings.Contains(out, "PASSED WITH WARNINGS") {
		t.Errorf("expected 'PASSED WITH WARNINGS' status, got %q", out)
	}
	if !strings.Contains(out, "**Warnings**: 1") {
		t.Errorf("expected '**Warnings**: 1' summary line, got %q", out)
	}
}

func TestFormatValidationMarkdown_VerboseShowsWarningMarker(t *testing.T) {
	out := FormatValidationMarkdown(makeValidationResultWithWarnings(), true)
	if !strings.Contains(out, "## All Checks") {
		t.Errorf("expected verbose 'All Checks' section, got %q", out)
	}
	if !strings.Contains(out, "⚠ Check C") {
		t.Errorf("expected ⚠ marker for warning in verbose listing, got %q", out)
	}
}
