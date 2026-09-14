---
description: "Why post-cutover monitoring exists; precision and per-discipline rate."
when_to_use: "Use when setting up post-cutover monitoring for the split."
---

# Post-Cutover Monitoring and Rollback: Post-Cutover Monitoring Plan (part 1)

## Post-Cutover Monitoring & Rollback

The eight-discipline split retired the single `pr-review-maker` monolith at cutover by deletion, not
by a staged sunset gated on measurement. Everything in this section therefore watches the split
**after** the monolith is already gone — it is **post-cutover monitoring**, not a pre-cutover
evaluation gate the split had to clear before shipping. The
[Quality-Gate Enhancements](./quality-gate-enhancements-confidence-calibration-spot-check.md) above harden how an individual finding is
trusted (confidence calibration, adversarial verification, CRITICAL reproduction, the fixed-cycle
policy); this section hardens the split's health as a whole, measured continuously across many PRs
after cutover.

### Post-Cutover Monitoring Plan

Five metric families run continuously against live post-cutover PRs:

- **Precision** — consolidated-finding precision, the fraction of findings the coordinator posts
  that `pr-review-fixer` confirms as real (confirmed-real / total-posted). This is the most direct
  read on whether the nine-specialist fan-out produces trustworthy findings rather than noise.
- **Per-discipline acceptance rate** — fixes divided by total findings, tracked separately per
  discipline. Watch specifically the lenses the discipline split newly added — `performance` and
  `docs`, and now `type-soundness` joins them as a newly-added discipline to watch — to confirm each
  earns its fan-out cost (whether it produces enough real findings to justify running it on every
  applicable PR), and the catch-all disciplines — `governance` and `logic` — whose broad owned scope
  makes them the most likely to over-report if a specialist's charter drifts loose.
