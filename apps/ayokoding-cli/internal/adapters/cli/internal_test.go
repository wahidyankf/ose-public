package cli

import (
	"bytes"
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/spf13/cobra"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/coverage"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/selection"
)

// closedPipe fails every write, standing in for a standard output whose
// reader went away before the first byte.
type closedPipe struct{}

func (closedPipe) Write([]byte) (int, error) { return 0, &finding.PipeError{} }

// shortPipe fails the Nth write, standing in for a reader that closes
// mid-report after the early lines.
type shortPipe struct {
	allow int
	used  int
}

func (w *shortPipe) Write(data []byte) (int, error) {
	if w.used >= w.allow {
		return 0, &finding.PipeError{}
	}
	w.used++
	return len(data), nil
}

// errBoomUnit stands in for a refused container CLI call.
var errBoomUnit = errors.New("boom")

// unixPast bounds the expired context below every poll interval.
func unixPast() time.Time {
	return time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
}

// fakeRuntime answers every container plane call with the scripted outcome
// without starting a process.
func fakeRuntime(out string, err error) *containers.Runtime {
	return &containers.Runtime{
		Exec: func(context.Context, string, []string, []byte) (string, error) {
			return out, err
		},
	}
}

// sampleRunReport carries one pass, one replay per newline shape, and one
// finding, so every renderRun line runs.
func sampleRunReport() application.RunReport {
	return application.RunReport{
		Passed: []application.PassedRun{{Course: "demo", Unit: "u", Run: "main", Label: "passed"}},
		Replays: []application.ReplayOutput{
			{Course: "demo", Unit: "u", Run: "main", Seed: 0, Stdout: "trace line\n"},
			{Course: "demo", Unit: "u", Run: "main", Seed: 1, Stdout: "fragment"},
		},
		Findings: []finding.Finding{{Code: "c", Course: "demo", Path: "p", Line: 3, Message: "m"}},
	}
}

// sampleCheckReport carries a message, a pass, a finding, an inert
// course, and one covered course, so every renderCheck line runs.
func sampleCheckReport() application.CheckReport {
	return application.CheckReport{
		Message:  "0 opted-in courses; nothing to run",
		Passed:   []application.PassedRun{{Course: "demo", Unit: "u", Run: "main", Label: "passed"}},
		Findings: []finding.Finding{{Code: "c", Course: "demo", Path: "p", Line: 3, Message: "m"}},
		Selection: selection.Selection{
			Mode:    "course",
			Courses: []string{"demo"},
			Inert:   []string{"quiet"},
		},
		Coverage: coverage.Report{
			Courses:    []coverage.Course{{Slug: "demo", Applicable: true, Covered: true}},
			Applicable: 1,
			Covered:    1,
			Percent:    100,
		},
	}
}

// TestRunAdapterMapsOutcomes requires the adapter to map every runtime
// outcome without starting a process: success splits the streams,
// timeouts and expired contexts time out, and failures wrap.
func TestRunAdapterMapsOutcomes(t *testing.T) {
	invoke := containerplan.Invocation{Binary: "img"}
	t.Run("success splits the streams", func(t *testing.T) {
		executed, err := runAdapter{inner: fakeRuntime("out\n", nil)}.Run(context.Background(), invoke, nil)
		if err != nil {
			t.Fatalf("Run=%v, want nil", err)
		}
		if executed.Exit != 0 || executed.Stdout != "out\n" || executed.Stderr != "" {
			t.Fatalf("executed=%+v, want the split streams", executed)
		}
	})
	t.Run("timeout times out", func(t *testing.T) {
		timeout := &containers.TimeoutError{Command: "podman run img"}
		executed, err := runAdapter{inner: fakeRuntime("", timeout)}.Run(context.Background(), invoke, nil)
		if err != nil {
			t.Fatalf("Run=%v, want nil", err)
		}
		if !executed.TimedOut {
			t.Fatalf("executed=%+v, want the timeout", executed)
		}
	})
	t.Run("expired context times out", func(t *testing.T) {
		past, stop := context.WithDeadline(context.Background(), unixPast())
		defer stop()
		executed, err := runAdapter{inner: fakeRuntime("", errBoomUnit)}.Run(past, invoke, nil)
		if err != nil {
			t.Fatalf("Run=%v, want nil", err)
		}
		if !executed.TimedOut {
			t.Fatalf("executed=%+v, want the timeout", executed)
		}
	})
	t.Run("failure wraps", func(t *testing.T) {
		_, err := runAdapter{inner: fakeRuntime("", errBoomUnit)}.Run(context.Background(), invoke, nil)
		if err == nil || !strings.Contains(err.Error(), "cli: run container") {
			t.Fatalf("Run=%v, want the wrap", err)
		}
	})
}

