package integration_test

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// buildFakeContainer compiles the fake container CLI into a temporary
// directory and returns its path.
func buildFakeContainer(t *testing.T) string {
	t.Helper()
	binary := filepath.Join(t.TempDir(), "fakecontainer")
	build := exec.CommandContext(context.Background(), "go", "build", "-trimpath", "-o", binary, "./tests/support/fakecontainer")
	build.Dir = "../.."
	if output, err := build.CombinedOutput(); err != nil {
		t.Fatalf("build fakecontainer: %v\n%s", err, output)
	}
	return binary
}

// fakeRuntime points a Runtime at a fresh fake with the given script
// variables and returns the runtime with its log path.
func fakeRuntime(t *testing.T, script map[string]string) (*containers.Runtime, string) {
	t.Helper()
	fake := buildFakeContainer(t)
	log := filepath.Join(t.TempDir(), "fake.log")
	t.Setenv("AYOKODING_CONTAINER_CLI", fake)
	t.Setenv("FAKECONTAINER_LOG", log)
	for key, value := range script {
		t.Setenv(key, value)
	}
	return &containers.Runtime{ReadyPoll: 10 * time.Millisecond}, log
}

// readFakeLog returns the fake log, empty when nothing ran yet.
func readFakeLog(t *testing.T, log string) string {
	t.Helper()
	content, err := os.ReadFile(log)
	if err != nil {
		if os.IsNotExist(err) {
			return ""
		}
		t.Fatalf("read fake log: %v", err)
	}
	return string(content)
}

// requireFakeLogContains fails when the fake log lacks the needle.
func requireFakeLogContains(t *testing.T, log, needle string) {
	t.Helper()
	if content := readFakeLog(t, log); !strings.Contains(content, needle) {
		t.Fatalf("fake log lacks %q:\n%s", needle, content)
	}
}

// requireFakeLogExcludes fails when the fake log contains the needle.
func requireFakeLogExcludes(t *testing.T, log, needle string) {
	t.Helper()
	if content := readFakeLog(t, log); strings.Contains(content, needle) {
		t.Fatalf("fake log unexpectedly contains %q:\n%s", needle, content)
	}
}

