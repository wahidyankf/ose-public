package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/naming"
)

// agentRoles enumerates the trailing role tokens permitted by the agent
// naming convention. Kept in lockstep with
// `governance/conventions/structure/agent-naming.md`.
var agentRoles = []string{"maker", "checker", "fixer", "dev", "deployer", "manager"}

// agentsValidateNamingFn is the indirection point tests use to mock out the
// filesystem walk and validation. The default implementation reads the real
// repository tree under `repoRoot`.
var agentsValidateNamingFn = agentsValidateNaming

var agentsValidateNamingCmd = &cobra.Command{
	Use:   "validate-naming",
	Short: "Validate agent filename suffixes and frontmatter name consistency",
	Long: `Validate that every agent file in .claude/agents/ and .opencode/agents/
follows the naming convention documented in
governance/conventions/structure/agent-naming.md.

The command enforces three rules:
- Filename (sans .md) ends with one of: maker, checker, fixer, dev,
  deployer, manager.
- .claude/agents/*.md frontmatter 'name:' field equals the filename
  (without .md). .opencode/agents/*.md files omit the 'name:' field by
  design and skip this check.
- Every .claude/agents/X.md has a corresponding .opencode/agents/X.md and
  vice versa (mirror-drift check).

README.md is exempt in both directories.`,
	Example: `  # Validate agent naming across both harnesses
  rhino-cli agents validate-naming

  # Output as JSON
  rhino-cli agents validate-naming -o json

  # Markdown output (for PR comments, reports)
  rhino-cli agents validate-naming -o markdown`,
	SilenceErrors: true,
	RunE:          runValidateAgentsNaming,
}

func init() {
	agentsCmd.AddCommand(agentsValidateNamingCmd)
}

func runValidateAgentsNaming(cmd *cobra.Command, args []string) error {
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	violations, err := agentsValidateNamingFn(repoRoot)
	if err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return formatNamingText("Agents", violations, v, q) },
		json:     func() (string, error) { return formatNamingJSON("agents", violations) },
		markdown: func() string { return formatNamingMarkdown("Agents", violations) },
	}); err != nil {
		return err
	}

	if len(violations) > 0 {
		return fmt.Errorf("%d naming violation(s) found", len(violations))
	}
	return nil
}

// agentsValidateNaming walks the agent tree under `repoRoot` and returns
// every naming violation, sorted by path for stable output.
func agentsValidateNaming(repoRoot string) ([]naming.Violation, error) {
	claudeDir := filepath.Join(repoRoot, ".claude", "agents")
	opencodeDir := filepath.Join(repoRoot, ".opencode", "agents")

	claudeFiles, err := listAgentFiles(claudeDir)
	if err != nil {
		return nil, err
	}
	opencodeFiles, err := listAgentFiles(opencodeDir)
	if err != nil {
		return nil, err
	}

	var violations []naming.Violation

	// Suffix + frontmatter checks for .claude/agents/*.md.
	for _, path := range claudeFiles {
		if v := naming.ValidateSuffix(path, agentRoles, "role-suffix"); v != nil {
			violations = append(violations, *v)
		}
		content, err := os.ReadFile(path) //nolint:gosec // trusted repo path
		if err != nil {
			return nil, fmt.Errorf("read %s: %w", path, err)
		}
		if v := naming.ValidateFrontmatterName(path, content); v != nil {
			violations = append(violations, *v)
		}
	}

	// Suffix check for .opencode/agents/*.md (frontmatter omits `name:`).
	for _, path := range opencodeFiles {
		if v := naming.ValidateSuffix(path, agentRoles, "role-suffix"); v != nil {
			violations = append(violations, *v)
		}
	}

	// Mirror-drift check.
	violations = append(violations, naming.ValidateMirror(claudeFiles, opencodeFiles)...)

	sort.SliceStable(violations, func(i, j int) bool {
		if violations[i].Path == violations[j].Path {
			return violations[i].Kind < violations[j].Kind
		}
		return violations[i].Path < violations[j].Path
	})

	return violations, nil
}

// listAgentFiles returns absolute paths for `*.md` files directly under
// `dir`, excluding `README.md` and tooling subagents that intentionally
// live in only one harness (e.g. Nx Cloud's `ci-monitor-subagent.md`
// exists in `.opencode/agents/`, `.github/agents/`, and `.codex/agents/`
// but not in `.claude/agents/`). A missing directory yields an empty
// list (not an error) so the validator can run in trees where one
// harness has not yet been initialised.
func listAgentFiles(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("read %s: %w", dir, err)
	}
	var files []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if name == "README.md" || name == "ci-monitor-subagent.md" {
			continue
		}
		if !strings.HasSuffix(name, ".md") {
			continue
		}
		files = append(files, filepath.Join(dir, name))
	}
	sort.Strings(files)
	return files, nil
}

// formatNamingText renders a human-readable summary of violations.
func formatNamingText(label string, violations []naming.Violation, verbose, quiet bool) string {
	var b strings.Builder
	if len(violations) == 0 {
		if !quiet {
			fmt.Fprintf(&b, "%s naming validation: VALIDATION PASSED (0 violations)\n", label)
		}
		return b.String()
	}
	fmt.Fprintf(&b, "%s naming validation: %d violation(s)\n", label, len(violations))
	for _, v := range violations {
		fmt.Fprintf(&b, "  [%s] %s — %s\n", v.Kind, v.Path, v.Message)
	}
	if verbose {
		b.WriteString("\nSee governance/conventions/structure/agent-naming.md (or workflow-naming.md) for the normative rule.\n")
	}
	return b.String()
}

// formatNamingJSON emits a structured report for machine consumers.
func formatNamingJSON(kind string, violations []naming.Violation) (string, error) {
	out := struct {
		Kind       string             `json:"kind"`
		Violations []naming.Violation `json:"violations"`
		Count      int                `json:"count"`
	}{Kind: kind, Violations: violations, Count: len(violations)}
	if out.Violations == nil {
		out.Violations = []naming.Violation{}
	}
	data, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data) + "\n", nil
}

// formatNamingMarkdown emits a PR-friendly markdown table.
func formatNamingMarkdown(label string, violations []naming.Violation) string {
	var b strings.Builder
	fmt.Fprintf(&b, "## %s naming validation\n\n", label)
	if len(violations) == 0 {
		b.WriteString("All files conform to the naming convention.\n")
		return b.String()
	}
	b.WriteString("| Kind | Path | Message |\n")
	b.WriteString("| --- | --- | --- |\n")
	for _, v := range violations {
		fmt.Fprintf(&b, "| %s | `%s` | %s |\n", v.Kind, v.Path, v.Message)
	}
	return b.String()
}
