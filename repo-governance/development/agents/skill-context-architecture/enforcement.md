---
description: "Gives the code-review checklist and notes on future automated validation for Skill context architecture."
when_to_use: Use when reviewing a PR that adds or edits a Skill for context-architecture compliance.
---

# Enforcement

## Code Review Checklist

When reviewing PRs that add or modify skills in `.agents/skills/`:

1. Verify `context` field is omitted or set to `inline`
2. Confirm no `agent` field exists
3. Check skill description focuses on knowledge domain
4. Validate skill contains knowledge/guidance, not task delegation
5. Ensure skill references conventions rather than spawning agents

## Automated Validation (Future)

Potential automated checks:

```bash
# Check for fork context in .agents/skills/
grep -r "context: fork" .agents/skills/

# Check for agent field in .agents/skills/
grep -r "^agent:" .agents/skills/
```

Exit code 0 (no matches) = compliant, >0 = violations found.
