---
description: Which delivery modes and PR types this protocol governs, which it does not, and which agents and automation it binds.
when_to_use: Use when determining whether a given PR, phase, or delivery mode is governed by this protocol.
---

# When This Applies and Scope

## When This Applies

This protocol applies whenever a pull request exists as part of the development workflow:

- **`worktree-to-pr` (repo-wide default)**: every plan delivered without an explicit mode override
  resolves to this mode -- a short-lived plan branch, a draft PR opened against `main`, and this
  protocol at merge time. See [the `worktree-to-pr` terminal step](./the-worktree-to-pr-terminal-step.md#the-worktree-to-pr-terminal-step)
  below for the full terminal-step sequence.
- **`main-to-pr`**: primary-checkout work still routed through a PR follows the same protocol.
- **External contributions**: PRs from external contributors follow this protocol.
- **Code review workflow**: Any short-lived branch created for review purposes follows this protocol.

This protocol does **not** apply to:

- Direct commits under `worktree-to-origin-main` or `main-to-origin-main` (no PR exists to merge).
- **A plan's Phase 0** (Environment Setup and Baseline) under any delivery mode -- it opens no PR, so there is nothing here to merge. The earliest phase that may open a PR, and therefore the earliest phase this protocol can govern, is **Phase 1**. See [Plans Organization Convention §Phase 0 Opens No PR](../../../conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule).
- **A plan's intermediate phases** — those inside a delivery unit but not its **delivery boundary**. They open no PR, so this protocol has nothing to govern until the unit's boundary phase opens one. See [Plans Organization Convention §PRs Open at Delivery Boundaries](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule).
- Environment branch deployments managed by CI (e.g., `prod-ayokoding-www`), which are governed by their own documented CI workflows.

## Scope

This rule applies to:

- All AI agents defined in `.agents/agents/` and routed through `.claude/agents/`, `.codex/agents/`, and `.opencode/agents/`.
- All automation scripts, npm scripts, and CI workflows that could trigger a PR merge.
- All pull requests targeting any branch in the repository.
