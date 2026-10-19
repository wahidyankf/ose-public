package cli_test

import (
	"bytes"
	"context"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// TestCheckUnknownCourseIsUsageError requires a named course that does not
// exist to exit 2 before any container starts.
func TestCheckUnknownCourseIsUsageError(t *testing.T) {
	args := []string{"examples", "check", "--course", "zeta", "--content", fixtureCoursesRoot}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !strings.Contains(stderr.String(), "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr.String())
	}
}

// TestCheckMissingSelectionIsUsageError requires a check with no selection
// to exit 2 naming the missing selection.
func TestCheckMissingSelectionIsUsageError(t *testing.T) {
	args := []string{"examples", "check", "--content", fixtureCoursesRoot}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !strings.Contains(stderr.String(), "ayokoding.usage.missing-selection") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr.String())
	}
}

// TestCheckMissingContentIsUsageError requires a content directory that
// does not exist to exit 2.
func TestCheckMissingContentIsUsageError(t *testing.T) {
	args := []string{"examples", "check", "--course", "green-python", "--content", filepath.Join(fixtureCoursesRoot, "no-such-root")}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
}
