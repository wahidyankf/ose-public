---
description: "Defines the nine PR-review specialist disciplines, their owned/routed-to scope, and the boundary tie-breaker rule."
when_to_use: "Read this index to find the right PR Reviewer-Discipline Convention child document."
---

# PR Reviewer-Discipline Convention

- [Applicability and Finding Disposition](./applicability-and-finding-disposition.md) — When the PR-review specialist disciplines run at all, and how code-related vs LOW findings are disposed. Use when deciding whether a PR is eligible for specialist review, or how a LOW-severity finding should be recorded.
- [Principles/Conventions](./principles-and-conventions-implemented-respected.md) — Principles/conventions implemented. Use to trace rationale.
- [Purpose](./purpose.md) — Why the split exists. Use to orient to the split's purpose.
- [Nine Reviewer Disciplines: Table (1)](./the-nine-reviewer-disciplines-table-architecture-to-performance.md) — Shared rules; disciplines Architecture-Performance. Use to find a finding's owning specialist.
- [Review as Teaching](./review-as-teaching.md) — Every finding and reply stays legible to a junior engineer, and critique addresses the change rather than its author. Use when writing a finding or reply.
- [Nine Reviewer Disciplines: Table (2)](./the-nine-reviewer-disciplines-table-documentation-to-type-soundness.md) — Disciplines Documentation-Type-soundness; scout/synthesis. Use to find a finding's owning specialist.
- [The Boundary Tie-Breaker Rule](./the-boundary-tie-breaker-rule.md) — The three-step cross-discipline tie-breaker. Use for an ambiguous-ownership finding.
- [Seven Grey-Zone Rulings](./seven-grey-zone-rulings.md) — The tie-breaker pre-resolved for seven recurring cases. Use for a recurring grey-zone finding-ownership question.
- [Cost/Noise Control: Risk-Tier Fan-Out (D12)](./cost-control-noise-control-mechanics-risk-tier-fan-out.md) — The trivial/lite/full risk-tier specialist fan-out. Use when determining which specialists run on a PR.
- [Cost/Noise Control: Plans-Only Review Route](./cost-control-noise-control-mechanics-plans-only-route.md) — The tier-aware plan-artifact route, primary secrets probe, and implementation suppression. Use when a PR contains only qualifying plan artifacts.
- [Cost/Noise Control: Shared-Context Extract-Once (D13)](./cost-control-noise-control-mechanics-shared-context-extract-once.md) — Extracting shared PR context once, and large-diff handling. Use when a large diff needs shared-context handling.
- [Cost/Noise Control: SUPPRESS Blocks and D14](./cost-control-noise-control-mechanics-suppress-blocks-and-instruction-decay-specialist.md) — Per-specialist SUPPRESS blocks, and the instruction-decay specialist. Use when scoping a specialist's SUPPRESS block.
- [Cost/Noise Control: Dismissal Rule and Tag-Strip](./cost-control-noise-control-mechanics-human-dismissal-and-boundary-tag-strip.md) — Respecting a human dismissal, and boundary-tag-strip hardening. Use when a re-review encounters a prior human dismissal.
- [Quality Gates: Confidence-Calibration Spot-Check](./quality-gate-enhancements-confidence-calibration-spot-check.md) — Spot-checking a specialist's confidence calibration. Use when calibrating a specialist's confidence scoring.
- [Quality Gates: Selective Adversarial Verification (D4)](./quality-gate-enhancements-selective-adversarial-verification.md) — Adversarial re-verification for selected findings. Use when a finding warrants adversarial re-verification.
- [Quality Gates: CRITICAL-Reproduction and Cycle Cap](./quality-gate-enhancements-critical-reproduction-and-five-cycle-maximum.md) — Requiring reproduction for CRITICAL, and the five-cycle cap. Use when a CRITICAL finding lacks reproduction steps.
- [Post-Cutover Monitoring: Plan (1)](./post-cutover-monitoring-rollback-monitoring-plan-precision-and-rate.md) — Why post-cutover monitoring exists; precision and per-discipline rate. Use when setting up post-cutover monitoring for the split.
- [Post-Cutover Monitoring: Plan (2)](./post-cutover-monitoring-rollback-monitoring-plan-health-metrics.md) — Outdated rate, cost/latency per tier, and human-override rate. Use when tracking the split's post-cutover health metrics.
- [Post-Cutover Monitoring: Rollback Trigger (D6)](./post-cutover-monitoring-rollback-rollback-trigger.md) — The trigger and procedure for rolling back the split. Use when deciding whether to roll back the discipline split.
- [Future Work: Bot Identity Gap](./future-work-bot-identity.md) — The bot-identity and REQUEST_CHANGES gap, not yet resolved. Use when investigating the bot-identity review gap.
- [Future Work: Cost and Latency Budgeting](./future-work-cost-and-latency-budgeting.md) — A future per-PR cost and latency budget. Use when proposing a cost/latency budget for review.
- [Future Work: Deferred Merge Queue (D7/D10)](./future-work-deferred-merge-queue.md) — A deferred merge-queue integration idea. Use when scoping a future merge-queue integration.
- [Examples](./examples.md) — Worked examples of the nine-discipline review pipeline. Use for a concrete example of this review pipeline.
- [Enforcement and Related Documentation](./enforcement-and-related-documentation.md) — How this convention is enforced, and related references. Use to locate the automated enforcement or a related convention.
