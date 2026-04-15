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
	Long: `Convert .claude/ configuration to .opencode/ format with proper
YAML frontmatter transformation and skills synchronization.

This command performs the following operations:
- Converts agents from .claude/agents/ to .opencode/agent/ with:
  * Tools array → boolean map (Read → read: true)
  * Model mapping (sonnet/opus → zai-coding-plan/glm-5.1, haiku → zai-coding-plan/glm-5-turbo, empty → zai-coding-plan/glm-5.1)
  * Removal of Claude-specific fields (name, color)
  * Preservation of description, skills, and body content

- Copies skills from .claude/skills/ to .opencode/skill/ with:
  * Direct byte-for-byte copy (skills format is identical)
  * SKILL.md → {skill-name}.md conversion`,
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
