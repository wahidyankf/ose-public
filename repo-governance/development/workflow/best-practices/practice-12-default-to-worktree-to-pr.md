---
description: The repo-wide default delivery mode is worktree-to-pr; direct-push modes have no executable path in ose-public, so they are never the assumed path.
when_to_use: Use when choosing a plan's delivery mode, to confirm worktree-to-pr is the default and the only available mode.
---

# Practice 12: Default to `worktree-to-pr`; Never Assume a Direct-Push Mode

**Principle**: the repo-wide default delivery mode is `worktree-to-pr` — a short-lived plan branch in a disposable worktree, pushed to a draft PR against `main`, driven green, then merged. Direct push has no executable path in `ose-public` (`main` is branch-protected, including for admins), so it is never the assumed path. See [Plans Organization Convention §Per-Repository Delivery Mode Restrictions (HARD RULE)](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule).

**Good Example:**

```bash
# Default: plan branch in a worktree, draft PR
git worktree add worktrees/my-plan -b my-plan
git commit -m "feat(auth): add email validation"
git push origin my-plan
gh pr create --draft --base main --title "feat(auth): add email validation"
# Review cycle + CI run; merge once the hardened preconditions hold
```

**Bad Example:**

```bash
# Pushing straight to main because no mode was considered at all (DO NOT DO THIS)
git commit -m "feat(auth): rewrite session handling"
git push origin main
# Skips review on a substantial change; direct push to main is unavailable here
```

**Rationale:**

- Short-lived branch via PR is a recognized TBD flavor — TBD forbids long-lived branches, not branches
- The PR is where the review cycle and the hardened merge preconditions attach; skipping it on a substantial change removes the only review buffer
- Direct push is unavailable here, so even a small, obviously-safe change goes through a PR
- The push itself is always `[AI]`; no "review the diff and approve push" gate belongs in a checklist, because pushing to a PR branch is not a merge

See [Git Push Default Convention](../git-push-default.md) for complete rules and the [PR Merge Protocol](../pr-merge-protocol.md) for the merge preconditions.
