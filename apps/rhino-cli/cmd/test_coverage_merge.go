package cmd

import (
	"fmt"
	"path/filepath"
	"strconv"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/testcoverage"
)

var (
	mergeOutFile         string
	mergeValidate        string
	mergeExcludePatterns []string
)

var mergeTestCoverageCmd = &cobra.Command{
	Use:   "merge <file1> <file2> [file3...]",
	Short: "Merge multiple coverage files into one LCOV output",
	Long: `Merge coverage files from different formats into a single LCOV output.

Supports mixing Go cover.out, LCOV, JaCoCo XML, and Cobertura XML files.
For overlapping lines, takes the maximum hit count.

Output is always LCOV format (most portable).`,
	Example: `  # Merge two LCOV files
  rhino-cli test-coverage merge coverage1.info coverage2.info --out-file merged.info

  # Merge and validate
  rhino-cli test-coverage merge unit.info integration.info --out-file merged.info --validate 90

  # Merge with exclusion
  rhino-cli test-coverage merge coverage.info --exclude "generated/*" --out-file merged.info`,
	Args:          cobra.MinimumNArgs(2),
	SilenceErrors: true,
	RunE:          runMergeTestCoverage,
}

func init() {
	mergeTestCoverageCmd.Flags().StringVar(&mergeOutFile, "out-file", "", "output file path (LCOV format)")
	mergeTestCoverageCmd.Flags().StringVar(&mergeValidate, "validate", "", "validate merged coverage against threshold")
	mergeTestCoverageCmd.Flags().StringArrayVar(&mergeExcludePatterns, "exclude", nil, "exclude files matching glob pattern (repeatable)")
	testCoverageCmd.AddCommand(mergeTestCoverageCmd)
}

func runMergeTestCoverage(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	// Parse all input files into CoverageMaps
	var maps []testcoverage.CoverageMap
	for _, arg := range args {
		absPath := filepath.Join(repoRoot, arg)
		cm, parseErr := testCoverageToCoverageMapFn(absPath)
		if parseErr != nil {
			return fmt.Errorf("failed to parse %s: %w", arg, parseErr)
		}
		maps = append(maps, cm)
	}

	// Merge
	merged := testcoverage.MergeCoverageMaps(maps...)

	// Apply exclusions
	if len(mergeExcludePatterns) > 0 {
		for filePath := range merged {
			if testcoverage.MatchesAnyExcludePattern(filePath, mergeExcludePatterns) {
				delete(merged, filePath)
			}
		}
	}

	// Write output file if requested
	if mergeOutFile != "" {
		outPath := filepath.Join(repoRoot, mergeOutFile)
		if writeErr := testcoverage.WriteLCOV(merged, outPath); writeErr != nil {
			return fmt.Errorf("failed to write output: %w", writeErr)
		}
	}

	// Calculate result for display
	threshold := 0.0
	if mergeValidate != "" {
		threshold, err = strconv.ParseFloat(mergeValidate, 64)
		if err != nil {
			return fmt.Errorf("invalid --validate threshold %q: must be a number", mergeValidate)
		}
	}

	result := testcoverage.ResultFromCoverageMap(merged, threshold)
	result.File = "merged"

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return testcoverage.FormatText(&result, v, q) },
		json:     func() (string, error) { return testcoverage.FormatJSON(&result, false, 0) },
		markdown: func() string { return testcoverage.FormatMarkdown(&result, false, 0) },
	}); err != nil {
		return err
	}

	if mergeValidate != "" && !result.Passed {
		return fmt.Errorf("merged coverage %.2f%% is below threshold %.0f%%", result.Pct, threshold)
	}
	return nil
}
