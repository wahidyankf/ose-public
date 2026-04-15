package cmd

import (
	"fmt"
	"time"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/libs/hugo-commons/links"
)

var linksContentDir string

var linksCheckCmd = &cobra.Command{
	Use:   "check",
	Short: "Validate internal links in ayokoding-web content",
	Long: `Validate all internal links in ayokoding-web markdown content.

Walks all .md files in the content directory, extracts internal links, and
checks that each link resolves to a real file on disk. Internal links use
Hugo absolute paths (/en/... or /id/...) without .md extension.

External links (http://, https://, mailto://) are skipped — use the
apps-ayokoding-web-link-checker AI agent for external link validation.`,
	Example: `  ayokoding-cli links check
  ayokoding-cli links check --content apps/ayokoding-web/content
  ayokoding-cli links check -o json`,
	RunE: runLinksCheck,
}

func init() {
	linksCmd.AddCommand(linksCheckCmd)
	linksCheckCmd.Flags().StringVar(&linksContentDir, "content", "apps/ayokoding-web/content", "content directory path")
}

func runLinksCheck(_ *cobra.Command, _ []string) error {
	if !quiet && output == "text" {
		fmt.Printf("Checking internal links in: %s\n", linksContentDir)
		fmt.Println("---")
	}

	startTime := time.Now()

	result, err := checkLinksFn(linksContentDir)
	if err != nil {
		return fmt.Errorf("link check failed: %w", err)
	}

	elapsed := time.Since(startTime)

	var outputErr error
	switch output {
	case "json":
		outputErr = links.OutputLinksJSON(result, elapsed)
	case "markdown":
		links.OutputLinksMarkdown(result, elapsed)
	default:
		links.OutputLinksText(result, elapsed, quiet, verbose)
	}
	if outputErr != nil {
		return outputErr
	}

	if len(result.BrokenLinks) > 0 {
		return fmt.Errorf("%d broken link(s) found", len(result.BrokenLinks))
	}

	return nil
}
