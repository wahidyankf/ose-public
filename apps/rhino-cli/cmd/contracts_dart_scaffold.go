package cmd

import (
	"fmt"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/contracts"
)

var contractsDartScaffoldCmd = &cobra.Command{
	Use:   "dart-scaffold <generated-contracts-dir>",
	Short: "Create Dart package scaffolding for generated contracts",
	Long: `Create the pubspec.yaml and barrel library file needed to make
generated Dart model parts importable as a Dart package.

The barrel library includes part directives for all model files
and utility functions required by the generated code.`,
	Example: `  rhino-cli contracts dart-scaffold apps/a-demo-fe-dart-flutterweb/generated-contracts
  rhino-cli contracts dart-scaffold apps/a-demo-fe-dart-flutterweb/generated-contracts -o json`,
	Args:          cobra.ExactArgs(1),
	SilenceErrors: true,
	RunE:          runContractsDartScaffold,
}

func init() {
	contractsCmd.AddCommand(contractsDartScaffoldCmd)
}

func runContractsDartScaffold(cmd *cobra.Command, args []string) error {
	dir := args[0]

	absDir, err := filepath.Abs(dir)
	if err != nil {
		return fmt.Errorf("failed to resolve directory %q: %w", dir, err)
	}

	opts := contracts.DartScaffoldOptions{
		Dir: absDir,
	}

	result, err := contractsScaffoldDartFn(opts)
	if err != nil {
		return fmt.Errorf("dart scaffolding failed: %w", err)
	}

	return writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return contracts.FormatDartScaffoldText(result, v, q) },
		json:     func() (string, error) { return contracts.FormatDartScaffoldJSON(result) },
		markdown: func() string { return contracts.FormatDartScaffoldMarkdown(result) },
	})
}