// waitForFakeLog polls the fake log for the needle until the deadline,
// for cross-process readiness only.
func waitForFakeLog(t *testing.T, log, needle string, timeout time.Duration) {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if strings.Contains(readFakeLog(t, log), needle) {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("fake log never showed %q:\n%s", needle, readFakeLog(t, log))
}

// requireEnvCode fails unless the error is the coded environment failure
// with the wanted exit status.
func requireEnvCode(t *testing.T, err error, code string, status int) {
	t.Helper()
	if err == nil {
		t.Fatalf("expected %s, got no error", code)
	}
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

// TestContainers_RunDeliversStdin proves the run input reaches the container
// standard input end to end: the fake echoes stdin to stdout, so the result
// carries the fed bytes.
func TestContainers_RunDeliversStdin(t *testing.T) {
	t.Setenv("FAKECONTAINER_ECHO_STDIN", "1")
	runtime, _ := fakeRuntime(t, nil)
	invoke := containerplan.Invocation{
		Binary: "ignored",
		Args: []string{
			"run", "--rm",
			"--name", "ayokoding-stdin-0",
			"--label", "ayokoding.run=stdin",
			"--network", "none",
			"img", "cat",
		},
	}
	result, err := runtime.Run(context.Background(), invoke, []byte("typed\n"))
	if err != nil {
		t.Fatalf("run with stdin: %v", err)
	}
	if result.Output != "typed\n" {
		t.Fatalf("stdout=%q, want the fed stdin bytes", result.Output)
	}
}

// TestContainers_RunRecordsPlannedArgv proves the adapter executes the
// planned binary with its planned argv byte for byte.
func TestContainers_RunRecordsPlannedArgv(t *testing.T) {
	runtime, log := fakeRuntime(t, nil)
	invoke := containerplan.Invocation{
		Binary: "ignored",
		Args: []string{
			"run", "--rm",
			"--name", "ayokoding-abc-0",
			"--label", "ayokoding.run=abc",
			"--network", "none",
			"docker.io/library/python:3.14@sha256:0",
			"python", "example.py",
		},
	}
	result, err := runtime.Run(context.Background(), invoke, nil)
	if err != nil {
		t.Fatalf("run planned invocation: %v", err)
	}
	if result.ExitCode != 0 {
		t.Fatalf("status=%d, want 0", result.ExitCode)
	}
	requireFakeLogContains(t, log, "argv: run --rm --name ayokoding-abc-0 --label ayokoding.run=abc --network none docker.io/library/python:3.14@sha256:0 python example.py")
}

// TestContainers_RunTimeoutKillsContainer proves a run past its own
// timeout dies as a TimeoutError, never as a supervisor status.
func TestContainers_RunTimeoutKillsContainer(t *testing.T) {
	runtime, log := fakeRuntime(t, map[string]string{"FAKECONTAINER_SLEEP": "30"})
	invoke := containerplan.Invocation{
		Binary: "ignored",
		Args:   []string{"run", "--rm", "--name", "ayokoding-slow-0", "img"},
	}
	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
	defer cancel()
	start := time.Now()
	_, err := runtime.Run(ctx, invoke, nil)
	elapsed := time.Since(start)
	if _, ok := errors.AsType[*containers.TimeoutError](err); !ok {
		t.Fatalf("error type=%T, want *containers.TimeoutError (%v)", err, err)
	}
	if elapsed > 10*time.Second {
		t.Fatalf("timed-out run took %v", elapsed)
	}
	requireFakeLogContains(t, log, "started ayokoding-slow-0")
	requireFakeLogExcludes(t, log, "exited ayokoding-slow-0")
}

// TestContainers_MissingCLIExits127 proves a missing container command is
// ayokoding.env.not-found, exit 127.
func TestContainers_MissingCLIExits127(t *testing.T) {
	fakeRuntime(t, nil)
	t.Setenv("AYOKODING_CONTAINER_CLI", filepath.Join(t.TempDir(), "no-such-cli"))
	runtime := &containers.Runtime{}
	invoke := containerplan.Invocation{Binary: "ignored", Args: []string{"version"}}
	_, err := runtime.Run(context.Background(), invoke, nil)
	requireEnvCode(t, err, finding.EnvNotFound, 127)
	if err := runtime.Probe(context.Background()); err == nil {
		t.Fatalf("probe against a missing CLI returned no error")
	} else {
		requireEnvCode(t, err, finding.EnvNotFound, 127)
	}
}

// TestContainers_NonExecutableCLIExits126 proves a found but unusable
// container command is ayokoding.env.not-executable, exit 126.
func TestContainers_NonExecutableCLIExits126(t *testing.T) {
	fakeRuntime(t, nil)
	stub := filepath.Join(t.TempDir(), "stub-cli")
	if err := os.WriteFile(stub, []byte("#!/bin/sh\nexit 0\n"), 0o644); err != nil {
		t.Fatalf("write stub CLI: %v", err)
	}
	t.Setenv("AYOKODING_CONTAINER_CLI", stub)
	runtime := &containers.Runtime{}
	invoke := containerplan.Invocation{Binary: "ignored", Args: []string{"version"}}
	_, err := runtime.Run(context.Background(), invoke, nil)
	requireEnvCode(t, err, finding.EnvNotExecutable, 126)
}

// TestContainers_DaemonDownExits125 proves a refusing daemon is
// ayokoding.env.runtime-refused, exit 125.
func TestContainers_DaemonDownExits125(t *testing.T) {
	runtime, _ := fakeRuntime(t, map[string]string{"FAKECONTAINER_DAEMON_DOWN": "1"})
	requireEnvCode(t, runtime.Probe(context.Background()), finding.EnvRuntimeRefused, 125)
}

// TestContainers_PullFailureExits125 proves a failed pinned-image pull is
// ayokoding.env.runtime-refused, exit 125.
func TestContainers_PullFailureExits125(t *testing.T) {
	runtime, _ := fakeRuntime(t, map[string]string{"FAKECONTAINER_PULL_FAIL": "1"})
	err := runtime.Pull(context.Background(), "docker.io/library/python:3.14@sha256:0")
	requireEnvCode(t, err, finding.EnvRuntimeRefused, 125)
}

// TestContainers_ServiceNeverReadyExits124 proves a service past its
// readyTimeout is ayokoding.env.service-unready, exit 124, and that
// cleanup still removes its container and network.
func TestContainers_ServiceNeverReadyExits124(t *testing.T) {
	runtime, log := fakeRuntime(t, map[string]string{"FAKECONTAINER_NEVER_READY": "1"})
	runtime.TrackContainer("ayokoding-db-0")
	runtime.TrackNetwork("ayokoding-net-0")
	err := runtime.WaitReady(context.Background(), "ayokoding-db-0", []string{"pg_isready"}, 150*time.Millisecond)
	requireEnvCode(t, err, finding.EnvServiceUnready, 124)
	if cleanupErr := runtime.Cleanup(context.Background()); cleanupErr != nil {
		t.Fatalf("cleanup after unready service: %v", cleanupErr)
	}
	requireFakeLogContains(t, log, "removed container ayokoding-db-0")
	requireFakeLogContains(t, log, "removed network ayokoding-net-0")
}

// TestContainers_ServiceReadyPasses proves a reporting service needs no
// finding.
func TestContainers_ServiceReadyPasses(t *testing.T) {
	runtime, _ := fakeRuntime(t, nil)
	if err := runtime.WaitReady(context.Background(), "ayokoding-db-0", []string{"pg_isready"}, time.Second); err != nil {
		t.Fatalf("ready service reported: %v", err)
	}
}

// TestContainers_InterruptRemovesLabelledResourcesAndExits130 sends a real
// SIGINT to a helper running one sleeping fake container, then requires
// rm -f for the container and the network with exit 130.
func TestContainers_InterruptRemovesLabelledResourcesAndExits130(t *testing.T) {
	fake := buildFakeContainer(t)
	log := filepath.Join(t.TempDir(), "fake.log")
	//nolint:gosec // the child is this test binary by construction: os.Args[0] names it.
	child := exec.CommandContext(context.Background(), os.Args[0], "-test.run", "TestInterruptChildMain")
	child.Env = []string{
		"PATH=" + os.Getenv("PATH"),
		"HOME=" + os.Getenv("HOME"),
		"AYOKODING_CONTAINER_HELPER=interrupt",
		"AYOKODING_CONTAINER_CLI=" + fake,
		"FAKECONTAINER_LOG=" + log,
		"FAKECONTAINER_SLEEP=30",
	}
	if err := child.Start(); err != nil {
		t.Fatalf("start helper: %v", err)
	}
	waitForFakeLog(t, log, "started ayokoding-int-0", 30*time.Second)
	if err := child.Process.Signal(os.Interrupt); err != nil {
		_ = child.Wait()
		t.Fatalf("signal helper: %v", err)
	}
	waitErr := child.Wait()
	exitErr, ok := errors.AsType[*exec.ExitError](waitErr)
	if !ok {
		t.Fatalf("helper exited without a status: %v", waitErr)
	}
	if exitErr.ExitCode() != 130 {
		t.Fatalf("status=%d, want 130", exitErr.ExitCode())
	}
	requireFakeLogContains(t, log, "rm -f ayokoding-int-0")
	requireFakeLogContains(t, log, "network rm ayokoding-int-net")
}

// TestInterruptChildMain runs one sleeping fake container under a signal
// context, cleans up on interrupt, and exits 130. The parent test above
// is its only caller.
func TestInterruptChildMain(t *testing.T) {
	// Helper entry point re-executed as a child process by the interrupt
	// test above; a plain return (not t.Skip) keeps the repo skip-grep green.
	if os.Getenv("AYOKODING_CONTAINER_HELPER") != "interrupt" {
		return
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	runtime := &containers.Runtime{}
	runtime.TrackContainer("ayokoding-int-0")
	runtime.TrackNetwork("ayokoding-int-net")
	invoke := containerplan.Invocation{
		Binary: "ignored",
		Args: []string{
			"run", "--rm",
			"--name", "ayokoding-int-0",
			"--label", "ayokoding.run=int",
			"--network", "ayokoding-int-net",
			"img",
		},
	}
	_, _ = runtime.Run(ctx, invoke, nil)
	if ctx.Err() == nil {
		stop()
		t.Fatalf("sleeping run returned without an interrupt")
	}
	if err := runtime.Cleanup(context.Background()); err != nil {
		stop()
		t.Fatalf("interrupt cleanup: %v", err)
	}
	stop()
	os.Exit(130)
}

// TestContainers_SweepRemovesLeftoversOlderThan24Hours proves the start
// sweep removes labelled containers and networks past 24 hours and keeps
// fresh ones.
func TestContainers_SweepRemovesLeftoversOlderThan24Hours(t *testing.T) {
	fresh := time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
	runtime, log := fakeRuntime(t, map[string]string{
		"FAKECONTAINER_PS":       "ayokoding-old-0|2000-01-01T00:00:00Z\nayokoding-fresh-0|" + fresh + "\n",
		"FAKECONTAINER_NETWORKS": "ayokoding-old-net|2000-01-01T00:00:00Z\nayokoding-fresh-net|" + fresh + "\n",
	})
	if err := runtime.SweepLeftovers(context.Background(), 24*time.Hour); err != nil {
		t.Fatalf("sweep leftovers: %v", err)
	}
	requireFakeLogContains(t, log, "rm -f ayokoding-old-0")
	requireFakeLogContains(t, log, "network rm ayokoding-old-net")
	requireFakeLogExcludes(t, log, "ayokoding-fresh-0")
	requireFakeLogExcludes(t, log, "ayokoding-fresh-net")
}
