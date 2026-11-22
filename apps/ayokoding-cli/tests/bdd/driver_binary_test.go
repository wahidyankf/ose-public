//go:build integration || e2e

package bdd_test

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// levelPaths names the feature corpus the integration and end-to-end levels
// run in full.
func levelPaths() []string {
	return []string{"../../../../specs/apps/ayokoding/cli/behaviours"}
}

// buildBinary compiles the current source into a temporary directory.
func buildBinary(version, commit string) (string, error) {
	binary := filepath.Join(os.TempDir(), "ayokoding-bdd-"+version)
	_ = os.Remove(binary)
	module := "github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/bootstrap"
	build := exec.CommandContext(context.Background(), "go", "build", "-trimpath",
		"-ldflags", "-X "+module+".version="+version+" -X "+module+".commit="+commit,
		"-o", binary, "./cmd/ayokoding-cli")
	build.Dir = "../.."
	output, err := build.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("bdd: build CLI: %w\n%s", err, output)
	}
	return binary, nil
}

// binaryDriver runs a real binary in a temporary working directory.
type binaryDriver struct {
	binary string
}

// Invoke runs one invocation against the binary.
func (d *binaryDriver) Invoke(invocation Invocation) (Result, error) {
	workdir, err := os.MkdirTemp("", "ayokoding-bdd-")
	if err != nil {
		return Result{}, fmt.Errorf("bdd: temporary directory: %w", err)
	}
	defer func() { _ = os.RemoveAll(workdir) }()
	cmd := exec.CommandContext(context.Background(), d.binary, invocation.Args...)
	cmd.Dir = workdir
	env := os.Environ()
	for key, value := range invocation.Env {
		env = append(env, key+"="+value)
	}
	cmd.Env = env
	if invocation.CloseAfterLines > 0 {
		return d.invokeClosing(cmd, invocation.CloseAfterLines)
	}
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		var exitErr *exec.ExitError
		if !errors.As(err, &exitErr) {
			return Result{}, fmt.Errorf("bdd: run binary: %w", err)
		}
		return Result{Status: exitErr.ExitCode(), Stdout: stdout.String(), Stderr: stderr.String()}, nil
	}
	return Result{Status: 0, Stdout: stdout.String(), Stderr: stderr.String()}, nil
}

// invokeClosing reads a line budget from the binary, then closes standard
// output and waits for the process to notice.
func (d *binaryDriver) invokeClosing(cmd *exec.Cmd, lines int) (Result, error) {
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return Result{}, fmt.Errorf("bdd: attach stdout: %w", err)
	}
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Start(); err != nil {
		return Result{}, fmt.Errorf("bdd: start binary: %w", err)
	}
	first := make([]byte, 4096)
	for range lines {
		if _, err := stdout.Read(first); err != nil {
			break
		}
	}
	_ = stdout.Close()
	if err := cmd.Wait(); err != nil {
		var exitErr *exec.ExitError
		if !errors.As(err, &exitErr) {
			return Result{}, fmt.Errorf("bdd: wait binary: %w", err)
		}
		return Result{Status: exitErr.ExitCode(), Stderr: stderr.String()}, nil
	}
	return Result{Status: 0, Stderr: stderr.String()}, nil
}
