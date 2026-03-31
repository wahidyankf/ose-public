package envbackup

import (
	"os"
	"path/filepath"
	"testing"
)

func TestRestore_BasicRestore(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	// Populate backup dir.
	writeFile(t, filepath.Join(bkup, ".env"), "KEY=value")

	result, err := Restore(Options{RepoRoot: repo, BackupDir: bkup})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Direction != "restore" {
		t.Errorf("Direction: got %q, want %q", result.Direction, "restore")
	}
	if result.Copied != 1 {
		t.Errorf("Copied: got %d, want %d", result.Copied, 1)
	}

	dst := filepath.Join(repo, ".env")
	if _, err := os.Stat(dst); err != nil {
		t.Errorf("restored file not found at %s: %v", dst, err)
	}
}

func TestRestore_DirCreation(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	// Backup has nested structure; repo has no subdirs yet.
	writeFile(t, filepath.Join(bkup, "apps", "web", ".env.local"), "WEB=1")
	writeFile(t, filepath.Join(bkup, "apps", "api", ".env"), "API=1")

	result, err := Restore(Options{RepoRoot: repo, BackupDir: bkup})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Copied != 2 {
		t.Errorf("Copied: got %d, want 2", result.Copied)
	}

	// Verify directories were created.
	for _, rel := range []string{filepath.Join("apps", "web", ".env.local"), filepath.Join("apps", "api", ".env")} {
		if _, err := os.Stat(filepath.Join(repo, rel)); err != nil {
			t.Errorf("expected restored file at %s: %v", rel, err)
		}
	}
}

func TestRestore_PermissionsPreserved(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	src := filepath.Join(bkup, ".env")
	writeFile(t, src, "SECRET=xyz")
	if err := os.Chmod(src, 0o600); err != nil {
		t.Fatalf("chmod: %v", err)
	}

	if _, err := Restore(Options{RepoRoot: repo, BackupDir: bkup}); err != nil {
		t.Fatalf("Restore error: %v", err)
	}

	fi, err := os.Stat(filepath.Join(repo, ".env"))
	if err != nil {
		t.Fatalf("stat dst: %v", err)
	}
	if fi.Mode().Perm() != 0o600 {
		t.Errorf("permission: got %o, want %o", fi.Mode().Perm(), 0o600)
	}
}

func TestRestore_OverwritesExisting(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "NEW=2")
	writeFile(t, filepath.Join(repo, ".env"), "OLD=1")

	if _, err := Restore(Options{RepoRoot: repo, BackupDir: bkup}); err != nil {
		t.Fatalf("Restore error: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(repo, ".env"))
	if err != nil {
		t.Fatalf("read dst: %v", err)
	}
	if string(got) != "NEW=2" {
		t.Errorf("expected overwrite; got %q", string(got))
	}
}

func TestRestore_MissingDirError(t *testing.T) {
	tmp := t.TempDir()
	nonExistent := filepath.Join(tmp, "does-not-exist")
	repo := makeDir(t, tmp, "repo")

	_, err := Restore(Options{RepoRoot: repo, BackupDir: nonExistent})
	if err == nil {
		t.Error("expected error for missing backup dir")
	}
}

func TestRestore_NonEnvFilesFiltered(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "KEY=1")
	// These should NOT be restored.
	writeFile(t, filepath.Join(bkup, "README.md"), "# readme")
	writeFile(t, filepath.Join(bkup, "config.yaml"), "key: val")

	result, err := Restore(Options{RepoRoot: repo, BackupDir: bkup})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Copied != 1 {
		t.Errorf("Copied: got %d, want 1 (only .env should be restored)", result.Copied)
	}

	// Confirm non-.env files were NOT restored.
	for _, f := range []string{"README.md", "config.yaml"} {
		if _, err := os.Stat(filepath.Join(repo, f)); !os.IsNotExist(err) {
			t.Errorf("non-.env file %s should not be restored", f)
		}
	}
}

func TestRestore_WorktreeAware(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	// Files are under backup/myrepo/ when worktree-aware.
	writeFile(t, filepath.Join(bkup, "myrepo", ".env"), "KEY=1")

	result, err := Restore(Options{
		RepoRoot:      repo,
		BackupDir:     bkup,
		WorktreeAware: true,
		WorktreeName:  "myrepo",
	})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Copied != 1 {
		t.Errorf("Copied: got %d, want 1", result.Copied)
	}

	dst := filepath.Join(repo, ".env")
	if _, err := os.Stat(dst); err != nil {
		t.Errorf("expected restored file at %s: %v", dst, err)
	}
}

func TestRestore_ZeroFiles(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")
	// Empty backup dir.

	result, err := Restore(Options{RepoRoot: repo, BackupDir: bkup})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Copied != 0 {
		t.Errorf("Copied: got %d, want 0", result.Copied)
	}
}

func TestRestore_SkippedSymlinkCounted(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	// Write a real file and a symlink in the backup dir.
	realFile := filepath.Join(bkup, ".env.real")
	writeFile(t, realFile, "REAL=1")

	linkPath := filepath.Join(bkup, ".env")
	if err := os.Symlink(realFile, linkPath); err != nil {
		t.Skip("symlinks not supported on this platform")
	}

	result, err := Restore(Options{RepoRoot: repo, BackupDir: bkup})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	// .env.real is a regular file (discovered and copied), .env is a symlink (skipped).
	if result.Skipped != 1 {
		t.Errorf("Skipped: got %d, want 1", result.Skipped)
	}
}

