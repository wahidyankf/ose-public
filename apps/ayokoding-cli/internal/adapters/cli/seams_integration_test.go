//go:build integration

package cli_test

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// fakeContainerScript writes a shell script standing in for the
// container CLI: info answers rootless, pull fails closed, and every
// other call succeeds silently. Callers add behaviour through extra.
func fakeContainerScript(t *testing.T, extra string) string {
	t.Helper()
	dir := t.TempDir()
	log := filepath.Join(dir, "argv.log")
	script := filepath.Join(dir, "container-cli")
	body := "#!/bin/sh\necho \"$@\" >> '" + log + "'\n" +
		"if [ \"$1\" = info ]; then echo '{\"host\":{\"security\":{\"rootless\":true}}}'; exit 0; fi\n" +
		"if [ \"$1\" = pull ]; then echo fakecontainer: pull failed >&2; exit 1; fi\n" +
		extra
	if err := os.WriteFile(script, []byte(body), 0o700); err != nil {
		t.Fatalf("write fake container CLI: %v", err)
	}
	t.Setenv("AYOKODING_CONTAINER_CLI", script)
	return log
}

// copyDir copies a fixture tree into a writable directory.
func copyDir(t *testing.T, src, dst string) {
	t.Helper()
	entries, err := os.ReadDir(src)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(dst, 0o755); err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		from := filepath.Join(src, entry.Name())
		to := filepath.Join(dst, entry.Name())
		if entry.IsDir() {
			copyDir(t, from, to)
			continue
		}
		data, err := os.ReadFile(from)
		if err != nil {
			t.Fatal(err)
		}
		info, err := entry.Info()
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(to, data, info.Mode()); err != nil {
			t.Fatal(err)
		}
	}
}

