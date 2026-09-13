# Enforce Repo-Wide Gherkin Scenario Implementation (All Apps/Libs, All Tiers)

**Status**: Completed 2026-07-04
**Created**: 2026-07-03
**Authored in**: `ose-public` (this repo)
**Type**: Multi-file plan (5 documents)
**Depends on**: [`enforce-identical-rhino-cli-gherkin`](../../done/2026-07-04__enforce-identical-rhino-cli-gherkin/README.md)
— **DONE and archived 2026-07-04** (rhino-cli is fully enforcing, `fail_on_skipped` on, `@covers`
complete for rhino-cli, across all three repos). rhino-cli is the **reference implementation** whose
pattern this plan generalizes to every app and lib.

## Context

The repo already ships a **designed** mechanism for scenario coverage — `rhino-cli specs behavior-coverage
validate`: every scenario self-tags required levels (`@unit`/`@integration`/`@e2e`), tests declare
`// @covers <spec-path>:<scenario-title>` markers, and the gate passes when marker-levels == tagged
levels. It is tier-aware and runs repo-wide at pre-push (`specs:behavior:coverage`) and CI (`main-ci`
`run-many --all`). [Repo-grounded]

Two holes make it toothless today (both found in the rhino-cli audit):

1. **Marker ≠ implementation.** The gate checks a `// @covers` _comment_ exists — not that the covering
   test actually **executes and passes**. rhino-cli had **121/228 scenarios skipped** at runtime while the
   gate stayed green; no tier has a runtime "fail-on-skip" guard. [Repo-grounded]
2. **Adoption is rhino-cli-only.** `@covers` markers exist in **8 files, all rhino-cli — 0 in any other
   app or lib**, even though non-rhino specs carry level tags and CI runs the target repo-wide (so it is
   either lenient/no-op for them or would fail — a Phase-0 item). [Repo-grounded]

The [rhino-cli plan](../../done/2026-07-04__enforce-identical-rhino-cli-gherkin/README.md) fixes rhino-cli's
own slice (de-hollow + `fail_on_skipped` + `@covers` completeness). **This plan generalizes that to every
eligible app and lib, for unit/integration/e2e, and upgrades the central gate so "covered" means "a real
test ran and passed".**

## Scope

**In scope:**

- **`@covers` + level-tag rollout** — every eligible app/lib in the `coverage.projects` registry gets its
  scenarios level-tagged (`@unit`/`@integration`/`@e2e`) and its tests marked with matching `// @covers`
  markers, so `specs behavior-coverage validate` passes meaningfully (not vacuously).
