---
description: How this convention is enforced — manual PR review, a future automated CI link check, and docs-checker agent validation.
when_to_use: Use when setting up or reviewing enforcement for AyoKoding link correctness (PR review checklist, CI script, or agent rules).
---

# Enforcement

## Manual Code Review

During pull request review, verify:

1. **Pattern recognition** - Flag any `https://ayokoding.com/` URLs in docs/
2. **Path correctness** - Verify relative paths match file location depth
3. **Link functionality** - Test that paths resolve to existing content

## Automated Validation (Future)

**Link validation in CI/CD:**

```bash
# Detect public AyoKoding URLs in docs/
grep -r "https://ayokoding.com" docs/ && exit 1

# Validate relative path targets exist
find docs/ -name "*.md" -exec markdown-link-check {} \;
```

## Agent Validation

The [docs-checker agent](../../../../.agents/agents/docs-checker.md) should validate:

- **CRITICAL:** docs/ files containing `https://ayokoding.com/` URLs
- **HIGH:** Relative paths with incorrect depth (path doesn't resolve)
- **MEDIUM:** Missing AyoKoding cross-references where expected
