package cli

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/catalog"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/toolchains"
)

// statusHelp renders the exit-status section of the help text from the same
// source the exit mapping reads.
func statusHelp() string {
	var text strings.Builder
	text.WriteString("Exit statuses:\n")
	for _, entry := range finding.Statuses() {
		_, _ = fmt.Fprintf(&text, "  %d  %s\n", entry.Code, entry.Meaning)
	}
	return text.String()
}

// versionString renders ayokoding-cli <version> (commit <commit>, catalog <hash>).
func versionString(version, commit, catalog string) string {
	if version == "" {
		version = "dev"
	}
	if commit == "" {
		commit = "unknown"
	}
	if catalog == "" {
		catalog = "unpinned"
	}
	return fmt.Sprintf("ayokoding-cli %s (commit %s, catalog %s)\n", version, commit, catalog)
}

// selectionError requires exactly one of --course, --since, or --all.
func selectionError(courses []string, since string, all bool) error {
	count := 0
	if len(courses) > 0 {
		count++
	}
	if since != "" {
		count++
	}
	if all {
		count++
	}
	if count != 1 {
		return &finding.Error{
			Code:    finding.UsageMissingSelection,
			Message: "one of --course, --since, or --all is required",
		}
	}
	return nil
}

// missingCommand returns the usage error for a bare invocation.
func missingCommand() error {
	return &finding.Error{Code: finding.UsageMissingCommand, Message: "no command given"}
}

// catalogLabel names the catalog hash for --version: the stamp when the
// build carries one, otherwise the hash of the embedded catalog.
func catalogLabel(opts Options) string {
	if opts.Catalog != "" {
		return opts.Catalog
	}
	return catalog.Hash(toolchains.Bytes())
}

// newRoot builds the ayokoding-cli command tree. ctx is the execution
// context from Execute; buildCommand captures it so cancellation reaches
// the derived-image builds with an inherited context.
func newRoot(ctx context.Context, opts Options) *cobra.Command {
	root := &cobra.Command{
		Use:   "ayokoding-cli",
		Short: "Check AyoKoding course code examples in pinned containers.",
		Long: "Check AyoKoding course code examples in pinned containers.\n\n" +
			statusHelp(),
		Version:       opts.Version,
		SilenceErrors: true,
		SilenceUsage:  true,
		RunE:          func(*cobra.Command, []string) error { return missingCommand() },
	}
	root.CompletionOptions.DisableDefaultCmd = true
	root.SetVersionTemplate(versionString(opts.Version, opts.Commit, catalogLabel(opts)))
	root.SetErr(opts.Stderr)
	root.PersistentFlags().String("output", "text", "output format: text or json")
	root.PersistentFlags().String("color", "auto", "colour: auto, always, or never")
	root.PersistentFlags().Bool("no-input", false, "accepted; the tool never prompts")
	root.PersistentFlags().String("content", "apps/ayokoding-www/content/en/learn/courses", "course content directory")
	root.PersistentFlags().String("catalog", "", "toolchain catalog file; defaults to the embedded catalog")

	examples := &cobra.Command{
		Use:   "examples",
		Short: "Validate, sync, run, and cover course code examples.",
		RunE:  func(*cobra.Command, []string) error { return missingCommand() },
	}
	examples.AddCommand(
		validateCommand(opts),
		syncCommand(opts),
		runCommand(ctx, opts),
		coverageCommand(opts),
		checkCommand(ctx, opts),
		affectedCommand(ctx, opts),
	)
	toolchains := &cobra.Command{
		Use:   "toolchains",
		Short: "List and build course toolchain images.",
		RunE:  func(*cobra.Command, []string) error { return missingCommand() },
	}
	toolchains.AddCommand(listCommand(opts), buildCommand(ctx, opts))
	root.AddCommand(examples, toolchains)
	return root
}

// validateCommand builds examples validate.
func validateCommand(opts Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "validate",
		Short: "Validate layout, run specs, and catalog references.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			if err := dispatchFault(cmd, opts); err != nil {
				return err
			}
			return runValidate(cmd)
		},
	}
	cmd.Flags().StringSlice("course", nil, "course slug to cover; repeatable")
	cmd.Flags().Bool("include-inert", false, "also preview courses that have not opted in")
	return cmd
}

