package containers_test

import (
	"context"
	"errors"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// errFakeFailed stands in for a failed container CLI call.
var errFakeFailed = errors.New("fake container CLI failed")

// failEveryCall runs no container CLI call: every invocation fails.
func failEveryCall(_ context.Context, _ string, _ []string, _ []byte) (string, error) {
	return "fakecontainer: daemon unreachable", errFakeFailed
}

// requireEnvCode fails unless the error carries the code with its status.
func requireEnvCode(t *testing.T, err error, code string, status int) {
	t.Helper()
	coded, ok := errors.AsType[*finding.Error](err)
	if !ok {
		t.Fatalf("error type=%T, want *finding.Error (%v)", err, err)
	}
	if coded.Code != code {
		t.Fatalf("code=%q, want %q", coded.Code, code)
	}
	if got := finding.ExitCode(err); got != status {
		t.Fatalf("status=%d, want %d", got, status)
	}
}

// TestProbe_failureNamesRuntimeUnavailable pins the daemon-down code:
// a refused version check is ayokoding.env.container-runtime-unavailable,
// exit 125.
func TestProbe_failureNamesRuntimeUnavailable(t *testing.T) {
	runtime := &containers.Runtime{Exec: failEveryCall}
	requireEnvCode(t, runtime.Probe(context.Background()),
		"ayokoding.env.container-runtime-unavailable", 125)
}

// TestRun_splitsContainerStreams pins the stderr contract: the real CLI
// path keeps standard output and error apart, so the run expectations can
// compare each stream alone.
func TestRun_splitsContainerStreams(t *testing.T) {
	runtime := &containers.Runtime{}
	result, err := runtime.Run(context.Background(), containerplan.Invocation{
		Binary: "/bin/sh",
		Args:   []string{"-c", "echo out; echo err >&2; exit 3"},
	}, nil)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if result.ExitCode != 3 {
		t.Fatalf("status=%d, want 3", result.ExitCode)
	}
	if result.Output != "out\n" {
		t.Fatalf("stdout=%q, want %q", result.Output, "out\n")
	}
	if result.Stderr != "err\n" {
		t.Fatalf("stderr=%q, want %q", result.Stderr, "err\n")
	}
}
