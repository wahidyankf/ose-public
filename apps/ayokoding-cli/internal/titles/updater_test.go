package titles

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestUpdateTitles_EnLangSuccess(t *testing.T) {
	originalDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chdir(originalDir) }()

	tmpDir := t.TempDir()
	enDir := filepath.Join(tmpDir, "apps", "ayokoding-web", "content", "en")
	if err := os.MkdirAll(enDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}

	result, err := UpdateTitles("en", false, "", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.EnResult == nil {
		t.Error("expected EnResult to be set")
	}
	if result.IDResult != nil {
		t.Error("expected IDResult to be nil for lang=en")
	}
}

func TestUpdateTitles_IDLangSuccess(t *testing.T) {
	originalDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chdir(originalDir) }()

	tmpDir := t.TempDir()
	idDir := filepath.Join(tmpDir, "apps", "ayokoding-web", "content", "id")
	if err := os.MkdirAll(idDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}

	result, err := UpdateTitles("id", false, "", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.IDResult == nil {
		t.Error("expected IDResult to be set")
	}
	if result.EnResult != nil {
		t.Error("expected EnResult to be nil for lang=id")
	}
}

func TestUpdateTitles_EnConfigError(t *testing.T) {
	originalDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chdir(originalDir) }()

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}

	// Create a config file with invalid YAML (triggers LoadConfig error)
	badConfig := filepath.Join(tmpDir, "bad-config.yaml")
	if err := os.WriteFile(badConfig, []byte("this: is: invalid: yaml"), 0644); err != nil {
		t.Fatal(err)
	}

	_, err = UpdateTitles("en", false, badConfig, "")
	if err == nil {
		t.Error("expected error from bad config")
	}
}

func TestProcessLanguageDirectory_WithMixedFiles(t *testing.T) {
	config := &Config{Overrides: map[string]string{}, LowercaseWords: []string{}}
	tmpDir := t.TempDir()

	// Non-.md file (covers the non-.md early-return path)
	if err := os.WriteFile(filepath.Join(tmpDir, "readme.txt"), []byte("text"), 0644); err != nil {
		t.Fatal(err)
	}
	// .md file without frontmatter (triggers processFile error path)
	if err := os.WriteFile(filepath.Join(tmpDir, "no-frontmatter.md"), []byte("No frontmatter here"), 0644); err != nil {
		t.Fatal(err)
	}

	result, err := processLanguageDirectory(tmpDir, config, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.ErrorCount == 0 {
		t.Error("expected ErrorCount > 0 for malformed .md file")
	}
}

func TestUpdateTitleInFile(t *testing.T) {
	tests := []struct {
		name            string
		originalContent string
		newTitle        string
		expectedContent string
		expectError     bool
	}{
		{
			name: "update simple title",
			originalContent: `---
title: Old Title
weight: 100
---

Content here`,
			newTitle: "New Title",
			expectedContent: `---
title: "New Title"
weight: 100
---

Content here`,
			expectError: false,
		},
		{
			name: "update quoted title",
			originalContent: `---
title: "Old Quoted Title"
weight: 50
---

Content`,
			newTitle: "New Quoted Title",
			expectedContent: `---
title: "New Quoted Title"
weight: 50
---

Content`,
			expectError: false,
		},
		{
			name: "update single-quoted title",
			originalContent: `---
title: 'Old Single Quoted'
weight: 25
---`,
			newTitle: "New Single Quoted",
			expectedContent: `---
title: "New Single Quoted"
weight: 25
---`,
			expectError: false,
		},
		{
			name: "update title with special characters",
			originalContent: `---
title: Old Title
date: 2025-12-20
draft: false
---

Content`,
			newTitle: "Node.js Tutorial",
			expectedContent: `---
title: "Node.js Tutorial"
date: 2025-12-20
draft: false
---

Content`,
			expectError: false,
		},
		{
			name: "title with quotes in value",
			originalContent: `---
title: Old Title
---`,
			newTitle: `Title with "Quotes"`,
			expectedContent: `---
title: "Title with \"Quotes\""
---`,
			expectError: false,
		},
		{
			name: "no frontmatter",
			originalContent: `This is just content
without frontmatter`,
			newTitle:    "New Title",
			expectError: true,
		},
		{
			name: "frontmatter without title field (regex adds it)",
			originalContent: `---
weight: 100
date: 2025-12-20
---

Content`,
			newTitle: "New Title",
			expectedContent: `---
weight: 100
date: 2025-12-20
---

Content`,
			expectError: false, // Regex won't find title to replace, file unchanged
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create temporary file
			tmpDir := t.TempDir()
			tmpFile := filepath.Join(tmpDir, "test.md")

			if err := os.WriteFile(tmpFile, []byte(tt.originalContent), 0644); err != nil {
				t.Fatalf("Failed to create temp file: %v", err)
			}

			// Update title
			err := updateTitleInFile(tmpFile, tt.newTitle)

			if tt.expectError {
				if err == nil {
					t.Error("Expected error but got none")
				}
				return
			}

			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}

			// Read updated content
			updatedContent, err := os.ReadFile(tmpFile)
			if err != nil {
				t.Fatalf("Failed to read updated file: %v", err)
			}

			if string(updatedContent) != tt.expectedContent {
				t.Errorf("Content mismatch.\nGot:\n%s\nWant:\n%s", string(updatedContent), tt.expectedContent)
			}
		})
	}
}

