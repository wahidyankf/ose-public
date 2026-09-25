---
description: "Gives the Skill validation checklist and lists common context-architecture mistakes."
when_to_use: Use when validating that a new or edited Skill declares the correct context mode.
---

# Validation and Compliance

## Skill Validation Checklist

When creating or reviewing skills in `.agents/skills/`:

- [ ] `context` field is omitted (inline default), `inline`, or `fork` (main conversation only)
- [ ] No `agent` field (only valid with `context: fork`)
- [ ] Skill provides knowledge, not task delegation
- [ ] Description focuses on knowledge domain, not agent spawning
- [ ] Skill works identically in main conversation and delegated agent contexts

## Common Mistakes

### ❌ Mistake 1: Fork skill with agent field in the canonical skills directory

**Wrong**:

```yaml
# .agents/skills/deep-research/SKILL.md
---
description: Performs deep research on topics
context: fork
agent: Explore
---
```

**Problem**: Breaks when delegated agents try to use this skill.

**Right**: Keep in `.agents/skills/` but document as main-conversation-only, or use a workflow approach.

### ❌ Mistake 2: Inline skill trying to spawn agents

**Wrong**:

```yaml
# .agents/skills/analysis/SKILL.md
---
description: Analyzes code quality
---
# Analysis Skill

Run the code-checker agent to validate...
```

**Problem**: Inline skills can't spawn agents. Skill will fail to execute.

**Right**: Either make it a fork skill (outside the canonical skills directory) or reference conventions instead of delegating to agents.

### ❌ Mistake 3: Mixing inline and fork behaviour

**Wrong**:

```yaml
# .agents/skills/hybrid/SKILL.md
---
description: Provides knowledge and delegates tasks
context: inline
---
Use these standards... [knowledge content]

For complex cases, spawn the analyzer agent... [delegation content]
```

**Problem**: Inline skills can't spawn agents. Choose one mode.

**Right**: Split into two skills - inline skill for knowledge, fork skill for delegation (in separate directory).
