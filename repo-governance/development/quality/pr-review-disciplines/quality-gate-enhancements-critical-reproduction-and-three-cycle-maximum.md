---
description: "Requiring reproduction for CRITICAL, and the three-cycle cap the PR review gate keeps."
when_to_use: "Use when a CRITICAL finding lacks reproduction steps."
---

# Quality-Gate Enhancements: CRITICAL-Requires-Reproduction and Bounded Cycle Cap

## CRITICAL-Requires-Reproduction

A CRITICAL-severity finding (per the [Criticality Levels Convention](.././criticality-levels.md))
must never rest on agreement-counting alone — multiple reviewers concluding the same thing is not
evidence that the thing is true. Any CRITICAL finding must carry a concrete **reproduction**:
specific inputs or state that produce the wrong output or crash, not a description of what a
reviewer believes would happen. A CRITICAL finding without a reproduction is not yet a CRITICAL
finding — it is held at a lower severity, or held for further verification under the
[Selective Adversarial Verification](./quality-gate-enhancements-selective-adversarial-verification.md) rule above when the
diff is also high-risk, until a reproduction is attached.

## Three-Cycle Cap

For an eligible PR, the [PR Review Quality Gate](../../../workflows/quality/pr-review-quality-gate.md) runs sequential
CI-gated cycles, at most three, as the [Quality Gate Contract](../../workflow/quality-gate-contract.md) sets. A later
cycle uses a changed focused probe only when the remaining defect family is named. This is a ceiling, not a target
count.

After the last cycle, capture sanitized learning and return the verdict; open blocking rows go to their owner, and no
checkpoint or agent extends the ceiling. LOW findings retain evidence but are non-blocking.
