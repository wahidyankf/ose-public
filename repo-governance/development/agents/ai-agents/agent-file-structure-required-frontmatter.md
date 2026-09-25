---
description: "Defines the mandatory metadata every canonical agent definition in .agents/agents/ must declare."
when_to_use: Use when authoring or validating an agent's canonical metadata.
---

# Agent File Structure — Required Frontmatter

## Required Frontmatter

Every agent is authored once, flat, at `.agents/agents/<name>.md`. Its YAML frontmatter holds the canonical metadata in
this exact order: `name`, `description`, `when_to_use`, `tier`, `capabilities`, then the optional `skills` and
`constraints`. `./rhino metadata validate` rejects any other key and any out-of-order key.

```yaml
---
name: agent-name
description: >-
  Expert in X specializing in Y.
when_to_use: >-
  Use when Z.
tier: execution
capabilities:
  - repository-read
  - repository-write
skills:
  - repo-applying-maker-checker-fixer
constraints:
  - no-edit
---
```

**Generated adapters**: `./rhino harness adapters generate` renders each harness route from this metadata through the
profiles in `repo-config.yml`. The Claude route at `.claude/agents/<name>.md` receives `tools`, `model`, `effort`, and
`skills`; never hand-author those native fields. See the
[Platform Binding Examples](./platform-binding-examples-color-translation-table.md) for the translations.

**NO Comments in Frontmatter**: Agent frontmatter MUST NOT contain inline comments (# symbols in YAML). Put
explanations in the document body below the frontmatter, not as inline comments.

**Field Definitions:**

1. **`name`** (required)
   - MUST exactly match the filename (without `.md` extension), and MUST be unique across `.agents/agents/`
   - Use kebab-case format
   - Should be descriptive and action-oriented
   - Examples: `docs-maker`, `rules-checker`, `api-validator`

2. **`description`** (required)
   - Summary of what the agent does, plain or folded (`>-`)
   - Be specific about the agent's expertise
   - Example: `"Expert documentation writer specializing in GitHub-compatible markdown and Diátaxis framework."`

3. **`when_to_use`** (required)
   - Folded (`>-`) routing text of at most three sentences, distinct from `description`
   - Should complete: "Use this agent when..."

4. **`tier`** (required)
   - The capability grade: `ultra`, `plan`, `execution`, or `fast`
   - Each harness profile's `tiers` map turns it into a native model and effort; Claude receives `plan` as opus/high,
     `execution` as sonnet/xhigh, and `fast` as haiku/xhigh
   - Justify anything above `execution`; see [model-selection.md](../model-selection.md)

5. **`capabilities`** (required)
   - What the agent needs, from the closed vocabulary in fixed order: `repository-read`, `repository-write`, `shell`,
     `network`, `subagent`
   - Declare only what the agent needs; the Claude profile always grants `Read`, then adds `Glob` and `Grep`, `Write`
     and `Edit`, `Bash`, `WebSearch` and `WebFetch`, and `Agent` for each capability in turn

6. **`skills`** (optional)
   - Skill names from `.agents/skills/` that the agent uses, in the order it should load them
   - The Claude route projects the list as its `skills` field, so Claude Code preloads those skills
   - See "agent skills References" below for complete details

7. **`constraints`** (optional)
   - What the agent must not do, from the list `repo-config.yml` declares under `harness.requirements`
   - `read-only` marks a validator; `no-edit`, `no-write`, `no-read`, and `no-glob` remove that one native tool from the
     Claude route, so an agent keeps exactly the tools it needs

`color` is not canonical metadata. It was a Claude-only display label and is no longer authored; see
[Agent Color Categorization](./agent-color-categorization.md).
