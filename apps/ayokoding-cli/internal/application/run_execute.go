package application

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"maps"
	"os"
	"path"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/runspec"
)

// serviceDataDirs maps each catalog service to its tmpfs data folder. The
// catalog carries no data folder, so the harness pins the two it teaches.
// Postgres 18 stores data in major-version directories below
// /var/lib/postgresql and refuses a mount at the old /data path.
var serviceDataDirs = map[string]string{
	"postgres": "/var/lib/postgresql",
	"neo4j":    "/data",
}

// errProbeUnready reports a readiness probe that answered with a nonzero
// exit status.
var errProbeUnready = errors.New("application: service probe reported unready")

// summaryPattern matches the S7 simulation summary on the last output line.
var summaryPattern = regexp.MustCompile(`^seeds: ([0-9]+) passed, ([0-9]+) failed \(of ([0-9]+)\)$`)

// minSimulationSeeds is the smallest seed set the harness accepts.
const minSimulationSeeds = 32

// ignoreExpect is the expected-output word skipping comparison.
const ignoreExpect = "ignore"

// diagnosisLineCap bounds one quoted line inside a finding message.
const diagnosisLineCap = 160

// executeUnit sets up services, executes every run in order, and tears the
// services down on every path.
func (flow *runner) executeUnit(ctx context.Context, prep preparedUnit) error {
	teardown, err := flow.setupServices(ctx, prep)
	if err != nil {
		return err
	}
	defer teardown(ctx)
	for _, run := range prep.spec.Runs {
		if err := flow.executeRun(ctx, prep, run); err != nil {
			return err
		}
	}
	return nil
}

// setupServices creates the unit network, starts every declared service,
// waits for readiness, and returns the teardown removing containers before
// the network. Units without services run on --network none.
func (flow *runner) setupServices(ctx context.Context, prep preparedUnit) (func(context.Context), error) {
	noop := func(context.Context) {}
	if len(prep.spec.Services) == 0 {
		return noop, nil
	}
	network := containerplan.NetworkName(flow.runID, prep.unit.Path)
	if _, err := flow.req.Runtime.Run(ctx, containerplan.NetworkCreate(flow.cli, network, flow.runID), nil); err != nil {
		return noop, fmt.Errorf("application: create network for %q: %w", prep.unit.Path, err)
	}
	flow.req.Runtime.TrackNetwork(network)
	var started []string
	for _, serviceID := range prep.spec.Services {
		name, err := flow.startService(ctx, serviceID, network)
		if err != nil {
			flow.removeServices(ctx, started, network)
			return noop, err
		}
		started = append(started, name)
	}
	if err := flow.waitServices(ctx, prep); err != nil {
		flow.removeServices(ctx, started, network)
		return noop, err
	}
	return func(teardownCtx context.Context) {
		flow.removeServices(teardownCtx, started, network)
	}, nil
}

// startService pulls the service image, starts it detached on the unit
// network, and tracks it for the interrupt cleanup.
func (flow *runner) startService(ctx context.Context, serviceID, network string) (string, error) {
	entry, _ := flow.req.Catalog.Lookup(serviceID)
	dataDir, ok := serviceDataDirs[serviceID]
	if !ok {
		return "", &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "service " + serviceID + " names no data folder",
		}
	}
	if err := flow.pull(ctx, entry.Image); err != nil {
		return "", err
	}
	name := "ayokoding-" + flow.runID + "-" + serviceID
	invoke := containerplan.ServiceStart(containerplan.ServiceConfig{
		CLI: flow.cli, Name: name, RunID: flow.runID, ServiceID: serviceID,
		Network: network, Image: entry.Image, DataDir: dataDir, Env: entry.Env,
	})
	if _, err := flow.req.Runtime.Run(ctx, invoke, nil); err != nil {
		return "", fmt.Errorf("application: start service %q: %w", serviceID, err)
	}
	flow.req.Runtime.TrackContainer(name)
	return name, nil
}

