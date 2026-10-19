package application_test

import (
	"context"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// simulationCourse carries one simulation run printing the seed summary.
func simulationCourse(output string) map[string]string {
	return map[string]string{
		"demo/learning/code/ex-01-sim/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, sim.py]
    simulation: true
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`,
		"demo/learning/code/ex-01-sim/sim.py":                   "print('sim')\n",
		"demo/learning/code/ex-01-sim/expected/main.stdout.txt": output,
	}
}

// TestRunSimulationRequiresSummary requires a simulation without the seed
// summary line to fail.
func TestRunSimulationRequiresSummary(t *testing.T) {
	content := runContent(simulationCourse("just some lines\n"))
	fake := &scriptedRuntime{run: okExecution("just some lines\n")}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeSimulationSummary, "summary")
}

// TestRunSimulationRejectsFewSeeds requires a summary under 32 seeds to
// fail naming the total.
func TestRunSimulationRejectsFewSeeds(t *testing.T) {
	summary := "seeds: 8 passed, 0 failed (of 8)\n"
	content := runContent(simulationCourse(summary))
	fake := &scriptedRuntime{run: okExecution(summary)}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeSimulationSummary, "8")
}

// TestRunSimulationPasses requires a 64-seed summary to pass.
func TestRunSimulationPasses(t *testing.T) {
	summary := "seeds: 64 passed, 0 failed (of 64)\n"
	content := runContent(simulationCourse(summary))
	fake := &scriptedRuntime{run: okExecution(summary)}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
}

// TestRunBugDemoExpectsFailure requires a simulation expecting failing
// seeds to pass when it finds them.
func TestRunBugDemoExpectsFailure(t *testing.T) {
	output := "failing seed: 4 (one leader per term)\nfailing seed: 31 (one leader per term)\nseeds: 62 passed, 2 failed (of 64)\n"
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-sim/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, sim.py]
    simulation: true
    expect:
      exit: 1
      stdout: expected/main.stdout.txt
`,
		"demo/learning/code/ex-01-sim/sim.py":                   "print('sim')\n",
		"demo/learning/code/ex-01-sim/expected/main.stdout.txt": output,
	})
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{Exit: 1, Stdout: output}, nil
	}}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
}

// TestRunReplaySkipsComparison requires a seed replay to set
// AYOKODING_SEED, run once, print the trace, and skip the expected-output
// comparison.
func TestRunReplaySkipsComparison(t *testing.T) {
	trace := "t=3 deliver vote trace for seed 17\n"
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-sim/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, sim.py]
    simulation: true
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`,
		"demo/learning/code/ex-01-sim/sim.py":                   "print('sim')\n",
		"demo/learning/code/ex-01-sim/expected/main.stdout.txt": "seeds: 64 passed, 0 failed (of 64)\n",
	})
	fake := &scriptedRuntime{run: func(_ containerplan.Invocation, _ []byte) (application.Execution, error) {
		return application.Execution{Exit: 0, Stdout: trace}, nil
	}}
	req := baseRunRequest(content, fake)
	req.Unit = "learning/code/ex-01-sim"
	seed := 17
	req.Seed = &seed
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if len(fake.calls) != 1 {
		t.Fatalf("calls=%d, want one replay execution", len(fake.calls))
	}
	if !strings.Contains(runArgv(fake), "AYOKODING_SEED=17") {
		t.Fatalf("replay misses AYOKODING_SEED=17 (argv=%q)", runArgv(fake))
	}
	if len(report.Replays) != 1 || report.Replays[0].Stdout != trace || report.Replays[0].Seed != 17 {
		t.Fatalf("replays=%+v, want the seed 17 trace", report.Replays)
	}
	if len(report.Passed) != 1 || report.Passed[0].Label != "passed" {
		t.Fatalf("passed=%+v, want the clean replay labelled passed", report.Passed)
	}
}

// TestRunReplayFailsNonzeroExit requires a replayed seed exiting nonzero
// to fail.
func TestRunReplayFailsNonzeroExit(t *testing.T) {
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-sim/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, sim.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`,
		"demo/learning/code/ex-01-sim/sim.py":                   "print('sim')\n",
		"demo/learning/code/ex-01-sim/expected/main.stdout.txt": "ok\n",
	})
	fake := &scriptedRuntime{run: func(containerplan.Invocation, []byte) (application.Execution, error) {
		return application.Execution{Exit: 2, Stdout: "boom\n"}, nil
	}}
	req := baseRunRequest(content, fake)
	req.Unit = "learning/code/ex-01-sim"
	seed := 17
	req.Seed = &seed
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeExitMismatch, "expected exit 0", "actual 2")
}

