package docs

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestShouldSkipLink(t *testing.T) {
	tests := []struct {
		name string
		link string
		want bool
	}{
		// Should skip
		{"Hugo absolute path", "/docs/path", true},
		{"Hugo shortcode angle", "{{< ref >}}", true},
		{"Hugo shortcode percent", "{{% ref %}}", true},
		{"Placeholder path.md", "path.md", true},
		{"Placeholder target", "target", true},
		{"Placeholder link", "link", true},
		{"Placeholder ./path/to/", "./path/to/file.md", true},
		{"Placeholder ../path/to/", "../path/to/file.md", true},
		{"Placeholder path/to/convention.md", "path/to/convention.md", true},
		{"Template placeholder", "file[name].md", true},
		{"Example image path", "/images/logo.png", true},
		{"Example tutorial prefix", "tu__rag-example.md", true},
		{"Example ex-co prefix", "ex-co__test.md", true},
		{"Example ./tu__ prefix", "./tu__example.md", true},
		{"Example ./overview", "./overview", true},
		{"Example by-concept", "by-concept/beginner/intro.md", true},
		{"OpenCode reference", "../../.opencode/agents/test.md", true},

		// Line 179: exact "path" match (not caught by placeholders which check "path.md")
		{"Exact word path", "path", true},
		// Line 184: relative path containing /images/ (not starting with /)
		{"Relative images path", "docs/images/logo.png", true},

		// Should NOT skip
		{"Valid relative link", "../docs/README.md", false},
		{"Valid same dir link", "./file.md", false},
		{"Valid parent link", "../../file.md", false},
		{"Valid nested link", "../governance/conventions/file.md", false},
		{"Valid with anchor", "../docs/README.md#section", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ShouldSkipLink(tt.link)
			if got != tt.want {
				t.Errorf("ShouldSkipLink(%q) = %v, want %v", tt.link, got, tt.want)
			}
		})
	}
}