// waitServices polls every service readiness probe bounded by its catalog
// readyTimeout: elapsing is the 124 environment error.
func (flow *runner) waitServices(ctx context.Context, prep preparedUnit) error {
	for _, serviceID := range prep.spec.Services {
		entry, _ := flow.req.Catalog.Lookup(serviceID)
		timeout, err := time.ParseDuration(entry.ReadyTimeout)
		if err != nil {
			return &finding.Error{
				Code:    finding.UsageInvalidArguments,
				Message: "service " + serviceID + " names no parsable readyTimeout",
			}
		}
		name := "ayokoding-" + flow.runID + "-" + serviceID
		probe := func(probeCtx context.Context) error {
			executed, err := flow.req.Runtime.Run(probeCtx, containerplan.Invocation{
				Binary: flow.cli,
				Args:   append([]string{"exec", name}, entry.Ready...),
			}, nil)
			if err != nil {
				return fmt.Errorf("application: probe service %q: %w", serviceID, err)
			}
			if executed.Exit != 0 {
				return fmt.Errorf("%w: %s exit %d", errProbeUnready, serviceID, executed.Exit)
			}
			return nil
		}
		if err := containerplan.PollReady(ctx, serviceID, timeout, flow.now, flow.sleep, probe); err != nil {
			return fmt.Errorf("application: wait service %q: %w", serviceID, err)
		}
	}
	return nil
}

// removeServices runs the planned teardown best-effort: containers first,
// then the network.
func (flow *runner) removeServices(ctx context.Context, started []string, network string) {
	for _, invoke := range containerplan.Cleanup(flow.cli, started, network) {
		_, _ = flow.req.Runtime.Run(ctx, invoke, nil)
	}
}

// pull fetches one pinned image once: local environment and derived tags
// never reach the registry.
func (flow *runner) pull(ctx context.Context, image string) error {
	if !strings.Contains(image, "@sha256:") || isLocalImage(image) {
		return nil
	}
	if flow.pulled[image] {
		return nil
	}
	if err := flow.req.Runtime.Pull(ctx, image); err != nil {
		return fmt.Errorf("application: pull image: %w", err)
	}
	flow.pulled[image] = true
	return nil
}

// isLocalImage reports whether the reference names a harness-local image,
// which always runs from the local store. The namespaces live with the
// run-reference resolution in containerplan, so the pull skip and the
// planned run reference agree.
func isLocalImage(image string) bool {
	return containerplan.IsLocalImage(image)
}

// executeRun executes one run: the double run with comparison, the
// expectation comparison, the simulation gate, and recording. Timeouts and
// mismatches are negative findings; environment failures stop the command.
func (flow *runner) executeRun(ctx context.Context, prep preparedUnit, run runspec.Run) error {
	stdin, err := flow.stdinBytes(prep, run)
	if err != nil {
		return err
	}
	if err := flow.pull(ctx, prep.image); err != nil {
		return err
	}
	first, err := flow.executeOnce(ctx, prep, run, 0, stdin)
	if err != nil {
		return err
	}
	if first.TimedOut {
		flow.addFindingf(prep, CodeRunTimeout, "run %q exceeded timeout %s", run.Name, run.Timeout.String())
		return nil
	}
	if flow.req.Seed != nil {
		flow.finishReplay(prep, run, first)
		return nil
	}
	if !flow.req.SingleRun {
		second, err := flow.executeOnce(ctx, prep, run, 1, stdin)
		if err != nil {
			return err
		}
		if second.TimedOut {
			flow.addFindingf(prep, CodeRunTimeout, "run %q exceeded timeout %s", run.Name, run.Timeout.String())
			return nil
		}
		if diff := compareExecutions(run, first, second); diff != nil {
			flow.report.Findings = append(flow.report.Findings, runFinding(prep, diff.Code, diff.Message))
			return nil
		}
	}
	mark := len(flow.report.Findings)
	if err := flow.checkExpectation(prep, run, first); err != nil {
		return err
	}
	if len(flow.report.Findings) == mark {
		flow.report.Passed = append(flow.report.Passed, PassedRun{
			Course: prep.course,
			Unit:   prep.unit.Path,
			Run:    run.Name,
			Label:  passLabelFor(prep),
		})
	}
	return nil
}

