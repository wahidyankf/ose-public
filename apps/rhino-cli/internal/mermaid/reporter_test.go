package mermaid

import (
	"encoding/json"
	"strings"
	"testing"
)

func zeroResult() ValidationResult {
	return ValidationResult{
		FilesScanned:  1,
		BlocksScanned: 1,
		Violations:    nil,
		Warnings:      nil,
	}
}

func TestFormatText_NoFindings(t *testing.T) {
	result := zeroResult()

	text := FormatText(result, false, false)
	if text == "" {
		t.Error("FormatText (quiet=false, no findings) must return non-empty string")
	}
	if !strings.Contains(text, "0 violation") {
		t.Errorf("expected '0 violation' in output, got: %q", text)
	}
}

func TestFormatText_QuietNoFindings(t *testing.T) {
	result := zeroResult()
	text := FormatText(result, false, true)
	if text != "" {
		t.Errorf("FormatText (quiet=true, no findings) must return empty string, got: %q", text)
	}
}

func TestFormatText_LabelTooLong(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  1,
		BlocksScanned: 1,
		Violations: []Violation{
			{
				Kind:        ViolationLabelTooLong,
				FilePath:    "test.md",
				BlockIndex:  0,
				StartLine:   5,
				NodeID:      "A",
				LabelText:   "This label is way too long for the limit",
				LabelLen:    40,
				MaxLabelLen: 30,
			},
		},
	}
	text := FormatText(result, false, false)
	if !strings.Contains(text, "label_too_long") {
		t.Errorf("expected 'label_too_long' in output, got: %q", text)
	}
	if !strings.Contains(text, "40") {
		t.Errorf("expected actual length '40' in output, got: %q", text)
	}
	if !strings.Contains(text, "30") {
		t.Errorf("expected max length '30' in output, got: %q", text)
	}
}

func TestFormatText_WidthExceeded(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  1,
		BlocksScanned: 1,
		Violations: []Violation{
			{
				Kind:        ViolationWidthExceeded,
				FilePath:    "test.md",
				BlockIndex:  0,
				StartLine:   1,
				ActualWidth: 5,
				MaxWidth:    3,
			},
		},
	}
	text := FormatText(result, false, false)
	if !strings.Contains(text, "width_exceeded") {
		t.Errorf("expected 'width_exceeded' in output, got: %q", text)
	}
	if !strings.Contains(text, "5") {
		t.Errorf("expected actual width '5' in output, got: %q", text)
	}
}

func TestFormatText_MultipleDiagrams(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  1,
		BlocksScanned: 1,
		Violations: []Violation{
			{
				Kind:       ViolationMultipleDiagrams,
				FilePath:   "test.md",
				BlockIndex: 0,
				StartLine:  1,
			},
		},
	}
	text := FormatText(result, false, false)
	if !strings.Contains(text, "multiple_diagrams") {
		t.Errorf("expected 'multiple_diagrams' in output, got: %q", text)
	}
}

func TestFormatText_Warning(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  1,
		BlocksScanned: 1,
		Warnings: []Warning{
			{
				Kind:        WarningComplexDiagram,
				FilePath:    "test.md",
				BlockIndex:  0,
				StartLine:   1,
				ActualWidth: 4,
				ActualDepth: 6,
				MaxWidth:    3,
				MaxDepth:    5,
			},
		},
	}
	text := FormatText(result, false, false)
	if !strings.Contains(text, "complex_diagram") {
		t.Errorf("expected 'complex_diagram' in output, got: %q", text)
	}
	if !strings.Contains(text, "4") {
		t.Errorf("expected width '4' in output, got: %q", text)
	}
	if !strings.Contains(text, "6") {
		t.Errorf("expected depth '6' in output, got: %q", text)
	}
}

func TestFormatText_SubgraphDenseWarning(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  1,
		BlocksScanned: 1,
		Warnings: []Warning{
			{
				Kind:              WarningSubgraphDense,
				FilePath:          "test.md",
				BlockIndex:        0,
				StartLine:         12,
				SubgraphLabel:     "WF1 — Development",
				SubgraphNodeCount: 7,
				MaxSubgraphNodes:  6,
			},
		},
	}
	text := FormatText(result, false, false)
	if !strings.Contains(text, "subgraph_density") {
		t.Errorf("expected 'subgraph_density' in output, got: %q", text)
	}
	if !strings.Contains(text, "WF1 — Development") {
		t.Errorf("expected subgraph label in output, got: %q", text)
	}
	if !strings.Contains(text, "7") {
		t.Errorf("expected child count '7' in output, got: %q", text)
	}
	if !strings.Contains(text, "6") {
		t.Errorf("expected threshold '6' in output, got: %q", text)
	}
}

