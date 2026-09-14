---
description: "Spot-checking a specialist's confidence calibration."
when_to_use: "Use when calibrating a specialist's confidence scoring."
---

# Quality-Gate Enhancements: Confidence-Calibration Spot-Check

## Quality-Gate Enhancements

The nine-discipline split, the boundary tie-breaker, and the cost- and noise-control mechanics
above answer who reviews what and how much of the diff gets fanned out. They do not by themselves
guard against three known failure modes of LLM-driven review: a stated confidence score that does
not track actual correctness, a CRITICAL finding that reviewers merely agree on rather than
demonstrate, and a fixed-cycle policy mistaken for a data-derived optimum. The following four
enhancements close those gaps as documented manual procedures and rules layered on top of the
[Nine Reviewer Disciplines](./the-nine-reviewer-disciplines-table-architecture-to-performance.md) above.

### Confidence-Calibration Spot-Check

A stated numeric confidence is only as trustworthy as its **calibration** — how closely a model's
self-reported confidence tracks its actual accuracy. Every specialist already inherits the
[0-100 confidence scale with a hard drop below 80](./the-nine-reviewer-disciplines-table-architecture-to-performance.md); this
enhancement is the documented manual procedure that keeps that ≥80 threshold honest over time:

1. Periodically sample a batch of past findings that crossed the ≥80 confidence-to-post threshold
   across recent review cycles.
2. For each sampled finding, compare its stated numeric confidence against the fixer's actual
   triage outcome — fixed, versus rejected or deferred.
3. If the sample reveals systematic over-confidence (high stated confidence, high rejection rate)
   or under-confidence (findings below 80 that a fixer would plausibly have fixed), recalibrate
   the ≥80 confidence-to-post threshold accordingly and record the recalibration and its
   rationale.

This is a documented manual procedure, not an automated job — no agent runs the calibration check
unprompted; a maintainer (or a future dedicated checker) performs it periodically against the
review history. It complements the
[CRITICAL-Requires-Reproduction](./quality-gate-enhancements-critical-reproduction-and-five-cycle-maximum.md) rule below: confidence
calibration catches a systematically miscalibrated score across many findings, while
CRITICAL-requires-reproduction catches a single unverified high-severity finding.
