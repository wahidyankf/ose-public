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

// errFakeExec stands in for a failed container CLI call.
var errFakeExec = errors.New("exit status 1")

// fakeExec answers every container CLI call with the same output and error.
func fakeExec(output string, err error) func(context.Context, string, []string, []byte) (string, error) {
	return func(context.Context, string, []string, []byte) (string, error) {
		return output, err
	}
}

// TestRunMapsOutcomesToResults requires Run to map every execution outcome
// through the injected seam without starting a process.
func TestRunMapsOutcomesToResults(t *testing.T) {
	timeout := &containers.TimeoutError{Command: "podman run img"}
	coded := &finding.Error{Code: finding.EnvNotFound, Message: "missing"}
	rows := []struct {
		name       string
		output     string
		err        error
		wantExit   int
		wantOutput string
		wantErr    string
	}{
		{name: "success carries the combined output", output: "hello\n", wantExit: 0, wantOutput: "hello\n"},
		{name: "timeout maps to the run timeout", err: timeout, wantErr: "timed out"},
		{name: "coded error keeps its code", err: coded, wantErr: finding.EnvNotFound},
		{name: "cancelled context keeps the interruption", err: context.Canceled, wantErr: "context canceled"},
		{name: "plain failure keeps the output with the error", output: "partial\n", err: errFakeExec, wantOutput: "partial\n", wantErr: "exit status 1"},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			runtime := &containers.Runtime{Exec: fakeExec(row.output, row.err)}
			result, err := runtime.Run(context.Background(), containerplan.Invocation{Binary: "img", Args: nil}, nil)
			if row.wantErr == "" && err != nil {
				t.Fatalf("Run=%v, want nil", err)
			}
			if row.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), row.wantErr) {
					t.Fatalf("Run=%v, want error containing %q", err, row.wantErr)
				}
			}
			if result.ExitCode != row.wantExit {
				t.Fatalf("exit=%d, want %d", result.ExitCode, row.wantExit)
			}
			if result.Output != row.wantOutput {
				t.Fatalf("output=%q, want %q", result.Output, row.wantOutput)
			}
		})
	}
}

// TestContainerErrorTexts pins the timeout and exit error messages the
// application maps to closed result codes.
func TestContainerErrorTexts(t *testing.T) {
	timeout := &containers.TimeoutError{Command: "podman run img"}
	if got := timeout.Error(); !strings.Contains(got, "timed out") {
		t.Fatalf("timeout=%q, want a timeout message", got)
	}
	runtime := &containers.Runtime{Exec: fakeExec("", errFakeExec)}
	if err := runtime.Pull(context.Background(), "img"); err == nil {
		t.Fatal("Pull=nil, want the unavailable runtime")
	}
}

// TestPullFailureNamesRuntimeUnavailable requires a pull failure to exit
// 125 with the unavailable runtime code.
func TestPullFailureNamesRuntimeUnavailable(t *testing.T) {
	runtime := &containers.Runtime{Exec: fakeExec("", errFakeExec)}
	requireEnvCode(t, runtime.Pull(context.Background(), "img"),
		"ayokoding.env.container-runtime-unavailable", 125)
	if err := runtime.Pull(context.Background(), "img"); err == nil {
		t.Fatal("Pull=nil, want an error")
	}
	ok := &containers.Runtime{Exec: fakeExec("digest", nil)}
	if err := ok.Pull(context.Background(), "img"); err != nil {
		t.Fatalf("Pull=%v, want nil", err)
	}
}

// TestRemoveContainerReportsFailures requires a failed removal to name the
// container.
func TestRemoveContainerReportsFailures(t *testing.T) {
	failing := &containers.Runtime{Exec: fakeExec("gone", errFakeExec)}
	err := failing.RemoveContainer(context.Background(), "c1")
	if err == nil || !strings.Contains(err.Error(), "c1") {
		t.Fatalf("RemoveContainer=%v, want the container name", err)
	}
	working := &containers.Runtime{Exec: fakeExec("", nil)}
	if err := working.RemoveContainer(context.Background(), "c1"); err != nil {
		t.Fatalf("RemoveContainer=%v, want nil", err)
	}
}

