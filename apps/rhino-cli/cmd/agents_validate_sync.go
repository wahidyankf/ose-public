package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/agents"
)

var validateSyncCmd = &cobra.Command{
	Use:   "validate-sync",
	Short: "Validate that .claude/ and .opencode/ are in sync",
	Long: `Validate that .claude/ and .opencode/ configurations are
semantically equivalent.

The validator targets .opencode/agents/ (plural, per
opencode.ai/docs/agents/). The legacy singular path
.opencode/agent/ MUST NOT exist; if it reappears the validator
fails with a stale-directory check naming the path.

Agents (one-directional, claude ⊆ opencode):
- Count check: every Claude agent has a corresponding OpenCode
  agent. OpenCode-only agents (e.g. Nx-generated subagents) are
  tolerated as extras.
- Equivalence check: per-agent semantic match:
  * Description matches exactly
  * Model is correctly converted (mapping owned by ConvertModel —
    see adopt-opencode-go plan for current target IDs)
  * Tools are correctly mapped (array/string → lowercase boolean
    map)
  * Skills array matches exactly
  * Body content is identical

Skills:
- OpenCode reads .claude/skills/ natively per
  opencode.ai/docs/skills/, so no skill mirror is validated.
  validate-claude already enforces .claude/skills/ source format.`,
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
