---
description: "Deleting content without preservation, running all tests pre-push, ad-hoc validation logic."
when_to_use: "Use when reviewing for these three quality anti-patterns."
---

# Anti-Patterns 4-6

## Anti-Pattern 4: Deleting Content Without Preservation

**Problem**: Removing files during refactoring without saving knowledge.

**Bad Example:**

```bash
# Delete old docs (DO NOT DO THIS)
rm old-architecture.md
rm legacy-api-docs.md
rm deprecated-guide.md
# Knowledge lost forever!
```

**Solution:**

```markdown
## Refactoring Process

1. Read all old docs thoroughly
2. Extract unique knowledge
3. Migrate to new structure
4. Archive originals (not delete)
5. Verify no knowledge lost
```

**Rationale:**

- Documentation is valuable
- Knowledge preserved
- Can reference later
- Respects Documentation First principle

## Anti-Pattern 5: Running All Tests in Pre-Push

**Problem**: Pre-push hook runs the entire test suite or uses non-standard target names (slow, and breaks workspace-level automation).

**Note**: `test:integration` and `test:e2e` must never be included in `test:quick`. See [Behaviour-Driven Development](../../behaviour-driven-development.md) for which test level runs where.

**Bad Example:**

```bash
# .husky/pre-push
nx test  # Runs ALL tests (5+ minutes!) with non-standard target name
# Developers skip hook due to slowness
```

**Solution:**

```bash
# .husky/pre-push
nx affected -t test:quick
# Only affected projects, fast quality gate target (seconds to a few minutes)
```

**Rationale:**

- Fast feedback encourages usage
- Runs only relevant projects (Nx affected detection)
- `test:quick` is the canonical pre-push gate — every project must expose it
- Prevents hook bypass
- Maintains quality gate

**See**: [Nx Target Standards](../../infra/nx-targets.md) for `test:quick` composition rules per project type.

## Anti-Pattern 6: Ad-Hoc Validation Logic

**Problem**: Each validator implements different patterns.

**Bad Example:**

```bash
# Validator 1
grep -E "pattern" file

# Validator 2
awk '{print $1}' file | some_command

# Validator 3
python custom_script.py file

# No consistency, hard to maintain
```

**Solution:**

```bash
# Standardized validation pattern
validate_field() {
  local file=$1
  local field=$2
  # Standard extraction and validation
  # Consistent error reporting
  # Reusable across validators
}
```

**Rationale:**

- Consistent validation patterns
- Easier to maintain
- Reduces duplication
- Clear methodology
