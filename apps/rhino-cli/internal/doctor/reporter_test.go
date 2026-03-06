package doctor

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

// buildResult is a helper that constructs a DoctorResult from a slice of ToolChecks.
func buildResult(checks []ToolCheck) *DoctorResult {
	r := &DoctorResult{
		Checks:   checks,
		Duration: 5 * time.Millisecond,
	}
	for _, c := range checks {
		switch c.Status {
		case StatusOK:
			r.OKCount++
		case StatusWarning:
			r.WarnCount++
		case StatusMissing:
			r.MissingCount++
		}
	}
	return r
}

var allOKChecks = []ToolCheck{
	{Name: "git", Binary: "git", Status: StatusOK, InstalledVersion: "2.47.2", Source: "(no config file)", Note: "no version requirement"},
	{Name: "volta", Binary: "volta", Status: StatusOK, InstalledVersion: "2.0.2", Source: "(no config file)", Note: "no version requirement"},
	{Name: "node", Binary: "node", Status: StatusOK, InstalledVersion: "24.11.1", RequiredVersion: "24.11.1", Source: "package.json → volta.node", Note: "required: 24.11.1"},
	{Name: "npm", Binary: "npm", Status: StatusOK, InstalledVersion: "11.6.3", RequiredVersion: "11.6.3", Source: "package.json → volta.npm", Note: "required: 11.6.3"},
	{Name: "java", Binary: "java", Status: StatusOK, InstalledVersion: "25", RequiredVersion: "25", Source: "apps/organiclever-be/pom.xml → <java.version>", Note: "required: 25"},
	{Name: "maven", Binary: "mvn", Status: StatusOK, InstalledVersion: "3.9.9", Source: "(no config file)", Note: "no version requirement"},
	{Name: "golang", Binary: "go", Status: StatusOK, InstalledVersion: "1.24.2", RequiredVersion: "1.24.2", Source: "apps/rhino-cli/go.mod → go directive", Note: "required: \u22651.24.2"},
}

func TestFormatText_AllOK(t *testing.T) {
	result := buildResult(allOKChecks)
	out := FormatText(result, false, false)

	if !strings.Contains(out, "Doctor Report") {
		t.Error("expected 'Doctor Report' header")
	}
	if !strings.Contains(out, "=============") {
		t.Error("expected separator line")
	}
	// All checks should show ✓
	count := strings.Count(out, "✓")
	if count != 7 {
		t.Errorf("expected 7 ✓ symbols, got %d", count)
	}
	if !strings.Contains(out, "Summary: 7/7 tools OK, 0 warning, 0 missing") {
		t.Errorf("expected summary line, got: %q", out)
	}
}

func TestFormatText_WithWarning(t *testing.T) {
	checks := []ToolCheck{
		{Name: "java", Binary: "java", Status: StatusWarning, InstalledVersion: "21", RequiredVersion: "25", Note: "required: 25, version mismatch"},
	}
	result := buildResult(checks)
	out := FormatText(result, false, false)

	if !strings.Contains(out, "⚠") {
		t.Error("expected ⚠ symbol for warning status")
	}
	if !strings.Contains(out, "Summary: 0/1 tools OK, 1 warning, 0 missing") {
		t.Errorf("unexpected summary: %q", out)
	}
}

func TestFormatText_WithMissing(t *testing.T) {
	checks := []ToolCheck{
		{Name: "golang", Binary: "go", Status: StatusMissing, RequiredVersion: "1.24.2", Note: "not found in PATH"},
	}
	result := buildResult(checks)
	out := FormatText(result, false, false)

	if !strings.Contains(out, "✗") {
		t.Error("expected ✗ symbol for missing status")
	}
	if !strings.Contains(out, "not found") {
		t.Error("expected 'not found' in version field")
	}
	if !strings.Contains(out, "Summary: 0/1 tools OK, 0 warning, 1 missing") {
		t.Errorf("unexpected summary: %q", out)
	}
}

