package cli

import (
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// coverageCoursePayload is one machine-readable covered course.
type coverageCoursePayload struct {
	Course             string `json:"course"`
	Applicable         bool   `json:"applicable"`
	Units              int    `json:"units"`
	CoveredUnits       int    `json:"coveredUnits"`
	CodeFences         int    `json:"codeFences"`
	AnchoredFences     int    `json:"anchoredFences"`
	IllustrationFences int    `json:"illustrationFences"`
	StaticUnits        int    `json:"staticUnits"`
	Covered            bool   `json:"covered"`
}

// coverageDocument is the machine-readable coverage payload. It carries
// no durations, timestamps, or absolute paths, so the same inputs give
// the same bytes.
type coverageDocument struct {
	SchemaVersion int                     `json:"schemaVersion"`
	Courses       []coverageCoursePayload `json:"courses"`
	Applicable    int                     `json:"applicable"`
	Covered       int                     `json:"covered"`
	Percent       int                     `json:"percent"`
	Findings      []findingPayload        `json:"findings"`
}

// plural names one or many things with the count.
func plural(count int, single, many string) string {
	if count == 1 {
		return fmt.Sprintf("%d %s", count, single)
	}
	return fmt.Sprintf("%d %s", count, many)
}

// renderCoverage writes the coverage report to standard output: one line
// per course with its counts, the covered percentage, and every finding
// as text, or one JSON document under --output json.
func renderCoverage(out io.Writer, mode string, assessed application.CoverageReport) error {
	report := assessed.Report
	if mode == outputJSON {
		document := coverageDocument{
			SchemaVersion: 1,
			Courses:       []coverageCoursePayload{},
			Applicable:    report.Applicable,
			Covered:       report.Covered,
			Percent:       report.Percent,
			Findings:      []findingPayload{},
		}
		for _, found := range assessed.Findings {
			document.Findings = append(document.Findings, findingPayload{
				Code:    found.Code,
				Course:  found.Course,
				Path:    found.Path,
				Line:    found.Line,
				Message: found.Message,
			})
		}
		for _, course := range report.Courses {
			document.Courses = append(document.Courses, coverageCoursePayload{
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
			return fmt.Errorf("cli: marshal coverage: %w", err)
		}
		if _, err := fmt.Fprintln(out, string(body)); err != nil {
			return &finding.PipeError{}
		}
		return nil
	}
	for _, course := range report.Courses {
		var line string
		switch {
		case !course.Applicable:
			line = course.Slug + ": not applicable"
		case course.Covered:
			line = fmt.Sprintf("%s: covered (%d of %d units, %s, %s, %s, %s)",
				course.Slug, course.CoveredUnits, course.Units,
				plural(course.CodeFences, "code fence", "code fences"),
				plural(course.AnchoredFences, "anchored fence", "anchored fences"),
				plural(course.IllustrationFences, "illustration block", "illustration blocks"),
				plural(course.StaticUnits, "static unit", "static units"))
		default:
			line = fmt.Sprintf("%s: not covered (%d of %d units, %s, %s, %s, %s)",
				course.Slug, course.CoveredUnits, course.Units,
				plural(course.CodeFences, "code fence", "code fences"),
				plural(course.AnchoredFences, "anchored fence", "anchored fences"),
				plural(course.IllustrationFences, "illustration block", "illustration blocks"),
				plural(course.StaticUnits, "static unit", "static units"))
		}
		if _, err := fmt.Fprintln(out, line); err != nil {
			return &finding.PipeError{}
		}
	}
	if _, err := fmt.Fprintf(out, "%d of %d applicable courses covered (%d%%)\n",
		report.Covered, report.Applicable, report.Percent); err != nil {
		return &finding.PipeError{}
	}
	for _, found := range assessed.Findings {
		if _, err := fmt.Fprintf(out, "coverage: %s: %s\n", found.Code, found.Message); err != nil {
			return &finding.PipeError{}
		}
	}
	return nil
}

// coverageCommand builds examples coverage.
func coverageCommand(opts Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "coverage",
		Short: "Compute unit and fence coverage per course.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			if err := dispatchFault(cmd, opts); err != nil {
				return err
			}
			return runCoverage(cmd)
		},
	}
	cmd.Flags().StringSlice("course", nil, "course slug to cover; repeatable")
	cmd.Flags().Bool("include-inert", false, "also preview courses that have not opted in")
	cmd.Flags().Int("min-percent", 0, "fail below this coverage percent")
	return cmd
}

// runCoverage assesses the selected courses without running anything and
// reports the per-course counts with the covered percentage.
func runCoverage(cmd *cobra.Command) error {
	cat, err := loadCatalog(cmd)
	if err != nil {
		return err
	}
	courses, err := cmd.Flags().GetStringSlice("course")
	if err != nil {
		return fmt.Errorf("cli: read --course: %w", err)
	}
	inert, err := cmd.Flags().GetBool("include-inert")
	if err != nil {
		return fmt.Errorf("cli: read --include-inert: %w", err)
	}
	minimum, err := cmd.Flags().GetInt("min-percent")
	if err != nil {
		return fmt.Errorf("cli: read --min-percent: %w", err)
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
	report, err := application.Coverage(application.CoverageRequest{
		Content:      os.DirFS(content),
		Catalog:      cat,
		Courses:      courses,
		IncludeInert: inert,
		MinPercent:   minimum,
	})
	if renderErr := renderCoverage(cmd.OutOrStdout(), mode, report); renderErr != nil {
		return renderErr
	}
	if err != nil {
		return fmt.Errorf("cli: cover courses: %w", err)
	}
	if len(report.Findings) != 0 {
		return &statusError{status: 1}
	}
	return nil
}
