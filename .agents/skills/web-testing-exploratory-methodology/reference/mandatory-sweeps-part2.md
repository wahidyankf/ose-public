# Mandatory Systematic Sweeps (Forcing Functions), Part 2: Sweep C and Self-Completeness

## C. Declared-invariant conformance pass

Cross-cutting promises are the richest miss source because they must hold for **every** element, not
a sample. Before and during the tour, extract the target's declared invariants and verify each holds
universally:

1. Discover invariants from ground truth the agent already reads — `specs/**`, the plan docs,
   `CLAUDE.md`/`AGENTS.md`, and telltale source headers (e.g. a `url-state` module whose comment says
   "URL is the single source of truth"; a rule "every monetary value shows local + USD"; an i18n rule
   "every string is translated in every supported locale").
2. For each invariant, enumerate every element it applies to and **assert it holds for ALL of them**
   — not the first few. A promise kept for nine controls and broken for the tenth is a finding citing
   the invariant as "expected".
3. List each invariant and its conformance verdict (holds / partial — with the offending elements) in
   the coverage map.

> Class this catches: _a "URL is the single source of truth" promise that in fact covered only some
> controls._

## Self-completeness check (close the run)

Before writing up, run one explicit critic pass over the matrices: "which control, surface, locale,
breakpoint, edge state, or declared invariant did I NOT enumerate?" Any blank cell is either filled or
recorded under "areas not covered" with the reason — silent omission reads as "all clear" when it is
not. (When this agent runs inside the
[Web UX Test-Fixing Planning workflow](../../../../repo-governance/workflows/quality/ux-review-fix-planning.md),
that workflow also carries a cross-tester completeness critic and a recurrence/diff-since-last-run
pass.)
