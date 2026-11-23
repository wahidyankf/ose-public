package containers_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// missingCLI names a binary the unit run never provides, so the supervised
// runner fails before starting any process.
const missingCLI = "no-such-container-binary-ayokoding-test"

// TestRunFailsClosedOnMissingBinary requires a missing CLI to report 127
// with the run input attached but no process started.
func TestRunFailsClosedOnMissingBinary(t *testing.T) {
	runtime := &containers.Runtime{}
	invoke := containerplan.Invocation{Binary: missingCLI, Args: []string{"info"}}
	_, err := runtime.Run(context.Background(), invoke, []byte("typed\n"))
	requireEnvCode(t, err, finding.EnvNotFound, 127)
}

// TestControlPlaneRunnerRefusesFailingBinary requires the nil-Exec
// control-plane runner to refuse a failing CLI with 125.
func TestControlPlaneRunnerRefusesFailingBinary(t *testing.T) {
	runtime := &containers.Runtime{CLI: "/bin/false"}
	requireEnvCode(t, runtime.Pull(context.Background(), "img:tag"), finding.EnvRuntimeRefused, 125)
}

// TestWaitReadyYieldsToExpiredContext requires an expiry landing inside the
// poll sleep to interrupt the wait. The 50ms deadline against the hour poll
// keeps the expiry inside the sleep deterministically.
func TestWaitReadyYieldsToExpiredContext(t *testing.T) {
	moment := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	runtime := &containers.Runtime{
		Exec:      fakeExec("", errFakeExec),
		Now:       func() time.Time { return moment },
		ReadyPoll: time.Hour,
	}
	ctx, stop := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer stop()
	err := runtime.WaitReady(ctx, "db", []string{"ready"}, time.Hour)
	if err == nil || !strings.Contains(err.Error(), "context deadline exceeded") {
		t.Fatalf("WaitReady=%v, want the expiry inside the poll sleep", err)
	}
}

// TestRunReportsRealExitStatus requires a real exit-zero binary to report
// success through the supervised runner.
func TestRunReportsRealExitStatus(t *testing.T) {
	runtime := &containers.Runtime{}
	result, err := runtime.Run(context.Background(), containerplan.Invocation{Binary: "/bin/true", Args: nil}, nil)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if result.ExitCode != 0 {
		t.Fatalf("exit=%d, want 0", result.ExitCode)
	}
}

// TestRunInterruptsRealSleep requires cancellation and expiry to kill a
// running child through its process group.
func TestRunInterruptsRealSleep(t *testing.T) {
	invoke := containerplan.Invocation{Binary: "/bin/sleep", Args: []string{"60"}}
	t.Run("cancelled context interrupts the run", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		_, err := (&containers.Runtime{}).Run(ctx, invoke, nil)
		if err == nil || !strings.Contains(err.Error(), "interrupted") {
			t.Fatalf("Run=%v, want the interruption", err)
		}
	})
	t.Run("expired deadline times the run out", func(t *testing.T) {
		past := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
		ctx, stop := context.WithDeadline(context.Background(), past)
		defer stop()
		_, err := (&containers.Runtime{}).Run(ctx, invoke, nil)
		if err == nil || !strings.Contains(err.Error(), "timed out") {
			t.Fatalf("Run=%v, want the timeout", err)
		}
	})
}

// rootlessProbe answers the container probe with a rootless engine and
// every other plane call with the scripted outcome, so the builder tests
// reach planning without starting a process.
func rootlessProbe(t *testing.T, out string, err error) func(context.Context, string, []string) (string, error) {
	t.Helper()
	return func(_ context.Context, _ string, args []string) (string, error) {
		if len(args) > 0 && args[0] == "info" {
			return `{"host":{"security":{"rootless":true}}}`, nil
		}
		return out, err
	}
}

// pinnedBase names a digest-pinned base image the derived planner accepts.
const pinnedBase = "registry/img@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

