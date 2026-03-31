package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var gitPreCommitCmd = &cobra.Command{
	Use:   "pre-commit",
	Short: "Run all pre-commit checks (config, lint, format, docs)",
	Long: `Orchestrate all pre-commit hook steps in order:

  1. Validate .claude/ and .opencode/ configuration (if staged)
  2. Validate docker-compose files (if staged)
  3. Run nx affected run-pre-commit (warn only on failure)
  4. Stage ayokoding-web content changes
  5. Run lint-staged
  5b. Sync app-level package-lock.json files (if apps/*/package.json staged)
  6. Validate and fix docs file naming (if docs/ staged)
  7. Validate markdown links in staged files
  8. Lint all markdown files

Each step runs with a 30-second timeout; the entire hook has a 120-second
total timeout. Timed-out steps log a warning and are skipped rather than
blocking the commit.

Exits immediately on the first failure (except step 3 which only warns).`,
	SilenceErrors: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		gitRoot, err := findGitRoot()
		if err != nil {
			return fmt.Errorf("failed to find git repository root: %w", err)
		}
		return gitRunFn(gitRoot, gitDefaultDepsFn())
	},
}

func init() {
	gitCmd.AddCommand(gitPreCommitCmd)
}
