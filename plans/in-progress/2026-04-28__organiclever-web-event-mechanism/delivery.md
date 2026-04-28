# Delivery Checklist

**Prerequisite**: none beyond the existing `apps/organiclever-web/` scaffolding.
This plan does NOT depend on `2026-04-25__organiclever-web-landing-uikit`
(no `Textarea` / `Badge` consumed). Bigger plan
[`2026-04-25__organiclever-web-app/`](../2026-04-25__organiclever-web-app/README.md)
starts after this gear-up archives.

---

## Environment Setup

- [ ] Run `npm install` from the `ose-public` root to ensure deps are current
- [ ] Run `npm run doctor -- --fix` to converge the polyglot toolchain
- [ ] Verify dev server starts: `nx dev organiclever-web` (expect `localhost:3200`)
- [ ] Confirm the existing test suite is green BEFORE making any edits:
  - `nx run organiclever-web:typecheck`
  - `nx run organiclever-web:lint`
  - `nx run organiclever-web:test:quick`
  - `nx run organiclever-web:test:integration`
  - `nx run organiclever-web-e2e:test:e2e`
- [ ] **Fix-all-issues rule**: if ANY of the above gates is red on a fresh clone
      (preexisting, not caused by this plan), STOP and fix the root cause first
      before introducing new code. Per the [Root Cause Orientation
      principle](../../../governance/principles/general/root-cause-orientation.md),
      do not bypass, comment-out, or work around the failure — the senior-engineer
      standard expects unrelated-but-encountered issues to be fixed properly.

### Commit Guidelines

- [ ] Commit thematically — group related changes into logically cohesive commits
- [ ] Conventional Commits format: `<type>(<scope>): <description>`
      Suggested commits in approximate order:
      `chore(organiclever-web): add @electric-sql/pglite dependency`,
      `feat(events): add EventEntry/UpdateEventInput types and migration registry v1`,
      `feat(events): add async event-store with append-batch / update / delete / bump / list / clear`,
      `feat(events): add useEvents hook with idle/loading/ready/error status`,
      `feat(events): add formatRelativeTime utility`,
      `test(events-int): add real-PGlite integration tests for migrations and CRUD`,
      `feat(events-ui): add AddEventButton, EventFormSheet, EventList, EventCard`,
      `feat(app): mount EventsPage at /app with dynamic PGlite import`,
      `test(events-e2e): add events-mechanism.feature and step bindings`
- [ ] Split different domains/concerns into separate commits — keep
      `feat(events):` (storage layer) separate from `feat(events-ui):`
      (components) and from `feat(app):` (route wiring) and `test(*):`
      (test files)
- [ ] Do NOT amend; create a NEW commit if pre-commit / pre-push hooks fail

---

## Phase 0 — Foundation (`lib/events/`)

### 0.1 Install PGlite

- [ ] From `ose-public` root: `cd apps/organiclever-web && npm install @electric-sql/pglite --save`
      (let npm resolve the latest 0.x; verify the resolved version is FOSS Apache 2.0
      via `npm view @electric-sql/pglite license`)
- [ ] Confirm Apache 2.0 license: `npm view @electric-sql/pglite license` returns `Apache-2.0`
- [ ] Verify the package is installed: `npm ls @electric-sql/pglite` from inside
      `apps/organiclever-web/`
- [ ] Inspect bundle impact: `nx build organiclever-web --analyze` (or temporarily
      add `withBundleAnalyzer` to `next.config.ts`); confirm the `/app` page chunk
      contains `@electric-sql/pglite` and the landing-page chunk does not
- [ ] **No-ORM guardrail**: do NOT install Prisma, Drizzle ORM mode, TypeORM,
      MikroORM, Sequelize, Objection.js, or any other full-fat ORM at any phase
      of this plan. ORMs are forbidden in the persistence layer per the
      tech-docs "No ORM" design decision (unpredictable performance, hidden
      query patterns). If a future phase finds raw SQL noisy, a query
      builder (Kysely, Drizzle query-builder-only) is permitted — but it must
      expose the generated SQL string for plan-inspection

### 0.2 TypeScript types