// syncCommand builds examples sync.
func syncCommand(opts Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "sync",
		Short: "Check lesson fences against course files.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			if err := dispatchFault(cmd, opts); err != nil {
				return err
			}
			return runSync(cmd)
		},
	}
	cmd.Flags().StringSlice("course", nil, "course slug to cover; repeatable")
	cmd.Flags().Bool("include-inert", false, "also preview courses that have not opted in")
	cmd.Flags().Bool("write", false, "copy file bytes into fences")
	return cmd
}

// runAdapter adapts the containers runtime to the application run port.
// The containers Run keeps both streams apart and feeds stdin to the
// container standard input; runs without input pass nil for the empty
// default. Timeouts surface through the containers timeout error or the
// expired run context.
type runAdapter struct {
	inner *containers.Runtime
}

// Run executes one planned invocation through the containers runtime.
func (adapter runAdapter) Run(ctx context.Context, invoke containerplan.Invocation, stdin []byte) (application.Execution, error) {
	result, err := adapter.inner.Run(ctx, invoke, stdin)
	if err != nil {
		var timeout *containers.TimeoutError
		if errors.As(err, &timeout) || errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return application.Execution{TimedOut: true}, nil
		}
		return application.Execution{}, fmt.Errorf("cli: run container: %w", err)
	}
	return application.Execution{Exit: result.ExitCode, Stdout: result.Output, Stderr: result.Stderr}, nil
}

// Probe checks the container daemon answers.
func (adapter runAdapter) Probe(ctx context.Context) error {
	if err := adapter.inner.Probe(ctx); err != nil {
		return fmt.Errorf("cli: probe container runtime: %w", err)
	}
	return nil
}

// Pull fetches one pinned image.
func (adapter runAdapter) Pull(ctx context.Context, image string) error {
	if err := adapter.inner.Pull(ctx, image); err != nil {
		return fmt.Errorf("cli: pull image: %w", err)
	}
	return nil
}

// Sweep removes labelled leftovers older than the given age.
func (adapter runAdapter) Sweep(ctx context.Context, olderThan time.Duration) error {
	if err := adapter.inner.SweepLeftovers(ctx, olderThan); err != nil {
		return fmt.Errorf("cli: sweep leftover containers: %w", err)
	}
	return nil
}

// TrackContainer records one started container for the interrupt cleanup.
func (adapter runAdapter) TrackContainer(name string) {
	adapter.inner.TrackContainer(name)
}

// TrackNetwork records one created network for the interrupt cleanup.
func (adapter runAdapter) TrackNetwork(name string) {
	adapter.inner.TrackNetwork(name)
}

// Cleanup removes every tracked container and network.
func (adapter runAdapter) Cleanup(ctx context.Context) error {
	if err := adapter.inner.Cleanup(ctx); err != nil {
		return fmt.Errorf("cli: cleanup containers: %w", err)
	}
	return nil
}

// RemoveContainer removes one container now.
func (adapter runAdapter) RemoveContainer(ctx context.Context, name string) error {
	if err := adapter.inner.RemoveContainer(ctx, name); err != nil {
		return fmt.Errorf("cli: remove container: %w", err)
	}
	return nil
}

// runPassPayload is one machine-readable green run.
type runPassPayload struct {
	Course string `json:"course"`
	Unit   string `json:"unit"`
	Run    string `json:"run"`
	Label  string `json:"label"`
}

// runReplayPayload is one machine-readable replayed seed trace.
type runReplayPayload struct {
	Course string `json:"course"`
	Unit   string `json:"unit"`
	Run    string `json:"run"`
	Seed   int    `json:"seed"`
	Stdout string `json:"stdout"`
}

// runDocument is the machine-readable run payload. It carries no
// durations, timestamps, or absolute paths, so the same inputs give the
// same bytes.
type runDocument struct {
	SchemaVersion int                `json:"schemaVersion"`
	Passes        []runPassPayload   `json:"passes"`
	Replays       []runReplayPayload `json:"replays"`
	Findings      []findingPayload   `json:"findings"`
}

