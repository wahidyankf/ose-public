package containers

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// defaultContainerCLI is the Docker command-line interface (decision D4);
// AYOKODING_CONTAINER_CLI overrides it, for example with podman or the
// fake used by integration tests.
const defaultContainerCLI = "docker"

// defaultReadyPoll spaces service readiness probes per tech-docs/005.
const defaultReadyPoll = 500 * time.Millisecond

// runLabel selects this harness's containers and networks.
const runLabel = "ayokoding.run"

// networkSubcommand is the container CLI network group.
const networkSubcommand = "network"

// containerListFormat renders "name|RFC3339" lines for the leftover sweep.
const containerListFormat = "{{.Names}}|{{.CreatedAt}}"

// networkListFormat renders "name|RFC3339" lines for the leftover sweep.
const networkListFormat = "{{.Name}}|{{.CreatedAt}}"

// Result is the outcome of one container execution: the container exit
// status with its standard output and error kept apart. Output repeats
// standard output, so control-plane callers keep reading one stream.
type Result struct {
	ExitCode int
	Output   string
	Stderr   string
}

// TimeoutError reports a run killed at its own timeout. The application
// maps it to the negative result ayokoding.examples.run-timeout (exit 1),
// never to a supervisor status.
type TimeoutError struct {
	// Command is the container CLI call that timed out.
	Command string
}

// Error reports the timed-out command.
func (e *TimeoutError) Error() string {
	return "containers: timed out: " + e.Command
}

// exitError carries a container exit status through the exec seam, so
// callers read the status as data without importing os/exec.
type exitError struct {
	code int
}

// Error reports the container exit status.
func (e *exitError) Error() string {
	return fmt.Sprintf("containers: container exited %d", e.code)
}

// Runtime executes planned container invocations and owns the labelled
// resources they start, so interrupts and sweeps remove the same set.
// The zero value is ready: it resolves the CLI from the environment and
// runs the real CLI with process-group termination.
type Runtime struct {
	// CLI is the container binary. Empty resolves through
	// AYOKODING_CONTAINER_CLI, defaulting to docker.
	CLI string
	// Exec runs one container CLI call and returns its combined output.
	// A nil Exec runs the real CLI through os/exec with process-group
	// termination. Tests select the fake through AYOKODING_CONTAINER_CLI.
	// Stdin carries the run input, nil for control-plane calls.
	Exec func(ctx context.Context, cli string, args []string, stdin []byte) (string, error)
	// Now reports the current time for the leftover sweep. Nil means
	// time.Now.
	Now func() time.Time
	// ReadyPoll spaces service readiness probes. Zero means 500ms, the
	// tech-docs/005 cadence.
	ReadyPoll time.Duration

	mutex      sync.Mutex
	containers []string
	networks   []string
}

// ResolveCLI returns the container binary: AYOKODING_CONTAINER_CLI wins,
// then the configured CLI, then docker.
func (r *Runtime) ResolveCLI() string {
	if cli := os.Getenv("AYOKODING_CONTAINER_CLI"); cli != "" {
		return cli
	}
	if r.CLI != "" {
		return r.CLI
	}
	return defaultContainerCLI
}

// commandFor selects the binary for one planned invocation. The
// AYOKODING_CONTAINER_CLI override wins so integration tests and local
// runs replace the runner without replanning; otherwise the plan stands.
func (r *Runtime) commandFor(invoke containerplan.Invocation) string {
	if cli := os.Getenv("AYOKODING_CONTAINER_CLI"); cli != "" {
		return cli
	}
	if invoke.Binary != "" {
		return invoke.Binary
	}
	return r.ResolveCLI()
}

// now reports the current time, honouring the test seam.
func (r *Runtime) now() time.Time {
	if r.Now != nil {
		return r.Now()
	}
	return time.Now()
}

// pollInterval spaces readiness probes, defaulting to the catalog cadence.
func (r *Runtime) pollInterval() time.Duration {
	if r.ReadyPoll > 0 {
		return r.ReadyPoll
	}
	return defaultReadyPoll
}

