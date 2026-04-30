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
      `chore(organiclever-web): widen vitest projects + drop src/lib coverage exclude`,
      `chore(organiclever-web): add @electric-sql/pglite + effect + @effect/vitest deps`,
      `feat(journal): add Schema (branded EntryId/IsoTimestamp/EntryName) and re-export types`,
      `feat(journal): add Data.TaggedError union (NotFound/StorageUnavailable/InvalidPayload/EmptyBatch)`,
      `feat(journal): add migration registry v1 (journal_entries table + storage_seq + composite index)`,
      `feat(journal): add PgliteLive Layer + ManagedRuntime factory`,
      `feat(journal): add Effect-returning journal-store (append-batch / update / delete / bump / list / clear)`,
      `feat(journal): add useJournal hook bridging ManagedRuntime to discriminated JournalState`,
      `feat(journal): add formatRelativeTime utility`,
      `test(journal-int): add @effect/vitest Layer-swap integration tests for migrations and CRUD`,
      `feat(journal-ui): add AddEntryButton, EntryFormSheet, JournalList, EntryCard`,
      `feat(app): mount JournalPage at /app with dynamic PGlite import`,
      `test(journal-e2e): add journal-mechanism.feature and step bindings`
- [ ] Split different domains/concerns into separate commits — keep
      `feat(journal):` (schema/errors/runtime/store/hook) separate from
      `feat(journal-ui):` (components) and from `feat(app):` (route wiring)
      and `test(*):` (test files); keep schema, errors, runtime, and store
      in their own commits where the diff size justifies splitting
- [ ] Do NOT amend; create a NEW commit if pre-commit / pre-push hooks fail

---

## Phase 0 — Foundation (`lib/journal/`)

### 0.0 Amend `vitest.config.ts` so colocated tests run + new code is covered

> **Why this step is mandatory**: the existing `apps/organiclever-web/vitest.config.ts`
> excludes `src/lib/**` from coverage AND its unit / integration `projects`
> only match `**/*.unit.{test,spec}.{ts,tsx}` / `test/integration/**/*.{test,spec}.{ts,tsx}`.
> Without this amendment, every `*.test.ts` file colocated under
> `src/lib/journal/` is silently skipped and the new code contributes zero
> LCOV — the "≥ 70 % LCOV" gate becomes a no-op.

- [ ] Open `apps/organiclever-web/vitest.config.ts`
- [ ] Under `test.coverage.exclude`, **remove** the `"src/lib/**"` entry. Keep
      every other entry (`src/services/**`, `src/layers/**`, `src/app/api/**`,
      `src/proxy.ts`, `src/test/**`, `src/app/layout.tsx`,
      `src/generated-contracts/**`, `**/*.{test,spec}.{ts,tsx}`,
      `**/*.stories.{ts,tsx}`)
- [ ] In `test.projects[0]` (the `unit` project), widen `include` to add
      `"src/**/*.{test,spec}.{ts,tsx}"` alongside the existing
      `"test/unit/**/*.steps.{ts,tsx}"` and `"**/*.unit.{test,spec}.{ts,tsx}"`.
      Add an `exclude` rule for `"**/*.int.{test,spec}.{ts,tsx}"` so
      integration files do NOT run under the unit project
- [ ] In `test.projects[1]` (the `integration` project), widen `include` to add
      `"src/**/*.int.{test,spec}.{ts,tsx}"` alongside the existing
      `"test/integration/**/*.{test,spec}.{ts,tsx}"`
- [ ] Run `nx run organiclever-web:typecheck` and
      `nx run organiclever-web:test:quick` against the empty lib/journal folder
      (no tests yet) — both must stay green; coverage report shows no
      regression on the existing landing-page coverage
- [ ] Commit the config change separately:
      `chore(organiclever-web): widen vitest projects + drop src/lib coverage exclude`

### 0.1 Install PGlite + Effect + XState

- [ ] From `ose-public` root: `cd apps/organiclever-web && npm install @electric-sql/pglite effect@^3 xstate@^5 @xstate/react@^5 --save`
      (version pins enforce: latest 0.x for PGlite; `effect@^3` locks to v3.x caret range —
      v4 is still beta as of April 2026 and has breaking changes; `xstate@^5` and
      `@xstate/react@^5` — both must be v5.x to ensure API compatibility)
