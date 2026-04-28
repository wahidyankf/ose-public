# Business Requirements Document

## Problem Statement

The OrganicLever landing page will exist after the first plan ships, but `www.organiclever.com`
needs a working app behind the CTA. The design prototype (handoff bundle) covers a complete
local-first life-event tracker: workout logging with routines, rest timers, and PRs; reading,
learning, meal, and focus session tracking; analytics; and a bilingual (EN/ID) UI. None of
this exists in the current codebase beyond a placeholder.

## Business Goals

1. **Ship a usable v0 tracker** — users who arrive via the landing page CTA can immediately
   log events, run workouts, and see their weekly rhythm — no sign-up, no server.
2. **Prove local-first viability** — all data in PGlite (Postgres-WASM over IndexedDB)
   wrapped in Effect.ts (already landed by the gear-up plan); zero backend round-trips
   for the core loop. When PWA sync ships later, the existing PGlite schema admits the
   additive sync columns documented in the gear-up's Forward Compatibility section.
3. **Capture real usage data** — seeded with a default profile; users can immediately see
   how the app feels with data rather than an empty state.
4. **Support both languages** — English-default with Bahasa Indonesia available in Settings,
   reaching the Indonesian user base from day one.

## Business Impact

**Pain points addressed**:

- The landing page is live but `/app` only carries the gear-up's provisional event-mechanism
  page — visitors who click "Get started" see a generic kind/payload form, not the typed
  loggers the design prototype promised. This plan delivers the full UX.
- The gear-up landed the storage primitive but not the typed `Schema` per kind, the screen
  shell, the analytics, or i18n. This plan builds those on top of the existing PGlite
  store rather than re-inventing it.

**Expected benefits**:

- Usable v0 ships on day one of this plan merging: visitors can log typed events, run
  workouts, and see their rhythm immediately — no server, no sign-up.
- Local-first architecture is validated in production: PGlite + Effect.ts approach
  proven at real usage before PWA sync investment.
- Indonesian market is reachable from launch via the built-in i18n layer.

## Affected Roles

- **Solo maintainer (product owner hat)**: defines acceptance criteria, prioritizes phases,
  approves completion.
- **Solo maintainer (developer hat)**: implements all phases using the delivery checklist.
- **Solo maintainer (QA hat)**: runs quality gates, Playwright MCP verification, and golden
  path checks at Phase 9.
- **Agents involved**: `plan-executor` (runs delivery checklist), `plan-execution-checker`
  (validates completion), `swe-typescript-dev` (TypeScript implementation help),
  `swe-e2e-dev` (Playwright spec help).

## Success Criteria

| Criterion                              | Measure                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| App loads                              | `/#/app` renders the Home screen with seed data                                                              |
| All 4 navigation tabs reachable        | Home, History, Progress, Settings tabs navigate correctly on mobile + desktop                                |
| Workout flow end-to-end                | Create routine → start session → log sets → rest timer → finish → visible in history                         |
| All 5 event types loggable             | Reading, Learning, Meal, Focus, Custom loggers save and appear in Home + History                             |
| Routine CRUD                           | Create, edit, reorder exercises, delete routine works                                                        |
| Local persistence                      | Hard reload preserves all data and dark mode state                                                           |
| Analytics populated                    | After logging events, Progress screen shows per-module charts                                                |
| i18n complete                          | Switching to Bahasa Indonesia shows all UI strings in Indonesian                                             |
| Coverage gate                          | `nx run organiclever-web:test:quick` ≥ 70 %                                                                  |
| All primary user flows work end-to-end | Full golden path (log workout → view history → view progress → reload → persist) completes without data loss |

## Non-Goals

- PWA / cloud sync — the gear-up's Forward Compatibility section reserves the
  necessary columns; this plan does not enable the sync layer
- Re-implementing the storage layer — gear-up's `lib/events/event-store.ts`,
  `runtime.ts`, `errors.ts`, and `schema.ts` are the canonical primitives; this
  plan extends them via a v2 migration + per-kind Schema, never replaces them
- Re-installing Effect or PGlite — both already in `package.json` after the
  gear-up plan
- Authentication, accounts, profile photos
- Push / local notifications
- Native iOS / Android
- Custom event-type definition UI (custom event logging works; type definition UI is future)
- Data export / import
- ts-ui additions (handled in `2026-04-25__organiclever-web-landing-uikit`)

## Business Risks

| Risk                                      | Likelihood | Impact   | Mitigation                                                                                                                                                                                 |
| ----------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gear-up plan not yet shipped              | Medium     | Blocking | This plan assumes `2026-04-28__organiclever-web-event-mechanism` is in `plans/done/`; if still in-progress, that plan must merge first                                                     |
| Scope creep into Phase 10+                | Medium     | High     | Non-Goals list is firm; new ideas go to `ideas.md`, not into this plan                                                                                                                     |
| IndexedDB quota (PGlite-managed)          | Low        | Low      | PGlite stores the entire DB in one IDB blob managed by Postgres internals; small JSON payloads keep usage under any browser quota; gear-up's typed-error path handles `StorageUnavailable` |
| `/app` route regression                   | Low        | High     | Route already exists (provisional gear-up); this plan replaces the page body, not the route registration; `/` and `/system/status/be` untouched                                            |
| Hash routing + Next.js hydration conflict | Low        | Medium   | Existing `'use client'` + `force-dynamic` on `/app/page.tsx` (set by gear-up) carries forward unchanged                                                                                    |
| v2 migration breaks gear-up data          | Low        | High     | Use only additive `ALTER TABLE ... ADD COLUMN` statements with safe defaults; no `DROP COLUMN`; integration test verifies gear-up rows survive v2 migration                                |
