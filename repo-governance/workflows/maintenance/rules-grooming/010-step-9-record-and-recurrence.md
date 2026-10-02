---
description: The durable run record, what it must carry, and the re-evaluation that sets the next sweep's due date from measurement rather than assumption.
when_to_use: Use when recording a completed grooming run and arming its recurrence trigger.
---

# Step 9 — Record and Recurrence

**Procedure**: Write the run record into the delivery PR's body, then re-evaluate the recurrence
trigger against the post-run census so the next sweep's due date is set by measurement rather than
by assumption.

**The record lives in the PR, not in a tracked file.** A run log binds nothing, and this tree binds;
the commit trail already establishes when a run happened, so a tracked log would only be a second
source of truth free to drift from it. [Step 1](./001-purpose-and-when-to-use.md) reads git for the same
reason.

The record carries: run date, `scope`, `classes`, the census before and after, the metrics delta
(file count, total lines, metadata ratio), per-class item counts by disposition, every retirement
with its rationale, every deferred item, the Step 8 verdict, and the propagation PRs.

Deferred items carry forward. A rediscovered candidate that was previously rejected is recorded as
rejected-again rather than presented as new, so a maintainer is never asked the same question twice
without being told they already answered it. A Step 8 finding bounded out of this run — one on a
surface the run did not touch — is recorded here as next-sweep input, which is the only thing that
keeps that bound from being a quiet drop.

- **Depends on**: Step 8.
- **Output**: The run record in the delivery PR body; the commit date is what the trigger reads.
- **Success criteria**: The log entry is written even when the run ended `partial` or `halted`. A
  run that leaves no record is indistinguishable from one that never happened, and the next sweep
  would then repeat its rejected candidates and re-ask its answered questions.

## Related

- [Step 7](./008-step-7-preservation-verification.md) and [Step 8](./009-step-8-governance-verdict.md) — the verifications this records.
- [Purpose and When to Use](./001-purpose-and-when-to-use.md) — the git-derived recurrence trigger.
- [Termination Criteria](./015-termination-criteria.md) — the states this record reports.
