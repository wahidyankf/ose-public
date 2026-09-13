# Web Design Tester Agent — Plan

> **Status**: Done (created 2026-06-20, promoted 2026-06-20, completed 2026-06-20). Executed directly
> on each repo's `main` (no worktrees); landed topic-identically in ose-public, ose-primer, and
> ose-infra, all CI-green.

## Context

The repository runs an **advocate triad** of live-site "tester" agents, each judging a running
website through a different professional lens:

- **`web-exploratory-tester`** — the QA/correctness advocate. Spec-aware: reads `specs/**` Gherkin,
  recomputes values, hunts functional / edge-case / behavioural-consistency defects. Answers _"is it
  correct?"_ [Repo-grounded — `.claude/agents/web-exploratory-tester.md`]
- **`web-usability-tester`** — the end-user advocate. Spec-blind: judges only first-time-user
  comprehension against Nielsen's heuristics + cognitive walkthrough. Answers _"is it usable?"_
  [Repo-grounded — `.claude/agents/web-usability-tester.md`]

This plan adds the **third lens that completes the triad**: `web-design-tester` — the **design-team
advocate**. It answers _"does the live site match the design and follow good design practice?"_ —
distinct from correctness and from usability. It judges the **live rendered page** against five
ground-truth sources (mockups, runtime tokens/theme, design-system primitives, an optional external
design source, and general design best-practice) and files its findings (`DWT-###`) as a new backlog
plan, exactly like its two siblings (triad symmetry).

A hard boundary is pinned throughout: **`web-design-tester` = live mockup/token fidelity + design
practice on a RUNNING page**; **`swe-ui-checker` = static source token/a11y/pattern compliance** (it
reads component source and writes `generated-reports/`, never drives a browser)
[Repo-grounded — `.claude/agents/swe-ui-checker.md` frontmatter `tools: Read, Glob, Grep, Write, Bash`].
The two must not overlap: design-tester is the runtime counterpart, not a duplicate.

## Scope

**In scope** (governance + agent-definition work only — no `apps/`/`libs/`/`specs/` source touched):

- Author the new `web-design-tester` agent definition modelled structurally on the two existing
  tester agent files (charter, methodology, ground-truth sources, filing format, evidence/locale
  awareness, governance alignment).