func TestFormatText_SubgraphDenseUnnamedLabel(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  1,
		BlocksScanned: 1,
		Warnings: []Warning{
			{
				Kind:              WarningSubgraphDense,
				FilePath:          "test.md",
				BlockIndex:        0,
				StartLine:         3,
				SubgraphNodeCount: 8,
				MaxSubgraphNodes:  6,
			},
		},
	}
	text := FormatText(result, false, false)
	if !strings.Contains(text, "(unnamed)") {
		t.Errorf("expected unnamed placeholder in output, got: %q", text)
	}
}

func TestFormatJSON_ValidJSON(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  2,
		BlocksScanned: 3,
		Violations: []Violation{
			{
				Kind:        ViolationLabelTooLong,
				FilePath:    "a.md",
				BlockIndex:  0,
				StartLine:   1,
				NodeID:      "X",
				LabelText:   "too long label here",
				LabelLen:    19,
				MaxLabelLen: 10,
			},
		},
		Warnings: []Warning{
			{
				Kind:        WarningComplexDiagram,
				FilePath:    "b.md",
				BlockIndex:  1,
				StartLine:   5,
				ActualWidth: 4,
				ActualDepth: 6,
				MaxWidth:    3,
				MaxDepth:    5,
			},
		},
	}

	out, err := FormatJSON(result)
	if err != nil {
		t.Fatalf("FormatJSON error: %v", err)
	}

	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("FormatJSON output is not valid JSON: %v\noutput: %s", err, out)
	}

	// Check top-level keys.
	if _, ok := parsed["violations"]; !ok {
		t.Error("JSON missing 'violations' key")
	}
	if _, ok := parsed["warnings"]; !ok {
		t.Error("JSON missing 'warnings' key")
	}
	if _, ok := parsed["filesScanned"]; !ok {
		t.Error("JSON missing 'filesScanned' key")
	}
	if _, ok := parsed["blocksScanned"]; !ok {
		t.Error("JSON missing 'blocksScanned' key")
	}

	// Check violations array.
	violations, ok := parsed["violations"].([]any)
	if !ok || len(violations) != 1 {
		t.Errorf("expected 1 violation in JSON, got: %v", parsed["violations"])
	}
	// Check warnings array.
	warnings, ok := parsed["warnings"].([]any)
	if !ok || len(warnings) != 1 {
		t.Errorf("expected 1 warning in JSON, got: %v", parsed["warnings"])
	}
}

func TestFormatMarkdown_ContainsSeverityHeader(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  1,
		BlocksScanned: 1,
		Violations: []Violation{
			{
				Kind:        ViolationWidthExceeded,
				FilePath:    "test.md",
				BlockIndex:  0,
				StartLine:   1,
				ActualWidth: 4,
				MaxWidth:    3,
			},
		},
	}

	md := FormatMarkdown(result)
	if !strings.Contains(md, "Severity") {
		t.Errorf("expected 'Severity' column in markdown output, got: %q", md)
	}
	if !strings.Contains(md, "error") {
		t.Errorf("expected 'error' in markdown output for violation, got: %q", md)
	}
}

func TestFormatMarkdown_NoFindings(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  2,
		BlocksScanned: 3,
	}
	md := FormatMarkdown(result)
	if strings.Contains(md, "Severity") {
		t.Error("success message should not contain table when no findings")
	}
	if !strings.Contains(md, "passed") {
		t.Errorf("expected 'passed' in success message, got: %q", md)
	}
}

func TestFormatMarkdown_WarningRow(t *testing.T) {
	result := ValidationResult{
		FilesScanned:  1,
		BlocksScanned: 1,
		Warnings: []Warning{
			{
				Kind:        WarningComplexDiagram,
				FilePath:    "test.md",
				BlockIndex:  0,
				StartLine:   1,
				ActualWidth: 4,
				ActualDepth: 6,
				MaxWidth:    3,
				MaxDepth:    5,
			},
		},
	}
	md := FormatMarkdown(result)
	if !strings.Contains(md, "warning") {
		t.Errorf("expected 'warning' severity in markdown output, got: %q", md)
	}
}
