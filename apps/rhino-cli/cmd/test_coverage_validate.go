package cmd

import (
	"fmt"
	"path/filepath"
	"strconv"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/testcoverage"
)

var validateTestCoverageCmd = &cobra.Command{
	Use:   "validate-test-coverage <coverage-file> <threshold>",
	Short: "Check test coverage against a threshold (Codecov-compatible algorithm)",
	Long: `Compute line coverage using Codecov's algorithm and compare against a threshold.

Auto-detects format from the coverage file:
  - LCOV format: filenames ending in ".info" or containing "lcov"
  - Go cover.out format: all other files

Coverage algorithm:
  - A line is COVERED if hit count > 0 AND all branches taken (or no branches)
  - A line is PARTIAL if hit count > 0 but some branches not taken
  - A line is MISSED if hit count = 0
  - Coverage % = covered / (covered + partial + missed)
  - Partial lines count as NOT covered (matching Codecov's badge calculation)

The coverage file path is relative to the git repository root.`,
	Example: `  # Check Go coverage
  rhino-cli validate-test-coverage apps/rhino-cli/cover.out 85

  # Check LCOV coverage
  rhino-cli validate-test-coverage apps/organiclever-web/coverage/lcov.info 85

  # Output as JSON
  rhino-cli validate-test-coverage apps/rhino-cli/cover.out 85 -o json

  # Output as markdown
  rhino-cli validate-test-coverage apps/rhino-cli/cover.out 85 -o markdown`,
	Args:          cobra.ExactArgs(2),
	SilenceErrors: true,
	RunE:          runValidateTestCoverage,
}

func init() {
	rootCmd.AddCommand(validateTestCoverageCmd)
}

func runValidateTestCoverage(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	absPath := filepath.Join(repoRoot, args[0])

	threshold, err := strconv.ParseFloat(args[1], 64)
	if err != nil {
		return fmt.Errorf("invalid threshold %q: must be a number (e.g. 85)", args[1])
	}

	var result testcoverage.Result
	switch testcoverage.DetectFormat(absPath) {
	case testcoverage.FormatLCOV:
		result, err = testcoverage.ComputeLCOVResult(absPath, threshold)
	case testcoverage.FormatGo:
		result, err = testcoverage.ComputeGoResult(absPath, threshold)
	}
	if err != nil {
		return fmt.Errorf("coverage check failed: %w", err)
	}

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return testcoverage.FormatText(&result, v, q) },
		json:     func() (string, error) { return testcoverage.FormatJSON(&result) },
		markdown: func() string { return testcoverage.FormatMarkdown(&result) },
	}); err != nil {
		return err
	}

	if !result.Passed {
		return fmt.Errorf("coverage %.2f%% is below threshold %.0f%%", result.Pct, threshold)
	}
	return nil
}
