---
title: Gherkin Step-Keyword Cardinality — Parity Decisions (2026-06-07)
description: >-
  Explanation of every decision in the 2026-06-07 cross-repo parity deviation
  matrix for the gherkin-step-keyword-cardinality plan: what was decided across
  all 13 rows, why, and what makes each deliberate deviation acceptable.
category: explanation
tags:
  - gherkin-step-keyword-cardinality
  - multi-repo
  - governance
  - decision-log
created: 2026-06-07
---

# Gherkin Step-Keyword Cardinality — Parity Decisions (2026-06-07)

This document records every decision in the cross-repo deviation matrix for the
`gherkin-step-keyword-cardinality` plan (2026-06-07). The plan ships an explicit
HARD Gherkin convention rule — one primary `Given`, one `When`, one `Then` per
`Scenario` — across the sibling repositories: ose-public (this repo) and
the private sibling. The full matrix lives in
[`plans/done/2026-06-07__gherkin-step-keyword-cardinality/tech-docs.md`](../../plans/done/2026-06-07__gherkin-step-keyword-cardinality/tech-docs.md).

Sibling plan:

- The private sibling: `plans/done/2026-06-07__gherkin-step-keyword-cardinality/` (private repo)

> **Historical record.** This log describes the `gherkin-step-keyword-cardinality` run of
> 2026-06-07, re-scoped to the current parity pair. Read the decisions below as history, not as
> current routing.

## Background

The sibling repositories share a governance layer originally authored in ose-public.
The step-keyword cardinality rule was implicit — skilled authors applied it, but nothing
stated it formally. This plan makes the rule explicit, enforces it with a deterministic
linter, and retrofits the existing `.feature` corpus. Because the repos differ in
architecture (private CI in the private sibling, public GitHub-hosted CI in ose-public), the plan
carries deliberate per-repo deviations. All deviations were recorded before execution began.

## Row-by-Row Decisions

Row numbers follow the plan's full deviation matrix. Rows that no longer bind the current parity
pair are omitted, so the sequence below skips.

### Row 1 — Plan Handling

**Decision**: ose-public's existing plan updated in place; sibling plans authored fresh.

**Rationale**: The ose-public plan predated the parity run with zero items executed. A
validated plan structure with gated phases represents authoring work that should not be
discarded. Starting from the existing plan is cheaper and more correct than replacing a
zero-executed, fully-gated plan with an identical fresh one.

### Row 2 — Linter Architecture

**Decision**: ose-public and the private sibling add the `gherkin-keyword-cardinality` category to the
existing `audit_orchestrator.rs` pattern.

### Row 3 — Retrofit Phases

**Decision**: Aligned across all repos. Every repo runs linter-driven per-project retrofit
with graceful zero-offender handling (if the linter reports zero violations for a project, no
edits are made but the gate still runs).

**Rationale**: The exact violation count per project is unknown at authoring time. Fabricating
counts in advance would violate the anti-hallucination rule. The linter is the authoritative
check; authors discover offenders at execution.

### Row 4 — Governance Sweep

**Decision**: Aligned. Every repo runs a `rules-maker`-driven sweep.

**Rationale**: Both repos carry the `rules-maker` agent. The rule propagation
pattern is the same in every repo, so no deviation is warranted.

### Row 5 — Skill Propagation

**Decision**: Aligned. Every repo manually edits the two Gherkin-referencing skill packages
(`plan-writing-gherkin-criteria` and `plan-creating-project-plans`) and re-syncs secondary
bindings via `npm run generate:bindings`.

**Rationale**: Both repos carry both skills and the binding generator. The rule
propagates identically through both skill packages in every repo.

### Row 6 — Quality-Gate Preflight (Deliberate Deviation)

**Decision**: ose-public adds the `gherkin-keyword-cardinality` category to the existing
Step 0.5 deterministic-preflight enumeration in `rules-quality-gate.md`. The private sibling
first ports the Step 0.5 deterministic-preflight section into its own
`rules-quality-gate.md`, then enumerates the new category.

