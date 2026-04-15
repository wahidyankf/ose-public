package cmd

import (
	"fmt"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/contracts"
)

var contractsJavaCleanImportsCmd = &cobra.Command{
	Use:   "java-clean-imports <generated-contracts-dir>",
	Short: "Remove unused and same-package imports from generated Java files",
	Long: `Scan all .java files in the specified directory and remove:
  - Imports from the same package as the file
  - Imports whose class name is not referenced in the file body
  - Duplicate import lines

Files are only rewritten when changes are detected.`,
	Example: `  rhino-cli contracts java-clean-imports apps/a-demo-be-java-springboot/generated-contracts
  rhino-cli contracts java-clean-imports apps/a-demo-be-java-vertx/generated-contracts -o json`,
	Args:          cobra.ExactArgs(1),
	SilenceErrors: true,
	RunE:          runContractsJavaCleanImports,
}

func init() {
	contractsCmd.AddCommand(contractsJavaCleanImportsCmd)
}

func runContractsJavaCleanImports(cmd *cobra.Command, args []string) error {
	dir := args[0]

	absDir, err := filepath.Abs(dir)
	if err != nil {
		return fmt.Errorf("failed to resolve directory %q: %w", dir, err)
	}

	opts := contracts.JavaCleanImportsOptions{
		Dir: absDir,
	}

	result, err := contractsCleanJavaImportsFn(opts)
	if err != nil {
		return fmt.Errorf("java import cleaning failed: %w", err)
	}

	return writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return contracts.FormatJavaCleanImportsText(result, v, q) },
		json:     func() (string, error) { return contracts.FormatJavaCleanImportsJSON(result) },
		markdown: func() string { return contracts.FormatJavaCleanImportsMarkdown(result) },
	})
}
