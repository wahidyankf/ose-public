---
description: "Ignoring criticality in fixes, no CI quality gates, undocumented validation rules."
when_to_use: "Use when reviewing for these three quality anti-patterns."
---

# Anti-Patterns 7-9

## Anti-Pattern 7: Ignoring Criticality in Fix Execution

**Problem**: Fixing issues in random order instead of priority.

**Bad Example:**

```bash
# Random fix order (DO NOT DO THIS)
for file in $(ls); do
  fix_issues "$file"  # Low priority might be fixed before critical!
done
```

**Solution:**

```bash
# Priority-based execution
fix_p0_blockers()      # CRITICAL + HIGH confidence
fix_p1_urgent()        # HIGH + HIGH confidence
fix_p2_normal()        # MEDIUM + HIGH confidence
# P3-P4 are suggestions only
```

**Rationale:**

- Blockers fixed first
- Efficient resource use
- Clear escalation
- Business impact aligned

## Anti-Pattern 8: No Quality Gates in CI

**Problem**: CI passes even with quality violations, or uses non-standard target names that bypass workspace-level automation.

**Bad Example:**

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: npm run lint || true # Always passes!

- name: Test
  run: npm test || echo "Tests failed, but continuing..."
```

**Solution:**

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: nx affected -t lint

- name: Quick Tests (required status check before PR merge)
  run: nx affected -t test:quick
```

**Rationale:**

- Quality gate enforcement
- `test:quick` is the required GitHub Actions status check before PR merge
- Prevents bad code merging
- Team accountability
- Maintains codebase health

**See**: [Nx Target Standards](../../infra/nx-targets.md) for the full execution model and CI integration rules.

## Anti-Pattern 9: Undocumented Validation Rules

**Problem**: Validation rules exist without explanation.

**Bad Example:**

```bash
# Validator
if ! validate_rule_x "$file"; then
  echo "Validation failed"  # Why? What's rule X?
fi
```

**Solution:**

```markdown
## Validation: Rule X - Alt Text Required

**Rule**: All images must have descriptive alt text.

**Rationale**:

- WCAG AA compliance
- Screen reader accessibility
- SEO benefits

**Example**: `<img src="photo.jpg" alt="Description" />`
```

**Rationale:**

- Clear purpose and context
- Easier to maintain
- Educational for team
- Enables informed decisions
