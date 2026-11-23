package bdd_test

import (
	"bytes"
	"context"
	"errors"
	"fmt"

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
		// The fake container CLI staged by useFakeContainerCLI arrives
		// through the invocation env; bootstrap forwards it the same way
		// for the binary drivers. Without this the in-process driver
		// probes the real podman, which fails locally (accidental 125)
		// and passes wherever a daemon runs (exit 0).
		ContainerCLI: invocation.Env["AYOKODING_CONTAINER_CLI"],
	})
	return Result{Status: status, Stdout: stdout.buffer.String(), Stderr: stderr.String()}, nil
}
