# BRD — OrganicLever DDD Adoption

## Business problem

OrganicLever is the first product in `ose-public` past v0 — beyond the marketing landing page and a single PGlite-backed event mechanism. Two forces are about to compress the codebase:

1. **Feature growth** — typed-payload journal events will expand from `workout` and `reading` toward many more domains (sleep, prayer, habit, learning sessions, finance, ibadah recurrences). Each one introduces new invariants and new stats projections.
2. **Cross-cutting integrations** — backend sync, multi-device, encryption-at-rest, optional cloud auth, eventual sharia-compliance reporting. All cut across the same data the v0 frontend already owns locally.

The current code shape has flat folders (`src/lib/journal-store.ts`, `src/lib/workout-machine.ts`, `src/services/`). Concerns are co-located by file-type, not by domain. Without a structural reset, every new feature widens the implicit coupling between journal, workout, stats, and settings — and every new contributor has to re-derive what "journal", "routine", "session", and "bump" mean in code from how the surrounding code happens to use them.

## Proposed solution

Adopt Domain-Driven Design for `apps/organiclever-web` using the repo's already-authoritative DDD standards:

- **Bounded contexts** mapped explicitly. Each context owns its language and its persistence model.
- **Ubiquitous language** captured per bounded context as glossary files in `specs/apps/organiclever/ubiquitous-language/`. Same terms must appear verbatim in Gherkin scenarios and code identifiers.
- **Layered code shape** (`domain` → `application` → `infrastructure` + `presentation`) per bounded context, enforced by ESLint boundaries.
- **Specs reorganized** by bounded context instead of by route, so the spec tree mirrors the context map.
- **No behavior change** — pure structural migration with tests as the safety net.

## Why DDD specifically

The repo already mandates DDD for OSE Platform Islamic-finance systems and ships authoritative tactical/strategic standards. OrganicLever, a productivity tracker, has narrower domain rules but the same shape: stable invariants (an event is append-only; a session can only end if started; stats projections derive from events), a clear ubiquitous language emerging in user-facing copy, and natural bounded-context seams already visible in the file structure. Adopting DDD here:

- proves the standards on a non-financial product before extending them across the platform,
- gives the team a working reference implementation for future products,
- aligns with the existing Effect.ts + PGlite stack, which already encourages ports + adapters.

## Success criteria

| #   | Measure                                                                                                                         | Target                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Bounded-context map documented as ADR under `apps/organiclever-web/docs/explanation/`.                                          | 1 ADR, lists every context with one-line description and explicit relationships. |
| 2   | Per-context glossary files exist under `specs/apps/organiclever/ubiquitous-language/`.                                          | One file per context + index README.                                             |
| 3   | Code organized as `src/contexts/<bc>/{domain,application,infrastructure,presentation}/`.                                        | Every non-app-router source file lives under exactly one context folder.         |
| 4   | ESLint boundary rule enforces inward dependency direction and forbids cross-context imports outside published application APIs. | Build fails on violation in CI.                                                  |
| 5   | `specs/apps/organiclever/fe/gherkin/` reorganized by bounded context.                                                           | Each `.feature` file lives under exactly one bounded context.                    |
| 6   | All existing pre-push targets pass (`typecheck`, `lint`, `test:quick`, `spec-coverage`) plus FE E2E and integration suites.     | Zero behavioral regressions.                                                     |
| 7   | Coverage threshold for `organiclever-web` not regressed below current 70%.                                                      | ≥70% line coverage post-migration.                                               |

## Risks

| Risk                                                                                                   | Likelihood | Impact | Mitigation                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migration introduces silent behavioral regressions despite "no behavior change" rule.                  | Medium     | High   | Strict TDD: never move code without tests passing both before and after. Phased migration (one context at a time). FE E2E and integration tests as final gate.                                            |
| Bounded-context boundaries drawn wrong; rework cost compounds.                                         | Medium     | High   | Phase 0 ADR review before any code moves. Cross-reference with existing Gherkin domains and current `src/lib/*` cluster. Treat boundaries as revisable.                                                   |
| Ubiquitous-language glossary drifts from code/Gherkin over time.                                       | High       | Medium | Add a parity check (Phase 9) flagging Gherkin terms not in any glossary; document the rule that PRs adding new terms must update both glossary and Gherkin.                                               |
| ESLint boundaries plugin breaks Next.js App Router conventions (file-system routing under `src/app/`). | Low        | Medium | Treat `src/app/**` as the presentation entry layer that delegates immediately into the appropriate context. ESLint config explicitly allows `src/app/**` to import from `src/contexts/*/presentation/**`. |
| Coverage drops temporarily during a phase.                                                             | Medium     | Low    | Coverage gate runs at the end of each phase, not per file move. Phases bounded to keep each fixable in one pass.                                                                                          |
| Plan length tempts skipping phases.                                                                    | Medium     | Medium | Plan-execution-checker enforces every Gherkin acceptance criterion in `prd.md` before archival.                                                                                                           |
| F# BE drifts from FE bounded-context names.                                                            | Low        | Low    | BE is out of scope; the only shared vocabulary today is `health`, which keeps its name. A future BE plan inherits the FE glossary as a starting point.                                                    |

## Out of scope

- Backend (`organiclever-be`) DDD adoption — separate future plan.
- New features.
- Database schema changes.
- Cloud sync.
- Sharia-compliance reporting.
- DDD adoption in other apps (`ayokoding-web`, `oseplatform-web`, `wahidyankf-web`).

## Affected Roles

- **Solo maintainer (DDD architect hat)**: Wahidyan Kresna Fridayoka — product owner and engineer.

## Decision record

- **2026-05-02**: Plan opened. Scope locked to FE only. Direct-to-main per Trunk Based Development. Subrepo worktree REQUIRED.
