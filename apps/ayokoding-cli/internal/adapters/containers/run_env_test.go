package containers_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

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

func TestProbeRequiresRootlessInfo(t *testing.T) {
	for _, testCase := range []struct {
		name, output string
		wantError    bool
	}{
		{"rootless", `{"host":{"security":{"rootless":true}}}`, false},
		{"rootful", `{"host":{"security":{"rootless":false}}}`, true},
		{"missing", `{}`, true},
		{"malformed", `not-json`, true},
	} {
		t.Run(testCase.name, func(t *testing.T) {
			var calls [][]string
			runtime := &containers.Runtime{Exec: func(_ context.Context, _ string, args []string, _ []byte) (string, error) {
				calls = append(calls, args)
				return testCase.output, nil
			}}
			err := runtime.Probe(context.Background())
			if testCase.wantError {
				requireEnvCode(t, err, finding.EnvRuntimeRefused, 125)
			} else if err != nil {
				t.Fatal(err)
			}
			if len(calls) != 1 || len(calls[0]) == 0 || calls[0][0] != "info" {
				t.Fatalf("calls=%v, want info only", calls)
			}
		})
	}
}

func TestSweepLeftoversRemovesOnlyOldLabelledNetworks(t *testing.T) {
	now := time.Date(2026, 10, 28, 12, 0, 0, 0, time.UTC)
	var calls []string
	runtime := &containers.Runtime{
		Now: func() time.Time { return now },
		Exec: func(_ context.Context, _ string, args []string, _ []byte) (string, error) {
			calls = append(calls, strings.Join(args, " "))
			if len(args) > 1 && args[0] == "network" && args[1] == "ls" {
				return `[{"name":"ayokoding-old-net","created":"2026-10-01T00:00:00Z"},{"name":"ayokoding-fresh-net","created":"2026-10-28T11:00:00Z"}]`, nil
			}
			return "", nil
		},
	}
	if err := runtime.SweepLeftovers(context.Background(), 24*time.Hour); err != nil {
		t.Fatalf("sweep leftovers: %v", err)
	}
	joined := strings.Join(calls, "\n")
	if !strings.Contains(joined, "network rm ayokoding-old-net") {
		t.Fatalf("old labelled network not swept:\n%s", joined)
	}
	if strings.Contains(joined, "network rm ayokoding-fresh-net") {
		t.Fatalf("fresh labelled network swept:\n%s", joined)
	}
	if !strings.Contains(joined, "network ls --filter label=ayokoding.run --format json") {
		t.Fatalf("network listing is not the Podman JSON form:\n%s", joined)
	}
}

func TestSweepLeftoversAcceptsEmptyNetworkListing(t *testing.T) {
	runtime := &containers.Runtime{Exec: func(_ context.Context, _ string, _ []string, _ []byte) (string, error) {
		return "", nil
	}}
	if err := runtime.SweepLeftovers(context.Background(), time.Hour); err != nil {
		t.Fatalf("empty listings failed the sweep: %v", err)
	}
}
