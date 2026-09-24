# Trunk-Based Development — Commit Patterns

## Small, Frequent Commits

After the user explicitly authorizes a named change set, compose the **fewest** commits that are
each build-valid, independently reviewable, and independently revertible. There is no commits-per-day
or line-count quota.

**Rationale**: Small commits are:

- Easier to review
- Easier to revert
- Easier to understand in git history
- Lower risk of conflicts

Keep required implementation, tests, documentation, specifications, references, migrations and
rollback, and generated mirrors in the commit containing the purpose they complete.

**Example workflow** (one authorized change set containing two independent purposes):

```bash
# Commit 1: Complete user-profile purpose, including its completion artifacts
git add src/models/user.ts src/models/user.test.ts docs/user-profile.md
git commit -m "feat(user): add user profile model"
git push origin <plan-branch>

# Commit 2: Independent date-format repair
git add src/utils/date.ts src/utils/date.test.ts
git commit -m "fix(date): handle daylight-saving transition"
git push origin <plan-branch>
```

**NOT**:

```bash
# Bad: unrelated purposes bundled only to reduce commit count
git add src/*
git commit -m "feat: add user profile and fix date formatting"
git push origin <plan-branch>
```

## Atomic Commits

**Definition**: Each commit is a complete, working unit

**Rules**:

- ✅ Commit compiles and passes tests
- ✅ Commit contains one coherent purpose and every required completion artifact
- ✅ Commit message describes change clearly
- ❌ Commit breaks build (fails tests)
- ❌ Commit mixes unrelated changes
- ❌ Commit splits by file type, directory, or Conventional Commit type alone
- ❌ Commit message is vague

## Conventional Commits

This repository uses Conventional Commits format, checked by review (no hook or CI step enforces it):

```
<type>(<scope>): <description>

type: feat | fix | docs | style | refactor | test | chore
scope: component/module being changed
description: brief summary of change
```

**Examples**:

```bash
feat(auth): add JWT token validation
fix(api): handle null response from external service
docs(readme): update installation instructions
refactor(utils): simplify date formatting logic
test(user): add integration tests for user service
```