- [ ] Create `apps/organiclever-web/src/lib/events/types.ts` per `tech-docs.md`:
  - [ ] `EventKind = string`
  - [ ] `EventPayload = Record<string, unknown>`
  - [ ] `EventEntry { id, kind, payload, createdAt, updatedAt }`
  - [ ] `NewEventInput = Pick<EventEntry, "kind" | "payload">`
  - [ ] `UpdateEventInput = Partial<Pick<EventEntry, "kind" | "payload">>`

### 0.3 Migration framework — multi-developer safe

#### 0.3.a Codegen script

- [ ] Create `apps/organiclever-web/scripts/gen-migrations.mjs` per the
      tech-docs sketch (~30 lines):
  - [ ] Reads every `*.ts` file in
        `apps/organiclever-web/src/lib/events/migrations/` (excluding `index.ts`
        and `index.generated.ts`)
  - [ ] Validates each filename matches the regex
        `^\d{4}_\d{2}_\d{2}T\d{2}_\d{2}_\d{2}__[a-z0-9_]{1,60}\.ts$`; throws
        with a clear error on first violation
  - [ ] Sorts lexicographically (timestamp prefix → chronological)
  - [ ] Emits `index.generated.ts` with one `import * as mN from "./<file>";`
        per migration and `export const MIGRATIONS: Migration[] = [m0, m1, ...]`
- [ ] Add gitignore: append
      `src/lib/events/migrations/index.generated.ts` to
      `apps/organiclever-web/.gitignore`
- [ ] Wire npm scripts in `apps/organiclever-web/package.json`:
  - [ ] `"gen:migrations": "node scripts/gen-migrations.mjs"`
  - [ ] `"predev": "npm run gen:migrations"`
  - [ ] `"prebuild": "npm run gen:migrations"`
  - [ ] `"pretest": "npm run gen:migrations"`
  - [ ] `"pretest:integration": "npm run gen:migrations"`
- [ ] Verify the script is callable: `cd apps/organiclever-web && npm run gen:migrations`
      after step 0.3.b creates the first migration file

#### 0.3.b First migration file (v1: create events table)

- [ ] Create directory `apps/organiclever-web/src/lib/events/migrations/`
- [ ] Create `apps/organiclever-web/src/lib/events/migrations/2026_04_28T14_05_30__create_events_table.ts`
      (substitute the actual UTC timestamp at file-creation time so the
      filename is honest):
  - [ ] `export const id = "<filename without .ts>"`
  - [ ] `export async function up(db: PGlite): Promise<void>` running the
        v1 SQL from `tech-docs.md` (`CREATE TABLE IF NOT EXISTS events (...)` + `CREATE INDEX IF NOT EXISTS events_created_at_desc (...)`)
  - [ ] `export async function down(db: PGlite): Promise<void>` reversing it
        (`DROP INDEX IF EXISTS ...; DROP TABLE IF EXISTS events;`)

#### 0.3.c Runner

- [ ] Create `apps/organiclever-web/src/lib/events/run-migrations.ts`:
  - [ ] `import { MIGRATIONS } from "./migrations/index.generated"`
  - [ ] `export async function runMigrations(db: PGlite): Promise<void>`: - [ ] `await db.exec("CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())")` - [ ] `const applied = new Set((await db.query<{ id: string }>("SELECT id FROM _migrations")).rows.map(r => r.id))` - [ ] For each `m` in `MIGRATIONS` not in `applied`:
        `typescript
await db.transaction(async tx => {
  await m.up(tx);
  await tx.query("INSERT INTO _migrations(id) VALUES($1)", [m.id]);
});
`

#### 0.3.d Runner unit tests

- [ ] Create `apps/organiclever-web/src/lib/events/run-migrations.test.ts`:
  - [ ] In-memory PGlite — fresh DB, run `runMigrations(db)` once: one row
        in `_migrations` with id `"2026_04_28T14_05_30__create_events_table"`
  - [ ] Re-running on the same DB is a no-op (still one row, unchanged
        `applied_at`)
  - [ ] Inject a failing migration (e.g., wrap `up` in a throw); assert
        `_migrations` is unchanged AND the partial schema is rolled back
        (e.g., `events` table does not exist)
  - [ ] Two migrations in sequence apply in lexicographic order; if the second
        fails, the first stays applied (per-migration transaction scoping
        — distinct from libraries that share one transaction across all
        pending migrations)