// TestBuilderBuildDerivedPlansTag requires a digest-pinned base to build
// through the fake runner and return its content-hash tag.
func TestBuilderBuildDerivedPlansTag(t *testing.T) {
	built := containers.Builder{Exec: rootlessProbe(t, "built\n", nil)}
	tag, err := built.BuildDerived(context.Background(), containerplan.Settings{}, "", "tool", pinnedBase, []byte("FROM x\n"), nil)
	if err != nil {
		t.Fatalf("BuildDerived=%v, want nil", err)
	}
	if tag == "" {
		t.Fatal("tag empty, want the content hash")
	}
}

// TestBuilderBuildDerivedRefusesUnpinnedBase requires a base without a
// digest to fail planning before any build starts.
func TestBuilderBuildDerivedRefusesUnpinnedBase(t *testing.T) {
	built := containers.Builder{Exec: rootlessProbe(t, "built\n", nil)}
	_, err := built.BuildDerived(context.Background(), containerplan.Settings{}, "", "tool", "python:3.15", []byte("FROM x\n"), nil)
	if err == nil || !strings.Contains(err.Error(), "digest-pinned") {
		t.Fatalf("BuildDerived=%v, want the unpinned base refusal", err)
	}
}

// TestBuilderBuildEnvironmentPlansTag requires a toolchain lockfile to
// build through the fake runner and return its content-hash tag.
func TestBuilderBuildEnvironmentPlansTag(t *testing.T) {
	built := containers.Builder{Exec: rootlessProbe(t, "built\n", nil)}
	tag, err := built.BuildEnvironment(context.Background(), containerplan.Settings{}, "", "ts", "img", "uv.lock", []byte("x"), catalog.Install{})
	if err != nil {
		t.Fatalf("BuildEnvironment=%v, want nil", err)
	}
	if tag == "" {
		t.Fatal("tag empty, want the content hash")
	}
}

// TestBuilderBuildEnvironmentRefusesNestedLockfile requires a lockfile
// name below a missing directory to fail placing the build context.
func TestBuilderBuildEnvironmentRefusesNestedLockfile(t *testing.T) {
	built := containers.Builder{Exec: rootlessProbe(t, "built\n", nil)}
	_, err := built.BuildEnvironment(context.Background(), containerplan.Settings{}, "", "ts", "img", "sub/uv.lock", []byte("x"), catalog.Install{})
	if err == nil || !strings.Contains(err.Error(), "build environment image") {
		t.Fatalf("BuildEnvironment=%v, want the context failure", err)
	}
}

// TestBuilderBuildMapsRunFailure requires a failed derived build to carry
// the closed build code with the log tail.
func TestBuilderBuildMapsRunFailure(t *testing.T) {
	built := containers.Builder{Exec: rootlessProbe(t, "build log\n", errFakeExec)}
	_, err := built.BuildDerived(context.Background(), containerplan.Settings{}, "", "tool", pinnedBase, []byte("FROM x\n"), nil)
	coded, isCoded := errors.AsType[*finding.Error](err)
	if !isCoded || coded.Code != "ayokoding.examples.env-build-failed" {
		t.Fatalf("BuildDerived=%v, want the closed build code", err)
	}
	if !strings.Contains(coded.Message, "build log") {
		t.Fatalf("message=%q, want the log tail", coded.Message)
	}
}

// TestBuilderBuildEnvironmentMapsRunFailure requires a failed environment
// build to return the run failure.
func TestBuilderBuildEnvironmentMapsRunFailure(t *testing.T) {
	built := containers.Builder{Exec: rootlessProbe(t, "build log\n", errFakeExec)}
	_, err := built.BuildEnvironment(context.Background(), containerplan.Settings{}, "", "ts", "img", "uv.lock", []byte("x"), catalog.Install{})
	if err == nil {
		t.Fatal("BuildEnvironment=nil, want the run failure")
	}
}

// TestRunForwardsStdinToLocalReader requires a real local reader to echo
// the run input, covering the standard-input handoff.
func TestRunForwardsStdinToLocalReader(t *testing.T) {
	result, err := (&containers.Runtime{}).Run(context.Background(), containerplan.Invocation{Binary: "/bin/cat"}, []byte("typed\n"))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if result.Output != "typed\n" {
		t.Fatalf("output=%q, want the run input bytes", result.Output)
	}
}
