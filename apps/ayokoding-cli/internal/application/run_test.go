package application_test

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"maps"
	"os"
	"strings"
	"testing"
	"testing/fstest"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// errStepBoom scripts an unclassified runtime failure.
var errStepBoom = errors.New("step: boom")

// errPipFailed scripts a failed dependency install.
var errPipFailed = errors.New("pip install failed: hash mismatch")

// scriptedCall records one runtime invocation with its stdin.
type scriptedCall struct {
	invoke containerplan.Invocation
	stdin  []byte
}

// scriptedRuntime replays scripted executions and records every call, so
// the double run, the argv shape, and the never-ran paths stay observable.
type scriptedRuntime struct {
	calls             []scriptedCall
	run               func(invoke containerplan.Invocation, stdin []byte) (application.Execution, error)
	probeErr          error
	pullErr           error
	sweepErr          error
	pulled            []string
	removed           []string
	cleaned           int
	swept             []time.Duration
	trackedContainers []string
	trackedNetworks   []string
}

// Run records the call and replays the scripted outcome.
func (fake *scriptedRuntime) Run(_ context.Context, invoke containerplan.Invocation, stdin []byte) (application.Execution, error) {
	fake.calls = append(fake.calls, scriptedCall{invoke: invoke, stdin: stdin})
	return fake.run(invoke, stdin)
}

// Probe replays the scripted daemon answer.
func (fake *scriptedRuntime) Probe(context.Context) error {
	return fake.probeErr
}

// Pull records the pulled image and replays the scripted failure.
func (fake *scriptedRuntime) Pull(_ context.Context, image string) error {
	fake.pulled = append(fake.pulled, image)
	return fake.pullErr
}

// Sweep records the sweep age and replays the scripted failure.
func (fake *scriptedRuntime) Sweep(_ context.Context, olderThan time.Duration) error {
	fake.swept = append(fake.swept, olderThan)
	return fake.sweepErr
}

// TrackContainer records the tracked container.
func (fake *scriptedRuntime) TrackContainer(name string) {
	fake.trackedContainers = append(fake.trackedContainers, name)
}

// TrackNetwork records the tracked network.
func (fake *scriptedRuntime) TrackNetwork(name string) {
	fake.trackedNetworks = append(fake.trackedNetworks, name)
}

// Cleanup records the interrupt cleanup.
func (fake *scriptedRuntime) Cleanup(context.Context) error {
	fake.cleaned++
	return nil
}

// RemoveContainer records the scoped container removal.
func (fake *scriptedRuntime) RemoveContainer(_ context.Context, name string) error {
	fake.removed = append(fake.removed, name)
	return nil
}

// okExecution replays one passing execution with the stdout.
func okExecution(stdout string) func(containerplan.Invocation, []byte) (application.Execution, error) {
	return func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{Exit: 0, Stdout: stdout}, nil
	}
}

// runArgv joins every recorded argv for containment assertions.
func runArgv(fake *scriptedRuntime) string {
	lines := make([]string, 0, len(fake.calls))
	for _, call := range fake.calls {
		lines = append(lines, strings.Join(call.invoke.Args, " "))
	}
	return strings.Join(lines, "\n")
}

// runContent builds in-memory course content from path bodies.
func runContent(files map[string]string) fstest.MapFS {
	content := fstest.MapFS{}
	for name, body := range files {
		content[name] = &fstest.MapFile{Data: []byte(body)}
	}
	return content
}

// helloCourse carries one unit printing exactly its expected output.
func helloCourse() fstest.MapFS {
	return runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":                 validRunSpec,
		"demo/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"demo/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
	})
}

// baseRunRequest selects the demo course with the scripted runtime.
func baseRunRequest(content fs.FS, fake *scriptedRuntime) application.RunRequest {
	return application.RunRequest{
		Content: content,
		Catalog: testCatalog(),
		Courses: []string{"demo"},
		Runtime: fake,
		RunID:   "test-run-1",
	}
}

// requireFinding asserts one finding with the code and every name.
func requireFinding(t *testing.T, report application.RunReport, code string, names ...string) {
	t.Helper()
	for _, found := range report.Findings {
		if found.Code != code {
			continue
		}
		matched := true
		for _, name := range names {
			if !strings.Contains(found.Message, name) && !strings.Contains(found.Path, name) {
				matched = false
			}
		}
		if matched {
			return
		}
	}
	t.Fatalf("no finding %q naming %q in %+v", code, names, report.Findings)
}

