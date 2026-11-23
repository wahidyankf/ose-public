//go:build integration

package content_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/content"
)

// TestWriteUpdatesProvesMode proves repairs land on disk with mode 0644,
// even over a lesson that carried a narrower mode.
func TestWriteUpdatesProvesMode(t *testing.T) {
	root := t.TempDir()
	lesson := filepath.Join(root, "learning", "lessons", "hello.md")
	if err := os.MkdirAll(filepath.Dir(lesson), 0o700); err != nil {
		t.Fatalf("create lesson directory: %v", err)
	}
	if err := os.WriteFile(lesson, []byte("stale\n"), 0o600); err != nil {
		t.Fatalf("seed lesson: %v", err)
	}
	updates := map[string][]byte{"learning/lessons/hello.md": []byte("fresh\n")}
	if err := content.WriteUpdates(root, updates); err != nil {
		t.Fatalf("WriteUpdates: %v", err)
	}
	body, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read lesson: %v", err)
	}
	if string(body) != "fresh\n" {
		t.Fatalf("body=%q, want the repair", body)
	}
	info, err := os.Stat(lesson)
	if err != nil {
		t.Fatalf("stat lesson: %v", err)
	}
	if info.Mode().Perm() != 0o644 {
		t.Fatalf("mode=%o, want 644", info.Mode().Perm())
	}
}

// TestWriteUpdatesRefusesFolders proves the rewrite refuses a lesson
// path that holds a folder on disk.
func TestWriteUpdatesRefusesFolders(t *testing.T) {
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, "sub"), 0o755); err != nil {
		t.Fatal(err)
	}
	updates := map[string][]byte{"sub": []byte("fresh\n")}
	if err := content.WriteUpdates(root, updates); err == nil {
		t.Fatal("WriteUpdates wrote into a folder, want an error")
	}
}

// TestWriteUpdatesRefusesUnreadableFiles proves an unwritable lesson
// fails the write instead of landing half a repair.
func TestWriteUpdatesRefusesUnreadableFiles(t *testing.T) {
	root := t.TempDir()
	locked := filepath.Join(root, "locked.md")
	if err := os.WriteFile(locked, []byte("old\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(locked, 0o444); err != nil {
		t.Skip("cannot drop write permission")
	}
	defer func() { _ = os.Chmod(locked, 0o600) }()
	updates := map[string][]byte{"locked.md": []byte("new\n")}
	if err := content.WriteUpdates(root, updates); err == nil {
		t.Fatal("WriteUpdates overwrote a locked lesson, want an error")
	}
}

// TestWriteUpdatesRefusesCreation proves the rewrite repairs lessons only:
// it creates no files and leaves unknown lessons alone.
func TestWriteUpdatesRefusesCreation(t *testing.T) {
	root := t.TempDir()
	updates := map[string][]byte{"learning/lessons/missing.md": []byte("fresh\n")}
	if err := content.WriteUpdates(root, updates); err == nil {
		t.Fatal("WriteUpdates created a lesson, want an error")
	}
	if _, err := os.Stat(filepath.Join(root, "learning", "lessons", "missing.md")); !os.IsNotExist(err) {
		t.Fatalf("missing lesson exists after WriteUpdates: %v", err)
	}
}
