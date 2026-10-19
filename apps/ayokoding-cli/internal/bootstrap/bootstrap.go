// Package bootstrap wires the ayokoding-cli command tree and owns process
// concerns: signals, panic recovery, and the exit status.
package bootstrap

import (
	"context"
	"io"
	"os"
	"os/signal"
	"syscall"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/cli"
)

// Build stamps, set at link time. An empty catalog stamp falls back to the
// hash of the embedded catalog, so local builds stay honest.
var (
	version = "dev"
	commit  = "unknown"
	catalog = ""
)

// Main runs the CLI and exits the process with the resulting status.
func Main() {
	os.Exit(run(os.Args[1:], os.Stdout, os.Stderr))
}

// run wires process concerns and returns the exit status without exiting, so
// callers stay testable: SIGPIPE notifies instead of killing the process, so
// a closed standard output surfaces as EPIPE and maps to 141; SIGINT and
// SIGTERM cancel the command context, which maps to 130 after the cleanup
// hook runs. AYOKODING_FAULT is the test-only fault seam (panic, hang, spam,
// failing-run); it is never set in production.
func run(args []string, stdout, stderr io.Writer) int {
	pipe := make(chan os.Signal, 1)
	signal.Notify(pipe, syscall.SIGPIPE)
	defer signal.Stop(pipe)
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	_, noColor := os.LookupEnv("NO_COLOR")
	return cli.Execute(ctx, args, cli.Options{
		Stdout:  stdout,
		Stderr:  stderr,
		Version: version,
		Commit:  commit,
		Catalog: catalog,
		NoColor: noColor,
		Fault:   os.Getenv("AYOKODING_FAULT"),
	})
}
