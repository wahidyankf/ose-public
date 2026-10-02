---
description: Defines terminal cleanup and verifies each boundary used the resolved delivery mode's integration mechanism.
when_to_use: Use when deciding whether delivery artifacts are safe to remove or verifying a boundary reached its mode-specific integration target.
---

# Per-Phase Quality Gate — Cleanup and Boundary Assertion

**Continues** [Per-Phase Quality Gate — Phase 0 Exemption and Delivery-Boundary Merging](./026-per-phase-quality-gate-phase0-and-boundary-merging.md).

**The resolved work location is the repo-granular terminal cleanup unit**: in a worktree mode, one
worktree is shared across the repository's delivery units, so never remove it after an intermediate
integration; a main mode provisions no worktree. After the repository's
last delivery is confirmed, first require replacement exact-head proof where applicable, record a
passing workflow-owned terminal audit in `{final-report}`, assign `pass`, and complete every safety
check. Then remove eligible worktree, branch, and plan-local build-output classes in the same
session. A terminal-audit gap retains the worktree and reopens execution. On a multi-repository
plan, each repository reaches this terminal gate independently; it need not wait for a sibling still
in flight. See [Worktree and Artifact Cleanup](../../../development/workflow/worktree-and-artifact-cleanup.md).

1. **Assert the mode-specific boundary invariant immediately after this phase's push.** If the phase
   is a delivery boundary, then under `*-to-pr` confirm a PR exists for that unit
   (`gh pr list --head <branch>`). A direct branch push under a PR mode is a **plan violation**: stop
   and open the missing PR, or escalate if the unit has advanced too far. Under a permitted direct
   mode, instead confirm the declared checkpoint reached `origin/main` and the row's deployable-state
   proof holds. Catch either missing integration before downstream work builds on it.

**Output**: All quality gates passing, changes pushed

**On failure**: Fix failures and retry. Do NOT proceed to next phase with failures.