#### 0.3.e Filename lint

- [ ] The codegen script throws on filename violations; assert this is the
      enforcement point (no separate lint rule needed). Add a unit test:
      `gen-migrations.test.mjs` (or inline) feeds the script a mock directory
      with one bad name and asserts it throws

### 0.4 Async event store

- [ ] Create `apps/organiclever-web/src/lib/events/event-store.ts`:
  - [ ] `EVENT_STORE_DB_NAME = "ol_events_v1"`
  - [ ] `getDb(): Promise<PGlite | null>`:
    - [ ] If `typeof window === "undefined"`, return `null`
    - [ ] Lazy-import via `const { PGlite } = await import("@electric-sql/pglite")`
    - [ ] Cache the handle in a module-level `let dbPromise: Promise<PGlite> | null = null`
    - [ ] On first call: `new PGlite("idb://ol_events_v1")` → `await runMigrations(db)`
    - [ ] In dev-only mode (`process.env.NODE_ENV !== "production"`), assign
          `(globalThis as any).__ol_db = db` so Playwright + DevTools can inspect
  - [ ] `appendEvents(input: NewEventInput[]): Promise<EventEntry[]>`:
    - [ ] Throw on `input.length === 0`
    - [ ] Build a single multi-VALUES `INSERT ... RETURNING ...` with one shared
          `now()` timestamp; execute inside one statement
    - [ ] Map `RETURNING` rows to `EventEntry`
  - [ ] `updateEvent(id, patch): Promise<EventEntry | null>`:
    - [ ] `UPDATE events SET kind = COALESCE($2, kind), payload = COALESCE($3::jsonb, payload), updated_at = now() WHERE id = $1 RETURNING ...`
    - [ ] Return mapped row or `null` when `rowCount === 0`
  - [ ] `deleteEvent(id): Promise<boolean>` — `DELETE` + `rowCount > 0`
  - [ ] `bumpEvent(id): Promise<EventEntry | null>` — `UPDATE ... SET created_at = now(), updated_at = now() WHERE id = $1 RETURNING ...`
  - [ ] `listEvents(): Promise<EventEntry[]>` — `SELECT ... ORDER BY created_at DESC, storage_seq ASC`
  - [ ] `clearEvents(): Promise<void>` — `TRUNCATE events RESTART IDENTITY`
  - [ ] Add `rowToEntry` mapper that converts `Date` → ISO string for `createdAt`/`updatedAt`

### 0.5 useEvents hook

- [ ] Create `apps/organiclever-web/src/lib/events/use-events.ts` per `tech-docs.md`:
  - [ ] State: `events`, `status` (`"idle" | "loading" | "ready" | "error"`), `error`
  - [ ] `useEffect` on mount: set `status="loading"` → `await getDb()` → `await listEvents()` → `status="ready"` (or `"error"`)
  - [ ] `addBatch(drafts)`, `edit(id, patch)`, `remove(id)`, `bump(id)`, `clear()` all
        delegate to the store, then re-call `listEvents()` and update `events`
  - [ ] Return memoised result

### 0.6 Time formatter

- [ ] Create `apps/organiclever-web/src/lib/events/format-relative-time.ts`
      with the signature in `tech-docs.md`
- [ ] Create `apps/organiclever-web/src/lib/events/format-relative-time.test.ts`:
  - [ ] `< 60s` → `"just now"`
  - [ ] `< 60m` → `"{n}m ago"` (boundary 1m, 59m)
  - [ ] `< 24h` → `"{n}h ago"` (boundary 1h, 23h)
  - [ ] `< 7d` → `"{n}d ago"` (boundary 1d, 6d)
  - [ ] `>= 7d` → ISO `YYYY-MM-DD`

### 0.7 Phase 0 validation

- [ ] `nx run organiclever-web:typecheck` passes
- [ ] `nx run organiclever-web:lint` passes
- [ ] `nx run organiclever-web:test:quick` passes (≥ 70 % LCOV)

---

## Phase 1 — Integration tests (real PGlite, in-memory)

### 1.1 Wire up `test:integration`

- [ ] Confirm `apps/organiclever-web/project.json` has `test:integration` target
      (it currently exists with `passWithNoTests: true`); update to remove
      `passWithNoTests` once tests are present so the gate is meaningful