// TestCleanupRemovesTrackedResources requires Cleanup to remove every
// tracked container and network, join failures, and untrack both.
func TestCleanupRemovesTrackedResources(t *testing.T) {
	var calls [][]string
	runtime := &containers.Runtime{Exec: func(_ context.Context, _ string, args []string, _ []byte) (string, error) {
		calls = append(calls, args)
		if args[0] == "rm" || (args[0] == "network" && args[1] == "rm") {
			return "", errFakeExec
		}
		return "", nil
	}}
	runtime.TrackContainer("c1")
	runtime.TrackNetwork("n1")
	err := runtime.Cleanup(context.Background())
	if err == nil {
		t.Fatal("Cleanup=nil, want the joined removal failures")
	}
	if !strings.Contains(err.Error(), "c1") || !strings.Contains(err.Error(), "n1") {
		t.Fatalf("Cleanup=%v, want both resources named", err)
	}
	// A second cleanup finds nothing tracked, so it makes no calls.
	before := len(calls)
	if err := runtime.Cleanup(context.Background()); err != nil {
		t.Fatalf("Cleanup=%v, want nil after untracking", err)
	}
	if len(calls) != before {
		t.Fatalf("calls=%d, want no calls after untracking", len(calls)-before)
	}
}

// TestWaitReadyPollsUntilReady requires WaitReady to poll through failures,
// fail fast on coded errors, yield to interrupts, and time out with the
// unready code.
func TestWaitReadyPollsUntilReady(t *testing.T) {
	t.Run("ready after retries", func(t *testing.T) {
		calls := 0
		runtime := &containers.Runtime{
			Exec: func(context.Context, string, []string, []byte) (string, error) {
				calls++
				if calls < 3 {
					return "", errFakeExec
				}
				return "", nil
			},
			ReadyPoll: time.Nanosecond,
		}
		if err := runtime.WaitReady(context.Background(), "db", []string{"ready"}, time.Minute); err != nil {
			t.Fatalf("WaitReady=%v, want nil", err)
		}
		if calls != 3 {
			t.Fatalf("calls=%d, want 3", calls)
		}
	})
	t.Run("coded error fails fast", func(t *testing.T) {
		calls := 0
		runtime := &containers.Runtime{
			Exec: func(context.Context, string, []string, []byte) (string, error) {
				calls++
				return "", &finding.Error{Code: finding.EnvNotFound, Message: "missing"}
			},
			ReadyPoll: time.Nanosecond,
		}
		err := runtime.WaitReady(context.Background(), "db", []string{"ready"}, time.Minute)
		if err == nil || !strings.Contains(err.Error(), "ayokoding.env.container-cli-not-found") {
			t.Fatalf("WaitReady=%v, want the coded error", err)
		}
		if calls != 1 {
			t.Fatalf("calls=%d, want 1", calls)
		}
	})
	t.Run("cancelled context interrupts the wait", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		runtime := &containers.Runtime{Exec: fakeExec("", errFakeExec), ReadyPoll: time.Nanosecond}
		err := runtime.WaitReady(ctx, "db", []string{"ready"}, time.Minute)
		if err == nil || !strings.Contains(err.Error(), "context canceled") {
			t.Fatalf("WaitReady=%v, want the interruption", err)
		}
	})
	t.Run("elapsed timeout names the unready service", func(t *testing.T) {
		moment := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
		ticks := []time.Time{moment, moment, moment.Add(2 * time.Hour)}
		runtime := &containers.Runtime{
			Exec:      fakeExec("", errFakeExec),
			Now:       func() time.Time { defer func() { ticks = ticks[1:] }(); return ticks[0] },
			ReadyPoll: time.Nanosecond,
		}
		err := runtime.WaitReady(context.Background(), "db", []string{"ready"}, time.Hour)
		if err == nil {
			t.Fatal("WaitReady=nil, want the unready service")
		}
		var coded *finding.Error
		if !errors.As(err, &coded) || coded.Code != finding.EnvServiceUnready {
			t.Fatalf("WaitReady=%v, want %q", err, finding.EnvServiceUnready)
		}
	})
}

// TestSweepLeftoversJoinsFailures requires the sweep to keep going past a
// failed container removal and a malformed network listing.
func TestSweepLeftoversJoinsFailures(t *testing.T) {
	moment := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	ps := "old|2020-01-01T00:00:00Z\nfresh|2026-11-01T11:00:00Z\nbroken-line\n"
	runtime := &containers.Runtime{
		Exec: func(_ context.Context, _ string, args []string, _ []byte) (string, error) {
			switch args[0] {
			case "ps":
				return ps, nil
			case "rm":
				return "", errFakeExec
			default:
				return "not-json", nil
			}
		},
		Now: func() time.Time { return moment },
	}
	err := runtime.SweepLeftovers(context.Background(), 24*time.Hour)
	if err == nil {
		t.Fatal("SweepLeftovers=nil, want joined failures")
	}
	if !strings.Contains(err.Error(), "old") || !strings.Contains(err.Error(), "parse labelled networks") {
		t.Fatalf("SweepLeftovers=%v, want the failed removal and the parse failure", err)
	}
}

