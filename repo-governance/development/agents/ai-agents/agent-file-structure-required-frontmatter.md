---
description: "Defines the mandatory frontmatter fields every agent definition file must include."
when_to_use: Use when authoring or validating an agent's required frontmatter fields.
---

# Agent File Structure — Required Frontmatter

## Required Frontmatter

Every agent file MUST begin with YAML frontmatter containing six required fields:

```yaml
---
name: agent-name
description: Expert in X specializing in Y. Use when Z.
tools: Read, Glob, Grep
model:
color: blue
skills: []
---
```

**Format Note**: This example shows the **primary platform binding format** (`.claude/agents/`). Secondary platform directories use different representations for tools and model references — see the [Platform Binding Examples](./platform-binding-examples-color-translation-table.md) section above for specifics.

**Field Order**: Fields MUST appear in this exact order (name, description, tools, model, color, skills) for consistency and grep-ability across all agents.

**NO Comments in Frontmatter**: Agent frontmatter MUST NOT contain inline comments (# symbols in YAML). Some coding agent platforms have frontmatter parsing issues with inline YAML comments, and best practice for configuration files is to keep YAML clean without inline comments. Put explanations in the document body below the frontmatter code block, not as inline comments.

**Field Definitions:**

1. **`name`** (required)
   - MUST exactly match the filename (without `.md` extension)
   - Use kebab-case format
   - Should be descriptive and action-oriented
   - Examples: `docs-maker`, `rules-checker`, `api-validator`

2. **`description`** (required)
   - One-line summary of when to use this agent
   - Should complete: "Use this agent when..."
   - Be specific about the agent's expertise
   - Example: `"Expert documentation writer specializing in GitHub-compatible markdown and Diátaxis framework. Use when creating, editing, or organizing project documentation."`

3. **`tools`** (required)
   - Comma-separated list of allowed tool names
   - Explicit whitelist for security and clarity
   - Only include tools the agent needs
   - Common tools: `Read`, `Write`, `Edit`, `Glob`, `Grep`, `Bash`

4. **`model`** (required)
   - Specifies which model capability tier to use for this agent
   - Options: `fable` (ultra), `opus` (planning-grade), `sonnet` (execution-grade), `haiku` (fast), or `inherit`
   - Always declare a value; a blank `model:` is not a grade. Justify anything above execution-grade
   - Planning-grade agents omit `model` for budget-adaptive inheritance — see [model-selection.md](../model-selection.md) for the design rationale
   - See "Model Selection Guidelines" below for decision criteria

5. **`color`** (required)
   - Visual categorization based on agent role
   - Options: `blue` (makers), `green` (checkers), `yellow` (fixers), `purple` (implementors)
   - Helps users quickly identify agent type
   - See "Agent Color Categorization" below for assignment guidelines

6. **`skills`** (required)
   - List of Skill names the agent references (from `.agents/skills/` (primary))
   - Can be empty array `[]` if agent doesn't use agent skills - agent skills auto-load when agent is invoked (if task matches Skill description)
   - Enables composability and explicit knowledge dependencies
   - Example: `skills: [docs-creating-accessible-diagrams, repo-applying-maker-checker-fixer]`
   - See "agent skills References" section below for complete details