func TestProcessFile(t *testing.T) {
	config := &Config{
		Overrides: map[string]string{
			"javascript": "JavaScript",
		},
		LowercaseWords: []string{"and"},
	}

	tests := []struct {
		name          string
		filename      string
		originalTitle string
		expectedTitle string
		dryRun        bool
		expectSkip    bool
		expectUpdate  bool
	}{
		{
			name:          "title needs update",
			filename:      "javascript-basics.md",
			originalTitle: "Javascript Basics",
			expectedTitle: "JavaScript Basics",
			dryRun:        false,
			expectUpdate:  true,
		},
		{
			name:          "title already correct - skip",
			filename:      "javascript-basics.md",
			originalTitle: "JavaScript Basics",
			expectedTitle: "JavaScript Basics",
			dryRun:        false,
			expectSkip:    true,
		},
		{
			name:          "dry run - count but don't update",
			filename:      "terms-and-conditions.md",
			originalTitle: "Terms And Conditions",
			expectedTitle: "Terms and Conditions",
			dryRun:        true,
			expectUpdate:  true, // Counted as update but file not modified
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create temporary file with frontmatter
			tmpDir := t.TempDir()
			tmpFile := filepath.Join(tmpDir, tt.filename)

			content := "---\ntitle: " + tt.originalTitle + "\nweight: 100\n---\n\nContent"
			if err := os.WriteFile(tmpFile, []byte(content), 0644); err != nil {
				t.Fatalf("Failed to create temp file: %v", err)
			}

			// Process file
			result := &LangResult{
				Errors: []string{},
			}
			err := processFile(tmpFile, config, tt.dryRun, result)

			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}

			// Verify counts
			if tt.expectSkip && result.SkippedCount != 1 {
				t.Errorf("Expected skip count 1, got %d", result.SkippedCount)
			}

			if tt.expectUpdate && result.UpdatedCount != 1 {
				t.Errorf("Expected update count 1, got %d", result.UpdatedCount)
			}

			// For non-dry-run, verify file was actually updated
			if !tt.dryRun && tt.expectUpdate {
				updatedContent, err := os.ReadFile(tmpFile)
				if err != nil {
					t.Fatalf("Failed to read updated file: %v", err)
				}

				expectedContent := "---\ntitle: \"" + tt.expectedTitle + "\"\nweight: 100\n---\n\nContent"
				if string(updatedContent) != expectedContent {
					t.Errorf("File not updated correctly.\nGot:\n%s\nWant:\n%s", string(updatedContent), expectedContent)
				}
			}

			// For dry-run, verify file was NOT modified
			if tt.dryRun && tt.expectUpdate {
				unchangedContent, err := os.ReadFile(tmpFile)
				if err != nil {
					t.Fatalf("Failed to read file: %v", err)
				}

				if string(unchangedContent) != content {
					t.Error("File was modified during dry-run (should not be)")
				}
			}
		})
	}
}

