package docs

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestFormatTextNoViolations(t *testing.T) {
	result := &ValidationResult{
		TotalFiles:       10,
		ValidFiles:       10,
		ViolationCount:   0,
		Violations:       []NamingViolation{},
		ViolationsByType: make(map[ViolationType][]NamingViolation),
		ScanDuration:     100 * time.Millisecond,
	}

	// Test normal output
	output := FormatText(result, false, false)
	if !strings.Contains(output, "All documentation files follow naming conventions") {
		t.Errorf("FormatText() should contain success message, got: %s", output)
	}

	// Test verbose output
	verboseOutput := FormatText(result, true, false)
	if !strings.Contains(verboseOutput, "Scanned 10 files") {
		t.Errorf("FormatText() verbose should contain file count, got: %s", verboseOutput)
	}

	// Test quiet output
	quietOutput := FormatText(result, false, true)
	if quietOutput != "" {
		t.Errorf("FormatText() quiet should be empty, got: %s", quietOutput)
	}
}

func TestFormatTextWithViolations(t *testing.T) {
	result := &ValidationResult{
		TotalFiles:     10,
		ValidFiles:     7,
		ViolationCount: 3,
		Violations: []NamingViolation{
			{
				FilePath:       "docs/tutorials/missing-separator.md",
				FileName:       "missing-separator.md",
				ViolationType:  ViolationMissingSeparator,
				ExpectedPrefix: "tu__",
				ActualPrefix:   "",
				Message:        "Missing '__' separator. Expected prefix: tu__",
			},
			{
				FilePath:       "docs/tutorials/wrong__prefix.md",
				FileName:       "wrong__prefix.md",
				ViolationType:  ViolationWrongPrefix,
				ExpectedPrefix: "tu__",
				ActualPrefix:   "wrong__",
				Message:        "Wrong prefix 'wrong__', expected 'tu__'",
			},
			{
				FilePath:       "docs/tutorials/tu__UPPERCASE.md",
				FileName:       "tu__UPPERCASE.md",
				ViolationType:  ViolationBadCase,
				ExpectedPrefix: "tu__",
				ActualPrefix:   "tu__",
				Message:        "Content identifier 'UPPERCASE' is not in kebab-case",
			},
		},
		ViolationsByType: map[ViolationType][]NamingViolation{
			ViolationMissingSeparator: {
				{FilePath: "docs/tutorials/missing-separator.md", FileName: "missing-separator.md", ViolationType: ViolationMissingSeparator},
			},
			ViolationWrongPrefix: {
				{FilePath: "docs/tutorials/wrong__prefix.md", FileName: "wrong__prefix.md", ViolationType: ViolationWrongPrefix},
			},
			ViolationBadCase: {
				{FilePath: "docs/tutorials/tu__UPPERCASE.md", FileName: "tu__UPPERCASE.md", ViolationType: ViolationBadCase},
			},
			ViolationMissingPrefix: nil,
		},
		ScanDuration: 50 * time.Millisecond,
	}

	output := FormatText(result, false, false)

	// Check header
	if !strings.Contains(output, "Documentation Naming Violations Report") {
		t.Errorf("FormatText() should contain report header")
	}

	// Check violation count
	if !strings.Contains(output, "Total violations**: 3") {
		t.Errorf("FormatText() should contain violation count")
	}

	// Check violation types are listed
	if !strings.Contains(output, "Missing '__' separator") {
		t.Errorf("FormatText() should list missing separator violations")
	}
	if !strings.Contains(output, "Wrong prefix") {
		t.Errorf("FormatText() should list wrong prefix violations")
	}
	if !strings.Contains(output, "Not kebab-case") {
		t.Errorf("FormatText() should list bad case violations")
	}
}