// renderRun writes the run report to standard output: one labelled line per
// pass and failure plus replay traces as text, or one JSON document under
// --output json. Every failure line carries the word failed, so readers and
// the contract steps name green and red runs the same way.
func renderRun(out io.Writer, mode string, report application.RunReport) error {
	if mode == outputJSON {
		document := runDocument{
			SchemaVersion: 1,
			Passes:        []runPassPayload{},
			Replays:       []runReplayPayload{},
			Findings:      []findingPayload{},
		}
		for _, passed := range report.Passed {
			document.Passes = append(document.Passes, runPassPayload{
				Course: passed.Course,
				Unit:   passed.Unit,
				Run:    passed.Run,
				Label:  passed.Label,
			})
		}
		for _, replay := range report.Replays {
			document.Replays = append(document.Replays, runReplayPayload{
				Course: replay.Course,
				Unit:   replay.Unit,
				Run:    replay.Run,
				Seed:   replay.Seed,
				Stdout: replay.Stdout,
			})
		}
		for _, found := range report.Findings {
			document.Findings = append(document.Findings, findingPayload{
				Code:    found.Code,
				Course:  found.Course,
				Path:    found.Path,
				Line:    found.Line,
				Message: found.Message,
			})
		}
		body, err := json.Marshal(document)
		if err != nil {
			return fmt.Errorf("cli: marshal run report: %w", err)
		}
		if _, err := fmt.Fprintln(out, string(body)); err != nil {
			return &finding.PipeError{}
		}
		return nil
	}
	for _, passed := range report.Passed {
		if _, err := fmt.Fprintf(out, "%s %s %s: %s\n", passed.Course, passed.Unit, passed.Run, passed.Label); err != nil {
			return &finding.PipeError{}
		}
	}
	for _, replay := range report.Replays {
		if _, err := fmt.Fprintf(out, "%s %s %s: replay seed %d\n", replay.Course, replay.Unit, replay.Run, replay.Seed); err != nil {
			return &finding.PipeError{}
		}
		if _, err := fmt.Fprint(out, replay.Stdout); err != nil {
			return &finding.PipeError{}
		}
		if !strings.HasSuffix(replay.Stdout, "\n") {
			if _, err := fmt.Fprintln(out); err != nil {
				return &finding.PipeError{}
			}
		}
	}
	for _, found := range report.Findings {
		if _, err := fmt.Fprintf(out, "%s %s:%d: failed %s: %s\n", found.Course, found.Path, found.Line, found.Code, found.Message); err != nil {
			return &finding.PipeError{}
		}
	}
	return nil
}

// runCommand builds examples run.
func runCommand(ctx context.Context, opts Options) *cobra.Command {
	var courses []string
	var since string
	var all bool
	cmd := &cobra.Command{
		Use:   "run",
		Short: "Run selected course units in containers.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			if err := selectionError(courses, since, all); err != nil {
				return err
			}
			if err := dispatchFault(cmd, opts); err != nil {
				return err
			}
			return runRun(ctx, cmd)
		},
	}
	cmd.Flags().StringSliceVar(&courses, "course", nil, "course slug to run; repeatable")
	cmd.Flags().StringVar(&since, "since", "", "run courses changed since REV")
	cmd.Flags().BoolVar(&all, "all", false, "run every opted-in course")
	cmd.Flags().String("shard", "", "stable split K/N over sorted course slugs")
	cmd.Flags().String("unit", "", "run one unit path only")
	cmd.Flags().Int("seed", 0, "replay one seed")
	cmd.Flags().Bool("record", false, "write missing expected files only")
	cmd.Flags().Bool("single-run", false, "skip the determinism double run")
	return cmd
}