// TestRunAdapterProbesAndPulls requires probe and pull to pass success
// through and wrap failures without starting a process.
func TestRunAdapterProbesAndPulls(t *testing.T) {
	rootless := &containers.Runtime{
		Exec: func(context.Context, string, []string, []byte) (string, error) {
			return `{"host":{"security":{"rootless":true}}}`, nil
		},
	}
	if err := (runAdapter{inner: rootless}).Probe(context.Background()); err != nil {
		t.Fatalf("Probe=%v, want nil", err)
	}
	if err := (runAdapter{inner: fakeRuntime("", errBoomUnit)}).Probe(context.Background()); err == nil ||
		!strings.Contains(err.Error(), "cli: probe container runtime") {
		t.Fatalf("Probe=%v, want the wrap", err)
	}
	if err := (runAdapter{inner: fakeRuntime("", nil)}).Pull(context.Background(), "img"); err != nil {
		t.Fatalf("Pull=%v, want nil", err)
	}
	if err := (runAdapter{inner: fakeRuntime("", errBoomUnit)}).Pull(context.Background(), "img"); err == nil ||
		!strings.Contains(err.Error(), "cli: pull image") {
		t.Fatalf("Pull=%v, want the wrap", err)
	}
}

// TestRunAdapterSweepsAndCleans requires sweep, cleanup, and removal to
// pass success through and wrap failures without starting a process.
func TestRunAdapterSweepsAndCleans(t *testing.T) {
	good := runAdapter{inner: fakeRuntime("", nil)}
	bad := runAdapter{inner: fakeRuntime("", errBoomUnit)}
	if err := good.Sweep(context.Background(), 0); err != nil {
		t.Fatalf("Sweep=%v, want nil", err)
	}
	if err := bad.Sweep(context.Background(), 0); err == nil ||
		!strings.Contains(err.Error(), "cli: sweep leftover containers") {
		t.Fatalf("Sweep=%v, want the wrap", err)
	}
	good.TrackContainer("c")
	good.TrackNetwork("n")
	if err := good.Cleanup(context.Background()); err != nil {
		t.Fatalf("Cleanup=%v, want nil", err)
	}
	bad.TrackContainer("c")
	bad.TrackNetwork("n")
	if err := bad.Cleanup(context.Background()); err == nil ||
		!strings.Contains(err.Error(), "cli: cleanup containers") {
		t.Fatalf("Cleanup=%v, want the wrap", err)
	}
	if err := good.RemoveContainer(context.Background(), "c"); err != nil {
		t.Fatalf("RemoveContainer=%v, want nil", err)
	}
	if err := bad.RemoveContainer(context.Background(), "c"); err == nil ||
		!strings.Contains(err.Error(), "cli: remove container") {
		t.Fatalf("RemoveContainer=%v, want the wrap", err)
	}
}

// TestRenderRunCoversReportShapes requires the run report to render one
// labelled line per pass with replay traces as text, and one JSON
// document, failing closed on every closed pipe.
func TestRenderRunCoversReportShapes(t *testing.T) {
	var text bytes.Buffer
	if err := renderRun(&text, outputText, sampleRunReport()); err != nil {
		t.Fatalf("renderRun=%v, want nil", err)
	}
	for _, want := range []string{"demo u main: passed", "replay seed 0", "trace line", "fragment", "failed c: m"} {
		if !strings.Contains(text.String(), want) {
			t.Fatalf("text missing %q (text=%q)", want, text.String())
		}
	}
	var document bytes.Buffer
	if err := renderRun(&document, outputJSON, sampleRunReport()); err != nil {
		t.Fatalf("renderRun=%v, want nil", err)
	}
	if !strings.Contains(document.String(), `"schemaVersion":1`) {
		t.Fatalf("document missing the schema (document=%q)", document.String())
	}
	if err := renderRun(closedPipe{}, outputJSON, sampleRunReport()); err == nil {
		t.Fatal("renderRun=nil, want the closed pipe")
	}
	// Every text line fails closed in order over the seven writes: the
	// pass, the two replay lines, the two traces, the trailing newline,
	// and the finding.
	for allow := 0; allow < 7; allow++ {
		if err := renderRun(&shortPipe{allow: allow}, outputText, sampleRunReport()); err == nil {
			t.Fatalf("renderRun=nil on write %d, want the closed pipe", allow)
		}
	}
}

