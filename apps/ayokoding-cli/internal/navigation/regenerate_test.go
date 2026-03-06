package navigation

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func setupTestContent(t *testing.T, baseDir string) {
	t.Helper()

	// Create a realistic content structure:
	// content/
	//   en/
	//     _index.md (root - should be excluded)
	//     learn/
	//       _index.md
	//       overview.md
	//       tutorials/
	//         _index.md
	//         beginner.md
	//   id/
	//     _index.md (root - should be excluded)

	// EN root index (should be excluded)
	createTestContentFile(t, baseDir, "en/_index.md", `---
title: English Home
weight: 1
---

Welcome to English site`)

	// EN learn index
	createTestContentFile(t, baseDir, "en/learn/_index.md", `---
title: Learn
weight: 100
---

Old navigation content that should be replaced`)

	createTestContentFile(t, baseDir, "en/learn/overview.md", `---
title: Overview
weight: 1
---

Overview content`)

	// EN learn/tutorials
	createTestContentFile(t, baseDir, "en/learn/tutorials/_index.md", `---
title: Tutorials
weight: 100
---

Old tutorials navigation`)

	createTestContentFile(t, baseDir, "en/learn/tutorials/beginner.md", `---
title: Beginner Tutorial
weight: 1
---

Beginner content`)

	// ID root index (should be excluded)
	createTestContentFile(t, baseDir, "id/_index.md", `---
title: Indonesian Home
weight: 1
---

Welcome to Indonesian site`)
}

func createTestContentFile(t *testing.T, baseDir, relPath, content string) {
	t.Helper()
	fullPath := filepath.Join(baseDir, relPath)
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatalf("Failed to create directory %s: %v", dir, err)
	}
	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create file %s: %v", fullPath, err)
	}
}

func TestRegenerateNavigation(t *testing.T) {
	tmpDir := t.TempDir()
	contentDir := filepath.Join(tmpDir, "content")
	setupTestContent(t, contentDir)

	result, err := RegenerateNavigation(contentDir)
	if err != nil {
		t.Fatalf("RegenerateNavigation failed: %v", err)
	}

	// Should have processed 2 files (en/learn/_index.md and en/learn/tutorials/_index.md)
	// Root files should be excluded
	if result.ProcessedCount != 2 {
		t.Errorf("Expected 2 processed files, got %d", result.ProcessedCount)
	}

	if result.ErrorCount != 0 {
		t.Errorf("Expected 0 errors, got %d: %v", result.ErrorCount, result.Errors)
	}

	// Verify en/learn/_index.md was regenerated correctly
	learnIndexPath := filepath.Join(contentDir, "en/learn/_index.md")
	content, err := os.ReadFile(learnIndexPath)
	if err != nil {
		t.Fatalf("Failed to read regenerated file: %v", err)
	}

	contentStr := string(content)

	// Should preserve frontmatter
	if !strings.Contains(contentStr, "title: Learn") {
		t.Error("Frontmatter title should be preserved")
	}
	if !strings.Contains(contentStr, "weight: 100") {
		t.Error("Frontmatter weight should be preserved")
	}

	// Should replace content with navigation
	if strings.Contains(contentStr, "Old navigation content") {
		t.Error("Old content should be replaced")
	}

	// Should contain navigation links with absolute paths
	if !strings.Contains(contentStr, "- [Overview](/en/learn/overview)") {
		t.Error("Should contain Overview link with absolute path")
	}
	if !strings.Contains(contentStr, "- [Tutorials](/en/learn/tutorials)") {
		t.Error("Should contain Tutorials link with absolute path")
	}
	if !strings.Contains(contentStr, "  - [Beginner Tutorial](/en/learn/tutorials/beginner)") {
		t.Error("Should contain nested Beginner Tutorial link with proper indentation and absolute path")
	}
}

func TestRegenerateNavigation_ExcludesRootFiles(t *testing.T) {
	tmpDir := t.TempDir()
	contentDir := filepath.Join(tmpDir, "content")
	setupTestContent(t, contentDir)

	_, err := RegenerateNavigation(contentDir)
	if err != nil {
		t.Fatalf("RegenerateNavigation failed: %v", err)
	}

	// Verify root files were NOT modified
	enRootPath := filepath.Join(contentDir, "en/_index.md")
	content, err := os.ReadFile(enRootPath)
	if err != nil {
		t.Fatalf("Failed to read root file: %v", err)
	}

	contentStr := string(content)

	// Root file should still have original content
	if !strings.Contains(contentStr, "Welcome to English site") {
		t.Error("Root file content should not be modified")
	}

	// Root file should NOT have auto-generated navigation
	if strings.Contains(contentStr, "- [Learn](learn)") {
		t.Error("Root file should not have auto-generated navigation")
	}
}

