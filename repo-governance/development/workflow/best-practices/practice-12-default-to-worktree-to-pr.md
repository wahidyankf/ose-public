---
description: The repo-wide default delivery mode is worktree-to-pr; direct-push modes are a deliberate, explicit selection, not the assumed path.
when_to_use: Use when choosing a plan's delivery mode, to confirm worktree-to-pr is the default and a direct-push mode requires deliberate declaration.
---

# Practice 12: Default to `worktree-to-pr`; Select a Direct-Push Mode Deliberately

**Principle**: the repo-wide default delivery mode is `worktree-to-pr` — a short-lived plan branch in a disposable worktree, pushed to a draft PR against `main`, driven green, then merged. Direct push has no executable path in `ose-public` (`main` is branch-protected, including for admins). The private sibling also prohibits `worktree-to-origin-main`; only explicitly declared `main-to-origin-main` survives for named stateful IaC or CI-IaC self-validation-circularity work — never as the assumed path. See [Plans Organization Convention §Per-Repository Delivery Mode Restrictions (HARD RULE)](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule).

**Good Example:**

```bash
# Default: plan branch in a worktree, draft PR
git worktree add worktrees/my-plan -b my-plan
git commit -m "feat(auth): add email validation"
git push origin my-plan
gh pr create --draft --base main --title "feat(auth): add email validation"
# Review cycle + CI run; merge once the hardened preconditions hold
```

**Also correct — deliberately declared `main-to-origin-main` for a named private-sibling stateful IaC
or CI-IaC exception** (the one repository where this mode has an executable path):

```bash
# <private-sibling> plan declares `## Delivery Mode: main-to-origin-main` for a one-line Terraform var fix
git commit -m "fix(infra): correct a Terraform variable default"
git push origin main
```

**Bad Example:**

```bash
# Pushing straight to main because no mode was considered at all (DO NOT DO THIS)
git commit -m "feat(auth): rewrite session handling"
git push origin main
# Skips review on a substantial change; the mode was never declared
```

**Rationale:**

- Short-lived branch via PR is a recognized TBD flavor — TBD forbids long-lived branches, not branches
- The PR is where the review cycle and the hardened merge preconditions attach; skipping it on a substantial change removes the only review buffer
- Direct push stays valuable for small, obviously-safe changes — declare the mode so the trade is visible
- The push itself is always `[AI]`; no "review the diff and approve push" gate belongs in a checklist, because pushing to a PR branch is not a merge

See [Git Push Default Convention](../git-push-default.md) for complete rules and the [PR Merge Protocol](../pr-merge-protocol.md) for the merge preconditions.