- [ ] Add a Vitest config or test-pattern that picks up `*.int.test.ts` files
      under `src/lib/events/` (or use a separate `vitest.integration.config.ts`)

### 1.2 Integration test files

- [ ] Create `apps/organiclever-web/src/lib/events/event-store.int.test.ts`:
  - [ ] `beforeEach`: `db = new PGlite()` (in-memory, no `dataDir`); `await runMigrations(db)`
  - [ ] **Migration idempotency**: second `runMigrations(db)` is a no-op
  - [ ] **Batch atomicity**: `appendEvents([a, b, c])` returns 3 entries with
        identical `createdAt`; storage rowcount is 3
  - [ ] **Sort tiebreaker**: appended batch comes back in `(createdAt DESC, storage_seq ASC)`
  - [ ] **Cross-batch ordering**: events from a later batch sort first, with
        within-batch order preserved
  - [ ] **`updateEvent` preserves `createdAt`**: new `updatedAt > createdAt`
  - [ ] **`updateEvent` partial patch**: omitting `kind` leaves it unchanged
        (COALESCE behaviour)
  - [ ] **`updateEvent` of missing id**: returns `null`
  - [ ] **`deleteEvent` rowcount semantics**: hit returns `true`, miss returns `false`
  - [ ] **`bumpEvent` mutates both timestamps**: bumped event becomes newest;
        original `createdAt` is overwritten
  - [ ] **`clearEvents`**: `listEvents` returns `[]`; `storage_seq` resets
  - [ ] **Stats SQL**: insert a fixture spanning 14 days across 3 kinds; assert
        the date-trunc-per-kind, total-mins-per-kind, and streak queries from
        `tech-docs.md` return the expected aggregations

### 1.3 Phase 1 validation

- [ ] `nx run organiclever-web:test:integration` passes
- [ ] Coverage from integration tests counts toward the project threshold (no
      regression below 70 % LCOV)

---

## Phase 2 — UI components (`components/app/`)

### 2.1 AddEventButton

- [ ] Create `apps/organiclever-web/src/components/app/add-event-button.tsx`:
  - [ ] Props: `{ onClick: () => void }`
  - [ ] `<button aria-label="Add event">Add event</button>` (or "+ Add event")
  - [ ] Tailwind styling consistent with existing landing components
  - [ ] Keyboard reachable

### 2.2 EventFormSheet (batch + edit modes)

- [ ] Create `apps/organiclever-web/src/components/app/event-form-sheet.tsx`
      with the discriminated `EventFormSheetProps` from `tech-docs.md`:
  - [ ] **Create mode**: `drafts` array, "+ Add another" appends, "Remove draft"
        splice-removes (disabled when only one)
  - [ ] **Edit mode**: single draft seeded from `initial`
  - [ ] Preset chips (`workout`, `reading`, `meditation`) per draft
  - [ ] Per-draft validation: empty kind, invalid JSON, non-object JSON
  - [ ] All-or-nothing save in create mode
  - [ ] Cancel discards local state

### 2.3 EventList + EventCard

- [ ] Create `apps/organiclever-web/src/components/app/event-list.tsx`:
  - [ ] Empty-state copy "No events yet — press + to add one" when empty
  - [ ] Renders `<ul>` of `<EventCard>` props per item
- [ ] Create `apps/organiclever-web/src/components/app/event-card.tsx`:
  - [ ] Header: kind, relative `createdAt`, "edited Xm ago" when `updatedAt > createdAt`
  - [ ] Action row: Edit / Bring to top / Delete
  - [ ] Delete uses inline two-step confirm
  - [ ] `<details>` payload disclosure with pretty-printed JSON

### 2.4 Component unit tests

- [ ] `add-event-button.test.tsx`: click invokes `onClick`; aria-label present
- [ ] `event-form-sheet.test.tsx`:
  - [ ] Create mode: empty kind blocks submit; invalid JSON blocks; non-object JSON blocks
  - [ ] Create mode: "+ Add another" / "Remove draft" mutate draft list
  - [ ] Create mode: valid submit calls `onSubmit` with array of `{kind, payload}`
  - [ ] Edit mode: seeded with `initial`; submit calls `onSubmit` with patch
  - [ ] Cancel calls `onCancel`, no `onSubmit`
  - [ ] Preset chip click sets that draft's kind
