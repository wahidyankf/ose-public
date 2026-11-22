//go:build integration

package application_test

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// TestRunMaterializesLinks requires caller-supplied working-copy symlinks
// to exist beside the unit when the container runs.
func TestRunMaterializesLinks(t *testing.T) {
	seen := map[string]string{}
	fake := &scriptedRuntime{run: func(invoke containerplan.Invocation, _ []byte) (application.Execution, error) {
		for _, arg := range invoke.Args {
			const prefix = "type=bind,source="
			if !strings.HasPrefix(arg, prefix) {
				continue
			}
			source := strings.TrimSuffix(strings.TrimPrefix(arg, prefix), ",target=/work")
			target, readErr := os.Readlink(filepath.Join(source, "learning/code/ex-01-hello", "node_modules"))
			if readErr != nil {
				seen["error"] = readErr.Error()
				continue
			}
			seen["node_modules"] = target
		}
		return application.Execution{Exit: 0, Stdout: "hello\n"}, nil
	}}
	req := baseRunRequest(helloCourse(), fake)
	req.Links = []containerplan.Link{{Name: "node_modules", Target: "/deps/node_modules"}}
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if seen["node_modules"] != "/deps/node_modules" {
		t.Fatalf("links=%v, want the node_modules symlink live at execution", seen)
	}
}

// TestRunReplaySkipsRecord requires a replay to never write expected files.
func TestRunReplaySkipsRecord(t *testing.T) {
	files := map[string]string{
		"demo/learning/code/ex-01-sim/run.yaml": `schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, sim.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
`,
		"demo/learning/code/ex-01-sim/sim.py": "print('sim')\n",
	}
	content, root := writeDiskCourse(t, files)
	fake := &scriptedRuntime{run: okExecution("trace for seed 5\n")}
	req := baseRunRequest(content, fake)
	req.Record = true
	req.ContentDir = root
	req.Unit = "learning/code/ex-01-sim"
	seed := 5
	req.Seed = &seed
	report, err := application.Run(context.Background(), req)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
	if _, statErr := os.Stat(filepath.Join(root, "demo/learning/code/ex-01-sim/expected/main.stdout.txt")); !os.IsNotExist(statErr) {
		t.Fatalf("replay recorded the expected file (err=%v)", statErr)
	}
}

// helloDiskCourse carries the hello unit on disk for the permission tests.
func helloDiskCourse() map[string]string {
	return map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":                 validRunSpec,
		"demo/learning/code/ex-01-hello/example.py":               "print('hello')\n",
		"demo/learning/code/ex-01-hello/expected/main.stdout.txt": "hello\n",
	}
}

// TestRunDirectoryRunSpecFails requires a run spec path holding a directory
// to fail fast.
func TestRunDirectoryRunSpecFails(t *testing.T) {
	unit := "demo/learning/code/ex-01-hello"
	files := helloDiskCourse()
	delete(files, unit+"/run.yaml")
	content, root := writeDiskCourse(t, files)
	if err := os.Mkdir(filepath.Join(root, filepath.FromSlash(unit+"/run.yaml")), 0o750); err != nil {
		t.Fatalf("mkdir run.yaml dir: %v", err)
	}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	_, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err == nil {
		t.Fatal("err=nil, want the unreadable spec failure")
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without the spec", len(fake.calls))
	}
}

// TestRunUnreadableProgramFile requires an unreadable program file to fail
// the working copy without executing.
func TestRunUnreadableProgramFile(t *testing.T) {
	content, root := writeDiskCourse(t, helloDiskCourse())
	chmodCourse(t, root, "demo/learning/code/ex-01-hello/example.py", 0o000)
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	_, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err == nil {
		t.Fatal("err=nil, want the working copy failure")
	}
	if len(fake.calls) != 0 {
		t.Fatalf("calls=%d, want no execution without the copy", len(fake.calls))
	}
}