- **Per-tier fail-on-skip** — each test tool, **across all twelve language/tool ecosystems this repo set
  spans** (not just `ose-public`'s TS/F#/Rust/Playwright set), is configured so a skipped/absent/todo test
  **fails**: cucumber-rs `.fail_on_skipped()` (already done for rhino-cli), Jest/Vitest, Playwright, .NET
  xunit (F#/C#), plus — because `ose-primer`'s 11 `crud-be-*` language-showcase variants, its 4
  `crud-fe-*`/`crud-fs-*` frontend/fullstack variants, and its polyglot lib set
  (`golang-commons`, `clojure-openapi-codegen`, `elixir-{openapi-codegen,cabbage,gherkin}`) each bring
  their own runner — Kaocha (Clojure), ExUnit (Elixir), Go `testing`, JUnit5 (Java ×2 + Kotlin), pytest
  (Python), Cargo `#[ignore]` (Rust, also `ose-infra`'s `coralpolyp-be`), cucumber-js (the TS/Effect BDD
  suite), and Dart/Flutter `test`. The exact skip/fail-on-skip flag or guard per tool is **confirmed in
  Phase 0** (verified via `--help`/docs, never assumed) — see tech-docs.md §3.1 for the full per-tool
  table. Fast local feedback.
- **Central runtime cross-check** — upgrade `rhino-cli specs behavior-coverage` (or add a sibling
  command) to ingest each tier's **run results** and fail unless every `@covers` scenario actually
  **executed and passed** (not merely marked). Authoritative CI gate.
- **Wiring** — the new runtime cross-check joins pre-push (`specs:behavior:coverage`) + CI, repo-wide.
- **Per-repo application (comprehensive, all three repos)** — each of `ose-public` (26 registered
  projects), `ose-primer` (25 — `rhino-cli` + 11 `crud-be-*` variants + `crud-be-e2e` + 3 `crud-fe-*`
  variants + `crud-fe-e2e` + `crud-fs-ts-nextjs` + `golang-commons` + `ts-ui` + `ts-ui-tokens` +
  `clojure-openapi-codegen` + `elixir-{openapi-codegen,cabbage,gherkin}`), and `ose-infra` (8 —
  `rhino-cli`, `coralpolyp-{contracts,be,be-e2e,fe,fe-e2e}`, `ts-ui-tokens`, `ts-ui`) applies the rollout
  to **its own** `coverage.projects` registry — **59 projects total, none left out**; the **engine change**
  (rhino-cli command) is byte-identical and propagated to all three (rhino-cli parity, per the dependency
  plan's boundary).

**Out of scope:**

- rhino-cli's own de-hollow/tiers/`@covers` — delivered by the dependency plan.
- Authoring **new** behaviour (scenarios) — this plan makes existing scenarios genuinely enforced; net-new
  behaviour belongs to feature plans.
- Changing validator/app logic — enforcement wiring only, except where a scenario is found unimplemented
  and a real test must be written to satisfy it (that is the point).

## Approach Summary

1. **Phase 0** — audit: per-project scenario census, current `@covers` adoption (expected: rhino-cli
   only), per-tier skip/only/todo inventory, and whether `behavior-coverage` currently passes vacuously
   for non-rhino projects. Clean baseline.
2. **Phase 1** — engine: upgrade `rhino-cli specs behavior-coverage` to the **runtime cross-check** (TDD),
   using rhino-cli's own now-enforcing suite as the first consumer; propagate the byte-identical rhino-cli
   change to primer + infra.
3. **Phase 2** — per-tier fail-on-skip config for every tool (Jest/Vitest, Playwright, F#), repo-wide.
4. **Phase 3..N** — per-project `@covers` + level-tag rollout, one bounded batch per phase (each phase a
   natural pause with a green gate), fixing any scenario the runtime cross-check reveals as
   unimplemented.
5. **Final phase** — wire the runtime cross-check into pre-push + CI in all three repos; cross-repo verify
   the engine parity; archive.

## Confirmed Decisions (user-ratified 2026-07-03)

1. **Separate plan** (not folded into the rhino-cli plan) that **assumes the rhino-cli plan is done**.
2. **Enforcement = BOTH** per-tier fail-on-skip (fast local) **and** a central `behavior-coverage` runtime
   cross-check (authoritative CI gate) — maximum enforcement.
3. Scope = **all eligible apps/libs** in the coverage registry, for **unit/integration/e2e**.
4. **NO DEFER, NO SHORTCUT (hard rule)** = the hollow scenarios exist precisely because prior work
   deferred and shortcut. This plan forbids both. Every scenario in a batch is **fully implemented and
   passing** before that batch's gate — no `@wip`, no `.skip`/`.only`/`.todo`, no marker-without-a-real-
   test, no stub, no "temporarily deferred", no partial batch. A scenario that cannot be made to pass
   means its behaviour is built or the scenario is corrected/removed as an invalid spec (with rationale)
   — never parked. `@wip` is **not** an escape hatch in this plan.

## Navigation

- [brd.md](./brd.md) — why this matters
- [prd.md](./prd.md) — personas, user stories, Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — current state, engine design, per-tier fail-on-skip, file impact
- [delivery.md](./delivery.md) — phased execution checklist

## Related

- [Dependency: enforce-identical-rhino-cli-gherkin](../../done/2026-07-04__enforce-identical-rhino-cli-gherkin/README.md)
- `repo-config.yml` `coverage.projects` — the per-project tier registry this plan drives
- [Feature Change Completeness](../../../repo-governance/development/quality/feature-change-completeness.md)
- [nx-targets reference](../../../repo-governance/development/infra/nx-targets.md)

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
