package integration_test

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/git"
)

// selectionRepo builds a git repository with two opted-in courses and one
// inert course, commits it, then changes alpha and gamma in a second
// commit. It returns the repository root and the base revision.
func selectionRepo(t *testing.T) (string, string) {
	t.Helper()
	root := t.TempDir()
	runGit(t, root, "init")
	runGit(t, root, "config", "user.email", "test@example.com")
	runGit(t, root, "config", "user.name", "Test")
	writeRepoFile(t, root, "courses/alpha/learning/code/ex-01-a/run.yaml", "schema: ayokoding.run/v1\n")
	writeRepoFile(t, root, "courses/alpha/learning/code/ex-01-a/main.py", "print(1)\n")
	writeRepoFile(t, root, "courses/beta/learning/code/ex-01-b/run.yaml", "schema: ayokoding.run/v1\n")
	writeRepoFile(t, root, "courses/beta/learning/code/ex-01-b/main.py", "print(1)\n")
	writeRepoFile(t, root, "courses/gamma/learning/lessons/g.md", "# G\n")
	runGit(t, root, "add", "-A")
	runGit(t, root, "commit", "-m", "base")
	base := strings.TrimSpace(gitOutput(t, root, "rev-parse", "HEAD"))
	writeRepoFile(t, root, "courses/alpha/learning/lessons/a.md", "# A\n")
	writeRepoFile(t, root, "courses/gamma/learning/lessons/g.md", "# G changed\n")
	runGit(t, root, "add", "-A")
	runGit(t, root, "commit", "-m", "change alpha and gamma")
	return root, base
}

// runGit runs one git command inside dir, failing the test on error.
func runGit(t *testing.T, dir string, args ...string) {
	t.Helper()
	cmd := exec.CommandContext(context.Background(), "git", args...)
	cmd.Dir = dir
	if output, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("git %q: %v\n%s", args, err, output)
	}
}

// gitOutput runs one git command inside dir and returns its output.
func gitOutput(t *testing.T, dir string, args ...string) string {
	t.Helper()
	cmd := exec.CommandContext(context.Background(), "git", args...)
	cmd.Dir = dir
	output, err := cmd.Output()
	if err != nil {
		t.Fatalf("git %q: %v", args, err)
	}
	return string(output)
}

// writeRepoFile writes one repository file, creating its parents.
func writeRepoFile(t *testing.T, root, name, body string) {
	t.Helper()
	route := filepath.Join(root, filepath.FromSlash(name))
	if err := os.MkdirAll(filepath.Dir(route), 0o700); err != nil {
		t.Fatalf("create repo dir: %v", err)
	}
	if err := os.WriteFile(route, []byte(body), 0o600); err != nil {
		t.Fatalf("write repo file: %v", err)
	}
}

// TestGitChangedFilesListsCommittedChanges requires the git adapter to
// list the repo-relative files changed between the base revision and
// HEAD.
func TestGitChangedFilesListsCommittedChanges(t *testing.T) {
	root, base := selectionRepo(t)
	files, err := git.ChangedFiles(context.Background(), root, base)
	if err != nil {
		t.Fatalf("ChangedFiles=%v, want nil", err)
	}
	for _, want := range []string{"courses/alpha/learning/lessons/a.md", "courses/gamma/learning/lessons/g.md"} {
		if !slices.Contains(files, want) {
			t.Fatalf("files=%q, want %q", files, want)
		}
	}
}

// TestGitChangedFilesIgnoresPoisonedEnv requires the git adapter to work
// with GIT_DIR pointing at a missing directory.
func TestGitChangedFilesIgnoresPoisonedEnv(t *testing.T) {
	root, base := selectionRepo(t)
	t.Setenv("GIT_DIR", filepath.Join(root, "no-such-dir"))
	files, err := git.ChangedFiles(context.Background(), root, base)
	if err != nil {
		t.Fatalf("ChangedFiles=%v, want nil with GIT_DIR poisoned", err)
	}
	if len(files) == 0 {
		t.Fatalf("files=%q, want the committed changes", files)
	}
}

// TestGitChangedFilesRejectsUnknownRev requires an unknown base revision
// to fail instead of selecting nothing.
func TestGitChangedFilesRejectsUnknownRev(t *testing.T) {
	root, _ := selectionRepo(t)
	if _, err := git.ChangedFiles(context.Background(), root, "no-such-revision"); err == nil {
		t.Fatalf("ChangedFiles=nil, want an error for an unknown revision")
	}
}

// affectedJSON is the machine-readable affected payload the plan job
// reads: the selection mode with the selected and inert courses.
type affectedJSON struct {
	SchemaVersion int      `json:"schemaVersion"`
	Mode          string   `json:"mode"`
	Courses       []string `json:"courses"`
	Inert         []string `json:"inert"`
}

// TestAffectedSelectsChangedOptedIn requires the affected command to
// report the affected mode with only the changed opted-in course
// selected and the changed inert course listed.
func TestAffectedSelectsChangedOptedIn(t *testing.T) {
	root, base := selectionRepo(t)
	binary := buildCLI(t)
	cmd := exec.CommandContext(context.Background(), binary,
		"examples", "affected", "--since", base,
		"--content", filepath.Join(root, "courses"), "--output", "json")
	cmd.Dir = root
	output, err := cmd.Output()
	if err != nil {
		t.Fatalf("affected: %v", err)
	}
	var document affectedJSON
	if err := json.Unmarshal(output, &document); err != nil {
		t.Fatalf("decode affected: %v (output=%q)", err, output)
	}
	if document.Mode != "affected" {
		t.Fatalf("mode=%q, want affected", document.Mode)
	}
	if !slices.Equal(document.Courses, []string{"alpha"}) {
		t.Fatalf("courses=%q, want exactly alpha", document.Courses)
	}
	if !slices.Equal(document.Inert, []string{"gamma"}) {
		t.Fatalf("inert=%q, want exactly gamma", document.Inert)
	}
}
