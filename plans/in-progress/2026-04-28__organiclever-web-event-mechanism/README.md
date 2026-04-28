# OrganicLever — Generic Event Mechanism (Gear-Up)

## Overview

Build the smallest end-to-end client-side event primitive in `apps/organiclever-web/`:
a `/app` page with a plus-button that submits a **batch** of generic events of shape
`{ id, kind, payload, createdAt, updatedAt }` to a PGlite-backed store (Postgres-WASM
over IndexedDB), plus a list view (sorted newest-first by `createdAt`) with per-row
**edit**, **delete**, and **bring-to-top** (rearrange). No event-type-specific schemas,
no analytics, no routines — just the round-trip skeleton that proves the data path works.

The full path is wired through **Effect.ts** as the FP runtime (typed error channel,
Schema-based decoding, `ManagedRuntime` for React integration). The store API returns
`Effect<A, StoreError, PgliteService>`; the React layer is the only boundary that calls
`runtime.runPromise(...)` (run-at-the-edge pattern). XState is **not** adopted in the
gear-up — Effect alone covers form-input decoding, store IO, and typed-error surfacing.

**Submission**: an array `[{kind, payload}, ...]`. The batch is **flattened** into the
existing list (appended in storage; sorted on render). All events in one batch share
the same `createdAt` (the submission timestamp); `updatedAt` is set equal to
`createdAt` on creation.

**Edit**: refreshes `updatedAt` only; `createdAt` is preserved, so order does not
change. UI shows "edited Xm ago" when `updatedAt > createdAt`.

**Rearrange (bring-to-top)**: the only rearrangement primitive is "bump" — one
action per row that mutates the event's `createdAt = updatedAt = now`. Because sort
is `createdAt` desc, a bumped event becomes the newest. Drag-to-arbitrary-position
is out of scope; bump-to-top covers the "make this current again" use case with a
single deterministic operation.

This plan is the **gear-up** for
[`2026-04-25__organiclever-web-app/`](../2026-04-25__organiclever-web-app/README.md).
That plan adds typed payloads (`workout`, `reading`, `learning`, `meal`, `focus`,
`custom`), screens, charts, i18n, and routines on top of the primitive landed here.

**Relationship to the bigger plan**:

| Concern                         | This plan (gear-up)                                                                                                                                                                                                                       | `2026-04-25__organiclever-web-app/` (next)                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Event shape                     | Generic `{id, kind: string, payload, createdAt, updatedAt}`                                                                                                                                                                               | Discriminated union (6 typed payloads)                              |
| Mutations                       | Append (batch), update (single), delete (single), bump (single, sets `createdAt`)                                                                                                                                                         | Append + computed views; edit via typed sheets                      |
| Persistence layer               | PGlite (Postgres-WASM) over IndexedDB; `lib/events/event-store.ts` (Effect-returning, `dataDir` `ol_events_v1`); migration registry v1; `Schema` for input decode, `Data.TaggedError` for store errors, `ManagedRuntime` bridges to React | Same PGlite store + bigger schema (v2 migration adds typed columns) |
| `/app/page.tsx`                 | Provisional (plus button + list with edit/delete)                                                                                                                                                                                         | Replaced by `<AppRoot />` (full shell)                              |
| Tabs / hash routing / dark mode | Not in scope                                                                                                                                                                                                                              | Phase 1                                                             |
| Typed loggers / workout session | Not in scope                                                                                                                                                                                                                              | Phases 3–4                                                          |
| Survives into bigger plan?      | `lib/events/*` survives as primitive                                                                                                                                                                                                      | bigger plan wraps or migrates                                       |

**Scope (additive, ose-public single-repo)**:

- `apps/organiclever-web/src/app/app/page.tsx` — new `/app` route (provisional)
- `apps/organiclever-web/src/lib/events/` — types, schema, errors, runtime, store, hook,
  run-migrations runner, unit + integration tests
