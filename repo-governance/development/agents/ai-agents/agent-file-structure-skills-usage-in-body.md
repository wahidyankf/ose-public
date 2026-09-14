---
description: "Continues agent skills reference guidance: best practices for agent skills references, the frontmatter-only DRY rule, and agent skills vs. direct convention references."
when_to_use: Use when writing or reviewing how an agent documents its agent skills usage in its body text.
---

# Agent File Structure — Agent skills References (Continued)

## Best Practices for agent skills References

1. **Minimal set**: Reference only agent skills the agent actually uses
2. **Relevant agent skills**: agent skills should align with agent's domain
3. **Order by importance**: List most critical agent skills first
4. **Keep updated**: Add/remove agent skills as agent evolves
5. **Validate references**: Ensure referenced agent skills exist in the platform binding skills directory (primary source of truth)

## Agent skills Documentation: Frontmatter Only (DRY Principle)

**CRITICAL**: agent skills MUST only be declared in frontmatter. Do NOT create documentation sections listing skills in the agent body.

**Why Frontmatter Only:**

- ✅ **Single source of truth**: Frontmatter is canonical and machine-readable
- ✅ **Eliminates duplication**: Each Skill already has its own description in SKILL.md
- ✅ **Reduces maintenance**: No risk of frontmatter and body getting out of sync
- ✅ **Keeps agents lean**: Avoids unnecessary documentation bulk
- ✅ **Follows DRY**: Don't Repeat Yourself - reference, don't restate

**FORBIDDEN Pattern** (violates DRY):

```markdown
## Knowledge Dependencies (agent skills)

This agent leverages agent skills from `.claude/skills/`:

1. **`skill-name`** - what it does
2. **`other-skill`** - what it does
```

**CORRECT Pattern** (frontmatter only):

```yaml
---
skills:
  - skill-name
  - other-skill
---
```

**Contextual Inline References** (allowed when adding context):

```markdown
**See `repo-generating-validation-reports` Skill** for UUID chain generation and progressive writing methodology.
```

This is acceptable because it provides contextual guidance pointing to specific Skill knowledge at relevant points in the agent documentation.

**Summary**: Declare skills in frontmatter, optionally reference them inline for context, but NEVER create a dedicated section listing skills with descriptions.

## Agent skills vs. Direct Convention References

Agents can use both agent skills AND direct links to convention documents:

- **Agent skills**: For progressive disclosure and shared knowledge (auto-loaded)
- **Direct links**: For specific, targeted guidance (always in Reference Documentation section)

**Example combining both:**

```yaml
---
name: docs-checker
description: Validates documentation quality and factual correctness.
tools: Read, Glob, Grep, Write, Bash
model: sonnet
color: green
skills:
  - repo-applying-maker-checker-fixer
  - repo-assessing-criticality-confidence
---
```

**Reference Documentation section:**

```markdown
## Reference Documentation

**Agent skills**: This agent uses `repo-applying-maker-checker-fixer` and `repo-assessing-criticality-confidence` agent skills for validation workflows.

**Conventions:**

- `repo-governance/conventions/writing/quality.md` - Content Quality Principles
- `repo-governance/conventions/formatting/linking.md` - Linking Convention
```

This pattern provides both auto-loaded knowledge (agent skills) and explicit references for specific requirements.

See [agent skills README](../../../../.claude/skills/README.md) for complete details on agent skills creation, structure, and usage patterns.
