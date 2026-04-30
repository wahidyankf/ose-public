# OrganicLever — App Feature Implementation

## Overview

Port the full `organic-lever` handoff bundle app into `apps/organiclever-web/` — a
complete local-first life-event tracker with 7 screens, 5 event types, workout tracking,
analytics, and bilingual UI.

**Assumes done** (prerequisite plans):

- [`plans/done/2026-04-25__organiclever-web-landing-uikit/`](../../done/2026-04-25__organiclever-web-landing-uikit/README.md) —
  ts-ui `Textarea` + `Badge` shipped; `apps/organiclever-web/src/app/page.tsx`
  serves the landing page; `apps/organiclever-web/src/app/system/status/be/page.tsx`
  is the BE diagnostic page. Both routes are live.
- [`plans/done/2026-04-30__organiclever-web-event-mechanism/`](../../done/2026-04-30__organiclever-web-event-mechanism/README.md) —
  gear-up landed `apps/organiclever-web/src/lib/journal/{schema,errors,runtime,journal-store,use-journal,run-migrations,format-relative-time}.ts`,
  PGlite (Postgres-WASM over IndexedDB) at `idb://ol_journal_v1`, migration
  registry v1 (`journal_entries` table + `storage_seq` BIGSERIAL + composite index),
  Effect.ts FP runtime (`Schema` + `Data.TaggedError` + `ManagedRuntime` +
  `PgliteService` Layer), XState v5 machine, and a provisional `/app/page.tsx`.
  **This bigger plan must NOT re-implement the storage layer or invent a new
  database — it extends the existing PGlite store via a v2 migration adding
  typed-payload columns.**

**Existing deps (no install needed):** `effect ^3.16.0`, `@effect/platform ^0.84.0`,
ts-ui `Textarea` + `Badge`, `@electric-sql/pglite` (added by gear-up),
`@effect/vitest` (added by gear-up).

**Scope**:

- `apps/organiclever-web/src/` — all app screens; v2 migration on top of
  gear-up's `journal_entries` table; per-name typed `Schema` definitions
  narrowing the open `name` discriminator
- `specs/apps/organiclever/fe/gherkin/` — Gherkin specs per feature
- No new Nx projects; no backend changes; no ts-ui changes

## Navigation

| Document                       | Contents                                            |
| ------------------------------ | --------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale, goals, success criteria         |
| [prd.md](./prd.md)             | Full screen inventory + Gherkin acceptance criteria |
| [tech-docs.md](./tech-docs.md) | Architecture, data model, routing, file map         |
| [delivery.md](./delivery.md)   | Step-by-step checklist                              |

## Git Workflow

Commits go directly to `main` per Trunk Based Development.

## Phases at a Glance

| Phase | Scope                                                                                                                                                                                   | Status |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0     | Foundation — v2 migration on top of gear-up's `journal_entries` table (typed-payload columns), per-name Effect `Schema`, i18n, fmt utilities (storage layer already shipped by gear-up) | todo   |
| 1     | App shell — replace gear-up's provisional `/app/page.tsx` body with `<AppRoot />` (TabBar, SideNav, hash routing, dark mode); the route already exists                                  | todo   |
| 2     | Home screen — dashboard, WeekRhythmStrip, event timeline                                                                                                                                | todo   |
| 3     | Event loggers — Reading, Learning, Meal, Focus, Custom, AddEventSheet                                                                                                                   | todo   |
| 4     | Workout active session — WorkoutScreen, rest timer, FinishScreen                                                                                                                        | todo   |
| 5     | Routine management — EditRoutineScreen, exercise CRUD                                                                                                                                   | todo   |
| 6     | History screen — SessionCard, WeeklyBarChart                                                                                                                                            | todo   |
| 7     | Progress / analytics — per-module tabs, SVG charts, 1RM                                                                                                                                 | todo   |
| 8     | Settings screen — profile, rest defaults, language, dark mode                                                                                                                           | todo   |
| 9     | PWA, polish, a11y audit, full coverage gate                                                                                                                                             | todo   |
