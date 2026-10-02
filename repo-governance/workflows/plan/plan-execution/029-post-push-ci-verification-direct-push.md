---
description: Defines how execution monitors and resolves failures for GitHub Actions workflows triggered on a direct push to origin main.
when_to_use: Use when monitoring CI after a push under worktree-to-origin-main or main-to-origin-main.
---

# Post-Push CI Verification — Direct-Push Modes

**Continues** [Post-Push CI Verification — Overview and Monitoring Tool](./028-post-push-ci-verification-overview.md).

**Orchestrator action — `worktree-to-origin-main` / `main-to-origin-main` (direct push to `origin main`)**:

1. Identify which GitHub Actions workflows were triggered by the push
2. Find the run ID: `gh run list --workflow=<workflow-file> --limit=3`
3. Monitor to completion by scheduling a wakeup every 2 minutes, then making one `gh run view <run-id> --json conclusion,status,jobs` status read. Never use `gh run watch`, regardless of expected job duration.
4. If ANY workflow fails:
   - Pull failure logs and diagnose the root cause: `gh run view <run-id> --log-failed`
   - Fix locally (including preexisting CI failures — Iron Rule 3)
   - Run local quality gates again (Step 2b)
   - Push fix commit
   - Monitor CI again with the same 2-minute scheduled wakeup and single-status-read cadence
5. Repeat until ALL GitHub Actions workflows pass with zero failures
6. Do NOT proceed to the next delivery phase until CI is fully green
7. If rate-limited (HTTP 403 from `gh`): stop all `gh` calls immediately, use `ScheduleWakeup(delaySeconds=2100)` (35 min) to resume after the rolling window clears — do NOT spin in a retry loop
