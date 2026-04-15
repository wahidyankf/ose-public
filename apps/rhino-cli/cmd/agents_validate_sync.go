package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/agents"
)

var validateSyncCmd = &cobra.Command{
	Use:   "validate-sync",
	Short: "Validate that .claude/ and .opencode/ are in sync",
	Long: `Validate that .claude/ and .opencode/ configurations are semantically equivalent.

This command performs the following validations:

Agents:
- Count check: Ensures equal number of agents in both directories
- Equivalence check: Validates each agent is semantically equivalent:
  * Description matches exactly
  * Model is correctly converted (sonnet/opus/empty → zai-coding-plan/glm-5.1, haiku → zai-coding-plan/glm-5-turbo)
  * Tools are correctly mapped (array → boolean map, lowercase)
  * Skills array matches exactly
  * Body content is identical

Skills:
- Count check: Ensures equal number of skills in both directories
- Identity check: Validates skills are byte-for-byte identical`,
	Example: `  # Validate sync
  rhino-cli agents validate-sync

  # Output as JSON
  rhino-cli agents validate-sync -o json

  # Verbose mode (show all checks)
  rhino-cli agents validate-sync -v

  # Quiet mode (show only summary)
  rhino-cli agents validate-sync -q`,
	SilenceErrors: true,
	RunE:          runValidateSync,
}

func init() {
	agentsCmd.AddCommand(validateSyncCmd)
}

func runValidateSync(cmd *cobra.Command, args []string) error {
	// Find git repository root
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	// Perform validation
	result, err := agentsValidateSyncFn(repoRoot)
	if err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	// Format and print output
	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return agents.FormatValidationText(result, v, q) },
		json:     func() (string, error) { return agents.FormatValidationJSON(result) },
		markdown: func() string { return agents.FormatValidationMarkdown(result, verbose) },
	}); err != nil {
		return err
	}

	// Return error if validation failed
	if result.FailedChecks > 0 {
		return fmt.Errorf("validation failed: %d checks failed", result.FailedChecks)
	}

	return nil
}
