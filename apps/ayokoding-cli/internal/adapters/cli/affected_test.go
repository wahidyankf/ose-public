package cli_test

import (
	"bytes"
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// affectedPayload decodes the machine-readable selection.
type affectedPayload struct {
	SchemaVersion int      `json:"schemaVersion"`
	Mode          string   `json:"mode"`
	Courses       []string `json:"courses"`
	Inert         []string `json:"inert"`
}

// invokeAffected runs examples affected in process over the fixture
// courses and returns its streams with the status.
func invokeAffected(t *testing.T, args ...string) (string, string, int) {
	t.Helper()
	full := append([]string{"examples", "affected", "--content", fixtureCoursesRoot}, args...)
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), full, cli.Options{Stdout: &stdout, Stderr: &stderr})
	return stdout.String(), stderr.String(), status
}

// decodeAffected parses one affected JSON payload.
func decodeAffected(t *testing.T, body string) affectedPayload {
	t.Helper()
	var document affectedPayload
	if err := json.Unmarshal([]byte(body), &document); err != nil {
		t.Fatalf("decode affected: %v (stdout=%q)", err, body)
	}
	return document
}

// TestAffectedAllSelectsOptedIn requires --all to report full mode with
// the fixture opted-in courses.
func TestAffectedAllSelectsOptedIn(t *testing.T) {
	stdout, _, status := invokeAffected(t, "--all")
	if status != 0 {
		t.Fatalf("status=%d, want 0", status)
	}
	if !strings.Contains(stdout, "mode: full") {
		t.Fatalf("stdout missing full mode (stdout=%q)", stdout)
	}
	if !strings.Contains(stdout, "course: green-python") {
		t.Fatalf("stdout missing green-python (stdout=%q)", stdout)
	}
}

// TestAffectedAllJSONListsSortedCourses requires the JSON payload to
// carry the mode with the sorted selected courses.
func TestAffectedAllJSONListsSortedCourses(t *testing.T) {
	stdout, _, status := invokeAffected(t, "--all", "--output", "json")
	if status != 0 {
		t.Fatalf("status=%d, want 0", status)
	}
	document := decodeAffected(t, stdout)
	if document.SchemaVersion != 1 || document.Mode != "full" {
		t.Fatalf("document=%+v, want schema 1 in full mode", document)
	}
	if len(document.Courses) == 0 {
		t.Fatalf("courses=%q, want the opted-in courses", document.Courses)
	}
	for index := 1; index < len(document.Courses); index++ {
		if document.Courses[index-1] >= document.Courses[index] {
			t.Fatalf("courses=%q, want sorted order", document.Courses)
		}
	}
}

// TestAffectedNamedCourseSelectsSubset requires an explicit course to
// select exactly it in affected mode.
func TestAffectedNamedCourseSelectsSubset(t *testing.T) {
	stdout, _, status := invokeAffected(t, "--course", "green-python", "--output", "json")
	if status != 0 {
		t.Fatalf("status=%d, want 0", status)
	}
	document := decodeAffected(t, stdout)
	if document.Mode != "affected" {
		t.Fatalf("mode=%q, want affected", document.Mode)
	}
	if len(document.Courses) != 1 || document.Courses[0] != "green-python" {
		t.Fatalf("courses=%q, want exactly green-python", document.Courses)
	}
}

// TestAffectedShardsPartitionAll requires shards 1/2 and 2/2 to split
// the --all selection without overlap.
func TestAffectedShardsPartitionAll(t *testing.T) {
	full, _, status := invokeAffected(t, "--all", "--output", "json")
	if status != 0 {
		t.Fatalf("status=%d, want 0", status)
	}
	every := decodeAffected(t, full).Courses
	seen := map[string]bool{}
	for _, shard := range []string{"1/2", "2/2"} {
		part, _, status := invokeAffected(t, "--all", "--shard", shard, "--output", "json")
		if status != 0 {
			t.Fatalf("shard %s status=%d, want 0", shard, status)
		}
		for _, slug := range decodeAffected(t, part).Courses {
			if seen[slug] {
				t.Fatalf("slug %q in two shards", slug)
			}
			seen[slug] = true
		}
	}
	if len(seen) != len(every) {
		t.Fatalf("shards cover %d courses, want %d", len(seen), len(every))
	}
}

// TestAffectedMissingSelectionIsUsageError requires no selection flag to
// exit 2 naming the missing selection.
func TestAffectedMissingSelectionIsUsageError(t *testing.T) {
	_, stderr, status := invokeAffected(t)
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
	if !strings.Contains(stderr, "ayokoding.usage.missing-selection") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr)
	}
}

// TestAffectedInvalidShardIsUsageError requires a malformed shard to
// exit 2.
func TestAffectedInvalidShardIsUsageError(t *testing.T) {
	_, stderr, status := invokeAffected(t, "--all", "--shard", "bogus")
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
	if !strings.Contains(stderr, "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr)
	}
}

// TestAffectedUnknownCourseIsUsageError requires a named course that does
// not exist to exit 2.
func TestAffectedUnknownCourseIsUsageError(t *testing.T) {
	_, stderr, status := invokeAffected(t, "--course", "zeta")
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
	if !strings.Contains(stderr, "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr)
	}
}

// TestCheckInvalidShardSkipsRuntime requires a malformed check shard to
// exit 2 before any container starts.
func TestCheckInvalidShardSkipsRuntime(t *testing.T) {
	args := []string{"examples", "check", "--all", "--shard", "bogus", "--content", fixtureCoursesRoot}
	var stdout, stderr bytes.Buffer
	status := cli.Execute(context.Background(), args, cli.Options{Stdout: &stdout, Stderr: &stderr})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout.String(), stderr.String())
	}
	if !strings.Contains(stderr.String(), "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing usage code (stderr=%q)", stderr.String())
	}
}