// TestSweepLeftoversListsNothingClean requires an empty listing and fresh
// resources to sweep nothing without error.
func TestSweepLeftoversListsNothingClean(t *testing.T) {
	moment := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	var removed []string
	runtime := &containers.Runtime{
		Exec: func(_ context.Context, _ string, args []string, _ []byte) (string, error) {
			if args[0] == "ps" {
				return "fresh|2026-11-01T11:00:00Z\n", nil
			}
			if args[0] == "network" && args[1] == "ls" {
				return `[{"name":"net1","created":"2026-11-01T11:00:00Z"},{"name":"","created":"2020-01-01T00:00:00Z"},{"name":"nodate"}]`, nil
			}
			if args[0] == "rm" || (args[0] == "network" && args[1] == "rm") {
				removed = append(removed, args[len(args)-1])
			}
			return "", nil
		},
		Now: func() time.Time { return moment },
	}
	if err := runtime.SweepLeftovers(context.Background(), 24*time.Hour); err != nil {
		t.Fatalf("SweepLeftovers=%v, want nil", err)
	}
	if len(removed) != 0 {
		t.Fatalf("removed=%v, want nothing swept", removed)
	}
}

// TestBuilderPresentInspectsTheReference requires Present to report the
// inspection outcome without building anything.
func TestBuilderPresentInspectsTheReference(t *testing.T) {
	var binaries []string
	builder := containers.Builder{Exec: func(_ context.Context, cli string, _ []string) (string, error) {
		binaries = append(binaries, cli)
		return "{}", nil
	}}
	if !builder.Present(context.Background(), "podman", "img:tag") {
		t.Fatal("Present=false, want true")
	}
	if len(binaries) != 1 {
		t.Fatalf("calls=%d, want 1", len(binaries))
	}
	missing := containers.Builder{Exec: func(context.Context, string, []string) (string, error) {
		return "", errFakeExec
	}}
	if missing.Present(context.Background(), "podman", "img:tag") {
		t.Fatal("Present=true, want false")
	}
}

// buildSettings returns settings with an explicit CLI so the tests never
// read the ambient environment.
func buildSettings() containerplan.Settings {
	return containerplan.Settings{ContainerCLI: "test-cli"}
}

// probeExec answers one build probe with the same output and error.
func probeExec(output string, err error) func(context.Context, string, []string) (string, error) {
	return func(context.Context, string, []string) (string, error) {
		return output, err
	}
}

// TestBuildDerivedFailsClosed requires the derived build to probe first,
// refuse a missing build context without writing anything, and wrap plan
// failures with the tool id.
func TestBuildDerivedFailsClosed(t *testing.T) {
	rootless := `{"host":{"security":{"rootless":true}}}`
	probe := probeExec(rootless, nil)
	refusedProbe := probeExec("", errFakeExec)
	t.Run("missing context fails without building", func(t *testing.T) {
		builder := containers.Builder{Exec: probe}
		_, err := builder.BuildDerived(context.Background(), buildSettings(),
			"/no/such/context-parent", "tool", "base:ref", []byte("FROM x\n"), nil)
		if err == nil || !strings.Contains(err.Error(), "tool") {
			t.Fatalf("BuildDerived=%v, want the tool id", err)
		}
	})
	t.Run("refused probe fails before the context", func(t *testing.T) {
		builder := containers.Builder{Exec: refusedProbe}
		_, err := builder.BuildDerived(context.Background(), buildSettings(),
			"/no/such/context-parent", "tool", "base:ref", []byte("FROM x\n"), nil)
		if err == nil {
			t.Fatal("BuildDerived=nil, want the refused probe")
		}
	})
	t.Run("environment build refuses the missing context", func(t *testing.T) {
		builder := containers.Builder{Exec: probe}
		_, err := builder.BuildEnvironment(context.Background(), buildSettings(),
			"/no/such/context-parent", "tool", "img:ref", "lock", []byte("lock"), catalog.Install{})
		if err == nil || !strings.Contains(err.Error(), "tool") {
			t.Fatalf("BuildEnvironment=%v, want the toolchain name", err)
		}
	})
}