// executeOnce plans and runs one execution under the run timeout: a dead
// parent context propagates for the 130 mapping, the elapsed timeout
// becomes the timed-out marker, and anything else keeps its error.
func (flow *runner) executeOnce(ctx context.Context, prep preparedUnit, run runspec.Run, seq int, stdin []byte) (Execution, error) {
	work, err := flow.workingCopy(prep.files, prep.unit, prep.links)
	if err != nil {
		return Execution{}, err
	}
	defer func() {
		_ = os.RemoveAll(work)
	}()
	prep.work = work
	exec := flow.execs
	flow.execs++
	invoke := containerplan.PlanRun(flow.runConfig(prep, run, seq, exec)).Invoke
	name := containerplan.RunName(flow.runID, exec)
	flow.req.Runtime.TrackContainer(name)
	timeoutCtx, cancel := context.WithTimeout(ctx, run.Timeout)
	defer cancel()
	executed, err := flow.req.Runtime.Run(timeoutCtx, invoke, stdin)
	if err == nil && !executed.TimedOut {
		return executed, nil
	}
	if err == nil {
		flow.removeTimedOut(ctx, name)
		return executed, nil
	}
	if ctx.Err() != nil {
		return Execution{}, fmt.Errorf("application: execute run %q: %w", run.Name, ctx.Err())
	}
	if errors.Is(err, context.DeadlineExceeded) || timeoutCtx.Err() != nil {
		flow.removeTimedOut(ctx, name)
		return Execution{TimedOut: true}, nil
	}
	return Execution{}, fmt.Errorf("application: execute run %q: %w", run.Name, err)
}

// removeTimedOut removes one timed-out execution container at once.
// Killing the container CLI orphans the container, so the run-timeout
// finding removes it explicitly while sibling units still run. Failures
// stay best-effort: the finding already reports the timeout.
func (flow *runner) removeTimedOut(ctx context.Context, name string) {
	_ = flow.req.Runtime.RemoveContainer(ctx, name)
}

// runConfig plans one execution: the merged environment, the service
// network when declared, and the replay seed only in replay. The per-run
// sequence drives the CPU quota; the command-scoped ordinal names the
// container, so names stay unique across units and runs.
func (flow *runner) runConfig(prep preparedUnit, run runspec.Run, seq, exec int) containerplan.RunConfig {
	toolchain, _ := flow.req.Catalog.Lookup(prep.spec.Toolchain)
	serviceEnv := map[string]string{}
	for _, serviceID := range prep.spec.Services {
		entry, _ := flow.req.Catalog.Lookup(serviceID)
		maps.Copy(serviceEnv, entry.Connect)
	}
	network := ""
	if len(prep.spec.Services) != 0 {
		network = containerplan.NetworkName(flow.runID, prep.unit.Path)
	}
	seed := ""
	if flow.req.Seed != nil {
		seed = strconv.Itoa(*flow.req.Seed)
	}
	return containerplan.RunConfig{
		CLI: flow.cli, RunID: flow.runID, Seq: seq, Exec: exec, Image: prep.image, Platform: toolchain.Platform, Command: run.Command,
		Unit: prep.unit.Path, Workdir: run.Workdir, HostDir: prep.work, Stdin: run.Stdin != "",
		CPUs: prep.spec.CPUs, MemoryBytes: prep.spec.MemoryBytes,
		UID: os.Getuid(), GID: os.Getgid(),
		ToolchainEnv: toolchain.Env, ServiceEnv: serviceEnv, RunEnv: run.Env,
		Network: network, Seed: seed, Links: prep.links,
	}
}

// stdinBytes reads the run input file, if any.
func (flow *runner) stdinBytes(prep preparedUnit, run runspec.Run) ([]byte, error) {
	if run.Stdin == "" {
		return nil, nil
	}
	data, err := fs.ReadFile(prep.files, prep.unit.Path+"/"+run.Stdin)
	if err != nil {
		return nil, fmt.Errorf("application: read stdin for run %q: %w", run.Name, err)
	}
	return data, nil
}

// passLabelFor labels static runs passed (static) and real runs passed.
func passLabelFor(prep preparedUnit) string {
	if prep.spec.StaticReason != "" {
		return staticPassLabel
	}
	return passLabel
}

// addFindingf appends one run finding at the unit run spec.
func (flow *runner) addFindingf(prep preparedUnit, code, format string, args ...any) {
	flow.report.Findings = append(flow.report.Findings, runFinding(prep, code, fmt.Sprintf(format, args...)))
}

// runFinding names one run finding at the unit run spec start. Run-time
// findings carry no parsed line, so they point at the spec start.
func runFinding(prep preparedUnit, code, message string) finding.Finding {
	return finding.Finding{
		Code:    code,
		Course:  prep.course,
		Path:    prep.unit.Path + "/run.yaml",
		Line:    1,
		Message: message,
	}
}

