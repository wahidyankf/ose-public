package docs

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveLink(t *testing.T) {
	tmpDir := t.TempDir()

	tests := []struct {
		name       string
		sourceFile string
		link       string
		want       string
	}{
		{
			name:       "Same directory",
			sourceFile: filepath.Join(tmpDir, "docs", "file.md"),
			link:       "./other.md",
			want:       filepath.Join(tmpDir, "docs", "other.md"),
		},
		{
			name:       "Parent directory",
			sourceFile: filepath.Join(tmpDir, "docs", "sub", "file.md"),
			link:       "../README.md",
			want:       filepath.Join(tmpDir, "docs", "README.md"),
		},
		{
			name:       "With anchor",
			sourceFile: filepath.Join(tmpDir, "docs", "file.md"),
			link:       "./other.md#section",
			want:       filepath.Join(tmpDir, "docs", "other.md"),
		},
		{
			name:       "Pure anchor",
			sourceFile: filepath.Join(tmpDir, "docs", "file.md"),
			link:       "#section",
			want:       filepath.Join(tmpDir, "docs", "file.md"),
		},
		{
			name:       "Multiple parent levels",
			sourceFile: filepath.Join(tmpDir, "docs", "a", "b", "file.md"),
			link:       "../../README.md",
			want:       filepath.Join(tmpDir, "docs", "README.md"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ResolveLink(tt.sourceFile, tt.link, tmpDir)
			if got != tt.want {
				t.Errorf("ResolveLink() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestValidateLink(t *testing.T) {
	tmpDir := t.TempDir()

	// Create test files
	docsDir := filepath.Join(tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		t.Fatalf("Failed to create docs dir: %v", err)
	}

	existingFile := filepath.Join(docsDir, "existing.md")
	if err := os.WriteFile(existingFile, []byte("# Test"), 0644); err != nil {
		t.Fatalf("Failed to create existing file: %v", err)
	}

	sourceFile := filepath.Join(docsDir, "source.md")
	if err := os.WriteFile(sourceFile, []byte("# Source"), 0644); err != nil {
		t.Fatalf("Failed to create source file: %v", err)
	}

	tests := []struct {
		name    string
		link    string
		want    bool
		wantErr bool
	}{
		{
			name: "Existing file",
			link: "./existing.md",
			want: true,
		},
		{
			name: "Missing file",
			link: "./missing.md",
			want: false,
		},
		{
			name: "Existing file with anchor",
			link: "./existing.md#section",
			want: true,
		},
		{
			name: "Pure anchor (self reference)",
			link: "#section",
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ValidateLink(sourceFile, tt.link, tmpDir)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateLink() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("ValidateLink(%q) = %v, want %v", tt.link, got, tt.want)
			}
		})
	}
}

func TestValidateFile(t *testing.T) {
	tmpDir := t.TempDir()

	// Create test structure
	docsDir := filepath.Join(tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		t.Fatalf("Failed to create docs dir: %v", err)
	}

	// Create an existing target file
	existingFile := filepath.Join(docsDir, "existing.md")
	if err := os.WriteFile(existingFile, []byte("# Existing"), 0644); err != nil {
		t.Fatalf("Failed to create existing file: %v", err)
	}

	// Create source file with links
	sourceFile := filepath.Join(docsDir, "source.md")
	content := `# Source File

This [exists](./existing.md) and this [does not](./missing.md).
Also [external](https://example.com) should be skipped.
`
	if err := os.WriteFile(sourceFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create source file: %v", err)
	}

	opts := ScanOptions{
		RepoRoot: tmpDir,
		Verbose:  false,
		Quiet:    false,
	}

	brokenLinks, err := ValidateFile(sourceFile, opts)
	if err != nil {
		t.Fatalf("ValidateFile() error = %v", err)
	}

	// Should find exactly one broken link
	if len(brokenLinks) != 1 {
		t.Errorf("ValidateFile() found %d broken links, want 1", len(brokenLinks))
		for _, bl := range brokenLinks {
			t.Logf("  Broken: %s", bl.LinkText)
		}
		return
	}

	broken := brokenLinks[0]
	if broken.LinkText != "./missing.md" {
		t.Errorf("Broken link text = %q, want %q", broken.LinkText, "./missing.md")
	}
	if broken.LineNumber != 3 {
		t.Errorf("Broken link line = %d, want 3", broken.LineNumber)
	}
}

func TestValidateFileSkipsSkillFiles(t *testing.T) {
	tmpDir := t.TempDir()

	// Create .claude/skills directory
	skillsDir := filepath.Join(tmpDir, ".claude", "skills")
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		t.Fatalf("Failed to create skills dir: %v", err)
	}

	// Create skill file with broken links
	skillFile := filepath.Join(skillsDir, "test-skill.md")
	content := `# Test Skill

This [link](./missing.md) is broken but should be skipped.
`
	if err := os.WriteFile(skillFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create skill file: %v", err)
	}

	opts := ScanOptions{
		RepoRoot: tmpDir,
		Verbose:  false,
		Quiet:    false,
	}

	brokenLinks, err := ValidateFile(skillFile, opts)
	if err != nil {
		t.Fatalf("ValidateFile() error = %v", err)
	}

	// Should find no broken links (file is skipped)
	if len(brokenLinks) != 0 {
		t.Errorf("ValidateFile() found %d broken links, want 0 (should skip skill files)", len(brokenLinks))
	}
}

func TestValidateAll_EmptyDir(t *testing.T) {
	tmpDir := t.TempDir()

	// Create .claude with no .md files
	if err := os.MkdirAll(filepath.Join(tmpDir, ".claude"), 0755); err != nil {
		t.Fatalf("failed to create dir: %v", err)
	}

	opts := ScanOptions{
		RepoRoot:   tmpDir,
		StagedOnly: false,
	}

	result, err := ValidateAllLinks(opts)
	if err != nil {
		t.Fatalf("ValidateAllLinks() error: %v", err)
	}
	if result.TotalFiles != 0 {
		t.Errorf("expected 0 files, got %d", result.TotalFiles)
	}
}

func TestValidateAll_WithValidLinks(t *testing.T) {
	tmpDir := t.TempDir()

	docsDir := filepath.Join(tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		t.Fatalf("failed to create docs dir: %v", err)
	}

	// Create target file
	if err := os.WriteFile(filepath.Join(docsDir, "target.md"), []byte("# Target"), 0644); err != nil {
		t.Fatalf("failed to create target: %v", err)
	}

	// Create source file with link to target
	content := "[Target](./target.md)"
	if err := os.WriteFile(filepath.Join(docsDir, "source.md"), []byte(content), 0644); err != nil {
		t.Fatalf("failed to create source: %v", err)
	}

	opts := ScanOptions{
		RepoRoot:   tmpDir,
		StagedOnly: false,
	}

	result, err := ValidateAllLinks(opts)
	if err != nil {
		t.Fatalf("ValidateAllLinks() error: %v", err)
	}
	if len(result.BrokenLinks) > 0 {
		t.Errorf("expected no broken links, got %v", result.BrokenLinks)
	}
	if result.TotalFiles != 2 {
		t.Errorf("expected 2 files, got %d", result.TotalFiles)
	}
}

func TestValidateAll_WithBrokenLinks(t *testing.T) {
	tmpDir := t.TempDir()

	docsDir := filepath.Join(tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		t.Fatalf("failed to create docs dir: %v", err)
	}

	// Create file with broken link
	content := "[Missing](./does-not-exist.md)"
	if err := os.WriteFile(filepath.Join(docsDir, "source.md"), []byte(content), 0644); err != nil {
		t.Fatalf("failed to create source: %v", err)
	}

	opts := ScanOptions{
		RepoRoot:   tmpDir,
		StagedOnly: false,
	}

	result, err := ValidateAllLinks(opts)
	if err != nil {
		t.Fatalf("ValidateAllLinks() error: %v", err)
	}
	if len(result.BrokenLinks) != 1 {
		t.Errorf("expected 1 broken link, got %d", len(result.BrokenLinks))
	}
}
