package links

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func createTestFile(t *testing.T, path, content string) {
	t.Helper()
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatalf("Failed to create directory %s: %v", dir, err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create file %s: %v", path, err)
	}
}

func TestCheckLinks_AllValid(t *testing.T) {
	tmpDir := t.TempDir()

	createTestFile(t, filepath.Join(tmpDir, "en/learn/overview.md"), "# Overview")
	createTestFile(t, filepath.Join(tmpDir, "en/index.md"), "[Overview](/en/learn/overview)")

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if len(result.BrokenLinks) != 0 {
		t.Errorf("Expected 0 broken, got %d: %v", len(result.BrokenLinks), result.BrokenLinks)
	}
	if result.CheckedCount != 1 {
		t.Errorf("Expected 1 checked, got %d", result.CheckedCount)
	}
}

func TestCheckLinks_BrokenEnLink(t *testing.T) {
	tmpDir := t.TempDir()

	createTestFile(t, filepath.Join(tmpDir, "en/index.md"), "[Missing](/en/learn/missing-page)")

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if len(result.BrokenLinks) != 1 {
		t.Fatalf("Expected 1 broken link, got %d", len(result.BrokenLinks))
	}

	bl := result.BrokenLinks[0]
	if bl.Text != "Missing" {
		t.Errorf("Expected text 'Missing', got %q", bl.Text)
	}
	if bl.Target != "/en/learn/missing-page" {
		t.Errorf("Expected target '/en/learn/missing-page', got %q", bl.Target)
	}
	if bl.Line != 1 {
		t.Errorf("Expected line 1, got %d", bl.Line)
	}
}

func TestCheckLinks_BrokenIdLink(t *testing.T) {
	tmpDir := t.TempDir()

	createTestFile(t, filepath.Join(tmpDir, "id/index.md"), "[Hilang](/id/belajar/halaman-hilang)")

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if len(result.BrokenLinks) != 1 {
		t.Errorf("Expected 1 broken, got %d", len(result.BrokenLinks))
	}
}

func TestCheckLinks_ExternalLinksSkipped(t *testing.T) {
	tmpDir := t.TempDir()

	content := "[Go](https://golang.org)\n[HTTP](http://example.com)\n[Email](mailto:test@example.com)\n[Proto](//example.com)"
	createTestFile(t, filepath.Join(tmpDir, "en/index.md"), content)

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if result.CheckedCount != 0 {
		t.Errorf("Expected 0 checked (external links skipped), got %d", result.CheckedCount)
	}
	if len(result.BrokenLinks) != 0 {
		t.Errorf("Expected 0 broken, got %d", len(result.BrokenLinks))
	}
}

func TestCheckLinks_AnchorOnlySkipped(t *testing.T) {
	tmpDir := t.TempDir()

	createTestFile(t, filepath.Join(tmpDir, "en/index.md"), "[Section](#some-section)")

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if result.CheckedCount != 0 {
		t.Errorf("Expected 0 checked (anchor-only skipped), got %d", result.CheckedCount)
	}
}

func TestCheckLinks_InternalLinkWithAnchorStripped(t *testing.T) {
	tmpDir := t.TempDir()

	createTestFile(t, filepath.Join(tmpDir, "en/learn/page.md"), "# Page")
	createTestFile(t, filepath.Join(tmpDir, "en/index.md"), "[Page](/en/learn/page#section)")

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if len(result.BrokenLinks) != 0 {
		t.Errorf("Expected 0 broken (fragment stripped), got %d: %v", len(result.BrokenLinks), result.BrokenLinks)
	}
}

func TestCheckLinks_TargetExistsAsMd(t *testing.T) {
	tmpDir := t.TempDir()

	createTestFile(t, filepath.Join(tmpDir, "en/learn/topic.md"), "# Topic")
	createTestFile(t, filepath.Join(tmpDir, "en/index.md"), "[Topic](/en/learn/topic)")

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if len(result.BrokenLinks) != 0 {
		t.Errorf("Expected 0 broken (target is .md), got %d", len(result.BrokenLinks))
	}
}

func TestCheckLinks_TargetExistsAsIndexMd(t *testing.T) {
	tmpDir := t.TempDir()

	createTestFile(t, filepath.Join(tmpDir, "en/learn/_index.md"), "# Learn")
	createTestFile(t, filepath.Join(tmpDir, "en/index.md"), "[Learn](/en/learn)")

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if len(result.BrokenLinks) != 0 {
		t.Errorf("Expected 0 broken (target is _index.md), got %d", len(result.BrokenLinks))
	}
}

