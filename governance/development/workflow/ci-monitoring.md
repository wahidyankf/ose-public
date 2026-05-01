---
title: "CI Monitoring Convention"
description: Standards for monitoring GitHub Actions CI runs without exhausting the GitHub API rate limit — required tooling, poll intervals, trigger discipline, and recovery procedures
category: explanation
subcategory: development
tags:
  - ci
  - github-actions
  - rate-limiting
  - monitoring
  - workflow
created: 2026-05-01
---

# CI Monitoring Convention

Monitoring CI runs is a required step after every push to `origin main`. How you monitor matters as much as whether you monitor. Polling `gh run view` in a tight loop without delay can exhaust the GitHub API rate limit (5,000 requests/hour) within minutes, blocking all subsequent `gh` commands for up to an hour. This convention defines the correct tools, minimum intervals, trigger discipline, and recovery procedures to ensure CI monitoring never burns API quota unnecessarily.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: The correct tool for watching a CI run to completion is `gh run watch` — a streaming command that handles the polling loop internally at a safe cadence. Using the right automation replaces manual tight-loop polling with a single declarative command.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: One `gh run watch <id>` call is simpler than a while-loop, a sleep, a JSON parser, and retry logic. Reaching for the built-in streaming command removes code that must be written, debugged, and maintained.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Rate limit budget is a finite, shared resource. This convention makes its constraints explicit — quota size, window duration, recovery delay — so agents and developers can reason about impact before issuing commands rather than discovering exhaustion after the fact.

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: A plan execution that burns the API rate limit mid-run is non-reproducible: repeating the same sequence on the same codebase produces a different outcome depending on how many prior API calls were made. Safe monitoring practices make CI verification a reliable, repeatable step.

## Conventions Implemented/Respected

This convention implements/respects the following development practices:

- **[CI Post-Push Verification Convention](./ci-post-push-verification.md)**: That convention mandates triggering and monitoring CI after every push. This convention specifies HOW to perform that monitoring safely — `gh run watch` as the required tool, minimum intervals if manual polling is used, and recovery procedures when rate-limited.

- **[CI Blocker Resolution Convention](../quality/ci-blocker-resolution.md)**: When a rate limit prevents CI verification, it is a blocker. This convention provides the correct recovery path (scheduled wakeup, not retry loop) rather than treating a 403 as a transient error and spinning.

## Purpose

This convention exists to prevent GitHub API rate limit exhaustion during CI monitoring in plan execution and manual development workflows. The rate limit is a shared resource across all authenticated `gh` commands in the same hour window. Burning it on tight-poll loops blocks the entire toolchain — not just CI monitoring — for up to an hour.

The target audience is any agent or developer performing the post-push CI verification step described in the [CI Post-Push Verification Convention](./ci-post-push-verification.md).

## Scope

### What This Convention Covers

- Correct tool selection for watching CI runs to completion
- Minimum poll intervals when manual polling is unavoidable
- Trigger discipline to avoid redundant concurrent runs
- Rate limit budget facts and window behavior
- Recovery procedure when rate-limited (HTTP 403 from `gh`)
- Application of these rules in plan execution (Step 2c of `plan-execution.md`)

### What This Convention Does NOT Cover

- Which workflows to trigger after a push (see [CI Post-Push Verification Convention](./ci-post-push-verification.md))
- How to investigate and fix a failed CI run (see [CI Blocker Resolution Convention](../quality/ci-blocker-resolution.md))
- GitHub Actions workflow authoring standards (see [CI/CD Conventions](../infra/ci-conventions.md))

## Standards

### Rate Limit Budget Facts

Understanding the budget prevents accidental exhaustion.

| Parameter            | Value                                                 |
| -------------------- | ----------------------------------------------------- |
| Quota                | 5,000 requests/hour per authenticated user            |
| Reset window         | Rolling 1 hour from the first request                 |
| When exhausted       | HTTP 403 on all subsequent `gh` commands              |
| Reset timing         | Top of the next hour from first call                  |
| Single `gh run view` | 1 request per invocation                              |
| `gh run watch`       | Polls internally every ~3s; safe only for runs <5 min |

A tight loop with no sleep issues hundreds of requests per minute. At 200 calls/minute, the 5,000-request quota exhausts in 25 minutes. **`gh run watch` on a 30-minute CI run also exhausts the quota** — it polls ~3 times/minute for 30 minutes = ~90 calls just for watching. Combined with triggers and other list calls this crosses 5,000 quickly. Any `gh` command — list, trigger, view — then returns HTTP 403 until the window resets.