- [ ] `cd apps/organiclever-web && npm install -D @effect/vitest`
      (Layer-swap test helper; devDep only)
- [ ] Confirm licenses:
  - [ ] `npm view @electric-sql/pglite license` returns `Apache-2.0`
  - [ ] `npm view effect license` returns `MIT`
  - [ ] `npm view xstate license` returns `MIT`
  - [ ] `npm view @xstate/react license` returns `MIT`
  - [ ] `npm view @effect/vitest license` returns `MIT`
- [ ] Verify packages installed: `npm ls @electric-sql/pglite effect xstate @xstate/react @effect/vitest`
      from inside `apps/organiclever-web/`
- [ ] Inspect bundle impact: `nx build organiclever-web --analyze` (or temporarily
      add `withBundleAnalyzer` to `next.config.ts`); confirm the `/app` page chunk
      contains `@electric-sql/pglite`, `effect`, and `xstate` and the landing-page
      chunk contains none of them
- [ ] **No-ORM guardrail**: do NOT install Prisma, Drizzle ORM mode, TypeORM,
      MikroORM, Sequelize, Objection.js, or any other full-fat ORM at any phase
      of this plan. ORMs are forbidden in the persistence layer per the
      tech-docs "No ORM" design decision (unpredictable performance, hidden
      query patterns). If a future phase finds raw SQL noisy, a query
      builder (Kysely, Drizzle query-builder-only) is permitted — but it must
      expose the generated SQL string for plan-inspection
- [ ] **Effect adoption guardrail**: every `Effect.tryPromise(...)` call MUST
      supply a typed `catch` mapper producing a `Data.TaggedError` member of
      `StoreError` — never leave the `E` channel as `UnknownException`. Add a
      grep gate in Phase 5: `git grep -nE "Effect\.tryPromise\([^{]" apps/organiclever-web/src`
      must return zero matches. Same rule for `runPromise` audit:
      `git grep -n "runPromise" apps/organiclever-web/src` must return only
      the two actor files (`journal-machine.ts`) and test files — never UI
      components or page files

### 0.2 Schema, branded ids, and types

- [ ] Create `apps/organiclever-web/src/lib/journal/schema.ts` per `tech-docs.md`:
  - [ ] `EntryId` (`Schema.String.pipe(Schema.brand("EntryId"))`)
  - [ ] `IsoTimestamp` (`Schema.String.pipe(Schema.pattern(...), Schema.brand("IsoTimestamp"))`)
  - [ ] `EntryName` (lowercase / kebab-case + length-bounded; branded)
  - [ ] `EntryPayload` (`Schema.Record({ key: Schema.String, value: Schema.Unknown })`)
  - [ ] `JournalEntry` (`Schema.Struct({...})`)
  - [ ] `NewEntryInput`, `UpdateEntryInput`
  - [ ] `PayloadFromJsonString = Schema.parseJson(EntryPayload)` for the form textarea
- [ ] Create `apps/organiclever-web/src/lib/journal/types.ts` as a thin re-export
      module that exports `Schema.Type`-derived types from `schema.ts`. UI files
      import from `types`; runtime / store files import from `schema` directly
- [ ] Add `apps/organiclever-web/src/lib/journal/schema.unit.test.ts` (per the
      `*.unit.test.ts` convention pinned in Phase 0.0): branded-id rejection of plain strings;
      `JournalEntry` decode round-trip; `PayloadFromJsonString` rejects `"not json"`;
      `ArrayFormatter.formatErrorSync` produces field-level paths

### 0.3 Typed errors

- [ ] Create `apps/organiclever-web/src/lib/journal/errors.ts` per `tech-docs.md`:
  - [ ] `class NotFound extends Data.TaggedError("NotFound")<{ id: string }> {}`
  - [ ] `class StorageUnavailable extends Data.TaggedError("StorageUnavailable")<{ cause: unknown }> {}`
  - [ ] `class InvalidPayload extends Data.TaggedError("InvalidPayload")<{ issues: ReadonlyArray<{ path: string; message: string }> }> {}`
  - [ ] `class EmptyBatch extends Data.TaggedError("EmptyBatch")<{}> {}`
  - [ ] `export type StoreError = NotFound | StorageUnavailable | InvalidPayload | EmptyBatch`

