---
description: "Why the split exists."
when_to_use: "Use to orient to the split's purpose."
---

# Purpose

The single `pr-review-maker` monolith combined six-plus review concerns into a single prompt,
which gave no reviewer a documented reason to stay out of another discipline's lane, and no rule
for where a finding that could plausibly belong to two disciplines should land. Splitting the
monolith into nine discipline-scoped specialists plus a coordinator only works if:

1. Every specialist's owned scope AND its explicit non-goals ("not its job → routes to X") live in
   one place both the specialists and the coordinator reference.
2. A written **tie-breaker rule** exists for a finding that does not cleanly belong to one
   discipline, so re-categorizing it is a lookup, not a fresh judgment call every cycle.
3. The recurring grey zones between adjacent disciplines are pre-decided once, not re-litigated by
   every coordinator pass.
4. The cost- and noise-control mechanics that make a nine-specialist fan-out affordable and quiet
   are documented alongside the disciplines they govern, not left as an unstated assumption.

Audience: the eleven pr-review agent definitions (nine lens checkers, `pr-review-scout`, and `pr-review-checker`), the
[PR Review Cycle workflow](../../../workflows/quality/pr-review-quality-gate.md) that optionally orchestrates
them, and any future contributor deciding whether a new class of finding needs its own discipline
or fits inside an existing one.