// runRun runs the selected course units in containers and reports passes,
// replay traces, and findings. The captured command context cancels runs,
// mirroring the runBuild threading. --since resolves through the Phase 6
// selection; --shard slices whatever the other flags selected.
func runRun(ctx context.Context, cmd *cobra.Command) error {
	cat, err := loadCatalog(cmd)
	if err != nil {
		return err
	}
	courses, err := cmd.Flags().GetStringSlice("course")
	if err != nil {
		return fmt.Errorf("cli: read --course: %w", err)
	}
	since, err := cmd.Flags().GetString("since")
	if err != nil {
		return fmt.Errorf("cli: read --since: %w", err)
	}
	all, err := cmd.Flags().GetBool("all")
	if err != nil {
		return fmt.Errorf("cli: read --all: %w", err)
	}
	shard, err := cmd.Flags().GetString("shard")
	if err != nil {
		return fmt.Errorf("cli: read --shard: %w", err)
	}
	unit, err := cmd.Flags().GetString("unit")
	if err != nil {
		return fmt.Errorf("cli: read --unit: %w", err)
	}
	var seed *int
	if cmd.Flags().Changed("seed") {
		value, err := cmd.Flags().GetInt("seed")
		if err != nil {
			return fmt.Errorf("cli: read --seed: %w", err)
		}
		seed = &value
	}
	record, err := cmd.Flags().GetBool("record")
	if err != nil {
		return fmt.Errorf("cli: read --record: %w", err)
	}
	single, err := cmd.Flags().GetBool("single-run")
	if err != nil {
		return fmt.Errorf("cli: read --single-run: %w", err)
	}
	content, err := flagValue(cmd, "content")
	if err != nil {
		return err
	}
	if _, err := os.Stat(content); err != nil {
		return fmt.Errorf("cli: open content: %w", err)
	}
	if since != "" || shard != "" {
		resolved, resolveErr := resolveSince(ctx, content, courses, since, all, shard)
		if resolveErr != nil {
			return resolveErr
		}
		courses, all = resolved, false
	}
	mode, err := flagValue(cmd, "output")
	if err != nil {
		return err
	}
	runtime := runAdapter{inner: &containers.Runtime{CLI: os.Getenv("AYOKODING_CONTAINER_CLI")}}
	report, err := application.Run(ctx, application.RunRequest{
		Content:    os.DirFS(content),
		ContentDir: content,
		Catalog:    cat,
		Courses:    courses,
		All:        all,
		Unit:       unit,
		Seed:       seed,
		Record:     record,
		SingleRun:  single,
		Runtime:    runtime,
		EnvBuilder: containers.Builder{},
		Settings: containerplan.Settings{
			ContainerCLI: os.Getenv("AYOKODING_CONTAINER_CLI"),
		},
	})
	if renderErr := renderRun(cmd.OutOrStdout(), mode, report); renderErr != nil {
		return renderErr
	}
	if err != nil {
		return fmt.Errorf("cli: run courses: %w", err)
	}
	if report.Failed() {
		return &statusError{status: 1}
	}
	return nil
}

// checkCommand builds examples check.
func checkCommand(ctx context.Context, opts Options) *cobra.Command {
	var courses []string
	var since string
	var all bool
	cmd := &cobra.Command{
		Use:   "check",
		Short: "Validate, sync, run, and cover the selection.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			if err := selectionError(courses, since, all); err != nil {
				return err
			}
			if err := dispatchFault(cmd, opts); err != nil {
				return err
			}
			return runCheck(ctx, cmd)
		},
	}
	cmd.Flags().StringSliceVar(&courses, "course", nil, "course slug to check; repeatable")
	cmd.Flags().StringVar(&since, "since", "", "check courses changed since REV")
	cmd.Flags().BoolVar(&all, "all", false, "check every opted-in course")
	cmd.Flags().String("shard", "", "stable split K/N over sorted course slugs")
	return cmd
}

// listCommand builds toolchains list.
func listCommand(opts Options) *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List the embedded toolchain catalog.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			if err := dispatchFault(cmd, opts); err != nil {
				return err
			}
			return runList(cmd)
		},
	}
}

// buildCommand builds toolchains build.
func buildCommand(ctx context.Context, opts Options) *cobra.Command {
	return &cobra.Command{
		Use:   "build [ID]...",
		Short: "Build derived and environment images.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			if err := dispatchFault(cmd, opts); err != nil {
				return err
			}
			return runBuild(ctx, cmd)
		},
	}
}
