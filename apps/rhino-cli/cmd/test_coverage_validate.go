package cmd

import (
	"fmt"
	"path/filepath"
	"strconv"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/testcoverage"
)

var (
	perFile         bool
	belowThreshold  float64
	excludePatterns []string
)

var validateTestCoverageCmd = &cobra.Command{
	Use:   "validate <coverage-file> <threshold>",
	Short: "Check test coverage against a threshold (standard line-based algorithm)",
	Long: `Compute line coverage using a standard line-based algorithm and compare against a threshold.

Auto-detects format from the coverage file:
  - LCOV format: filenames ending in ".info" or containing "lcov"
  - JaCoCo XML format: filenames ending in ".xml" containing "jacoco", or XML with <report> root
  - Cobertura XML format: filenames ending in ".xml" containing "cobertura", or XML with <coverage> root
  - Go cover.out format: all other files

Coverage algorithm:
  - A line is COVERED if hit count > 0 AND all branches taken (or no branches)
  - A line is PARTIAL if hit count > 0 but some branches not taken
  - A line is MISSED if hit count = 0
  - Coverage % = covered / (covered + partial + missed)
  - Partial lines count as NOT covered

The coverage file path is relative to the git repository root.`,
	Example: `  # Check Go coverage
  rhino-cli test-coverage validate apps/rhino-cli/cover.out 85

  # Check LCOV coverage
  rhino-cli test-coverage validate apps/organiclever-fe/coverage/lcov.info 85

  # Check JaCoCo XML coverage
  rhino-cli test-coverage validate apps/a-demo-be-java-springboot/target/site/jacoco-integration/jacoco.xml 85

  # Output as JSON
  rhino-cli test-coverage validate apps/rhino-cli/cover.out 85 -o json

  # Output as markdown
  rhino-cli test-coverage validate apps/rhino-cli/cover.out 85 -o markdown`,
	Args:          cobra.ExactArgs(2),
	SilenceErrors: true,
	RunE:          runValidateTestCoverage,
}

func init() {
	validateTestCoverageCmd.Flags().BoolVar(&perFile, "per-file", false, "show per-file coverage breakdown")
	validateTestCoverageCmd.Flags().Float64Var(&belowThreshold, "below-threshold", 0, "with --per-file, show only files below this coverage percentage")
	validateTestCoverageCmd.Flags().StringArrayVar(&excludePatterns, "exclude", nil, "exclude files matching glob pattern (repeatable)")
	testCoverageCmd.AddCommand(validateTestCoverageCmd)
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
		result, err = testCoverageComputeLCOVResultFn(absPath, threshold)
	case testcoverage.FormatJaCoCo:
		result, err = testCoverageComputeJaCoCoResultFn(absPath, threshold)
	case testcoverage.FormatCobertura:
		result, err = testCoverageComputeCoberturaResultFn(absPath, threshold)
	case testcoverage.FormatGo:
		result, err = testCoverageComputeGoResultFn(absPath, threshold)
	case testcoverage.FormatDiff:
		return fmt.Errorf("diff format is not a valid input format for validate")
	}
	if err != nil {
		return fmt.Errorf("coverage check failed: %w", err)
	}

	if len(excludePatterns) > 0 {
		testcoverage.ExcludeFiles(&result, excludePatterns)
	}

	perFileText := ""
	if perFile {
		perFileText = testcoverage.FormatTextPerFile(&result, belowThreshold)
	}

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text: func(v, q bool) string {
			return testcoverage.FormatText(&result, v, q) + perFileText
		},
		json:     func() (string, error) { return testcoverage.FormatJSON(&result, perFile, belowThreshold) },
		markdown: func() string { return testcoverage.FormatMarkdown(&result, perFile, belowThreshold) },
	}); err != nil {
		return err
	}

	if !result.Passed {
		return fmt.Errorf("coverage %.2f%% is below threshold %.0f%%", result.Pct, threshold)
	}
	return nil
}