// TestRenderCheckCoversReportShapes requires the check report to render
// its message, passes, findings, inert courses, and summary as text, and
// one JSON document, failing closed on every closed pipe.
func TestRenderCheckCoversReportShapes(t *testing.T) {
	var text bytes.Buffer
	if err := renderCheck(&text, outputText, sampleCheckReport()); err != nil {
		t.Fatalf("renderCheck=%v, want nil", err)
	}
	for _, want := range []string{
		"0 opted-in courses; nothing to run",
		"demo u main: passed",
		"demo p:3: failed c: m",
		"inert: quiet",
		"1 of 1 applicable courses covered",
	} {
		if !strings.Contains(text.String(), want) {
			t.Fatalf("text missing %q (text=%q)", want, text.String())
		}
	}
	var document bytes.Buffer
	if err := renderCheck(&document, outputJSON, sampleCheckReport()); err != nil {
		t.Fatalf("renderCheck=%v, want nil", err)
	}
	if !strings.Contains(document.String(), `"schemaVersion":1`) {
		t.Fatalf("document missing the schema (document=%q)", document.String())
	}
	if err := renderCheck(closedPipe{}, outputJSON, sampleCheckReport()); err == nil {
		t.Fatal("renderCheck=nil, want the closed pipe")
	}
	// The message, pass, finding, inert, and summary lines fail closed in
	// order over the five text writes.
	for allow := 0; allow < 5; allow++ {
		if err := renderCheck(&shortPipe{allow: allow}, outputText, sampleCheckReport()); err == nil {
			t.Fatalf("renderCheck=nil on write %d, want the closed pipe", allow)
		}
	}
}

// TestRenderCoverageCoversCourseShapes requires the coverage report to
// render not-applicable, covered, and missed courses with the percentage
// and findings as text, and one JSON document, failing closed on pipes.
func TestRenderCoverageCoversCourseShapes(t *testing.T) {
	assessed := application.CoverageReport{
		Report: coverage.Report{
			Courses: []coverage.Course{
				{Slug: "quiet", Applicable: false},
				{Slug: "demo", Applicable: true, Units: 2, CoveredUnits: 2, CodeFences: 1, AnchoredFences: 1, Covered: true},
				{Slug: "stale", Applicable: true, Units: 2, CoveredUnits: 1, CodeFences: 2, IllustrationFences: 1},
			},
			Applicable: 2,
			Covered:    1,
			Percent:    50,
		},
		Findings: []finding.Finding{{Code: "c", Course: "stale", Path: "p", Line: 1, Message: "m"}},
	}
	var text bytes.Buffer
	if err := renderCoverage(&text, outputText, assessed); err != nil {
		t.Fatalf("renderCoverage=%v, want nil", err)
	}
	for _, want := range []string{
		"quiet: not applicable",
		"demo: covered (2 of 2 units, 1 code fence, 1 anchored fence, 0 illustration blocks, 0 static units)",
		"stale: not covered (1 of 2 units, 2 code fences, 0 anchored fences, 1 illustration block, 0 static units)",
		"1 of 2 applicable courses covered (50%)",
		"coverage: c: m",
	} {
		if !strings.Contains(text.String(), want) {
			t.Fatalf("text missing %q (text=%q)", want, text.String())
		}
	}
	var document bytes.Buffer
	if err := renderCoverage(&document, outputJSON, assessed); err != nil {
		t.Fatalf("renderCoverage=%v, want nil", err)
	}
	if !strings.Contains(document.String(), `"schemaVersion":1`) {
		t.Fatalf("document missing the schema (document=%q)", document.String())
	}
	if err := renderCoverage(closedPipe{}, outputJSON, assessed); err == nil {
		t.Fatal("renderCoverage=nil, want the closed pipe")
	}
	// The not-applicable, covered, missed, summary, and finding lines fail
	// closed in order over the five text writes.
	for allow := 0; allow < 5; allow++ {
		if err := renderCoverage(&shortPipe{allow: allow}, outputText, assessed); err == nil {
			t.Fatalf("renderCoverage=nil on write %d, want the closed pipe", allow)
		}
	}
}