// TestRunPassesMatchingOutput requires a green run to report its pass with
// no finding: two executions under different CPU quotas after the daemon
// probe, the leftover sweep, and the pinned image pull.
func TestRunPassesMatchingOutput(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if len(report.Passed) != 1 {
		t.Fatalf("passed=%+v, want one pass", report.Passed)
	}
	passed := report.Passed[0]
	if passed.Course != "demo" || passed.Unit != "learning/code/ex-01-hello" || passed.Run != "main" || passed.Label != "passed" {
		t.Fatalf("passed=%+v, want the demo hello main pass", passed)
	}
	if len(fake.calls) != 2 {
		t.Fatalf("calls=%d, want the double run", len(fake.calls))
	}
	argv := runArgv(fake)
	if !strings.Contains(argv, "--cpus 2") || !strings.Contains(argv, "--cpus 1") {
		t.Fatalf("double run misses the CPU quota pair (argv=%q)", argv)
	}
	if fake.probeErr != nil {
		t.Fatal("probe error leaked into the fake")
	}
	if len(fake.swept) != 1 || fake.swept[0] != 24*time.Hour {
		t.Fatalf("swept=%v, want one 24h sweep", fake.swept)
	}
	pulled := false
	for _, image := range fake.pulled {
		if strings.Contains(image, "docker.io/library/python") {
			pulled = true
		}
	}
	if !pulled {
		t.Fatalf("pulled=%q, want the python image", fake.pulled)
	}
}

// TestRunComparesExit requires a different exit status to fail the run
// naming expected and actual.
func TestRunComparesExit(t *testing.T) {
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{Exit: 3, Stdout: "hello\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil (negative results return findings)", err)
	}
	if !report.Failed() {
		t.Fatal("Failed=false, want true")
	}
	requireFinding(t, report, application.CodeExitMismatch, "expected exit 0", "actual 3")
}

// TestRunComparesStdoutFirstLine requires a different second line to fail
// showing the first differing line with both bytes.
func TestRunComparesStdoutFirstLine(t *testing.T) {
	content := helloCourse()
	content["demo/learning/code/ex-01-hello/expected/main.stdout.txt"] = &fstest.MapFile{Data: []byte("hello\nworld\n")}
	fake := &scriptedRuntime{run: okExecution("hello\nWORLD\n")}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStdoutMismatch, "line 2", "world", "WORLD")
}

// TestRunComparesStderrEmpty requires an unexpected warning on standard
// error to fail the run.
func TestRunComparesStderrEmpty(t *testing.T) {
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{Exit: 0, Stdout: "hello\n", Stderr: "warning: slow\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStderrMismatch, "warning: slow")
}

// TestRunIgnoresStderr requires the ignore word to skip standard error
// comparison.
func TestRunIgnoresStderr(t *testing.T) {
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
      stderr: ignore
`,
		"demo/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"demo/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
	})
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{Exit: 0, Stdout: "hello\n", Stderr: "warning: slow\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
}

// TestRunIgnoresStdoutWithInvariant requires the ignore word with an
// invariant to skip standard output comparison.
func TestRunIgnoresStdoutWithInvariant(t *testing.T) {
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: ignore
      invariant: the program prints one greeting line
`,
		"demo/learning/code/ex-01-hello/example.py": "print('hello')\n",
	})
	fake := &scriptedRuntime{run: okExecution("anything at all\n")}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
}

// TestRunTimeoutRequiresTimedOutResult requires an execution exceeding its
// timeout to fail as a timed-out result, never as an environment status.
func TestRunTimeoutRequiresTimedOutResult(t *testing.T) {
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{TimedOut: true}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil (timeouts are negative results)", err)
	}
	requireFinding(t, report, application.CodeRunTimeout, "main")
}

// TestRunTimeoutRemovesTimedOutContainer requires an execution exceeding
// its own timeout to remove its container at once: killing the container
// CLI orphans the container, and the timed-out finding must not leave it
// running while sibling units still run.
func TestRunTimeoutRemovesTimedOutContainer(t *testing.T) {
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{TimedOut: true}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil (timeouts are negative results)", err)
	}
	requireFinding(t, report, application.CodeRunTimeout, "main")
	want := []string{"ayokoding-test-run-1-0"}
	if len(fake.removed) != len(want) || fake.removed[0] != want[0] {
		t.Fatalf("removed=%q, want %q", fake.removed, want)
	}
}

