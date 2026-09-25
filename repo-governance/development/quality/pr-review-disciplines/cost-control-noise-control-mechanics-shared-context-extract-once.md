---
description: "Extracting shared PR context once, and large-diff handling."
when_to_use: "Use when a large diff needs shared-context handling."
---

# Shared-context extract-once + large-diff handling (D13)

**D13 chose NO generated-file exclusion.** Reviewers see the **full diff**, including regenerated
output such as `.opencode/agents/**`, `.codex/agents/**`, generated mirrors under
`.agents/skills/**`, `generated/**`, lock files, and minified/source-map assets — nothing is silently
filtered out before a specialist reviews it, and **CI still runs over
everything regardless** of what any reviewer chooses to skim. This is a deliberate reversal of the
alternative (auto-detecting and excluding generated files): the rationale is explicitness — a
hand-edited "generated" file is never silently missed because nothing is silently excluded. One
exception applies from cycle 2 — see the correction record below.

**The one scope exclusion is the correction record, and it starts at cycle 2.** From the second
cycle onward the scout omits `plans/**` from the brief, so the loop stops reviewing the prose it
wrote last cycle. The **PR body stays in the brief** — it is what a human reads first, and on a
plans-only PR the plan itself is the shipping surface and stays too. This is not generated-file filtering by another name: those files are
excluded because the **loop itself authored them**, not because a tool emitted them, and cycle 1
still reviews them in full. See
[Loop-Exit and Block Rules](../../../workflows/pr/pr-review-cycle/loop-exit-and-block-rules.md)
for the rule and the PR #239 evidence behind it.

Two mechanics keep this full-diff posture tractable rather than merely expensive:

- **Shared context, extracted once.**
  [`pr-review-scout-maker`](../../../../.agents/agents/pr-review-scout-maker.md) assembles the PR
  metadata, linked-plan/issue context, and the full diff **once** into a single shared-context
  brief every specialist reads, rather than each specialist separately re-deriving the same context
  (which would multiply token cost by the number of specialists) — this extraction is the scout's
  job, not `pr-review-synthesis-maker`'s.
- **Scout-discretion large-diff slicing.** For a `full`-tier PR whose diff exceeds a
  specialist's comfortable context budget, `pr-review-scout-maker` MAY have specialists review
  per-domain-relevant file slices rather than the whole diff at once, recording the slicing choice
  in the shared-context brief for `pr-review-synthesis-maker` to carry into the review header it
  posts. If a diff still cannot be reviewed in one fan-out, the scout records an explicit
  "diff exceeds single-review scope — reviewed in N slices" note in the brief rather than silently
  under-covering it.
