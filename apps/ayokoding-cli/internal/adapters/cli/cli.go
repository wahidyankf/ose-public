// Package cli adapts the Cobra command tree to the repository command-line
// contract: streams, exit statuses, structured errors, and colour.
package cli

import (
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// Options configures one command invocation.
type Options struct {
	Stdout      io.Writer
	Stderr      io.Writer
	Version     string
	Commit      string
	Catalog     string
	NoColor     bool
	Fault       string
	OnInterrupt func()
}

// pipeWriter records a broken standard output: any write error means the
// reader closed the pipe, which maps to 141.
type pipeWriter struct {
	target io.Writer
	broken bool
}

// Write forwards the write and records the first failure.
func (w *pipeWriter) Write(data []byte) (int, error) {
	written, err := w.target.Write(data)
	if err != nil {
		w.broken = true
		return written, fmt.Errorf("cli: write standard output: %w", err)
	}
	return written, nil
}

// Execute runs args and returns the process exit status. A panic anywhere
// below maps to 2 with ayokoding.internal.panic and no stack trace.
func Execute(ctx context.Context, args []string, opts Options) (status int) { //nolint:nonamedreturns // deferred recover assigns the status on panic.
	defer func() {
		if recovered := recover(); recovered != nil {
			renderError(opts.Stderr, nil, &finding.Error{
				Code:    finding.InternalPanic,
				Message: "internal failure",
			}, outputMode(args))
			status = finding.ExitCode(&finding.Error{Code: finding.InternalPanic})
		}
	}()
	return execute(ctx, args, opts)
}

// execute builds the tree, runs it, and maps the outcome to a status.
func execute(ctx context.Context, args []string, opts Options) int {
	mode := outputMode(args)
	target := opts.Stdout
	if target == nil {
		target = io.Discard
	}
	out := &pipeWriter{target: target}
	root := newRoot(ctx, opts)
	root.SetOut(out)
	root.SetArgs(args)
	err := root.ExecuteContext(ctx)
	if ctx.Err() != nil {
		if opts.OnInterrupt != nil {
			opts.OnInterrupt()
		}
		return 130
	}
	if out.broken {
		return 141
	}
	if err != nil {
		if status, ok := errors.AsType[*statusError](err); ok {
			return status.status
		}
		renderError(opts.Stderr, root, err, mode)
		return finding.ExitCode(err)
	}
	return finding.ExitCode(nil)
}
