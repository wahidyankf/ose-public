---
description: "Fail the build on quality violations in CI."
when_to_use: "Use when wiring a quality gate to fail CI on violation."
---

# Best Practices 10

## Practice 10: Fail Build on Quality Violations in CI

**Principle**: Pre-push hooks block local push, CI blocks merge. Use canonical target names for consistency.

**Good Example:**

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: nx affected -t lint

- name: Quick Tests (required status check before PR merge)
  run: nx affected -t test:quick
```

**Bad Example:**

```yaml
# CI that ignores quality (DO NOT DO THIS)
- name: Lint
  run: npm run lint || true # Always passes!
```

**Rationale:**

- Quality gate enforcement using canonical `test:quick` target
- `test:quick` is the required GitHub Actions status check before PR merge
- No bad code in main branch
- Team accountability
- Maintains codebase health

**See**: [Nx Target Standards](../../infra/nx-targets.md) for the full execution model and CI integration rules.
