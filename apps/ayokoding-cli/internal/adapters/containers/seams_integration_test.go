//go:build integration

package containers_test

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// realGit resolves the only permitted real binary for process tests.
func realGit(t *testing.T) string {
	t.Helper()
	cli, err := exec.LookPath("/usr/bin/git")
	if err != nil {
		t.Skip("/usr/bin/git not present")
	}
	return cli
}

// TestIntegrationRunWithoutExecUsesTheRealCLI requires the nil-Exec
// path to run the real binary and split its streams.
func TestIntegrationRunWithoutExecUsesTheRealCLI(t *testing.T) {
	cli := realGit(t)
	runtime := &containers.Runtime{}
	result, err := runtime.Run(context.Background(),
		containerplan.Invocation{Binary: cli, Args: []string{"--version"}}, nil)
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if result.ExitCode != 0 || !strings.Contains(result.Output, "git version") {
		t.Fatalf("result=%+v, want exit 0 with the git version", result)
	}
}

// TestIntegrationRunWithoutExecMapsOutcomes requires a failing real
// binary to report its status, and start failures to map closed.
func TestIntegrationRunWithoutExecMapsOutcomes(t *testing.T) {
	cli := realGit(t)
	runtime := &containers.Runtime{}
	result, err := runtime.Run(context.Background(),
		containerplan.Invocation{Binary: cli, Args: []string{"--no-such-option"}}, nil)
	if err != nil {
		t.Fatalf("Run=%v, want the exit status as data", err)
	}
	if result.ExitCode == 0 {
		t.Fatalf("exit=%d, want nonzero", result.ExitCode)
	}
	if result.Stderr == "" {
		t.Fatal("stderr empty, want the usage text apart from stdout")
	}
	_, missingErr := runtime.Run(context.Background(),
		containerplan.Invocation{Binary: "no-such-container-binary"}, nil)
	var missing *finding.Error
	if !errors.As(missingErr, &missing) || missing.Code != finding.EnvNotFound {
		t.Fatalf("Run=%v, want the 127 not-found code", missingErr)
	}
	blocked := filepath.Join(t.TempDir(), "not-executable")
	if err := os.WriteFile(blocked, []byte("#!/bin/sh\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	_, unusableErr := runtime.Run(context.Background(),
		containerplan.Invocation{Binary: blocked}, nil)
	var unusable *finding.Error
	if !errors.As(unusableErr, &unusable) || unusable.Code != finding.EnvNotExecutable {
		t.Fatalf("Run=%v, want the 126 not-executable code", unusableErr)
	}
}

// TestIntegrationRunWithoutExecFeedsStdin requires the real path to
// feed a non-empty input to the child standard input.
func TestIntegrationRunWithoutExecFeedsStdin(t *testing.T) {
	cli := realGit(t)
	runtime := &containers.Runtime{}
	result, err := runtime.Run(context.Background(),
		containerplan.Invocation{Binary: cli, Args: []string{"hash-object", "--stdin"}}, []byte("hello"))
	if err != nil {
		t.Fatalf("Run=%v, want nil", err)
	}
	if result.ExitCode != 0 || result.Output == "" {
		t.Fatalf("result=%+v, want exit 0 with the object hash", result)
	}
}

// TestIntegrationProbeWithoutExecReachesTheRealCLI requires the nil-Exec
// runner to invoke the real binary and refuse its non-rootless answer.
func TestIntegrationProbeWithoutExecReachesTheRealCLI(t *testing.T) {
	cli := realGit(t)
	t.Setenv("AYOKODING_CONTAINER_CLI", cli)
	runtime := &containers.Runtime{}
	err := runtime.Probe(context.Background())
	if err == nil {
		t.Fatal("Probe=nil, want the refused runtime")
	}
	var coded *finding.Error
	if !errors.As(err, &coded) || coded.Code != finding.EnvRuntimeRefused {
		t.Fatalf("Probe=%v, want the refused runtime code", err)
	}
}

// TestIntegrationBuildDerivedMapsRunFailure requires a failing run to
// carry the closed build code with the log tail.
func TestIntegrationBuildDerivedMapsRunFailure(t *testing.T) {
	rootless := `{"host":{"security":{"rootless":true}}}`
	var runs int
	builder := containers.Builder{Exec: func(_ context.Context, _ string, args []string) (string, error) {
		if len(args) > 0 && args[0] == "info" {
			return rootless, nil
		}
		runs++
		return "build log line\n", errFakeExec
	}}
	_, err := builder.BuildDerived(context.Background(), buildSettings(),
		t.TempDir(), "tool", "registry.example/tool@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		[]byte("FROM registry.example/tool@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n"), nil)
	if err == nil || !strings.Contains(err.Error(), "ayokoding.examples.env-build-failed") {
		t.Fatalf("BuildDerived=%v, want the closed build code", err)
	}
	if runs != 1 {
		t.Fatalf("runs=%d, want 1", runs)
	}
}

// TestIntegrationBuildDerivedReturnsThePlannedTag requires a green run
// to return the content-hash tag.
func TestIntegrationBuildDerivedReturnsThePlannedTag(t *testing.T) {
	rootless := `{"host":{"security":{"rootless":true}}}`
	builder := containers.Builder{Exec: func(_ context.Context, _ string, args []string) (string, error) {
		if len(args) > 0 && args[0] == "info" {
			return rootless, nil
		}
		return "", nil
	}}
	tag, err := builder.BuildDerived(context.Background(), buildSettings(),
		t.TempDir(), "tool", "registry.example/tool@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		[]byte("FROM registry.example/tool@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n"), nil)
	if err != nil {
		t.Fatalf("BuildDerived=%v, want nil", err)
	}
	if tag == "" {
		t.Fatal("tag empty, want the planned tag")
	}
}

// TestIntegrationBuildDerivedKeepsLongLogs requires a failing run to
// keep only the log tail in the closed build error.
func TestIntegrationBuildDerivedKeepsLongLogs(t *testing.T) {
	rootless := `{"host":{"security":{"rootless":true}}}`
	var log strings.Builder
	for range 50 {
		log.WriteString("log line\n")
	}
	builder := containers.Builder{Exec: func(_ context.Context, _ string, args []string) (string, error) {
		if len(args) > 0 && args[0] == "info" {
			return rootless, nil
		}
		return log.String(), errFakeExec
	}}
	_, err := builder.BuildDerived(context.Background(), buildSettings(),
		t.TempDir(), "tool", "registry.example/tool@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		[]byte("FROM registry.example/tool@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n"), nil)
	if err == nil || !strings.Contains(err.Error(), "ayokoding.examples.env-build-failed") {
		t.Fatalf("BuildDerived=%v, want the closed build code", err)
	}
	if got := strings.Count(err.Error(), "log line"); got != 40 {
		t.Fatalf("diagnosis keeps %d lines, want 40", got)
	}
}

// TestIntegrationBuildEnvironmentMapsRunFailure requires a failing
// environment run to carry the closed build code.
func TestIntegrationBuildEnvironmentMapsRunFailure(t *testing.T) {
	rootless := `{"host":{"security":{"rootless":true}}}`
	builder := containers.Builder{Exec: func(_ context.Context, _ string, args []string) (string, error) {
		if len(args) > 0 && args[0] == "info" {
			return rootless, nil
		}
		return "env build log\n", errFakeExec
	}}
	_, err := builder.BuildEnvironment(context.Background(), buildSettings(),
		t.TempDir(), "tool", "img:ref", "lock", []byte("lock"), catalog.Install{})
	if err == nil || !strings.Contains(err.Error(), "ayokoding.examples.env-build-failed") {
		t.Fatalf("BuildEnvironment=%v, want the closed build code", err)
	}
}

// TestIntegrationBuildEnvironmentPlansBeforeRunning requires a green
// environment build to return its content-hash tag.
func TestIntegrationBuildEnvironmentPlansBeforeRunning(t *testing.T) {
	rootless := `{"host":{"security":{"rootless":true}}}`
	var runs int
	builder := containers.Builder{Exec: func(_ context.Context, _ string, args []string) (string, error) {
		if len(args) > 0 && args[0] == "info" {
			return rootless, nil
		}
		runs++
		return "", nil
	}}
	tag, err := builder.BuildEnvironment(context.Background(), buildSettings(),
		t.TempDir(), "tool", "img:ref", "lock", []byte("lock"), catalog.Install{})
	if err != nil {
		t.Fatalf("BuildEnvironment=%v, want nil", err)
	}
	if tag == "" || runs != 1 {
		t.Fatalf("tag=%q runs=%d, want one planned run", tag, runs)
	}
}

// TestIntegrationBuilderPresentReachesTheRealCLI requires the nil-Exec
// runner to inspect through the real binary and report a missing image.
func TestIntegrationBuilderPresentReachesTheRealCLI(t *testing.T) {
	cli := realGit(t)
	builder := containers.Builder{}
	if builder.Present(context.Background(), cli, "img:tag") {
		t.Fatal("Present=true, want false for the missing image")
	}
}

// TestIntegrationBuilderPresentProbesRealBinaries requires the
// nil-Exec runner to inspect through real binaries: a missing image
// reports false, and an exit-zero binary reports true.
func TestIntegrationBuilderPresentProbesRealBinaries(t *testing.T) {
	git := realGit(t)
	builder := containers.Builder{}
	if builder.Present(context.Background(), git, "img:tag") {
		t.Fatal("Present=true, want false for the missing image")
	}
	if _, err := exec.LookPath("/bin/true"); err != nil {
		t.Skip("/bin/true not present")
	}
	if !builder.Present(context.Background(), "/bin/true", "img:tag") {
		t.Fatal("Present=false, want true for the exit-zero binary")
	}
}

// TestIntegrationWaitReadySleepsTheDefaultCadence requires the default
// poll to space a retry without a configured interval.
func TestIntegrationWaitReadySleepsTheDefaultCadence(t *testing.T) {
	calls := 0
	runtime := &containers.Runtime{Exec: func(context.Context, string, []string, []byte) (string, error) {
		calls++
		if calls < 2 {
			return "", errFakeExec
		}
		return "", nil
	}}
	start := time.Now()
	if err := runtime.WaitReady(context.Background(), "db", []string{"ready"}, time.Minute); err != nil {
		t.Fatalf("WaitReady=%v, want nil", err)
	}
	if elapsed := time.Since(start); elapsed < 400*time.Millisecond {
		t.Fatalf("elapsed=%v, want the default poll to space the retry", elapsed)
	}
}

// TestIntegrationWaitReadyYieldsToInterrupt requires a cancel that
// lands while the poll sleeps to interrupt the wait.
func TestIntegrationWaitReadyYieldsToInterrupt(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	runtime := &containers.Runtime{Exec: fakeExec("", errFakeExec), ReadyPoll: time.Hour}
	done := make(chan error, 1)
	go func() { done <- runtime.WaitReady(ctx, "db", []string{"ready"}, time.Hour) }()
	time.Sleep(50 * time.Millisecond)
	cancel()
	select {
	case err := <-done:
		if err == nil || !strings.Contains(err.Error(), "context canceled") {
			t.Fatalf("WaitReady=%v, want the interruption", err)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("WaitReady did not yield to the interrupt")
	}
}