- [ ] `event-list.test.tsx`: empty-state copy / N cards
- [ ] `event-card.test.tsx`:
  - [ ] Renders kind, time, payload preview
  - [ ] Shows "edited Xm ago" only when `updatedAt > createdAt`
  - [ ] Edit button calls `onEdit(id)`; Bring-to-top calls `onBump(id)`
  - [ ] Delete shows confirm; Cancel reverts; Yes calls `onDelete(id)`

### 2.5 Phase 2 validation

- [ ] `nx run organiclever-web:typecheck` passes
- [ ] `nx run organiclever-web:test:quick` passes (≥ 70 % LCOV)

---

## Phase 3 — Page wiring

### 3.1 EventsPage composer

- [ ] Create `apps/organiclever-web/src/components/app/events-page.tsx`:
  - [ ] Uses `useEvents()`
  - [ ] Renders skeleton while `status === "loading"`
  - [ ] Renders error banner while `status === "error"`
  - [ ] Otherwise renders `<h1>Events</h1>`, `<AddEventButton ... />`,
        `<EventList ... />`, `<EventFormSheet ... />`
  - [ ] `handleSubmit` dispatches `addBatch` (create) or `edit` (edit) and
        closes the sheet

### 3.2 /app route

- [ ] Create `apps/organiclever-web/src/app/app/page.tsx`:
  - [ ] `"use client";`
  - [ ] `export const dynamic = "force-dynamic";`
  - [ ] Default export: `<EventsPage />`

### 3.3 EventsPage integration test

- [ ] `events-page.test.tsx` (Vitest + RTL + in-memory PGlite):
  - [ ] Loading skeleton on first render
  - [ ] Empty state after store resolves
  - [ ] Click "Add event" → form sheet opens
  - [ ] Submit batch of two drafts → list shows two cards
  - [ ] Click Edit on a card → sheet opens in edit mode
  - [ ] Submit edit → card updates, order unchanged
  - [ ] Click Bring-to-top → card moves to first
  - [ ] Click Delete → confirm → card removed

### 3.4 Manual smoke test via Playwright MCP

> **Auto-clarity**: the steps below MUST run as explicit Playwright MCP tool
> calls (so a coding agent can replay them deterministically), not narrative
> prose. Use the named tools verbatim.

- [ ] Start dev server (background): `nx dev organiclever-web` and wait for
      `localhost:3200` to become reachable
- [ ] `mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3200/app" })`
- [ ] `mcp__plugin_playwright_playwright__browser_wait_for({ text: "Events" })`
- [ ] `mcp__plugin_playwright_playwright__browser_snapshot()` — confirm empty
      state copy "No events yet — press + to add one" is visible
- [ ] `mcp__plugin_playwright_playwright__browser_console_messages()` — assert
      no error-level messages logged during PGlite WASM load
- [ ] `mcp__plugin_playwright_playwright__browser_click({ element: "Add event button", ref: "<from snapshot>" })`
- [ ] `mcp__plugin_playwright_playwright__browser_fill_form({ fields: [
  { name: "Kind input draft 1", type: "textbox", ref: "...", value: "workout" },
  { name: "Payload textarea draft 1", type: "textbox", ref: "...", value: "{\"reps\": 12}" }
]})`
- [ ] `mcp__plugin_playwright_playwright__browser_click({ element: "Save button", ref: "..." })`
- [ ] `mcp__plugin_playwright_playwright__browser_snapshot()` — confirm one card
      with kind "workout" appears
- [ ] Repeat the click → fill → save sequence for `reading` and `meditation`
- [ ] `mcp__plugin_playwright_playwright__browser_evaluate({ function: "() => indexedDB.databases().then(dbs => dbs.map(d => d.name))" })`
      — assert the returned array contains `"ol_events_v1"` (the PGlite IndexedDB name)
- [ ] `mcp__plugin_playwright_playwright__browser_evaluate({ function: "async () => (await globalThis.__ol_db.exec('SELECT count(*) FROM events'))[0].rows[0]" })`
      — assert count is 3