// runner selects the injected fake or the supervised container CLI
// runner. Builds keep their own runner in build.go. Control-plane calls
// keep one combined stream; executions split the streams in Run.
func (r *Runtime) runner() func(ctx context.Context, cli string, args []string, stdin []byte) (string, error) {
	if r.Exec != nil {
		return r.Exec
	}
	return func(ctx context.Context, cli string, args []string, stdin []byte) (string, error) {
		var output bytes.Buffer
		err := supervisedExec(ctx, cli, args, stdin, &output, &output)
		return output.String(), err
	}
}

// Run executes one planned invocation and returns its exit status with
// its standard output and error kept apart, so the run expectations can
// compare each stream. Stdin feeds the container standard input, nil for
// control-plane calls. A missing command is 127, an unusable one 126,
// and a run past the context deadline is a *TimeoutError. Injected fakes
// keep one combined stream with empty standard error.
func (r *Runtime) Run(ctx context.Context, invoke containerplan.Invocation, stdin []byte) (Result, error) {
	cli := r.commandFor(invoke)
	if r.Exec == nil {
		var stdout, stderr bytes.Buffer
		err := supervisedExec(ctx, cli, invoke.Args, stdin, &stdout, &stderr)
		return finishRun(invoke, stdout.String(), stderr.String(), err)
	}
	output, err := r.Exec(ctx, cli, invoke.Args, stdin)
	return finishRun(invoke, output, "", err)
}

// finishRun maps one execution outcome to its result: a missing command
// is 127, an unusable one 126, and a run past the context deadline is a
// *TimeoutError carried for the run-timeout mapping.
func finishRun(invoke containerplan.Invocation, stdout, stderr string, err error) (Result, error) {
	if err == nil {
		return Result{ExitCode: 0, Output: stdout, Stderr: stderr}, nil
	}
	if timeout, ok := errors.AsType[*TimeoutError](err); ok {
		return Result{}, fmt.Errorf("containers: run %s: %w", invoke.Args, timeout)
	}
	if coded, ok := errors.AsType[*finding.Error](err); ok {
		return Result{}, fmt.Errorf("containers: run %s: %w", invoke.Args, coded)
	}
	if errors.Is(err, context.Canceled) {
		return Result{}, fmt.Errorf("containers: run %s: %w", invoke.Args, err)
	}
	if exited, ok := errors.AsType[*exitError](err); ok {
		return Result{ExitCode: exited.code, Output: stdout, Stderr: stderr}, nil
	}
	return Result{Output: stdout, Stderr: stderr}, fmt.Errorf("containers: run %s: %w", invoke.Args, err)
}

// Probe checks the container daemon answers. A refusal is the environment
// error ayokoding.env.container-runtime-unavailable (exit 125).
func (r *Runtime) Probe(ctx context.Context) error {
	output, err := r.runner()(ctx, r.ResolveCLI(), []string{"version"}, nil)
	if err == nil {
		return nil
	}
	return r.refused("probe container runtime", output, err)
}

// Pull fetches one pinned image. A failure is the environment error
// ayokoding.env.container-runtime-unavailable (exit 125): the pinned
// reference never reached a runnable image. (The tech-docs/005
// image-pull-failed distinction waits on the containers-agent
// pull-failure assertion; see phase-5-gate evidence.)
func (r *Runtime) Pull(ctx context.Context, ref string) error {
	output, err := r.runner()(ctx, r.ResolveCLI(), []string{"pull", ref}, nil)
	if err == nil {
		return nil
	}
	return r.refused("pull image "+ref, output, err)
}

// refused maps a daemon or pull failure to 125, letting the 126, 127,
// timeout, and interrupt outcomes through untouched.
func (r *Runtime) refused(what, output string, err error) error {
	if coded, ok := errors.AsType[*finding.Error](err); ok {
		return fmt.Errorf("containers: %s: %w", what, coded)
	}
	if timeout, ok := errors.AsType[*TimeoutError](err); ok {
		return fmt.Errorf("containers: %s: %w", what, timeout)
	}
	if errors.Is(err, context.Canceled) {
		return fmt.Errorf("containers: %s: %w", what, err)
	}
	return &finding.Error{
		Code:    finding.EnvRuntimeRefused,
		Message: what + " failed: " + lastLines(output, 5),
	}
}