func TestFormatJSON(t *testing.T) {
	result := &ValidationResult{
		TotalFiles:     5,
		ValidFiles:     4,
		ViolationCount: 1,
		Violations: []NamingViolation{
			{
				FilePath:       "docs/tutorials/missing.md",
				FileName:       "missing.md",
				ViolationType:  ViolationMissingSeparator,
				ExpectedPrefix: "tu__",
				ActualPrefix:   "",
				Message:        "Missing separator",
			},
		},
		ViolationsByType: map[ViolationType][]NamingViolation{
			ViolationMissingSeparator: {
				{FilePath: "docs/tutorials/missing.md", FileName: "missing.md", ExpectedPrefix: "tu__", Message: "Missing separator"},
			},
			ViolationWrongPrefix:   nil,
			ViolationBadCase:       nil,
			ViolationMissingPrefix: nil,
		},
		ScanDuration: 25 * time.Millisecond,
	}

	output, err := FormatJSON(result)
	if err != nil {
		t.Fatalf("FormatJSON() error = %v", err)
	}

	// Parse JSON to verify structure
	var parsed JSONOutput
	if err := json.Unmarshal([]byte(output), &parsed); err != nil {
		t.Fatalf("FormatJSON() produced invalid JSON: %v", err)
	}

	// Check fields
	if parsed.Status != "failure" {
		t.Errorf("FormatJSON() status = %q, want 'failure'", parsed.Status)
	}
	if parsed.TotalFiles != 5 {
		t.Errorf("FormatJSON() total_files = %d, want 5", parsed.TotalFiles)
	}
	if parsed.ValidFiles != 4 {
		t.Errorf("FormatJSON() valid_files = %d, want 4", parsed.ValidFiles)
	}
	if parsed.ViolationCount != 1 {
		t.Errorf("FormatJSON() violation_count = %d, want 1", parsed.ViolationCount)
	}
	if parsed.Timestamp == "" {
		t.Error("FormatJSON() timestamp should not be empty")
	}
}

func TestFormatJSONSuccess(t *testing.T) {
	result := &ValidationResult{
		TotalFiles:       10,
		ValidFiles:       10,
		ViolationCount:   0,
		Violations:       []NamingViolation{},
		ViolationsByType: make(map[ViolationType][]NamingViolation),
		ScanDuration:     50 * time.Millisecond,
	}

	output, err := FormatJSON(result)
	if err != nil {
		t.Fatalf("FormatJSON() error = %v", err)
	}

	var parsed JSONOutput
	if err := json.Unmarshal([]byte(output), &parsed); err != nil {
		t.Fatalf("FormatJSON() produced invalid JSON: %v", err)
	}

	if parsed.Status != "success" {
		t.Errorf("FormatJSON() status = %q, want 'success'", parsed.Status)
	}
}

func TestFormatMarkdown(t *testing.T) {
	result := &ValidationResult{
		TotalFiles:     10,
		ValidFiles:     8,
		ViolationCount: 2,
		Violations: []NamingViolation{
			{FilePath: "docs/tutorials/bad.md", FileName: "bad.md", ViolationType: ViolationMissingSeparator, ExpectedPrefix: "tu__"},
			{FilePath: "docs/how-to/wrong.md", FileName: "wrong.md", ViolationType: ViolationWrongPrefix, ExpectedPrefix: "hoto__", ActualPrefix: "wrong__"},
		},
		ViolationsByType: map[ViolationType][]NamingViolation{
			ViolationMissingSeparator: {
				{FilePath: "docs/tutorials/bad.md", FileName: "bad.md", ExpectedPrefix: "tu__"},
			},
			ViolationWrongPrefix: {
				{FilePath: "docs/how-to/wrong.md", FileName: "wrong.md", ExpectedPrefix: "hoto__", ActualPrefix: "wrong__"},
			},
			ViolationBadCase:       nil,
			ViolationMissingPrefix: nil,
		},
		ScanDuration: 100 * time.Millisecond,
	}

	output := FormatMarkdown(result)

	// Check structure
	if !strings.Contains(output, "# Documentation Naming Validation Report") {
		t.Error("FormatMarkdown() should contain title")
	}
	if !strings.Contains(output, "## Summary") {
		t.Error("FormatMarkdown() should contain summary section")
	}
	if !strings.Contains(output, "| Metric | Value |") {
		t.Error("FormatMarkdown() should contain summary table")
	}
	if !strings.Contains(output, "## Violations by Type") {
		t.Error("FormatMarkdown() should contain violations section")
	}
}

func TestFormatMarkdownNoViolations(t *testing.T) {
	result := &ValidationResult{
		TotalFiles:       10,
		ValidFiles:       10,
		ViolationCount:   0,
		Violations:       []NamingViolation{},
		ViolationsByType: make(map[ViolationType][]NamingViolation),
		ScanDuration:     50 * time.Millisecond,
	}

	output := FormatMarkdown(result)

	if !strings.Contains(output, "All files follow naming conventions") {
		t.Error("FormatMarkdown() should contain success message")
	}
}

func TestGetDir_NoSlash(t *testing.T) {
	result := getDir("justfilename.md")
	if result != "." {
		t.Errorf("expected '.' for path with no slash, got %q", result)
	}
}

func TestGetDir_WithSlash(t *testing.T) {
	result := getDir("some/dir/file.md")
	if result != "some/dir" {
		t.Errorf("expected 'some/dir', got %q", result)
	}
}