// TestRunNondeterministicRequiresFirstLine requires differing executions
// to fail showing the first differing line.
func TestRunNondeterministicRequiresFirstLine(t *testing.T) {
	calls := 0
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		calls++
		if calls%2 == 1 {
			return application.Execution{Exit: 0, Stdout: "seed 4\n"}, nil
		}
		return application.Execution{Exit: 0, Stdout: "seed 9\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeNondeterministic, "line 1", "seed 4", "seed 9")
}

// TestRunNondeterministicSkipsIgnoredStreams requires ignored streams to
// stay out of the determinism comparison: timing output on an ignored
// stream is not flakiness.
func TestRunNondeterministicSkipsIgnoredStreams(t *testing.T) {
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [pytest]
    expect:
      exit: 0
      stdout: ignore
      stderr: ignore
      invariant: pytest exits 0 only when every check passes
`,
		"demo/learning/code/ex-01-hello/example.py": "print('hello')\n",
	})
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{Exit: 0, Stdout: "0.12s\n", Stderr: "warn\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
}

// executionSource extracts the /work bind source from a planned invocation.
func executionSource(invoke containerplan.Invocation) string {
	for index, arg := range invoke.Args {
		if arg == "--mount" && index+1 < len(invoke.Args) {
			mount := invoke.Args[index+1]
			const prefix = "type=bind,source="
			rest, _, _ := strings.Cut(strings.TrimPrefix(mount, prefix), ",target=")
			if strings.HasPrefix(mount, prefix) {
				return rest
			}
		}
	}
	return ""
}

// TestRunExecutionsUseFreshCopies requires each execution to see a pristine
// working copy: a program mutating its own source must not poison the
// second execution.
func TestRunExecutionsUseFreshCopies(t *testing.T) {
	sources := []string{}
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		source := executionSource(invoke)
		sources = append(sources, source)
		program := source + "/learning/code/ex-01-hello/example.py"
		body, err := os.ReadFile(program)
		if err != nil {
			return application.Execution{}, fmt.Errorf("test: read working copy: %w", err)
		}
		if string(body) != "print('hello')\n" {
			return application.Execution{Exit: 0, Stdout: "second sees dirt\n"}, nil
		}
		if err := os.WriteFile(program, []byte("vandalized\n"), 0o644); err != nil {
			return application.Execution{}, fmt.Errorf("test: vandalize working copy: %w", err)
		}
		return application.Execution{Exit: 0, Stdout: "hello\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if len(sources) != 2 || sources[0] == sources[1] {
		t.Fatalf("sources=%q, want two distinct working copies", sources)
	}
}

// twoRunSpec carries two runs so name collisions across runs surface.
const twoRunSpec = `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: alpha
    command: [python3, one.py]
    expect:
      exit: 0
      stdout: expected/one.stdout.txt
  - name: beta
    command: [python3, two.py]
    expect:
      exit: 0
      stdout: expected/two.stdout.txt
`

// containerNames extracts every planned --name value.
func containerNames(invocations []containerplan.Invocation) []string {
	var names []string
	for _, invoke := range invocations {
		for index, arg := range invoke.Args {
			if arg == "--name" && index+1 < len(invoke.Args) {
				names = append(names, invoke.Args[index+1])
			}
		}
	}
	return names
}

// TestRunContainerNamesUnique requires every execution across runs to plan
// a distinct container name: a still-running timed-out container must not
// collide with a later execution reusing runID and seq.
func TestRunContainerNamesUnique(t *testing.T) {
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-duo/run.yaml":                twoRunSpec,
		"demo/learning/code/ex-01-duo/one.py":                  "print('one')\n",
		"demo/learning/code/ex-01-duo/two.py":                  "print('two')\n",
		"demo/learning/code/ex-01-duo/expected/one.stdout.txt": "one\n",
		"demo/learning/code/ex-01-duo/expected/two.stdout.txt": "two\n",
	})
	var invocations []containerplan.Invocation
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		invocations = append(invocations, invoke)
		stdout := "two\n"
		for _, arg := range invoke.Args {
			if strings.HasSuffix(arg, "one.py") {
				stdout = "one\n"
			}
		}
		return application.Execution{Exit: 0, Stdout: stdout}, nil
	}}
	_, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	names := containerNames(invocations)
	seen := map[string]bool{}
	for _, name := range names {
		if seen[name] {
			t.Fatalf("container names=%q, want all distinct", names)
		}
		seen[name] = true
	}
	if len(names) != 4 {
		t.Fatalf("container names=%q, want four executions", names)
	}
}

// TestRunSingleRunSkipsSecond requires --single-run to execute once with
// no determinism comparison.
func TestRunSingleRunSkipsSecond(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	req.SingleRun = true
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if len(fake.calls) != 1 {
		t.Fatalf("calls=%d, want one execution", len(fake.calls))
	}
}

// TestRunRejectsUnknownCourse requires an unknown course to exit 2.
func TestRunRejectsUnknownCourse(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	req.Courses = []string{"nope"}
	_, err := application.Run(context.Background(), req)
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok || coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("err=%v, want the invalid-arguments usage error", err)
	}
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution on usage errors", len(fake.calls))
	}
}

// TestRunRequiresSelection requires a missing selection to exit 2.
func TestRunRequiresSelection(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	req.Courses = nil
	_, err := application.Run(context.Background(), req)
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok || coded.Code != finding.UsageMissingSelection {
		t.Fatalf("err=%v, want the missing-selection usage error", err)
	}
}

// TestRunSeedRequiresUnit requires --seed without --unit to exit 2 before
// any execution, so usage outranks every other outcome.
func TestRunSeedRequiresUnit(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	seed := 17
	req.Seed = &seed
	_, err := application.Run(context.Background(), req)
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok || coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("err=%v, want the invalid-arguments usage error", err)
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution on usage errors", len(fake.calls))
	}
}

// TestRunUnitRequiresSingleCourse requires --unit with several courses to
// exit 2.
func TestRunUnitRequiresSingleCourse(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	req.Courses = []string{"demo", "other"}
	req.Unit = "learning/code/ex-01-hello"
	_, err := application.Run(context.Background(), req)
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok || coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("err=%v, want the invalid-arguments usage error", err)
	}
}

// TestRunUnitWithoutMatch requires an unknown unit path to exit 2.
func TestRunUnitWithoutMatch(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	req.Unit = "learning/code/ex-99-missing"
	_, err := application.Run(context.Background(), req)
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok || coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("err=%v, want the invalid-arguments usage error", err)
	}
}

// TestRunSkipsInvalidSpec requires an invalid run spec to report its
// findings without executing the unit.
func TestRunSkipsInvalidSpec(t *testing.T) {
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":                 "schema: ayokoding.run/v1\ntoolchain: python\nexpected_output: x\nruns:\n  - name: main\n    command: [python3, example.py]\n    expect:\n      exit: 0\n      stdout: expected/main.stdout.txt\n",
		"demo/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"demo/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
	})
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, "ayokoding.runspec.unknown-key", "expected_output")
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution for invalid specs", len(fake.calls))
	}
}

// TestRunReportsMissingSpec requires a unit without a run spec to report
// the missing-spec finding.
func TestRunReportsMissingSpec(t *testing.T) {
	content := helloCourse()
	content["demo/learning/code/ex-02-bare/main.py"] = &fstest.MapFile{Data: []byte("print('bare')\n")}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, "ayokoding.layout.missing-run-spec", "ex-02-bare")
	if len(report.Passed) != 1 {
		t.Fatalf("passed=%+v, want the hello unit still passing", report.Passed)
	}
}

// TestRunPropagatesProbeFailure requires a refused daemon to stop the run
// with the environment status.
func TestRunPropagatesProbeFailure(t *testing.T) {
	fake := &scriptedRuntime{
		run:      okExecution("hello\n"),
		probeErr: &finding.Error{Code: finding.EnvRuntimeRefused, Message: "daemon unreachable"},
	}
	_, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if finding.ExitCode(err) != 125 {
		t.Fatalf("exit=%d, want 125", finding.ExitCode(err))
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without a daemon", len(fake.calls))
	}
}

// TestRunPropagatesSweepFailure requires a sweep failure to stop the run.
func TestRunPropagatesSweepFailure(t *testing.T) {
	fake := &scriptedRuntime{
		run:      okExecution("hello\n"),
		sweepErr: &finding.Error{Code: finding.EnvRuntimeRefused, Message: "sweep refused"},
	}
	_, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if finding.ExitCode(err) != 125 {
		t.Fatalf("exit=%d, want 125", finding.ExitCode(err))
	}
}

// TestRunPropagatesPullFailure requires a failed image pull to stop the
// run with the environment status.
func TestRunPropagatesPullFailure(t *testing.T) {
	fake := &scriptedRuntime{
		run:     okExecution("hello\n"),
		pullErr: &finding.Error{Code: finding.EnvRuntimeRefused, Message: "pull failed"},
	}
	_, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if finding.ExitCode(err) != 125 {
		t.Fatalf("exit=%d, want 125", finding.ExitCode(err))
	}
}

// TestRunSkipsPullForLocalImages requires harness-local references to run
// from the local store: no registry serves the derived ayokoding-toolchain
// tags or the ayokoding-env tags, so pulling them always fails.
func TestRunSkipsPullForLocalImages(t *testing.T) {
	images := []struct {
		name  string
		image string
	}{
		{"derived tag", "ayokoding-toolchain/typescript:b7c9c03f556ecef1da8571cb3ddceb9697254b8d4b0a473b73672eb4821bdd14@sha256:b7c9c03f556ecef1da8571cb3ddceb9697254b8d4b0a473b73672eb4821bdd14"},
		{"environment tag", "ayokoding-env/python:abc123"},
	}
	for _, row := range images {
		t.Run(row.name, func(t *testing.T) {
			cat := testCatalog()
			for index := range cat.Toolchains {
				if cat.Toolchains[index].ID == "python" {
					cat.Toolchains[index].Image = row.image
				}
			}
			fake := &scriptedRuntime{
				run:     okExecution("hello\n"),
				pullErr: &finding.Error{Code: finding.EnvRuntimeRefused, Message: "registry has no local tag"},
			}
			req := baseRunRequest(helloCourse(), fake)
			req.Catalog = cat
			report, err := application.Run(context.Background(), req)
			if err != nil {
				t.Fatalf("Run=%v, want nil", err)
			}
			if len(report.Passed) != 1 {
				t.Fatalf("passed=%d, want 1", len(report.Passed))
			}
			if len(fake.pulled) != 0 {
				t.Fatalf("pulled=%q, want no registry pull", fake.pulled)
			}
		})
	}
}

// TestRunExecutesLocalDerivedImageByBareTag requires derived-image runs to
// pass the bare tag to the container CLI: locally-built images carry no
// RepoDigest, so the daemon answers "Unable to find image locally" plus
// "pull access denied" (exit 125) for the digest-suffixed ref while the
// bare tag resolves. Official pinned-digest images keep their digest ref.
func TestRunExecutesLocalDerivedImageByBareTag(t *testing.T) {
	const hash = "b7c9c03f556ecef1da8571cb3ddceb9697254b8d4b0a473b73672eb4821bdd14"
	rows := []struct {
		name        string
		image       string
		wantContain string
		wantAbsent  string
		pullErr     error
	}{
		{
			name:        "local derived runs by bare tag",
			image:       "ayokoding-toolchain/python:" + hash + "@sha256:" + hash,
			wantContain: " ayokoding-toolchain/python:" + hash + " ",
			wantAbsent:  "@sha256:",
			pullErr:     &finding.Error{Code: finding.EnvRuntimeRefused, Message: "registry has no local tag"},
		},
		{
			name:        "official keeps its digest ref",
			image:       "docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			wantContain: " docker.io/library/python:3.15.0@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ",
			pullErr:     nil,
		},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			cat := testCatalog()
			for index := range cat.Toolchains {
				if cat.Toolchains[index].ID == "python" {
					cat.Toolchains[index].Image = row.image
				}
			}
			fake := &scriptedRuntime{
				run:     okExecution("hello\n"),
				pullErr: row.pullErr,
			}
			req := baseRunRequest(helloCourse(), fake)
			req.Catalog = cat
			report, err := application.Run(context.Background(), req)
			if err != nil {
				t.Fatalf("Run=%v, want nil", err)
			}
			if len(report.Passed) != 1 {
				t.Fatalf("passed=%d, want 1", len(report.Passed))
			}
			argv := runArgv(fake)
			if !strings.Contains(argv, row.wantContain) {
				t.Fatalf("argv misses %q (argv=%q)", row.wantContain, argv)
			}
			if row.wantAbsent != "" && strings.Contains(argv, row.wantAbsent) {
				t.Fatalf("argv keeps unresolvable %q (argv=%q)", row.wantAbsent, argv)
			}
		})
	}
}

// TestRunPassesToolchainPlatform requires the run path to carry --platform
// exactly when the toolchain names one: the x64-only flutter SDK runs under
// emulation on arm64 hosts, while official multi-arch images plan no flag.
func TestRunPassesToolchainPlatform(t *testing.T) {
	rows := []struct {
		name        string
		platform    string
		wantContain string
		wantAbsent  string
	}{
		{
			name:        "platform pinned carries the flag",
			platform:    "linux/amd64",
			wantContain: " --platform linux/amd64 ",
		},
		{
			name:       "official without platform plans no flag",
			platform:   "",
			wantAbsent: "--platform",
		},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			cat := testCatalog()
			for index := range cat.Toolchains {
				if cat.Toolchains[index].ID == "python" {
					cat.Toolchains[index].Platform = row.platform
				}
			}
			fake := &scriptedRuntime{run: okExecution("hello\n")}
			req := baseRunRequest(helloCourse(), fake)
			req.Catalog = cat
			report, err := application.Run(context.Background(), req)
			if err != nil {
				t.Fatalf("Run=%v, want nil", err)
			}
			if len(report.Passed) != 1 {
				t.Fatalf("passed=%d, want 1", len(report.Passed))
			}
			argv := runArgv(fake)
			if row.wantContain != "" && !strings.Contains(argv, row.wantContain) {
				t.Fatalf("argv misses %q (argv=%q)", row.wantContain, argv)
			}
			if row.wantAbsent != "" && strings.Contains(argv, row.wantAbsent) {
				t.Fatalf("argv carries %q (argv=%q)", row.wantAbsent, argv)
			}
		})
	}
}

// TestRunTracksExecutionContainers requires every execution container to
// join the interrupt cleanup set under its planned name.
func TestRunTracksExecutionContainers(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Passed) != 1 {
		t.Fatalf("passed=%d, want 1", len(report.Passed))
	}
	want := []string{"ayokoding-test-run-1-0", "ayokoding-test-run-1-1"}
	if len(fake.trackedContainers) != len(want) {
		t.Fatalf("tracked=%q, want %q", fake.trackedContainers, want)
	}
	for index, name := range want {
		if fake.trackedContainers[index] != name {
			t.Fatalf("tracked=%q, want %q", fake.trackedContainers, want)
		}
	}
}

// TestRunCleansTrackedResourcesOnInterrupt requires a cancelled command
// context to remove the tracked containers and networks.
func TestRunCleansTrackedResourcesOnInterrupt(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		cancel()
		return application.Execution{Exit: 0, Stdout: "hello\n"}, nil
	}}
	_, _ = application.Run(ctx, baseRunRequest(helloCourse(), fake))
	if fake.cleaned != 1 {
		t.Fatalf("cleaned=%d, want one interrupt cleanup", fake.cleaned)
	}
}

// TestRunMapsRawTimeout requires a raw deadline error under the run
// timeout to fail as a timed-out result.
func TestRunMapsRawTimeout(t *testing.T) {
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{}, context.DeadlineExceeded
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeRunTimeout, "main")
}

// TestRunWrapsGenericFailure requires an unclassified runtime failure to
// exit 2.
func TestRunWrapsGenericFailure(t *testing.T) {
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{}, errStepBoom
	}}
	_, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
}

// TestRunNondeterministicExit requires differing exit statuses to fail as
// nondeterministic.
func TestRunNondeterministicExit(t *testing.T) {
	calls := 0
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		calls++
		return application.Execution{Exit: calls - 1, Stdout: "hello\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeNondeterministic, "first exit 0", "second exit 1")
}

// TestRunNondeterministicStderr requires differing standard errors to fail
// as nondeterministic.
func TestRunNondeterministicStderr(t *testing.T) {
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
      stderr: expected/main.stderr.txt
`,
		"demo/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"demo/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
		"demo/learning/code/ex-01-hello/expected/main.stderr.txt": "steady\n",
	})
	calls := 0
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		calls++
		if calls%2 == 1 {
			return application.Execution{Exit: 0, Stdout: "hello\n", Stderr: "steady\n"}, nil
		}
		return application.Execution{Exit: 0, Stdout: "hello\n", Stderr: "wobbly\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeNondeterministic, "standard error", "steady", "wobbly")
}

