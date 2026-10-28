package containerplan_test

import (
	"context"
	"errors"
	"slices"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// errProbeDown is the scripted readiness failure.
var errProbeDown = errors.New("probe: connection refused")

// baseServiceConfig carries the postgres start inputs every service row
// reuses.
func baseServiceConfig() containerplan.ServiceConfig {
	return containerplan.ServiceConfig{
		CLI:       "podman",
		Name:      "ayokoding-r1-postgres",
		RunID:     "r1",
		ServiceID: "postgres",
		Network:   "ayokoding-r1-a1b2c3d4",
		Image:     "docker.io/library/postgres:18.6@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
		DataDir:   "/var/lib/postgresql/data",
		Env:       map[string]string{"POSTGRES_HOST_AUTH_METHOD": "trust"},
	}
}

// TestNetworkCreateRequiresInternal requires the exact internal network
// argv carrying the run label, so the leftover sweep finds it.
func TestNetworkCreateRequiresInternal(t *testing.T) {
	invoke := containerplan.NetworkCreate("podman", "ayokoding-r1-a1b2c3d4", "r1")
	if invoke.Binary != "podman" {
		t.Fatalf("binary=%q, want podman", invoke.Binary)
	}
	want := []string{"network", "create", "--internal", "--label", "ayokoding.run=r1", "ayokoding-r1-a1b2c3d4"}
	if !slices.Equal(invoke.Args, want) {
		t.Fatalf("argv=%q, want %q", invoke.Args, want)
	}
}

// TestNetworkNameHashesUnit requires the per-unit network name.
func TestNetworkNameHashesUnit(t *testing.T) {
	first := containerplan.NetworkName("r1", "learning/code/ex-01-hello")
	second := containerplan.NetworkName("r1", "learning/code/ex-01-hello")
	if first != second || first == "" {
		t.Fatalf("network name not stable: %q vs %q", first, second)
	}
	other := containerplan.NetworkName("r1", "learning/code/ex-02-range")
	if first == other {
		t.Fatalf("network name ignores the unit: %q", first)
	}
	if len(first) <= len("ayokoding-r1-") {
		t.Fatalf("network name carries no unit hash: %q", first)
	}
}

// TestServiceStartArgv requires the exact detached service argv: name,
// run label, internal network, network alias, tmpfs data folder, sorted
// catalog variables, and the pinned image.
func TestServiceStartArgv(t *testing.T) {
	invoke := containerplan.ServiceStart(baseServiceConfig())
	if invoke.Binary != "podman" {
		t.Fatalf("binary=%q, want podman", invoke.Binary)
	}
	want := []string{
		"run", "-d",
		"--name", "ayokoding-r1-postgres",
		"--label", "ayokoding.run=r1",
		"--network", "ayokoding-r1-a1b2c3d4",
		"--network-alias", "postgres",
		"--tmpfs", "/var/lib/postgresql/data:rw,nosuid",
		"--env", "POSTGRES_HOST_AUTH_METHOD=trust",
		"docker.io/library/postgres:18.6@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
	}
	if !slices.Equal(invoke.Args, want) {
		t.Fatalf("argv=%q, want %q", invoke.Args, want)
	}
}

// fakeClock advances a virtual now on every sleep, so the readiness bound
// is proved without waiting.
type fakeClock struct {
	now    time.Time
	sleeps int
}

// Now reports the virtual time.
func (clock *fakeClock) Now() time.Time {
	return clock.now
}

// Sleep advances the virtual time by the pause.
func (clock *fakeClock) Sleep(pause time.Duration) {
	clock.sleeps++
	clock.now = clock.now.Add(pause)
}

// probeScript replays scripted probe results and counts attempts.
type probeScript struct {
	results  []error
	attempts int
}

// probe replays the next scripted result, repeating the last one.
func (script *probeScript) probe(context.Context) error {
	script.attempts++
	if script.attempts <= len(script.results) {
		return script.results[script.attempts-1]
	}
	return script.results[len(script.results)-1]
}

// TestPollReadySucceeds requires success once a probe answers, with one
// sleep per failed attempt.
func TestPollReadySucceeds(t *testing.T) {
	clock := &fakeClock{now: time.Now()}
	script := &probeScript{results: []error{errProbeDown, errProbeDown, nil}}
	err := containerplan.PollReady(context.Background(), "postgres", time.Minute, clock.Now, clock.Sleep, script.probe)
	if err != nil {
		t.Fatalf("PollReady=%v, want nil", err)
	}
	if script.attempts != 3 {
		t.Fatalf("attempts=%d, want 3", script.attempts)
	}
	if clock.sleeps != 2 {
		t.Fatalf("sleeps=%d, want 2", clock.sleeps)
	}
}

// TestPollReadyBoundedByTimeout requires the wait to stop at readyTimeout:
// three attempts and two sleeps for a one-second timeout on the 500 ms
// cadence, then the service-not-ready error.
func TestPollReadyBoundedByTimeout(t *testing.T) {
	clock := &fakeClock{now: time.Now()}
	script := &probeScript{results: []error{errProbeDown}}
	err := containerplan.PollReady(context.Background(), "postgres", time.Second, clock.Now, clock.Sleep, script.probe)
	if err == nil {
		t.Fatal("PollReady=nil, want the service-not-ready error")
	}
	var coded *finding.Error
	if !errors.As(err, &coded) || coded.Code != finding.EnvServiceUnready {
		t.Fatalf("PollReady=%v, want code %q", err, finding.EnvServiceUnready)
	}
	if script.attempts != 3 {
		t.Fatalf("attempts=%d, want 3", script.attempts)
	}
	if clock.sleeps != 2 {
		t.Fatalf("sleeps=%d, want 2", clock.sleeps)
	}
	if got := finding.ExitCode(err); got != 124 {
		t.Fatalf("exit=%d, want 124", got)
	}
}

// TestPollReadyZeroTimeoutProbesOnce requires a single attempt when no wait
// remains.
func TestPollReadyZeroTimeoutProbesOnce(t *testing.T) {
	clock := &fakeClock{now: time.Now()}
	script := &probeScript{results: []error{errProbeDown}}
	err := containerplan.PollReady(context.Background(), "postgres", 0, clock.Now, clock.Sleep, script.probe)
	if err == nil {
		t.Fatal("PollReady=nil, want the service-not-ready error")
	}
	if script.attempts != 1 {
		t.Fatalf("attempts=%d, want 1", script.attempts)
	}
	if clock.sleeps != 0 {
		t.Fatalf("sleeps=%d, want 0", clock.sleeps)
	}
}

// TestPollReadyHonoursCancel requires a cancelled context to stop the wait.
func TestPollReadyHonoursCancel(t *testing.T) {
	cancelled, cancel := context.WithCancel(context.Background())
	cancel()
	clock := &fakeClock{now: time.Now()}
	script := &probeScript{results: []error{errProbeDown}}
	err := containerplan.PollReady(cancelled, "postgres", time.Minute, clock.Now, clock.Sleep, script.probe)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("PollReady=%v, want context.Canceled", err)
	}
}

// TestCleanupRemovesContainersBeforeNetwork requires the cleanup order:
// every container with rm -f first, then the network.
func TestCleanupRemovesContainersBeforeNetwork(t *testing.T) {
	planned := containerplan.Cleanup("podman", []string{"ayokoding-r1-postgres", "ayokoding-r1-neo4j"}, "ayokoding-r1-a1b2c3d4")
	if len(planned) != 2 {
		t.Fatalf("cleanup holds %d invocations, want 2", len(planned))
	}
	first, second := planned[0], planned[1]
	if first.Binary != "podman" || second.Binary != "podman" {
		t.Fatalf("binaries=%q,%q, want podman", first.Binary, second.Binary)
	}
	wantFirst := []string{"rm", "-f", "ayokoding-r1-postgres", "ayokoding-r1-neo4j"}
	if !slices.Equal(first.Args, wantFirst) {
		t.Fatalf("first=%q, want %q", first.Args, wantFirst)
	}
	wantSecond := []string{"network", "rm", "ayokoding-r1-a1b2c3d4"}
	if !slices.Equal(second.Args, wantSecond) {
		t.Fatalf("second=%q, want %q", second.Args, wantSecond)
	}
}
