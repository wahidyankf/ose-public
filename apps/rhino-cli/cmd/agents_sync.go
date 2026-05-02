package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/agents"
)

var (
	syncDryRun     bool
	syncAgentsOnly bool
	syncSkillsOnly bool
)

var syncAgentsCmd = &cobra.Command{
	Use:   "sync",
	Short: "Sync Claude Code agents to OpenCode format",
	Long: `Convert .claude/ configuration to .opencode/ format with explicit
per-field policy.

Agents are read from .claude/agents/ and written to .opencode/agents/
(plural, per opencode.ai/docs/agents/). Each Claude Code agent
frontmatter field has an explicit policy in claudeAgentFieldPolicy
(see internal/agents/converter.go):

  * preserve   — description, color, skills (passed through unchanged)
  * translate  — tools (array/string → lowercase boolean map),
                 model (via ConvertModel — owned by adopt-opencode-go
                 plan), maxTurns → steps
  * drop       — name (filename carries it)
  * drop-warn  — disallowedTools, permissionMode, effort, memory,
                 isolation, background, initialPrompt, mcpServers,
                 hooks (no OpenCode equivalent today; warning emitted)

Unknown frontmatter keys (typos, forward-compat gaps) drop with a
warning naming the field. Warnings surface in --verbose output and
in the JSON/markdown reports; they do NOT alter the success exit
code.

Skills under .claude/skills/ are read natively by OpenCode per
opencode.ai/docs/skills/, so no skill copy is performed by this
command (Phase 4 of the validate-claude-opencode-sync-correctness
plan removed the redundant skill mirror).`,
	Example: `  # Sync all agents and skills
  rhino-cli agents sync

  # Preview changes without modifying files
  rhino-cli agents sync --dry-run

  # Sync only agents (skip skills)
  rhino-cli agents sync --agents-only

  # Sync only skills (skip agents)
  rhino-cli agents sync --skills-only

  # Output as JSON
  rhino-cli agents sync -o json

  # Verbose mode
  rhino-cli agents sync -v`,
	SilenceErrors: true,
	RunE:          runSyncAgents,
}

func init() {
	agentsCmd.AddCommand(syncAgentsCmd)
	syncAgentsCmd.Flags().BoolVar(&syncDryRun, "dry-run", false, "preview changes without modifying files")
	syncAgentsCmd.Flags().BoolVar(&syncAgentsOnly, "agents-only", false, "sync only agents (skip skills)")
	syncAgentsCmd.Flags().BoolVar(&syncSkillsOnly, "skills-only", false, "sync only skills (skip agents)")
}

func runSyncAgents(cmd *cobra.Command, args []string) error {
	// Validate flags
	if syncAgentsOnly && syncSkillsOnly {
		return fmt.Errorf("cannot use both --agents-only and --skills-only")
	}

	// Find git repository root
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	// Build sync options from flags
	opts := agents.SyncOptions{
		RepoRoot:   repoRoot,
		DryRun:     syncDryRun,
		AgentsOnly: syncAgentsOnly,
		SkillsOnly: syncSkillsOnly,
		Verbose:    verbose,
		Quiet:      quiet,
	}

	// Perform sync
	result, err := agentsSyncAllFn(opts)
	if err != nil {
		return fmt.Errorf("sync failed: %w", err)
	}

	// Format and print output
	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return agents.FormatSyncText(result, v, q) },
		json:     func() (string, error) { return agents.FormatSyncJSON(result) },
		markdown: func() string { return agents.FormatSyncMarkdown(result) },
	}); err != nil {
		return err
	}

	// Return error if there were failures
	if len(result.FailedFiles) > 0 {
		return fmt.Errorf("sync completed with %d failures", len(result.FailedFiles))
	}

	return nil
}
