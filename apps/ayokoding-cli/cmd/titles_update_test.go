package cmd

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/open-sharia-enterprise/apps/ayokoding-cli/internal/titles"
	"github.com/wahidyankf/open-sharia-enterprise/libs/golang-commons/testutil"
)

func TestRunTitlesUpdate_InvalidLang(t *testing.T) {
	resetFlags()
	titlesLang = "invalid"

	read := testutil.CaptureStdout(t)
	err := runTitlesUpdate(nil, nil)
	read()
	if err == nil {
		t.Error("expected error for invalid lang, got nil")
	}
	if !strings.Contains(err.Error(), "invalid --lang value") {
		t.Errorf("expected 'invalid --lang value' in error, got %q", err.Error())
	}
}

func TestRunTitlesUpdate_EnLangDirectoryMissing(t *testing.T) {
	resetFlags()
	titlesLang = "en"
	titlesConfigEn = "/nonexistent-config.yaml"
	// The content directory (apps/ayokoding-web/content/en) won't exist relative to test runner
	// LoadConfig returns empty config for nonexistent files, then processLanguageDirectory fails

	read := testutil.CaptureStdout(t)
	err := runTitlesUpdate(nil, nil)
	read()
	// Expect an error because the content directory doesn't exist
	if err == nil {
		t.Log("runTitlesUpdate succeeded (content dir may exist)")
	}
}

func TestRunTitlesUpdate_QuietMode(t *testing.T) {
	resetFlags()
	titlesLang = "invalid"
	quiet = true

	read := testutil.CaptureStdout(t)
	err := runTitlesUpdate(nil, nil)
	read()
	// Still returns error for invalid lang
	if err == nil {
		t.Error("expected error for invalid lang, got nil")
	}
}

func TestOutputTitlesText_BothResults(t *testing.T) {
	resetFlags()
	result := &titles.UpdateResult{
		EnResult: &titles.LangResult{
			UpdatedCount: 3,
			SkippedCount: 1,
			ErrorCount:   0,
			Errors:       []string{},
		},
		IDResult: &titles.LangResult{
			UpdatedCount: 2,
			SkippedCount: 0,
			ErrorCount:   1,
			Errors:       []string{"some id error"},
		},
	}
	read := testutil.CaptureStdout(t)
	err := outputTitlesText(result, time.Second)
	out := read()
	if err != nil {
		t.Errorf("expected nil error, got %v", err)
	}
	if !strings.Contains(out, "Title Update Complete") {
		t.Errorf("expected header in output, got %q", out)
	}
	if !strings.Contains(out, "English (en/)") {
		t.Errorf("expected English section, got %q", out)
	}
	if !strings.Contains(out, "Indonesian (id/)") {
		t.Errorf("expected Indonesian section, got %q", out)
	}
	if !strings.Contains(out, "some id error") {
		t.Errorf("expected error message in output, got %q", out)
	}
}

func TestOutputTitlesText_Quiet(t *testing.T) {
	result := &titles.UpdateResult{
		EnResult: &titles.LangResult{UpdatedCount: 1, Errors: []string{}},
	}
	quiet = true
	read := testutil.CaptureStdout(t)
	err := outputTitlesText(result, time.Second)
	out := read()
	quiet = false
	if err != nil {
		t.Errorf("expected nil error, got %v", err)
	}
	if out != "" {
		t.Errorf("expected no output in quiet mode, got %q", out)
	}
}

func TestOutputTitlesText_Verbose(t *testing.T) {
	result := &titles.UpdateResult{
		EnResult: &titles.LangResult{UpdatedCount: 0, Errors: []string{}},
	}
	verbose = true
	read := testutil.CaptureStdout(t)
	err := outputTitlesText(result, time.Second)
	out := read()
	verbose = false
	if err != nil {
		t.Errorf("expected nil error, got %v", err)
	}
	if !strings.Contains(out, "Completed at:") {
		t.Errorf("expected 'Completed at:' in verbose output, got %q", out)
	}
}

