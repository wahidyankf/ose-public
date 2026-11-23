//go:build integration

package application_test

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// writeSyncCourse materializes one MapFS course below a temporary content
// root and returns the root.
func writeSyncCourse(t *testing.T, files fstest.MapFS, course string) string {
	t.Helper()
	root := t.TempDir()
	for route, file := range files {
		if !strings.HasPrefix(route, course+"/") {
			continue
		}
		target := filepath.Join(root, filepath.FromSlash(route))
		if err := os.MkdirAll(filepath.Dir(target), 0o750); err != nil {
			t.Fatalf("create course dir: %v", err)
		}
		if err := os.WriteFile(target, file.Data, 0o600); err != nil {
			t.Fatalf("write course file: %v", err)
		}
	}
	return root
}

// TestSyncWriteRepairsAnchoredFences requires --write to copy file bytes
// into stale fences and report no finding afterwards, and a second write to
// change nothing.
func TestSyncWriteRepairsAnchoredFences(t *testing.T) {
	root := writeSyncCourse(t, syncAlpha(), "beta")
	lesson := filepath.Join(root, "beta", "learning", "lessons", "b.md")
	before, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read lesson: %v", err)
	}
	findings, err := application.Sync(application.SyncRequest{
		Content:    os.DirFS(root),
		ContentDir: root,
		Courses:    []string{"beta"},
		Write:      true,
	})
	if err != nil {
		t.Fatalf("Sync=%v, want nil", err)
	}
	if len(findings) != 1 || findings[0].Code != "ayokoding.sync.missing-file" {
		t.Fatalf("findings=%+v, want only the missing-file that repair cannot fix", findings)
	}
	after, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read repaired lesson: %v", err)
	}
	if !strings.Contains(string(after), "print(\"one\")\nprint(\"two\")\n") {
		t.Fatalf("lesson missing repaired bytes:\n%s", after)
	}
	if strings.Contains(string(after), "print(\"stale\")") {
		t.Fatalf("lesson keeps stale bytes:\n%s", after)
	}
	again, err := application.Sync(application.SyncRequest{
		Content:    os.DirFS(root),
		ContentDir: root,
		Courses:    []string{"beta"},
		Write:      true,
	})
	if err != nil {
		t.Fatalf("second Sync=%v, want nil", err)
	}
	if len(again) != 1 {
		t.Fatalf("second findings=%+v, want only the missing-file", again)
	}
	stable, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read stable lesson: %v", err)
	}
	if string(stable) != string(after) {
		t.Fatalf("second write changed the lesson:\n%s\n%s", after, stable)
	}
	if string(before) == string(after) {
		t.Fatal("write changed nothing, want a repair")
	}
}

// TestSyncWriteReportsUnwritableLessons requires a repair the disk refuses
// to surface as a wrapped failure.
func TestSyncWriteReportsUnwritableLessons(t *testing.T) {
	root := t.TempDir()
	_, err := application.Sync(application.SyncRequest{
		Content:    syncAlpha(),
		ContentDir: root,
		Courses:    []string{"beta"},
		Write:      true,
	})
	if err == nil {
		t.Fatal("Sync succeeded, want a write failure")
	}
	if _, ok := errors.AsType[*finding.Error](err); ok {
		t.Fatalf("error=%v, want a wrapped failure, not a coded one", err)
	}
}
