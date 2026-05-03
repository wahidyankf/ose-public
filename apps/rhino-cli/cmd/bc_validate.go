package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/bcregistry"
)

var bcSeverity string

var bcValidateCmd = &cobra.Command{
	Use:   "validate <app>",
	Short: "Validate bounded-context structural parity against the registry",
	Long: `Verify that the filesystem matches the registry at
specs/apps/<app>/bounded-contexts.yaml.

Checks for each registered context:
  - Code directory exists with exactly the declared layer subfolders.
  - Glossary file exists.
  - Gherkin directory exists and contains at least one .feature file.

Detects orphans:
  - Code, glossary, or gherkin paths on disk not listed in the registry.

Verifies relationship symmetry for asymmetric relationship kinds
(customer-supplier, conformist).

Severity is resolved in priority order:
  1. --severity flag
  2. ORGANICLEVER_RHINO_DDD_SEVERITY environment variable
  3. Default: error`,
	Example: `  # Validate organiclever bounded-context structure
  rhino-cli bc validate organiclever

  # Downgrade findings to warnings (escape hatch only)
  rhino-cli bc validate organiclever --severity=warn`,
	Args:          cobra.ExactArgs(1),
	SilenceErrors: true,
	RunE:          runBcValidate,
}

func init() {
	bcValidateCmd.Flags().StringVar(&bcSeverity, "severity", "", "override finding severity: warn|error")
	bcCmd.AddCommand(bcValidateCmd)
}

func runBcValidate(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	app := args[0]
	sev := resolveBcSeverity(bcSeverity)

	findings, err := bcValidateAllFn(bcregistry.ValidateOptions{
		RepoRoot: repoRoot,
		App:      app,
		Severity: sev,
	})
	if err != nil {
		return err
	}

	// Print all findings.
	for _, f := range findings {
		_, _ = fmt.Fprintf(cmd.OutOrStdout(), "%s: %s: %s\n", f.File, f.Severity, f.Message)
	}

	// Exit non-zero if any error-severity findings remain.
	errCount := 0
	for _, f := range findings {
		if f.Severity == "error" {
			errCount++
		}
	}
	if errCount > 0 {
		return fmt.Errorf("%d error finding(s) found by bc validate", errCount)
	}
	return nil
}

// resolveBcSeverity returns the effective severity, checking flag → env var → default.
func resolveBcSeverity(flagVal string) string {
	if flagVal != "" {
		return normaliseSeverity(flagVal)
	}
	if env := os.Getenv("ORGANICLEVER_RHINO_DDD_SEVERITY"); env != "" {
		return normaliseSeverity(env)
	}
	return "error"
}

func normaliseSeverity(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "warn", "warning":
		return "warn"
	default:
		return "error"
	}
}
