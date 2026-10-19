package cli_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// TestSyncCleanCoursePasses requires a synced course to exit 0 with empty
// output.
func TestSyncCleanCoursePasses(t *testing.T) {
	args := []string{"examples", "sync", "--course", "green-python", "--content", fixtureCoursesRoot}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if strings.TrimSpace(stdout.String()) != "" {
		t.Fatalf("stdout not empty (stdout=%q)", stdout.String())
	}
}

// TestSyncBrokenCourseReportsFindings requires a desynced course to exit 1
// naming every finding code.
func TestSyncBrokenCourseReportsFindings(t *testing.T) {
	args := []string{"examples", "sync", "--course", "broken-sync", "--content", fixtureCoursesRoot}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	for _, want := range []string{
		"ayokoding.sync.mismatch",
		"ayokoding.sync.missing-file",
		"ayokoding.sync.unreferenced-unit",
		"learning/lessons/sync.md",
	} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout missing %q (stdout=%q)", want, stdout.String())
		}
	}
}

// TestSyncUnknownCourseIsUsageError requires a named course that does not
// exist to exit 2.
func TestSyncUnknownCourseIsUsageError(t *testing.T) {
	args := []string{"examples", "sync", "--course", "zeta", "--content", fixtureCoursesRoot}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !strings.Contains(stderr.String(), "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr.String())
	}
}

// TestSyncMissingContentIsUsageError requires a content directory that does
// not exist to exit 2.
func TestSyncMissingContentIsUsageError(t *testing.T) {
	args := []string{"examples", "sync", "--course", "green-python", "--content", filepath.Join(fixtureCoursesRoot, "no-such-root")}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
}

// TestSyncJSONFindingsShape requires the JSON payload to carry the finding
// shape code, course, path, line, and message.
func TestSyncJSONFindingsShape(t *testing.T) {
	args := []string{
		"examples", "sync", "--course", "broken-sync",
		"--content", fixtureCoursesRoot, "--output", "json",
	}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	var body findingsDocument
	if err := json.Unmarshal(bytes.TrimSpace(stdout.Bytes()), &body); err != nil {
		t.Fatalf("stdout is not one JSON document: %v (stdout=%q)", err, stdout.String())
	}
	if body.SchemaVersion != 1 || len(body.Findings) == 0 {
		t.Fatalf("body=%+v, want versioned findings", body)
	}
}

// copyCourse copies one fixture course into a temporary courses root, so
// --write tests never touch committed fixtures.
func copyCourse(t *testing.T, course string) string {
	t.Helper()
	root := t.TempDir()
	if err := copyCourseDir(filepath.Join(fixtureCoursesRoot, course), filepath.Join(root, course)); err != nil {
		t.Fatalf("copy course %s: %v", course, err)
	}
	return root
}

// copyCourseDir copies a directory tree of regular files.
func copyCourseDir(source, destination string) error {
	entries, err := os.ReadDir(source)
	if err != nil {
		return fmt.Errorf("cli test: read fixture dir %q: %w", source, err)
	}
	if err := os.MkdirAll(destination, 0o700); err != nil {
		return fmt.Errorf("cli test: create temp dir %q: %w", destination, err)
	}
	for _, entry := range entries {
		from := filepath.Join(source, entry.Name())
		target := filepath.Join(destination, entry.Name())
		if entry.IsDir() {
			if err := copyCourseDir(from, target); err != nil {
				return err
			}
			continue
		}
		body, err := os.ReadFile(from)
		if err != nil {
			return fmt.Errorf("cli test: read fixture file %q: %w", from, err)
		}
		//nolint:gosec // the copied names come from the committed fixture tree, never from test input.
		if err := os.WriteFile(target, body, 0o600); err != nil {
			return fmt.Errorf("cli test: write temp file %q: %w", target, err)
		}
	}
	return nil
}

// TestSyncWriteRepairsStaleFences requires --write to copy file bytes into
// stale fences and exit 0 once the course is clean.
func TestSyncWriteRepairsStaleFences(t *testing.T) {
	root := copyCourse(t, "green-python")
	lesson := filepath.Join(root, "green-python", "learning", "lessons", "hello.md")
	body, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read lesson: %v", err)
	}
	corrupted := strings.Replace(string(body), "print(\"middle\")", "print(\"stale\")", 1)
	if corrupted == string(body) {
		t.Fatal("fixture lesson carries no middle line to corrupt")
	}
	//nolint:gosec // the test rewrites a fixture copy below its own temp dir.
	if err := os.WriteFile(lesson, []byte(corrupted), 0o600); err != nil {
		t.Fatalf("corrupt lesson: %v", err)
	}
	args := []string{"examples", "sync", "--course", "green-python", "--content", root, "--write"}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	repaired, err := os.ReadFile(lesson)
	if err != nil {
		t.Fatalf("read repaired lesson: %v", err)
	}
	if string(repaired) != string(body) {
		t.Fatalf("lesson not repaired:\n%s\n%s", body, repaired)
	}
}