func TestFormatFixPlan_NoOperations(t *testing.T) {
	result := &FixResult{
		RenameOperations: []RenameOperation{},
		DryRun:           true,
	}
	out := FormatFixPlan(result)
	if !strings.Contains(out, "No files need to be renamed") {
		t.Errorf("expected no-op message, got %q", out)
	}
}

func TestFormatFixPlan_WithOperations(t *testing.T) {
	result := &FixResult{
		RenameOperations: []RenameOperation{
			{OldPath: "docs/foo.md", NewPath: "docs/tu__foo.md", OldName: "foo.md", NewName: "tu__foo.md"},
		},
		DryRun: true,
	}
	out := FormatFixPlan(result)
	if !strings.Contains(out, "# Documentation Naming Fix Plan") {
		t.Errorf("expected markdown header, got %q", out)
	}
	if !strings.Contains(out, "foo.md") {
		t.Errorf("expected old name in output, got %q", out)
	}
}

func TestFormatFixPlan_WithLinkUpdates(t *testing.T) {
	result := &FixResult{
		RenameOperations: []RenameOperation{
			{OldPath: "docs/foo.md", NewPath: "docs/tu__foo.md", OldName: "foo.md", NewName: "tu__foo.md"},
		},
		LinkUpdates: []LinkUpdate{
			{FilePath: "docs/other.md", LineNumber: 5, OldLink: "./foo.md", NewLink: "./tu__foo.md"},
		},
		DryRun: true,
	}
	out := FormatFixPlan(result)
	if !strings.Contains(out, "## Links to Update") {
		t.Errorf("expected links section, got %q", out)
	}
}

func TestFormatFixResult_NoChanges(t *testing.T) {
	result := &FixResult{
		RenameOperations: []RenameOperation{},
		DryRun:           false,
	}
	out := FormatFixResult(result)
	if !strings.Contains(out, "# Documentation Naming Fix Results") {
		t.Errorf("expected header, got %q", out)
	}
}

func TestFormatFixResult_WithErrors(t *testing.T) {
	result := &FixResult{
		Errors: []string{"failed to rename: permission denied"},
		DryRun: false,
	}
	out := FormatFixResult(result)
	if !strings.Contains(out, "## Errors") {
		t.Errorf("expected errors section, got %q", out)
	}
}

func TestFormatFixResult_WithRenames(t *testing.T) {
	result := &FixResult{
		RenamesApplied: 2,
		RenameOperations: []RenameOperation{
			{OldPath: "docs/foo.md", NewPath: "docs/tu__foo.md", OldName: "foo.md", NewName: "tu__foo.md"},
		},
		LinksUpdated: 1,
		DryRun:       false,
	}
	out := FormatFixResult(result)
	if !strings.Contains(out, "Renamed 2 files") {
		t.Errorf("expected rename count, got %q", out)
	}
	if !strings.Contains(out, "Updated 1 links") {
		t.Errorf("expected links count, got %q", out)
	}
}

func TestFormatFixJSON_Success(t *testing.T) {
	result := &FixResult{
		RenameOperations: []RenameOperation{
			{OldPath: "docs/foo.md", NewPath: "docs/tu__foo.md", OldName: "foo.md", NewName: "tu__foo.md"},
		},
		DryRun: true,
	}
	out, err := FormatFixJSON(result)
	if err != nil {
		t.Fatalf("FormatFixJSON() error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
	if parsed["status"] != "success" {
		t.Errorf("expected status=success, got %v", parsed["status"])
	}
}

func TestFormatFixJSON_Partial(t *testing.T) {
	result := &FixResult{
		Errors: []string{"an error occurred"},
		DryRun: false,
	}
	out, err := FormatFixJSON(result)
	if err != nil {
		t.Fatalf("FormatFixJSON() error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
	if parsed["status"] != "partial" {
		t.Errorf("expected status=partial, got %v", parsed["status"])
	}
}

func TestFormatFixJSON_WithLinkUpdates(t *testing.T) {
	result := &FixResult{
		RenameOperations: []RenameOperation{
			{OldPath: "docs/foo.md", NewPath: "docs/tu__foo.md", OldName: "foo.md", NewName: "tu__foo.md"},
		},
		LinkUpdates: []LinkUpdate{
			{FilePath: "docs/other.md", LineNumber: 5, OldLink: "./foo.md", NewLink: "./tu__foo.md"},
		},
		DryRun: true,
	}
	out, err := FormatFixJSON(result)
	if err != nil {
		t.Fatalf("FormatFixJSON() error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
	if parsed["link_update_count"] != float64(1) {
		t.Errorf("expected link_update_count=1, got %v", parsed["link_update_count"])
	}
}