### 0.4 Migration framework — multi-developer safe

#### 0.4.a Codegen script

- [ ] Create `apps/organiclever-web/scripts/gen-migrations.mjs` per the
      tech-docs sketch (~30 lines):
  - [ ] Reads every `*.ts` file in
        `apps/organiclever-web/src/lib/journal/migrations/` (excluding `index.ts`
        and `index.generated.ts`)
  - [ ] Validates each filename matches the regex
        `^\d{4}_\d{2}_\d{2}T\d{2}_\d{2}_\d{2}__[a-z0-9_]{1,60}\.ts$`; throws
        with a clear error on first violation
  - [ ] Sorts lexicographically (timestamp prefix → chronological)
  - [ ] Emits `index.generated.ts` with one `import * as mN from "./<file>";`
        per migration and `export const MIGRATIONS: Migration[] = [m0, m1, ...]`
- [ ] Add gitignore: append
      `src/lib/journal/migrations/index.generated.ts` to
      `apps/organiclever-web/.gitignore`
- [ ] Wire npm scripts in `apps/organiclever-web/package.json`:
  - [ ] `"gen:migrations": "node scripts/gen-migrations.mjs"`
  - [ ] `"predev": "npm run gen:migrations"`
  - [ ] `"prebuild": "npm run gen:migrations"`
  - [ ] `"pretest": "npm run gen:migrations"`
  - [ ] `"pretest:integration": "npm run gen:migrations"`
- [ ] Verify the script is callable: `cd apps/organiclever-web && npm run gen:migrations`
      after step 0.4.b creates the first migration file

#### 0.4.b First migration file (v1: create journal_entries table)

- [ ] Create directory `apps/organiclever-web/src/lib/journal/migrations/`
- [ ] Create `apps/organiclever-web/src/lib/journal/migrations/2026_04_28T14_05_30__create_journal_entries_table.ts`
      (substitute the actual UTC timestamp at file-creation time so the
      filename is honest):
  - [ ] `export const id = "<filename without .ts>"`
  - [ ] `export async function up(db: Queryable): Promise<void>` running the
        v1 SQL from `tech-docs.md` (`CREATE TABLE IF NOT EXISTS journal_entries (...)` + `CREATE INDEX IF NOT EXISTS journal_entries_created_at_desc (...)`)
        — `Queryable = PGlite | Transaction` (imported from
        `@electric-sql/pglite`); the runner calls each `up` from inside
        `db.transaction(async tx => …)`, so `tx` (a `Transaction`) is what
        the migration receives, not the bare `PGlite`. Typing the parameter
        as `PGlite` would fail `tsc --noEmit`
  - [ ] `export async function down(db: Queryable): Promise<void>` reversing it
        (`DROP INDEX IF EXISTS ...; DROP TABLE IF EXISTS journal_entries;`)

#### 0.4.c Runner

- [ ] Create `apps/organiclever-web/src/lib/journal/run-migrations.ts` implementing `runMigrations(db: PGlite): Promise<void>`:
  - [ ] `import { MIGRATIONS } from "./migrations/index.generated"`
  - [ ] Create `_migrations` tracking table:
        `await db.exec("CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())")`
  - [ ] Load applied set:
        `const applied = new Set((await db.query<{ id: string }>("SELECT id FROM _migrations")).rows.map(r => r.id))`
  - [ ] For each pending migration `m` in `MIGRATIONS` not in `applied`, run in a
        per-migration transaction: call `m.up(tx)` then
        `await tx.query("INSERT INTO _migrations(id) VALUES($1)", [m.id])`

#### 0.4.d Runner unit tests

