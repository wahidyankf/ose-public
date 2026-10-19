package cli

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/selection"
)

// affectedDocument is the machine-readable selection payload the plan job
// reads: the selection mode with the selected and inert courses.
type affectedDocument struct {
	SchemaVersion int      `json:"schemaVersion"`
	Mode          string   `json:"mode"`
	Courses       []string `json:"courses"`
	Inert         []string `json:"inert"`
}

// renderAffected writes the selection to standard output: the mode with
// one line per selected and inert course as text, or one JSON document
// under --output json.
func renderAffected(out io.Writer, mode string, resolved selection.Selection) error {
	if mode == outputJSON {
		document := affectedDocument{
			SchemaVersion: 1,
			Mode:          resolved.Mode,
			Courses:       append([]string{}, resolved.Courses...),
			Inert:         append([]string{}, resolved.Inert...),
		}
		body, err := json.Marshal(document)
		if err != nil {
			return fmt.Errorf("cli: marshal selection: %w", err)
		}
		if _, err := fmt.Fprintln(out, string(body)); err != nil {
			return &finding.PipeError{}
		}
		return nil
	}
	if _, err := fmt.Fprintf(out, "mode: %s\n", resolved.Mode); err != nil {
		return &finding.PipeError{}
	}
	for _, slug := range resolved.Courses {
		if _, err := fmt.Fprintf(out, "course: %s\n", slug); err != nil {
			return &finding.PipeError{}
		}
	}
	for _, slug := range resolved.Inert {
		if _, err := fmt.Fprintf(out, "inert: %s\n", slug); err != nil {
			return &finding.PipeError{}
		}
	}
	return nil
}

// affectedCommand builds examples affected.
func affectedCommand(ctx context.Context, opts Options) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "affected",
		Short: "Print the course selection only.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			if err := dispatchFault(cmd, opts); err != nil {
				return err
			}
			return runAffected(ctx, cmd)
		},
	}
	cmd.Flags().StringSlice("course", nil, "course slug to select; repeatable")
	cmd.Flags().String("since", "", "select courses changed since REV")
	cmd.Flags().Bool("all", false, "select every opted-in course")
	cmd.Flags().String("shard", "", "stable split K/N over sorted course slugs")
	return cmd
}

// runAffected resolves the course selection without running anything and
// reports the mode with the selected and inert courses.
func runAffected(ctx context.Context, cmd *cobra.Command) error {
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
	if err := selectionError(courses, since, all); err != nil {
		return err
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
	resolved, err := application.Affected(application.AffectedRequest{
		Content:       os.DirFS(content),
		Courses:       courses,
		All:           all,
		Since:         since,
		Shard:         shard,
		ChangedFiles:  changed,
		ContentPrefix: prefix,
	})
	if err != nil {
		return fmt.Errorf("cli: resolve selection: %w", err)
	}
	return renderAffected(cmd.OutOrStdout(), mode, resolved)
}