- **Make the three testers reciprocally complement each other** (Phase 1b): update
  `web-exploratory-tester` and `web-usability-tester` so all three agent definitions cross-reference
  each other and pin their non-overlapping boundaries (correctness ≠ usability ≠ design; all three ≠
  `swe-ui-checker`'s static-source audit).
- Register the agent across every governance/catalog surface (agent-naming convention, agents
  README, `AGENTS.md`, the web workflow + workflows README).
- Extend the combined web workflow from **two testers to three**, **renaming it to
  `web-ux-test-fixing-planning`**, keeping findings source-attributed (`EWT-###` / `UWT-###` /
  `DWT-###`) and synthesizing into ONE plan.
- **Add the web-UI-feature-change 3-tester governance rule**: expand Rule 15 of the User-Facing
  Delivery Hardening Convention from a single `web-exploratory-tester` near-end retest into the full
  three-tester triad, and keep it consistent across `AGENTS.md`, `plan-execution`, `plan-maker`,
  `plan-checker`, and `plan-execution-checker` — a web-UI feature-change plan runs all three testers
  near the end, records findings as `delivery.md` checkboxes, and fixes them in the same execution.
- Re-sync the multi-harness bindings (`.opencode/`, `.amazonq/`, `.codex/`) and pass the binding
  validators.
- Land the change **topic-identically** in all three sibling repos (`ose-public`, `ose-primer`,
  `ose-infra`) with repo-specifics localized (`libs/web-ui`↔`libs/ts-ui`,
  `specs:coverage`↔`spec-coverage`, app/lib names) — surgical-topic propagation, **not** byte-copy.
- Run a **`repo-rules-maker` consistency sweep** in each repo after propagation to weave the new
  rules consistently across every governance surface.

**Out of scope**:

- Any change to application or library source under `apps/` or `libs/` (this is governance + agent
  defs only).
- Building a `web-design-checker`/`-fixer` pair — the triad is three _testers_, not a maker-checker-
  fixer set.
- Modifying the two existing tester agents beyond the **required reciprocal** cross-reference /
  relationship updates that seat the third lens.
- Executing any live-site design test as part of this plan (this plan _creates the capability_; it
  does not _run_ it).

## Affected Apps / Libs

None at the source level. The agent will, at _invocation_ time, drive a browser against whatever
running site it is pointed at and read `libs/web-ui` (ose-public) / `libs/ts-ui` (primer/infra) as
ground truth — but this plan ships no code into those projects.

## Business & Product Rationale

See [`brd.md`](./brd.md) (WHY) and [`prd.md`](./prd.md) (WHAT). In short: automated gates and the
two existing testers never assert that a running page _matches its design system and mockups at
runtime_ — that gap is exactly how off-design, token-divergent, reinvented-component UI reaches
production while every gate is green. `web-design-tester` closes that gap on demand and completes the
advocate triad.

## Technical Approach

See [`tech-docs.md`](./tech-docs.md) for the agent architecture, the five ground-truth sources, the
`swe-ui-checker` boundary, the three-tester workflow extension, the per-repo registration surface
table, the localization map, and the diagrams. This is an **agent-definition + governance-doc** plan:
agent-def and governance work is **doc-shaped** (direct action + acceptance criterion), not TDD —
there is no compiled validator to write tests against. The specs/Gherkin two-path rule does **not**
apply because no `apps/`/`libs/`/`specs/` behavior changes (exemption stated explicitly in
`tech-docs.md` §Specs & Gherkin Exemption).

## Delivery

See [`delivery.md`](./delivery.md) for the phased, gated, `[AI]`/`[HUMAN]`-tagged checklist (all work
runs directly on each repo's `main` — no worktrees): Phase 0 baseline → Phase 1 author the agent →
Phase 1b reciprocal triad complement → Phase 2 register surfaces + rename the workflow to
`web-ux-test-fixing-planning` → Phase 2c web-UI 3-tester governance rule → Phase 3 re-sync bindings +
validate → Phase 4 gates + push ose-public → Phase 5 verify → Phase 6 propagate to ose-primer →
Phase 7 propagate to ose-infra → Phase 7b `repo-rules-maker` sweep (all three repos) → Phase 8 final
verification + archival.

## Document Map

| File                             | Purpose                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| [`README.md`](./README.md)       | This file — context, scope, navigation                              |
| [`brd.md`](./brd.md)             | Business Requirements — WHY the third lens exists                   |
| [`prd.md`](./prd.md)             | Product Requirements — WHAT gets built; Gherkin acceptance criteria |
| [`tech-docs.md`](./tech-docs.md) | Architecture, ground-truth sources, registration surfaces, diagrams |
| [`delivery.md`](./delivery.md)   | Phased, gated delivery checklist (Phase 0 first; `[AI]`/`[HUMAN]`)  |

## Branch Strategy — Direct on `main`, No Worktrees

Per the maintainer directive for this plan, **all work runs directly on the `main` branch of each
repo's primary checkout — no `git worktree` is created** (this overrides the usual plan-execution
worktree default). Trunk-Based Development applies: stage explicit paths, commit thematically, and
`git push origin HEAD:main` from each repo's checkout.

> **Note** — this plan edits files in three sibling repos (`ose-public`, `ose-primer`, `ose-infra`).
> Each repo is edited directly on `main` in its own primary checkout. `ose-infra` is edited in place
> at `~/ose-projects/ose-infra` on `main` (confirm `git status` works there first) — see
> `delivery.md` Phase 7.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
