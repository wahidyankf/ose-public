---
description: "Defines the agent skills frontmatter field format and when to reference a Skill instead of inlining knowledge."
when_to_use: Use when deciding whether an agent should reference a Skill via frontmatter or document knowledge inline.
---

# Agent File Structure — Agent skills References

**EXPECTED FIELD**: Every agent that uses agent skills MUST list them in its `skills:` field; an agent that uses none omits the field.

**Purpose:** The `skills:` field declares which agent skills (knowledge packages in `.agents/skills/`) the agent leverages. This enables:

- **Composability**: Explicit declarations of knowledge dependencies
- **Consistency**: All agents follow same structure (no special cases)
- **Discoverability**: Easy to see which agents use which agent skills
- **Validation**: Checkers can enforce field presence and validate references

## Agent skills Field Format

The `skills` field (already defined as field 6 in Required Frontmatter above) has the following detailed characteristics:

- **Format**: YAML array of strings
- **Required**: When the agent uses any skill; omit the field rather than writing an empty list
- **Values**: Skill names matching folder names in `.agents/skills/`
- **Preloading**: the generated Claude route projects the list as its `skills` field, so Claude Code preloads those skills when the agent starts
- **Validation**: Referenced agent skills must exist in `.agents/skills/`
- **Example**: `skills: [docs-creating-accessible-diagrams, repo-applying-maker-checker-fixer]`

## When to Reference agent skills vs. Inline Knowledge

**Use agent skills references when:**

- PASS: Knowledge is specialized and deep (e.g., accessible color palettes, Gherkin syntax)
- PASS: Knowledge is shared across multiple agents (e.g., Maker-Checker-Fixer pattern)
- PASS: Knowledge requires progressive disclosure (overview at startup, details on-demand)
- PASS: Knowledge is frequently updated (agent skills centralize updates)
- PASS: Knowledge has multiple aspects (Skill can have reference.md, examples.md)

**Use inline knowledge when:**

- PASS: Knowledge is agent-specific and not shared
- PASS: Knowledge is simple and fits in a few paragraphs
- PASS: Knowledge is critical for agent's core operation (always needed)
- PASS: Knowledge is stable and rarely changes

## Agent skills Field Examples

**Agent using agent skills:**

```yaml
---
name: docs-maker
description: Expert documentation writer specializing in GitHub-compatible markdown and Diátaxis framework. Use when creating, editing, or organizing project documentation.
when_to_use: >-
  Use when [scenario].
tier: execution
capabilities:
  - repository-read
  - repository-write
skills:
  - docs-creating-accessible-diagrams
  - docs-applying-content-quality
  - docs-applying-diataxis-framework
---
```

**Agent not using agent skills:**

```yaml
---
name: simple-helper
description: Simple helper agent for basic tasks.
when_to_use: >-
  Use when [scenario].
tier: fast
capabilities:
  - repository-read
---
```

## Agent skills Composition Pattern

Agents can reference multiple agent skills that work together:

```yaml
---
name: apps-ayokoding-www-general-maker
description: Expert at creating general Next.js content for ayokoding-www. Use when creating or updating general content pages for the AyoKoding website.
when_to_use: >-
  Use when [scenario].
tier: execution
capabilities:
  - repository-read
  - repository-write
skills:
  - apps-ayokoding-www-developing-content
  - docs-creating-accessible-diagrams
  - docs-validating-factual-accuracy
---
```

When this agent is invoked, all three agent skills auto-load if the task description matches their triggers. Agent skills compose seamlessly to provide comprehensive knowledge.
