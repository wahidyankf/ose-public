package cli

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/containers"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/containerplan"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// checkCoveragePayload is the machine-readable check coverage summary.
type checkCoveragePayload struct {
	Courses    []coverageCoursePayload `json:"courses"`
	Applicable int                     `json:"applicable"`
	Covered    int                     `json:"covered"`
	Percent    int                     `json:"percent"`
}

// checkSelectionPayload is the machine-readable check selection summary.
type checkSelectionPayload struct {
	Mode    string   `json:"mode"`
	Courses []string `json:"courses"`
	Inert   []string `json:"inert"`
}

// checkDocument is the machine-readable check payload: the green runs with
// the combined validate, sync, and run findings, the resolved selection,
// and the static coverage summary. It carries no durations, timestamps,
// or absolute paths, so the same inputs give the same bytes.
type checkDocument struct {
	SchemaVersion int                   `json:"schemaVersion"`
	Message       string                `json:"message,omitempty"`
	Passes        []runPassPayload      `json:"passes"`
	Findings      []findingPayload      `json:"findings"`
	Selection     checkSelectionPayload `json:"selection"`
	Coverage      checkCoveragePayload  `json:"coverage"`
}

// renderCheck writes the check report to standard output: the inert
// message when nothing was selected, one labelled line per green run, one
// finding line per defect, the inert courses, and the coverage summary as
// text, or one JSON document under --output json.
func renderCheck(out io.Writer, mode string, report application.CheckReport) error {
	if mode == outputJSON {
		document := checkDocument{
			SchemaVersion: 1,
			Message:       report.Message,
			Passes:        []runPassPayload{},
			Findings:      []findingPayload{},
			Selection: checkSelectionPayload{
				Mode:    report.Selection.Mode,
				Courses: append([]string{}, report.Selection.Courses...),
				Inert:   append([]string{}, report.Selection.Inert...),
			},
			Coverage: checkCoveragePayload{
				Courses:    []coverageCoursePayload{},
				Applicable: report.Coverage.Applicable,
				Covered:    report.Coverage.Covered,
				Percent:    report.Coverage.Percent,
			},
		}
		for _, passed := range report.Passed {
			document.Passes = append(document.Passes, runPassPayload{
				Course: passed.Course,
				Unit:   passed.Unit,
				Run:    passed.Run,
				Label:  passed.Label,
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
		for _, course := range report.Coverage.Courses {
			document.Coverage.Courses = append(document.Coverage.Courses, coverageCoursePayload{
				Course:             course.Slug,
				Applicable:         course.Applicable,
				Units:              course.Units,
				CoveredUnits:       course.CoveredUnits,
				CodeFences:         course.CodeFences,
				AnchoredFences:     course.AnchoredFences,
				IllustrationFences: course.IllustrationFences,
				StaticUnits:        course.StaticUnits,
				Covered:            course.Covered,
			})
		}
		body, err := json.Marshal(document)
		if err != nil {
			return fmt.Errorf("cli: marshal check report: %w", err)
		}
		if _, err := fmt.Fprintln(out, string(body)); err != nil {
			return &finding.PipeError{}
		}
		return nil
	}
	if report.Message != "" {
		if _, err := fmt.Fprintln(out, report.Message); err != nil {
			return &finding.PipeError{}
		}
	}
	for _, passed := range report.Passed {
		if _, err := fmt.Fprintf(out, "%s %s %s: %s\n", passed.Course, passed.Unit, passed.Run, passed.Label); err != nil {
			return &finding.PipeError{}
		}
	}
	for _, found := range report.Findings {
		if _, err := fmt.Fprintf(out, "%s %s:%d: failed %s: %s\n", found.Course, found.Path, found.Line, found.Code, found.Message); err != nil {
			return &finding.PipeError{}
		}
	}
	for _, slug := range report.Selection.Inert {
		if _, err := fmt.Fprintf(out, "inert: %s\n", slug); err != nil {
			return &finding.PipeError{}
		}
	}
	if _, err := fmt.Fprintf(out, "%d of %d applicable courses covered\n",
		report.Coverage.Covered, report.Coverage.Applicable); err != nil {
		return &finding.PipeError{}
	}
	return nil
}

// runCheck validates, syncs, runs, and covers the selection and reports
// the green runs with every finding. The captured command context cancels
// runs, mirroring the runBuild threading. --since resolves through git;
// --shard slices whatever the other flags selected.
func runCheck(ctx context.Context, cmd *cobra.Command) error {
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
	content, err := flagValue(cmd, "content")
	if err != nil {
		return err
	}
	if _, err := os.Stat(content); err != nil {
		return fmt.Errorf("cli: open content: %w", err)
	}
	mode, err := flagValue(cmd, "output")
	if err != nil {
		return err
	}
	changed, prefix, err := changedFiles(ctx, content, since)
	if err != nil {
		return err
	}
	runtime := runAdapter{inner: &containers.Runtime{CLI: os.Getenv("AYOKODING_CONTAINER_CLI")}}
	report, err := application.Check(ctx, application.CheckRequest{
		Content:       os.DirFS(content),
		ContentDir:    content,
		Catalog:       cat,
		Courses:       courses,
		All:           all,
		Since:         since,
		Shard:         shard,
		ChangedFiles:  changed,
		ContentPrefix: prefix,
		Runtime:       runtime,
		EnvBuilder:    containers.Builder{},
		Settings: containerplan.Settings{
			ContainerCLI: os.Getenv("AYOKODING_CONTAINER_CLI"),
		},
	})
	if renderErr := renderCheck(cmd.OutOrStdout(), mode, report); renderErr != nil {
		return renderErr
	}
	if err != nil {
		return fmt.Errorf("cli: check courses: %w", err)
	}
	if report.Failed() {
		return &statusError{status: 1}
	}
	return nil
}
