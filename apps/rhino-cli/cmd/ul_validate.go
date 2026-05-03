package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/glossary"
)

var ulSeverity string

var ulValidateCmd = &cobra.Command{
	Use:   "validate <app>",
	Short: "Validate ubiquitous-language glossary parity against the registry",
	Long: `Verify that every glossary file listed in specs/apps/<app>/bounded-contexts.yaml
is well-formed and internally consistent.

Checks for each registered glossary:
  - Frontmatter contains Bounded context, Maintainer, Last reviewed.
  - Terms table header matches the canonical column names.
  - Each code identifier in backticks exists in the BC's code path.
  - Each feature reference resolves to an existing .feature file.

Cross-context checks:
  - Same term defined in two glossaries without mutual Forbidden-synonyms entries.

Severity is resolved in priority order:
  1. --severity flag
  2. ORGANICLEVER_RHINO_DDD_SEVERITY environment variable
  3. Default: error`,
	Example: `  # Validate organiclever glossaries
  rhino-cli ul validate organiclever

  # Downgrade findings to warnings (escape hatch only)
  rhino-cli ul validate organiclever --severity=warn`,
	Args:          cobra.ExactArgs(1),
	SilenceErrors: true,
	RunE:          runUlValidate,
}

func init() {
	ulValidateCmd.Flags().StringVar(&ulSeverity, "severity", "", "override finding severity: warn|error")
	ulCmd.AddCommand(ulValidateCmd)
}

func runUlValidate(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	app := args[0]
	sev := resolveUlSeverity(ulSeverity)

	findings, err := ulValidateAllFn(glossary.ValidateOptions{
		RepoRoot: repoRoot,
		App:      app,
		Severity: sev,
	})
	if err != nil {
		return err
	}

	for _, f := range findings {
		_, _ = fmt.Fprintf(cmd.OutOrStdout(), "%s: %s: %s\n", f.File, f.Severity, f.Message)
	}

	errCount := 0
	for _, f := range findings {
		if f.Severity == "error" {
			errCount++
		}
	}
	if errCount > 0 {
		return fmt.Errorf("%d error finding(s) found by ul validate", errCount)
	}
	return nil
}

func resolveUlSeverity(flagVal string) string {
	if flagVal != "" {
		return normaliseUlSeverity(flagVal)
	}
	if env := os.Getenv("ORGANICLEVER_RHINO_DDD_SEVERITY"); env != "" {
		return normaliseUlSeverity(env)
	}
	return "error"
}

func normaliseUlSeverity(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "warn", "warning":
		return "warn"
	default:
		return "error"
	}
}
