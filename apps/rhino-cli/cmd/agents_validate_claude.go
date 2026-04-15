package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/agents"
)

var (
	agentsOnly bool
	skillsOnly bool
)

var validateClaudeCmd = &cobra.Command{
	Use:   "validate-claude",
	Short: "Validate Claude Code agent and skill format in .claude/ directory",
	Long: `Validate that .claude/ directory contains valid Claude Code format.

This command performs the following validations:

Agents (.claude/agents/):
- YAML formatting (space after colons required)
- YAML frontmatter syntax
- Required fields: name, description, tools, model, color, skills
- Field order (exact sequence required)
- Valid tool names (Read, Write, Edit, Glob, Grep, Bash, TodoWrite, WebFetch, WebSearch)
- Valid model names (empty, sonnet, opus, haiku)
- Valid colors (blue, green, yellow, purple)
- Filename matches name field
- Agent name uniqueness
- Skills references exist
- No YAML comments
- Special rules (e.g., generated-reports/ tools)

Skills (.claude/skills/):
- YAML formatting (space after colons required)
- SKILL.md file exists
- YAML syntax validity
- Required fields: name, description
- Name format (lowercase, hyphens, numbers only, max 64 chars)
- Name matches directory name`,
	Example: `  # Validate all agents and skills
  rhino-cli agents validate-claude

  # Output as JSON
  rhino-cli agents validate-claude -o json

  # Verbose mode (show all checks)
  rhino-cli agents validate-claude -v

  # Validate only agents
  rhino-cli agents validate-claude --agents-only

  # Validate only skills
  rhino-cli agents validate-claude --skills-only`,
	SilenceErrors: true,
	RunE:          runValidateClaude,
}

func init() {
	agentsCmd.AddCommand(validateClaudeCmd)
	validateClaudeCmd.Flags().BoolVar(&agentsOnly, "agents-only", false, "validate only agents")
	validateClaudeCmd.Flags().BoolVar(&skillsOnly, "skills-only", false, "validate only skills")
}

func runValidateClaude(cmd *cobra.Command, args []string) error {
	// Validate flags
	if agentsOnly && skillsOnly {
		return fmt.Errorf("cannot use --agents-only and --skills-only together")
	}

	// Find git repository root
	repoRoot, err := findGitRoot()
	if err != nil {
		return fmt.Errorf("failed to find git repository root: %w", err)
	}

	// Perform validation
	result, err := agentsValidateClaudeFn(agents.ValidateClaudeOptions{
		RepoRoot:   repoRoot,
		AgentsOnly: agentsOnly,
		SkillsOnly: skillsOnly,
	})
	if err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	// Format and print output
	if err := writeFormatted(cmd, output, verbose, quiet, outputFuncs{
		text:     func(v, q bool) string { return agents.FormatValidationText(result, v, q) },
		json:     func() (string, error) { return agents.FormatValidationJSON(result) },
		markdown: func() string { return agents.FormatValidationMarkdown(result, verbose) },
	}); err != nil {
		return err
	}

	// Return error if validation failed
	if result.FailedChecks > 0 {
		return fmt.Errorf("validation failed: %d checks failed", result.FailedChecks)
	}

	return nil
}