// gitRepoWithCourses commits a writable copy of the fixture courses:
// the base revision, a program touch, a notes commit, and an inert
// touch on top. It returns the repo root, the courses dir, and the
// base, program-touch, and tip revisions.
func gitRepoWithCourses(t *testing.T) (repo, courses, baseRev, programRev, tipRev string) {
	t.Helper()
	if _, err := exec.LookPath("git"); err != nil {
		t.Fatal("git not on PATH")
	}
	repo = t.TempDir()
	gitEnv := func() []string {
		return append(os.Environ(),
			"GIT_CONFIG_NOSYSTEM=1",
			"GIT_CONFIG_GLOBAL=/dev/null",
			"GIT_AUTHOR_NAME=t", "GIT_AUTHOR_EMAIL=t@t",
			"GIT_COMMITTER_NAME=t", "GIT_COMMITTER_EMAIL=t@t",
		)
	}
	run := func(args ...string) string {
		t.Helper()
		cmd := exec.Command("git", args...)
		cmd.Dir = repo
		cmd.Env = gitEnv()
		out, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("git %q: %v (%s)", args, err, out)
		}
		return string(out)
	}
	run("init", "-q")
	courses = filepath.Join(repo, "courses")
	copyDir(t, fixtureCoursesRoot, courses)
	run("add", "courses")
	run("commit", "-qm", "courses")
	baseRev = strings.TrimSpace(run("rev-parse", "HEAD"))
	program := filepath.Join(courses, "green-python", "learning", "code", "ex-02-range", "lines.py")
	data, err := os.ReadFile(program)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(program, append(data, "# touched\n"...), 0o600); err != nil {
		t.Fatal(err)
	}
	run("add", "courses")
	run("commit", "-qm", "touch a course program")
	programRev = strings.TrimSpace(run("rev-parse", "HEAD"))
	if err := os.WriteFile(filepath.Join(repo, "notes.txt"), []byte("notes\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	run("add", "notes.txt")
	run("commit", "-qm", "notes")
	lesson := filepath.Join(courses, "inert-course", "learning", "lesson.md")
	if err := os.MkdirAll(filepath.Dir(lesson), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(lesson, []byte("# Notes\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	run("add", "courses")
	run("commit", "-qm", "touch an inert course")
	tipRev = strings.TrimSpace(run("rev-parse", "HEAD"))
	return repo, courses, baseRev, programRev, tipRev
}

// quietTree builds a content root with a single lesson-only course.
func quietTree(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	course := filepath.Join(root, "quiet-course", "learning")
	if err := os.MkdirAll(course, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(course, "lesson.md"), []byte("# Quiet\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	return root
}

// TestIntegrationAffectedSinceResolvesChanged requires --since to
// select exactly the courses changed since the revision, naming the
// changed non-opted-in course as inert.
func TestIntegrationAffectedSinceResolvesChanged(t *testing.T) {
	_, courses, baseRev, _, _ := gitRepoWithCourses(t)
	stdout, stderr, status := invoke(t,
		[]string{"examples", "affected", "--since", baseRev, "--content", courses},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	for _, want := range []string{"mode: affected", "course: green-python", "inert: inert-course"} {
		if !strings.Contains(stdout, want) {
			t.Fatalf("stdout missing %q (stdout=%q)", want, stdout)
		}
	}
	stdout, _, status = invoke(t,
		[]string{"examples", "affected", "--since", baseRev, "--content", courses, "--output", "json"},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, `"inert":["inert-course"]`) {
		t.Fatalf("stdout missing the inert payload (stdout=%q)", stdout)
	}
}

// TestIntegrationCheckSinceSkipsUnchangedCourses requires a revision
// with no course changes to report the validate and sync findings
// without running anything.
func TestIntegrationCheckSinceSkipsUnchangedCourses(t *testing.T) {
	_, courses, _, _, tipRev := gitRepoWithCourses(t)
	stdout, stderr, status := invoke(t,
		[]string{"examples", "check", "--since", tipRev, "--content", courses, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	if !strings.Contains(stdout, "failed") {
		t.Fatalf("stdout missing the finding lines (stdout=%q)", stdout)
	}
}

// TestIntegrationCheckSinceNamesInertCourses requires a revision that
// changed only a non-opted-in course to list it as inert.
func TestIntegrationCheckSinceNamesInertCourses(t *testing.T) {
	_, courses, _, programRev, _ := gitRepoWithCourses(t)
	stdout, stderr, status := invoke(t,
		[]string{"examples", "check", "--since", programRev, "--content", courses, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	if !strings.Contains(stdout, "inert: inert-course") {
		t.Fatalf("stdout missing the inert course (stdout=%q)", stdout)
	}
}

// TestIntegrationCheckInertTreeReportsNothingToRun requires a tree with
// no opted-in course to report the inert message and exit 0.
func TestIntegrationCheckInertTreeReportsNothingToRun(t *testing.T) {
	root := quietTree(t)
	stdout, stderr, status := invoke(t,
		[]string{"examples", "check", "--all", "--content", root, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	if !strings.Contains(stdout, "0 opted-in courses; nothing to run") {
		t.Fatalf("stdout missing the inert message (stdout=%q)", stdout)
	}
}

// TestIntegrationCoverageListsNotApplicable requires a course with no
// code to render the not-applicable line.
func TestIntegrationCoverageListsNotApplicable(t *testing.T) {
	root := quietTree(t)
	stdout, _, status := invoke(t,
		[]string{"examples", "coverage", "--course", "quiet-course", "--content", root, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 0 && status != 1 {
		t.Fatalf("status=%d, want 0 or 1 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "quiet-course: not applicable") {
		t.Fatalf("stdout missing the not-applicable line (stdout=%q)", stdout)
	}
}

// TestIntegrationSyncWritesRepairs requires --write to repair the stale
// fence of a writable copy while the other findings stay.
func TestIntegrationSyncWritesRepairs(t *testing.T) {
	root := t.TempDir()
	copyDir(t, fixtureCoursesRoot, root)
	before, _, _ := invoke(t,
		[]string{"examples", "sync", "--course", "broken-sync", "--content", root},
		cli.Options{})
	if !strings.Contains(before, "ayokoding.sync.mismatch") {
		t.Fatalf("before missing the stale fence (stdout=%q)", before)
	}
	stdout, stderr, status := invoke(t,
		[]string{"examples", "sync", "--course", "broken-sync", "--content", root, "--write"},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 with the remaining findings (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	after, _, _ := invoke(t,
		[]string{"examples", "sync", "--course", "broken-sync", "--content", root},
		cli.Options{})
	if strings.Contains(after, "ayokoding.sync.mismatch") {
		t.Fatalf("after keeps the repaired fence (stdout=%q)", after)
	}
	if !strings.Contains(after, "ayokoding.sync.missing-file") {
		t.Fatalf("after lost the unrepairable findings (stdout=%q)", after)
	}
}

// TestIntegrationRunWithoutRuntimeFailsClosed requires the run to
// refuse the failing container runtime with its code.
func TestIntegrationRunWithoutRuntimeFailsClosed(t *testing.T) {
	fakeContainerScript(t, "")
	stdout, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "green-python", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 125 {
		t.Fatalf("status=%d, want 125 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.env.container-runtime-unavailable") {
		t.Fatalf("stderr missing the refused runtime code (stderr=%q)", stderr)
	}
}

// TestIntegrationRunFindingsWithoutRuntime requires a course with no
// runnable units to report its missing specs without running.
func TestIntegrationRunFindingsWithoutRuntime(t *testing.T) {
	fakeContainerScript(t, "")
	stdout, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "inert-course", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	if !strings.Contains(stdout, "failed") {
		t.Fatalf("stdout missing the finding lines (stdout=%q)", stdout)
	}
	stdout, _, status = invoke(t,
		[]string{"examples", "run", "--course", "inert-course", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, `"code":"ayokoding.layout.missing-run-spec"`) {
		t.Fatalf("stdout missing the json findings (stdout=%q)", stdout)
	}
	var pipeErr bytes.Buffer
	status = cli.Execute(context.Background(),
		[]string{"examples", "run", "--course", "inert-course", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{Stdout: neverWriter{}, Stderr: &pipeErr})
	if status != 141 {
		t.Fatalf("status=%d, want 141 (stderr=%q)", status, pipeErr.String())
	}
	var jsonPipeErr bytes.Buffer
	status = cli.Execute(context.Background(),
		[]string{"examples", "run", "--course", "inert-course", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonPipeErr})
	if status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonPipeErr.String())
	}
}

// TestIntegrationCheckWithoutRuntimeRendersEmptyReport requires the
// check to render the empty report before failing the runtime closed.
func TestIntegrationCheckWithoutRuntimeRendersEmptyReport(t *testing.T) {
	fakeContainerScript(t, "")
	stdout, stderr, status := invoke(t,
		[]string{"examples", "check", "--course", "green-python", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 125 {
		t.Fatalf("status=%d, want 125 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	if !strings.Contains(stdout, "0 of 0 applicable courses covered") {
		t.Fatalf("stdout missing the empty coverage summary (stdout=%q)", stdout)
	}
	stdout, _, status = invoke(t,
		[]string{"examples", "check", "--course", "green-python", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{})
	if status != 125 {
		t.Fatalf("status=%d, want 125 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, `"schemaVersion":1`) {
		t.Fatalf("stdout missing the json body (stdout=%q)", stdout)
	}
}

// TestIntegrationAffectedRendersInertText requires the inert courses
// to render as text lines.
func TestIntegrationAffectedRendersInertText(t *testing.T) {
	_, courses, baseRev, _, _ := gitRepoWithCourses(t)
	stdout, stderr, status := invoke(t,
		[]string{"examples", "affected", "--since", baseRev, "--content", courses},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	if !strings.Contains(stdout, "inert: inert-course") {
		t.Fatalf("stdout missing the inert line (stdout=%q)", stdout)
	}
}

// TestIntegrationCheckRendersReportFailures requires a closed pipe
// mid-report to map to 141 for the finding lines and the summary.
func TestIntegrationCheckRendersReportFailures(t *testing.T) {
	_, courses, _, _, tipRev := gitRepoWithCourses(t)
	var findingsErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "check", "--since", tipRev, "--content", courses, "--catalog", fixtureCatalog},
		cli.Options{Stdout: &failingWriter{}, Stderr: &findingsErr}); status != 141 {
		t.Fatalf("status=%d, want 141 on the finding lines (stderr=%q)", status, findingsErr.String())
	}
	root := quietTree(t)
	var summaryErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "check", "--all", "--content", root, "--catalog", fixtureCatalog},
		cli.Options{Stdout: &failingWriter{}, Stderr: &summaryErr}); status != 141 {
		t.Fatalf("status=%d, want 141 on the summary (stderr=%q)", status, summaryErr.String())
	}
	var jsonErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "check", "--since", tipRev, "--content", courses, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonErr.String())
	}
	var inertErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "check", "--all", "--content", root, "--catalog", fixtureCatalog},
		cli.Options{Stdout: neverWriter{}, Stderr: &inertErr}); status != 141 {
		t.Fatalf("status=%d, want 141 on the inert message (stderr=%q)", status, inertErr.String())
	}
}

// TestIntegrationRunAppliesValidShard requires a well-formed shard to
// slice the run selection, failing closed at the runtime.
func TestIntegrationRunAppliesValidShard(t *testing.T) {
	fakeContainerScript(t, "")
	_, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "green-python", "--shard", "1/1", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 125 {
		t.Fatalf("status=%d, want 125 (stderr=%q)", status, stderr)
	}
}

// fakeContainerGreen writes a shell script whose run prints the given
// payload with exit 0, so recorded static runs pass deterministically.
func fakeContainerGreen(t *testing.T, payload string) {
	t.Helper()
	dir := t.TempDir()
	log := filepath.Join(dir, "argv.log")
	script := filepath.Join(dir, "container-cli")
	body := "#!/bin/sh\necho \"$@\" >> '" + log + "'\n" +
		"if [ \"$1\" = info ]; then echo '{\"host\":{\"security\":{\"rootless\":true}}}'; exit 0; fi\n" +
		"if [ \"$1\" = run ]; then printf '%s' '" + payload + "'; exit 0; fi\n" +
		"exit 0\n"
	if err := os.WriteFile(script, []byte(body), 0o700); err != nil {
		t.Fatalf("write fake container CLI: %v", err)
	}
	t.Setenv("AYOKODING_CONTAINER_CLI", script)
}

// recordStaticCourse copies the fixture tree and records the static
// run, returning the recorded tree.
func recordStaticCourse(t *testing.T) string {
	t.Helper()
	fakeContainerGreen(t, "static check placeholder\n")
	root := t.TempDir()
	copyDir(t, fixtureCoursesRoot, root)
	stdout, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "static-course", "--record", "--content", root, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 recording (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	return root
}

// TestIntegrationRunPassesRecordedStatic requires a recorded static run
// to pass green without containers.
func TestIntegrationRunPassesRecordedStatic(t *testing.T) {
	root := recordStaticCourse(t)
	fakeContainerGreen(t, "static check placeholder\n")
	stdout, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "static-course", "--content", root, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	if !strings.Contains(stdout, "passed (static)") {
		t.Fatalf("stdout missing the static pass label (stdout=%q)", stdout)
	}
}

// TestIntegrationCheckReportsRecordedStatic requires a recorded static
// check to report its green runs beside the sync findings.
func TestIntegrationCheckReportsRecordedStatic(t *testing.T) {
	root := recordStaticCourse(t)
	fakeContainerGreen(t, "static check placeholder\n")
	stdout, stderr, status := invoke(t,
		[]string{"examples", "check", "--course", "static-course", "--content", root, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 with the sync findings (stdout=%q stderr=%q)", status, stdout, stderr)
	}
	if !strings.Contains(stdout, "passed (static)") {
		t.Fatalf("stdout missing the static pass label (stdout=%q)", stdout)
	}
}

// TestIntegrationRunPassesLessonOnlyCourse requires a course with no
// units to pass without running anything.
func TestIntegrationRunPassesLessonOnlyCourse(t *testing.T) {
	fakeContainerScript(t, "")
	root := quietTree(t)
	stdout, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "quiet-course", "--content", root, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q stderr=%q)", status, stdout, stderr)
	}
}
