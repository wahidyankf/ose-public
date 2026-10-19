package application

import (
	"context"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
)

// Closed result codes the run use case reports. They extend the finding
// vocabulary beside the sibling ayokoding.examples codes without touching
// the finding package: Finding.Code is a plain string.
const (
	CodeExitMismatch      = "ayokoding.examples.exit-mismatch"
	CodeStdoutMismatch    = "ayokoding.examples.stdout-mismatch"
	CodeStderrMismatch    = "ayokoding.examples.stderr-mismatch"
	CodeRunTimeout        = "ayokoding.examples.run-timeout"
	CodeNondeterministic  = "ayokoding.examples.nondeterministic"
	CodeSimulationSummary = "ayokoding.examples.simulation-summary"
	CodeEnvBuildFailed    = "ayokoding.examples.env-build-failed"
)

// Execution is one container execution outcome: the exit status with its
// standard output and error kept apart, or the timeout marker when the run
// exceeded its own timeout.
type Execution struct {
	Exit     int
	Stdout   string
	Stderr   string
	TimedOut bool
}

// Runtime executes planned container invocations for one run. It is the
// consumer-side port the containers adapter implements; tests carry a
// scripted fake, so no unit test needs a container runtime.
//
// The stdin bytes travel beside the invocation because the plan only
// records whether input exists (--interactive), never its content. Coded
// finding errors (environment failures) pass through untouched so the CLI
// maps them to the supervisor statuses.
type Runtime interface {
	Run(ctx context.Context, invoke containerplan.Invocation, stdin []byte) (Execution, error)
	Probe(ctx context.Context) error
	Pull(ctx context.Context, image string) error
	Sweep(ctx context.Context, olderThan time.Duration) error
	TrackContainer(name string)
	TrackNetwork(name string)
	// RemoveContainer removes one container now. Runs call it when an
	// execution exceeds its own timeout: killing the container CLI
	// orphans the container, so only an explicit removal keeps the
	// daemon clean while sibling units still run.
	RemoveContainer(ctx context.Context, name string) error
	// Cleanup removes every tracked container with rm -f, then every
	// tracked network. Runs call it when the command context ends first,
	// so an interrupt never leaves labelled resources behind.
	Cleanup(ctx context.Context) error
}

// EnvImageBuilder builds one environment image for a toolchain lockfile.
// The containers builder implements it; tests carry a stub.
type EnvImageBuilder interface {
	BuildEnvironment(ctx context.Context, settings containerplan.Settings, contextParent, toolchain, imageRef, lockfileName string, lockfile []byte, install catalog.Install) (string, error)
}
