# OrganicLever — Adopt Domain-Driven Design

**Status**: In Progress
**Owner**: Wahidyan Kresna Fridayoka
**Started**: 2026-05-02
**Scope**: `ose-public` only — `apps/organiclever-web/` and `specs/apps/organiclever/`
**Subrepo worktree**: REQUIRED — Scope A per the parent repo's Subrepo Worktree Workflow Convention. Run all delivery items inside `.claude/worktrees/organiclever-adopt-ddd/` after `cd ose-public && claude --worktree organiclever-adopt-ddd`; initialize the worktree per [Worktree Toolchain Initialization](../../../governance/development/workflow/worktree-setup.md). Publish path: **direct-to-main** (Trunk Based Development default for `ose-public`).

## Goal

Restructure `apps/organiclever-web` around explicit **bounded contexts**, **ubiquitous language**, and a **layered domain/application/infrastructure/presentation** code shape, and reflect the same context boundaries in `specs/apps/organiclever`. Behavior must not change. Tests are the safety net.

OrganicLever is the first product in this repo to formally adopt DDD. Authoritative DDD standards already exist in [`docs/explanation/software-engineering/architecture/domain-driven-design-ddd/`](../../../docs/explanation/software-engineering/architecture/domain-driven-design-ddd/README.md) — this plan applies them, it does not redefine them.

## Why now

- The web app already exhibits many bounded-context-shaped concerns (`journal`, `routine`, `workout`, `settings`, `stats`, `health`, `landing`) but they are flattened into `src/lib/*-machine.ts`, `src/lib/*-store.ts`, `src/services/`, and route folders. Cross-context coupling is implicit.
- Effect.ts (`Schema` + `Layer` + `ManagedRuntime`) and PGlite are already in place — a near-perfect fit for ports + adapters and explicit aggregates.
- Future product features (typed payloads beyond workout/reading, sync, multi-device, BE integration) will multiply complexity. Locking the bounded-context map and ubiquitous language **before** that growth is cheaper by an order of magnitude than untangling later.
- Repo-wide [DDD standards](../../../docs/explanation/software-engineering/architecture/domain-driven-design-ddd/README.md) require bounded-context alignment with Nx app structure but are currently unused by any product app.

## What changes

| Area                         | Change                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/apps/organiclever/`   | Add `ubiquitous-language/` folder (per-bounded-context glossary + index). Reorganize `fe/gherkin/` from per-route to per-bounded-context.                 |
| `apps/organiclever-web/src/` | Introduce `src/contexts/<bc>/{domain,application,infrastructure,presentation}/` for each bounded context. Migrate code into the layered shape, in phases. |
| Layering rules               | Enforce inward dependency rule (presentation → application → domain; infrastructure → domain) via ESLint boundaries plugin.                               |
| Governance                   | Add OrganicLever-specific bounded-context map ADR. Add ubiquitous-language convention. Update `apps/organiclever-web/README.md` and CLAUDE.md sections.   |

## What does **not** change

- No behavior change. No public-API change. No DB schema change. No new feature.
- F#/Giraffe `organiclever-be` is **out of scope**. Backend already has F# DDD standards available; a parallel BE plan can land later.
- DDD standards docs are not edited — they are the upstream authority.
- BDD/TDD conventions remain authoritative; this plan only adds DDD alignment on top.

## Bounded contexts (provisional)

| Context           | Owns                                                                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `journal`         | Append-only event log (PGlite-backed), typed payloads (workout/reading initially), bump operation. Source of truth for everything user did.         |
| `routine`         | Workout routine definitions (templates the user can run).                                                                                           |
| `workout-session` | In-progress workout state machine. Pure orchestration; persists outcomes via the journal context.                                                   |
| `stats`           | Read-model: rolling aggregates and progress projections derived from journal events.                                                                |
| `settings`        | User-local preferences (theme, locale, units).                                                                                                      |
| `app-shell`       | Cross-cutting frame: i18n, layout, theming primitives, navigation skeleton, app loggers. Not a domain — kept as a "supporting" context for clarity. |
| `health`          | Backend health-endpoint consumption + system-status diagnostic page.                                                                                |
| `landing`         | Marketing landing surface (`/`).                                                                                                                    |
| `routing`         | Disabled-route guards (`/login`, `/profile`).                                                                                                       |

The map is finalized in Phase 0 of [delivery.md](./delivery.md) before any code moves.

## Plan documents

| Document                       | Purpose                                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [README.md](./README.md)       | Overview + navigation (this file).                                                                                                              |
| [brd.md](./brd.md)             | Business rationale, success measures, risks.                                                                                                    |
| [prd.md](./prd.md)             | Product requirements with Gherkin acceptance criteria.                                                                                          |
| [tech-docs.md](./tech-docs.md) | Target architecture: bounded-context inventory, layering rules, ubiquitous-language file layout, ESLint boundaries config, migration mechanics. |
| [delivery.md](./delivery.md)   | TDD-shaped step-by-step checklist across 11 phases.                                                                                             |

## Out of scope (for this plan)

- F#/Giraffe `organiclever-be` DDD adoption.
- New product features.
- DB schema changes (PGlite migrations).
- Cross-context CQRS or event-sourcing infrastructure beyond what's already implicit in journal-as-event-log.
- Other apps (`ayokoding-web`, `oseplatform-web`, `wahidyankf-web`).

## Acceptance summary

This plan is done when **all** of the following are true:

1. Every bounded context in the map has a glossary file under `specs/apps/organiclever/ubiquitous-language/<context>.md` and an index `README.md`.
2. `specs/apps/organiclever/fe/gherkin/` is organized by bounded context, not by route. Each `.feature` file lives under exactly one bounded context.
3. `apps/organiclever-web/src/contexts/<context>/{domain,application,infrastructure,presentation}/` exists for each context and houses the migrated code.
4. ESLint boundary rule fails the build if a forbidden cross-layer or cross-context dependency is introduced.
5. All pre-existing tests, E2E scenarios, spec-coverage, and lint targets pass — no behavior or API change.
6. OrganicLever-specific bounded-context map ADR is committed under `apps/organiclever-web/docs/explanation/`.
7. The plan-execution-checker validates every Gherkin acceptance criterion in `prd.md` against the final state.

## Related

- [Domain-Driven Design (DDD) — Authoritative Standards](../../../docs/explanation/software-engineering/architecture/domain-driven-design-ddd/README.md)
- [BDD with DDD Standards](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/bdd-with-ddd-standards.md)
- [TDD with DDD Standards](../../../docs/explanation/software-engineering/development/test-driven-development-tdd/tdd-with-ddd-standards.md)
- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [Test-Driven Development Convention](../../../governance/development/workflow/test-driven-development.md)
- [Trunk Based Development Convention](../../../governance/development/workflow/trunk-based-development.md)
- [Worktree Toolchain Initialization](../../../governance/development/workflow/worktree-setup.md)
- [organiclever-web README](../../../apps/organiclever-web/README.md)
- [organiclever specs README](../../../specs/apps/organiclever/README.md)