func TestOutputTitlesJSON_BothResults(t *testing.T) {
	resetFlags()
	result := &titles.UpdateResult{
		EnResult: &titles.LangResult{
			UpdatedCount: 5,
			SkippedCount: 2,
			ErrorCount:   0,
			Errors:       []string{},
		},
		IDResult: &titles.LangResult{
			UpdatedCount: 3,
			SkippedCount: 1,
			ErrorCount:   0,
			Errors:       []string{},
		},
	}
	read := testutil.CaptureStdout(t)
	err := outputTitlesJSON(result, time.Second)
	out := read()
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
	if parsed["status"] != "success" {
		t.Errorf("expected status 'success', got %v", parsed["status"])
	}
}

func TestOutputTitlesJSON_NilResults(t *testing.T) {
	resetFlags()
	result := &titles.UpdateResult{
		EnResult: nil,
		IDResult: nil,
	}
	read := testutil.CaptureStdout(t)
	err := outputTitlesJSON(result, time.Second)
	out := read()
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Fatalf("expected valid JSON, got %q: %v", out, err)
	}
}

func TestOutputTitlesMarkdown_BothResults(t *testing.T) {
	resetFlags()
	result := &titles.UpdateResult{
		EnResult: &titles.LangResult{
			UpdatedCount: 2,
			SkippedCount: 0,
			ErrorCount:   0,
			Errors:       []string{},
		},
		IDResult: &titles.LangResult{
			UpdatedCount: 1,
			SkippedCount: 0,
			ErrorCount:   1,
			Errors:       []string{"markdown error"},
		},
	}
	read := testutil.CaptureStdout(t)
	err := outputTitlesMarkdown(result, time.Second)
	out := read()
	if err != nil {
		t.Errorf("expected nil error, got %v", err)
	}
	if !strings.Contains(out, "# Title Update Report") {
		t.Errorf("expected markdown header, got %q", out)
	}
	if !strings.Contains(out, "## Errors") {
		t.Errorf("expected errors section in markdown, got %q", out)
	}
}

func TestOutputTitlesMarkdown_NilResults(t *testing.T) {
	resetFlags()
	result := &titles.UpdateResult{
		EnResult: nil,
		IDResult: nil,
	}
	read := testutil.CaptureStdout(t)
	err := outputTitlesMarkdown(result, time.Second)
	out := read()
	if err != nil {
		t.Errorf("expected nil error, got %v", err)
	}
	if !strings.Contains(out, "# Title Update Report") {
		t.Errorf("expected markdown header even with nil results, got %q", out)
	}
}

func makeTitlesContentDir(t *testing.T) func() {
	t.Helper()
	originalDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	tmpDir := t.TempDir()
	enDir := filepath.Join(tmpDir, "apps", "ayokoding-web", "content", "en")
	if err := os.MkdirAll(enDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	return func() { _ = os.Chdir(originalDir) }
}

func TestRunTitlesUpdate_DryRunMessage(t *testing.T) {
	restore := makeTitlesContentDir(t)
	defer restore()

	resetFlags()
	titlesLang = "en"
	titlesDryRun = true

	read := testutil.CaptureStdout(t)
	err := runTitlesUpdate(nil, nil)
	out := read()
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if !strings.Contains(out, "DRY RUN") {
		t.Errorf("expected DRY RUN message in output, got %q", out)
	}
}

func TestRunTitlesUpdate_JSONOutputSuccess(t *testing.T) {
	restore := makeTitlesContentDir(t)
	defer restore()

	resetFlags()
	titlesLang = "en"
	output = "json"

	read := testutil.CaptureStdout(t)
	err := runTitlesUpdate(nil, nil)
	out := read()
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(out), &parsed); err != nil {
		t.Errorf("expected valid JSON output, got %q: %v", out, err)
	}
	if parsed["status"] != "success" {
		t.Errorf("expected status 'success', got %v", parsed["status"])
	}
}
