---
description: Explains why plan-parity-planning exists, the precedent that motivated it, and when to use it.
when_to_use: Use when deciding whether a cross-repo objective needs this workflow's grilling discipline.
---

# Purpose, Scope, and When to Use

**Purpose**: Orchestrate the creation of parallel plans across multiple sibling repositories for a
shared objective (such as standardizing commands, aligning agent catalogs, or expanding CI gates),
grilling the invoker relentlessly about cross-repo gaps and deviations so that every difference
between the resulting plans is intentional, decided, and durably recorded. The defining
characteristic of this workflow is its grilling contract: no plan authoring begins while any
cross-repo difference remains unexamined. The result is NOT a set of 1-to-1 identical plans
— it is a set of plans whose every divergence from each other is intended and documented.

**Motivating precedent**: The markdown-gate-coverage-expansion parity effort (2026) produced plans
in three sibling repositories. Each repo had a different starting state: different CI configurations,
different gate coverage, different toolchain constraints. The aligned-but-divergent plans that
resulted from that effort — each tuned to its repo's reality, each cross-linking the others, each
documenting why it differed — demonstrated the pattern this workflow formalizes.

**When to use**:

- When the same structural improvement is needed across multiple sibling repos but each repo may
  need a different implementation path
- When you want to avoid silent drift between repos that are supposed to move in parallel
- When the cross-repo decision surface is large enough that ad-hoc grilling would miss cells
- When the invoker can be in any one of the parity repos at invocation time