// TestRunHonoursCancel requires a cancelled context to stop the run.
func TestRunHonoursCancel(t *testing.T) {
	cancelled, cancel := context.WithCancel(context.Background())
	cancel()
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	_, err := application.Run(cancelled, baseRunRequest(helloCourse(), fake))
	if err == nil {
		t.Fatal("err=nil, want the cancelled context")
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution when cancelled", len(fake.calls))
	}
}

// TestRunSelectsAllOptedIn requires --all to run every opted-in course.
func TestRunSelectsAllOptedIn(t *testing.T) {
	content := helloCourse()
	maps.Copy(content, runContent(map[string]string{
		"extra/learning/code/ex-01-hello/run.yaml":                 validRunSpec,
		"extra/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"extra/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
	}))
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(content, fake)
	req.Courses = nil
	req.All = true
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Passed) != 2 {
		t.Fatalf("passed=%+v, want both courses passing", report.Passed)
	}
}

// TestRunGeneratesRunID requires an empty run identity to run with a
// generated one.
func TestRunGeneratesRunID(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	req.RunID = ""
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Passed) != 1 {
		t.Fatalf("passed=%+v, want one pass", report.Passed)
	}
	if !strings.Contains(runArgv(fake), "--label ayokoding.run=") {
		t.Fatalf("argv misses the generated run label (argv=%q)", runArgv(fake))
	}
}