// comparedFinding carries one comparison outcome.
type comparedFinding struct {
	Code    string
	Message string
}

// compareExecutions compares the two executions byte for byte: exit always,
// standard output unless ignored, standard error unless ignored. A
// difference is nondeterministic, shown with the first differing line.
func compareExecutions(run runspec.Run, first, second Execution) *comparedFinding {
	if first.Exit != second.Exit {
		return &comparedFinding{
			Code:    CodeNondeterministic,
			Message: "run " + strconv.Quote(run.Name) + " differs between executions: first exit " + strconv.Itoa(first.Exit) + ", second exit " + strconv.Itoa(second.Exit),
		}
	}
	if run.Expect.Stdout != ignoreExpect {
		if line, expected, actual := firstDiffLine(first.Stdout, second.Stdout); line != 0 {
			return &comparedFinding{
				Code:    CodeNondeterministic,
				Message: "run " + strconv.Quote(run.Name) + " differs between executions at line " + strconv.Itoa(line) + ": first " + shortLine(expected) + ", second " + shortLine(actual),
			}
		}
	}
	if run.Expect.Stderr != ignoreExpect {
		if line, expected, actual := firstDiffLine(first.Stderr, second.Stderr); line != 0 {
			return &comparedFinding{
				Code:    CodeNondeterministic,
				Message: "run " + strconv.Quote(run.Name) + " differs between executions on standard error at line " + strconv.Itoa(line) + ": first " + shortLine(expected) + ", second " + shortLine(actual),
			}
		}
	}
	return nil
}

// checkExpectation compares one execution with its expectation: exit, then
// both streams, then the simulation gate for simulation runs.
func (flow *runner) checkExpectation(prep preparedUnit, run runspec.Run, executed Execution) error {
	if executed.Exit != run.Expect.Exit {
		flow.addFindingf(prep, CodeExitMismatch, "run %q differs: expected exit %d, actual %d", run.Name, run.Expect.Exit, executed.Exit)
		return nil
	}
	stdout, err := flow.checkStream(prep, run, streamStdout, run.Expect.Stdout, executed.Stdout)
	if err != nil {
		return err
	}
	if len(stdout) != 0 {
		flow.report.Findings = append(flow.report.Findings, stdout...)
		return nil
	}
	stderr, err := flow.checkStream(prep, run, streamStderr, run.Expect.Stderr, executed.Stderr)
	if err != nil {
		return err
	}
	if len(stderr) != 0 {
		flow.report.Findings = append(flow.report.Findings, stderr...)
		return nil
	}
	if run.Simulation {
		flow.checkSimulation(prep, run, executed.Stdout)
	}
	return nil
}

// Stream names in comparisons.
const (
	streamStdout = "stdout"
	streamStderr = "stderr"
)

// checkStream compares one stream with its expectation, returning zero or
// one finding: ignore skips, a missing file records or fails naming
// --record, and bytes compare at the first differing line.
func (flow *runner) checkStream(prep preparedUnit, run runspec.Run, stream, expected, actual string) ([]finding.Finding, error) {
	if expected == ignoreExpect {
		return nil, nil
	}
	if expected == "empty" {
		if actual == "" {
			return nil, nil
		}
		code := CodeStdoutMismatch
		if stream == streamStderr {
			code = CodeStderrMismatch
		}
		return []finding.Finding{runFinding(prep, code, "run "+strconv.Quote(run.Name)+" "+stream+" differs: expected empty, actual "+shortLine(actual))}, nil
	}
	data, missing, err := flow.expectedBytes(prep, expected)
	if err != nil {
		return nil, err
	}
	if missing {
		found, err := flow.recordOrMissing(prep, run, stream, expected, actual)
		if err != nil {
			return nil, err
		}
		return []finding.Finding{found}, nil
	}
	if line, want, got := firstDiffLine(string(data), actual); line != 0 {
		code := CodeStdoutMismatch
		if stream == streamStderr {
			code = CodeStderrMismatch
		}
		return []finding.Finding{runFinding(prep, code, "run "+strconv.Quote(run.Name)+" "+stream+" differs at line "+strconv.Itoa(line)+": expected "+shortLine(want)+", actual "+shortLine(got))}, nil
	}
	return nil, nil
}

