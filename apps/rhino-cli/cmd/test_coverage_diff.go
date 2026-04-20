package cmd

import (
	"fmt"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/testcoverage"
)

var (
	diffBase            string
	diffThreshold       float64
	diffStaged          bool
	diffPerFile         bool
	diffExcludePatterns []string
)

var diffTestCoverageCmd = &cobra.Command{
	Use:   "diff <coverage-file>",
	Short: "Show coverage for changed lines only (diff coverage)",
	Long: `Calculate coverage for only the lines changed in the current branch compared to a base ref.

Uses a standard 3-state algorithm: covered / (covered + partial + missed).
Partial lines count as NOT covered.`,
	Example: `  # Diff coverage against main
  rhino-cli test-coverage diff apps/myapp/coverage/lcov.info

  # Diff against specific branch
  rhino-cli test-coverage diff apps/myapp/coverage/lcov.info --base develop

  # Fail if diff coverage below 80%
  rhino-cli test-coverage diff apps/myapp/coverage/lcov.info --threshold 80

  # Show per-file breakdown
  rhino-cli test-coverage diff apps/myapp/coverage/lcov.info --per-file`,
	Args:          cobra.ExactArgs(1),
	SilenceErrors: true,
	RunE:          runDiffTestCoverage,
}

func init() {
	diffTestCoverageCmd.Flags().StringVar(&diffBase, "base", "main", "git ref to diff against")
	diffTestCoverageCmd.Flags().Float64Var(&diffThreshold, "threshold", 0, "fail if diff coverage below this percentage")
	diffTestCoverageCmd.Flags().BoolVar(&diffStaged, "staged", false, "diff staged changes instead of branch diff")
	diffTestCoverageCmd.Flags().BoolVar(&diffPerFile, "per-file", false, "show per-file diff coverage breakdown")
	diffTestCoverageCmd.Flags().StringArrayVar(&diffExcludePatterns, "exclude", nil, "exclude files matching glob pattern (repeatable)")
	testCoverageCmd.AddCommand(diffTestCoverageCmd)
}

func runDiffTestCoverage(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	absPath := filepath.Join(repoRoot, args[0])

	result, err := testCoverageComputeDiffCoverageFn(testcoverage.DiffCoverageOptions{
		CoverageFile:    absPath,
		Base:            diffBase,
		Staged:          diffStaged,
		Threshold:       diffThreshold,
		PerFile:         diffPerFile,
		ExcludePatterns: diffExcludePatterns,
	})
	if err != nil {
		return fmt.Errorf("diff coverage failed: %w", err)
	}

	perFileText := ""
	if diffPerFile {
		perFileText = testcoverage.FormatTextPerFile(&result, 0)
	}

	if writeErr := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text: func(v, q bool) string {
			return testcoverage.FormatText(&result, v, q) + perFileText
		},
		json:     func() (string, error) { return testcoverage.FormatJSON(&result, diffPerFile, 0) },
		markdown: func() string { return testcoverage.FormatMarkdown(&result, diffPerFile, 0) },
	}); writeErr != nil {
		return writeErr
	}

	if diffThreshold > 0 && !result.Passed {
		return fmt.Errorf("diff coverage %.2f%% is below threshold %.0f%%", result.Pct, diffThreshold)
	}
	return nil
}
