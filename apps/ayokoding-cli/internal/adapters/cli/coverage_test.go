package cli_test

import (
	"bytes"
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// coverageCoursePayload decodes one machine-readable covered course.
type coverageCoursePayload struct {
	Course             string `json:"course"`
	Applicable         bool   `json:"applicable"`
	Units              int    `json:"units"`
	CoveredUnits       int    `json:"coveredUnits"`
	Covered            bool   `json:"covered"`
	IllustrationFences int    `json:"illustrationFences"`
	StaticUnits        int    `json:"staticUnits"`
}

// coveragePayload decodes the machine-readable coverage report.
type coveragePayload struct {
	SchemaVersion int                     `json:"schemaVersion"`
	Courses       []coverageCoursePayload `json:"courses"`
	Applicable    int                     `json:"applicable"`
	Covered       int                     `json:"covered"`
	Percent       int                     `json:"percent"`
}

// invokeCoverage runs examples coverage in process over the fixture
// courses and returns its streams with the status.
func invokeCoverage(t *testing.T, args ...string) (string, string, int) {
	t.Helper()
	full := append([]string{"examples", "coverage", "--content", fixtureCoursesRoot}, args...)
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), full, cli.Options{Stdout: &stdout, Stderr: &stderr})
	return stdout.String(), stderr.String(), status
}

// TestCoverageNamedCourseReportsCounts requires the green fixture course
// to report its counts with the covered percentage.
func TestCoverageNamedCourseReportsCounts(t *testing.T) {
	stdout, _, status := invokeCoverage(t, "--course", "green-python")
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "green-python") {
		t.Fatalf("stdout missing green-python (stdout=%q)", stdout)
	}
	if !strings.Contains(stdout, "applicable courses covered") {
		t.Fatalf("stdout missing the summary (stdout=%q)", stdout)
	}
}

// TestCoverageJSONCarriesCourseCounts requires the JSON payload to carry
// every per-course count with the totals.
func TestCoverageJSONCarriesCourseCounts(t *testing.T) {
	stdout, _, status := invokeCoverage(t, "--course", "green-python", "--output", "json")
	if status != 0 {
		t.Fatalf("status=%d, want 0", status)
	}
	var document coveragePayload
	if err := json.Unmarshal([]byte(stdout), &document); err != nil {
		t.Fatalf("decode coverage: %v (stdout=%q)", err, stdout)
	}
	if document.SchemaVersion != 1 {
		t.Fatalf("schema=%d, want 1", document.SchemaVersion)
	}
	if len(document.Courses) != 1 || document.Courses[0].Course != "green-python" {
		t.Fatalf("courses=%+v, want green-python", document.Courses)
	}
	if document.Applicable != 1 {
		t.Fatalf("applicable=%d, want 1", document.Applicable)
	}
}

// TestCoverageBelowMinimumExitsOne requires a minimum above the measured
// percentage to exit 1 naming the below-minimum code.
func TestCoverageBelowMinimumExitsOne(t *testing.T) {
	stdout, _, status := invokeCoverage(t, "--course", "green-python", "--min-percent", "101")
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "ayokoding.coverage.below-minimum") {
		t.Fatalf("stdout missing below-minimum (stdout=%q)", stdout)
	}
}

// TestCoverageUnknownCourseIsUsageError requires a named course that does
// not exist to exit 2.
func TestCoverageUnknownCourseIsUsageError(t *testing.T) {
	_, stderr, status := invokeCoverage(t, "--course", "zeta")
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
	if !strings.Contains(stderr, "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr)
	}
}
