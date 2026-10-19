package application

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"time"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/layout"
)

// RunRequest selects the course units to run and carries the runtime that
// executes them. Courses names opted-in courses; All runs every opted-in
// course. Unit runs one unit path only and requires exactly one course;
// Seed replays one simulation seed and requires Unit. Record writes missing
// expected files through ContentDir, which must name the writable content
// root. Now and Sleep default to the wall clock; tests inject a fake clock
// so the readiness bound stays deterministic.
type RunRequest struct {
	Content    fs.FS
	ContentDir string
	Catalog    catalog.Catalog
	Courses    []string
	All        bool
	Unit       string
	Seed       *int
	Record     bool
	SingleRun  bool
	Runtime    Runtime
	EnvBuilder EnvImageBuilder
	Settings   containerplan.Settings
	RunID      string
	Links      []containerplan.Link
	Now        func() time.Time
	Sleep      func(time.Duration)
}

// PassedRun is one green run with its reader-facing label.
type PassedRun struct {
	Course string
	Unit   string
	Run    string
	Label  string
}

// ReplayOutput carries one replayed seed trace for the CLI to print.
type ReplayOutput struct {
	Course string
	Unit   string
	Run    string
	Seed   int
	Stdout string
}

// RunReport holds every run outcome: negative findings, green passes, and
// replay traces. A nil error with findings means exit 1; a coded error
// means its supervisor status, so usage outranks environment failures,
// which outrank negative results, which outrank green.
type RunReport struct {
	Findings []finding.Finding
	Passed   []PassedRun
	Replays  []ReplayOutput
}

// Failed reports whether the report holds any negative finding.
func (report RunReport) Failed() bool {
	return len(report.Findings) != 0
}

// passLabel is the green label for real runs.
const passLabel = "passed"

// staticPassLabel is the green label for static runs.
const staticPassLabel = "passed (static)"

// sweepAge removes labelled leftovers older than a day at every start.
const sweepAge = 24 * time.Hour

// runner carries one Run call: the request, the run identity, the pulled
// images, the command-scoped execution ordinal, and the accumulating
// report.
type runner struct {
	req    RunRequest
	runID  string
	cli    string
	now    func() time.Time
	sleep  func(time.Duration)
	pulled map[string]bool
	execs  int
	report RunReport
}

// Run executes every run of every selected unit in isolated containers,
// twice, comparing executions and expectations. Environment failures stop
// the command at once with their coded error; negative results accumulate
// as findings and the command exits 1.
func Run(ctx context.Context, req RunRequest) (RunReport, error) {
	if err := checkRunFlags(req); err != nil {
		return RunReport{}, err
	}
	selected := req.Courses
	if req.All {
		selected = nil
	}
	courses, err := selectCourses(req.Content, selected, false)
	if err != nil {
		return RunReport{}, err
	}
	now := req.Now
	if now == nil {
		now = time.Now
	}
	sleep := req.Sleep
	if sleep == nil {
		sleep = time.Sleep
	}
	runID := req.RunID
	if runID == "" {
		runID = fmt.Sprintf("%d-%d", time.Now().UnixNano(), os.Getpid())
	}
	flow := &runner{
		req:    req,
		runID:  runID,
		cli:    req.Settings.CLI(),
		now:    now,
		sleep:  sleep,
		pulled: map[string]bool{},
	}
	if err := flow.run(ctx, courses); err != nil {
		return flow.report, err
	}
	return flow.report, nil
}

// checkRunFlags rejects flag combinations the run selection cannot honor.
func checkRunFlags(req RunRequest) error {
	if len(req.Courses) == 0 && !req.All {
		return &finding.Error{
			Code:    finding.UsageMissingSelection,
			Message: missingSelectionMessage,
		}
	}
	if req.Unit != "" && len(req.Courses) != 1 {
		return &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "--unit runs one unit path of exactly one --course",
		}
	}
	if req.Seed != nil && req.Unit == "" {
		return &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "--seed replays one seed of the --unit run",
		}
	}
	if req.Record && req.ContentDir == "" {
		return &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "--record needs a writable content directory",
		}
	}
	return nil
}

// run probes the daemon, sweeps leftovers, and runs every course in order.
// When the command context ends first, the tracked containers and networks
// go with it, so an interrupt never leaves labelled resources behind.
func (flow *runner) run(ctx context.Context, courses []string) error {
	defer flow.cleanupAtInterrupt(ctx)
	if err := flow.req.Runtime.Probe(ctx); err != nil {
		return fmt.Errorf("application: probe container runtime: %w", err)
	}
	if err := flow.req.Runtime.Sweep(ctx, sweepAge); err != nil {
		return fmt.Errorf("application: sweep leftover containers: %w", err)
	}
	for _, course := range courses {
		if err := ctx.Err(); err != nil {
			return fmt.Errorf("application: run courses: %w", err)
		}
		if err := flow.runCourse(ctx, course); err != nil {
			return err
		}
	}
	sortFindings(flow.report.Findings)
	return nil
}

// cleanupAtInterrupt removes every tracked container and network when the
// command context ended first. Completed runs already tore their services
// down, leaving nothing tracked; the removal inherits the command context
// values without its cancellation, because the command one is spent.
func (flow *runner) cleanupAtInterrupt(ctx context.Context) {
	if ctx.Err() == nil {
		return
	}
	_ = flow.req.Runtime.Cleanup(context.WithoutCancel(ctx))
}

// runCourse runs every selected unit of one course: placement findings
// belong to validate, but a unit without a run spec cannot run, so its
// missing-spec finding joins the report.
func (flow *runner) runCourse(ctx context.Context, course string) error {
	sub, err := fs.Sub(flow.req.Content, course)
	if err != nil {
		return fmt.Errorf("application: open course %q: %w", course, err)
	}
	units, _ := layout.Discover(course, sub)
	flow.report.Findings = append(flow.report.Findings, layout.MissingSpecs(course, sub, units)...)
	for _, unit := range units {
		if flow.req.Unit != "" && unit.Path != flow.req.Unit {
			continue
		}
		if err := flow.runUnit(ctx, course, sub, unit); err != nil {
			return err
		}
	}
	if flow.req.Unit != "" && !unitSelected(units, flow.req.Unit) {
		return &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "unit " + flow.req.Unit + " does not exist in course " + course,
		}
	}
	return nil
}

// unitSelected reports whether the filter names a discovered unit.
func unitSelected(units []layout.Unit, path string) bool {
	for _, unit := range units {
		if unit.Path == path {
			return true
		}
	}
	return false
}
