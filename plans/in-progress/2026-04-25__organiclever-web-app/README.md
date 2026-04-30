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
  Effect-TS FP runtime (`Schema` + `Data.TaggedError` + `ManagedRuntime` +
  `PgliteService` Layer), XState v5 `journalMachine` (load → ready → mutating
  with buffered events) + `useJournal` React hook, and a provisional `/app/page.tsx`.
  **This bigger plan must NOT re-implement the storage layer or invent a new
  database — it extends the existing PGlite store via a v2 migration adding
  typed-payload columns.**

**Existing deps (no install needed):** `effect ^3.21.2`, `@effect/platform ^0.84.0`,
`xstate ^5.31.0`, `@xstate/react ^5.0.5`, ts-ui `Textarea` + `Badge`,
`@electric-sql/pglite ^0.4.5` (added by gear-up), `@effect/vitest ^0.29.0`
(added by gear-up).

**Scope**:

- `apps/organiclever-web/src/` — all app screens; v2 migration on top of
  gear-up's `journal_entries` table; per-kind typed `Schema.Union` narrowing
  the open `name`-as-kind discriminator; XState `workoutSessionMachine` for
  complex workout timer/exercise state; Effect-TS stores for routines, settings,
  and stats aggregations
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

| Phase | Scope                                                                                                                                                                                                  | Status |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 0     | Foundation — v2 migration on `journal_entries` (typed-payload columns + `name` CHECK + routines/settings tables), `typed-payloads.ts` Schema.Union on `name`, Effect-TS stores, seed, i18n, fmt, stats | todo   |
| 1     | App shell — replace gear-up's provisional `<JournalPage />` body in `/app/page.tsx` with `<AppRoot />` (TabBar, SideNav, hash routing, dark mode); the route already exists                            | todo   |
| 2     | Home screen — dashboard, WeekRhythmStrip, event timeline                                                                                                                                               | todo   |
| 3     | Event loggers — Reading, Learning, Meal, Focus, Custom, AddEventSheet                                                                                                                                  | todo   |
| 4     | Workout active session — XState `workoutSessionMachine` (timer + exercise tracking), WorkoutScreen, RestTimer, SetTimerSheet, FinishScreen; Effect-TS `appendEntries` for final save only              | todo   |
| 5     | Routine management — EditRoutineScreen, exercise CRUD using Effect-TS `routine-store`                                                                                                                  | todo   |
| 6     | History screen — SessionCard, WeeklyBarChart                                                                                                                                                           | todo   |
| 7     | Progress / analytics — per-module tabs, SVG charts, 1RM; consumes Effect-TS `stats.ts` aggregations                                                                                                    | todo   |
| 8     | Settings screen — profile, rest defaults, language, dark mode; saves via Effect-TS `settings-store`                                                                                                    | todo   |
| 9     | PWA, polish, a11y audit, full coverage gate                                                                                                                                                            | todo   |