- `apps/organiclever-web/src/lib/events/migrations/` — one timestamp-named
  `.ts` file per migration (regex `^\d{4}_\d{2}_\d{2}T\d{2}_\d{2}_\d{2}__[a-z0-9_]{1,60}\.ts$`)
  plus a gitignored `index.generated.ts` emitted by the codegen script
- `apps/organiclever-web/scripts/gen-migrations.mjs` — codegen script that
  validates filenames and emits the migrations index (multi-dev safe; no
  manual registry edits)
- `apps/organiclever-web/src/components/app/` — plus button, event-form sheet,
  event list, event card (with edit / delete-confirm / bump affordances)
- `apps/organiclever-web/package.json` — add `@electric-sql/pglite`,
  `effect` (FP runtime + `Schema` + `Data.TaggedError` + `ManagedRuntime`),
  `@effect/vitest` (devDep, Layer-swap test helper)
- `apps/organiclever-web-e2e/steps/` — Playwright-BDD step bindings
- `specs/apps/organiclever/fe/gherkin/events/events-mechanism.feature` — Gherkin
  scenarios for batch submit, edit, delete, bump, reload, and PGlite/IndexedDB
  persistence verification
- No backend changes, no ts-ui changes, no new Nx projects

## Navigation

| Document                       | Contents                                            |
| ------------------------------ | --------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale, why gear-up, success criteria   |
| [prd.md](./prd.md)             | Page behavior + Gherkin acceptance criteria         |
| [tech-docs.md](./tech-docs.md) | Generic event shape, store API, file map, decisions |
| [delivery.md](./delivery.md)   | Granular phased checklist                           |

## Git Workflow

Single-repo plan touching `ose-public` only. Commits go directly to `main` per
Trunk Based Development. No subrepo worktree needed (parent-rooted session is fine
since this is `ose-public`-only work; a `ose-public` worktree under
`ose-public/.claude/worktrees/event-mechanism/` is optional for parallel-safety).

## Phases at a Glance

| Phase | Scope                                                                                                                                                                                                                                                                                          | Status |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0     | Foundation — amend `vitest.config.ts`; install PGlite + `effect` + `@effect/vitest`; types + branded ids + Schema + tagged errors; migration registry v1; Effect-returning `event-store` (append batch / update / delete / bump / sort); `ManagedRuntime`-backed `useEvents` hook + unit tests | todo   |
| 1     | Integration tests — real PGlite in-memory via `@effect/vitest` Layer swap: migration runner, batch atomicity, sort tiebreaker, edit preserves order, bump reorders, stats SQL                                                                                                                  | todo   |
| 2     | UI primitives — `<AddEventButton>`, `<EventFormSheet>` (batch / edit modes), `<EventList>`, `<EventCard>` (edit / delete-confirm / bump)                                                                                                                                                       | todo   |
| 3     | Page wiring — `<EventsPage>` + `/app/page.tsx` with `dynamic(...)` PGlite import; Playwright MCP smoke test in dev                                                                                                                                                                             | todo   |
| 4     | E2E — Gherkin feature + Playwright-BDD step bindings (batch / edit / delete / bump / reload + IndexedDB persistence assertion)                                                                                                                                                                 | todo   |
| 5     | Quality gate — `typecheck`, `lint`, `test:quick` (≥ 70 % LCOV), `test:integration`, `test:e2e`, `spec-coverage`, post-push CI verification                                                                                                                                                     | todo   |

## Out of Scope (defer to bigger plan)

- Typed payload validation (Zod, Effect Schema, etc.) — bigger plan introduces
  discriminated union; gear-up keeps `payload` as `Record<string, unknown>`
- Hash routing / TabBar / SideNav / dark mode toggle
- Drag-to-arbitrary-position reorder (only "bump to top" is supported, which sets
  `createdAt = updatedAt = now`)
- Bilingual UI (English-only strings; i18n layer arrives in bigger plan Phase 0)
- Analytics, charts, weekly rhythm, streaks
- PWA, accessibility audit beyond keyboard-reachable plus button
