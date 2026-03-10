# Best Practices for Quality Development

> **Companion Document**: For common mistakes to avoid, see [Anti-Patterns](./anti-patterns.md)

## Overview

This document outlines best practices for maintaining code quality, validation methodologies, and content preservation. Following these practices ensures high-quality, consistent, and well-validated codebases.

## Purpose

Provide actionable guidance for:

- Automated quality enforcement
- Repository validation
- Criticality and confidence assessment
- Content preservation during refactoring
- Quality gate implementation

## Best Practices

### Practice 1: Automate Quality Checks in Git Hooks

**Principle**: Use pre-commit and pre-push hooks to enforce quality automatically.

**Good Example:**

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"],
    "*.md": ["prettier --write", "markdownlint-cli2 --fix"]
  }
}
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

### Practice 2: Use Criticality Levels for Prioritization

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

### Practice 3: Assess Fixer Confidence Before Applying

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

### Practice 4: Preserve Content During Refactoring

**Principle**: When condensing or restructuring files, preserve all knowledge.

**Good Example:**

```markdown
## Process

1. Read all source files thoroughly
2. Identify unique knowledge in each
3. Create target structure
4. Migrate content systematically
5. Cross-reference and verify nothing lost
6. Archive originals for safety
```

**Bad Example:**

```bash
# Delete files without preserving content (DO NOT DO THIS)
rm old-doc-1.md old-doc-2.md old-doc-3.md
# Knowledge lost forever!
```

**Rationale:**

- No knowledge loss
- Maintains documentation value
- Enables future reference
- Respects Documentation First principle

### Practice 5: Run Affected Tests Only in Pre-Push Using Canonical Target Names

**Principle**: Use `test:quick` via Nx affected detection for fast, consistent feedback.

**Good Example:**

```bash
# .husky/pre-push
nx affected -t test:quick
# Only affected projects, using the canonical fast quality gate target
```

**Bad Example:**

```bash
# .husky/pre-push
nx test  # Non-standard target name; runs ALL tests (slow!)
```

**Rationale:**

- Fast feedback (seconds to a few minutes)
- `test:quick` is the canonical pre-push gate — every project must expose it
- Using `nx affected -t` ensures consistent behaviour across all project types
- Reduces friction for developers
- Maintains quality gate

**See**: [Nx Target Standards](../infra/nx-targets.md) for `test:quick` composition rules per project type.

### Practice 6: Use Standardized Validation Patterns

**Principle**: Follow repository validation methodology for consistency.

**Good Example:**

```bash
# Standardized validation pattern
validate_frontmatter() {
  local file=$1
  # Check required fields
  # Validate date format
  # Verify allowed values
  # Report findings with line numbers
}
```

**Bad Example:**

```bash
# Ad-hoc validation (DO NOT DO THIS)
validate() {
  grep something $file  # Unclear what's checked
}
```

**Rationale:**

- Consistent validation across agents
- Clear, documented patterns
- Easier to maintain and extend
- Reduces duplication

### Practice 7: Combine Criticality and Confidence for Priority

**Principle**: Use priority matrix (P0-P4) for fix execution order.

**Good Example:**

```bash
# P0 (Blocker): CRITICAL + HIGH confidence
# Fix immediately, block if fails

# P1 (Urgent): HIGH + HIGH OR CRITICAL + MEDIUM
# Fix with high priority

# P2 (Normal): MEDIUM + HIGH OR HIGH + MEDIUM
# Fix when approved

# P3-P4 (Low): All LOW combinations
# Suggestions only
```

**Bad Example:**

```bash
# Random fix order (DO NOT DO THIS)
for finding in $FINDINGS; do
  apply_fix "$finding"  # No priority!
done
```

**Rationale:**

- Blockers fixed first
- Efficient resource use
- Clear escalation path
- Business impact aligned

### Practice 8: Enable Lint-Staged for Incremental Quality

**Principle**: Format and lint only staged files in pre-commit. For languages that require project
context (e.g. Go, Elixir), use dedicated hook steps rather than lint-staged.

**Good Example:**

```json
// package.json — lint-staged for JS/TS/JSON/YAML/CSS/MD
{
  "lint-staged": {
    "*.md": ["prettier --write", "markdownlint-cli2 --fix"]
  }
}
```

```sh
# .husky/pre-commit — dedicated step for language-native formatters

# gofmt: no project context required, safe in lint-staged or hook
gofmt -w staged_go_files

# mix format: MUST run from project root (import_deps in .formatter.exs)
# Groups staged .ex/.exs files by Mix project root and runs mix format per root
for project_dir in $project_roots; do
  (cd "$project_dir" && mix format $project_files)
done
```

**Bad Example:**

```bash
# Format entire repo on every commit (DO NOT DO THIS)
prettier --write .  # SLOW!

# Running mix format from repo root (DO NOT DO THIS)
# Silently applies wrong formatting — import_deps rules are missing
mix format apps/organiclever-be-exph/lib/my_module.ex
```

**Rationale:**

- Fast pre-commit hooks — only affects changed files
- Language-native formatters (gofmt, mix format) enforce language-specific style
- `mix format` requires project root for `import_deps` (Phoenix/Ecto macros); running from repo
  root silently strips required parentheses for route/schema macros
- Gradual quality improvement; developer-friendly

### Practice 9: Document Validation Rules and Rationale

**Principle**: Explain WHY each validation exists, not just WHAT it checks.

**Good Example:**

```markdown
## Validation: Alt Text Required

**Rule**: All images must have descriptive alt text.

**Rationale**:

- Screen readers need text descriptions
- WCAG AA compliance requirement
- Improves SEO
- Benefits users on slow connections

**Example**: `<img src="photo.jpg" alt="Team photo at conference" />`
```

**Bad Example:**

```markdown
## Validation: Alt text

Check alt text.
```

**Rationale:**

- Clear purpose and context
- Easier to maintain rules
- Enables informed decisions
- Educational for team

### Practice 10: Fail Build on Quality Violations in CI

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

**See**: [Nx Target Standards](../infra/nx-targets.md) for the full execution model and CI integration rules.

## Related Documentation

- [Code Quality Convention](./code.md) - Automated quality tools and git hooks
- [Criticality Levels Convention](./criticality-levels.md) - Issue categorization
- [Fixer Confidence Levels Convention](./fixer-confidence-levels.md) - Confidence assessment
- [Repository Validation Methodology](./repository-validation.md) - Validation patterns
- [Nx Target Standards](../infra/nx-targets.md) - Canonical target names and CI execution model
- [Anti-Patterns](./anti-patterns.md) - Common mistakes to avoid

## Summary

Following these best practices ensures:

1. Automate quality checks in git hooks
2. Use criticality levels for prioritization
3. Assess fixer confidence before applying
4. Preserve content during refactoring
5. Run affected tests only in pre-push
6. Use standardized validation patterns
7. Combine criticality and confidence for priority
8. Enable lint-staged for incremental quality
9. Document validation rules and rationale
10. Fail build on quality violations in CI

Quality development following these practices is automated, systematic, and maintainable.

## Principles Implemented/Respected

- **Automation Over Manual**: Git hooks, automated validation, CI enforcement
- **Documentation First**: Preserve content, document validation rules
- **Explicit Over Implicit**: Clear criticality levels, confidence assessment
- **Simplicity Over Complexity**: Incremental quality, affected tests only

## Conventions Implemented/Respected

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Active voice, clear documentation of quality practices
- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Quality documents and reports follow standardized naming
- **[Dynamic Collection References Convention](../../conventions/writing/dynamic-collection-references.md)**: Avoid hardcoded counts in quality reports