- [ ] Create `apps/organiclever-web/src/lib/journal/run-migrations.unit.test.ts`:
  - [ ] In-memory PGlite — fresh DB, run `runMigrations(db)` once: one row
        in `_migrations` with id `"2026_04_28T14_05_30__create_journal_entries_table"`
  - [ ] Re-running on the same DB is a no-op (still one row, unchanged
        `applied_at`)
  - [ ] Inject a failing migration (e.g., wrap `up` in a throw); assert
        `_migrations` is unchanged AND the partial schema is rolled back
        (e.g., `journal_entries` table does not exist)
  - [ ] Two migrations in sequence apply in lexicographic order; if the second
        fails, the first stays applied (per-migration transaction scoping
        — distinct from libraries that share one transaction across all
        pending migrations)

#### 0.4.e Filename lint

- [ ] The codegen script throws on filename violations; assert this is the
      enforcement point (no separate lint rule needed). Add a unit test:
      `gen-migrations.test.mjs` (or inline) feeds the script a mock directory
      with one bad name and asserts it throws

### 0.5 Effect runtime + Layer

- [ ] Create `apps/organiclever-web/src/lib/journal/runtime.ts` per `tech-docs.md`:
  - [ ] `JOURNAL_STORE_DATA_DIR = "ol_journal_v1"`
  - [ ] `class PgliteService extends Context.Tag("PgliteService")<PgliteService, { readonly db: PGlite }>() {}`
  - [ ] `PgliteLive: Layer.Layer<PgliteService, StorageUnavailable>` via
        `Layer.scoped(PgliteService, Effect.acquireRelease(open, ({ db }) => Effect.promise(() => db.close())))`
  - [ ] Inside `acquire`: `Effect.tryPromise({ try: async () => { ssr-throw; lazy-import PGlite; new PGlite(\`idb://${JOURNAL_STORE_DATA_DIR}\`); await runMigrations(db); dev-handle assign; return { db } }, catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }) })`
  - [ ] `makeJournalRuntime = (layer = PgliteLive) => ManagedRuntime.make(layer)`
  - [ ] `export type JournalRuntime = ReturnType<typeof makeJournalRuntime>`
- [ ] Create `apps/organiclever-web/src/lib/journal/runtime.unit.test.ts`
      (in-memory test layer): acquire-release closes PGlite handle on dispose;
      SSR pretend (`globalThis.window` undefined) yields `StorageUnavailable`

### 0.6 Effect-returning journal store

- [ ] Create `apps/organiclever-web/src/lib/journal/journal-store.ts`:
  - [ ] `appendEntries`: `Effect.gen(function* () { ... })` that fails with
        `EmptyBatch` on empty input; pulls `db` via `yield* PgliteService`;
        executes one multi-VALUES `INSERT ... RETURNING ...` with one shared
        `now()` timestamp; decodes rows via `Schema.decodeUnknownSync(JournalEntry)`
  - [ ] `updateEntry`: `UPDATE ... COALESCE ... RETURNING`; fails with
        `NotFound({ id })` when `rowCount === 0`
  - [ ] `deleteEntry`: `DELETE` then return `Effect.succeed(rowCount > 0)`
        (boolean; non-exceptional miss). Only IO failures are mapped to
        `StorageUnavailable` — never `NotFound` for delete
  - [ ] `bumpEntry`: `UPDATE ... SET created_at = now(), updated_at = now() ... RETURNING`; fails with `NotFound({ id })` on miss
  - [ ] `listEntries`: `SELECT ... ORDER BY created_at DESC, storage_seq ASC`
  - [ ] `clearEntries`: `TRUNCATE journal_entries RESTART IDENTITY`
  - [ ] Every `Effect.tryPromise` MUST supply a `catch` mapper producing
        `StorageUnavailable({ cause })` — never leave `UnknownException` in `E`
  - [ ] All return types in `journal-store.ts` are `Effect<..., StoreError, PgliteService>`;
        no `Promise<...>` exports
- [ ] Add `apps/organiclever-web/src/lib/journal/journal-store.unit.test.ts`
      using `@effect/vitest`'s `it.effect("...", ..., { layer: TestPgliteLayer })`
      where `TestPgliteLayer = Layer.scoped(PgliteService, Effect.acquireRelease(in-memory PGlite + migrations, db.close))`

### 0.7a XState machine (`journal-machine.ts`)