### Preferred Monitoring Approaches (Priority Order)

Use the first approach that fits the situation. Only fall back to lower-priority approaches when the higher-priority one is not applicable.

#### 1. `ScheduleWakeup` Every 3-5 Minutes (Required Default)

Trigger the run, record the run ID, schedule a wakeup for 3-5 minutes, check status, repeat until done. Each check is **one** `gh run view` call.

**Why 3-5 min:** Fast enough for responsive feedback; safe forever at 12-20 req/hour (0.4% of the 5,000/hour budget).

```bash
# Step 1: trigger and capture run ID
gh workflow run test-and-deploy-organiclever-web-development.yml
# URL output contains run ID, e.g. https://github.com/.../runs/12345678

# Step 2: ScheduleWakeup(delaySeconds=180)  ← check in 3 min

# Step 3: On wakeup — one check
gh run view <run-id> --json conclusion,status,jobs
# If still in_progress → ScheduleWakeup(delaySeconds=300) and check again
# If completed → read conclusion and proceed
```

At 3-5 min intervals a 35-min CI job needs 7-12 checks = **7-12 API calls total**. Zero burst.

**Rate limit math:** 1 call every 3 min = 20 calls/hour. Budget: 5,000/hour. Usage: 0.4%. Safe forever.

#### 2. `gh run watch <run-id>` (Short Jobs Only, <5 min)

`gh run watch` polls internally every ~3 seconds. For short jobs it's fine. For jobs longer than 5 minutes it will exhaust the rate limit.

**Only use for jobs expected to complete in under 5 minutes.** For any CI job that takes 10+ minutes, use approach 1 instead.

```bash
# ONLY for short jobs (<5 min)
gh run watch <run-id>
```

#### 3. Manual Polling With Minimum 3-Minute Sleep (Unavoidable Loop Cases)

If `ScheduleWakeup` is not available, the minimum interval between successive `gh run view` calls is **3 minutes**.

```bash
# PASS: Correct — 3-minute minimum sleep between checks
while true; do
  status=$(gh run view "$run_id" --json status --jq '.status')
  if [ "$status" = "completed" ]; then
    break
  fi
  sleep 180
done
```

```bash
# FAIL: Forbidden — tight loop with no sleep
while [ "$(gh run view $run_id --json status | python3 -c ...)" != "completed" ]; do
  echo "waiting..."
done
```

The forbidden pattern above can issue 500+ API calls in minutes. There is no scenario in which a tight-loop poll is acceptable.

### Trigger Discipline

Triggering the same workflow repeatedly before prior runs complete multiplies API quota consumption (setup calls, list calls, view calls per run) and risks concurrency cancellation — where GitHub's `concurrency` group cancels an in-progress run when a new one is queued, sending both to a non-green terminal state.

**Rules:**

1. Never trigger the same workflow more than once every 10 minutes.
2. Before triggering, check whether a run is already in progress:

   ```bash
   # Check for an active run before triggering
   gh run list --workflow=<workflow-file> --limit=1 --json status --jq '.[0].status'
   # If status is "in_progress" or "queued", do NOT trigger again
   ```

3. If a run was cancelled by a concurrency group, wait for the currently-running run to reach a terminal state before deciding whether to trigger again.
4. In plan execution, if CI was triggered for a push and the run is still in progress, use `gh run watch <id>` on the existing run — do not trigger a new run.

### Recovery When Rate-Limited

An HTTP 403 response from any `gh` command during CI monitoring means the rate limit is exhausted. The correct response is a scheduled wait, not a retry loop.

**Recovery procedure:**

1. Stop all `gh` calls immediately. Do NOT retry the failing command.
2. Note the time. The rate limit resets approximately at the top of the next hour from when the window opened (not from when the 403 occurred).
3. Use `ScheduleWakeup` with `delaySeconds=2100` (35 minutes) to resume CI verification after the reset.
4. On wakeup, run `gh run list --limit=5` once to verify the rate limit has cleared before proceeding with full monitoring.
5. If still rate-limited on wakeup, schedule another wakeup for `delaySeconds=1800` (30 minutes) and do not issue further calls.

```bash
# PASS: Correct recovery — scheduled wait, not retry loop
# [Detected HTTP 403 from gh run list]
# [ScheduleWakeup delaySeconds=2100 — rate limit recovery]
# [On wakeup: gh run list --limit=1 to verify reset, then gh run watch <id>]
```