// TestRunSkipsSymlinks requires course symlinks to stay out of the working
// copy without failing the run.
func TestRunSkipsSymlinks(t *testing.T) {
	content, root := writeDiskCourse(t, helloDiskCourse())
	link := filepath.Join(root, filepath.FromSlash("demo/learning/code/ex-01-hello/link.py"))
	target := filepath.Join(root, filepath.FromSlash("demo/learning/code/ex-01-hello/example.py"))
	if err := os.Symlink(target, link); err != nil {
		t.Fatalf("symlink fixture: %v", err)
	}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	report, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if len(report.Findings) != 0 {
		t.Fatalf("findings=%+v, want none", report.Findings)
	}
}

// TestRunDirectoryExpectedFile requires an expected file path holding a
// directory to exit 2.
func TestRunDirectoryExpectedFile(t *testing.T) {
	files := helloDiskCourse()
	delete(files, "demo/learning/code/ex-01-hello/expected/main.stdout.txt")
	content, root := writeDiskCourse(t, files)
	if err := os.MkdirAll(filepath.Join(root, filepath.FromSlash("demo/learning/code/ex-01-hello/expected/main.stdout.txt")), 0o750); err != nil {
		t.Fatalf("mkdir expected dir: %v", err)
	}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	_, err := application.Run(context.Background(), baseRunRequest(content, fake))
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
}

// TestRunRecordMkdirFailure requires an unwritable record root to exit 2.
func TestRunRecordMkdirFailure(t *testing.T) {
	files := map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":   validRunSpec,
		"demo/learning/code/ex-01-hello/example.py": "print('hello')\n",
	}
	content, root := writeDiskCourse(t, files)
	anchor := filepath.Join(root, "anchor.txt")
	if err := os.WriteFile(anchor, []byte("anchor"), 0o644); err != nil {
		t.Fatalf("write anchor: %v", err)
	}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(content, fake)
	req.Record = true
	req.ContentDir = anchor
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
}

// TestRunRecordStderrMkdirFailure requires a failing stderr record to exit
// 2 after a matching stdout.
func TestRunRecordStderrMkdirFailure(t *testing.T) {
	files := map[string]string{
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
	}
	content, root := writeDiskCourse(t, files)
	anchor := filepath.Join(root, "anchor.txt")
	if err := os.WriteFile(anchor, []byte("anchor"), 0o644); err != nil {
		t.Fatalf("write anchor: %v", err)
	}
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(content, fake)
	req.Record = true
	req.ContentDir = anchor
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
}

// TestRunRecordWriteFailure requires an unwritable expected directory to
// exit 2.
func TestRunRecordWriteFailure(t *testing.T) {
	files := map[string]string{
		"demo/learning/code/ex-01-hello/run.yaml":   validRunSpec,
		"demo/learning/code/ex-01-hello/example.py": "print('hello')\n",
	}
	content, root := writeDiskCourse(t, files)
	expected := filepath.Join(root, filepath.FromSlash("demo/learning/code/ex-01-hello/expected"))
	if err := os.MkdirAll(expected, 0o750); err != nil {
		t.Fatalf("mkdir expected: %v", err)
	}
	chmodCourse(t, root, "demo/learning/code/ex-01-hello/expected", 0o555)
	defer chmodCourse(t, root, "demo/learning/code/ex-01-hello/expected", 0o750)
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	req := baseRunRequest(content, fake)
	req.Record = true
	req.ContentDir = root
	_, err := application.Run(context.Background(), req)
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
}

// TestRunWorkingCopyFailure requires a failing temporary directory to
// exit 2.
func TestRunWorkingCopyFailure(t *testing.T) {
	t.Setenv("TMPDIR", filepath.Join(t.TempDir(), "missing-parent"))
	fake := &scriptedRuntime{run: okExecution("hello\n")}
	_, err := application.Run(context.Background(), baseRunRequest(helloCourse(), fake))
	if finding.ExitCode(err) != 2 {
		t.Fatalf("exit=%d, want 2", finding.ExitCode(err))
	}
}
