---
description: The principles and companion conventions the Git Push Default Convention implements and respects.
when_to_use: Use when tracing why the worktree-to-pr default and its precedence rules exist back to the principles and conventions they respect.
---

# Principles and Conventions Implemented

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: A single,
  deterministic three-tier precedence (invocation argument > plan field > default) resolves the active
  delivery mode in every context. There is exactly one default (`worktree-to-pr`) and exactly one way
  to override it — no ambiguity about which push target applies.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: The
  default must be stated, not assumed. `worktree-to-pr` is the stated repo-wide default; the
  direct-push modes (`worktree-to-origin-main`, `main-to-origin-main`) are unavailable in
  `ose-public` and never inferred from execution context, change size, or past sessions.

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**: Before
  pushing directly to `origin main`, an agent must confirm a direct-push mode was actually selected
  (invocation argument or plan field). Pushing directly on the assumption that "no PR was mentioned" is
  a failure of deliberate problem-solving — the default is a PR branch, not direct push.

- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: When preexisting
  plan documents still assume the old direct-push-only posture, fixing them immediately is the
  root-cause-oriented choice. Deferring known mismatches accumulates governance debt.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Trunk Based Development Convention](../trunk-based-development.md)**: TBD establishes `main` as the
  trunk and recognizes short-lived-branch-via-PR as a valid TBD flavor alongside direct commit. This
  convention makes the push mechanics of each delivery mode explicit for AI agents.

- **[Plans Organization Convention](../../../conventions/structure/plans.md)**: Plan documents declare
  their delivery mode via an optional `## Delivery Mode` field; absent that field (and absent an
  overriding invocation argument), `worktree-to-pr` applies. This convention governs how agents read
  and execute delivery checklists under each mode.

- **[Proactive Preexisting Error Resolution](../../practice/proactive-preexisting-error-resolution.md)**:
  When a preexisting violation of this convention surfaces during work — such as a delivery checklist
  still tagging the merge step `[AI]` under a `*-to-pr` mode, or a checklist assuming direct push
  without declaring a mode — fix it immediately. This convention operationalizes that practice for
  git-push violations.
