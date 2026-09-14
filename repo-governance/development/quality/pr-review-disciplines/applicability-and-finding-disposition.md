---
description: When the PR-review specialist disciplines run at all, and how code-related vs LOW findings are disposed.
when_to_use: Use when deciding whether a PR is eligible for specialist review, or how a LOW-severity finding should be recorded.
---

# Applicability and Finding Disposition

- [Cost/Noise Control: Shared-Context Extract-Once (D13)](.././pr-review-disciplines/cost-control-noise-control-mechanics-shared-context-extract-once.md) — Extracting shared PR context once, and large-diff handling. Use when a large diff needs shared-context handling.
- [Cost/Noise Control: SUPPRESS Blocks and D14](.././pr-review-disciplines/cost-control-noise-control-mechanics-suppress-blocks-and-instruction-decay-specialist.md) — Per-specialist SUPPRESS blocks, and the instruction-decay specialist. Use when scoping a specialist's SUPPRESS block.
- [Cost/Noise Control: Dismissal Rule and Tag-Strip](.././pr-review-disciplines/cost-control-noise-control-mechanics-human-dismissal-and-boundary-tag-strip.md) — Respecting a human dismissal, and boundary-tag-strip hardening. Use when a re-review encounters a prior human dismissal.
- [Quality Gates: Confidence-Calibration Spot-Check](.././pr-review-disciplines/quality-gate-enhancements-confidence-calibration-spot-check.md) — Spot-checking a specialist's confidence calibration. Use when calibrating a specialist's confidence scoring.
- [Quality Gates: Selective Adversarial Verification (D4)](.././pr-review-disciplines/quality-gate-enhancements-selective-adversarial-verification.md) — Adversarial re-verification for selected findings. Use when a finding warrants adversarial re-verification.
- [Quality Gates: CRITICAL-Reproduction and Cycle Cap](.././pr-review-disciplines/quality-gate-enhancements-critical-reproduction-and-five-cycle-maximum.md) — Requiring reproduction for CRITICAL, and the five-cycle cap. Use when a CRITICAL finding lacks reproduction steps.
- [Post-Cutover Monitoring: Plan (1)](.././pr-review-disciplines/post-cutover-monitoring-rollback-monitoring-plan-precision-and-rate.md) — Why post-cutover monitoring exists; precision and per-discipline rate. Use when setting up post-cutover monitoring for the split.
- [Post-Cutover Monitoring: Plan (2)](.././pr-review-disciplines/post-cutover-monitoring-rollback-monitoring-plan-health-metrics.md) — Outdated rate, cost/latency per tier, and human-override rate. Use when tracking the split's post-cutover health metrics.
- [Post-Cutover Monitoring: Rollback Trigger (D6)](.././pr-review-disciplines/post-cutover-monitoring-rollback-rollback-trigger.md) — The trigger and procedure for rolling back the split. Use when deciding whether to roll back the discipline split.
- [Future Work: Bot Identity Gap](.././pr-review-disciplines/future-work-bot-identity.md) — The bot-identity and REQUEST_CHANGES gap, not yet resolved. Use when investigating the bot-identity review gap.
- [Future Work: Cost and Latency Budgeting](.././pr-review-disciplines/future-work-cost-and-latency-budgeting.md) — A future per-PR cost and latency budget. Use when proposing a cost/latency budget for review.
- [Future Work: Deferred Merge Queue (D7/D10)](.././pr-review-disciplines/future-work-deferred-merge-queue.md) — A deferred merge-queue integration idea. Use when scoping a future merge-queue integration.
- [Examples](.././pr-review-disciplines/examples.md) — Worked examples of the nine-discipline review pipeline. Use for a concrete example of this review pipeline.
- [Enforcement and Related Documentation](.././pr-review-disciplines/enforcement-and-related-documentation.md) — How this convention is enforced, and related references. Use to locate the automated enforcement or a related convention.
