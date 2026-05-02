package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/docs"
)

var (
	validateDocsLinksStagedOnly bool
)

var validateDocsLinksCmd = &cobra.Command{
	Use:   "validate-links",
	Short: "Validate markdown links in the repository",
	Long: `Scan markdown files for broken internal links.

This command scans markdown files in the repository and validates that all
internal links point to existing files. External URLs, Hugo paths, and
placeholder links are automatically skipped.

By default, scans all markdown files in core directories (docs/, governance/,
.claude/, and root). Use --staged-only to validate only staged files.`,
	Example: `  # Validate all markdown files
  rhino-cli docs validate-links

  # Validate only staged files (useful in pre-commit hooks)
  rhino-cli docs validate-links --staged-only

  # Output as JSON
  rhino-cli docs validate-links -o json

  # Output as markdown report
  rhino-cli docs validate-links -o markdown

  # Verbose mode with quiet output
  rhino-cli docs validate-links -v -q`,
	SilenceErrors: true, // We handle error messages ourselves
	RunE:          runValidateDocsLinks,
}

func init() {
	docsCmd.AddCommand(validateDocsLinksCmd)
	validateDocsLinksCmd.Flags().BoolVar(&validateDocsLinksStagedOnly, "staged-only", false, "only validate staged files")
}

func runValidateDocsLinks(cmd *cobra.Command, args []string) error {
	// Find git repository root
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	// Build scan options from flags
	opts := docs.ScanOptions{
		RepoRoot:   repoRoot,
		StagedOnly: validateDocsLinksStagedOnly,
		SkipPaths:  []string{}, // No skill mirror to exclude — OpenCode reads .claude/skills/ natively
		Verbose:    verbose,
		Quiet:      quiet,
	}

	// Validate all links
	result, err := docsValidateAllLinksFn(opts)
	if err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return docs.FormatLinkText(result, v, q) },
		json:     func() (string, error) { return docs.FormatLinkJSON(result) },
		markdown: func() string { return docs.FormatLinkMarkdown(result) },
	}); err != nil {
		return err
	}

	// Return error if broken links found (Cobra will set exit code 1)
	if len(result.BrokenLinks) > 0 {
		if !quiet && output == "text" {
			_, _ = fmt.Fprintf(cmd.OutOrStderr(), "\n❌ Found %d broken links\n", len(result.BrokenLinks))
		}
		// Return error to signal failure (Cobra will set exit code 1)
		// Using os.Exit() directly would bypass deferred functions and tests
		return fmt.Errorf("found %d broken links", len(result.BrokenLinks))
	}

	// Success case - no error to return
	return nil
}
