package cmd

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// setupDoctorTestRepo creates a temporary git repository with minimal config files
// required for the doctor command and returns the tmpDir path and a cleanup func.
func setupDoctorTestRepo(t *testing.T) func() {
	t.Helper()

	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Minimal .git directory so findGitRoot succeeds
	if err := os.MkdirAll(filepath.Join(tmpDir, ".git"), 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// package.json with volta config
	packageJSON := `{"name":"test","volta":{"node":"24.11.1","npm":"11.6.3"}}`
	if err := os.WriteFile(filepath.Join(tmpDir, "package.json"), []byte(packageJSON), 0644); err != nil {
		t.Fatalf("Failed to create package.json: %v", err)
	}

	// pom.xml
	if err := os.MkdirAll(filepath.Join(tmpDir, "apps", "organiclever-be"), 0755); err != nil {
		t.Fatalf("Failed to create pom.xml dir: %v", err)
	}
	pomXML := `<project><properties><java.version>25</java.version></properties></project>`
	if err := os.WriteFile(filepath.Join(tmpDir, "apps", "organiclever-be", "pom.xml"), []byte(pomXML), 0644); err != nil {
		t.Fatalf("Failed to create pom.xml: %v", err)
	}

	// go.mod
	if err := os.MkdirAll(filepath.Join(tmpDir, "apps", "rhino-cli"), 0755); err != nil {
		t.Fatalf("Failed to create go.mod dir: %v", err)
	}
	goMod := "module foo\n\ngo 1.24.2\n"
	if err := os.WriteFile(filepath.Join(tmpDir, "apps", "rhino-cli", "go.mod"), []byte(goMod), 0644); err != nil {
		t.Fatalf("Failed to create go.mod: %v", err)
	}

	return func() {
		_ = os.Chdir(originalWd)
	}
}

func TestDoctorCommand_Initialization(t *testing.T) {
	if doctorCmd.Use != "doctor" {
		t.Errorf("expected Use == %q, got %q", "doctor", doctorCmd.Use)
	}
	if !strings.Contains(strings.ToLower(doctorCmd.Short), "tool") {
		t.Errorf("expected Short to contain 'tool', got %q", doctorCmd.Short)
	}
}

func TestDoctorCommand_TextOutput(t *testing.T) {
	cleanup := setupDoctorTestRepo(t)
	defer cleanup()

	cmd := doctorCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	output = "text"
	verbose = false
	quiet = false

	// Run the command — may return an error if some tools are not installed,
	// but we only check output structure.
	_ = cmd.RunE(cmd, []string{})

	outputStr := buf.String()
	t.Logf("doctor text output:\n%s", outputStr)

	if !strings.Contains(outputStr, "Doctor Report") {
		t.Error("expected output to contain 'Doctor Report'")
	}

	// All 7 tool names should appear in the output
	for _, toolName := range []string{"git", "volta", "node", "npm", "java", "maven", "golang"} {
		if !strings.Contains(outputStr, toolName) {
			t.Errorf("expected output to contain tool name %q", toolName)
		}
	}
}

func TestDoctorCommand_JSONOutput(t *testing.T) {
	cleanup := setupDoctorTestRepo(t)
	defer cleanup()

	cmd := doctorCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	output = "json"
	verbose = false
	quiet = false

	_ = cmd.RunE(cmd, []string{})

	jsonStr := buf.String()
	t.Logf("doctor JSON output:\n%s", jsonStr)

	if !strings.Contains(jsonStr, `"tools"`) {
		t.Error("expected JSON output to contain 'tools' array key")
	}

	// Validate it is parseable JSON
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &parsed); err != nil {
		t.Errorf("output is not valid JSON: %v\n%s", err, jsonStr)
	}

	tools, ok := parsed["tools"].([]interface{})
	if !ok {
		t.Error("expected 'tools' to be an array")
	} else if len(tools) != 7 {
		t.Errorf("expected 7 tools in JSON output, got %d", len(tools))
	}
}

func TestDoctorCommand_MarkdownOutput(t *testing.T) {
	cleanup := setupDoctorTestRepo(t)
	defer cleanup()

	cmd := doctorCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	output = "markdown"
	verbose = false
	quiet = false

	_ = cmd.RunE(cmd, []string{})

	mdStr := buf.String()
	t.Logf("doctor markdown output:\n%s", mdStr)

	if !strings.Contains(mdStr, "| Tool |") {
		t.Error("expected markdown table with '| Tool |' header")
	}
}

func TestDoctorCommand_MissingGitRoot(t *testing.T) {
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Use a temp dir with no .git anywhere up the tree
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	cmd := doctorCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	output = "text"
	verbose = false
	quiet = false

	err = cmd.RunE(cmd, []string{})
	if err == nil {
		t.Fatal("expected command to fail when no .git directory found")
	}
	if !strings.Contains(err.Error(), "git") {
		t.Errorf("expected error to mention 'git', got: %v", err)
	}
}