// TestRenderAffectedCoversSelectionShapes requires the selection to render
// the mode with selected and inert courses as text, and one JSON
// document, failing closed on pipes.
func TestRenderAffectedCoversSelectionShapes(t *testing.T) {
	resolved := selection.Selection{Mode: "course", Courses: []string{"demo"}, Inert: []string{"quiet"}}
	var text bytes.Buffer
	if err := renderAffected(&text, outputText, resolved); err != nil {
		t.Fatalf("renderAffected=%v, want nil", err)
	}
	for _, want := range []string{"mode: course", "course: demo", "inert: quiet"} {
		if !strings.Contains(text.String(), want) {
			t.Fatalf("text missing %q (text=%q)", want, text.String())
		}
	}
	var document bytes.Buffer
	if err := renderAffected(&document, outputJSON, resolved); err != nil {
		t.Fatalf("renderAffected=%v, want nil", err)
	}
	if !strings.Contains(document.String(), `"inert":["quiet"]`) {
		t.Fatalf("document missing the inert payload (document=%q)", document.String())
	}
	if err := renderAffected(closedPipe{}, outputJSON, resolved); err == nil {
		t.Fatal("renderAffected=nil, want the closed pipe")
	}
	// The mode, course, and inert lines fail closed in order.
	for allow := 0; allow < 3; allow++ {
		if err := renderAffected(&shortPipe{allow: allow}, outputText, resolved); err == nil {
			t.Fatalf("renderAffected=nil on write %d, want the closed pipe", allow)
		}
	}
}

// TestRenderBuiltImagesCoversImageShapes requires built images to render
// one id and tag per build as text, and one JSON document, failing
// closed on pipes.
func TestRenderBuiltImagesCoversImageShapes(t *testing.T) {
	var empty bytes.Buffer
	if err := renderBuiltImages(&empty, outputText, nil); err != nil {
		t.Fatalf("renderBuiltImages=%v, want nil", err)
	}
	if empty.String() != "" {
		t.Fatalf("text=%q, want nothing for no builds", empty.String())
	}
	built := []application.BuiltImage{{ID: "typescript", Tag: "tag-1"}, {ID: "python", Tag: "tag-2"}}
	var text bytes.Buffer
	if err := renderBuiltImages(&text, outputText, built); err != nil {
		t.Fatalf("renderBuiltImages=%v, want nil", err)
	}
	if !strings.Contains(text.String(), "typescript tag-1\npython tag-2\n") {
		t.Fatalf("text missing the builds (text=%q)", text.String())
	}
	var document bytes.Buffer
	if err := renderBuiltImages(&document, outputJSON, built); err != nil {
		t.Fatalf("renderBuiltImages=%v, want nil", err)
	}
	for _, want := range []string{`"schemaVersion":1`, `"id":"typescript"`} {
		if !strings.Contains(document.String(), want) {
			t.Fatalf("document missing %q (document=%q)", want, document.String())
		}
	}
	if err := renderBuiltImages(closedPipe{}, outputJSON, built); err == nil {
		t.Fatal("renderBuiltImages=nil, want the closed pipe")
	}
	if err := renderBuiltImages(&shortPipe{}, outputText, built); err == nil {
		t.Fatal("renderBuiltImages=nil, want the closed pipe")
	}
}

// TestVersionStringDefaultsFields requires empty build stamps to render
// the development defaults.
func TestVersionStringDefaultsFields(t *testing.T) {
	if got := versionString("", "", ""); got != "ayokoding-cli dev (commit unknown, catalog unpinned)\n" {
		t.Fatalf("version=%q, want the defaults", got)
	}
	if got := versionString("v1", "abc", "hash"); got != "ayokoding-cli v1 (commit abc, catalog hash)\n" {
		t.Fatalf("version=%q, want the stamps", got)
	}
}

