---
description: "The trivial/lite/full risk-tier specialist fan-out."
when_to_use: "Use when determining which specialists run on a PR."
---

# Cost-Control and Noise-Control Mechanics: Risk-Tier Fan-Out (D12)

## Cost-Control & Noise-Control Mechanics

This fan-out follows Cloudflare's production AI-review shape. Unconditionally running nine
specialists would cost more than one reviewer without matching quality, so this convention tiers
diffs and filters inapplicable lenses.

### Risk-tier fan-out (D12)

The primary cost lever is **diff-size tiering**, not model choice. Risk-tier classification is
performed by [`pr-review-scout-maker`](../../../../.claude/agents/pr-review/pr-review-scout-maker.md), not by
`pr-review-synthesis-maker` directly — the scout classifies each PR into one of three tiers by line
count, file count, and whether it touches a security-sensitive path, and the specialist set fans out
accordingly:

- **Trivial** (≤10 changed lines AND ≤20 files, no security-sensitive path) → coordinator-only: the
  coordinator runs one consolidated generalist pass itself, with no specialist fan-out.
- **Lite** (≤50 lines AND ≤20 files) → a reduced specialist set of the five highest-yield lenses
  for this repo (governance, architecture, logic, security, integrity) plus the coordinator.
- **Full** (>50 lines OR >20 files OR touches a security-sensitive path — secrets/`.env`, git
  identity, CI/workflow, `pr-merge-protocol`) → all nine specialists plus the coordinator, minus the
  Content-Type Applicability Filter (DD-10).

The [Plans-Only Review Route](./cost-control-noise-control-mechanics-plans-only-route.md) modifies
specialist selection, not tier classification: trivial stays coordinator-only with five concerns;
lite/full use the fixed five. The linked rule defines the artifact test, primary probe, and
suppressions.

**Why 50 lines, not 100.** Risk asymmetry decides it: too low overspends; too high sends degrading
diffs to fewer specialists. Weak supporting evidence only —
[Bigger Isn't Always Better](https://arxiv.org/abs/2606.15689) reports F1 falling from 0.80 at
10-50 lines to 0.07 by 150, but for **n=10**, one of five models, unreplicated and provenance-
unverified. Cloudflare uses 100. Revisit against repository data.

**Why architecture joins lite.** Across 94 findings on PRs #225/#226/#227/#232, architecture
supplied 17% at 93.8% acceptance and catches expensive-to-reverse defects. No per-discipline
breakdown exists, so any ranking is unmeasured. Security stays despite 5% volume because of risk
asymmetry. The sample is all `full`; lite remains unmeasured.

**Security-sensitive paths force `full` for every non-plans-only PR.** The no-secrets and
git-identity rules make this non-negotiable. Recompute and record the tier and route each cycle.

**Content-type applicability filter (DD-10)**: within `full` tier, `pr-review-scout-maker` may skip
`pr-review-types-maker` (no typed source in the diff) or `pr-review-integrity-maker` (no test/CI
files in the diff) — the only two disciplines whose own charter is gated on a specific artifact class
rather than being applicable to any changed content. The other seven specialists are never skipped by
file type; see
[`pr-review-scout-maker.md`'s own filter definition](../../../../.agents/skills/pr-review-scout-classification/reference/risk-tier-and-specialist-selection.md#risk-tier-classification--specialist-set-selection-d12)
for the full rule and its fresh-per-cycle re-evaluation requirement.

**Enforcement disposition — covered when invoked.** The optional PR review workflow invokes a fresh
`pr-review-scout-maker` every cycle, and its human-readable review-route record exposes the ordinary
tier, plans-only verdict, primary probe, and every selected or skipped specialist.
