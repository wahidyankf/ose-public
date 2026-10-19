package cli

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/application"
)

// runSync checks the selected courses and reports every sync finding. Sync
// needs no catalog: it compares lesson fences with course files.
func runSync(cmd *cobra.Command) error {
	courses, err := cmd.Flags().GetStringSlice("course")
	if err != nil {
		return fmt.Errorf("cli: read --course: %w", err)
	}
	inert, err := cmd.Flags().GetBool("include-inert")
	if err != nil {
		return fmt.Errorf("cli: read --include-inert: %w", err)
	}
	write, err := cmd.Flags().GetBool("write")
	if err != nil {
		return fmt.Errorf("cli: read --write: %w", err)
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
	findings, err := application.Sync(application.SyncRequest{
		Content:      os.DirFS(content),
		ContentDir:   content,
		Courses:      courses,
		IncludeInert: inert,
		Write:        write,
	})
	if err != nil {
		return fmt.Errorf("cli: sync courses: %w", err)
	}
	if err := renderFindings(cmd.OutOrStdout(), mode, findings); err != nil {
		return err
	}
	if len(findings) != 0 {
		return &statusError{status: 1}
	}
	return nil
}
