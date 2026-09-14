---
description: "Outdated rate, cost/latency per tier, and human-override rate."
when_to_use: "Use when tracking the split's post-cutover health metrics."
---

# Post-Cutover Monitoring and Rollback: Post-Cutover Monitoring Plan (part 2)

- **Outdated Rate** (BitsAI-CR-style) — the share of posted findings that go stale or irrelevant by
  the time `pr-review-fixer` reaches them, typically because an earlier cycle's fix already resolved
  the diff the finding targeted. A rising outdated rate points at review cadence, not finding
  quality, as the problem.
- **Cost/latency per review, tracked per risk-tier** — measured separately for `trivial`, `lite`, and
  `full` per the [risk-tier fan-out (D12)](./cost-control-noise-control-mechanics-risk-tier-fan-out.md), never as one blended average
  across tiers. A **flat cost across risk-tiers is itself a finding** — it means the tier
  classification is not actually changing which specialists run, and the primary cost lever the
  fan-out relies on has silently stopped taking effect.
- **Human-override rate** — the share of PRs where a human explicitly dismisses or overrides a
  consolidated finding, the same dismissal the
  [human-dismissal-respect re-review rule](./cost-control-noise-control-mechanics-human-dismissal-and-boundary-tag-strip.md) already tracks
  per-thread, rolled up across PRs. This is Cloudflare's **break-glass trust proxy**: a rising
  override rate is a cheaper, earlier trust-erosion signal than precision, because a human reaches
  for override before a measurable precision drop shows up in the fixer's triage data.

None of these five families requires a pre-cutover monolith baseline — each is measured purely
against the split's own post-cutover behaviour over time. That property is what makes the rollback
trigger below workable without a baseline to compare against.