// WaitReady polls one service readiness probe until it succeeds or the
// timeout elapses. Elapsing is the environment error
// ayokoding.env.service-not-ready (exit 124). A missing or unusable CLI
// fails fast instead of polling.
func (r *Runtime) WaitReady(ctx context.Context, container string, ready []string, timeout time.Duration) error {
	deadline := r.now().Add(timeout)
	for {
		args := append([]string{"exec", container}, ready...)
		_, err := r.runner()(ctx, r.ResolveCLI(), args, nil)
		if err == nil {
			return nil
		}
		if coded, ok := errors.AsType[*finding.Error](err); ok {
			return fmt.Errorf("containers: wait for %s: %w", container, coded)
		}
		if ctx.Err() != nil {
			return fmt.Errorf("containers: wait for %s: %w", container, ctx.Err())
		}
		if !r.now().Before(deadline) {
			return &finding.Error{
				Code:    finding.EnvServiceUnready,
				Message: "service " + container + " never became ready",
			}
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("containers: wait for %s: %w", container, ctx.Err())
		case <-time.After(r.pollInterval()):
		}
	}
}

// TrackContainer records one started container for Cleanup.
func (r *Runtime) TrackContainer(name string) {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	r.containers = append(r.containers, name)
}

// TrackNetwork records one created network for Cleanup.
func (r *Runtime) TrackNetwork(name string) {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	r.networks = append(r.networks, name)
}

// RemoveContainer removes one container now, for timed-out executions the
// run keeps reporting while siblings still run.
func (r *Runtime) RemoveContainer(ctx context.Context, name string) error {
	output, err := r.runner()(ctx, r.ResolveCLI(), []string{"rm", "-f", name}, nil)
	if err != nil {
		return fmt.Errorf("containers: remove container %s: %w: %s", name, err, strings.TrimSpace(output))
	}
	return nil
}

// Cleanup removes every tracked container with rm -f, then every tracked
// network, and untracks both. It is the cleanup hook the caller registers
// with the Phase 1 signal handler (cli.Options.OnInterrupt), which maps
// the interrupt to exit 130 after the hook runs.
func (r *Runtime) Cleanup(ctx context.Context) error {
	r.mutex.Lock()
	containers := append([]string(nil), r.containers...)
	networks := append([]string(nil), r.networks...)
	r.containers = nil
	r.networks = nil
	r.mutex.Unlock()
	var errs []error
	for _, name := range containers {
		if _, err := r.runner()(ctx, r.ResolveCLI(), []string{"rm", "-f", name}, nil); err != nil {
			errs = append(errs, fmt.Errorf("containers: remove container %s: %w", name, err))
		}
	}
	for _, name := range networks {
		if _, err := r.runner()(ctx, r.ResolveCLI(), []string{networkSubcommand, "rm", name}, nil); err != nil {
			errs = append(errs, fmt.Errorf("containers: remove network %s: %w", name, err))
		}
	}
	return errors.Join(errs...)
}

// SweepLeftovers removes labelled containers and networks older than the
// given age. Runs call it at start with 24 hours.
func (r *Runtime) SweepLeftovers(ctx context.Context, olderThan time.Duration) error {
	cli := r.ResolveCLI()
	var errs []error
	output, err := r.runner()(ctx, cli, []string{"ps", "-a", "--filter", "label=" + runLabel, "--format", containerListFormat}, nil)
	if err != nil {
		errs = append(errs, fmt.Errorf("containers: list labelled containers: %w", err))
	} else {
		for _, name := range stale(output, r.now(), olderThan) {
			if _, err := r.runner()(ctx, cli, []string{"rm", "-f", name}, nil); err != nil {
				errs = append(errs, fmt.Errorf("containers: sweep container %s: %w", name, err))
			}
		}
	}
	output, err = r.runner()(ctx, cli, []string{networkSubcommand, "ls", "--filter", "label=" + runLabel, "--format", networkListFormat}, nil)
	if err != nil {
		errs = append(errs, fmt.Errorf("containers: list labelled networks: %w", err))
	} else {
		for _, name := range stale(output, r.now(), olderThan) {
			if _, err := r.runner()(ctx, cli, []string{networkSubcommand, "rm", name}, nil); err != nil {
				errs = append(errs, fmt.Errorf("containers: sweep network %s: %w", name, err))
			}
		}
	}
	return errors.Join(errs...)
}

