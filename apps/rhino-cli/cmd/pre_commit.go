package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/precommit"
)

var preCommitCmd = &cobra.Command{
	Use:   "pre-commit",
	Short: "Run all pre-commit checks (config, lint, format, docs)",
	Long: `Orchestrate all pre-commit hook steps in order:

  1. Validate .claude/ and .opencode/ configuration (if staged)
  2. Validate docker-compose files (if staged)
  3. Run nx affected run-pre-commit (warn only on failure)
  4. Stage ayokoding-web content changes
  5. Run lint-staged
  6. Auto-format staged Elixir files with mix format
  7. Validate and fix docs file naming (if docs/ staged)
  8. Validate markdown links in staged files
  9. Lint all markdown files

Exits immediately on the first failure (except step 3 which only warns).`,
	SilenceErrors: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		gitRoot, err := findGitRoot()
		if err != nil {
			return fmt.Errorf("failed to find git repository root: %w", err)
		}
		return precommit.Run(gitRoot, precommit.DefaultDeps())
	},
}

func init() {
	rootCmd.AddCommand(preCommitCmd)
}
