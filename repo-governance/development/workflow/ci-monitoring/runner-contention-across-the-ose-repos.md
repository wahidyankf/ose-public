---
description: Runner capacity is shared and finite across the OSE repos; contention is expected, and the correct response is to wait and check, not assume a defect.
when_to_use: Use when a CI run is queued or stalled with no progress, before assuming the pushed code is broken.
---

# Runner Contention Across the OSE Repos (Read First)

**Runner capacity across the OSE repos is limited and shared — contention is expected, not a bug.** `ose-public` runs CI on GitHub's free-tier hosted runners (`runs-on: ubuntu-latest`), which share GitHub's per-account concurrent-job cap across every public repo under [github.com/wahidyankf](https://github.com/wahidyankf). The private sibling runs on a small, fixed pool of self-hosted runners (`runs-on: [self-hosted, linux, ose-self-hosted]`). Both pools are finite. When multiple repos or workflows queue jobs at the same time, a run can sit `queued`, or a step can stall with no progress — this is runner/action contention, not a defect in the pushed code, and it is not something a code fix or a retry resolves.

**Response: wait patiently, then check what else is running before assuming anything is broken.**

```bash
# Queued/in-progress runs in one repo
gh run list --status=queued --status=in_progress --limit=20

# Same check across every OSE repo
for repo in ose-public <private-sibling>; do
  echo "== $repo =="
  gh run list --repo wahidyankf/$repo --status=queued --status=in_progress --limit=10
done

# Org/account-wide view (browser) — https://github.com/wahidyankf, then each repo's Actions tab
```

Keep the same [2-minute `ScheduleWakeup` cadence](./schedulewakeup-every-2-minutes.md#schedulewakeup-every-2-minutes-required-default) already required by this convention while waiting — do not shorten it because the cause is suspected to be contention rather than a normal-length job. Do not cancel/rerun a queued or stalled job as a first response to suspected contention: that only consumes another slot in the same congested pool. Only escalate to the [stuck-runner diagnosis](./diagnosing-a-stuck-self-hosted-runner-job.md#diagnosing-a-stuck-self-hosted-runner-job) below once contention has been ruled out — i.e., nothing else is queued or running and the job is still making zero progress.

**The active goal stays active during runner contention.** A queued or stalled job is a wait and
investigate condition, not a reason to cancel the plan, abandon the delivery, declare the work
blocked, or substitute an unverified merge. Keep the on-disk checklist current, schedule the next
cadenced check, and resume the same goal when capacity returns. This rule is independent of whether
the affected job may later be retriggered after contention is ruled out.
