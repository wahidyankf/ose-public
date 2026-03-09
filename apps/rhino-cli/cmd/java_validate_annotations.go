package cmd

import (
	"fmt"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/java"
)

var javaAnnotation string

var validateJavaAnnotationsCmd = &cobra.Command{
	Use:   "validate-annotations <source-root>",
	Short: "Validate Java packages have required null-safety annotations",
	Long: `Scan a Java source tree and verify every package has a package-info.java
with the required null-safety annotation.

For each package directory (any directory containing at least one .java file)
the command checks:
  1. package-info.java exists
  2. package-info.java contains @<annotation>

Any package that fails either check is reported as a violation.`,
	Example: `  # Validate with default annotation (@NullMarked)
  rhino-cli java validate-annotations apps/organiclever-be-jasb/src/main/java

  # Use a custom annotation
  rhino-cli java validate-annotations apps/organiclever-be-jasb/src/main/java --annotation NonNull

  # Output as JSON
  rhino-cli java validate-annotations apps/organiclever-be-jasb/src/main/java -o json

  # Output as markdown report
  rhino-cli java validate-annotations apps/organiclever-be-jasb/src/main/java -o markdown`,
	Args:          cobra.ExactArgs(1),
	SilenceErrors: true,
	RunE:          runValidateJavaAnnotations,
}

func init() {
	javaCmd.AddCommand(validateJavaAnnotationsCmd)
	validateJavaAnnotationsCmd.Flags().StringVar(&javaAnnotation, "annotation", "NullMarked",
		"annotation name to require in package-info.java files")
}

func runValidateJavaAnnotations(cmd *cobra.Command, args []string) error {
	sourceRoot := args[0]

	// Resolve to absolute path
	absSourceRoot, err := filepath.Abs(sourceRoot)
	if err != nil {
		return fmt.Errorf("failed to resolve source root %q: %w", sourceRoot, err)
	}

	opts := java.ValidationOptions{
		SourceRoot: absSourceRoot,
		Annotation: javaAnnotation,
	}

	result, err := java.ValidateAll(opts)
	if err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return java.FormatText(result, v, q) },
		json:     func() (string, error) { return java.FormatJSON(result) },
		markdown: func() string { return java.FormatMarkdown(result) },
	}); err != nil {
		return err
	}

	numViolations := result.TotalPackages - result.ValidPackages
	if numViolations > 0 {
		if !quiet && output == "text" {
			_, _ = fmt.Fprintf(cmd.OutOrStderr(), "\n❌ Found %d violation(s)\n", numViolations)
		}
		return fmt.Errorf("found %d violation(s)", numViolations)
	}

	return nil
}
