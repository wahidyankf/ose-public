---
description: "Automate quality checks in git hooks, use criticality for prioritization, assess fixer confidence."
when_to_use: "Use when applying these three quality best practices."
---

# Best Practices 1-3

## Practice 1: Automate Quality Checks in Git Hooks

**Principle**: Use pre-commit and pre-push hooks to enforce quality automatically.

**Good Example:**

```sh
# .husky/pre-commit — a thin shim; repo-config.yml declares every gate it runs
exec ./hippo run --class transactional --resource-tier standard --disk-path . -- \
  ./rhino gate run --surface pre-commit
```

**Bad Example:**

```bash
# Manual quality checks (DO NOT DO THIS)
# Developer manually runs:
prettier --write .
eslint --fix .
# Often forgotten before commit!
```

**Rationale:**

- Consistent enforcement
- No forgotten checks
- Prevents bad code from entering repo
- Faster feedback loop

## Practice 2: Use Criticality Levels for Prioritization

**Principle**: Categorize findings by importance: CRITICAL/HIGH/MEDIUM/LOW.

**Good Example:**

```markdown
## CRITICAL Issues (2)

- Broken authentication endpoint (blocks users)
- SQL injection vulnerability (security risk)

## HIGH Issues (5)

- Missing alt text (accessibility)
- Incorrect dates (data quality)

## MEDIUM Issues (8)

- Style inconsistencies (minor quality)

## LOW Issues (12)

- Optional improvements (nice-to-have)
```

**Bad Example:**

```markdown
## Issues (27)

- Broken authentication endpoint
- Missing alt text
- Optional code cleanup
  (All treated equally - no prioritization!)
```

**Rationale:**

- Clear fix priorities
- Critical issues addressed first
- Efficient resource allocation
- Aligns with business impact

## Practice 3: Assess Fixer Confidence Before Applying

**Principle**: Use three-level confidence: HIGH/MEDIUM/FALSE_POSITIVE.

**Good Example:**

```bash
# Re-validate before fixing
if validate_finding "$finding"; then
  if is_high_confidence "$finding"; then
    apply_fix "$finding"  # AUTO-FIX
  elif is_medium_confidence "$finding"; then
    flag_for_review "$finding"  # MANUAL
  fi
else
  report_false_positive "$finding"  # SKIP
fi
```

**Bad Example:**

```bash
# Apply all fixes without assessment (DO NOT DO THIS)
for finding in $FINDINGS; do
  apply_fix "$finding"  # NO CONFIDENCE CHECK!
done
```

**Rationale:**

- Safe automated fixes
- Prevents incorrect changes
- Requires human judgment for uncertainty
- Systematic quality control
