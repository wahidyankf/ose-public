# Business Requirements Document

## Problem Statement

The bigger app plan
([`2026-04-25__organiclever-web-app/`](../2026-04-25__organiclever-web-app/README.md))
is a 9-phase build with a discriminated `EventType` union, six typed payload shapes,
hash routing, a tab bar, side nav, dark mode, bilingual i18n, an SVG analytics
suite, and a workout session engine. Phase 0 alone introduces a 17-method `OLDb`
class plus seed data. There is currently no proof — in code, on disk, in CI — that
the most basic round-trip works in this codebase: open `/app`, press a button,
write something, hard-reload, see it again.

Without that primitive in place first, Phase 0 of the bigger plan ships the typed
schema and the storage layer simultaneously. A break in either surfaces as a single
"app doesn't render" symptom; debugging is correspondingly slower because it is
unclear whether the failure is in the type union, the localStorage class, the
hash router, or the screen stack. Worse, the typed event union fixes the surface
area to six kinds before an open-ended kind has been exercised in production-shaped
code; if the bigger plan later finds a seventh kind, the discriminated union has
to be widened across the whole codebase.

## Business Goals

1. **Land the round-trip primitive end-to-end** — `/app` page renders, plus button
   appends an event, list re-renders, hard reload preserves data. Done in one sitting,
   no schema design needed beyond `{ kind: string, payload: Record<string, unknown> }`.
2. **De-risk Phase 0 of the bigger plan** — when the bigger plan starts, the storage
   surface and the page mount point already work and are covered by tests. Bigger plan
   focuses on typed payloads and screen scaffolding instead of also inventing the
   storage shape from scratch.
3. **Establish an extension point for an open kind set** — `kind: string` lets the
   bigger plan layer a discriminated union on top without a forced migration. Future
   plans can add new kinds (sleep, mood, hydration) without touching the core store.
4. **Give the codebase a working `/app` route now** — visitors who accidentally hit
   `/app` during the bigger plan's in-progress phases see a useful page, not a 404 or
   half-built shell.

## Business Impact

**Pain points addressed**:

- The current `apps/organiclever-web/` has no `/app` route — only the landing page
  exists. Every other plan that depends on `/app` has to bootstrap it from zero.
- The bigger plan's Phase 0 mixes "design the typed event union" with "build the
  storage layer" with "wire the entry route". Each is a separate concern; mixing
  them makes review and rollback harder.
- A bug in the round-trip path during Phase 0 of the bigger plan blocks all six
  later phases. Landing the primitive first means later phases inherit a
  known-good baseline.

**Expected benefits**:

- Bigger plan's Phase 0 starts from a working storage baseline; it adds typed
  payload narrowing on top instead of inventing the storage layer.
- New event kinds in the future never touch the store — `kind` is an open string;
  the typed union lives one layer up in app code.
- `/app` page exists and is meaningful from the moment this plan merges.

## Affected Roles

- **Solo maintainer (product owner hat)**: confirms the gear-up scope is correct
  and approves the cut-line between this plan and the bigger plan.
- **Solo maintainer (developer hat)**: implements all four phases via the delivery
  checklist in this plan.
- **Solo maintainer (QA hat)**: runs `nx run organiclever-web:test:quick`,
  `organiclever-web-e2e:test:e2e`, and a manual Playwright MCP smoke test against
  `localhost:3200/app` before the plan archives.
- **Agents involved**: `plan-executor` (delivery), `plan-execution-checker`
  (validation), `swe-typescript-dev` (lib/events implementation),
  `swe-e2e-dev` (Playwright spec).

## Success Criteria

