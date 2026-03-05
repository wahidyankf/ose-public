package cmd

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateDocsLinksCommand(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory to simulate a git repository
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create test structure
	docsDir := filepath.Join(tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		t.Fatalf("Failed to create docs dir: %v", err)
	}

	// Create a valid target file
	validTarget := filepath.Join(docsDir, "target.md")
	if err := os.WriteFile(validTarget, []byte("# Target"), 0644); err != nil {
		t.Fatalf("Failed to create target file: %v", err)
	}

	// Create source file with both valid and broken links
	sourceFile := filepath.Join(docsDir, "source.md")
	content := `# Test Document

Valid link: [target](./target.md)
Broken link: [missing](./missing.md)
External link: [example](https://example.com)
`
	if err := os.WriteFile(sourceFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create source file: %v", err)
	}

	// Test command execution
	cmd := validateDocsLinksCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	validateDocsLinksStagedOnly = false
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should exit with error due to broken link)
	err = cmd.RunE(cmd, []string{})

	// Note: The command calls os.Exit(1) on failure, but in tests we just check the output
	// We expect the RunE to complete successfully (no panic), and we check output
	if err != nil {
		// This is okay - the error indicates validation logic ran
		t.Logf("Command returned error (expected): %v", err)
	}

	output := buf.String()
	t.Logf("Command output:\n%s", output)

	// Verify output contains broken link report
	if !strings.Contains(output, "Broken Links Report") {
		t.Error("Expected output to contain 'Broken Links Report'")
	}
	if !strings.Contains(output, "./missing.md") {
		t.Error("Expected output to contain './missing.md'")
	}
	if strings.Contains(output, "./target.md") {
		t.Error("Output should not contain valid link './target.md'")
	}
	if strings.Contains(output, "https://example.com") {
		t.Error("Output should not contain external link")
	}
}

func TestValidateDocsLinksCommand_NoProblems(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory to simulate a git repository
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create test structure
	docsDir := filepath.Join(tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		t.Fatalf("Failed to create docs dir: %v", err)
	}

	// Create a valid target file
	validTarget := filepath.Join(docsDir, "target.md")
	if err := os.WriteFile(validTarget, []byte("# Target"), 0644); err != nil {
		t.Fatalf("Failed to create target file: %v", err)
	}

	// Create source file with only valid links
	sourceFile := filepath.Join(docsDir, "source.md")
	content := `# Test Document

Valid link: [target](./target.md)
External link: [example](https://example.com)
`
	if err := os.WriteFile(sourceFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create source file: %v", err)
	}

	// Test command execution
	cmd := validateDocsLinksCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Reset flags
	validateDocsLinksStagedOnly = false
	output = "text"
	verbose = false
	quiet = false

	// Execute command (should succeed)
	err = cmd.RunE(cmd, []string{})
	if err != nil {
		t.Errorf("Command failed: %v", err)
	}

	output := buf.String()
	t.Logf("Command output:\n%s", output)

	// Verify success message
	if !strings.Contains(output, "✓ All links valid!") {
		t.Error("Expected output to contain success message")
	}
}

func TestValidateDocsLinksCommand_JSONOutput(t *testing.T) {
	// Save original working directory
	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Failed to get working directory: %v", err)
	}
	defer func() { _ = os.Chdir(originalWd) }()

	// Create temporary test repository
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatalf("Failed to change to temp directory: %v", err)
	}

	// Create .git directory to simulate a git repository
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0755); err != nil {
		t.Fatalf("Failed to create .git dir: %v", err)
	}

	// Create minimal structure
	docsDir := filepath.Join(tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		t.Fatalf("Failed to create docs dir: %v", err)
	}

	sourceFile := filepath.Join(docsDir, "source.md")
	content := `# Test
Link: [missing](./missing.md)
`
	if err := os.WriteFile(sourceFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create source file: %v", err)
	}

	// Test JSON output
	cmd := validateDocsLinksCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	// Set flags for JSON output
	validateDocsLinksStagedOnly = false
	output = "json"
	verbose = false
	quiet = false

	// Execute command
	err = cmd.RunE(cmd, []string{})
	if err != nil {
		t.Logf("Command returned error (expected for broken links): %v", err)
	}

	jsonOutput := buf.String()
	t.Logf("JSON output:\n%s", jsonOutput)

	// Verify JSON structure
	if !strings.Contains(jsonOutput, `"status"`) {
		t.Error("Expected JSON output to contain 'status' field")
	}
	if !strings.Contains(jsonOutput, `"broken_count"`) {
		t.Error("Expected JSON output to contain 'broken_count' field")
	}
}

func TestValidateDocsLinksCommand_MarkdownOutput(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmpDir, ".git"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmpDir, "docs"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(tmpDir, "docs", "tu__test.md"), []byte("# Test\n"), 0644); err != nil {
		t.Fatal(err)
	}

	cmd := validateDocsLinksCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	validateDocsLinksStagedOnly = false
	output = "markdown"
	verbose = false
	quiet = false

	if err := cmd.RunE(cmd, []string{}); err != nil {
		t.Errorf("expected no error for valid links, got: %v", err)
	}

	got := buf.String()
	if !strings.Contains(got, "links") && !strings.Contains(got, "#") && !strings.Contains(got, "valid") {
		t.Errorf("expected markdown output with link info, got: %s", got)
	}
}

func TestValidateDocsLinksCommand_QuietBrokenLinks(t *testing.T) {
	originalWd, _ := os.Getwd()
	defer func() { _ = os.Chdir(originalWd) }()

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmpDir, ".git"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(tmpDir, "docs"), 0755); err != nil {
		t.Fatal(err)
	}
	content := "# Test\n[broken](./missing-file.md)\n"
	if err := os.WriteFile(filepath.Join(tmpDir, "docs", "tu__test.md"), []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	cmd := validateDocsLinksCmd
	buf := new(bytes.Buffer)
	cmd.SetOut(buf)
	cmd.SetErr(buf)

	validateDocsLinksStagedOnly = false
	output = "text"
	verbose = false
	quiet = true

	err := cmd.RunE(cmd, []string{})
	if err == nil {
		t.Error("expected error for broken links in quiet mode")
	}
}