func TestRestore_ContentIntegrity(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	content := "DATABASE_URL=postgres://user:pass@localhost/db\n"
	writeFile(t, filepath.Join(bkup, ".env"), content)

	if _, err := Restore(Options{RepoRoot: repo, BackupDir: bkup}); err != nil {
		t.Fatalf("Restore error: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(repo, ".env"))
	if err != nil {
		t.Fatalf("read restored file: %v", err)
	}
	if string(got) != content {
		t.Errorf("content mismatch:\ngot:  %q\nwant: %q", string(got), content)
	}
}

func TestRestore_CopyErrorRecorded(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "KEY=1")

	// Make the destination .env a directory so copyFile will fail.
	dstDir := filepath.Join(repo, ".env")
	if err := os.MkdirAll(dstDir, 0o755); err != nil {
		t.Fatalf("mkdir dst as dir: %v", err)
	}

	result, err := Restore(Options{RepoRoot: repo, BackupDir: bkup})
	if err != nil {
		t.Fatalf("Restore should not return top-level error for copy failure: %v", err)
	}
	if result.Skipped != 1 {
		t.Errorf("Skipped: got %d, want 1 (copy error should increment Skipped)", result.Skipped)
	}
	if len(result.Errors) == 0 {
		t.Error("expected non-fatal error recorded in result.Errors")
	}
}

func TestRestore_WorktreeAwareEmptyName(t *testing.T) {
	// WorktreeAware=true but WorktreeName="" — should look in bkup directly.
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "KEY=1")

	result, err := Restore(Options{
		RepoRoot:      repo,
		BackupDir:     bkup,
		WorktreeAware: true,
		WorktreeName:  "",
	})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Copied != 1 {
		t.Errorf("Copied: got %d, want 1", result.Copied)
	}
}

func TestRestore_NoExistingSkipsConfirmation(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "KEY=1")
	// No pre-existing files in repo.

	confirmCalled := false
	result, err := Restore(Options{
		RepoRoot:  repo,
		BackupDir: bkup,
		ConfirmFn: func(_ []string) bool { confirmCalled = true; return false },
	})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if confirmCalled {
		t.Error("ConfirmFn should not be called when no existing files")
	}
	if result.Copied != 1 {
		t.Errorf("Copied: got %d, want 1", result.Copied)
	}
}

func TestRestore_ForceOverwritesWithoutConfirmFn(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "NEW=2")
	writeFile(t, filepath.Join(repo, ".env"), "OLD=1") // pre-existing

	confirmCalled := false
	result, err := Restore(Options{
		RepoRoot:  repo,
		BackupDir: bkup,
		Force:     true,
		ConfirmFn: func(_ []string) bool { confirmCalled = true; return false },
	})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if confirmCalled {
		t.Error("ConfirmFn should not be called when Force=true")
	}
	if result.Copied != 1 {
		t.Errorf("Copied: got %d, want 1", result.Copied)
	}
}

func TestRestore_ConfirmFnReturningTrueProceeds(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "NEW=2")
	writeFile(t, filepath.Join(repo, ".env"), "OLD=1")

	result, err := Restore(Options{
		RepoRoot:  repo,
		BackupDir: bkup,
		ConfirmFn: func(_ []string) bool { return true },
	})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Cancelled {
		t.Error("expected Cancelled=false when ConfirmFn returns true")
	}
	if result.Copied != 1 {
		t.Errorf("Copied: got %d, want 1", result.Copied)
	}
}

func TestRestore_ConfirmFnReturningFalseCancels(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "NEW=2")
	writeFile(t, filepath.Join(repo, ".env"), "OLD=1")

	result, err := Restore(Options{
		RepoRoot:  repo,
		BackupDir: bkup,
		ConfirmFn: func(_ []string) bool { return false },
	})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if !result.Cancelled {
		t.Error("expected Cancelled=true when ConfirmFn returns false")
	}
}

func TestRestore_IncludeConfigTrue(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "KEY=1")
	writeFile(t, filepath.Join(bkup, ".claude", "settings.local.json"), `{"key":"val"}`)

	result, err := Restore(Options{
		RepoRoot:      repo,
		BackupDir:     bkup,
		Force:         true,
		IncludeConfig: true,
	})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Copied != 2 {
		t.Errorf("Copied: got %d, want 2", result.Copied)
	}

	// Verify config file is in repo.
	configDst := filepath.Join(repo, ".claude", "settings.local.json")
	if _, err := os.Stat(configDst); err != nil {
		t.Errorf("expected config file at %s: %v", configDst, err)
	}
}

func TestRestore_IncludeConfigFalse(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "KEY=1")
	writeFile(t, filepath.Join(bkup, ".claude", "settings.local.json"), `{"key":"val"}`)

	result, err := Restore(Options{
		RepoRoot:      repo,
		BackupDir:     bkup,
		Force:         true,
		IncludeConfig: false,
	})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Copied != 1 {
		t.Errorf("Copied: got %d, want 1 (.env only)", result.Copied)
	}

	// Config file should NOT be in repo.
	configDst := filepath.Join(repo, ".claude", "settings.local.json")
	if _, err := os.Stat(configDst); !os.IsNotExist(err) {
		t.Error("config file should not be restored when IncludeConfig=false")
	}
}

func TestRestore_DefaultMaxSizeApplied(t *testing.T) {
	tmp := t.TempDir()
	bkup := makeDir(t, tmp, "backup")
	repo := makeDir(t, tmp, "repo")

	writeFile(t, filepath.Join(bkup, ".env"), "KEY=val")

	// Pass MaxSize=0 — Restore should use DefaultMaxSize.
	result, err := Restore(Options{RepoRoot: repo, BackupDir: bkup, MaxSize: 0})
	if err != nil {
		t.Fatalf("Restore error: %v", err)
	}
	if result.Copied != 1 {
		t.Errorf("Copied: got %d, want 1", result.Copied)
	}
}
