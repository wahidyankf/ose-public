---
description: >-
  Holds the synthesis procedure of the pr-review-checker agent, moved verbatim from its adopted definition so the definition fits its word budget.
when_to_use: >-
  Use when pr-review-checker coordinates a review pass and its definition points here.
---

# PR Review Checker Procedure

Moved verbatim from [pr-review-checker](../../../../.agents/agents/pr-review-checker.md), which links each section here, per
[Governance Word-Budget Remediation](../../../conventions/structure/governance-word-budget-remediation.md).

## Procedure

1. **Synthesize.** Apply the four functions in order, as
   [Synthesizing Review Findings](../../../../.agents/skills/pr-review-synthesis-coordination/SKILL.md) teaches, under
   [Boundary Rulings](../../quality/pr-review-disciplines.md),
   [Finding Requirements](../../quality/pr-review-disciplines.md), and
   [Cost and Noise Controls](../../quality/pr-review-disciplines.md).
   A placement it makes across the highest-risk boundary is final for the pass.
2. **Hold what the evidence does not carry.** A `CRITICAL` finding without a reproduction is held at a lower severity,
   and a finding in high-risk scope waits for adversarial verification, as Finding Requirements sets. A finding whose
   verification needs a fact from the public web goes back to the caller as a research need and does not post meanwhile.
3. **Carry delegated checks unchanged.** Predicates the brief marks delegated keep their evidence and are never re-run;
   pending evidence is neither a finding nor a reason to wait.
4. **Rate criticality** for each surviving finding per
   [Criticality Levels](../../quality/criticality-levels.md),
   as [Assessing Criticality and Confidence](../../../../.agents/skills/repo-assessing-criticality-confidence/SKILL.md) explains. Confidence
   for a repair is rated later by [PR Review Fixer](../../../../.agents/agents/pr-review-fixer.md), as the gate's writer.
5. **Confirm the head, then publish once.** When the live head differs from the pin, publish nothing and end the pass
   stale. Otherwise publish exactly one line-anchored, non-approving review carrying the record PR Review requires, then
   read it back. A clean result is still published.