- [ ] `mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3200/app" })` (hard reload)
- [ ] `mcp__plugin_playwright_playwright__browser_snapshot()` — confirm all
      three cards still rendered, newest-first order preserved
- [ ] `mcp__plugin_playwright_playwright__browser_take_screenshot()` — file the
      screenshot under `local-temp/` for the plan record (do not commit)
- [ ] Stop the dev server

### 3.5 Phase 3 validation

- [ ] `nx run organiclever-web:typecheck` passes
- [ ] `nx run organiclever-web:test:quick` passes
- [ ] `nx run organiclever-web:test:integration` passes

---

## Phase 4 — E2E (Gherkin + Playwright-BDD)

### 4.1 Gherkin feature file

- [ ] Create `specs/apps/organiclever/fe/gherkin/events-mechanism.feature` with
      every `Scenario` from `prd.md` reproduced verbatim, plus a single
      `Background` that:
  - Navigates to `/app`
  - Clears the IndexedDB database `ol_events_v1` via `await indexedDB.deleteDatabase("/pglite/ol_events_v1")`
    (PGlite stores the FS under that key; verify the actual key with one
    run of `await indexedDB.databases()` first)
  - Reloads

### 4.2 Step bindings

- [ ] Create `apps/organiclever-web-e2e/steps/events-mechanism.steps.ts`:
  - [ ] All Given / When / Then steps from the feature file (see `prd.md` for
        the canonical list)
  - [ ] Use `page.evaluate` to read PGlite state for the `PGlite database
"ol_events_v1" (IndexedDB) contains exactly N event(s) ...` assertions — translate
        to a `SELECT count(*) FROM events WHERE kind = $1` call against
        `globalThis.__ol_db`
  - [ ] Add a step `Given I record the original "createdAt" of the "(.*)"
event as T0` that captures the timestamp via `page.evaluate` for the
        bump scenario

### 4.3 Phase 4 validation

- [ ] `nx run organiclever-web-e2e:test:e2e` passes including the new feature
- [ ] `nx run organiclever-web:spec-coverage` passes (every feature step has a
      binding; every binding is referenced by a feature)

---

## Phase 5 — Quality Gate + Push

- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes (matches
      pre-push hook)
- [ ] `nx run organiclever-web:test:integration` passes
- [ ] `nx run organiclever-web-e2e:test:e2e` passes
- [ ] `nx run organiclever-web:test:quick` shows ≥ 70 % LCOV coverage
- [ ] Markdown lint passes for new docs: `npm run lint:md`
- [ ] **Fix-all-issues check**: every gate above is green. If any is red —
      including issues that predate this plan or appear in adjacent files
      surfaced by `nx affected` — fix the root cause now per the [Root Cause
      Orientation principle](../../../governance/principles/general/root-cause-orientation.md).
      Do not bypass with `// eslint-disable`, `// @ts-expect-error`,
      `--no-verify`, `passWithNoTests`, or coverage-exclude entries unless the
      decision is documented and approved.
- [ ] Commit and push to `main` (Trunk Based Development)
- [ ] **Post-push CI verification** per the [CI post-push verification
      convention](../../../governance/development/workflow/ci-post-push-verification.md):
      monitor the GitHub Actions run for `apps/organiclever-web` and
      `apps/organiclever-web-e2e`; if any job fails, fix and re-push before
      declaring done. Pre-push hook is not sufficient.
- [ ] Final manual smoke (Playwright MCP, against deployed Vercel preview if
      one was created): re-run the Phase 3.4 sequence; confirm three different
      kinds persist across reload

---

## Plan Archival

- [ ] Move plan folder `plans/in-progress/2026-04-28__organiclever-web-event-mechanism/`
      → `plans/done/<completion-date>__organiclever-web-event-mechanism/`
      (rename the date prefix to the actual completion date)
- [ ] Update `plans/in-progress/README.md` and `plans/done/README.md` indexes
- [ ] Open the bigger plan
      [`2026-04-25__organiclever-web-app/`](../2026-04-25__organiclever-web-app/README.md):
      its Phase 0 / Phase 1 may now reference `lib/events/event-store.ts`,
      `lib/events/run-migrations.ts`, and the individual migration files under
      `lib/events/migrations/`, plus the existing v1 schema as the underlying
      primitive; the bigger plan adds v2 migration with typed columns
