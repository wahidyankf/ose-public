//go:build integration

package application_test

import (
	"context"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
)

// missingSpecCourse carries one unit without any expected file.
func missingSpecCourse() fstest.MapFS {
	return runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":   validRunSpec,
		"demo/learning/code/ex-01-hello/example.py": "print('hello')\n",
	})
}

// materializeCourse writes an in-memory course tree to a real
// directory so recorded files land beside their sources.
func materializeCourse(t *testing.T, content fstest.MapFS, dir string) {
	t.Helper()
	for name, file := range content {
		if file.Mode.IsDir() || !file.Mode.IsRegular() {
			continue
		}
		target := filepath.Join(dir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(target, file.Data, 0o600); err != nil {
			t.Fatal(err)
		}
	}
}

// TestIntegrationRunRecordsMissingExpectation requires --record to
// write the missing expected file, and a second run to pass green.
func TestIntegrationRunRecordsMissingExpectation(t *testing.T) {
	dir := t.TempDir()
	materializeCourse(t, missingSpecCourse(), dir)
	req := baseRunRequest(missingSpecCourse(), okStub())
	req.Record = true
	req.ContentDir = dir
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	recorded := false
	for _, found := range report.Findings {
		if strings.Contains(found.Message, "re-run to verify") {
			recorded = true
		}
	}
	if !recorded {
		t.Fatalf("findings=%v, want the recorded notice", report.Findings)
	}
	green, err := application.Run(context.Background(), baseRunRequest(os.DirFS(dir), okStub()))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(green.Passed) != 1 {
		t.Fatalf("passed=%v, want the green run", green.Passed)
	}
}

// TestIntegrationRunFailsDirectoryTarget requires a directory at the
// expected path to fail the record.
func TestIntegrationRunFailsDirectoryTarget(t *testing.T) {
	dir := t.TempDir()
	req := baseRunRequest(missingSpecCourse(), okStub())
	req.Record = true
	req.ContentDir = dir
	target := filepath.Join(dir, "demo", "learning", "code", "ex-01-hello", "expected", "main.stdout.txt")
	if err := os.MkdirAll(target, 0o755); err != nil {
		t.Fatal(err)
	}
	_, err := application.Run(context.Background(), req)
	if err == nil || !strings.Contains(err.Error(), "record expected file") {
		t.Fatalf("Run=%v, want the record failure", err)
	}
}

// loopedCourse materializes a course whose expected file is a symlink
// loop: the working copy skips non-regular files, so the expectation
// read fails instead of reporting a missing file.
func loopedCourse(t *testing.T) (fs.FS, string) {
	t.Helper()
	dir := t.TempDir()
	unit := filepath.Join(dir, "demo", "learning", "code", "ex-01-hello")
	if err := os.MkdirAll(filepath.Join(unit, "expected"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(unit, "run.yaml"), []byte(validRunSpec), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(unit, "example.py"), []byte("print('hello')\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	loop := filepath.Join(unit, "expected", "main.stdout.txt")
	if err := os.Symlink("main.stdout.txt", loop); err != nil {
		t.Skip("cannot create symlinks")
	}
	return os.DirFS(dir), dir
}

// TestIntegrationRunFailsUnreadableExpectations requires symlink loops
// to fail the stdout and stderr expectation reads.
func TestIntegrationRunFailsUnreadableExpectations(t *testing.T) {
	content, _ := loopedCourse(t)
	req := baseRunRequest(content, okStub())
	_, err := application.Run(context.Background(), req)
	if err == nil || !strings.Contains(err.Error(), "main.stdout.txt") {
		t.Fatalf("Run=%v, want the expected file failure", err)
	}
	spec := strings.Replace(validRunSpec,
		"      stdout: expected/main.stdout.txt",
		"      stdout: expected/main.stdout.txt\n      stderr: expected/main.stderr.txt", 1)
	stderrDir := t.TempDir()
	stderrUnit := filepath.Join(stderrDir, "demo", "learning", "code", "ex-01-hello", "expected")
	stderrCourse := filepath.Join(stderrDir, "demo", "learning", "code", "ex-01-hello")
	if err := os.MkdirAll(stderrUnit, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stderrCourse, "run.yaml"), []byte(spec), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stderrCourse, "example.py"), []byte("print('hello')\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stderrUnit, "main.stdout.txt"), []byte("hello\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("main.stderr.txt", filepath.Join(stderrUnit, "main.stderr.txt")); err != nil {
		t.Skip("cannot create symlinks")
	}
	stderrReq := baseRunRequest(os.DirFS(stderrDir), okStub())
	_, stderrErr := application.Run(context.Background(), stderrReq)
	if stderrErr == nil || !strings.Contains(stderrErr.Error(), "main.stderr.txt") {
		t.Fatalf("Run=%v, want the stderr expectation failure", stderrErr)
	}
}

// TestIntegrationRunFailsWorkingCopyCreation requires an unwritable
// temporary directory to fail the run closed.
func TestIntegrationRunFailsWorkingCopyCreation(t *testing.T) {
	t.Setenv("TMPDIR", "/proc/no-such-tmp-ayokoding")
	req := baseRunRequest(helloCourse(), okStub())
	_, err := application.Run(context.Background(), req)
	if err == nil || !strings.Contains(err.Error(), "create working copy") {
		t.Fatalf("Run=%v, want the working copy failure", err)
	}
}
