---
description: Five best practices for effective automation.
when_to_use: Use when designing a new automation.
---

# PASS: Best Practices

## 1. Automate at the Right Layer

**Git hooks** for pre-commit checks:

```bash
PASS: pre-commit: Format code, validate syntax
PASS: commit-msg: Validate commit message format
FAIL: CI/CD: Don't wait for CI to catch formatting (too slow)
```

**AI agents** for deep validation:

```bash
PASS: docs-checker: Validate conventions, detect contradictions
PASS: plan-checker: Verify plan completeness
FAIL: Git hooks: Don't run deep validation pre-commit (too slow)
```

## 2. Make Automation Fast

**Only process changed files**:

```yaml
# repo-config.yml — a gate whose files input is bound to the staged index
- id: format-staged
  inputs:
    staged:
      kind: files
  run-on:
    pre-commit:
      bind:
        staged:
          source: git-index
```

**Not** entire codebase:

```bash
FAIL: prettier --write "**/*.ts"  # Too slow for pre-commit
```

## 3. Provide Clear Error Messages

**Good error message**:

```
 Commit message format invalid
Expected: <type>(<scope>): <description>
Received: "added feature"

Valid types: feat, fix, docs, style, refactor, test, chore

Example: feat(api): add user authentication endpoint
```

**Bad error message**:

```
FAIL: Invalid format
```

## 4. Cache Expensive Operations

**Link verification with cache**:

```yaml
# docs/metadata/external-links-status.yaml
links:
  - url: https://example.com/api
    status: 200
    lastChecked: "2025-12-15T10:00:00+07:00"
    expiresAt: "2026-06-15T10:00:00+07:00"
```

**Not** checking every time:

```bash
FAIL: curl every link on every run  # Too slow, wasteful
```

## 5. Document What's Automated

**In AGENTS.md**:

```markdown
## Code Quality & Git Hooks

The project enforces code quality through automated git hooks:

### Pre-commit Hook

1. Rhino hands the staged paths to the `format-staged` gate
2. Prettier formats matching files
3. Formatted files automatically staged
4. Commit blocked if issues found
```