// TestStatusErrorReportsStatus requires the carried status to read back
// as the exit text.
func TestStatusErrorReportsStatus(t *testing.T) {
	if got := (&statusError{status: 1}).Error(); got != "exit status 1" {
		t.Fatalf("status=%q, want the exit text", got)
	}
}

// TestFailingRunReadsFlagsFirst requires the failing-run fault to read
// its flags before rendering, so a command without them fails closed.
func TestFailingRunReadsFlagsFirst(t *testing.T) {
	var stdout bytes.Buffer
	bare := &cobra.Command{}
	bare.SetOut(&stdout)
	if err := failingRun(bare, Options{}); err == nil || !strings.Contains(err.Error(), "read --color") {
		t.Fatalf("failingRun=%v, want the color flag failure", err)
	}
	colorOnly := &cobra.Command{}
	colorOnly.Flags().String("color", "auto", "")
	colorOnly.SetOut(&stdout)
	if err := failingRun(colorOnly, Options{}); err == nil || !strings.Contains(err.Error(), "read --output") {
		t.Fatalf("failingRun=%v, want the output flag failure", err)
	}
}

// TestSpamDrainsOnOpenPipe requires the spam fault to write its payload
// and succeed on an open pipe.
func TestSpamDrainsOnOpenPipe(t *testing.T) {
	cmd := &cobra.Command{}
	var stdout bytes.Buffer
	cmd.SetOut(&stdout)
	if err := spam(cmd); err != nil {
		t.Fatalf("spam=%v, want nil", err)
	}
	if stdout.Len() == 0 {
		t.Fatal("stdout empty, want the spam payload")
	}
}

// TestRenderFailuresFailsClosedOnPipe requires the canned failures to
// fail closed when the reader closes early in both modes.
func TestRenderFailuresFailsClosedOnPipe(t *testing.T) {
	text := &cobra.Command{}
	text.Flags().String("color", "auto", "")
	text.SetOut(closedPipe{})
	if err := renderFailures(text, false, outputText); err == nil {
		t.Fatal("renderFailures=nil, want the closed pipe")
	}
	document := &cobra.Command{}
	document.Flags().String("color", "auto", "")
	document.SetOut(closedPipe{})
	if err := renderFailures(document, false, outputJSON); err == nil {
		t.Fatal("renderFailures=nil, want the closed pipe")
	}
	mid := &cobra.Command{}
	mid.Flags().String("color", "auto", "")
	mid.SetOut(&shortPipe{allow: 1})
	if err := renderFailures(mid, false, outputText); err == nil {
		t.Fatal("renderFailures=nil, want the mid-report pipe")
	}
}

// flagCommand builds a leaf command defining exactly the named flags with
// the production defaults, so each flag read failure is reachable without
// parsing arguments.
func flagCommand(names ...string) *cobra.Command {
	cmd := &cobra.Command{}
	defined := map[string]bool{}
	for _, name := range names {
		defined[name] = true
	}
	if defined["course"] {
		cmd.Flags().StringSlice("course", nil, "")
	}
	if defined["since"] {
		cmd.Flags().String("since", "", "")
	}
	if defined["all"] {
		cmd.Flags().Bool("all", false, "")
	}
	if defined["shard"] {
		cmd.Flags().String("shard", "", "")
	}
	if defined["unit"] {
		cmd.Flags().String("unit", "", "")
	}
	if defined["seed"] {
		cmd.Flags().Int("seed", 0, "")
	}
	if defined["record"] {
		cmd.Flags().Bool("record", false, "")
	}
	if defined["single-run"] {
		cmd.Flags().Bool("single-run", false, "")
	}
	if defined["include-inert"] {
		cmd.Flags().Bool("include-inert", false, "")
	}
	if defined["min-percent"] {
		cmd.Flags().Int("min-percent", 0, "")
	}
	if defined["write"] {
		cmd.Flags().Bool("write", false, "")
	}
	if defined["content"] {
		cmd.Flags().String("content", "", "")
	}
	if defined["catalog"] {
		cmd.Flags().String("catalog", "", "")
	}
	if defined["output"] {
		cmd.Flags().String("output", "text", "")
	}
	return cmd
}