// expectedBytes reads one expected-output file from the course content,
// reporting whether it is missing.
func (flow *runner) expectedBytes(prep preparedUnit, name string) ([]byte, bool, error) {
	data, err := fs.ReadFile(prep.files, prep.unit.Path+"/"+name)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, true, nil
		}
		return nil, false, fmt.Errorf("application: read expected file %q: %w", name, err)
	}
	return data, false, nil
}

// recordOrMissing records a missing expected file with the actual output
// under --record, else fails naming the file and the flag.
func (flow *runner) recordOrMissing(prep preparedUnit, run runspec.Run, stream, name, actual string) (finding.Finding, error) {
	code := CodeStdoutMismatch
	if stream == streamStderr {
		code = CodeStderrMismatch
	}
	if !flow.req.Record {
		return runFinding(prep, code, "run "+strconv.Quote(run.Name)+" misses expected file "+name+": run with --record to write it"), nil
	}
	target := flow.req.ContentDir + "/" + prep.course + "/" + prep.unit.Path + "/" + name
	if err := os.MkdirAll(path.Dir(target), 0o750); err != nil {
		return finding.Finding{}, fmt.Errorf("application: record expected file %q: %w", name, err)
	}
	if err := os.WriteFile(target, []byte(actual), 0o644); err != nil {
		return finding.Finding{}, fmt.Errorf("application: record expected file %q: %w", name, err)
	}
	return runFinding(prep, code, "run "+strconv.Quote(run.Name)+" recorded missing "+name+": re-run to verify"), nil
}

// checkSimulation gates simulation runs on the S7 summary: the last output
// line carries the seed counts with a total of at least 32.
func (flow *runner) checkSimulation(prep preparedUnit, run runspec.Run, stdout string) {
	trimmed := strings.TrimRight(stdout, "\n")
	last := trimmed
	if index := strings.LastIndex(trimmed, "\n"); index >= 0 {
		last = trimmed[index+1:]
	}
	matched := summaryPattern.FindStringSubmatch(last)
	if matched == nil {
		flow.addFindingf(prep, CodeSimulationSummary, "run %q misses the simulation summary line %q", run.Name, "seeds: <passed> passed, <failed> failed (of <total>)")
		return
	}
	total, _ := strconv.Atoi(matched[3])
	if total < minSimulationSeeds {
		flow.addFindingf(prep, CodeSimulationSummary, "run %q simulates %d seeds, at least %d required", run.Name, total, minSimulationSeeds)
	}
}

// finishReplay records one replayed seed trace: no comparison, pass when
// the run exits 0. A clean replay joins the passes, so the trace doubles
// as the green label.
func (flow *runner) finishReplay(prep preparedUnit, run runspec.Run, executed Execution) {
	seed := 0
	if flow.req.Seed != nil {
		seed = *flow.req.Seed
	}
	flow.report.Replays = append(flow.report.Replays, ReplayOutput{
		Course: prep.course,
		Unit:   prep.unit.Path,
		Run:    run.Name,
		Seed:   seed,
		Stdout: executed.Stdout,
	})
	if executed.Exit != 0 {
		flow.addFindingf(prep, CodeExitMismatch, "run %q differs: expected exit 0, actual %d", run.Name, executed.Exit)
		return
	}
	flow.report.Passed = append(flow.report.Passed, PassedRun{
		Course: prep.course,
		Unit:   prep.unit.Path,
		Run:    run.Name,
		Label:  passLabelFor(prep),
	})
}

// firstDiffLine returns the 1-based line where two outputs differ with both
// bytes, or zero when they match.
func firstDiffLine(want, got string) (int, string, string) {
	wantLines := strings.Split(want, "\n")
	gotLines := strings.Split(got, "\n")
	for index := 0; index < len(wantLines) && index < len(gotLines); index++ {
		if wantLines[index] != gotLines[index] {
			return index + 1, wantLines[index], gotLines[index]
		}
	}
	if len(wantLines) != len(gotLines) {
		shorter := min(len(wantLines), len(gotLines))
		wantLine, gotLine := "", ""
		if shorter < len(wantLines) {
			wantLine = wantLines[shorter]
		}
		if shorter < len(gotLines) {
			gotLine = gotLines[shorter]
		}
		return shorter + 1, wantLine, gotLine
	}
	return 0, "", ""
}

// shortLine quotes one diagnosis line, bounding long lines.
func shortLine(line string) string {
	if len(line) > diagnosisLineCap {
		line = line[:diagnosisLineCap] + "…"
	}
	return strconv.Quote(line)
}
