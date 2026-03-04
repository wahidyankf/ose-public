package cmd

import (
	"fmt"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/speccoverage"
)

var validateSpecCoverageCmd = &cobra.Command{
	Use:   "validate-spec-coverage <specs-dir> <app-dir>",
	Short: "Validate that all BDD spec files have matching test implementations",
	Long: `Walk <specs-dir> for .feature files and check each has at least one
matching test file anywhere under <app-dir>.

A matching test file is one whose base name starts with the feature file stem
followed by a dot (e.g. "user-login.feature" matches "user-login.integration.test.tsx").

Both paths are resolved relative to the git repository root.

The reverse direction (test referencing a non-existent spec) is already enforced
at runtime by vitest-cucumber's loadFeature(), so only the spec-to-test direction
is checked here.`,
	Example: `  # Check organiclever-web spec coverage
  rhino-cli validate-spec-coverage specs/organiclever-web apps/organiclever-web

  # Output as JSON
  rhino-cli validate-spec-coverage specs/organiclever-web apps/organiclever-web -o json

  # Quiet mode
  rhino-cli validate-spec-coverage specs/organiclever-web apps/organiclever-web -q`,
	Args:          cobra.ExactArgs(2),
	SilenceErrors: true,
	RunE:          runValidateSpecCoverage,
}

func init() {
	rootCmd.AddCommand(validateSpecCoverageCmd)
}

func runValidateSpecCoverage(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	specsDir := filepath.Join(repoRoot, args[0])
	appDir := filepath.Join(repoRoot, args[1])

	opts := speccoverage.ScanOptions{
		RepoRoot: repoRoot,
		SpecsDir: specsDir,
		AppDir:   appDir,
		Verbose:  verbose,
		Quiet:    quiet,
	}

	result, err := speccoverage.CheckAll(opts)
	if err != nil {
		return fmt.Errorf("spec coverage check failed: %w", err)
	}

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return speccoverage.FormatText(result, v, q) },
		json:     func() (string, error) { return speccoverage.FormatJSON(result) },
		markdown: func() string { return speccoverage.FormatMarkdown(result) },
	}); err != nil {
		return err
	}

	hasGaps := len(result.Gaps) > 0 || len(result.ScenarioGaps) > 0 || len(result.StepGaps) > 0
	if hasGaps {
		if !quiet && output == "text" {
			if len(result.Gaps) > 0 {
				_, _ = fmt.Fprintf(cmd.OutOrStderr(), "\n❌ Found %d spec(s) without matching test files\n", len(result.Gaps))
			}
			if len(result.ScenarioGaps) > 0 {
				_, _ = fmt.Fprintf(cmd.OutOrStderr(), "❌ Found %d scenario(s) without matching test implementations\n", len(result.ScenarioGaps))
			}
			if len(result.StepGaps) > 0 {
				_, _ = fmt.Fprintf(cmd.OutOrStderr(), "❌ Found %d step(s) without matching step definitions\n", len(result.StepGaps))
			}
		}
		return fmt.Errorf("spec coverage gaps found: %d file gap(s), %d scenario gap(s), %d step gap(s)",
			len(result.Gaps), len(result.ScenarioGaps), len(result.StepGaps))
	}

	return nil
}
