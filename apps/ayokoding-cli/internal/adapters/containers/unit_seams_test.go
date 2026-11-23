package containers_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// TestRefusedMapsErrorKinds requires coded, timeout, and cancelled
// failures to pass through while plain failures refuse the runtime.
func TestRefusedMapsErrorKinds(t *testing.T) {
	coded := &finding.Error{Code: finding.EnvNotFound, Message: "missing"}
	timeout := &containers.TimeoutError{Command: "podman info"}
	rows := []struct {
		name string
		err  error
		want string
		code string
	}{
		{name: "coded error keeps its code", err: coded, want: finding.EnvNotFound, code: finding.EnvNotFound},
		{name: "timeout keeps the timeout", err: timeout, want: "timed out", code: ""},
		{name: "cancelled context keeps the interruption", err: context.Canceled, want: "context canceled", code: ""},
		{name: "plain failure refuses the runtime", err: errFakeExec, want: "container-runtime-unavailable", code: finding.EnvRuntimeRefused},
	}
	for _, row := range rows {
		t.Run(row.name, func(t *testing.T) {
			runtime := &containers.Runtime{Exec: fakeExec("partial log", row.err)}
			err := runtime.Pull(context.Background(), "img")
			if err == nil || !strings.Contains(err.Error(), row.want) {
				t.Fatalf("Pull=%v, want %q", err, row.want)
			}
			if row.code != "" {
				got, ok := errors.AsType[*finding.Error](err)
				if !ok || got.Code != row.code {
					t.Fatalf("Pull=%v, want code %q", err, row.code)
				}
			}
		})
	}
}

// TestProbeKeepsCodedFailures requires a coded probe failure to keep
// its code instead of refusing the runtime.
func TestProbeKeepsCodedFailures(t *testing.T) {
	coded := &finding.Error{Code: finding.EnvNotFound, Message: "missing"}
	runtime := &containers.Runtime{Exec: fakeExec("", coded)}
	err := runtime.Probe(context.Background())
	if err == nil || !strings.Contains(err.Error(), finding.EnvNotFound) {
		t.Fatalf("Probe=%v, want the coded failure", err)
	}
}

// TestSweepLeftoversJoinsListFailures requires failed listings to join
// with the removals they prevent.
func TestSweepLeftoversJoinsListFailures(t *testing.T) {
	moment := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	runtime := &containers.Runtime{
		Exec: func(context.Context, string, []string, []byte) (string, error) {
			return "", errFakeExec
		},
		Now: func() time.Time { return moment },
	}
	err := runtime.SweepLeftovers(context.Background(), 24*time.Hour)
	if err == nil {
		t.Fatal("SweepLeftovers=nil, want the joined listing failures")
	}
	if !strings.Contains(err.Error(), "labelled containers") || !strings.Contains(err.Error(), "labelled networks") {
		t.Fatalf("SweepLeftovers=%v, want both listings named", err)
	}
}

// TestSweepLeftoversParsesTimestamps requires the CreatedAt template
// layout to count as old and garbage to stay swept never.
func TestSweepLeftoversParsesTimestamps(t *testing.T) {
	moment := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	var removed []string
	runtime := &containers.Runtime{
		Exec: func(_ context.Context, _ string, args []string, _ []byte) (string, error) {
			switch args[0] {
			case "ps":
				return "legacy|2020-01-01 00:00:00 +0000 UTC\ngarbage|not-a-timestamp\n", nil
			case "network":
				if args[1] == "ls" {
					return "[]", nil
				}
				removed = append(removed, args[len(args)-1])
				return "", errFakeExec
			case "rm":
				removed = append(removed, args[len(args)-1])
				return "", nil
			}
			return "", nil
		},
		Now: func() time.Time { return moment },
	}
	if err := runtime.SweepLeftovers(context.Background(), 24*time.Hour); err != nil {
		t.Fatalf("SweepLeftovers=%v, want nil", err)
	}
	if len(removed) != 1 || removed[0] != "legacy" {
		t.Fatalf("removed=%v, want only the legacy container", removed)
	}
}

// TestSweepLeftoversJoinsNetworkRemovalFailures requires a failed
// network removal to join the report.
func TestSweepLeftoversJoinsNetworkRemovalFailures(t *testing.T) {
	moment := time.Date(2026, 11, 1, 12, 0, 0, 0, time.UTC)
	runtime := &containers.Runtime{
		Exec: func(_ context.Context, _ string, args []string, _ []byte) (string, error) {
			if args[0] == "ps" {
				return "", nil
			}
			if args[0] == "network" && args[1] == "ls" {
				return `[{"name":"net1","created":"2020-01-01T00:00:00Z"}]`, nil
			}
			return "", errFakeExec
		},
		Now: func() time.Time { return moment },
	}
	err := runtime.SweepLeftovers(context.Background(), 24*time.Hour)
	if err == nil || !strings.Contains(err.Error(), "net1") {
		t.Fatalf("SweepLeftovers=%v, want the failed network removal", err)
	}
}

// TestBuildEnvironmentRefusesBeforeContext requires a refused probe to
// fail the environment build before creating a context.
func TestBuildEnvironmentRefusesBeforeContext(t *testing.T) {
	rootless := `{"host":{"security":{"rootless":true}}}`
	probe := probeExec(rootless, nil)
	refusedProbe := probeExec("", errFakeExec)
	t.Run("missing context fails without building", func(t *testing.T) {
		builder := containers.Builder{Exec: probe}
		_, err := builder.BuildEnvironment(context.Background(), buildSettings(),
			"/no-such/context-parent", "tool", "img:ref", "lock", []byte("lock"), catalog.Install{})
		if err == nil || !strings.Contains(err.Error(), "tool") {
			t.Fatalf("BuildEnvironment=%v, want the toolchain name", err)
		}
	})
	t.Run("refused probe fails before the context", func(t *testing.T) {
		builder := containers.Builder{Exec: refusedProbe}
		_, err := builder.BuildEnvironment(context.Background(), buildSettings(),
			"/no-such/context-parent", "tool", "img:ref", "lock", []byte("lock"), catalog.Install{})
		if err == nil {
			t.Fatal("BuildEnvironment=nil, want the refused probe")
		}
	})
}
