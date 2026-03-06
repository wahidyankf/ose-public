package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/open-sharia-enterprise/apps/rhino-cli/internal/agents"
)

var (
	syncDryRun     bool
	syncAgentsOnly bool
	syncSkillsOnly bool
)

var syncAgentsCmd = &cobra.Command{
	Use:   "sync-agents",
	Short: "Sync Claude Code agents to OpenCode format",
	Long: `Convert .claude/ configuration to .opencode/ format with proper
YAML frontmatter transformation and skills synchronization.

This command performs the following operations:
- Converts agents from .claude/agents/ to .opencode/agent/ with:
  * Tools array → boolean map (Read → read: true)
  * Model mapping (sonnet/opus → zai/glm-4.7, haiku → zai/glm-4.5-air, empty → inherit)
  * Removal of Claude-specific fields (name, color)
  * Preservation of description, skills, and body content

- Copies skills from .claude/skills/ to .opencode/skill/ with:
  * Direct byte-for-byte copy (skills format is identical)
  * SKILL.md → {skill-name}.md conversion`,
	Example: `  # Sync all agents and skills
  rhino-cli sync-agents

  # Preview changes without modifying files
  rhino-cli sync-agents --dry-run

  # Sync only agents (skip skills)
  rhino-cli sync-agents --agents-only

  # Sync only skills (skip agents)
  rhino-cli sync-agents --skills-only

  # Output as JSON
  rhino-cli sync-agents -o json

  # Verbose mode
  rhino-cli sync-agents -v`,
	SilenceErrors: true,
	RunE:          runSyncAgents,
}

func init() {
	rootCmd.AddCommand(syncAgentsCmd)
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
	result, err := agents.SyncAll(opts)
	if err != nil {
		return fmt.Errorf("sync failed: %w", err)
	}

	// Format and print output
	formattedOutput := agents.FormatSyncResult(result, output, quiet)
	_, _ = fmt.Fprint(cmd.OutOrStdout(), formattedOutput)

	// Return error if there were failures
	if len(result.FailedFiles) > 0 {
		return fmt.Errorf("sync completed with %d failures", len(result.FailedFiles))
	}

	return nil
}
