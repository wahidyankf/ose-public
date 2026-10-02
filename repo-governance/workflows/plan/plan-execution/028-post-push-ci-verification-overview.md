---
description: Defines when Post-Push CI Verification applies and the required ScheduleWakeup-based monitoring tool and cadence.
when_to_use: Use when deciding which monitoring tool and poll cadence to use for CI after a push.
---

# Post-Push CI Verification — Overview and Monitoring Tool

At every delivery boundary, after the mode-specific integration push, verify every GitHub Actions
workflow triggered on the resolved delivery mode's target — `origin main` for the direct-push modes
(`worktree-to-origin-main`, `main-to-origin-main`), the PR branch for the `*-to-pr` modes
(`worktree-to-pr`, `main-to-pr`).

**Phase 0 never reaches this step**: it pushes nothing (Step 2b), so it triggers no CI run and there is nothing to verify. Skip straight from the Phase 0 gate to Phase 1.

**An intermediate phase never reaches this step.** It integrates under neither mode family: a
direct mode has not performed its natural-unit checkpoint, and a `*-to-pr` mode has opened no PR.
Proceed to the next phase after its local gate is green. The verification below binds only at
delivery boundaries.

**Monitoring tool**: Schedule a wakeup, then make one `gh run view` (direct-push modes) or `gh pr checks` (`*-to-pr` modes) call every 2 minutes. Never use `gh run watch` or shorter polling, regardless of expected duration. See [CI Monitoring Convention](../../../development/workflow/ci-monitoring.md) for the canonical cadence, trigger discipline, and rate-limit recovery.