func TestCheckLinks_FencedCodeBlockSkipped(t *testing.T) {
	tmpDir := t.TempDir()

	// Simulate Go code with map[key](value) syntax inside a fenced block
	content := "```go\nhandlers[\"apply\"](v1Event)\n```"
	createTestFile(t, filepath.Join(tmpDir, "en/index.md"), content)

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if result.CheckedCount != 0 {
		t.Errorf("Expected 0 checked (code block skipped), got %d", result.CheckedCount)
	}
	if len(result.BrokenLinks) != 0 {
		t.Errorf("Expected 0 broken (code block skipped), got %d", len(result.BrokenLinks))
	}
}

func TestCheckLinks_StaticAssetLinksSkipped(t *testing.T) {
	tmpDir := t.TempDir()

	// Links to files with extensions (RSS, PDF, JSON, images) should be skipped
	content := "[RSS](/updates/index.xml)\n[PDF](/docs/guide.pdf)\n[JSON](/api/data.json)"
	createTestFile(t, filepath.Join(tmpDir, "index.md"), content)

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if result.CheckedCount != 0 {
		t.Errorf("Expected 0 checked (static assets skipped), got %d", result.CheckedCount)
	}
	if len(result.BrokenLinks) != 0 {
		t.Errorf("Expected 0 broken (static assets skipped), got %d", len(result.BrokenLinks))
	}
}

func TestCheckLinks_TargetMissingBothForms(t *testing.T) {
	tmpDir := t.TempDir()

	createTestFile(t, filepath.Join(tmpDir, "en/index.md"), "[Gone](/en/learn/gone)")

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if len(result.BrokenLinks) != 1 {
		t.Errorf("Expected 1 broken (neither .md nor _index.md), got %d", len(result.BrokenLinks))
	}
}

func TestCheckLinks_NonExistentDir(t *testing.T) {
	_, err := CheckLinks("/tmp/definitely-does-not-exist-hugo-commons-xyz-12345")
	if err == nil {
		t.Error("Expected error for nonexistent directory, got nil")
	}
}

func TestCheckLinks_QueryStringLink(t *testing.T) {
	tmpDir := t.TempDir()

	createTestFile(t, filepath.Join(tmpDir, "some/page.md"), "# Page")
	createTestFile(t, filepath.Join(tmpDir, "index.md"), "[Page](/some/page?lang=en)")

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks failed: %v", err)
	}

	if len(result.BrokenLinks) != 0 {
		t.Errorf("Expected 0 broken (query string stripped), got %d: %v", len(result.BrokenLinks), result.BrokenLinks)
	}
	if result.CheckedCount != 1 {
		t.Errorf("Expected 1 checked, got %d", result.CheckedCount)
	}
}

func TestCheckLinks_UnreadableFile(t *testing.T) {
	tmpDir := t.TempDir()

	filePath := filepath.Join(tmpDir, "locked.md")
	createTestFile(t, filePath, "[Link](/some/target)")
	if err := os.Chmod(filePath, 0000); err != nil {
		t.Skip("cannot set permissions on this platform")
	}
	defer func() { _ = os.Chmod(filePath, 0644) }()

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks should not fail on unreadable file, got: %v", err)
	}
	if result.ErrorCount == 0 {
		t.Error("Expected ErrorCount > 0 for unreadable file")
	}
}

func TestCheckLinks_WalkCallbackError(t *testing.T) {
	tmpDir := t.TempDir()

	// Create an unreadable subdirectory — Walk calls the callback with err != nil
	// when it cannot read the directory's contents.
	subDir := filepath.Join(tmpDir, "locked-dir")
	if err := os.Mkdir(subDir, 0755); err != nil {
		t.Fatalf("Failed to create subdirectory: %v", err)
	}
	if err := os.Chmod(subDir, 0000); err != nil {
		t.Skip("cannot set permissions on this platform")
	}
	defer func() { _ = os.Chmod(subDir, 0755) }()

	result, err := CheckLinks(tmpDir)
	if err != nil {
		t.Fatalf("CheckLinks should not fail on walk callback error, got: %v", err)
	}
	if result.ErrorCount == 0 {
		t.Error("Expected ErrorCount > 0 for unreadable subdirectory")
	}
	if len(result.Errors) == 0 {
		t.Error("Expected Errors to be populated for unreadable subdirectory")
	}
}

func TestCheckLinks_FilepathAbsError(t *testing.T) {
	orig := filepathAbs
	filepathAbs = func(_ string) (string, error) {
		return "", errors.New("injected abs error")
	}
	defer func() { filepathAbs = orig }()

	_, err := CheckLinks("/any/path")
	if err == nil {
		t.Fatal("Expected error when filepath.Abs fails, got nil")
	}
}

func TestCheckLinks_WalkError(t *testing.T) {
	tmpDir := t.TempDir()

	orig := osWalk
	osWalk = func(_ string, _ filepath.WalkFunc) error {
		return errors.New("injected walk error")
	}
	defer func() { osWalk = orig }()

	_, err := CheckLinks(tmpDir)
	if err == nil {
		t.Fatal("Expected error when Walk fails, got nil")
	}
}
