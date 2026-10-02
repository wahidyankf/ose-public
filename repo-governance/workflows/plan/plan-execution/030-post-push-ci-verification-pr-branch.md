---
description: Defines how execution monitors and resolves failures for GitHub Actions checks on a plan's PR branch.
when_to_use: Use when monitoring CI after a push under worktree-to-pr or main-to-pr.
---

# Post-Push CI Verification — PR-Branch Modes

**Continues** [Post-Push CI Verification — Direct-Push Modes](./029-post-push-ci-verification-direct-push.md).

**Orchestrator action — `worktree-to-pr` / `main-to-pr` (PR branch)**:

1. Identify the PR: `gh pr view <PR> --json number,url,headRefName` (the PR opened in Step 2b for this plan's branch)
2. Check status: `gh pr checks <PR>` — lists every required check and its conclusion for the PR's current head commit
3. Monitor to completion by scheduling a wakeup every 2 minutes, then making one `gh pr checks <PR>` status read. Never short-poll or tight-loop, regardless of expected job duration.
4. If ANY check fails:
   - Pull failure logs for the failing run (`gh run view <run-id> --log-failed`, with `<run-id>` found via the failing check's linked run in `gh pr checks <PR>` output)
   - Fix locally (including preexisting CI failures — Iron Rule 3)
   - Run local quality gates again (Step 2b)
   - Push the fix commit to the **PR branch** (never to `main`)
   - Monitor again with `ScheduleWakeup` + a single `gh pr checks <PR>` call
5. Repeat until ALL checks on the PR pass with zero failures
6. Do NOT proceed to the next delivery phase until the PR's CI is fully green
7. If rate-limited (HTTP 403 from `gh`): identical recovery to the direct-push path — `ScheduleWakeup(delaySeconds=2100)` (35 min), no retry loop

**Output**: All CI checks passing on the resolved target (`origin main` or the PR)

**On failure**: Keep fixing and pushing until CI is green. If stuck after 3 attempts on the same failure, escalate to user.