// stale returns the names listed as "name|timestamp" older than the given
// age. Lines without a parseable timestamp are kept, never swept.
func stale(output string, now time.Time, olderThan time.Duration) []string {
	var names []string
	for line := range strings.Lines(strings.TrimSpace(output)) {
		name, stamp, ok := strings.Cut(line, "|")
		if !ok || name == "" {
			continue
		}
		created, err := parseCreated(strings.TrimSpace(stamp))
		if err != nil {
			continue
		}
		if now.Sub(created) > olderThan {
			names = append(names, name)
		}
	}
	return names
}

// parseCreated reads a container timestamp in RFC 3339 or the Docker
// CreatedAt layout.
func parseCreated(stamp string) (time.Time, error) {
	if created, err := time.Parse(time.RFC3339, stamp); err == nil {
		return created, nil
	}
	created, err := time.Parse("2006-01-02 15:04:05 -0700 MST", stamp)
	if err != nil {
		return time.Time{}, fmt.Errorf("containers: parse timestamp %q: %w", stamp, err)
	}
	return created, nil
}

// supervisedExec runs the container CLI with process-group termination:
// on context done the whole group dies, so grandchildren never outlive
// the run. Standard output and error land in their own writers, so callers
// comparing streams see each one alone. Non-empty stdin feeds the child
// standard input; empty stdin leaves it on the null device. A missing command is 127, an
// unusable one 126, a passed deadline is a *TimeoutError, an interrupt
// carries the context error, and a plain exit arrives as an *exitError
// with its status.
func supervisedExec(ctx context.Context, cli string, args []string, stdin []byte, stdout, stderr io.Writer) error {
	command := strings.Join(append([]string{cli}, args...), " ")
	//nolint:noctx // supervisedExec owns cancellation: on done it kills the whole process group.
	cmd := exec.Command(cli, args...)
	setProcessGroup(cmd)
	if len(stdin) != 0 {
		cmd.Stdin = bytes.NewReader(stdin)
	}
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	if err := cmd.Start(); err != nil {
		return mapStartError(cli, err)
	}
	waiter := make(chan error, 1)
	go func() {
		waiter <- cmd.Wait()
	}()
	select {
	case <-ctx.Done():
		killProcessGroup(cmd)
		<-waiter
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return &TimeoutError{Command: command}
		}
		return fmt.Errorf("containers: interrupted %s: %w", command, ctx.Err())
	case err := <-waiter:
		if err == nil {
			return nil
		}
		if exitErr, ok := errors.AsType[*exec.ExitError](err); ok {
			return &exitError{code: exitErr.ExitCode()}
		}
		return fmt.Errorf("containers: wait for %s: %w", command, err)
	}
}

// mapStartError maps a process start failure to its supervisor status:
// missing is 127, unusable is 126.
func mapStartError(cli string, err error) error {
	if errors.Is(err, exec.ErrNotFound) || errors.Is(err, fs.ErrNotExist) {
		return &finding.Error{Code: finding.EnvNotFound, Message: "container command " + cli + " not found on PATH"}
	}
	if errors.Is(err, fs.ErrPermission) {
		return &finding.Error{Code: finding.EnvNotExecutable, Message: "container command " + cli + " is not executable"}
	}
	return fmt.Errorf("containers: start %s: %w", cli, err)
}
