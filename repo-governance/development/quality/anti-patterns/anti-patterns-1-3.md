---
description: "Manual quality checks, no issue prioritization, fixes without confidence assessment."
when_to_use: "Use when reviewing for these three quality anti-patterns."
---

# Anti-Patterns 1-3

## Anti-Pattern 1: Manual Quality Checks

**Problem**: Relying on developers to remember quality checks.

**Bad Example:**

```bash
# Developer's manual workflow (error-prone)
# 1. Write code
# 2. Manually run prettier (sometimes forgotten)
# 3. Manually run eslint (sometimes forgotten)
# 4. Commit (with inconsistent formatting!)
```

**Solution:**

```sh
# .husky/pre-commit - automated hook running every declared pre-commit gate
exec ./hippo run --class transactional --resource-tier standard --disk-path . -- \
  ./rhino gate run --surface pre-commit
```

**Rationale:**

- Manual checks are forgotten
- Inconsistent code quality
- Wastes code review time
- Automation is reliable

## Anti-Pattern 2: No Issue Prioritization

**Problem**: Treating all findings as equally important.

**Bad Example:**

```markdown
## All Issues (43)

1. Broken authentication (CRITICAL!)
2. Missing alt text
3. Extra whitespace
   ...
4. Optional code cleanup
   (No categorization - what to fix first?)
```

**Solution:**

```markdown
## CRITICAL Issues (1)

- Broken authentication endpoint

## HIGH Issues (8)

- Missing alt text on images

## MEDIUM Issues (15)

- Style inconsistencies

## LOW Issues (19)

- Optional improvements
```

**Rationale:**

- Critical issues need immediate attention
- Clear prioritization
- Efficient resource allocation
- Business impact visibility

## Anti-Pattern 3: Applying Fixes Without Confidence Assessment

**Problem**: Automated fixer applies all fixes without validation.

**Bad Example:**

```bash
# Blind fixes (DO NOT DO THIS)
for finding in $(cat audit.md); do
  apply_fix "$finding"  # No validation!
done
```

**Solution:**

```bash
# Re-validate and assess confidence
for finding in $FINDINGS; do
  if revalidate "$finding"; then
    confidence=$(assess_confidence "$finding")
    if [ "$confidence" = "HIGH" ]; then
      apply_fix "$finding"
    fi
  fi
done
```

**Rationale:**

- Prevents incorrect automated changes
- Validates finding still exists
- Requires human judgment for uncertainty
- Safe remediation
