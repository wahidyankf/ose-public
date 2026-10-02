---
description: "The first two safeguards against iteration loops."
when_to_use: "Use when a checker re-flags a false positive."
---

# Preventing Iteration Loops — False-Positive Persistence and Changed-Files Record

Without explicit mechanisms to track accepted decisions, checker-fixer workflows can enter infinite or very long iteration loops. This section defines the three structural safeguards that prevent runaway iterations.

## 1. FALSE_POSITIVE Persistence (`.known-false-positives.md`)

**Problem**: Checker re-flags the same accepted FALSE_POSITIVE findings on every iteration because it has no memory of previous decisions.

**Solution**: Fixer writes all accepted FALSE_POSITIVE findings to `local-tmp/.known-false-positives.md`. Checker reads this file at the start of every run and skips any matching entries.

**Key format**: `[category] | [file] | [brief-description]` — stable across runs.

**Checker behaviour**: When a finding matches the skip list, log as `[PREVIOUSLY ACCEPTED FALSE_POSITIVE — skipped]` in the informational section. Do NOT count in findings total.

**Fixer behaviour**: At end of every fix report, append each FALSE_POSITIVE to `.known-false-positives.md` and include an `## Accepted FALSE_POSITIVE Findings` section in the fix report.

## 2. Changed-Files Record

**Problem**: Without a record of what the fixer touched, a repair cannot be traced to the row it answers.

**Solution**: Fixer captures `git diff --name-only HEAD` after applying fixes and includes the list in the fix report under `## Changed Files` as evidence for the rows it verified. The list never narrows the next audit: every quality-gate cycle audits the whole frozen scope, per the [Quality Gate Contract](../../workflow/quality-gate-contract.md).