**Why the deviation is acceptable**: The sibling repo's quality-gate workflow predates the
Step 0.5 preflight pattern (introduced in ose-public after the sibling repo was last
synchronized). The correct response is to port the pattern first and then add the new
category — not to wire around the pattern gap. The result in both repos is the same
final state: Step 0.5 present with the new category enumerated.

### Row 7 — CI Wiring (Deliberate Deviation)

**Decision**: Each repo wires the audit through its own CI topology. ose-public uses its
existing governance-audit CI path. The private sibling uses `validate-markdown.yml` on a self-hosted
runner (`[self-hosted, linux, ose-self-hosted]`).

**Why the deviation is acceptable**: CI topology differs per repo in ways that cannot be
unified. The private sibling runs on private self-hosted runners and cannot use `ubuntu-latest`, so
forcing a single CI shape across both repos would break its runner constraints.

### Row 9 — Linter Scan Scope

**Decision**: Aligned. All repos scan `**/*.feature` minus a common exclusion set: build
outputs (`bin/`, `build/`, `target/`, `dist/`, `node_modules/`), `worktrees/`, `archived/`,
and BDD-library self-test fixtures (`libs/elixir-cabbage/test/features/` and
`libs/elixir-gherkin/test/fixtures/`).

**Rationale**: The net effect today equals `specs/**` in every repo, but the aligned exclusion
list is future-proof — if feature files appear outside `specs/` later, they will be caught.
The Elixir fixtures test the Gherkin parser itself and may deliberately contain unusual keyword
shapes; excluding them prevents false positives.

### Row 10 — Rationale Doc Location

**Decision**: Aligned. Every repo writes the parity rationale doc at
`docs/explanation/gherkin-step-keyword-cardinality-parity-decisions.md`.

**Rationale**: Matches the precedent set by the `plan-domain-parity` effort
([`docs/explanation/plan-domain-parity-decisions.md`](./plan-domain-parity-decisions.md)).
Consistency with the established pattern makes the doc discoverable.

### Row 11 — Research

**Decision**: Aligned. Web research skipped in all repos.

**Rationale**: This is a purely internal governance and tooling change. All factual claims
carry `[Repo-grounded]`, `[Judgment call]`, or `[Unverified]` labels; no external library
versions, API signatures, or vendor behaviours are claimed.

### Row 12 — Stage / Gate Mode

**Decision**: Aligned. All repos execute in `in-progress` stage with `strict` gate mode;
double-zero is required (zero deterministic findings and zero confirmed AI-judgment findings).

**Rationale**: The parity set executes immediately after planning. Strict mode ensures the
rule is provably consistent repo-wide before any commit lands.

### Row 13 — Markdown-Gherkin Coverage

**Decision**: Aligned. No deterministic markdown linter covers Gherkin fences in `.md` files.
Plan-doc Gherkin in `plans/in-progress/` and `plans/backlog/` is caught by `plan-checker` AI
judgment criteria and by `rules-checker` judgment criteria during quality-gate sweeps.
`plans/done/` is exempt (immutable archive). This plan's execution also manually retrofits
active plans' markdown Gherkin to conform (Phase 14 in the delivery checklist).

**Rationale**: The invoker decided on 2026-06-07 that deterministic parsing of markdown fences
is out of scope — AI judgment suffices for plan markdown. Archived plans are immutable history
and match the existing sweep exclusions for `plans/done/`.

## Deviation Count

Four deliberate deviations (rows 2, 6, 7, 8); zero silent deviations. Every deviation is
documented here with an explicit justification. No deviation was introduced without a recorded
reason.

## Related Documentation

- [Acceptance Criteria Convention](../../repo-governance/development/infra/acceptance-criteria.md) — canonical rule text
- [Behaviour-Driven Development](../../repo-governance/development/behaviour-driven-development.md) — how specs are consumed
- [Plan Domain Parity — Design Decisions (2026-06-06)](./plan-domain-parity-decisions.md) — precedent doc this follows
- [Plan Delivery Checklist](../../plans/done/2026-06-07__gherkin-step-keyword-cardinality/delivery.md) — full phased execution plan
- [Technical Documentation](../../plans/done/2026-06-07__gherkin-step-keyword-cardinality/tech-docs.md) — deviation matrix source