func TestRegenerateNavigation_NonExistentDirectory(t *testing.T) {
	_, err := RegenerateNavigation("/nonexistent/directory")
	if err == nil {
		t.Error("Expected error for non-existent directory")
	}
}

func TestRegenerateNavigation_NoIndexFiles(t *testing.T) {
	tmpDir := t.TempDir()
	contentDir := filepath.Join(tmpDir, "content")

	// Create directory but no index files
	if err := os.MkdirAll(contentDir, 0755); err != nil {
		t.Fatalf("Failed to create directory: %v", err)
	}

	// Create only root index files (which are excluded)
	createTestContentFile(t, contentDir, "en/_index.md", `---
title: English
---`)
	createTestContentFile(t, contentDir, "id/_index.md", `---
title: Indonesian
---`)

	_, err := RegenerateNavigation(contentDir)
	if err == nil {
		t.Error("Expected error when no processable index files found")
	}
}

func TestRegenerateNavigation_WithMalformedIndexFile(t *testing.T) {
	tmpDir := t.TempDir()
	contentDir := filepath.Join(tmpDir, "content")

	// Create nested dir with a malformed _index.md (no frontmatter)
	learnDir := filepath.Join(contentDir, "en", "learn")
	if err := os.MkdirAll(learnDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(learnDir, "_index.md"), []byte("No frontmatter here"), 0644); err != nil {
		t.Fatal(err)
	}

	result, err := RegenerateNavigation(contentDir)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.ErrorCount == 0 {
		t.Error("expected ErrorCount > 0 for malformed _index.md")
	}
}

func TestFindIndexFiles(t *testing.T) {
	tmpDir := t.TempDir()
	contentDir := filepath.Join(tmpDir, "content")
	setupTestContent(t, contentDir)

	files, err := findIndexFiles(contentDir)
	if err != nil {
		t.Fatalf("findIndexFiles failed: %v", err)
	}

	// Should find 2 files (excluding root en/_index.md and id/_index.md)
	if len(files) != 2 {
		t.Errorf("Expected 2 index files, got %d", len(files))
	}

	// Verify root files are excluded
	for _, file := range files {
		relPath, _ := filepath.Rel(contentDir, file)
		if relPath == "en/_index.md" || relPath == "id/_index.md" {
			t.Errorf("Root file should be excluded: %s", relPath)
		}
	}
}

func TestProcessIndexFile(t *testing.T) {
	tmpDir := t.TempDir()

	// Create a simple structure
	indexPath := filepath.Join(tmpDir, "_index.md")
	createTestContentFile(t, tmpDir, "_index.md", `---
title: Test Page
weight: 100
date: 2025-12-20
---

Old content`)

	createTestContentFile(t, tmpDir, "overview.md", `---
title: Overview
weight: 1
---`)

	err := processIndexFile(indexPath, tmpDir)
	if err != nil {
		t.Fatalf("processIndexFile failed: %v", err)
	}

	// Read regenerated file
	content, err := os.ReadFile(indexPath)
	if err != nil {
		t.Fatalf("Failed to read file: %v", err)
	}

	contentStr := string(content)

	// Verify frontmatter is preserved
	if !strings.Contains(contentStr, "title: Test Page") {
		t.Error("Title should be preserved")
	}
	if !strings.Contains(contentStr, "weight: 100") {
		t.Error("Weight should be preserved")
	}
	if !strings.Contains(contentStr, "date: 2025-12-20") {
		t.Error("Date field should be preserved")
	}

	// Verify old content is replaced
	if strings.Contains(contentStr, "Old content") {
		t.Error("Old content should be replaced")
	}

	// Verify navigation is generated with absolute paths
	// Note: This test creates files directly in tmpDir, so basePath will be "/"
	if !strings.Contains(contentStr, "- [Overview](/overview)") {
		t.Error("Navigation should be generated with absolute path")
	}
}