// TestRunFuncsReadFlagsFirst requires every leaf to fail closed on its
// first missing flag, pinning the defensive reads without parsing.
func TestRunFuncsReadFlagsFirst(t *testing.T) {
	ctx := context.Background()
	rows := []struct {
		name string
		call func(*cobra.Command) error
		want string
	}{
		{"validate catalog", func(cmd *cobra.Command) error { return runValidate(cmd) }, "read --catalog"},
		{"validate course", func(cmd *cobra.Command) error { return runValidate(flagCommand("catalog")) }, "read --course"},
		{"validate inert", func(cmd *cobra.Command) error { return runValidate(flagCommand("catalog", "course")) }, "read --include-inert"},
		{"validate content", func(cmd *cobra.Command) error { return runValidate(flagCommand("catalog", "course", "include-inert")) }, "read --content"},
		{"validate output", func(cmd *cobra.Command) error {
			return runValidate(withContent("catalog", "course", "include-inert", "content"))
		}, "read --output"},
		{"list catalog", func(cmd *cobra.Command) error { return runList(cmd) }, "read --catalog"},
		{"list output", func(cmd *cobra.Command) error { return runList(flagCommand("catalog")) }, "read --output"},
		{"coverage catalog", func(cmd *cobra.Command) error { return runCoverage(cmd) }, "read --catalog"},
		{"coverage course", func(cmd *cobra.Command) error { return runCoverage(flagCommand("catalog")) }, "read --course"},
		{"coverage inert", func(cmd *cobra.Command) error { return runCoverage(flagCommand("catalog", "course")) }, "read --include-inert"},
		{"coverage percent", func(cmd *cobra.Command) error { return runCoverage(flagCommand("catalog", "course", "include-inert")) }, "read --min-percent"},
		{"coverage content", func(cmd *cobra.Command) error {
			return runCoverage(flagCommand("catalog", "course", "include-inert", "min-percent"))
		}, "read --content"},
		{"coverage output", func(cmd *cobra.Command) error {
			return runCoverage(withContent("catalog", "course", "include-inert", "min-percent", "content"))
		}, "read --output"},
		{"check catalog", func(cmd *cobra.Command) error { return runCheck(ctx, cmd) }, "read --catalog"},
		{"check course", func(cmd *cobra.Command) error { return runCheck(ctx, flagCommand("catalog")) }, "read --course"},
		{"check since", func(cmd *cobra.Command) error { return runCheck(ctx, flagCommand("catalog", "course")) }, "read --since"},
		{"check all", func(cmd *cobra.Command) error { return runCheck(ctx, flagCommand("catalog", "course", "since")) }, "read --all"},
		{"check shard", func(cmd *cobra.Command) error { return runCheck(ctx, flagCommand("catalog", "course", "since", "all")) }, "read --shard"},
		{"check content", func(cmd *cobra.Command) error {
			return runCheck(ctx, flagCommand("catalog", "course", "since", "all", "shard"))
		}, "read --content"},
		{"check output", func(cmd *cobra.Command) error {
			return runCheck(ctx, withContent("catalog", "course", "since", "all", "shard", "content"))
		}, "read --output"},
		{"run catalog", func(cmd *cobra.Command) error { return runRun(ctx, cmd) }, "read --catalog"},
		{"run course", func(cmd *cobra.Command) error { return runRun(ctx, flagCommand("catalog")) }, "read --course"},
		{"run since", func(cmd *cobra.Command) error { return runRun(ctx, flagCommand("catalog", "course")) }, "read --since"},
		{"run all", func(cmd *cobra.Command) error { return runRun(ctx, flagCommand("catalog", "course", "since")) }, "read --all"},
		{"run shard", func(cmd *cobra.Command) error { return runRun(ctx, flagCommand("catalog", "course", "since", "all")) }, "read --shard"},
		{"run unit", func(cmd *cobra.Command) error {
			return runRun(ctx, flagCommand("catalog", "course", "since", "all", "shard"))
		}, "read --unit"},
		{"run seed", func(cmd *cobra.Command) error {
			seeded := flagCommand("catalog", "course", "since", "all", "shard", "unit")
			seeded.Flags().String("seed", "", "")
			_ = seeded.Flags().Set("seed", "x")
			return runRun(ctx, seeded)
		}, "read --seed"},
		{"run record", func(cmd *cobra.Command) error {
			return runRun(ctx, flagCommand("catalog", "course", "since", "all", "shard", "unit"))
		}, "read --record"},
		{"run single", func(cmd *cobra.Command) error {
			return runRun(ctx, flagCommand("catalog", "course", "since", "all", "shard", "unit", "record"))
		}, "read --single-run"},
		{"run content", func(cmd *cobra.Command) error {
			return runRun(ctx, flagCommand("catalog", "course", "since", "all", "shard", "unit", "record", "single-run"))
		}, "read --content"},
		{"run output", func(cmd *cobra.Command) error {
			return runRun(ctx, withContent("catalog", "course", "since", "all", "shard", "unit", "record", "single-run", "content"))
		}, "read --output"},
		{"affected course", func(cmd *cobra.Command) error { return runAffected(ctx, cmd) }, "read --course"},
		{"affected since", func(cmd *cobra.Command) error { return runAffected(ctx, flagCommand("course")) }, "read --since"},
		{"affected all", func(cmd *cobra.Command) error { return runAffected(ctx, flagCommand("course", "since")) }, "read --all"},
		{"affected shard", func(cmd *cobra.Command) error { return runAffected(ctx, withCourse("demo")) }, "read --shard"},
		{"affected content", func(cmd *cobra.Command) error { return runAffected(ctx, withCourseShard("demo")) }, "read --content"},
		{"affected output", func(cmd *cobra.Command) error {
			selected := withCourseShard("demo")
			selected.Flags().String("content", "", "")
			_ = selected.Flags().Set("content", ".")
			return runAffected(ctx, selected)
		}, "read --output"},
		{"sync course", func(cmd *cobra.Command) error { return runSync(cmd) }, "read --course"},
		{"sync inert", func(cmd *cobra.Command) error { return runSync(flagCommand("course")) }, "read --include-inert"},
		{"sync write", func(cmd *cobra.Command) error { return runSync(flagCommand("course", "include-inert")) }, "read --write"},
		{"sync content", func(cmd *cobra.Command) error { return runSync(flagCommand("course", "include-inert", "write")) }, "read --content"},
		{"sync output", func(cmd *cobra.Command) error {
			return runSync(withContent("course", "include-inert", "write", "content"))
		}, "read --output"},
		{"build catalog", func(cmd *cobra.Command) error { return runBuild(ctx, cmd) }, "read --catalog"},
		{"build output", func(cmd *cobra.Command) error { return runBuild(ctx, flagCommand("catalog")) }, "read --output"},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			if err := row.call(&cobra.Command{}); err == nil || !strings.Contains(err.Error(), row.want) {
				t.Fatalf("%s=%v, want %q", row.name, err, row.want)
			}
		})
	}
}

