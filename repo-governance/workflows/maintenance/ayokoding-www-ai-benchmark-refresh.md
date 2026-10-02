---
description: "Refreshes the AyoKoding AI benchmark data (roster, independent results, API prices), lands it on main through one PR, releases it to production, and tears down the work's artifacts."
when_to_use: "Use when the AI benchmark data is stale, a model or price change must be published, or a scheduled dataset refresh is due."
---

# AyoKoding Web AI Benchmark Refresh

**Purpose**: Refresh the AyoKoding AI benchmark data (roster, independent results, API prices), land it
on `main` through one PR, release it to production, and tear down the work's artifacts.

This is an execution workflow, not a quality gate: it carries one dataset update from research to a
verified live page. It changes data only, never methodology. The sourcing rules stay in the
[Data-Sourcing Prompt](../../../apps/ayokoding-www/docs/ai-benchmark/data-sourcing-prompt.md), which
the steps follow and never restate.

## Goal and Termination

**Goal**: The live AI benchmark page shows the refreshed dataset and its new last-updated date, and no
artifact of the work remains.

**Termination**: PASS when clean-up passes and `final-status` is `deployed`, `no-change`, or
`merged-not-deployed` after `deploy=false` or a declined deploy. A methodology change the user wants ends the run as
`halted`. See
[Termination and Pitfalls](./ayokoding-www-ai-benchmark-refresh/001-termination-and-pitfalls.md).

## Inputs

- **`scope`** (enum: full, prices, results, optional, default `full`) — Which parts to refresh: `prices`
  covers the roster, harness availability, and API prices; `results` covers independent benchmark results.
- **`deploy`** (boolean, optional, default `true`) — Release to production after the merge. The
  force-push still needs the user's per-instance approval at Step 6.
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the
  N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent work, machine
  capacity, and budget headroom all allow; lower under budget, runner, or disk pressure. Never
  self-promoted beyond the declared value.

## Outputs

- **`final-status`** (enum: deployed, deploy-unverified, merged-not-deployed, no-change, halted, failed) — Terminal state of the run
- **`pr-url`** (string) — URL of the delivering PR
- **`deployed-sha`** (string) — Commit whose production deployment reached READY
- **`evidence`** (string) — Sources checked, board dates, and verification results, recorded in the PR
  body, or in the final report when no PR opens; the working notes under the worktree's
  `local-tmp/ayokoding-benchmark-refresh/` go at Step 7

## Contents

- [Research and Data Update](./ayokoding-www-ai-benchmark-refresh/002-research-and-data-update.md) — Steps 0-3
  open the worktree, research in parallel, hold the methodology checkpoint, and apply the data. Use when
  starting a refresh or working out what the research and data-edit steps require.
- [Verification](./ayokoding-www-ai-benchmark-refresh/003-verification.md) — Step 4 spot-checks changed
  figures, runs the quality commands and e2e scenarios, and checks the page in a real browser. Use when
  proving a refreshed dataset is correct before it is committed.
- [Delivery, Deploy, and Clean-Up](./ayokoding-www-ai-benchmark-refresh/004-delivery-deploy-and-clean-up.md) — Steps 5-7
  deliver and merge the PR, deploy after approval and verify the live page, then clean up. Use when landing a verified
  refresh, releasing it to production, or tearing down the work.
- [Termination and Pitfalls](./ayokoding-www-ai-benchmark-refresh/001-termination-and-pitfalls.md) — The PASS,
  Partial, and FAIL criteria, Gherkin success criteria, and known pitfalls. Use when deciding whether a
  refresh run is finished, or when a step misbehaves.

## Example Usage

```text
Run ayokoding-www-ai-benchmark-refresh workflow
Run ayokoding-www-ai-benchmark-refresh workflow with scope=prices deploy=false
```

## Related Workflows

- [`pr-leak-review`](../quality/pr-leak-review.md) — the mandatory leak review Step 5 runs on the PR's exact
  current head.
- [`dev-artifact-clean-up`](dev-artifact-clean-up.md) — the teardown Step 7 runs.
- [`content-quality-gate`](../quality/content-quality-gate.md) — validates AyoKoding
  tutorial content; this workflow refreshes the benchmark dataset instead.

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: methodology
  changes and the production force-push each stop at a human checkpoint.
- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: failing checks are fixed,
  never skipped or swapped.
- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: research,
  spot-checks, and gates run through agents and pinned commands.
