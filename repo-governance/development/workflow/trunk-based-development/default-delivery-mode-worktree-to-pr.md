---
description: The default mode's work location, integration target, merge authority, and quality gates.
when_to_use: Use as the canonical reference for what worktree-to-pr requires at each step.
---

# Default Delivery Mode: `worktree-to-pr`

**The repo-wide default for all development -- including when running from a git worktree -- is
`worktree-to-pr`: a short-lived, single-purpose plan branch inside a disposable git worktree, pushed
to a draft PR opened against `main`, driven through exact-current-head/base CI and applicable
surface gates to a fully green state, then merged
once the hardened preconditions hold -- `[AI]` by default, `[HUMAN]` only where a plan says so.**

- **Work location**: `worktrees/<plan-identifier>/`, on a plan-scoped branch.
- **Integration target**: a PR opened against `main` (opened as a GitHub **draft**; see Why Draft below).
- **Merge authority**: `[AI]` by default -- the AI drives the branch, the push, and the quality
  gates, then merges once the hardened preconditions hold. A `[HUMAN]` merge gate applies
  **only where a plan's own step says so explicitly**; the preconditions are identical either way and
  only the actor differs. This mirrors the [PR Merge Protocol](../pr-merge-protocol.md) done-boundary:
  the merge sits outside it, so "done" is still not the same as "merged".
- The registry-defined pre-push hook screens every push to the PR branch, and the PR itself runs the
  quality gates via CI. Affected `test:quick` owns Unit runtime plus every applicable static
  `test:coverage:*` validator in the PR workflow's language jobs.
- Semantic review is absent by default. Run
  [`pr-review`](../../../workflows/quality/pr-review.md) or
  [`pr-review-quality-gate`](../../../workflows/quality/pr-review-quality-gate.md) only on explicit user request.

This applies to all routine development: features, bug fixes, refactors, documentation, governance
changes, and work executed inside a git worktree -- the default is the same regardless of context.

**Inside a plan, this sequence starts at Phase 1, never Phase 0.** A plan's Phase 0 is Environment
Setup and Baseline -- dependency install, toolchain convergence, a recorded baseline, preexisting-failure
resolution. It produces no reviewable change, so it pushes no branch and opens no PR under **any** of
the four delivery modes; under this default mode, its evidence artifacts ride the Phase 1 PR. See
[Plans Organization Convention §Phase 0 Opens No PR](../../../conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule).

```bash
# Default workflow -- worktree-to-pr (applies in worktrees, which is now the norm)
git worktree add worktrees/<plan-id> -b <plan-id>
cd worktrees/<plan-id>
# ... make changes ...
git add .
git commit -m "feat(auth): add email validation"
git push origin <plan-id>

# Open as a draft -- not yet soliciting review
gh pr create --draft --base main --title "feat(auth): add email validation"

# Iterate: push follow-up commits; keep exact-head PR CI and applicable surface gates green

# When the done-definition is met (see PR Merge Protocol), flip to ready:
gh pr ready
# Merge once the hardened preconditions hold -- [AI] by default,
# [HUMAN] only where the plan says so. The merge is outside the done-boundary either way.
```