// TestRunBuildUnknownIDFailsClosed requires an unknown toolchain id to
// fail the build naming the id, without reaching any container.
func TestRunBuildUnknownIDFailsClosed(t *testing.T) {
	cmd := flagCommand("catalog", "output")
	if err := cmd.Flags().Parse([]string{"no-such-toolchain-ayokoding"}); err != nil {
		t.Fatalf("Parse=%v, want nil", err)
	}
	var stdout bytes.Buffer
	cmd.SetOut(&stdout)
	if err := runBuild(context.Background(), cmd); err == nil ||
		!strings.Contains(err.Error(), "cli: build images") {
		t.Fatalf("runBuild=%v, want the build failure", err)
	}
}

// withCourse defines the selection flags with one selected course, so the
// shard read fails after the selection passes.
func withCourse(course string) *cobra.Command {
	cmd := flagCommand("course", "since", "all")
	_ = cmd.Flags().Set("course", course)
	return cmd
}

// withCourseShard defines the selection flags with one selected course
// and a shard, so the content read fails after the selection passes.
func withCourseShard(course string) *cobra.Command {
	cmd := flagCommand("course", "since", "all", "shard")
	_ = cmd.Flags().Set("course", course)
	return cmd
}

// withContent defines the named flags with the content root pointing at
// the package directory, so the content check passes and the output read
// fails. The directory exists in every checkout, so the test creates
// nothing.
func withContent(names ...string) *cobra.Command {
	cmd := flagCommand(names...)
	_ = cmd.Flags().Set("content", ".")
	return cmd
}
