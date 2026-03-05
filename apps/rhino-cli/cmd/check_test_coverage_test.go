package cmd

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const lcovContent = `TN:
SF:src/foo.ts
DA:1,1
DA:2,1
DA:3,1
DA:4,1
DA:5,1
DA:6,0
DA:7,0
end_of_record
`

func makeCoverageRepo(t *testing.T) (tmpDir string) {
	t.Helper()
	tmpDir = t.TempDir()
	if err := os.MkdirAll(filepath.Join(tmpDir, ".git"), 0755); err != nil {
		t.Fatal(err)
	}
	return
}

func writeCoverFile(t *testing.T, dir, relPath, content string) {
	t.Helper()
	absPath := filepath.Join(dir, relPath)
	if err := os.MkdirAll(filepath.Dir(absPath), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(absPath, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func TestCheckTestCoverageCmd_NoArgs(t *testing.T) {
	err := checkTestCoverageCmd.Args(checkTestCoverageCmd, []string{})
	if err == nil {
		t.Error("expected error when no args provided")
	}
}

func TestCheckTestCoverageCmd_OneArg(t *testing.T) {
	err := checkTestCoverageCmd.Args(checkTestCoverageCmd, []string{"cover.out"})
	if err == nil {
		t.Error("expected error with only one arg")
	}
}

func TestCheckTestCoverageCmd_InvalidThreshold(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := makeCoverageRepo(t)
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	writeCoverFile(t, tmpDir, "cover.out", "mode: set\n")

	cmd := checkTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	err := cmd.RunE(cmd, []string{"cover.out", "notanumber"})
	if err == nil {
		t.Error("expected error for invalid threshold")
	}
	if !strings.Contains(err.Error(), "invalid threshold") {
		t.Errorf("expected 'invalid threshold' in error, got: %v", err)
	}
}

func TestCheckTestCoverageCmd_FileNotFound(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := makeCoverageRepo(t)
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}

	cmd := checkTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	err := cmd.RunE(cmd, []string{"nonexistent/cover.out", "85"})
	if err == nil {
		t.Error("expected error for missing file")
	}
}

func TestCheckTestCoverageCmd_GoFormat_Pass(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := makeCoverageRepo(t)
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	// All lines covered → 100%
	content := "mode: set\n" +
		"example.com/pkg:1.1,3.9 1 5\n" +
		"example.com/pkg:5.1,7.9 1 3\n"
	writeCoverFile(t, tmpDir, "apps/myapp/cover.out", content)

	cmd := checkTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	err := cmd.RunE(cmd, []string{"apps/myapp/cover.out", "85"})
	if err != nil {
		t.Errorf("expected no error for passing coverage, got: %v", err)
	}
	out := buf.String()
	if !strings.Contains(out, "PASS:") {
		t.Errorf("expected PASS in output, got: %s", out)
	}
}

func TestCheckTestCoverageCmd_GoFormat_Fail(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := makeCoverageRepo(t)
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	// 1 covered, 1 missed → 50%
	content := "mode: set\n" +
		"example.com/pkg:1.1,1.9 1 1\n" +
		"example.com/pkg:2.1,2.9 1 0\n"
	writeCoverFile(t, tmpDir, "cover.out", content)

	cmd := checkTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	err := cmd.RunE(cmd, []string{"cover.out", "85"})
	if err == nil {
		t.Error("expected error for failing coverage")
	}
	if !strings.Contains(err.Error(), "below threshold") {
		t.Errorf("expected 'below threshold' in error, got: %v", err)
	}
	out := buf.String()
	if !strings.Contains(out, "FAIL:") {
		t.Errorf("expected FAIL in text output, got: %s", out)
	}
}

func TestCheckTestCoverageCmd_LCOVFormat_Pass(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := makeCoverageRepo(t)
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	writeCoverFile(t, tmpDir, "apps/web/coverage/lcov.info", lcovContent)

	cmd := checkTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	// 5 covered, 2 missed → 71.4% — threshold=60 → pass
	err := cmd.RunE(cmd, []string{"apps/web/coverage/lcov.info", "60"})
	if err != nil {
		t.Errorf("expected no error with threshold=60, got: %v", err)
	}
	out := buf.String()
	if !strings.Contains(out, "Line coverage:") {
		t.Errorf("expected coverage line in output, got: %s", out)
	}
}

func TestCheckTestCoverageCmd_LCOVFormat_Fail(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := makeCoverageRepo(t)
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	writeCoverFile(t, tmpDir, "coverage/lcov.info", lcovContent)

	cmd := checkTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "text"

	// 5 covered, 2 missed → 71.4% — threshold=85 → fail
	err := cmd.RunE(cmd, []string{"coverage/lcov.info", "85"})
	if err == nil {
		t.Error("expected error for failing LCOV coverage")
	}
}

func TestCheckTestCoverageCmd_JSONOutput(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := makeCoverageRepo(t)
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	// All covered → 100%
	content := "mode: set\nexample.com/pkg:1.1,2.9 1 3\n"
	writeCoverFile(t, tmpDir, "cover.out", content)

	cmd := checkTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "json"

	err := cmd.RunE(cmd, []string{"cover.out", "85"})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	var parsed map[string]any
	if err := json.Unmarshal(buf.Bytes(), &parsed); err != nil {
		t.Fatalf("invalid JSON output: %v\nOutput: %s", err, buf.String())
	}
	if parsed["status"] != "pass" {
		t.Errorf("expected status=pass, got %v", parsed["status"])
	}
	if _, ok := parsed["pct"]; !ok {
		t.Error("expected pct field in JSON output")
	}
}

func TestCheckTestCoverageCmd_MarkdownOutput(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := makeCoverageRepo(t)
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	content := "mode: set\nexample.com/pkg:1.1,2.9 1 3\n"
	writeCoverFile(t, tmpDir, "cover.out", content)

	cmd := checkTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = false
	output = "markdown"

	err := cmd.RunE(cmd, []string{"cover.out", "85"})
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if !strings.Contains(buf.String(), "## Coverage Report") {
		t.Errorf("expected markdown header, got: %s", buf.String())
	}
}

func TestCheckTestCoverageCmd_QuietMode(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := makeCoverageRepo(t)
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	// 50% coverage — fail
	content := "mode: set\n" +
		"example.com/pkg:1.1,1.9 1 1\n" +
		"example.com/pkg:2.1,2.9 1 0\n"
	writeCoverFile(t, tmpDir, "cover.out", content)

	cmd := checkTestCoverageCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	verbose = false
	quiet = true
	output = "text"

	err := cmd.RunE(cmd, []string{"cover.out", "85"})
	// quiet mode: error is still returned
	if err == nil {
		t.Error("expected error even in quiet mode for failing coverage")
	}
}
