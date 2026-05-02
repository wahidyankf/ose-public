package cmd

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/governance"
)

// governanceVendorAuditFn is the test-mockable entrypoint for the vendor audit.
var governanceVendorAuditFn = governanceVendorAudit

var governanceVendorAuditCmd = &cobra.Command{
	Use:   "vendor-audit [path]",
	Short: "Scan governance markdown files for forbidden vendor-specific terms",
	Long: `Scan all .md files under [path] for forbidden vendor-specific terms in prose.

The scanner respects several exemption regions:
  - Content inside code fences (any language tag including binding-example)
  - Content under headings containing "Platform Binding Examples" (case-insensitive)
  - Inline code spans
  - Link URL portions
  - HTML comments
  - The governance-vendor-independence.md convention definition file itself

Exits with code 1 if any violations are found, 0 if clean.`,
	Example: `  # Audit the default governance/ directory
  rhino-cli governance vendor-audit

  # Audit a specific path
  rhino-cli governance vendor-audit docs/

  # Output as JSON
  rhino-cli governance vendor-audit -o json`,
	SilenceErrors: true,
	RunE:          runGovernanceVendorAudit,
}

func init() {
	governanceCmd.AddCommand(governanceVendorAuditCmd)
}

func runGovernanceVendorAudit(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	scanPath := "governance"
	if len(args) > 0 {
		scanPath = args[0]
	}
	fullPath := filepath.Join(repoRoot, scanPath)

	findings, err := governanceVendorAuditFn(fullPath)
	if err != nil {
		return fmt.Errorf("vendor audit failed: %w", err)
	}

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return formatVendorAuditText(findings) },
		json:     func() (string, error) { return formatVendorAuditJSON(findings) },
		markdown: func() string { return formatVendorAuditMarkdown(findings) },
	}); err != nil {
		return err
	}

	if len(findings) > 0 {
		return fmt.Errorf("%d violation(s) found", len(findings))
	}
	return nil
}

// governanceVendorAudit is the real implementation that delegates to the
// internal governance package.
func governanceVendorAudit(root string) ([]governance.Finding, error) {
	return governance.Walk(root)
}

// formatVendorAuditText formats the findings as human-readable text.
func formatVendorAuditText(findings []governance.Finding) string {
	if len(findings) == 0 {
		return "GOVERNANCE VENDOR AUDIT PASSED: no violations found\n"
	}
	var sb strings.Builder
	fmt.Fprintf(&sb, "GOVERNANCE VENDOR AUDIT FAILED: %d violation(s) found\n", len(findings))
	for _, f := range findings {
		fmt.Fprintf(&sb, "  %s:%d  %s  →  %s\n", f.Path, f.Line, f.Match, f.Replacement)
	}
	return sb.String()
}

// formatVendorAuditJSON formats the findings as JSON.
func formatVendorAuditJSON(findings []governance.Finding) (string, error) {
	type jsonFinding struct {
		Path        string `json:"path"`
		Line        int    `json:"line"`
		Match       string `json:"match"`
		Replacement string `json:"replacement"`
	}
	type jsonResult struct {
		Status   string        `json:"status"`
		Count    int           `json:"count"`
		Findings []jsonFinding `json:"findings"`
	}

	status := "passed"
	if len(findings) > 0 {
		status = "failed"
	}

	jf := make([]jsonFinding, 0, len(findings))
	for _, f := range findings {
		jf = append(jf, jsonFinding{
			Path:        f.Path,
			Line:        f.Line,
			Match:       f.Match,
			Replacement: f.Replacement,
		})
	}

	result := jsonResult{
		Status:   status,
		Count:    len(findings),
		Findings: jf,
	}

	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data) + "\n", nil
}

// formatVendorAuditMarkdown formats the findings as a markdown table.
func formatVendorAuditMarkdown(findings []governance.Finding) string {
	if len(findings) == 0 {
		return "## Governance Vendor Audit\n\n**PASSED**: no violations found\n"
	}
	var sb strings.Builder
	fmt.Fprintf(&sb, "## Governance Vendor Audit\n\n**FAILED**: %d violation(s) found\n\n", len(findings))
	sb.WriteString("| File | Line | Term | Replacement |\n")
	sb.WriteString("|------|------|------|-------------|\n")
	for _, f := range findings {
		fmt.Fprintf(&sb, "| %s | %d | `%s` | %s |\n", f.Path, f.Line, f.Match, f.Replacement)
	}
	return sb.String()
}