// writeDiskCourse materializes course files under a temporary directory
// for the record tests, which need a writable content root. Content reads
// go through the directory filesystem so permission failures stay
// observable.
func writeDiskCourse(t *testing.T, files map[string]string) (fs.FS, string) {
	t.Helper()
	root := t.TempDir()
	for name, body := range files {
		path := filepath.Join(root, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
			t.Fatalf("mkdir %q: %v", path, err)
		}
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatalf("write %q: %v", path, err)
		}
	}
	return os.DirFS(root), root
}

// chmodCourse changes one fixture file mode for the permission tests.
func chmodCourse(t *testing.T, root, name string, mode os.FileMode) {
	t.Helper()
	if err := os.Chmod(filepath.Join(root, filepath.FromSlash(name)), mode); err != nil {
		t.Fatalf("chmod %q: %v", name, err)
	}
}

// TestRunRecordWritesOnlyMissing requires --record to write the missing
// expected file with the run output while leaving existing files alone.
func TestRunRecordWritesOnlyMissing(t *testing.T) {
	files := map[string]string{
		"demo/learning/code/ex-01-two/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: first
    command: [python3, one.py]
    expect:
      exit: 0
      stdout: expected/first.stdout.txt
  - name: second
    command: [python3, two.py]
    expect:
      exit: 0
      stdout: expected/second.stdout.txt
`,
		"demo/learning/code/ex-01-two/one.py":                    "print('one')\n",
		"demo/learning/code/ex-01-two/two.py":                    "print('two')\n",
		"demo/learning/code/ex-01-two/expected/first.stdout.txt": "one\n",
	}
	content, root := writeDiskCourse(t, files)
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		if strings.Contains(strings.Join(invoke.Args, " "), "one.py") {
			return application.Execution{Exit: 0, Stdout: "one\n"}, nil
		}
		return application.Execution{Exit: 0, Stdout: "two\n"}, nil
	}}
	req := baseRunRequest(content, fake)
	req.Record = true
	req.ContentDir = root
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStdoutMismatch, "second.stdout.txt")
	written, readErr := os.ReadFile(filepath.Join(root, "demo/learning/code/ex-01-two/expected/second.stdout.txt"))
	if readErr != nil {
		t.Fatalf("missing file not recorded: %v", readErr)
	}
	if string(written) != "two\n" {
		t.Fatalf("recorded=%q, want the run output", written)
	}
	kept, readErr := os.ReadFile(filepath.Join(root, "demo/learning/code/ex-01-two/expected/first.stdout.txt"))
	if readErr != nil || string(kept) != "one\n" {
		t.Fatalf("existing file changed: %q, err=%v", kept, readErr)
	}
}

// TestRunRecordNeedsContentDir requires --record without a writable
// content root to exit 2.
func TestRunRecordNeedsContentDir(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	req.Record = true
	_, err := application.Run(context.Background(), req)
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok || coded.Code != finding.UsageInvalidArguments {
		t.Fatalf("err=%v, want the invalid-arguments usage error", err)
	}
}

// TestRunMissingExpectedWithoutRecord requires a missing expected file to
// fail naming the file and the --record flag.
func TestRunMissingExpectedWithoutRecord(t *testing.T) {
	files := map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":   validRunSpec,
		"demo/learning/code/ex-01-hello/example.py": "print('hello')\n",
	}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	report, err := application.Run(context.Background(), baseRunRequest(runContent(files), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStdoutMismatch, "main.stdout.txt", "--record")
}

// TestRunStaticLabel requires a static unit to run only its validator
// command and pass labelled passed (static).
func TestRunStaticLabel(t *testing.T) {
	content := runContent(map[string]string{
		"demo/learning/code/ex-01-parse/run.yaml": `schema: ayokoding.run/v1
toolchain: python
mode: static
static:
  reason: ios
  note: Syntax only; UIKit exists only on Apple platforms.
runs:
  - name: parse
    command: [swiftc, -parse, App.swift]
    expect:
      exit: 0
      stdout: expected/parse.stdout.txt
`,
		"demo/learning/code/ex-01-parse/App.swift":                 "print('app')\n",
		"demo/learning/code/ex-01-parse/expected/parse.stdout.txt": "static ok\n",
	})
	fake := &scriptedRuntime{run: okExecution("static ok\n")}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if len(report.Passed) != 1 || report.Passed[0].Label != "passed (static)" {
		t.Fatalf("passed=%+v, want one passed (static) pass", report.Passed)
	}
	for _, call := range fake.calls {
		if strings.Contains(strings.Join(call.invoke.Args, " "), "App.swift") &&
			!strings.Contains(strings.Join(call.invoke.Args, " "), "swiftc") {
			t.Fatalf("program ran instead of the validator (argv=%q)", call.invoke.Args)
		}
	}
}
