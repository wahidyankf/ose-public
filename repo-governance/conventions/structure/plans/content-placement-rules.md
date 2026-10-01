---
description: Gives the authoritative split of which content belongs in brd.md versus prd.md, including how to write success metrics and handle cross-cutting concerns.
when_to_use: Use when deciding whether a piece of plan content belongs in brd.md or prd.md.
---

# Content-Placement Rules (brd.md vs prd.md)

Authoritative split between `brd.md` and `prd.md`. These rules are normative for `plan-maker` / `plan-checker` / `plan-quality-gate` — the agents share one definition to avoid drift.

> **Solo-maintainer framing**: BRD and PRD are **content-placement containers**, not sign-off artifacts. This repo has one maintainer collaborating with AI agents; code review (the PR) is the only approval gate. The convention MUST NOT introduce sponsor sign-off, stakeholder approval ceremonies, or role-based gates.

**Goes in `brd.md` (business perspective)**:

- Business goal and rationale ("why are we doing this")
- Business impact (pain points, expected benefits)
- Affected roles (which hats the maintainer wears; which agents consume the file) — **not** sign-off mapping
- Business-level success metrics. BRD does not require every claim to be data-driven — gut-based reasoning is acceptable **when the logic supports the claim**. What is NOT acceptable: fabricated numeric targets (percentages, durations, counts) presented as already-measured facts when no baseline exists. Options when writing a success metric:
  1. **Observable fact** (preferred): cite a grep/git/agent-round-trip check that verifies on demand (e.g., "zero plans using the deprecated layout after migration").
  2. **Cited measurement**: reference an existing dashboard, prior measurement, or external data source. When you cite data pulled from the internet, include the data itself in the plan (specific number, quote, excerpt) alongside the URL and the access date. URL-only citations are not enough — links rot.
  3. **Qualitative reasoning**: state the structural claim plainly without a number.
  4. **Gut target**: allowed, but MUST be worded explicitly as an expectation with no measured baseline (e.g., "we expect review time to drop; no baseline measured"), with no inline confidence label.
- Business-scope Non-Goals
- Business risks and mitigations

**Goes in `prd.md` (product perspective)**:

- Product overview (what is being built)
- Personas (hats the maintainer wears; agents that consume the file) — **not** external stakeholder roles
- User stories (`As a … I want … So that …`)
- Acceptance criteria in Gherkin
- Product scope (in-scope features, out-of-scope features)
- Product-level risks (UX, feature interaction)

**Ambiguous cases**: When a concern is genuinely cross-cutting (e.g., a success criterion is both a business-level fact and a product acceptance criterion), place the **factual claim or judgment** in `brd.md` and the **testable scenario** in `prd.md`, cross-linking between them. Do not duplicate the full content. If the BRD side is a judgment call rather than a measured fact, label it as such — do not fabricate a number and pretend it was measured.