- [ ] Create `apps/organiclever-web/src/lib/journal/journal-machine.ts` per `tech-docs.md`:
  - [ ] `JournalContext` interface: `{ runtime, entries, initError, mutationError }`
  - [ ] `JournalEvent` union: `ADD_BATCH | EDIT | DELETE | BUMP | CLEAR`
  - [ ] `JournalInput` interface: `{ runtime: JournalRuntime }`
  - [ ] `loadEntries` actor: `fromPromise(({ input }) => input.runtime.runPromise(listEntries()))`
  - [ ] `runMutation` actor: `fromPromise` that dispatches on `event.type` to the
        correct store Effect, then re-runs `listEntries` — returns updated list on
        success, rejects with typed `StoreError` on failure
  - [ ] Machine states:
    - [ ] `initializing` — invokes `loadEntries`; on done → `ready` (assign entries);
          on error → `error` (assign `initError`)
    - [ ] `ready` — compound state, initial substate `idle`
      - [ ] `idle` — accepts all five mutation events, transitions to `mutating`
      - [ ] `mutating` — `entry` action clears `mutationError` (prevents stale error
            contaminating next Promise resolution); invokes `runMutation` with
            `{ runtime, event }` as input; on done → `idle` (assign entries,
            clear `mutationError`); on error → `idle` (assign `mutationError`,
            entries unchanged — non-fatal)
    - [ ] `error` — terminal; user must hard-reload
  - [ ] `context` initialiser: `({ input }) => ({ runtime: input.runtime, entries: [], initError: null, mutationError: null })`
- [ ] Add `apps/organiclever-web/src/lib/journal/journal-machine.unit.test.ts`:
  - [ ] Create actor with in-memory test runtime (Layer-swapped `PgliteService`);
        assert machine starts in `initializing`
  - [ ] `waitFor(actor, s => s.matches("ready"))` — assert `entries` populated and
        `initError` null after `loadEntries` resolves
  - [ ] Send `ADD_BATCH` event — assert machine transitions to `ready.mutating`,
        then back to `ready.idle` with updated entries
  - [ ] Force `runMutation` to reject (e.g., inject broken runtime) — assert machine
        returns to `ready.idle` with `mutationError` set and entries unchanged
  - [ ] Assert `entry` action clears stale `mutationError`: after one failed
        mutation, send another event and verify `mutationError` is null while in
        `mutating` (before actor settles)
  - [ ] Force `loadEntries` to reject — assert machine lands in `error` with
        `initError` set

### 0.7b `use-journal.ts` wrapper (`useActorRef` + `useSelector`)

- [ ] Create `apps/organiclever-web/src/lib/journal/use-journal.ts` per `tech-docs.md`:
  - [ ] `JournalState` derived union:
        `{ status: "loading" } | { status: "ready"; entries; isMutating; mutationError } | { status: "error"; cause }`
  - [ ] `const runtime = useMemo(() => makeJournalRuntime(), [])` (one runtime per mount)
  - [ ] `useEffect(() => () => runtime.dispose(), [runtime])` (Layer finalisers
        close PGlite on unmount — runs AFTER React stops the actor)
  - [ ] `useActorRef(journalMachine, { input: { runtime } })` to start the machine
  - [ ] `useSelector(actorRef, snapshot => ...)` to derive `JournalState`:
        `initializing` → `loading`; `error` → `error` (cause = `initError`);
        `ready` → `ready` (entries, `isMutating = matches({ ready: "mutating" })`,
        `mutationError`)
  - [ ] `sendMutation(event)` helper: subscribes to actor, sends event, resolves
        when `ready.idle` reached after `seenMutating = true`, rejects when
        `context.mutationError` is non-null at that point
  - [ ] Return `{ state, addBatch, edit, remove, bump, clear }` — each mutation
        method calls `sendMutation` with the appropriate typed event
- [ ] Add `apps/organiclever-web/src/lib/journal/use-journal.unit.test.tsx`
      (RTL + in-memory test runtime):
  - [ ] Renders with test layer; asserts `state.status === "loading"` then
        transitions to `"ready"` after actor settles
  - [ ] `addBatch(drafts)` Promise resolves; `state.entries` updated
  - [ ] `addBatch` Promise rejects with typed `StoreError` when mutation actor fails;
        `state.status` stays `"ready"` (non-fatal)
  - [ ] `state.isMutating` is `true` while actor in flight, `false` after
  - [ ] Force init failure → `state.status === "error"`, `state.cause._tag === "StorageUnavailable"`

