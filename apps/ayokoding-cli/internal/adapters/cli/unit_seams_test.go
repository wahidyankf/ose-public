package cli_test

import (
	"bytes"
	"context"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// neverWriter fails every write, standing in for a standard output
// that closes before the first byte.
type neverWriter struct{}

func (neverWriter) Write([]byte) (int, error) { return 0, errClosedPipe }

// TestExecuteCoversProcessEdges requires a nil standard output to
// discard, and a cancelled context to run the interrupt hook with 130.
func TestExecuteCoversProcessEdges(t *testing.T) {
	var discarded bytes.Buffer
	status := cli.Execute(context.Background(), []string{"--help"}, cli.Options{Stderr: &discarded})
	if status != 0 {
		t.Fatalf("status=%d, want 0", status)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	called := false
	var stdout, stderr bytes.Buffer
	status = cli.Execute(ctx, []string{"--version"}, cli.Options{
		Stdout:      &stdout,
		Stderr:      &stderr,
		Version:     "dev",
		OnInterrupt: func() { called = true },
	})
	if status != 130 {
		t.Fatalf("status=%d, want 130", status)
	}
	if !called {
		t.Fatal("OnInterrupt not called on the cancelled context")
	}
}

// TestOutputModeSpellings requires every --output spelling to select
// its mode without touching the outcome.
func TestOutputModeSpellings(t *testing.T) {
	rows := []struct {
		name string
		args []string
		json bool
	}{
		{name: "yaml value stays text", args: []string{"examples", "validate", "--course", "zeta", "--content", fixtureCoursesRoot, "--output", "yaml"}},
		{name: "joined yaml stays text", args: []string{"examples", "validate", "--course", "zeta", "--content", fixtureCoursesRoot, "--output=yaml"}},
		{name: "joined json selects json", args: []string{"examples", "validate", "--course", "zeta", "--content", fixtureCoursesRoot, "--output=json"}, json: true},
		{name: "trailing output flag stays text", args: []string{"examples", "validate", "--course", "zeta", "--content", fixtureCoursesRoot, "--output"}},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			stdout, stderr, status := invoke(t, row.args, cli.Options{})
			if status != 2 {
				t.Fatalf("status=%d, want 2 (stdout=%q stderr=%q)", status, stdout, stderr)
			}
			if row.json && !strings.Contains(stderr, `"schemaVersion":1`) {
				t.Fatalf("stderr missing the json body (stderr=%q)", stderr)
			}
			if !row.json && strings.Contains(stderr, `"schemaVersion":1`) {
				t.Fatalf("stderr carries a json body in text mode (stderr=%q)", stderr)
			}
		})
	}
}

// TestRunResolvesShardBeforeRuntime requires a malformed shard to fail
// the run selection before any container starts.
func TestRunResolvesShardBeforeRuntime(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "green-python", "--shard", "bogus", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing the usage code (stderr=%q)", stderr)
	}
}

// TestRunResolvesSinceOutsideRepository requires --since with an
// unknown revision to fail the run selection before any container
// starts.
func TestRunResolvesSinceOutsideRepository(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "run", "--since", "no-such-rev-ayokoding", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.") {
		t.Fatalf("stderr missing the coded failure (stderr=%q)", stderr)
	}
}

// TestRunReadsSeedBeforeSelection requires a passed seed to load
// before the unit rule rejects it.
func TestRunReadsSeedBeforeSelection(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "green-python", "--seed", "5", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.usage.invalid-arguments") {
		t.Fatalf("stderr missing the usage code (stderr=%q)", stderr)
	}
}

// TestRunReadsContentFromDisk requires a missing content directory to
// fail the run before any container starts.
func TestRunReadsContentFromDisk(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "run", "--course", "green-python", "--content", filepath.Join(fixtureCoursesRoot, "no-such-root"), "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "open content") {
		t.Fatalf("stderr names no content failure (stderr=%q)", stderr)
	}
}

