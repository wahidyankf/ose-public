package testcoverage

import (
	"encoding/json"
	"strings"
	"testing"
)

func makeResult(covered, partial, missed int, pct float64, format Format) Result {
	return Result{
		File:      "apps/foo/cover.out",
		Format:    format,
		Covered:   covered,
		Partial:   partial,
		Missed:    missed,
		Total:     covered + partial + missed,
		Pct:       pct,
		Threshold: 85,
		Passed:    pct >= 85,
	}
}

func TestFormatText_Pass(t *testing.T) {
	r := makeResult(86, 5, 9, 86.00, FormatGo)
	out := FormatText(r, false, false)

	if !strings.Contains(out, "Line coverage: 86.00%") {
		t.Errorf("expected pct in output, got: %s", out)
	}
	if !strings.Contains(out, "86 covered, 5 partial, 9 missed, 100 total") {
		t.Errorf("expected counts in output, got: %s", out)
	}
	if !strings.Contains(out, "PASS:") {
		t.Errorf("expected PASS in output, got: %s", out)
	}
	if !strings.Contains(out, ">= 85% threshold") {
		t.Errorf("expected threshold in output, got: %s", out)
	}
}

func TestFormatText_Fail(t *testing.T) {
	r := makeResult(60, 0, 40, 60.00, FormatGo)
	out := FormatText(r, false, false)

	if !strings.Contains(out, "FAIL:") {
		t.Errorf("expected FAIL in output, got: %s", out)
	}
	if !strings.Contains(out, "< 85% threshold") {
		t.Errorf("expected threshold in output, got: %s", out)
	}
}

func TestFormatText_VerboseQuietIgnored(t *testing.T) {
	r := makeResult(100, 0, 0, 100.0, FormatLCOV)
	// verbose and quiet params are accepted but don't change output
	out1 := FormatText(r, true, false)
	out2 := FormatText(r, false, true)
	out3 := FormatText(r, false, false)
	if out1 != out3 || out2 != out3 {
		t.Error("verbose/quiet flags should not affect FormatText output")
	}
}

func TestFormatText_ExactPythonFormat(t *testing.T) {
	// Verify exact format matching Python script output
	r := Result{
		File:      "cover.out",
		Format:    FormatGo,
		Covered:   2411,
		Partial:   141,
		Missed:    249,
		Total:     2801,
		Pct:       86.08,
		Threshold: 85,
		Passed:    true,
	}
	out := FormatText(r, false, false)
	expected1 := "Line coverage: 86.08% (2411 covered, 141 partial, 249 missed, 2801 total)"
	expected2 := "PASS: 86.08% >= 85% threshold"
	if !strings.Contains(out, expected1) {
		t.Errorf("expected %q in output, got: %s", expected1, out)
	}
	if !strings.Contains(out, expected2) {
		t.Errorf("expected %q in output, got: %s", expected2, out)
	}
}

func TestFormatJSON_Pass(t *testing.T) {
	r := makeResult(90, 2, 8, 90.0, FormatGo)
	out, err := FormatJSON(r)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("invalid JSON: %v\nOutput: %s", err, out)
	}
	if parsed["status"] != "pass" {
		t.Errorf("expected status=pass, got %v", parsed["status"])
	}
	if parsed["format"] != "go" {
		t.Errorf("expected format=go, got %v", parsed["format"])
	}
	if passed, ok := parsed["passed"].(bool); !ok || !passed {
		t.Errorf("expected passed=true, got %v", parsed["passed"])
	}
	if _, ok := parsed["timestamp"]; !ok {
		t.Error("expected timestamp field in JSON")
	}
}

func TestFormatJSON_Fail(t *testing.T) {
	r := makeResult(50, 0, 50, 50.0, FormatLCOV)
	out, err := FormatJSON(r)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if parsed["status"] != "fail" {
		t.Errorf("expected status=fail, got %v", parsed["status"])
	}
	if parsed["format"] != "lcov" {
		t.Errorf("expected format=lcov, got %v", parsed["format"])
	}
}

func TestFormatMarkdown_Pass(t *testing.T) {
	r := makeResult(90, 2, 8, 90.0, FormatGo)
	out := FormatMarkdown(r)

	if !strings.Contains(out, "## Coverage Report") {
		t.Errorf("expected markdown header, got: %s", out)
	}
	if !strings.Contains(out, "| Status |") {
		t.Errorf("expected Status row, got: %s", out)
	}
	if !strings.Contains(out, "**PASS**") {
		t.Errorf("expected PASS in markdown, got: %s", out)
	}
}

func TestFormatMarkdown_Fail(t *testing.T) {
	r := makeResult(50, 0, 50, 50.0, FormatGo)
	out := FormatMarkdown(r)

	if !strings.Contains(out, "**FAIL**") {
		t.Errorf("expected FAIL in markdown, got: %s", out)
	}
}

func TestFormatMarkdown_ContainsAllFields(t *testing.T) {
	r := makeResult(100, 5, 10, 87.0, FormatLCOV)
	out := FormatMarkdown(r)

	for _, field := range []string{"| File |", "| Format |", "| Line Coverage |", "| Threshold |", "| Covered |", "| Partial |", "| Missed |", "| Total |"} {
		if !strings.Contains(out, field) {
			t.Errorf("expected field %q in markdown, got: %s", field, out)
		}
	}
}
