---
description: Defines the nine PR-review specialist disciplines, their owned/routed-to scope, and the boundary tie-breaker rule.
when_to_use: "Use when a PR-review specialist needs its owned scope, or a finding needs disposition."
---

# PR Reviewer-Discipline Convention

Nine PR-review specialist disciplines, their owned/routed-to scope, the tie-breaker rule for
findings that span disciplines, and the coordinator pipeline's cost- and noise-control mechanics.

## Documents

- [Applicability and Finding Disposition](./pr-review-disciplines/applicability-and-finding-disposition.md) — Which pipeline this applies to, and how findings are disposed. Use to check whether a review is in scope.
- [Principles/Conventions](./pr-review-disciplines/principles-and-conventions-implemented-respected.md) — Rationale principles and conventions. Use to trace this convention's rationale.
- [Purpose](./pr-review-disciplines/purpose.md) — Why the nine-discipline split exists. Use when orienting to the split.
- [Nine Reviewer Disciplines: Table (1)](./pr-review-disciplines/the-nine-reviewer-disciplines-table-architecture-to-performance.md) — Shared rules; Architecture through Performance. Use to find which specialist owns a finding.
- [Review as Teaching](./pr-review-disciplines/review-as-teaching.md) — Findings a junior can read. Use when writing one.
- [Nine Reviewer Disciplines: Table (2)](./pr-review-disciplines/the-nine-reviewer-disciplines-table-documentation-to-type-soundness.md) — Documentation through Type-soundness, plus scout/synthesis roles. Use to find which specialist owns a finding.
- [The Boundary Tie-Breaker Rule](./pr-review-disciplines/the-boundary-tie-breaker-rule.md) — Three-step tie-breaker for a cross-discipline finding. Use when a finding spans disciplines.
- [Seven Grey-Zone Rulings](./pr-review-disciplines/seven-grey-zone-rulings.md) — The tie-breaker pre-resolved for seven cases. Use for a recurring grey-zone question.
- [Risk-Tier Fan-Out (D12)](./pr-review-disciplines/cost-control-noise-control-mechanics-risk-tier-fan-out.md) — Trivial/lite/full selection.
- [Plans-Only Review Route](./pr-review-disciplines/cost-control-noise-control-mechanics-plans-only-route.md) — Tier-aware lenses and primary secrets probe.
- [Cost/Noise Control: Shared-Context Extract-Once (D13)](./pr-review-disciplines/cost-control-noise-control-mechanics-shared-context-extract-once.md) — Shared PR context and large-diff handling. Use for a large-diff review.
- [Cost/Noise Control: SUPPRESS Blocks and D14](./pr-review-disciplines/cost-control-noise-control-mechanics-suppress-blocks-and-instruction-decay-specialist.md) — SUPPRESS blocks and the instruction-decay specialist. Use when scoping a SUPPRESS block.
- [Cost/Noise Control: Dismissal Rule and Tag-Strip](./pr-review-disciplines/cost-control-noise-control-mechanics-human-dismissal-and-boundary-tag-strip.md) — Human-dismissal respect and tag-strip hardening. Use on a re-review after a prior dismissal.
- [Quality Gates: Confidence-Calibration Spot-Check](./pr-review-disciplines/quality-gate-enhancements-confidence-calibration-spot-check.md) — Spot-checking confidence calibration. Use when calibrating confidence scoring.
- [Quality Gates: Selective Adversarial Verification (D4)](./pr-review-disciplines/quality-gate-enhancements-selective-adversarial-verification.md) — Adversarial re-verification for selected findings. Use when a finding needs re-verification.
- [Quality Gates: CRITICAL-Reproduction and Cycle Cap](./pr-review-disciplines/quality-gate-enhancements-critical-reproduction-and-five-cycle-maximum.md) — Reproduction requirement plus five-cycle cap. Use when CRITICAL lacks reproduction steps.
- [Post-Cutover Monitoring: Plan (1)](./pr-review-disciplines/post-cutover-monitoring-rollback-monitoring-plan-precision-and-rate.md) — Why monitoring exists; precision and per-discipline rate. Use when setting up monitoring.
- [Post-Cutover Monitoring: Plan (2)](./pr-review-disciplines/post-cutover-monitoring-rollback-monitoring-plan-health-metrics.md) — Outdated rate, cost/latency, override rate. Use to track post-cutover health.
- [Post-Cutover Monitoring: Rollback Trigger (D6)](./pr-review-disciplines/post-cutover-monitoring-rollback-rollback-trigger.md) — Trigger and procedure for rollback. Use when deciding whether to roll back.
- [Future Work: Bot Identity Gap](./pr-review-disciplines/future-work-bot-identity.md) — The unresolved bot-identity/REQUEST_CHANGES gap. Use when investigating this gap.
- [Future Work: Cost and Latency Budgeting](./pr-review-disciplines/future-work-cost-and-latency-budgeting.md) — A future per-PR cost/latency budget. Use when proposing such a budget.
- [Future Work: Deferred Merge Queue (D7/D10)](./pr-review-disciplines/future-work-deferred-merge-queue.md) — A deferred merge-queue idea. Use when scoping future merge-queue work.
- [Examples](./pr-review-disciplines/examples.md) — Worked examples of the review pipeline. Use for a concrete example.
- [Enforcement and Related Documentation](./pr-review-disciplines/enforcement-and-related-documentation.md) — Enforcement mechanics and related references. Use to locate enforcement or a related convention.
