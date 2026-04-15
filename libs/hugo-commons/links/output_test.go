package links

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/libs/golang-commons/testutil"
)

func TestOutputLinksText_Quiet(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 5,
		BrokenLinks:  []BrokenLink{},
		Errors:       []string{},
	}
	OutputLinksText(result, time.Second, true, false)
	out := read()
	if out != "" {
		t.Errorf("quiet mode should produce no output, got %q", out)
	}
}

func TestOutputLinksText_Normal(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 3,
		BrokenLinks:  []BrokenLink{},
		Errors:       []string{},
	}
	OutputLinksText(result, 2*time.Second, false, false)
	out := read()
	if !strings.Contains(out, "Link Check Complete") {
		t.Errorf("expected 'Link Check Complete' in output, got %q", out)
	}
	if !strings.Contains(out, "Checked:  3") {
		t.Errorf("expected checked count in output, got %q", out)
	}
}

func TestOutputLinksText_WithBrokenLinks(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 2,
		BrokenLinks: []BrokenLink{
			{SourceFile: "en/index.md", Line: 5, Text: "Missing", Target: "/en/missing"},
		},
		Errors: []string{},
	}
	OutputLinksText(result, time.Second, false, false)
	out := read()
	if !strings.Contains(out, "Broken Links:") {
		t.Errorf("expected 'Broken Links:' section in output, got %q", out)
	}
	if !strings.Contains(out, "en/index.md") {
		t.Errorf("expected source file in output, got %q", out)
	}
}

func TestOutputLinksText_Verbose(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 1,
		BrokenLinks:  []BrokenLink{},
		Errors:       []string{},
	}
	OutputLinksText(result, time.Second, false, true)
	out := read()
	if !strings.Contains(out, "Completed at:") {
		t.Errorf("expected 'Completed at:' in verbose output, got %q", out)
	}
}

func TestOutputLinksJSON_Success(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 10,
		BrokenLinks:  []BrokenLink{},
		Errors:       []string{},
	}
	err := OutputLinksJSON(result, 500*time.Millisecond)
	out := read()
	if err != nil {
		t.Fatalf("OutputLinksJSON returned error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("output is not valid JSON: %v\noutput: %q", err, out)
	}
	if parsed["status"] != "success" {
		t.Errorf("expected status 'success', got %v", parsed["status"])
	}
	checked, _ := parsed["checked"].(float64)
	if int(checked) != 10 {
		t.Errorf("expected checked=10, got %v", parsed["checked"])
	}
}

func TestOutputLinksJSON_WithBroken(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 3,
		BrokenLinks: []BrokenLink{
			{SourceFile: "index.md", Line: 1, Text: "Bad", Target: "/bad"},
		},
		Errors: []string{},
	}
	err := OutputLinksJSON(result, time.Second)
	out := read()
	if err != nil {
		t.Fatalf("OutputLinksJSON returned error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("output is not valid JSON: %v", err)
	}
	if parsed["status"] != "failure" {
		t.Errorf("expected status 'failure', got %v", parsed["status"])
	}
}

func TestOutputLinksMarkdown_Pass(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 5,
		BrokenLinks:  []BrokenLink{},
		Errors:       []string{},
	}
	OutputLinksMarkdown(result, time.Second)
	out := read()
	if !strings.Contains(out, "# Link Check Report") {
		t.Errorf("expected '# Link Check Report' header, got %q", out)
	}
	if !strings.Contains(out, "**Status**: PASS") {
		t.Errorf("expected '**Status**: PASS', got %q", out)
	}
}

func TestOutputLinksText_WithErrors(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 1,
		BrokenLinks:  []BrokenLink{},
		Errors:       []string{"walk error: permission denied"},
	}
	OutputLinksText(result, time.Second, false, false)
	out := read()
	if !strings.Contains(out, "Errors:") {
		t.Errorf("expected 'Errors:' section in output, got %q", out)
	}
	if !strings.Contains(out, "permission denied") {
		t.Errorf("expected error message in output, got %q", out)
	}
}

func TestOutputLinksMarkdown_WithErrors(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 1,
		BrokenLinks:  []BrokenLink{},
		Errors:       []string{"error reading file: permission denied"},
	}
	OutputLinksMarkdown(result, time.Second)
	out := read()
	if !strings.Contains(out, "## Errors") {
		t.Errorf("expected '## Errors' section in markdown, got %q", out)
	}
	if !strings.Contains(out, "permission denied") {
		t.Errorf("expected error message in markdown, got %q", out)
	}
}

func TestOutputLinksMarkdown_Fail(t *testing.T) {
	read := testutil.CaptureStdout(t)
	result := &CheckResult{
		CheckedCount: 2,
		BrokenLinks: []BrokenLink{
			{SourceFile: "index.md", Line: 3, Text: "Broken", Target: "/broken"},
		},
		Errors: []string{},
	}
	OutputLinksMarkdown(result, time.Second)
	out := read()
	if !strings.Contains(out, "**Status**: FAIL") {
		t.Errorf("expected '**Status**: FAIL', got %q", out)
	}
	if !strings.Contains(out, "## Broken Links") {
		t.Errorf("expected '## Broken Links' section, got %q", out)
	}
	if !strings.Contains(out, "index.md") {
		t.Errorf("expected source file in broken links table, got %q", out)
	}
}

func TestOutputLinksJSON_MarshalError(t *testing.T) {
	orig := jsonMarshalIndent
	jsonMarshalIndent = func(_ any, _, _ string) ([]byte, error) {
		return nil, errors.New("injected marshal error")
	}
	defer func() { jsonMarshalIndent = orig }()

	result := &CheckResult{
		CheckedCount: 1,
		BrokenLinks:  []BrokenLink{},
		Errors:       []string{},
	}
	err := OutputLinksJSON(result, time.Second)
	if err == nil {
		t.Fatal("Expected error when json.MarshalIndent fails, got nil")
	}
}
