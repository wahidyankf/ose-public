package cli_test

import (
	"bytes"
	"context"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// missingCatalog points nowhere, so every loadCatalog failure below is
// deterministic without touching a real catalog file.
const missingCatalog = "../../../tests/testdata/no-such-catalog.yaml"

// invoke runs args in process with in-memory streams and returns the
// streams with the exit status.
func invoke(t *testing.T, args []string, opts cli.Options) (string, string, int) {
	t.Helper()
	var stdout, stderr bytes.Buffer
	if opts.Stdout == nil {
		opts.Stdout = &stdout
	}
	if opts.Stderr == nil {
		opts.Stderr = &stderr
	}
	status := cli.Execute(context.Background(), args, opts)
	return stdout.String(), stderr.String(), status
}

// TestBareSubcommandsNeedACommand requires a bare group to exit 2 naming
// the missing command.
func TestBareSubcommandsNeedACommand(t *testing.T) {
	for _, args := range [][]string{{"examples"}, {"toolchains"}} {
		t.Run(strings.Join(args, " "), func(t *testing.T) {
			stdout, stderr, status := invoke(t, args, cli.Options{})
			if status != 2 {
				t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout, stderr)
			}
			if !strings.Contains(stderr, "ayokoding.usage.missing-command") {
				t.Fatalf("stderr missing missing-command code (stderr=%q)", stderr)
			}
		})
	}
}

// TestRunAndCheckSelection requires exactly one of --course, --since, and
// --all on the run and check commands.
func TestRunAndCheckSelection(t *testing.T) {
	rows := []struct {
		name   string
		args   []string
		status int
		stderr []string
	}{
		{
			name:   "run without selection exits 2",
			args:   []string{"examples", "run"},
			status: 2,
			stderr: []string{"ayokoding.usage.missing-selection"},
		},
		{
			name:   "check without selection exits 2",
			args:   []string{"examples", "check"},
			status: 2,
			stderr: []string{"ayokoding.usage.missing-selection"},
		},
		{
			name:   "run with two selections exits 2",
			args:   []string{"examples", "run", "--course", "demo", "--all"},
			status: 2,
			stderr: []string{"ayokoding.usage.missing-selection"},
		},
		{
			name:   "check with course and since exits 2",
			args:   []string{"examples", "check", "--course", "demo", "--since", "main"},
			status: 2,
			stderr: []string{"ayokoding.usage.missing-selection"},
		},
		{
			name:   "affected without selection keeps its own usage error",
			args:   []string{"examples", "affected"},
			status: 2,
			stderr: []string{"ayokoding.usage.missing-selection"},
		},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			stdout, stderr, status := invoke(t, row.args, cli.Options{})
			if status != row.status {
				t.Fatalf("status=%d, want %d (stdout=%q stderr=%q)", status, row.status, stdout, stderr)
			}
			for _, want := range row.stderr {
				if !strings.Contains(stderr, want) {
					t.Fatalf("stderr missing %q (stderr=%q)", want, stderr)
				}
			}
		})
	}
}

