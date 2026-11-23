package integration_test

import (
	"context"
	"errors"
	"os/exec"
	"testing"
)

// TestMainExitsOnUsageErrors requires the built binary to exit 0 on
// --version and 2 on an unknown flag, proving the process wiring maps
// the command status to the exit status.
func TestMainExitsOnUsageErrors(t *testing.T) {
	binary := buildCLI(t)
	version := exec.CommandContext(context.Background(), binary, "--version")
	if output, err := version.CombinedOutput(); err != nil {
		t.Fatalf("--version=%v (%s)", err, output)
	}
	unknown := exec.CommandContext(context.Background(), binary, "--no-such-flag")
	err := unknown.Run()
	var exitErr *exec.ExitError
	if !errors.As(err, &exitErr) {
		t.Fatalf("unknown flag exited without a status: %v", err)
	}
	if exitErr.ExitCode() != 2 {
		t.Fatalf("unknown flag status=%d, want exit 2", exitErr.ExitCode())
	}
}
