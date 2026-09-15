---
description: Why every worktree-to-pr branch opens as a draft, and the two direct-push modes' scope, restrictions, and delivery-checklist tagging rule.
when_to_use: Use when deciding whether a PR should open as draft, or when checking whether a direct-push mode is permitted for a given repository.
---

# Why Draft, Not Ready-for-Review, on Open

Opening every `worktree-to-pr` branch as a draft is deliberate:

- **Signals in-progress status** to humans and CI -- the branch is not yet soliciting review.
- **Prevents accidental auto-merge paths** that some "ready" PRs can trigger.
- **Preserves the explicit human moment** when the AI flips the PR to ready after meeting the
  done-definition, which is the natural place for the [PR Merge Protocol](../pr-merge-protocol.md)
  approval prompt to fire.

## Direct-Push Modes Remain Available Where the Topology Supports Them

Two modes commit and push directly to `origin main`, with `[AI]` performing the push itself -- no
branch, no PR, no review gate:

- **`worktree-to-origin-main`** -- work happens in a disposable worktree, but pushes land directly on
  `origin main`.
- **`main-to-origin-main`** -- work happens in the primary checkout (no worktree), pushing directly to
  `origin main`.

`main` is branch-protected against direct pushes for every actor, including admins, in `ose-public`
-- a `pull_request` ruleset rule is active with `bypass_actors: []` and
`current_user_can_bypass: "never"`. **Neither direct-push mode has an executable path there,
regardless of topology or worktree usage.** In
the private sibling, `worktree-to-origin-main` is also unavailable. Only explicitly declared
`main-to-origin-main` remains, and only for stateful IaC needing the primary checkout's real
secrets/local state or CI-IaC changing the repository's own pipeline, runner, or toolchain
provisioning where PR self-validation is circular. In either eligible category, the change must also
be small, well-understood, and safe to integrate immediately. See the
[Git Push Default Convention](../git-push-default.md) for the full push mechanics of the surviving mode,
including the linear-history and rebase requirements, and
[Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule)
for the full per-repository rule.

**A fourth mode, `main-to-pr`,** uses the primary checkout (no worktree) but still routes through a PR
-- useful when isolation via worktree is unnecessary but review is still wanted.

**Plan delivery checklist tagging**: the git-mechanical lifecycle steps -- create worktree, commit,
push (to the PR branch or to `origin main`, depending on mode), open/flip the PR, and remove worktree
-- MUST be tagged `[AI]`, never `[HUMAN]`, in plan delivery checklists. Under `*-to-pr` modes the
merge itself is `[AI]` by default too; a `[HUMAN]` merge gate applies only where a plan's own step
says so explicitly. See
[Plans Organization Convention §Executor Tagging](../../../conventions/structure/plans/executor-tagging-tags-and-bias.md#executor-tagging--ai-vs-human-hard-rule)
and the [Git Push Default Convention §Examples — Plan-Maker Delivery-Mode Tagging](../git-push-default/examples-plan-maker-delivery-mode-tagging.md) for the FAIL/PASS
examples.