```bash
# FAIL: Forbidden — retry loop after rate limit
while true; do
  result=$(gh run view "$run_id" --json status 2>&1)
  if echo "$result" | grep -q "403"; then
    sleep 60  # insufficient; still burning quota on each iteration
    continue
  fi
  break
done
```

## Application in Plan Execution (Step 2c)

The [plan-execution workflow](../../workflows/plan/plan-execution.md) Step 2c (Post-Push CI Verification) requires monitoring all GitHub Actions workflows after every push. This convention governs how that monitoring executes.

**Required pattern for Step 2c (standard CI jobs, 10–35 min):**

```bash
# 1. Identify the triggered run
gh run list --workflow=<workflow-file> --limit=3

# 2. Schedule a wakeup for expected completion time + buffer
# [ScheduleWakeup delaySeconds=2100]  ← 35 min for a typical 30-min job

# 3. On wakeup — ONE check, not a loop
gh run view <run-id> --json conclusion,status,jobs

# 4. On failure: pull logs and diagnose
gh run view <run-id> --log-failed
```

**When `gh run watch` is acceptable in Step 2c:**

Only use `gh run watch <run-id>` if the job is expected to complete in under 5 minutes. For all standard CI jobs (10–35 min), use `ScheduleWakeup` + single `gh run view` instead.

**Forbidden in Step 2c:**

- Using `gh run watch` for CI jobs that take 10+ minutes (exhausts rate limit)
- Tight-loop polling with `gh run view` and no sleep
- Polling intervals shorter than 30 seconds if neither approach above is applicable
- Triggering a new run while the previous one is still active
- Treating an HTTP 403 as a transient error and retrying immediately

**When rate-limited during plan execution:**

If the rate limit is hit mid-plan, use `ScheduleWakeup delaySeconds=2100` and resume CI verification after the reset. Do not spin in a retry loop. The delivery checklist item for Step 2c stays in-progress until CI verification completes. The plan execution checkpoint survives the wakeup pause via the on-disk delivery checklist (disk-is-truth invariant from Iron Rule 10).

## Examples

### PASS: Correct — Watch single run to completion

```bash
gh workflow run test-and-deploy-organiclever-web-development.yml
gh run list --workflow=test-and-deploy-organiclever-web-development.yml --limit=3
gh run watch 98765432
# Blocks until run completes; exits 0 on success, non-zero on failure
```

### PASS: Correct — Check before triggering

```bash
active=$(gh run list --workflow=test-and-deploy-organiclever-web-development.yml \
  --limit=1 --json status --jq '.[0].status')
if [ "$active" = "in_progress" ] || [ "$active" = "queued" ]; then
  echo "Run already active — watching existing run instead of triggering new one"
  run_id=$(gh run list --workflow=test-and-deploy-organiclever-web-development.yml \
    --limit=1 --json databaseId --jq '.[0].databaseId')
  gh run watch "$run_id"
else
  gh workflow run test-and-deploy-organiclever-web-development.yml
fi
```

### FAIL: Forbidden — Tight-loop polling

```bash
# BAD: burns 500+ API calls in minutes
while [ "$(gh run view $id --json status --jq '.status')" != "completed" ]; do
  echo "waiting..."
done
```

### FAIL: Forbidden — Multiple rapid triggers

```bash
# BAD: triggers three runs within two minutes, risking concurrency cancellation
gh workflow run test-and-deploy-organiclever-web-development.yml
gh workflow run test-and-deploy-organiclever-web-development.yml
gh workflow run test-and-deploy-organiclever-web-development.yml
```

### PASS: Correct — Rate limit recovery

```bash
# Detected: gh run list returned HTTP 403
# Action: stop all gh calls, schedule wakeup
# [ScheduleWakeup delaySeconds=2100]
# On wakeup:
gh run list --limit=1  # verify rate limit cleared
gh run watch 98765432  # resume watching the original run
```

## Related Documentation

- [CI Post-Push Verification Convention](./ci-post-push-verification.md) — Mandates triggering and monitoring CI after every push; this convention specifies safe monitoring mechanics.
- [CI Blocker Resolution Convention](../quality/ci-blocker-resolution.md) — How to investigate and fix CI failures once a run completes.
- [CI/CD Conventions](../infra/ci-conventions.md) — Central reference for GitHub Actions workflow structure and naming.
- [Plan Execution Workflow](../../workflows/plan/plan-execution.md) — Step 2c uses this convention for all post-push CI monitoring.