// TestUnknownCourseFailsBeforeRuntime requires an unknown course to exit 2
// on every command that resolves it, before any container starts.
func TestUnknownCourseFailsBeforeRuntime(t *testing.T) {
	rows := []struct {
		name string
		args []string
	}{
		{
			name: "run reports the unknown course",
			args: []string{"examples", "run", "--course", "zeta", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		},
		{
			name: "check reports the unknown course",
			args: []string{"examples", "check", "--course", "zeta", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		},
		{
			name: "sync reports the unknown course",
			args: []string{"examples", "sync", "--course", "zeta", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		},
		{
			name: "coverage reports the unknown course",
			args: []string{"examples", "coverage", "--course", "zeta", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		},
		{
			name: "affected reports the unknown course",
			args: []string{"examples", "affected", "--course", "zeta", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		},
		{
			name: "run reports the unknown course as json",
			args: []string{"examples", "run", "--course", "zeta", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		},
		{
			name: "check reports the unknown course as json",
			args: []string{"examples", "check", "--course", "zeta", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			stdout, stderr, status := invoke(t, row.args, cli.Options{})
			if status != 2 {
				t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout, stderr)
			}
			if !strings.Contains(stderr, "ayokoding.usage.invalid-arguments") {
				t.Fatalf("stderr missing usage code (stderr=%q)", stderr)
			}
			if strings.Contains(stdout, "failed") {
				t.Fatalf("stdout must stay failure-free on usage errors (stdout=%q)", stdout)
			}
		})
	}
}

// TestMissingCatalogFile requires every command that loads the catalog to
// exit 2 when the catalog file does not exist.
func TestMissingCatalogFile(t *testing.T) {
	rows := []struct {
		name string
		args []string
	}{
		{
			name: "validate refuses the missing catalog",
			args: []string{"examples", "validate", "--course", "static-course", "--content", fixtureCoursesRoot, "--catalog", missingCatalog},
		},
		{
			name: "run refuses the missing catalog",
			args: []string{"examples", "run", "--course", "static-course", "--content", fixtureCoursesRoot, "--catalog", missingCatalog},
		},
		{
			name: "check refuses the missing catalog",
			args: []string{"examples", "check", "--course", "static-course", "--content", fixtureCoursesRoot, "--catalog", missingCatalog},
		},
		{
			name: "coverage refuses the missing catalog",
			args: []string{"examples", "coverage", "--course", "static-course", "--content", fixtureCoursesRoot, "--catalog", missingCatalog},
		},
		{
			name: "list refuses the missing catalog",
			args: []string{"toolchains", "list", "--catalog", missingCatalog},
		},
		{
			name: "build refuses the missing catalog",
			args: []string{"toolchains", "build", "python", "--catalog", missingCatalog},
		},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			stdout, stderr, status := invoke(t, row.args, cli.Options{})
			if status != 2 {
				t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout, stderr)
			}
			if !strings.Contains(stderr, "catalog") {
				t.Fatalf("stderr names no catalog failure (stderr=%q)", stderr)
			}
		})
	}
}

// TestSyncFixtureCourses requires the sync command to pass a synced course
// and to report every sync finding on a desynced one, reading only the
// committed fixtures.
func TestSyncFixtureCourses(t *testing.T) {
	rows := []struct {
		name   string
		args   []string
		status int
		stdout []string
	}{
		{
			name:   "synced course passes with empty output",
			args:   []string{"examples", "sync", "--course", "green-python", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
			status: 0,
		},
		{
			name:   "desynced course exits 1 naming every finding",
			args:   []string{"examples", "sync", "--course", "broken-sync", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
			status: 1,
			stdout: []string{"ayokoding.sync.mismatch", "ayokoding.sync.missing-file", "ayokoding.sync.unreferenced-unit"},
		},
		{
			name:   "desynced course reports findings as json",
			args:   []string{"examples", "sync", "--course", "broken-sync", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
			status: 1,
			stdout: []string{`"schemaVersion":1`, "ayokoding.sync.mismatch"},
		},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			stdout, stderr, status := invoke(t, row.args, cli.Options{})
			if status != row.status {
				t.Fatalf("status=%d, want %d (stdout=%q stderr=%q)", status, row.status, stdout, stderr)
			}
			for _, want := range row.stdout {
				if !strings.Contains(stdout, want) {
					t.Fatalf("stdout missing %q (stdout=%q)", want, stdout)
				}
			}
		})
	}
}

// TestVersionNamesTheCatalogStamp requires --version to name the pinned
// catalog stamp when the build carries one.
func TestVersionNamesTheCatalogStamp(t *testing.T) {
	stdout, _, status := invoke(t, []string{"--version"}, cli.Options{Version: "dev", Commit: "unknown", Catalog: "deadbeef"})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "ayokoding-cli dev (commit unknown, catalog deadbeef)") {
		t.Fatalf("version names no pinned catalog (stdout=%q)", stdout)
	}
}

// TestFaultFiresOnEveryCommand requires the test seam to fire before any
// real work on each command that carries it.
func TestFaultFiresOnEveryCommand(t *testing.T) {
	commands := [][]string{
		{"examples", "validate", "--course", "demo"},
		{"examples", "sync", "--course", "demo"},
		{"examples", "run", "--course", "demo"},
		{"examples", "check", "--course", "demo"},
		{"examples", "coverage", "--course", "demo"},
		{"examples", "affected", "--course", "demo"},
		{"toolchains", "list"},
		{"toolchains", "build", "python"},
	}
	for _, args := range commands {
		t.Run("failing-run on "+strings.Join(args, " "), func(t *testing.T) {
			stdout, stderr, status := invoke(t, args, cli.Options{Fault: "failing-run"})
			if status != 1 {
				t.Fatalf("status=%d, want 1 (stdout=%q stderr=%q)", status, stdout, stderr)
			}
			if !strings.Contains(stdout, "failed") {
				t.Fatalf("stdout labels no failed run (stdout=%q)", stdout)
			}
		})
	}
}

// TestFailingRunRendersJSON requires the canned failing runs to render one
// JSON document under --output json.
func TestFailingRunRendersJSON(t *testing.T) {
	stdout, _, status := invoke(t,
		[]string{"examples", "validate", "--course", "demo", "--output", "json"},
		cli.Options{Fault: "failing-run"})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q)", status, stdout)
	}
	for _, want := range []string{`"schemaVersion":1`, `"status":"failed"`, "demo/unit-one", "demo/unit-two"} {
		if !strings.Contains(stdout, want) {
			t.Fatalf("stdout missing %q (stdout=%q)", want, stdout)
		}
	}
}

// TestBrokenStdoutOnValidateMapsTo141 requires a writer failure mid-report
// to exit 141.
func TestBrokenStdoutOnValidateMapsTo141(t *testing.T) {
	broken := &failingWriter{}
	var stderr bytes.Buffer
	status := cli.Execute(context.Background(),
		[]string{"examples", "validate", "--course", "broken-layout", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{Stdout: broken, Stderr: &stderr})
	if status != 141 {
		t.Fatalf("status=%d, want 141 (stderr=%q)", status, stderr.String())
	}
}