### 0.8 Time formatter

- [ ] Create `apps/organiclever-web/src/lib/journal/format-relative-time.ts`
      with the signature in `tech-docs.md`
- [ ] Create `apps/organiclever-web/src/lib/journal/format-relative-time.unit.test.ts`:
  - [ ] `< 60s` → `"just now"`
  - [ ] `< 60m` → `"{n}m ago"` (boundary 1m, 59m)
  - [ ] `< 24h` → `"{n}h ago"` (boundary 1h, 23h)
  - [ ] `< 7d` → `"{n}d ago"` (boundary 1d, 6d)
  - [ ] `>= 7d` → ISO `YYYY-MM-DD`

### 0.9 Phase 0 validation

- [ ] `nx run organiclever-web:typecheck` passes
- [ ] `nx run organiclever-web:lint` passes
- [ ] `nx run organiclever-web:test:quick` passes (≥ 70 % LCOV)

---

## Phase 1 — Integration tests (real PGlite, in-memory)

### 1.1 Wire up `test:integration`

- [ ] Confirm `apps/organiclever-web/project.json` has the `test:integration`
      Nx target (it does — runs `npx vitest run --project integration`)
- [ ] Note: the `passWithNoTests: true` flag lives in
      `apps/organiclever-web/vitest.config.ts` at the top-level `test:` block
      (NOT in `project.json`); it stays as-is — once Phase 1 adds real
      integration tests it becomes inert (the suite has work to do)
- [ ] Phase 0.0 already widened the integration project's `include`
      to pick up `src/**/*.int.{test,spec}.{ts,tsx}`, so colocated
      `journal-store.int.test.ts` files run under `--project integration`
      automatically — no separate `vitest.integration.config.ts` needed

### 1.2 Integration test files

- [ ] Create `apps/organiclever-web/src/lib/journal/journal-store.int.test.ts`
      using `@effect/vitest`'s `it.effect("...", ..., { layer: TestPgliteLayer })`
      where `TestPgliteLayer = Layer.scoped(PgliteService, Effect.acquireRelease(
    Effect.promise(async () => { const db = new PGlite(); await runMigrations(db); return { db }; }),
    ({ db }) => Effect.promise(() => db.close())
  ))` — each `it.effect` test receives a fresh isolated Effect runtime with an
      empty in-memory database; no shared state between tests:
  - [ ] **Migration idempotency**: second `runMigrations(db)` is a no-op
  - [ ] **Batch atomicity**: `appendEntries([a, b, c])` returns 3 entries with
        identical `createdAt`; storage rowcount is 3
  - [ ] **Sort tiebreaker**: appended batch comes back in `(createdAt DESC, storage_seq ASC)`
  - [ ] **Cross-batch ordering**: entries from a later batch sort first, with
        within-batch order preserved
  - [ ] **`updateEntry` preserves `createdAt`**: new `updatedAt > createdAt`
  - [ ] **`updateEntry` partial patch**: omitting `name` leaves it unchanged
        (COALESCE behaviour)
  - [ ] **`updateEntry` of missing id**: `Effect.runPromiseExit` returns
        `Exit.Failure` carrying `Cause.fail(new NotFound({ id }))` (typed-error
        miss; `Effect.catchTag("NotFound", ...)` narrows in user code)
  - [ ] **`deleteEntry` rowcount semantics**: hit resolves to `true`, miss
        resolves to `false` (non-exceptional; deleting a vanished row is the
        desired end state)
  - [ ] **`bumpEntry` of missing id**: `Effect.runPromiseExit` returns
        `Exit.Failure` carrying `Cause.fail(new NotFound({ id }))`
  - [ ] **`bumpEntry` mutates both timestamps**: bumped entry becomes newest;
        original `createdAt` is overwritten
  - [ ] **`clearEntries`**: `listEntries` returns `[]`; `storage_seq` resets
  - [ ] **Stats SQL**: insert a fixture spanning 14 days across 3 names; assert
        the date-trunc-per-name, total-mins-per-name, and streak queries from
        `tech-docs.md` return the expected aggregations