func TestProcessIndexFile_WriteError(t *testing.T) {
	// processIndexFile: write back to a read-only file triggers the os.WriteFile error (line 146-148)
	if runtime.GOOS == "windows" {
		t.Skip("read-only files behave differently on Windows")
	}
	tmpDir := t.TempDir()
	indexPath := filepath.Join(tmpDir, "_index.md")

	createTestContentFile(t, tmpDir, "_index.md", `---
title: Test Page
weight: 100
---

Old content`)

	// Make the file read-only so os.WriteFile fails
	if err := os.Chmod(indexPath, 0444); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(indexPath, 0644) }()

	err := processIndexFile(indexPath, tmpDir)
	if err == nil {
		t.Error("expected error when writing to read-only _index.md, got nil")
	}
}

func TestFindIndexFiles_WalkError(t *testing.T) {
	// findIndexFiles: Walk callback receives error for inaccessible subdirectory (line 84-86)
	if runtime.GOOS == "windows" {
		t.Skip("permission test not reliable on Windows")
	}
	tmpDir := t.TempDir()

	// Create a nested index file that gets discovered
	learnDir := filepath.Join(tmpDir, "learn")
	if err := os.MkdirAll(learnDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(learnDir, "_index.md"), []byte("---\ntitle: Learn\nweight: 1\n---"), 0644); err != nil {
		t.Fatal(err)
	}

	// Create a subdirectory inside learn that becomes inaccessible
	restrictedDir := filepath.Join(learnDir, "restricted")
	if err := os.MkdirAll(restrictedDir, 0755); err != nil {
		t.Fatal(err)
	}

	// Make restrictedDir completely inaccessible
	if err := os.Chmod(restrictedDir, 0000); err != nil {
		t.Fatal(err)
	}
	defer func() { _ = os.Chmod(restrictedDir, 0755) }()

	// findIndexFiles should fail because Walk returns an error for the inaccessible dir
	_, err := findIndexFiles(tmpDir)
	if err == nil {
		t.Error("expected error when Walk encounters inaccessible directory, got nil")
	}
}

func TestFindContentRoot_NoContentAncestor(t *testing.T) {
	// Use a temp directory that has no "content" ancestor directory.
	// findContentRoot should return the original path when it reaches the filesystem root.
	tmpDir := t.TempDir()
	result := findContentRoot(tmpDir)
	if result != tmpDir {
		t.Errorf("expected original path %q when no 'content' ancestor found, got %q", tmpDir, result)
	}
}

func TestProcessIndexFile_MalformedFrontmatter(t *testing.T) {
	tmpDir := t.TempDir()

	indexPath := filepath.Join(tmpDir, "_index.md")
	createTestContentFile(t, tmpDir, "_index.md", `No frontmatter here
Just content`)

	err := processIndexFile(indexPath, tmpDir)
	if err == nil {
		t.Error("Expected error for malformed frontmatter")
	}
}

func TestRegenerateNavigation_PreservesFrontmatterExactly(t *testing.T) {
	tmpDir := t.TempDir()

	indexPath := filepath.Join(tmpDir, "_index.md")

	// Create file with specific frontmatter formatting
	originalFrontmatter := `---
title: Test
weight: 100
date: 2025-12-20
draft: false
description: A test page
---
`

	createTestContentFile(t, tmpDir, "_index.md", originalFrontmatter+"\nOld content")

	err := processIndexFile(indexPath, tmpDir)
	if err != nil {
		t.Fatalf("processIndexFile failed: %v", err)
	}

	// Read regenerated file
	content, err := os.ReadFile(indexPath)
	if err != nil {
		t.Fatalf("Failed to read file: %v", err)
	}

	contentStr := string(content)

	// Extract frontmatter from regenerated file
	parts := strings.Split(contentStr, "---\n")
	if len(parts) < 3 {
		t.Fatal("Expected frontmatter to be preserved")
	}

	regeneratedFrontmatter := "---\n" + parts[1] + "---\n"

	// Should match exactly
	if regeneratedFrontmatter != originalFrontmatter {
		t.Errorf("Frontmatter not preserved exactly.\nGot:\n%s\nWant:\n%s",
			regeneratedFrontmatter, originalFrontmatter)
	}
}
