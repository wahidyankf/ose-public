package bdd_test

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// errOutputClosed is the static write failure the capped writer reports once
// its line budget is spent.
var errOutputClosed = errors.New("standard output closed")

// Result is one invocation outcome.
type Result struct {
	Status int
	Stdout string
	Stderr string
}

// Invocation describes one command run.
type Invocation struct {
	Args            []string
	Env             map[string]string
	Version         string
	Commit          string
	CloseAfterLines int
}

// Driver runs invocations. Unit runs in process; binary drivers run a real
// binary so signals and pipes behave like production.
type Driver interface {
	Invoke(invocation Invocation) (Result, error)
}

// cappedWriter fails writes after a line budget, standing in for a reader
// that closed standard output.
type cappedWriter struct {
	buffer bytes.Buffer
	lines  int
	limit  int
}

func (w *cappedWriter) Write(data []byte) (int, error) {
	if w.limit > 0 && w.lines >= w.limit {
		return 0, errOutputClosed
	}
	written, err := w.buffer.Write(data)
	if err != nil {
		return written, fmt.Errorf("bdd: buffer write: %w", err)
	}
	w.lines += bytes.Count(data, []byte("\n"))
	return written, nil
}

// unitDriver runs the command tree in process with in-memory streams.
type unitDriver struct{}

// Invoke runs one invocation in process.
func (unitDriver) Invoke(invocation Invocation) (Result, error) {
	stdout := &cappedWriter{limit: invocation.CloseAfterLines}
	var stderr bytes.Buffer
	_, noColor := invocation.Env["NO_COLOR"]
	status := cli.Execute(context.Background(), invocation.Args, cli.Options{
		Stdout:  stdout,
		Stderr:  &stderr,
		Version: invocation.Version,
		Commit:  invocation.Commit,
		NoColor: noColor,
		Fault:   invocation.Env["AYOKODING_FAULT"],
	})
	return Result{Status: status, Stdout: stdout.buffer.String(), Stderr: stderr.String()}, nil
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