### 1.3 Phase 1 validation

- [ ] `nx run organiclever-web:test:integration` passes
- [ ] Coverage from integration tests counts toward the project threshold (no
      regression below 70 % LCOV)

---

## Phase 2 — UI components (`components/app/`)

### 2.1 AddEntryButton

- [ ] Create `apps/organiclever-web/src/components/app/add-entry-button.tsx`:
  - [ ] Props: `{ onClick: () => void }`
  - [ ] `<button aria-label="Add entry">Add entry</button>` (or "+ Add entry")
  - [ ] Tailwind styling consistent with existing landing components
  - [ ] Keyboard reachable

### 2.2 EntryFormSheet (batch + edit modes)

- [ ] Create `apps/organiclever-web/src/components/app/entry-form-sheet.tsx`
      with the discriminated `EntryFormSheetProps` from `tech-docs.md`:
  - [ ] **Create mode**: `drafts` array, "+ Add another" appends, "Remove draft"
        splice-removes (disabled when only one)
  - [ ] **Edit mode**: single draft seeded from `initial`
  - [ ] Preset chips (`workout`, `reading`, `meditation`) per draft
  - [ ] Per-draft validation: empty name, invalid JSON, non-object JSON
  - [ ] All-or-nothing save in create mode
  - [ ] Cancel discards local state

### 2.3 JournalList + EntryCard

- [ ] Create `apps/organiclever-web/src/components/app/journal-list.tsx`:
  - [ ] Empty-state copy "No entries yet — press + to add one" when empty
  - [ ] Renders `<ul>` of `<EntryCard>` props per item
- [ ] Create `apps/organiclever-web/src/components/app/entry-card.tsx`:
  - [ ] Header: name, relative `createdAt`, "edited Xm ago" when `updatedAt > createdAt`
  - [ ] Action row: Edit / Bring to top / Delete
  - [ ] Delete uses inline two-step confirm
  - [ ] `<details>` payload disclosure with pretty-printed JSON

### 2.4 Component unit tests

- [ ] `add-entry-button.unit.test.tsx`: click invokes `onClick`; aria-label present
- [ ] `entry-form-sheet.unit.test.tsx`:
  - [ ] Create mode: empty name blocks submit; invalid JSON blocks; non-object JSON blocks
  - [ ] Create mode: "+ Add another" / "Remove draft" mutate draft list
  - [ ] Create mode: valid submit calls `onSubmit` with array of `{name, payload}`
  - [ ] Edit mode: seeded with `initial`; submit calls `onSubmit` with patch
  - [ ] Cancel calls `onCancel`, no `onSubmit`
  - [ ] Preset chip click sets that draft's name
- [ ] `journal-list.unit.test.tsx`: empty-state copy / N cards
- [ ] `entry-card.unit.test.tsx`:
  - [ ] Renders name, time, payload preview
  - [ ] Shows "edited Xm ago" only when `updatedAt > createdAt`
  - [ ] Edit button calls `onEdit(id)`; Bring-to-top calls `onBump(id)`
  - [ ] Delete shows confirm; Cancel reverts; Yes calls `onDelete(id)`

### 2.5 Phase 2 validation

- [ ] `nx run organiclever-web:typecheck` passes
- [ ] `nx run organiclever-web:test:quick` passes (≥ 70 % LCOV)

---

## Phase 3 — Page wiring

### 3.1 JournalPage composer

- [ ] Create `apps/organiclever-web/src/components/app/journal-page.tsx`:
  - [ ] Uses `useJournal()`
  - [ ] Renders skeleton while `status === "loading"`
  - [ ] Renders error banner while `status === "error"`
  - [ ] Otherwise renders `<h1>Journal</h1>`, `<AddEntryButton ... />`,
        `<JournalList ... />`, `<EntryFormSheet ... />`
  - [ ] `handleSubmit` dispatches `addBatch` (create) or `edit` (edit) and
        closes the sheet

### 3.2 /app route

- [ ] Create `apps/organiclever-web/src/app/app/page.tsx`:
  - [ ] `"use client";`
  - [ ] `export const dynamic = "force-dynamic";`
  - [ ] Default export: `<JournalPage />`