// TestRunNetworkCreateFailure requires a refused network creation to stop
// the run with its environment status before any unit runs.
func TestRunNetworkCreateFailure(t *testing.T) {
	refused := &finding.Error{Code: finding.EnvRuntimeRefused, Message: "daemon hiccup"}
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		if len(invoke.Args) > 0 && invoke.Args[0] == "network" {
			return application.Execution{}, refused
		}
		return application.Execution{Exit: 0}, nil
	}}
	clock := &serviceClock{now: time.Now()}
	req := withServiceClock(baseRunRequest(runContent(serviceCourse()), fake), clock)
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 125 {
		t.Fatalf("exit=%d, want 125", finding.ExitCode(err))
	}
	for _, call := range fake.calls {
		if containsImageRun(call.invoke.Args) {
			t.Fatalf("unit ran after the network failure (argv=%q)", call.invoke.Args)
		}
	}
}

// TestRunSecondExecutionFailure requires a failed second execution to
// exit 2.
func TestRunSecondExecutionFailure(t *testing.T) {
	calls := 0
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		calls++
		if calls == 1 {
			return application.Execution{Exit: 0, Stdout: "hello\n"}, nil
		}
		return application.Execution{}, errStepBoom
	}}
	_, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
}

// TestRunCancelledDuringExecution requires an interrupt mid-run to report
// the cancellation instead of the runtime failure.
func TestRunCancelledDuringExecution(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	calls := 0
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		calls++
		if calls == 1 {
			cancel()
			return application.Execution{Exit: 0, Stdout: "hello\n"}, nil
		}
		return application.Execution{}, errStepBoom
	}}
	_, err := application.Run(ctx, baseRunRequest(helloCourse(), fake))
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("err=%v, want context.Canceled", err)
	}
}

// TestRunStderrFileMismatch requires a differing standard error file to
// fail at the first differing line.
func TestRunStderrFileMismatch(t *testing.T) {
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
      stderr: expected/main.stderr.txt
`,
		"demo/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"demo/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
		"demo/learning/code/ex-01-hello/expected/main.stderr.txt": "steady\n",
	})
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{Exit: 0, Stdout: "hello\n", Stderr: "wobbly\n"}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStderrMismatch, "line 1", "steady", "wobbly")
}

// TestRunTrailingNewlineMissing requires an actual output without the
// trailing newline to fail at the missing line.
func TestRunTrailingNewlineMissing(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello")}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStdoutMismatch, "line 2")
}

// TestRunTrailingNewlineExtra requires an actual output with an extra
// trailing newline to fail at the added line.
func TestRunTrailingNewlineExtra(t *testing.T) {
	content := helloCourse()
	content["demo/learning/code/ex-01-hello/expected/main.stdout.txt"] = &fstest.MapFile{Data: []byte("hello")}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStdoutMismatch, "line 2")
}
