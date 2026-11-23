package cli_test

import (
	"bytes"
	"context"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// gapAfter fails every write after the first N, standing in for a reader
// that closes mid-report after the early lines.
type gapAfter struct {
	allow int
	used  int
}

func (w *gapAfter) Write(data []byte) (int, error) {
	if w.used >= w.allow {
		return 0, errClosedPipe
	}
	w.used++
	return len(data), nil
}

// TestUnitGapAffectedCourseRendersSelection requires a named fixture
// course to render its selection line as text and one JSON document.
func TestUnitGapAffectedCourseRendersSelection(t *testing.T) {
	stdout, _, status := invoke(t,
		[]string{"examples", "affected", "--course", "inert-course", "--content", fixtureCoursesRoot},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q)", status, stdout)
	}
	for _, want := range []string{"mode: affected", "course: inert-course"} {
		if !strings.Contains(stdout, want) {
			t.Fatalf("stdout missing %q (stdout=%q)", want, stdout)
		}
	}
	stdout, _, status = invoke(t,
		[]string{"examples", "affected", "--course", "inert-course", "--content", fixtureCoursesRoot, "--output", "json"},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, `"courses":["inert-course"]`) {
		t.Fatalf("stdout missing the courses payload (stdout=%q)", stdout)
	}
}

// TestUnitGapAffectedCoursePipesFailClosed requires a closed pipe on the
// selection lines to map to 141 in both modes.
func TestUnitGapAffectedCoursePipesFailClosed(t *testing.T) {
	var textErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "affected", "--course", "inert-course", "--content", fixtureCoursesRoot},
		cli.Options{Stdout: &gapAfter{allow: 1}, Stderr: &textErr}); status != 141 {
		t.Fatalf("status=%d, want 141 on the inert line (stderr=%q)", status, textErr.String())
	}
	var jsonErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "affected", "--course", "inert-course", "--content", fixtureCoursesRoot, "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonErr.String())
	}
}

// TestUnitGapCoverageInertReportsMissed requires the inert fixture course
// to render its missed counts as text and one JSON document.
func TestUnitGapCoverageInertReportsMissed(t *testing.T) {
	stdout, _, status := invoke(t,
		[]string{"examples", "coverage", "--course", "inert-course", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 1 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "inert-course: not covered") {
		t.Fatalf("stdout missing the missed line (stdout=%q)", stdout)
	}
	stdout, _, status = invoke(t,
		[]string{"examples", "coverage", "--course", "inert-course", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, `"schemaVersion":1`) {
		t.Fatalf("stdout missing the json body (stdout=%q)", stdout)
	}
}

// TestUnitGapCoverageUnknownCourseFailsClosed requires an unknown course
// to fail the coverage assessment naming the course.
func TestUnitGapCoverageUnknownCourseFailsClosed(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "coverage", "--course", "no-such-course-ayokoding", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status == 0 {
		t.Fatalf("status=%d, want a failure (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.") {
		t.Fatalf("stderr missing the coded failure (stderr=%q)", stderr)
	}
}

// TestUnitGapCoverageFindingsPipesFailClosed requires a closed pipe on
// the coverage findings to map to 141 in both modes.
func TestUnitGapCoverageFindingsPipesFailClosed(t *testing.T) {
	var textErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "coverage", "--course", "broken-sync", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--min-percent", "100"},
		cli.Options{Stdout: &gapAfter{allow: 2}, Stderr: &textErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in text mode (stderr=%q)", status, textErr.String())
	}
	var jsonErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "coverage", "--course", "broken-sync", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonErr.String())
	}
}

// TestUnitGapValidateUnknownCourseFailsClosed requires an unknown course
// to fail validation naming the course.
func TestUnitGapValidateUnknownCourseFailsClosed(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "validate", "--course", "no-such-course-ayokoding", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status == 0 {
		t.Fatalf("status=%d, want a failure (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.") {
		t.Fatalf("stderr missing the coded failure (stderr=%q)", stderr)
	}
}

// TestUnitGapListPipeFailsClosed requires a closed pipe on the toolchain
// list to map to 141.
func TestUnitGapListPipeFailsClosed(t *testing.T) {
	var stderr bytes.Buffer
	if status := cli.Execute(context.Background(), []string{"toolchains", "list"},
		cli.Options{Stdout: neverWriter{}, Stderr: &stderr}); status != 141 {
		t.Fatalf("status=%d, want 141 (stderr=%q)", status, stderr.String())
	}
}

// TestUnitGapCheckUnknownCourseFailsClosed requires an unknown course to
// fail the check with a coded error, and a closed pipe on the empty
// report to map to 141.
func TestUnitGapCheckUnknownCourseFailsClosed(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "check", "--course", "no-such-course-ayokoding", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status == 0 {
		t.Fatalf("status=%d, want a failure (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.") {
		t.Fatalf("stderr missing the coded failure (stderr=%q)", stderr)
	}
	var jsonErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "check", "--course", "no-such-course-ayokoding", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonErr.String())
	}
}

// TestUnitGapRunUnknownCourseFailsClosed requires an unknown course to
// fail the run with a coded error, and a closed pipe on the empty report
// to map to 141.
func TestUnitGapRunUnknownCourseFailsClosed(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "no-such-course-ayokoding", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status == 0 {
		t.Fatalf("status=%d, want a failure (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.") {
		t.Fatalf("stderr missing the coded failure (stderr=%q)", stderr)
	}
	var jsonErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "run", "--course", "no-such-course-ayokoding", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonErr.String())
	}
}

// TestUnitGapFailingRunPipesFailClosed requires a closed pipe on the
// canned failures to map to 141 in both modes.
func TestUnitGapFailingRunPipesFailClosed(t *testing.T) {
	var textErr bytes.Buffer
	if status := cli.Execute(context.Background(), []string{"examples", "check", "--course", "demo", "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &textErr, Fault: "failing-run"}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, textErr.String())
	}
	var jsonErr bytes.Buffer
	if status := cli.Execute(context.Background(), []string{"examples", "check", "--course", "demo"},
		cli.Options{Stdout: &failingWriter{}, Stderr: &jsonErr, Fault: "failing-run"}); status != 141 {
		t.Fatalf("status=%d, want 141 in text mode (stderr=%q)", status, jsonErr.String())
	}
}