### 3.3 JournalPage unit test (Layer-swapped in-memory PGlite)

- [ ] `journal-page.unit.test.tsx` (Vitest + RTL + in-memory PGlite via Layer-swap):
  - [ ] Loading skeleton on first render
  - [ ] Empty state after store resolves
  - [ ] Click "Add entry" → form sheet opens
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
- [ ] `mcp__plugin_playwright_playwright__browser_wait_for({ text: "Journal" })`
- [ ] `mcp__plugin_playwright_playwright__browser_snapshot()` — confirm empty
      state copy "No entries yet — press + to add one" is visible
- [ ] `mcp__plugin_playwright_playwright__browser_console_messages()` — assert
      no error-level messages logged during PGlite WASM load
- [ ] `mcp__plugin_playwright_playwright__browser_click({ element: "Add entry button", ref: "<from snapshot>" })`
- [ ] `mcp__plugin_playwright_playwright__browser_fill_form({ fields: [
  { name: "Name input draft 1", type: "textbox", ref: "...", value: "workout" },
  { name: "Payload textarea draft 1", type: "textbox", ref: "...", value: "{\"reps\": 12}" }
]})`
- [ ] `mcp__plugin_playwright_playwright__browser_click({ element: "Save button", ref: "..." })`
- [ ] `mcp__plugin_playwright_playwright__browser_snapshot()` — confirm one card
      with name "workout" appears
- [ ] Repeat the click → fill → save sequence for `reading` and `meditation`
- [ ] `mcp__plugin_playwright_playwright__browser_evaluate({ function: "() => indexedDB.databases().then(dbs => dbs.map(d => d.name))" })`
      — assert the returned array contains `"/pglite/ol_journal_v1"` (PGlite
      mounts IDBFS at `/pglite/<dataDir>`, so the bare `ol_journal_v1` is the
      `dataDir`, not the IDB database name)
- [ ] `mcp__plugin_playwright_playwright__browser_evaluate({ function: "async () => (await globalThis.__ol_db.exec('SELECT count(*) FROM journal_entries'))[0].rows[0]" })`
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

- [ ] Create `specs/apps/organiclever/fe/gherkin/journal/journal-mechanism.feature` with
      every `Scenario` from `prd.md` reproduced verbatim, using the 2-step
      `Background` from `prd.md` (`Given the app is running` /
      `And I have opened "/app" in a fresh browser session`). The "is empty"
      assertion is scenario-specific (see the "Empty state on first visit"
      scenario); the IDB reset is a step-binding implementation detail of
      the "fresh browser session" step.

### 4.2 Step bindings

- [ ] Create `apps/organiclever-web-e2e/steps/journal-mechanism.steps.ts`:
  - [ ] All Given / When / Then steps from the feature file (see `prd.md` for
        the canonical list)
  - [ ] Use `page.evaluate` to read PGlite state for the `PGlite database
"ol_journal_v1" (IndexedDB) contains exactly N entry/entries ...` assertions — translate
        to a `SELECT count(*) FROM journal_entries WHERE name = $1` call against
        `globalThis.__ol_db`
  - [ ] Add a step `Given I record the original "createdAt" of the "(.*)"
entry as T0` that captures the timestamp via `page.evaluate` for the
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

- [ ] Use `git mv` to move the plan folder so git history follows the rename:
      `git mv plans/in-progress/2026-04-28__organiclever-web-event-mechanism plans/done/<completion-date>__organiclever-web-event-mechanism`
      (substitute the actual completion date, e.g., `2026-05-02`)
- [ ] Update `plans/in-progress/README.md` and `plans/done/README.md` indexes
- [ ] Commit the archival move:
      `git commit -m "chore(plans): archive organiclever-web-event-mechanism to done"`
      and push to `origin main`
- [ ] Open the bigger plan
      [`2026-04-25__organiclever-web-app/`](../2026-04-25__organiclever-web-app/README.md):
      its Phase 0 / Phase 1 may now reference `lib/journal/journal-store.ts`,
      `lib/journal/run-migrations.ts`, and the individual migration files under
      `lib/journal/migrations/`, plus the existing v1 schema as the underlying
      primitive; the bigger plan adds v2 migration with typed columns