| Criterion                              | Measure                                                                                                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/app` route mounts                    | `GET /app` in dev returns 200 and renders plus button + empty-state copy                                                                                                                                                                                                 |
| Plus button opens form sheet           | Click reveals draft list (kind + JSON payload per draft), "+ Add another" stacks drafts; Save commits the batch; Cancel discards all drafts                                                                                                                              |
| Batch submit flattens                  | Submitting `[{kind: 'workout', payload: {}}, {kind: 'reading', payload: {}}]` results in two new events appearing in the list (no nested arrays in storage)                                                                                                              |
| Single-event submit works              | Submitting a one-element batch is functionally identical to submitting one event                                                                                                                                                                                         |
| Sort is by `createdAt` desc            | Within a batch, draft order is preserved via `storage_seq` (BIGSERIAL) tiebreaker; across batches, newer batches appear first                                                                                                                                            |
| List renders all stored events         | Newest-first; each entry shows kind, relative `createdAt`, payload preview, and "edited Xm ago" when `updatedAt > createdAt`                                                                                                                                             |
| Edit existing event                    | Clicking edit opens the form sheet seeded with the event's kind + payload; Save patches the entry in place, refreshes `updatedAt`, leaves `createdAt` and order unchanged                                                                                                |
| Delete existing event                  | Clicking delete (with confirm) removes the entry from list and storage                                                                                                                                                                                                   |
| Bump (rearrange) to top                | Clicking "Bring to top" on any row sets `createdAt = updatedAt = now`; the row becomes the newest in the list; storage reflects the new timestamps                                                                                                                       |
| Persistence is SQL-queryable           | Storage is PGlite (Postgres-WASM) over IndexedDB, FOSS (Apache 2.0); migration registry v1 creates `events` table + composite index `events_created_at_desc`                                                                                                             |
| Migration runner is idempotent         | First run on empty DB applies v1; second run is a no-op; partial failure rolls back inside a per-migration transaction                                                                                                                                                   |
| Migration filenames are multi-dev safe | Every migration file matches `^\d{4}_\d{2}_\d{2}T\d{2}_\d{2}_\d{2}__[a-z0-9_]{1,60}\.ts$`; codegen script `gen-migrations.mjs` validates and emits `index.generated.ts` (gitignored); two PRs adding migrations on the same day produce distinct filenames automatically |
| FOSS-only stack                        | Every persistence dependency is MIT or Apache 2.0 (PGlite Apache 2.0); no commercial tier, no FSL-licensed server                                                                                                                                                        |
| Forward-compatible for sync            | Schema + API admit additive PWA-sync columns (`original_created_at`, `deleted_at`, `synced_at`, `dirty`, `client_id`) without breaking gear-up call-sites                                                                                                                |
| Integration tests pass                 | `nx run organiclever-web:test:integration` exercises real PGlite in-memory (migrations, batch atomicity, sort tiebreaker, CRUD + bump, stats SQL)                                                                                                                        |
| Hard reload preserves events           | After `location.reload()` (Playwright + real IndexedDB), all previously-saved events still appear in the same order, with edits preserved                                                                                                                                |
| E2E asserts IndexedDB shape            | Playwright FE E2E confirms IndexedDB database `ol_events_v1` exists and `globalThis.__ol_db` (dev-only handle) returns the expected `SELECT count(*) FROM events`                                                                                                        |
| Generic shape proven                   | Round-trip works for at least three distinct kinds (`workout`, `reading`, `meditation`) with arbitrary payload keys                                                                                                                                                      |
| Coverage gate                          | `nx run organiclever-web:test:quick` ≥ 70 % LCOV (existing project threshold)                                                                                                                                                                                            |
| Gherkin coverage                       | At least one feature file under `specs/apps/organiclever/fe/gherkin/` exercises append-batch, edit, delete, bump, reload, IndexedDB-persistence assertion                                                                                                                |
| FE E2E green                           | `nx run organiclever-web-e2e:test:e2e` passes including the new spec                                                                                                                                                                                                     |
| Bigger-plan compatibility              | `lib/events/*` lives at a path the bigger plan can keep, wrap, or migrate without code churn                                                                                                                                                                             |

## Non-Goals

- Typed payload schemas (no Zod, no discriminated union) — bigger plan owns this
- ORMs in the persistence layer (Prisma, Drizzle ORM mode, TypeORM, MikroORM,
  Sequelize, Objection.js, etc.) — performance characteristics are unpredictable
  (N+1 patterns, hidden eager loads, opaque plans). Query builders (Kysely,
  Drizzle query-builder-only mode) are permitted; the gear-up uses raw
  parameterised SQL because the surface is small. See tech-docs "No ORM" decision.
- Drag-to-arbitrary-position reorder; the only rearrange primitive is "bring to
  top" which mutates `createdAt = updatedAt = now`
- Undo for delete (one-shot confirm; bigger plan can layer undo on top)
- Undo for bump (the previous `createdAt` is overwritten and not recoverable)
- Cross-tab sync via the `storage` event
- Hash routing, TabBar, SideNav, dark mode, bilingual i18n
- Analytics, charts, streaks, weekly rhythm
- Cloud sync, auth, profiles
- ts-ui additions (use only what the landing-uikit plan already exports)
- Custom-event-type definition UI

## Business Risks

| Risk                                                                                                                   | Likelihood | Impact | Mitigation                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storage key collides with bigger plan's `ol_db_v12`                                                                    | Medium     | Medium | Use distinct key `ol_events_v1`; bigger plan's `OLDb` reads from `ol_db_v12` and never touches `ol_events_v1`                                                                                                    |
| Provisional `/app/page.tsx` blocks the bigger plan                                                                     | Low        | High   | Bigger plan's Phase 1 explicitly replaces `/app/page.tsx`; `lib/events/*` survives or is migrated                                                                                                                |
| Generic `payload: Record<string, unknown>` invites abuse                                                               | Low        | Low    | Bigger plan adds discriminated union; in the meantime callers are limited to the form sheet's JSON-ish input                                                                                                     |
| IndexedDB quota exhaustion (varies by browser; typically 50% of free disk on Chrome/Firefox, ~1 GB hard cap on Safari) | Low        | Low    | Small JSON payloads (< 1 KB each) allow tens of thousands of events well under any quota; quota-exceeded path surfaces via `status: 'error'` in `useEvents` with an actionable error banner                      |
| Bigger plan finds the gear-up's API insufficient                                                                       | Medium     | Low    | API kept small (`appendEvents`, `listEvents`, `updateEvent`, `deleteEvent`, `bumpEvent`, `clearEvents`); bigger plan can wrap or replace without breaking call-sites                                             |
| Edit / delete on the wrong row                                                                                         | Low        | Medium | Operations key by `id` (not array index); delete shows an inline confirm before destructive action                                                                                                               |
| Sort flicker on edit                                                                                                   | Low        | Low    | Sort key is `createdAt`; **edit** refreshes only `updatedAt`, so order is stable. **Bump** is the explicit opt-in that mutates `createdAt`.                                                                      |
| User loses original `createdAt` via accidental bump                                                                    | Low        | Low    | Bump is a separately-labelled affordance distinct from edit and delete; the previous `createdAt` is overwritten and not recoverable (documented as a non-goal)                                                   |
| `force-dynamic` `/app/page.tsx` regression                                                                             | Low        | Medium | Page declares `'use client'` + `export const dynamic = 'force-dynamic'`; existing `/` and `/system/status/be` untouched                                                                                          |
| PGlite WASM bundle (~3 MB) bloats `/app` cold start                                                                    | Low        | Medium | Bundle lazy-loaded via `dynamic(() => import('@electric-sql/pglite'), { ssr: false })`; landing page (`/`) unaffected; Vercel CDN caches WASM after first hit                                                    |
| Migration applies twice / leaves DB half-migrated                                                                      | Low        | High   | `_migrations` tracking table keyed by filename id; runner wraps each migration in its own `db.transaction(...)`; per-migration scoping rolls back only the failing one; idempotency tested in `test:integration` |
| Two devs collide on the same migration filename (multi-dev)                                                            | Low        | High   | Filename pattern `YYYY_MM_DDTHH_MM_SS__title.ts`; collision requires same UTC second AND same title — vanishingly improbable; if it happens, git rejects the second `git add` and author bumps the timestamp     |
| Generated `index.generated.ts` drifts from `migrations/` directory                                                     | Low        | Medium | File is gitignored; `predev`, `prebuild`, `pretest`, `pretest:integration` all run `gen:migrations`; CI runs the same hooks, so drift cannot reach production                                                    |
| IndexedDB unavailable (Safari Private Browsing, quota)                                                                 | Low        | Medium | `getDb` rejects with the underlying error; React layer surfaces "Storage unavailable" banner; user sees an actionable error instead of a silent data-loss                                                        |
| Dev-only `globalThis.__ol_db` leaks into production                                                                    | Low        | High   | Handle assigned only when `process.env.NODE_ENV !== "production"`; lint rule (or grep gate in `test:quick`) ensures no production code references `__ol_db`                                                      |
