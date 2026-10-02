# Trunk-Based Development — PR Is the Default; Direct Push Is an Explicit Selection

**The repo-wide default delivery mode is `worktree-to-pr`.** Work happens on a short-lived plan
branch inside a disposable worktree, is pushed to a draft PR opened against `main`, and is driven
through exact-current-head/base PR CI and applicable surface gates to a fully green state before it
merges.

## Resolving the Delivery Mode

Apply three-tier precedence:

1. **Invocation argument** — the user or calling context named a mode explicitly
2. **Plan field** — the plan's `## Delivery Mode` section declares one
3. **Default** — `worktree-to-pr`

Never silently coerce an invalid non-empty value; treat it as a question for the user instead.

## What This Means for Plans

**Plan delivery checklists SHOULD include the PR steps** under the two `*-to-pr` modes — opening the
draft PR, verifying exact-head/base PR CI and applicable surface gates, and the merge step itself.
They include `pr-review` or `pr-review-quality-gate` only when the user explicitly requested it, at that PR
boundary. They must not contain a `[HUMAN]` "review the diff and approve push" gate: pushing to a PR
branch is not a merge, and the push is always `[AI]`.

## What This Means for AI Agents

**Default to a plan branch and a draft PR** (`gh pr create --draft --base main …`). Push to the PR
branch as `[AI]`. The merge is a separate step and is **`[AI]` by default** too, once the five
hardened preconditions hold; a `[HUMAN]` merge gate applies only where a plan's own step says so
explicitly, and that opt-in must be left intact rather than "corrected".

Selecting a direct-push mode is legitimate but deliberate — it belongs in the plan's declared
Delivery Mode, not inferred from context.

See [Git Push Default Convention](../../../../repo-governance/development/workflow/git-push-default.md)
and [PR Merge Protocol](../../../../repo-governance/development/workflow/pr-merge-protocol.md) for
complete rules and edge cases.
