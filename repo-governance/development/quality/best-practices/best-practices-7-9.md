---
description: "Combine criticality and confidence, enable staged-path gates, document validation rules."
when_to_use: "Use when applying these three quality best practices."
---

# Best Practices 7-9

## Practice 7: Combine Criticality and Confidence for Priority

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

## Practice 8: Enable Staged-Path Gates for Incremental Quality

**Principle**: Format and lint only staged files in pre-commit, through registry gates that take a
`files` input. For formatters that need a project root (Elixir's formatter, Spotless), route the
staged paths through a wrapper script rather than formatting the whole project.

**Good Example:**

```yaml
# repo-config.yml — the format-staged gate receives the staged paths only
- id: format-staged
  type: mutation
  inputs:
    staged:
      kind: files
  mutation:
    local: apply-index # write formatted bytes back to the index
    ci: verify-clean # on pull requests, fail if formatting would change a byte
  command:
    executable: ./scripts/format-staged
    args:
      - input: staged.paths
        expand: repeat
  run-on:
    pre-commit:
      bind:
        staged:
          source: git-index
```

```bash
# scripts/format-staged — one formatter per extension, over the handed paths only
case "$path" in
  *.md | *.ts | *.json) prettier_paths+=("$path") ;;
  *.rs) rust_paths+=("$path") ;;
  *.go) go_paths+=("$path") ;;
esac
```

**Bad Example:**

```bash
# Format entire repo on every commit (DO NOT DO THIS)
prettier --write .  # SLOW!

# Running cargo fmt from repo root without --manifest-path (DO NOT DO THIS)
# Formats entire workspace, not just staged files
cargo fmt
```

**Rationale:**

- Fast pre-commit hooks — only affects changed files
- Language-native formatters (gofmt, rustfmt) enforce language-specific style
- Gradual quality improvement; developer-friendly

## Practice 9: Document Validation Rules and Rationale

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
