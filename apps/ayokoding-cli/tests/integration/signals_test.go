// Package integration proves process-boundary behaviour against the built
// binary: real signals, real pipes, and temporary directories.
package integration_test

import (
	"bytes"
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// buildCLI compiles the current source into a temporary directory and returns
// the binary path.
func buildCLI(t *testing.T) string {
	t.Helper()
	binary := filepath.Join(t.TempDir(), "ayokoding-cli")
	build := exec.CommandContext(context.Background(), "go", "build", "-trimpath", "-o", binary, "./cmd/ayokoding-cli")
	build.Dir = "../.."
	output, err := build.CombinedOutput()
	if err != nil {
		t.Fatalf("build CLI: %v\n%s", err, output)
	}
	return binary
}

// TestInterruptExits130 starts a blocked check, sends SIGINT, and requires
// exit 130.
func TestInterruptExits130(t *testing.T) {
	binary := buildCLI(t)
	cmd := exec.CommandContext(context.Background(), binary, "examples", "check", "--course", "demo")
	cmd.Env = append(os.Environ(), "AYOKODING_FAULT=hang")
	stderr, err := cmd.StderrPipe()
	if err != nil {
		t.Fatalf("attach stderr: %v", err)
	}
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	if err := cmd.Start(); err != nil {
		t.Fatalf("start CLI: %v", err)
	}
	started := make([]byte, 64)
	n, err := stderr.Read(started)
	if err != nil || !strings.Contains(string(started[:n]), "waiting for interrupt") {
		_ = cmd.Wait()
		t.Fatalf("blocked check never started (read=%d err=%v)", n, err)
	}
	if err := cmd.Process.Signal(os.Interrupt); err != nil {
		_ = cmd.Wait()
		t.Fatalf("signal check: %v", err)
	}
	waitErr := cmd.Wait()
	var exitErr *exec.ExitError
	if !errors.As(waitErr, &exitErr) {
		t.Fatalf("check exited without a status: %v", waitErr)
	}
	if exitErr.ExitCode() != 130 {
		t.Fatalf("status=%d, want 130", exitErr.ExitCode())
	}
}

// TestClosedStdoutExits141 closes the binary's standard output mid-payload
// and requires exit 141.
func TestClosedStdoutExits141(t *testing.T) {
	binary := buildCLI(t)
	cmd := exec.CommandContext(context.Background(), binary, "examples", "check", "--course", "many")
	cmd.Env = append(os.Environ(), "AYOKODING_FAULT=spam")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		t.Fatalf("attach stdout: %v", err)
	}
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Start(); err != nil {
		t.Fatalf("start CLI: %v", err)
	}
	first := make([]byte, 4096)
	_, _ = stdout.Read(first)
	_ = stdout.Close()
	waitErr := cmd.Wait()
	var exitErr *exec.ExitError
	if !errors.As(waitErr, &exitErr) {
		t.Fatalf("check exited without a status: %v", waitErr)
	}
	if exitErr.ExitCode() != 141 {
		t.Fatalf("status=%d, want 141 (stderr=%q)", exitErr.ExitCode(), stderr.String())
	}
}