func TestFormatText_Quiet(t *testing.T) {
	result := buildResult(allOKChecks)
	out := FormatText(result, false, true) // quiet=true

	if strings.Contains(out, "Doctor Report") {
		t.Error("quiet mode should suppress the header")
	}
	// Should still contain the tool lines and summary
	if !strings.Contains(out, "volta") {
		t.Error("expected tool names in quiet mode")
	}
}

func TestFormatText_Verbose(t *testing.T) {
	result := buildResult(allOKChecks)
	out := FormatText(result, true, false) // verbose=true

	if !strings.Contains(out, "Duration:") {
		t.Error("verbose mode should include duration line")
	}
}

func TestFormatJSON_AllOK(t *testing.T) {
	result := buildResult(allOKChecks)
	out, err := FormatJSON(result)
	if err != nil {
		t.Fatalf("FormatJSON returned error: %v", err)
	}

	var parsed JSONOutput
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("output is not valid JSON: %v\n%s", err, out)
	}

	if parsed.Status != "ok" {
		t.Errorf("expected status %q, got %q", "ok", parsed.Status)
	}
	if parsed.OKCount != 7 {
		t.Errorf("expected ok_count == 7, got %d", parsed.OKCount)
	}
	if parsed.WarnCount != 0 {
		t.Errorf("expected warn_count == 0, got %d", parsed.WarnCount)
	}
	if parsed.MissingCount != 0 {
		t.Errorf("expected missing_count == 0, got %d", parsed.MissingCount)
	}
	if len(parsed.Tools) != 7 {
		t.Errorf("expected 7 tools, got %d", len(parsed.Tools))
	}
}

func TestFormatJSON_Mixed(t *testing.T) {
	t.Run("with warning", func(t *testing.T) {
		checks := []ToolCheck{
			{Name: "java", Status: StatusWarning, Note: "version mismatch"},
		}
		result := buildResult(checks)
		out, err := FormatJSON(result)
		if err != nil {
			t.Fatalf("FormatJSON error: %v", err)
		}

		var parsed JSONOutput
		if err := json.Unmarshal([]byte(out), &parsed); err != nil {
			t.Fatalf("failed to unmarshal JSON: %v", err)
		}
		if parsed.Status != "warning" {
			t.Errorf("expected status %q, got %q", "warning", parsed.Status)
		}
	})

	t.Run("with missing", func(t *testing.T) {
		checks := []ToolCheck{
			{Name: "golang", Status: StatusMissing, Note: "not found in PATH"},
		}
		result := buildResult(checks)
		out, err := FormatJSON(result)
		if err != nil {
			t.Fatalf("FormatJSON error: %v", err)
		}

		var parsed JSONOutput
		if err := json.Unmarshal([]byte(out), &parsed); err != nil {
			t.Fatalf("failed to unmarshal JSON: %v", err)
		}
		if parsed.Status != "missing" {
			t.Errorf("expected status %q, got %q", "missing", parsed.Status)
		}
	})
}

func TestSymbolFor_Default(t *testing.T) {
	// Use an undefined ToolStatus value to trigger the default branch
	sym := symbolFor(ToolStatus("unknown-status"))
	if sym != "?" {
		t.Errorf("expected '?' for unknown status, got %q", sym)
	}
}

func TestDisplayVersion_EmptyInstalled(t *testing.T) {
	check := ToolCheck{
		Status:           StatusOK,
		InstalledVersion: "",
	}
	ver := displayVersion(check)
	if ver != "(unknown)" {
		t.Errorf("expected '(unknown)' for empty InstalledVersion, got %q", ver)
	}
}

func TestFormatMarkdown(t *testing.T) {
	result := buildResult(allOKChecks)
	out := FormatMarkdown(result)

	if !strings.Contains(out, "| Tool |") {
		t.Error("expected markdown table header '| Tool |'")
	}
	if !strings.Contains(out, "### Summary") {
		t.Error("expected '### Summary' section")
	}
	if !strings.Contains(out, "### Tools") {
		t.Error("expected '### Tools' section")
	}
	// All tool names should appear
	for _, name := range []string{"git", "volta", "node", "npm", "java", "maven", "golang"} {
		if !strings.Contains(out, name) {
			t.Errorf("expected tool name %q in markdown output", name)
		}
	}
}
