package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/doctor"
)

var doctorCmd = &cobra.Command{
	Use:   "doctor",
	Short: "Check required tool versions are installed and correct",
	Long: `Verify that all required development tools are installed with the correct versions.

Reads version requirements from existing repository config files and checks each
tool against those requirements.

Tools checked:
  git      — any version (no config file)
  volta    — any version (no config file)
  node     — from package.json → volta.node
  npm      — from package.json → volta.npm
  java     — from apps/organiclever-be-jasb/pom.xml → <java.version> (major version only)
  maven    — any version (no config file)
  golang   — from apps/rhino-cli/go.mod → go directive

Status codes:
  ✓ ok      — tool is installed with the correct version
  ⚠ warning — tool is installed but version does not match requirement
  ✗ missing — tool is not found in PATH`,
	Example: `  # Check all required tools
  rhino-cli doctor

  # Output as JSON
  rhino-cli doctor -o json

  # Output as markdown report
  rhino-cli doctor -o markdown

  # Verbose output with duration
  rhino-cli doctor --verbose`,
	SilenceErrors: true,
	RunE:          runDoctor,
}

func init() {
	rootCmd.AddCommand(doctorCmd)
}

func runDoctor(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	result, err := doctor.CheckAll(doctor.CheckOptions{RepoRoot: repoRoot})
	if err != nil {
		return fmt.Errorf("doctor check failed: %w", err)
	}

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return doctor.FormatText(result, v, q) },
		json:     func() (string, error) { return doctor.FormatJSON(result) },
		markdown: func() string { return doctor.FormatMarkdown(result) },
	}); err != nil {
		return err
	}

	// Only missing tools cause non-zero exit; version warnings are advisory
	if result.MissingCount > 0 {
		return fmt.Errorf("%d tool(s) not found in PATH", result.MissingCount)
	}
	return nil
}