func TestProcessLanguageDirectory(t *testing.T) {
	config := &Config{
		Overrides:      map[string]string{"javascript": "JavaScript"},
		LowercaseWords: []string{"and"},
	}

	// Create temporary directory structure
	tmpDir := t.TempDir()
	enDir := filepath.Join(tmpDir, "en")
	learnDir := filepath.Join(enDir, "learn")

	if err := os.MkdirAll(learnDir, 0755); err != nil {
		t.Fatalf("Failed to create directories: %v", err)
	}

	// Create test files
	testFiles := map[string]string{
		filepath.Join(enDir, "about.md"):                   "title: About\n",
		filepath.Join(learnDir, "programming-language.md"): "title: Programming Language\n", // Already correct
		filepath.Join(learnDir, "javascript-basics.md"):    "title: Javascript Basics\n",    // Needs update
	}

	for path, title := range testFiles {
		content := "---\n" + title + "weight: 100\n---\n\nContent"
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			t.Fatalf("Failed to create test file %s: %v", path, err)
		}
	}

	// Process directory
	result, err := processLanguageDirectory(enDir, config, false)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	// Verify results
	expectedUpdated := 1 // javascript-basics.md
	expectedSkipped := 2 // about.md, programming-language.md

	if result.UpdatedCount != expectedUpdated {
		t.Errorf("Updated count: got %d, want %d", result.UpdatedCount, expectedUpdated)
	}

	if result.SkippedCount != expectedSkipped {
		t.Errorf("Skipped count: got %d, want %d", result.SkippedCount, expectedSkipped)
	}

	if result.ErrorCount != 0 {
		t.Errorf("Error count: got %d, want 0. Errors: %v", result.ErrorCount, result.Errors)
	}
}

func TestProcessLanguageDirectory_NonExistent(t *testing.T) {
	config := &Config{
		Overrides:      map[string]string{},
		LowercaseWords: []string{},
	}

	_, err := processLanguageDirectory("/nonexistent/directory", config, false)
	if err == nil {
		t.Error("Expected error for non-existent directory")
	}
}

func TestUpdateTitles_EnDirMissing(t *testing.T) {
	// UpdateTitles with lang="en" when the content dir doesn't exist
	// triggers the processLanguageDirectory error path (line 40-42)
	originalDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chdir(originalDir) }()

	// Use tmpDir that does NOT have apps/ayokoding-web/content/en
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}

	_, err = UpdateTitles("en", false, "", "")
	if err == nil {
		t.Error("expected error when en content dir does not exist")
	}
}

func TestUpdateTitles_IDConfigError(t *testing.T) {
	// UpdateTitles with lang="id" when configIDPath has invalid YAML
	// triggers the LoadConfig error path for the id branch (line 49-51)
	originalDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chdir(originalDir) }()

	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}

	// Write a bad YAML config for the id branch
	badConfig := filepath.Join(tmpDir, "bad-id-config.yaml")
	if err := os.WriteFile(badConfig, []byte("this: is: invalid: yaml"), 0644); err != nil {
		t.Fatal(err)
	}

	_, err = UpdateTitles("id", false, "", badConfig)
	if err == nil {
		t.Error("expected error from bad id config")
	}
}

func TestUpdateTitles_IDDirMissing(t *testing.T) {
	// UpdateTitles with lang="id" when the content dir doesn't exist
	// triggers the processLanguageDirectory error path (line 54-56)
	originalDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chdir(originalDir) }()

	// Use tmpDir that does NOT have apps/ayokoding-web/content/id
	tmpDir := t.TempDir()
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}

	_, err = UpdateTitles("id", false, "", "")
	if err == nil {
		t.Error("expected error when id content dir does not exist")
	}
}