// TestValidateReadsContentFromDisk requires a missing content directory
// to fail validation.
func TestValidateReadsContentFromDisk(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "validate", "--course", "green-python", "--content", filepath.Join(fixtureCoursesRoot, "no-such-root"), "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "open content") {
		t.Fatalf("stderr names no content failure (stderr=%q)", stderr)
	}
}

// TestValidateFindingsRenderJSON requires the findings to render one
// JSON document, and a closed pipe to map to 141.
func TestValidateFindingsRenderJSON(t *testing.T) {
	stdout, _, status := invoke(t,
		[]string{"examples", "validate", "--course", "broken-layout", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, `"schemaVersion":1`) {
		t.Fatalf("stdout missing the json body (stdout=%q)", stdout)
	}
	var stderr bytes.Buffer
	status = cli.Execute(context.Background(),
		[]string{"examples", "validate", "--course", "broken-layout", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &stderr})
	if status != 141 {
		t.Fatalf("status=%d, want 141 (stderr=%q)", status, stderr.String())
	}
}

// TestSyncReadsContentFromDisk requires a missing content directory to
// fail the sync before any finding renders.
func TestSyncReadsContentFromDisk(t *testing.T) {
	_, _, status := invoke(t,
		[]string{"examples", "sync", "--course", "green-python", "--content", filepath.Join(fixtureCoursesRoot, "no-such-root")},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
}

// TestSyncRendersReportFailures requires a closed pipe during the sync
// report to map to 141.
func TestSyncRendersReportFailures(t *testing.T) {
	broken := &failingWriter{}
	var stderr bytes.Buffer
	status := cli.Execute(context.Background(),
		[]string{"examples", "sync", "--course", "broken-sync", "--content", fixtureCoursesRoot},
		cli.Options{Stdout: broken, Stderr: &stderr})
	if status != 141 {
		t.Fatalf("status=%d, want 141 (stderr=%q)", status, stderr.String())
	}
}

// TestCoverageReadsContentFromDisk requires a missing content directory
// to fail the coverage before any report renders.
func TestCoverageReadsContentFromDisk(t *testing.T) {
	_, _, status := invoke(t,
		[]string{"examples", "coverage", "--course", "green-python", "--content", filepath.Join(fixtureCoursesRoot, "no-such-root"), "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
}

// TestCoverageAssessesFixtures requires the fixture tree to render the
// per-course counts as text and one JSON document.
func TestCoverageAssessesFixtures(t *testing.T) {
	stdout, _, status := invoke(t,
		[]string{"examples", "coverage", "--course", "green-python", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "green-python: covered (4 of 4 units") {
		t.Fatalf("stdout missing the course line (stdout=%q)", stdout)
	}
	stdout, _, status = invoke(t,
		[]string{"examples", "coverage", "--include-inert", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 0 && status != 1 {
		t.Fatalf("status=%d, want 0 or 1 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "1 illustration block,") {
		t.Fatalf("stdout missing the singular count (stdout=%q)", stdout)
	}
	stdout, _, status = invoke(t,
		[]string{"examples", "coverage", "--include-inert", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json"},
		cli.Options{})
	if status != 0 && status != 1 {
		t.Fatalf("status=%d, want 0 or 1 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, `"schemaVersion":1`) {
		t.Fatalf("stdout missing the json body (stdout=%q)", stdout)
	}
}

// TestCoverageRendersFindingsJSON requires the below-minimum finding
// to render one JSON document.
func TestCoverageRendersFindingsJSON(t *testing.T) {
	stdout, _, status := invoke(t,
		[]string{"examples", "coverage", "--course", "broken-sync", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--min-percent", "100", "--output", "json"},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "ayokoding.coverage.below-minimum") {
		t.Fatalf("stdout missing the finding (stdout=%q)", stdout)
	}
}

// TestCoverageBelowMinimumFails requires --min-percent above the
// assessed percentage to exit 1 with the finding line.
func TestCoverageBelowMinimumFails(t *testing.T) {
	stdout, _, status := invoke(t,
		[]string{"examples", "coverage", "--course", "broken-sync", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--min-percent", "100"},
		cli.Options{})
	if status != 1 {
		t.Fatalf("status=%d, want 1 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "ayokoding.coverage.below-minimum") {
		t.Fatalf("stdout missing the finding line (stdout=%q)", stdout)
	}
}

// TestCoverageRendersReportFailures requires a closed pipe during the
// coverage report to map to 141 in both modes.
func TestCoverageRendersReportFailures(t *testing.T) {
	broken := &failingWriter{}
	var stderr bytes.Buffer
	args := []string{
		"examples", "coverage", "--course", "green-python",
		"--content", fixtureCoursesRoot, "--catalog", fixtureCatalog,
	}
	if status := cli.Execute(context.Background(), args,
		cli.Options{Stdout: broken, Stderr: &stderr}); status != 141 {
		t.Fatalf("status=%d, want 141 in text mode (stderr=%q)", status, stderr.String())
	}
	var jsonErr bytes.Buffer
	jsonArgs := []string{
		"examples", "coverage", "--course", "green-python",
		"--content", fixtureCoursesRoot, "--catalog", fixtureCatalog, "--output", "json",
	}
	if status := cli.Execute(context.Background(), jsonArgs,
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonErr.String())
	}
}

// TestCoverageRendersTextPipeError requires a closed pipe on the first
// course line to map to 141.
func TestCoverageRendersTextPipeError(t *testing.T) {
	var stderr bytes.Buffer
	status := cli.Execute(context.Background(),
		[]string{"examples", "coverage", "--course", "green-python", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{Stdout: neverWriter{}, Stderr: &stderr})
	if status != 141 {
		t.Fatalf("status=%d, want 141 (stderr=%q)", status, stderr.String())
	}
}

// TestToolchainsBuildSelectsIDs requires an unknown toolchain and a
// missing selection to fail before any image builds.
func TestToolchainsBuildSelectsIDs(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"toolchains", "build", "bogus-toolchain"},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stderr=%q)", status, stderr)
	}
	_, _, status = invoke(t, []string{"toolchains", "build"}, cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
}

// TestToolchainsListRendersCatalog requires the embedded catalog to
// render as text and one JSON document, and a closed pipe to map to
// 141 in both modes.
func TestToolchainsListRendersCatalog(t *testing.T) {
	stdout, _, status := invoke(t, []string{"toolchains", "list"}, cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, "python") {
		t.Fatalf("stdout missing the toolchain (stdout=%q)", stdout)
	}
	stdout, _, status = invoke(t, []string{"toolchains", "list", "--output", "json"}, cli.Options{})
	if status != 0 {
		t.Fatalf("status=%d, want 0 (stdout=%q)", status, stdout)
	}
	if !strings.Contains(stdout, `"schemaVersion":1`) {
		t.Fatalf("stdout missing the json body (stdout=%q)", stdout)
	}
	broken := &failingWriter{}
	var stderr bytes.Buffer
	if status := cli.Execute(context.Background(), []string{"toolchains", "list"},
		cli.Options{Stdout: broken, Stderr: &stderr}); status != 141 {
		t.Fatalf("status=%d, want 141 in text mode (stderr=%q)", status, stderr.String())
	}
	var jsonErr bytes.Buffer
	if status := cli.Execute(context.Background(), []string{"toolchains", "list", "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonErr.String())
	}
}

// TestCheckResolvesSinceOutsideRepository requires --since with an
// unknown revision to fail the check selection.
func TestCheckResolvesSinceOutsideRepository(t *testing.T) {
	_, stderr, status := invoke(t,
		[]string{"examples", "check", "--since", "no-such-rev-ayokoding", "--content", fixtureCoursesRoot, "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.") {
		t.Fatalf("stderr missing the coded failure (stderr=%q)", stderr)
	}
}

// TestCheckReadsContentFromDisk requires a missing content directory to
// fail the check before any report renders.
func TestCheckReadsContentFromDisk(t *testing.T) {
	_, _, status := invoke(t,
		[]string{"examples", "check", "--course", "green-python", "--content", filepath.Join(fixtureCoursesRoot, "no-such-root"), "--catalog", fixtureCatalog},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
}

// TestAffectedReadsContentFromDisk requires a missing content directory
// to fail the selection.
func TestAffectedReadsContentFromDisk(t *testing.T) {
	_, _, status := invoke(t,
		[]string{"examples", "affected", "--course", "green-python", "--content", filepath.Join(fixtureCoursesRoot, "no-such-root")},
		cli.Options{})
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
}

// TestAffectedResolvesSinceOutsideRepository requires --since with an
// unknown revision to fail the selection.
func TestAffectedResolvesSinceOutsideRepository(t *testing.T) {
	_, stderr, status := invokeAffected(t, "--since", "no-such-rev-ayokoding")
	if status != 2 {
		t.Fatalf("status=%d, want 2 (stderr=%q)", status, stderr)
	}
	if !strings.Contains(stderr, "ayokoding.") {
		t.Fatalf("stderr missing the coded failure (stderr=%q)", stderr)
	}
}

// TestAffectedRendersReportFailures requires a closed pipe during the
// selection report to map to 141 in json mode.
func TestAffectedRendersReportFailures(t *testing.T) {
	var jsonErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "affected", "--course", "green-python", "--content", fixtureCoursesRoot, "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonErr.String())
	}
}

// TestAffectedRendersTextReportFailures requires a closed pipe
// during the text selection report to map to 141.
func TestAffectedRendersTextReportFailures(t *testing.T) {
	var textErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "affected", "--all", "--content", fixtureCoursesRoot},
		cli.Options{Stdout: neverWriter{}, Stderr: &textErr}); status != 141 {
		t.Fatalf("status=%d, want 141 in text mode (stderr=%q)", status, textErr.String())
	}
	broken := &failingWriter{}
	var courseErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "affected", "--all", "--content", fixtureCoursesRoot},
		cli.Options{Stdout: broken, Stderr: &courseErr}); status != 141 {
		t.Fatalf("status=%d, want 141 on the course line (stderr=%q)", status, courseErr.String())
	}
}

// TestFaultRendersReportFailures requires a closed pipe during the
// canned failing runs to map to 141 in text and json modes.
func TestFaultRendersReportFailures(t *testing.T) {
	var textErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "check", "--course", "demo"},
		cli.Options{Stdout: &failingWriter{}, Stderr: &textErr, Fault: "failing-run"}); status != 141 {
		t.Fatalf("status=%d, want 141 in text mode (stderr=%q)", status, textErr.String())
	}
	var jsonErr bytes.Buffer
	if status := cli.Execute(context.Background(),
		[]string{"examples", "check", "--course", "demo", "--output", "json"},
		cli.Options{Stdout: neverWriter{}, Stderr: &jsonErr, Fault: "failing-run"}); status != 141 {
		t.Fatalf("status=%d, want 141 in json mode (stderr=%q)", status, jsonErr.String())
	}
}

// TestFaultIgnoresUnknownNames requires an unknown fault to let the
// command proceed to its contract error.
func TestFaultIgnoresUnknownNames(t *testing.T) {
	_, _, status := invoke(t,
		[]string{"examples", "validate", "--course", "demo"},
		cli.Options{Fault: "bogus"})
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
}

// TestFaultSpamPassesThrough requires a successful spam to let the
// command proceed to its contract error.
func TestFaultSpamPassesThrough(t *testing.T) {
	var stdout bytes.Buffer
	_, _, status := invoke(t,
		[]string{"examples", "validate", "--course", "demo"},
		cli.Options{Stdout: &stdout, Fault: "spam"})
	if status != 2 {
		t.Fatalf("status=%d, want 2", status)
	}
	if stdout.Len() == 0 {
		t.Fatal("stdout empty, want the spam payload")
	}
}
