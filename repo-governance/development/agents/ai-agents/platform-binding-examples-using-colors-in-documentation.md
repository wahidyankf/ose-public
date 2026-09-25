---
description: "Shows how to reference agent colors in documentation and lists worked color-field examples."
when_to_use: Use when documenting an agent's color in prose or when picking an example color-field value.
---

# Platform Binding Examples — Using Colors in Documentation and Examples

## Using Colors in Documentation

**Agent README Listings:**

When listing agents in the agent definition directory README (`.agents/agents/README.md` or equivalent), use the colored square emoji:

```markdown
### 🟦 `docs-maker.md`

Expert documentation writer specializing in GitHub-compatible markdown and Diátaxis framework.
```

**Consistency with Emoji Convention:**

Colored square emojis follow the [Emoji Usage Convention](../../../conventions/formatting/emoji.md):

- Use at the start of headings for visual categorization
- Maintain semantic consistency (same color = same role across all docs)
- Avoid overuse (1 emoji per agent listing)

## Color Field Examples

**Maker Agent (Blue):**

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
---
```

**Checker Agent (Green):**

```yaml
---
name: rules-checker
description: Validates consistency between agents, AGENTS.md, conventions, and documentation. Use when checking for inconsistencies, contradictions, duplicate content, or verifying repository rule compliance.
when_to_use: >-
  Use when [scenario].
tier: execution
capabilities:
  - repository-read
  - repository-write
  - shell
---
```

**Fixer Agent (Yellow):**

```yaml
---
name: readme-fixer
description: Applies validated fixes from readme-checker audit reports. Re-validates README findings before applying changes. Use after reviewing readme-checker output.
when_to_use: >-
  Use when [scenario].
tier: execution
capabilities:
  - repository-read
  - repository-write
  - shell
---
```

**Implementor Agent (Purple):**

```yaml
---
name: swe-typescript-dev
description: Develops TypeScript applications following type safety principles, modern patterns, and platform coding standards. Use when implementing TypeScript code for OSE Platform.
when_to_use: >-
  Use when [scenario].
tier: plan
capabilities:
  - repository-read
  - repository-write
  - shell
---
```