func TestUpdateTitleInFile_MissingClosingDelimiter(t *testing.T) {
	// updateTitleInFile: file starts with --- but has no closing ---
	// triggers the endIdx == -1 path (line 174-176)
	tmpDir := t.TempDir()
	tmpFile := filepath.Join(tmpDir, "test.md")

	// File starts with --- and has more than 3 lines, but no closing ---
	content := "---\ntitle: Something\nno closing delimiter here\nmore content"
	if err := os.WriteFile(tmpFile, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	err := updateTitleInFile(tmpFile, "New Title")
	if err == nil {
		t.Error("expected error for missing closing delimiter, got nil")
	}
}

func TestUpdateTitleInFile_ReadOnlyFile(t *testing.T) {
	// updateTitleInFile: writing back to a read-only file triggers error (line 190-192)
	if runtime.GOOS == "windows" {
		t.Skip("read-only files behave differently on Windows")
	}
	tmpDir := t.TempDir()
	tmpFile := filepath.Join(tmpDir, "readonly.md")

	content := "---\ntitle: Old Title\nweight: 100\n---\n\nContent"
	if err := os.WriteFile(tmpFile, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	// Make file read-only so WriteFile fails
	if err := os.Chmod(tmpFile, 0444); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(tmpFile, 0644) }()

	err := updateTitleInFile(tmpFile, "New Title")
	if err == nil {
		t.Error("expected error writing to read-only file, got nil")
	}
}

func TestProcessFile_UpdateTitleInFileError(t *testing.T) {
	// processFile: updateTitleInFile fails because the file is read-only
	// covers line 140-142 (the error return from updateTitleInFile)
	if runtime.GOOS == "windows" {
		t.Skip("read-only files behave differently on Windows")
	}
	config := &Config{
		Overrides:      map[string]string{"javascript": "JavaScript"},
		LowercaseWords: []string{},
	}

	tmpDir := t.TempDir()
	// Use a filename that generates a different title from the stored one
	tmpFile := filepath.Join(tmpDir, "javascript-basics.md")

	content := "---\ntitle: Javascript Basics\nweight: 100\n---\n\nContent"
	if err := os.WriteFile(tmpFile, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	// Make file read-only so updateTitleInFile's WriteFile fails
	if err := os.Chmod(tmpFile, 0444); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(tmpFile, 0644) }()

	result := &LangResult{Errors: []string{}}
	err := processFile(tmpFile, config, false, result)
	if err == nil {
		t.Error("expected error when updateTitleInFile fails due to read-only file")
	}
}

func TestProcessLanguageDirectory_WalkError(t *testing.T) {
	// processLanguageDirectory: walk callback receives error for inaccessible subdir
	// covers lines 82-86 (the err != nil path inside the Walk callback)
	if runtime.GOOS == "windows" {
		t.Skip("permission test not reliable on Windows")
	}
	config := &Config{Overrides: map[string]string{}, LowercaseWords: []string{}}
	tmpDir := t.TempDir()

	// Create a subdirectory that becomes inaccessible
	subDir := filepath.Join(tmpDir, "restricted")
	if err := os.MkdirAll(subDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(subDir, "test.md"), []byte("---\ntitle: Test\n---"), 0644); err != nil {
		t.Fatal(err)
	}

	// Remove all permissions on the subdirectory so Walk can't descend
	if err := os.Chmod(subDir, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(subDir, 0755) }()

	result, err := processLanguageDirectory(tmpDir, config, false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Walk should have logged errors for the inaccessible directory
	if result.ErrorCount == 0 {
		t.Error("expected ErrorCount > 0 for inaccessible subdirectory")
	}
}

func TestEscapeQuotes(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{`Simple Title`, `Simple Title`},
		{`Title with "quotes"`, `Title with \"quotes\"`},
		{`Multiple "quotes" and "more"`, `Multiple \"quotes\" and \"more\"`},
		{`No quotes here`, `No quotes here`},
		{``, ``},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := escapeQuotes(tt.input)
			if result != tt.expected {
				t.Errorf("escapeQuotes(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}
