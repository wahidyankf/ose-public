---
description: "A future per-PR cost and latency budget."
when_to_use: "Use when proposing a cost/latency budget for review."
---

# Cost and Latency Budgeting

Cloudflare's own production system — the one this convention's fan-out/coordinator shape is modeled
on (see [Cost-Control & Noise-Control Mechanics](./cost-control-noise-control-mechanics-risk-tier-fan-out.md)) — reports a
median cost of ≈$1 per review. Applied to this repo's shape, a `full`-tier PR fanning out to all
nine specialists across the full five-cycle ceiling costs at worst roughly ≈$1 × 9 specialists ×
5 cycles per PR, bounded downward twice over: by the
[risk-tier fan-out (D12)](./cost-control-noise-control-mechanics-risk-tier-fan-out.md) — a `trivial` PR
runs the coordinator alone and a `lite` PR fans out to only five specialists — and by the
earliest-clean-exit rule, since the ceiling is reached only by a PR that never converges, and the
typical PR exits after one or two cycles. Actual per-PR cost therefore sits well under that worst case. This convention does not yet mandate a specific budget or alert
threshold. It recommends that whoever owns the
[Post-Cutover Monitoring Plan](./post-cutover-monitoring-rollback-monitoring-plan-precision-and-rate.md)'s cost/latency-per-review metric also
track the absolute per-PR dollar figure over time, not only the per-tier trend, so a repo-wide cost
creep is visible before it grows into a rollback-trigger-level concern.
