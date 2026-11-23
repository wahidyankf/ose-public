package integration_test

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

// writeContentTree materializes files under dir, the disk shape the operating
// system adapter reads.
func writeContentTree(t *testing.T, dir string, files map[string]string) {
	t.Helper()
	for name, body := range files {
		full := filepath.Join(dir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			t.Fatalf("mkdir fixture: %v", err)
		}
		if err := os.WriteFile(full, []byte(body), 0o600); err != nil {
			t.Fatalf("write fixture: %v", err)
		}
	}
}

// contentDiskFixture is a small learn/ tree with one invalid source and one
// dangling symlink, the on-disk cases the loader must diagnose.
func contentDiskFixture(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	lesson := "---\ntitle: Beginner\ndescription: Fixture page\n---\n\nBody.\n"
	writeContentTree(t, dir, map[string]string{
		"en/learn/courses/go-basics/learning/beginner.md": lesson,
		"en/learn/courses/go-basics/learning/bad.md":      "---\n:\tbad\n---\n\nBroken.\n",
		"en/learn/courses/go-basics/overview.md":          lesson,
	})
	ghost := filepath.Join(dir, "en", "learn", "courses", "go-basics", "learning", "ghost.md")
	if err := os.Symlink("no-such-target.md", ghost); err != nil {
		t.Fatalf("symlink fixture: %v", err)
	}
	return dir
}

func TestContentLoadsDiskFixtureThroughOperatingSystemAdapter(t *testing.T) {
	store, err := content.LoadFS(os.DirFS(contentDiskFixture(t)))
	if err != nil {
		t.Fatalf("LoadFS over disk: %v", err)
	}
	if _, ok := store.Find("en", "go-basics", "beginner"); !ok {
		t.Fatal("disk lesson must resolve")
	}
	if _, ok := store.Find("en", "go-basics", "overview"); !ok {
		t.Fatal("disk course overview must resolve to the course slug")
	}
	diagnostics := strings.Join(store.Diagnostics(), "\n")
	for _, marker := range []string{"bad.md", "ghost.md"} {
		if !strings.Contains(diagnostics, marker) {
			t.Fatalf("diagnostics must identify %q, got %q", marker, diagnostics)
		}
	}
}

func TestContentMissingDiskRootFails(t *testing.T) {
	if _, err := content.LoadFS(os.DirFS(filepath.Join(t.TempDir(), "no-such-root"))); err == nil {
		t.Fatal("missing content root on disk must fail")
	}
}

// contentRealRoot resolves the checked-in ayokoding-www content tree.
func contentRealRoot(t *testing.T) string {
	t.Helper()
	_, file, _, _ := runtime.Caller(0)
	root := filepath.Join(filepath.Dir(file), "..", "..", "..", "ayokoding-www", "content")
	if _, err := os.Stat(filepath.Join(root, "en", "learn", "courses")); err != nil {
		t.Fatalf("real corpus unavailable: %v", err)
	}
	return root
}

func TestContentLoadsRealCorpusFromDisk(t *testing.T) {
	store, err := content.LoadFS(os.DirFS(contentRealRoot(t)))
	if err != nil {
		t.Fatalf("real corpus must load without collisions: %v", err)
	}
	if got := len(store.Published("en")); got < 1500 {
		t.Fatalf("real en pages = %d, want at least 1500", got)
	}
	page, ok := store.Find("en", "backend-essentials-with-go", "beginner")
	if !ok || page.Title != "Beginner Examples" || page.Kind != "learning" {
		t.Fatalf("real lesson = %+v, %v; want Beginner Examples/learning", page, ok)
	}
	track, ok := store.Find("en", "backend-essentials-with-go", "learning")
	if !ok || track.Title != "Overview" {
		t.Fatalf("real kind overview = %+v, %v; want track landing", track, ok)
	}
	legacy, ok := store.Find("en", "legacy", "software-engineering/automation-testing/tools/vitest/by-example/intermediate")
	if !ok || legacy.Title != "Intermediate" {
		t.Fatalf("real legacy page = %+v, %v; want Intermediate", legacy, ok)
	}
	if len(store.Published("id")) != 0 {
		t.Fatal("id locale has no learn/ tree and must contribute no pages")
	}
	if len(store.Diagnostics()) == 0 {
		t.Fatal("real load must record skip diagnostics")
	}
}