func TestExtractLinks(t *testing.T) {
	// Create temporary test file
	tmpDir := t.TempDir()
	testFile := filepath.Join(tmpDir, "test.md")

	content := `# Test File

This is a [valid link](../docs/README.md) and [another](./file.md).

` + "```go" + `
// This [code link](./should-skip.md) should be skipped
` + "```" + `

External [link](https://example.com) should be skipped.
Internal [anchor](#section) should be skipped.
Email [contact](mailto:test@example.com) should be skipped.

This [placeholder](path.md) should be skipped.
This [real link](../../governance/README.md) should not be skipped.

Hugo [path](/docs/page) should be skipped.
`

	if err := os.WriteFile(testFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	links, err := ExtractLinks(testFile)
	if err != nil {
		t.Fatalf("ExtractLinks() error = %v", err)
	}

	// Expected links (not skipped)
	expected := map[string]int{
		"../docs/README.md":          3,
		"./file.md":                  3,
		"../../governance/README.md": 14,
	}

	if len(links) != len(expected) {
		t.Errorf("ExtractLinks() found %d links, want %d", len(links), len(expected))
		for _, link := range links {
			t.Logf("  Found: %s at line %d", link.URL, link.LineNumber)
		}
	}

	// Verify each expected link
	for _, link := range links {
		expectedLine, ok := expected[link.URL]
		if !ok {
			t.Errorf("Unexpected link found: %s at line %d", link.URL, link.LineNumber)
			continue
		}
		if link.LineNumber != expectedLine {
			t.Errorf("Link %s at line %d, want line %d", link.URL, link.LineNumber, expectedLine)
		}
		if !link.IsRelative {
			t.Errorf("Link %s should be relative", link.URL)
		}
	}
}

func TestExtractLinksCodeBlock(t *testing.T) {
	tmpDir := t.TempDir()
	testFile := filepath.Join(tmpDir, "test.md")

	content := `# Test

Before code block [link1](./file1.md)

` + "```" + `
Inside code block [link2](./file2.md)
` + "```" + `

After code block [link3](./file3.md)
`

	if err := os.WriteFile(testFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	links, err := ExtractLinks(testFile)
	if err != nil {
		t.Fatalf("ExtractLinks() error = %v", err)
	}

	// Should only find links outside code blocks
	if len(links) != 2 {
		t.Errorf("ExtractLinks() found %d links, want 2", len(links))
		for _, link := range links {
			t.Logf("  Found: %s", link.URL)
		}
	}

	// Verify correct links found
	foundURLs := make(map[string]bool)
	for _, link := range links {
		foundURLs[link.URL] = true
	}

	if !foundURLs["./file1.md"] {
		t.Error("Expected to find ./file1.md")
	}
	if !foundURLs["./file3.md"] {
		t.Error("Expected to find ./file3.md")
	}
	if foundURLs["./file2.md"] {
		t.Error("Should not find ./file2.md (inside code block)")
	}
}

func TestExtractLinksAngleBrackets(t *testing.T) {
	tmpDir := t.TempDir()
	testFile := filepath.Join(tmpDir, "test.md")

	content := `# Test

This is a [link](<../docs/README.md>) with angle brackets.
`

	if err := os.WriteFile(testFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	links, err := ExtractLinks(testFile)
	if err != nil {
		t.Fatalf("ExtractLinks() error = %v", err)
	}

	if len(links) != 1 {
		t.Fatalf("ExtractLinks() found %d links, want 1", len(links))
	}

	if links[0].URL != "../docs/README.md" {
		t.Errorf("Link URL = %q, want %q", links[0].URL, "../docs/README.md")
	}
}

func TestGetMarkdownFiles_NonStaged(t *testing.T) {
	tmpDir := t.TempDir()

	// Create .claude dir with a .md file
	claudeDir := filepath.Join(tmpDir, ".claude")
	if err := os.MkdirAll(claudeDir, 0755); err != nil {
		t.Fatalf("failed to create .claude dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(claudeDir, "test.md"), []byte("# Test"), 0644); err != nil {
		t.Fatalf("failed to create test.md: %v", err)
	}

	opts := ScanOptions{
		RepoRoot:   tmpDir,
		StagedOnly: false,
		SkipPaths:  []string{},
	}

	files, err := GetMarkdownFiles(opts)
	if err != nil {
		t.Fatalf("GetMarkdownFiles() error: %v", err)
	}

	found := false
	for _, f := range files {
		if filepath.Base(f) == "test.md" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected test.md in results, got %v", files)
	}
}

func TestGetMarkdownFiles_WithSkipPaths(t *testing.T) {
	tmpDir := t.TempDir()

	for _, dir := range []string{"docs", ".claude"} {
		d := filepath.Join(tmpDir, dir)
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatalf("failed to create dir: %v", err)
		}
		if err := os.WriteFile(filepath.Join(d, "file.md"), []byte("# Content"), 0644); err != nil {
			t.Fatalf("failed to create file: %v", err)
		}
	}

	opts := ScanOptions{
		RepoRoot:   tmpDir,
		StagedOnly: false,
		SkipPaths:  []string{"docs"},
	}

	files, err := GetMarkdownFiles(opts)
	if err != nil {
		t.Fatalf("GetMarkdownFiles() error: %v", err)
	}

	for _, f := range files {
		rel, _ := filepath.Rel(tmpDir, f)
		if len(rel) > 4 && rel[:4] == "docs" {
			t.Errorf("expected docs to be skipped, got %v in results", f)
		}
	}
}

func TestFilterSkipPaths_Empty(t *testing.T) {
	files := []string{"/repo/docs/file.md", "/repo/governance/other.md"}
	result := filterSkipPaths(files, "/repo", []string{})
	if len(result) != len(files) {
		t.Errorf("expected all files with empty skip paths, got %d files", len(result))
	}
}

func TestFilterSkipPaths_WithSkipPath(t *testing.T) {
	tmpDir := t.TempDir()

	docsDir := filepath.Join(tmpDir, "docs")
	govDir := filepath.Join(tmpDir, "governance")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		t.Fatalf("failed to create docs: %v", err)
	}
	if err := os.MkdirAll(govDir, 0755); err != nil {
		t.Fatalf("failed to create governance: %v", err)
	}

	files := []string{
		filepath.Join(docsDir, "file.md"),
		filepath.Join(govDir, "other.md"),
		filepath.Join(docsDir, "nested", "deep.md"),
	}
	result := filterSkipPaths(files, tmpDir, []string{"governance"})

	for _, f := range result {
		rel, _ := filepath.Rel(tmpDir, f)
		if len(rel) > 10 && rel[:10] == "governance" {
			t.Errorf("expected governance files to be filtered out, got %v", result)
		}
	}
}

func TestGetMarkdownFiles_Staged(t *testing.T) {
	tmpDir := t.TempDir()

	// Init git repo
	initCmds := [][]string{
		{"git", "-C", tmpDir, "init", "-q"},
		{"git", "-C", tmpDir, "config", "user.email", "test@test.com"},
		{"git", "-C", tmpDir, "config", "user.name", "Test"},
	}
	for _, args := range initCmds {
		if err := exec.Command(args[0], args[1:]...).Run(); err != nil {
			t.Skipf("git not available: %v", err)
		}
	}

	// Create and stage a markdown file
	docsDir := filepath.Join(tmpDir, "docs")
	if err := os.MkdirAll(docsDir, 0755); err != nil {
		t.Fatal(err)
	}
	mdFile := filepath.Join(docsDir, "tu__test.md")
	if err := os.WriteFile(mdFile, []byte("# Test"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := exec.Command("git", "-C", tmpDir, "add", "docs/tu__test.md").Run(); err != nil {
		t.Skipf("git add failed: %v", err)
	}

	opts := ScanOptions{
		RepoRoot:   tmpDir,
		StagedOnly: true,
	}

	files, err := GetMarkdownFiles(opts)
	if err != nil {
		t.Fatalf("GetMarkdownFiles(staged=true) error: %v", err)
	}
	if len(files) != 1 {
		t.Errorf("expected 1 staged markdown file, got %d: %v", len(files), files)
	}
}
