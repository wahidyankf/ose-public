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
2. **Prove local-first viability** — all data in `localStorage`; zero backend round-trips for
   the core loop. When cloud sync ships later, the existing Effect TS service layer is the
   integration point (already dormant in the codebase).
3. **Capture real usage data** — seeded with a default profile; users can immediately see
   how the app feels with data rather than an empty state.
4. **Support both languages** — English-default with Bahasa Indonesia available in Settings,
   reaching the Indonesian user base from day one.

## Business Impact

**Pain points addressed**:

- Zero usable app exists behind the landing page CTA — visitors who click "Get started" land
  nowhere productive, wasting all acquisition effort from the landing plan.
- The design prototype has been complete for weeks but no implementation exists; continued
  delay risks losing momentum and early adopters.

**Expected benefits**:

- Usable v0 ships on day one of this plan merging: visitors can log events, run workouts, and
  see their rhythm immediately — no server, no sign-up.
- Local-first architecture is validated in production: localStorage approach proven at real
  usage before cloud sync investment.
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

- Cloud sync / backend rewire (dormant Effect TS layer untouched)
- Authentication, accounts, profile photos
- Push / local notifications
- Native iOS / Android
- Custom event-type definition UI (custom event logging works; type definition UI is future)
- Data export / import
- ts-ui additions (handled in `2026-04-25__organiclever-web-landing-uikit`)

## Business Risks

| Risk                                      | Likelihood | Impact   | Mitigation                                                                   |
| ----------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------- |
| Prerequisite plan not merged              | Medium     | Blocking | `Textarea` and `Badge` required by Phase 3+; landing-uikit must ship first   |
| Scope creep into Phase 10+                | Medium     | High     | Non-Goals list is firm; new ideas go to `ideas.md`, not into this plan       |
| localStorage limits (5 MB)                | Low        | Medium   | Seed data + realistic usage stays well under limit; no binary blobs stored   |
| `/app` route regression                   | Low        | High     | Route is additive; existing `/` and `/system/status/be` routes are untouched |
| Hash routing + Next.js hydration conflict | Low        | Medium   | Workaround: `'use client'` + `force-dynamic` on `/app/page.tsx`              |
