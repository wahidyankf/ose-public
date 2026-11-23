package application_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// stdinCourse carries one run fed by an input file.
func stdinCourse() map[string]string {
	return map[string]string{
		"demo/learning/code/ex-01-echo/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, echo.py]
    stdin: input.txt
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`,
		"demo/learning/code/ex-01-echo/echo.py":                  "print(input())\n",
		"demo/learning/code/ex-01-echo/input.txt":                "typed\n",
		"demo/learning/code/ex-01-echo/expected/main.stdout.txt": "typed\n",
	}
}

// TestRunFeedsStdin requires the input file bytes to reach the runtime
// with --interactive in the argv.
func TestRunFeedsStdin(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("typed\n")}
	report, err := application.Run(context.Background(), baseRunRequest(runContent(stdinCourse()), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if len(fake.calls) == 0 || string(fake.calls[0].stdin) != "typed\n" {
		t.Fatalf("stdin=%q, want the input file bytes", fake.calls[0].stdin)
	}
	if !strings.Contains(runArgv(fake), "--interactive") {
		t.Fatalf("argv misses --interactive with stdin (argv=%q)", runArgv(fake))
	}
}

// TestRunMissingStdinFails requires a missing input file to fail fast.
func TestRunMissingStdinFails(t *testing.T) {
	files := stdinCourse()
	delete(files, "demo/learning/code/ex-01-echo/input.txt")
	fake := &scriptedRuntime{run: okExecution("typed\n")}
	_, err := application.Run(context.Background(), baseRunRequest(runContent(files), fake))
	if err == nil {
		t.Fatal("err=nil, want the missing input failure")
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without stdin", len(fake.calls))
	}
}

// fakeEnvBuilder scripts environment image builds.
type fakeEnvBuilder struct {
	tag   string
	err   error
	calls int
}

// BuildDerived is unused by runs.
func (fake *fakeEnvBuilder) BuildDerived(_ context.Context, _ containerplan.Settings, _, _, _ string, _ []byte, _ []string) (string, error) {
	return "", nil
}

// BuildEnvironment records the build and replays the scripted outcome.
func (fake *fakeEnvBuilder) BuildEnvironment(_ context.Context, _ containerplan.Settings, _, _, _, _ string, _ []byte, _ catalog.Install) (string, error) {
	fake.calls++
	return fake.tag, fake.err
}

// lockfileCourse carries one unit with a hash-locked requirements file.
func lockfileCourse() map[string]string {
	return map[string]string{
		"demo/learning/code/ex-01-deps/run.yaml": `schema: ayokoding.run/v1
toolchain: python
dependencies:
  lockfile: learning/code/ex-01-deps/requirements.lock
runs:
  - name: main
    command: [python3, example.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`,
		"demo/learning/code/ex-01-deps/example.py":               "print('hello')\n",
		"demo/learning/code/ex-01-deps/requirements.lock":        "requests==2.32.0\n",
		"demo/learning/code/ex-01-deps/expected/main.stdout.txt": "hello\n",
	}
}

// TestRunBuildsEnvironmentImage requires a locked unit to run in its
// environment image.
func TestRunBuildsEnvironmentImage(t *testing.T) {
	builder := &fakeEnvBuilder{tag: "ayokoding-env/python:abc123"}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(runContent(lockfileCourse()), fake)
	req.EnvBuilder = builder
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if builder.calls != 1 {
		t.Fatalf("env builds=%d, want one", builder.calls)
	}
	if !strings.Contains(runArgv(fake), "ayokoding-env/python:abc123") {
		t.Fatalf("runs miss the environment image (argv=%q)", runArgv(fake))
	}
	if len(fake.pulled) != 0 {
		t.Fatalf("pulled=%q, want no pull for local environment tags", fake.pulled)
	}
}

// TestRunEnvBuildFailureRequiresFinding requires a failed environment
// build to report the result finding without running the unit.
func TestRunEnvBuildFailureRequiresFinding(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(runContent(lockfileCourse()), fake)
	req.EnvBuilder = &fakeEnvBuilder{err: errPipFailed}
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil (build failures are negative results)", err)
	}
	requireFinding(t, report, application.CodeEnvBuildFailed, "hash mismatch")
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without the image", len(fake.calls))
	}
}

// TestRunMissingLockfileRequiresFinding requires a missing lockfile to
// report the environment finding without running the unit.
func TestRunMissingLockfileRequiresFinding(t *testing.T) {
	files := lockfileCourse()
	delete(files, "demo/learning/code/ex-01-deps/requirements.lock")
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(runContent(files), fake)
	req.EnvBuilder = &fakeEnvBuilder{tag: "unused"}
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeEnvBuildFailed, "requirements.lock")
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without the lockfile", len(fake.calls))
	}
}

// TestRunLockfileWithoutBuilderFails requires a locked unit with no image
// builder to exit 2.
func TestRunLockfileWithoutBuilderFails(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(runContent(lockfileCourse()), fake)
	_, err := application.Run(context.Background(), req)
	if _, ok := errors.AsType[*finding.Error](err); !ok {
		t.Fatalf("err=%T %v, want a usage error", err, err)
	}
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
}

// TestRunTruncatesLongLines requires mismatch messages to bound long lines
// instead of pasting them whole.
func TestRunTruncatesLongLines(t *testing.T) {
	long := strings.Repeat("x", 400)
	fake := &scriptedRuntime{run: okExecution("hello\n" + long + "\n")}
	report, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	for _, found := range report.Findings {
		if found.Code != application.CodeStdoutMismatch {
			continue
		}
		if strings.Contains(found.Message, long) {
			t.Fatalf("message pastes the whole line (message=%q)", found.Message)
		}
		if !strings.Contains(found.Message, "line 2") {
			t.Fatalf("message misses the line number (message=%q)", found.Message)
		}
		return
	}
	t.Fatalf("no stdout mismatch in %+v", report.Findings)
}

// TestRunNamesMissingLine requires a shorter actual output to fail at the
// first missing line.
func TestRunNamesMissingLine(t *testing.T) {
	content := helloCourse()
	content["demo/learning/code/ex-01-hello/expected/main.stdout.txt"] = &fstest.MapFile{Data: []byte("hello\nworld\n")}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	requireFinding(t, report, application.CodeStdoutMismatch, "line 2")
}

// TestRunInvalidLinkParent requires an unmakable link folder to fail fast.
func TestRunInvalidLinkParent(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	req.Links = []containerplan.Link{{Name: "bad\x00dir/node_modules", Target: "/deps/node_modules"}}
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without the links", len(fake.calls))
	}
}

// TestRunDuplicateLinks requires a repeated link name to fail fast.
func TestRunDuplicateLinks(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(helloCourse(), fake)
	req.Links = []containerplan.Link{
		{Name: "node_modules", Target: "/deps/a"},
		{Name: "node_modules", Target: "/deps/b"},
	}
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without the links", len(fake.calls))
	}
}

// TestRunInvalidCopyName requires an uncopyable unit file name to fail the
// working copy without executing.
func TestRunInvalidCopyName(t *testing.T) {
	content := helloCourse()
	content["demo/learning/code/ex-01-hello/bad\x00name.py"] = &fstest.MapFile{Data: []byte("print('bad')\n")}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	_, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err == nil {
		t.Fatal("err=nil, want the working copy failure")
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without the copy", len(fake.calls))
	}
}

// TestRunInvalidCopyDir requires an unmakable unit folder to fail the
// working copy without executing.
func TestRunInvalidCopyDir(t *testing.T) {
	content := helloCourse()
	content["demo/learning/code/ex-01-hello/bad\x00dir/ok.py"] = &fstest.MapFile{Data: []byte("print('ok')\n")}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	_, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err == nil {
		t.Fatal("err=nil, want the working copy failure")
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without the copy", len(fake.calls))
	}
}

func TestRunEnvPreflightFailurePreservesStatus(t *testing.T) {
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(runContent(lockfileCourse()), fake)
	req.EnvBuilder = &fakeEnvBuilder{err: &finding.Error{Code: finding.EnvRuntimeRefused, Message: "rootful"}}
	_, err := application.Run(context.Background(), req)
	if got := finding.ExitCode(err); got != 125 {
		t.Fatalf("status=%d err=%v, want 125", got, err)
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no workload", len(fake.calls))
	}
}
