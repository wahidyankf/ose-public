---
description: What runs before and after a grooming sweep, the conventions its reductions are measured against, and the workflows it deliberately never calls.
when_to_use: Use when navigating from this workflow to a composed workflow or a governing convention.
---

# Related Workflows and Documentation

## Composed

- [rules-propagation](../../quality/rules-propagation.md) — the sole writer. Every approved reduction is
  handed to it at Step 6; it performs the conflict scan, placement, consolidation, enforcement
  disposition, and delivery. Grooming calls it; it never calls grooming.

## Deliberately Not Composed

- [rules-quality-gate](../../quality/rules-quality-gate.md) — runs only when a user explicitly names it, and
  scopes itself to one affected rule. Grooming neither invokes it nor is invoked by it; the two
  answer different questions, and wiring them would create the cycle both workflows were shaped to
  avoid.

## Sibling Pattern

- [plan-ideas-grooming](../../plan/plan-ideas-grooming.md) — the same grooming class applied to
  `plans/ideas/`: a recurring, trigger-gated sweep over accumulated state, with no zero-findings
  convergence. Read it for the class's shape.

## Governing Conventions

- [Content Preservation Convention](../../../development/quality/content-preservation.md) — the
  MOVE-NOT-DELETE rule and the verification checklist every fragmentation and duplication reduction
  is measured against. Grooming supplies the discovery and the ranking; this convention supplies
  the preservation standard.
- [Governance Word-Budget Convention](../../../conventions/structure/governance-word-budget.md) —
  the per-surface thresholds the census measures headroom against. Thresholds are capacity
  ceilings; grooming never changes one.
- [Governance Word-Budget Remediation](../../../conventions/structure/governance-word-budget-remediation.md)
  — the four forbidden anti-fixes. Two of them bound this workflow directly: it never deletes a
  rule for capacity, and it never compresses prose.
- [Governance README Completeness](../../../conventions/structure/governance-readme-completeness.md)
  — the annotated-index requirement a fragmentation merge must leave satisfied.
- [Repo Rules — Membership Test](../../../glossary/repo-rules-membership-test.md) — what the
  corpus actually contains, and therefore what the census measures.
- [Minimal Sufficiency Test](../../../principles/general/simplicity-over-complexity/minimal-sufficiency-test.md)
  — the principle this workflow operationalizes. Minimal sufficiency is stated as a test applied
  when authoring; grooming applies it retroactively, at corpus scale.
- [Progressive Disclosure](../../../principles/content/progressive-disclosure.md) — the principle
  whose over-application produces the fragmentation class. Grooming is its counterweight, not its
  opponent: it re-merges only where a split bought no reachability.

## Agents

- `rules-checker` — runs the obligation inventory at Steps 2 and 7 and all four discovery sweeps
  at Step 3. Its existing agent-to-agent and Skill-to-Skill duplication detection is the closest
  precedent for the duplication sweep, extended here to governance prose.
