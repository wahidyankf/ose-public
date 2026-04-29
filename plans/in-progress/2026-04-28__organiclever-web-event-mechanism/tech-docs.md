# Technical Documentation

## Route Architecture

```text
/                       → existing landing page (untouched)
/system/status/be       → existing backend status (untouched)
/app                    → NEW — apps/organiclever-web/src/app/app/page.tsx
                          'use client'
                          export const dynamic = 'force-dynamic'
                          mounts <JournalPage />
```

`/app/page.tsx` is **provisional** for this gear-up. The bigger plan
([`2026-04-25__organiclever-web-app/`](../2026-04-25__organiclever-web-app/README.md))
explicitly replaces it with `<AppRoot />` (TabBar / SideNav / hash routing).
This plan deliberately does NOT introduce hash routing — the page is a single
mount with one screen.

## File Map

```text
apps/organiclever-web/src/
├── app/
│   └── app/
│       └── page.tsx                          ← Phase 3 (provisional)
├── components/
│   └── app/
│       ├── journal-page.tsx                   ← Phase 3 (composes the trio)
│       ├── journal-page.unit.test.tsx         ← Phase 3
│       ├── add-entry-button.tsx              ← Phase 2
│       ├── add-entry-button.unit.test.tsx    ← Phase 2
│       ├── entry-form-sheet.tsx              ← Phase 2
│       ├── entry-form-sheet.unit.test.tsx    ← Phase 2
│       ├── journal-list.tsx                    ← Phase 2
│       ├── journal-list.unit.test.tsx          ← Phase 2
│       ├── entry-card.tsx                    ← Phase 2
│       └── entry-card.unit.test.tsx          ← Phase 2
└── lib/
    └── journal/
        ├── types.ts                          ← Phase 0 (re-exports Schema-derived types)
        ├── schema.ts                         ← Phase 0 (Effect Schema + branded ids)
        ├── errors.ts                         ← Phase 0 (Data.TaggedError union)
        ├── runtime.ts                        ← Phase 0 (PgliteService + Layer + ManagedRuntime)
        ├── run-migrations.ts                 ← Phase 0
        ├── run-migrations.unit.test.ts       ← Phase 0
        ├── migrations/                       ← Phase 0 (one .ts per migration)
        │   ├── 2026_04_28T14_05_30__create_journal_entries_table.ts   ← Phase 0
        │   └── index.generated.ts            ← gitignored, emitted by gen:migrations
        ├── schema.unit.test.ts               ← Phase 0
        ├── runtime.unit.test.ts              ← Phase 0
        ├── journal-store.ts                    ← Phase 0 (Effect-returning)
        ├── journal-store.unit.test.ts          ← Phase 0
        ├── journal-store.int.test.ts           ← Phase 1
        ├── use-journal.ts                     ← Phase 0 (ManagedRuntime bridge)
        ├── use-journal.unit.test.tsx          ← Phase 0
        ├── format-relative-time.ts           ← Phase 0
        └── format-relative-time.unit.test.ts ← Phase 0

apps/organiclever-web/scripts/
└── gen-migrations.mjs                        ← Phase 0 (codegen)

apps/organiclever-web-e2e/
└── steps/
    └── journal-mechanism.steps.ts             ← Phase 4

specs/apps/organiclever/fe/gherkin/journal/
└── journal-mechanism.feature                  ← Phase 4
```

The bigger plan's `components/app/app-root.tsx`, `components/app/tab-bar.tsx`,
etc. are NOT created here. The bigger plan's Phase 1 replaces the body of
`src/app/app/page.tsx` (mounting `<AppRoot />` instead of `<JournalPage />`)
and extends the gear-up's `lib/journal/*` via a v2 migration adding typed-
payload columns plus per-name `Schema.Union`. The PGlite database identity
(`dataDir = ol_journal_v1`, IDB key `/pglite/ol_journal_v1`) is preserved
across both plans — there is no rename and no data migration between
databases.

## Data Model (Effect Schema + branded primitives)

```typescript
// src/lib/journal/schema.ts (complete)

import { Schema } from "effect";

/**
 * Branded primitive types — `EntryId` and `IsoTimestamp` are nominally distinct
 * from raw `string` even though their wire representation is plain `string`.
 * Two functions accepting `EntryId` will reject a function arg typed only as
 * `string`, catching id/timestamp confusion at compile time. Brands are
 * compile-time markers only — no runtime cost.
 */
export const EntryId = Schema.String.pipe(Schema.brand("EntryId"));
export type EntryId = typeof EntryId.Type; // string & Brand<"EntryId">

export const IsoTimestamp = Schema.String.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/),
  Schema.brand("IsoTimestamp"),
);
export type IsoTimestamp = typeof IsoTimestamp.Type;

/**
 * `EntryName` is an open string. Constrained at the schema layer to be
 * non-empty + ≤ 64 chars + lowercase / kebab-cased — enough to keep typos
 * from sneaking in without freezing a discriminated union (the bigger plan's
 * job).
 */
export const EntryName = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(64),
  Schema.pattern(/^[a-z][a-z0-9-]*$/),
  Schema.brand("EntryName"),
);
export type EntryName = typeof EntryName.Type;

/**
 * `EntryPayload` is an arbitrary JSON object — `Schema.Record({key: String,
 * value: Unknown})`. The gear-up does NOT constrain its shape; bigger plan
 * layers per-name unions on top.
 */
export const EntryPayload = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown,
});
export type EntryPayload = typeof EntryPayload.Type;

/** Persisted entry row. */
export const JournalEntry = Schema.Struct({
  id: EntryId,
  name: EntryName,
  payload: EntryPayload,
  createdAt: IsoTimestamp,
  updatedAt: IsoTimestamp,
});
export type JournalEntry = typeof JournalEntry.Type;

/** Form-sheet draft input — `id`, `createdAt`, `updatedAt` assigned by the store. */
export const NewEntryInput = Schema.Struct({
  name: EntryName,
  payload: EntryPayload,
});
export type NewEntryInput = typeof NewEntryInput.Type;

/** Edit-mode patch — both fields optional. */
export const UpdateEntryInput = Schema.Struct({
  name: Schema.optional(EntryName),
  payload: Schema.optional(EntryPayload),
});
export type UpdateEntryInput = typeof UpdateEntryInput.Type;

/** Decoder for the form's "string of valid JSON object" textarea. */
export const PayloadFromJsonString = Schema.parseJson(EntryPayload);
```

`src/lib/journal/types.ts` is a thin re-export module:

```typescript
export type {
  JournalEntry,
  EntryId,
  EntryName,
  EntryPayload,
  IsoTimestamp,
  NewEntryInput,
  UpdateEntryInput,
} from "./schema";
```

## Typed Errors (`Data.TaggedError`)

```typescript
// src/lib/journal/errors.ts (complete)

import { Data } from "effect";

/** Asked for an entry id that no row matches. */
export class NotFound extends Data.TaggedError("NotFound")<{
  readonly id: string;
}> {}

/** IndexedDB / PGlite refused the write (quota, locked, corrupt). */
export class StorageUnavailable extends Data.TaggedError("StorageUnavailable")<{
  readonly cause: unknown;
}> {}

/** Schema decode rejected the input (form draft did not match shape). */
export class InvalidPayload extends Data.TaggedError("InvalidPayload")<{
  readonly issues: ReadonlyArray<{ readonly path: string; readonly message: string }>;
}> {}

/** Caller passed an empty batch to `appendEntries`. */
export class EmptyBatch extends Data.TaggedError("EmptyBatch")<{}> {}

/** Discriminated union surfacing in every store function's `E` channel. */
export type StoreError = NotFound | StorageUnavailable | InvalidPayload | EmptyBatch;
```

The `_tag` discriminator is preserved across `Effect.flatMap` / `Effect.gen`
chains, so call-sites can narrow with `Effect.catchTag("NotFound", e => …)`,
`Effect.catchTags({ NotFound: …, StorageUnavailable: … })`, or — at the React
boundary — `if (state.cause._tag === "StorageUnavailable") { … }`.

## Storage Layer — PGlite (Postgres-WASM)

Persistence uses [PGlite](https://github.com/electric-sql/pglite) (Apache 2.0,
free / open source) — a Postgres build compiled to WebAssembly with an
**IndexedDB**-backed virtual filesystem. PGlite `dataDir` is `ol_journal_v1`,
opened via the connection-string prefix `idb://` (`new PGlite("idb://ol_journal_v1")`).
PGlite mounts the Emscripten IDBFS at `/pglite/<dataDir>`, so the **actual
IndexedDB database name** the browser stores is `/pglite/ol_journal_v1` — that
is the key the E2E tests use with `indexedDB.deleteDatabase(...)` and
`indexedDB.databases()`.

**Why PGlite (not localStorage, not SQLite-WASM)**:

- **SQL-queryable** for the bigger plan's stats consumer — proper indexed range
  queries, window functions, JSON operators on `payload`. localStorage would
  require client-side scans for every query.
- **Postgres dialect** matches the eventual server side (`organiclever-be` sits
  on Postgres in production); SQL written here is portable to the BE without
  rewrites.
- **IndexedDB-backed FS** means **no COOP/COEP HTTP headers needed** on Vercel
  (which the OPFS-backed SQLite-WASM stack would require). Frictionless deploy.
- **FOSS** (Apache 2.0). No commercial-tier dependency.
- **Bundle**: ~3 MB gzipped, lazy-loaded only on `/app` via
  `dynamic(() => import(...), { ssr: false })`. Landing page (`/`) is unaffected.
- **Future PWA sync**: deferred to a later plan; PGlite plays cleanly with
  service-worker-driven pull-push to `organiclever-be`. No commitment to a
  specific sync engine here.

### Database migration framework

Schema changes are applied via a **hand-rolled, idempotent migration runner**
designed for **multi-developer concurrent authorship**. No external migration
package is introduced in the gear-up; the runner is ~50 lines of TypeScript
plus a ~30-line codegen script and gives the bigger plan / PWA sync plan a
single point to add new migration files without merge conflicts.

#### Filename convention (multi-dev safe)

Every migration lives in its own file under
`src/lib/journal/migrations/` with the filename pattern:

```
YYYY_MM_DDTHH_MM_SS__snake_case_title.ts
```

Strict regex: `^\d{4}_\d{2}_\d{2}T\d{2}_\d{2}_\d{2}__[a-z0-9_]{1,60}\.ts$`

- ISO-8601 second-precision timestamp prefix (UTC); underscores instead of
  `:` / `-` for filesystem safety
- `__` (double underscore) separator — matches the `plans/YYYY-MM-DD__identifier/`
  convention elsewhere in this repo, recognisable cue
- `snake_case` mandatory title (1..60 chars, `[a-z0-9_]+`); empty title is a
  lint error (and unhelpful in PR review)
- `.ts` extension; each migration file exports `up` and (optional) `down`

Examples:

- `2026_04_28T14_05_30__create_journal_entries_table.ts` (gear-up v1)
- `2026_05_03T09_22_15__add_typed_payload_columns.ts` (bigger plan v2)
- `2026_06_15T11_45_00__add_sync_state_columns.ts` (PWA-sync plan v3)

**Multi-dev safety**: timestamp + title produces unique filenames per branch.
Two PRs adding migrations on the same day collide only if both authors pick
the same second AND the same title — vanishingly improbable; if it happens,
git rejects the second `git add` and the second author bumps the timestamp by
one second.

#### Migration file shape

```typescript
// src/lib/journal/migrations/2026_04_28T14_05_30__create_journal_entries_table.ts

import type { PGlite, Transaction } from "@electric-sql/pglite";

/**
 * `Queryable` covers both the top-level PGlite handle and a Transaction handle.
 * The runner calls `m.up(tx)` from inside `db.transaction(async tx => …)`, so
 * `tx` (a `Transaction`) is what each migration receives — not the bare
 * `PGlite`. The union keeps the migration type honest under `tsc --noEmit`.
 */
export type Queryable = PGlite | Transaction;

export const id = "2026_04_28T14_05_30__create_journal_entries_table";

export async function up(db: Queryable): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL CHECK (length(name) > 0),
      payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at  TIMESTAMPTZ NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL,
      storage_seq BIGSERIAL
    );
    CREATE INDEX IF NOT EXISTS journal_entries_created_at_desc
      ON journal_entries (created_at DESC, storage_seq ASC);
  `);
}

export async function down(db: Queryable): Promise<void> {
  await db.exec(`
    DROP INDEX IF EXISTS journal_entries_created_at_desc;
    DROP TABLE IF EXISTS journal_entries;
  `);
}
```

`down` is recommended but not required by the runner; the gear-up does not
expose a CLI for rollback (rollback is a developer-tooling concern, not a
runtime concern).

#### Codegen script + generated index

Browser-bundled JS cannot `readdir()` the migrations directory at runtime, so
a small codegen script emits a static `index.generated.ts` that imports every
migration file and exports a sorted array. The generated file is **gitignored**
to keep merge conflicts impossible.

```javascript
// scripts/gen-migrations.mjs (~30 lines)

import { readdirSync, writeFileSync } from "fs";
import { join } from "path";

// CWD is `apps/organiclever-web/` because npm scripts run from package root.
const MIGRATION_DIR = "src/lib/journal/migrations";
const OUTPUT = `${MIGRATION_DIR}/index.generated.ts`;
const FILENAME_RX = /^(\d{4}_\d{2}_\d{2}T\d{2}_\d{2}_\d{2}__[a-z0-9_]{1,60})\.ts$/;

const files = readdirSync(MIGRATION_DIR)
  .filter((f) => f !== "index.generated.ts" && f !== "index.ts")
  .filter((f) => f.endsWith(".ts"));

for (const f of files) {
  if (!FILENAME_RX.test(f)) {
    throw new Error(`Migration filename violates convention: ${f}`);
  }
}

const sorted = files.sort(); // lexicographic order = chronological order

const imports = sorted.map((f, i) => `import * as m${i} from "./${f.replace(/\.ts$/, "")}";`).join("\n");

const arr = sorted.map((_, i) => `m${i}`).join(", ");

writeFileSync(
  OUTPUT,
  `// AUTO-GENERATED — do not edit. Run \`npm run gen:migrations\`.

${imports}

import type { PGlite, Transaction } from "@electric-sql/pglite";
type Queryable = PGlite | Transaction;
export interface Migration { id: string; up: (db: Queryable) => Promise<void>; down?: (db: Queryable) => Promise<void>; }

export const MIGRATIONS: Migration[] = [${arr}];
`,
);
```

`apps/organiclever-web/.gitignore` adds:

```
src/lib/journal/migrations/index.generated.ts
```

`apps/organiclever-web/package.json` scripts:

```json
{
  "scripts": {
    "gen:migrations": "node scripts/gen-migrations.mjs",
    "predev": "npm run gen:migrations",
    "prebuild": "npm run gen:migrations",
    "pretest": "npm run gen:migrations",
    "pretest:integration": "npm run gen:migrations"
  }
}
```

The script is idempotent and fast (< 50 ms even with hundreds of migrations).
Running `nx dev`, `nx build`, `nx test:quick`, or `nx test:integration`
regenerates the index automatically; developers do not invoke it manually.

#### Runner

```typescript
// src/lib/journal/run-migrations.ts (signature)

import { MIGRATIONS } from "./migrations/index.generated";
import type { PGlite } from "@electric-sql/pglite";

export async function runMigrations(db: PGlite): Promise<void>;
```

Implementation outline:

1. `CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`
2. `SELECT id FROM _migrations` → set of applied ids
3. For each `m` in `MIGRATIONS` (already lexicographically sorted by codegen),
   if `m.id` not in applied set:

   ```typescript
   await db.transaction(async (tx) => {
     await m.up(tx);
     await tx.query("INSERT INTO _migrations(id) VALUES($1)", [m.id]);
   });
   ```

4. Done.

Each migration runs inside its **own** transaction so a partial failure rolls
back only the failing migration; previously-applied migrations stay applied.
This is a deliberate departure from libraries like Kysely's `Migrator` (which
shares one transaction across all pending migrations per `migrateToLatest()`
call) — per-migration scoping is friendlier when one migration in a longer
sequence fails on a developer machine.

Tracking table:

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  id          TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Forward path:

- Bigger app plan adds e.g. `2026_05_03T09_22_15__add_typed_payload_columns.ts`
  introducing `started_at`, `finished_at`, and a typed `name` check
  constraint (without dropping the gear-up's columns).
- PWA sync plan adds e.g. `2026_06_15T11_45_00__add_sync_state_columns.ts`
  introducing `original_created_at`, `deleted_at`, `synced_at`, `dirty`,
  `client_id` (all defaulting to safe values for existing rows).

`storage_seq` (a `BIGSERIAL`) gives the deterministic insertion-order tiebreaker
needed for batch submits where every row in the batch shares `created_at`.

**Reserved column names for future PWA sync** (NOT added in this plan):

- `original_created_at TIMESTAMPTZ` — immutable creation time, unaffected by
  bump; lets stats compute true age. Bigger plan / sync plan adds this.
- `deleted_at TIMESTAMPTZ` — soft-delete tombstone for sync. Gear-up uses
  hard deletes; sync plan replaces `deleteEntry` with a tombstone setter.
- `synced_at TIMESTAMPTZ` / `dirty BOOLEAN` — sync state per row. Sync plan
  adds whichever flavour fits the PWA sync engine chosen.

Adding these later is **additive** — every gear-up call-site keeps working.

## Effect Runtime + `PgliteService` Layer

```typescript
// src/lib/journal/runtime.ts (complete)

import { Context, Effect, Layer, ManagedRuntime } from "effect";
import type { PGlite } from "@electric-sql/pglite";
import { runMigrations } from "./run-migrations";
import { StorageUnavailable } from "./errors";

export const JOURNAL_STORE_DATA_DIR = "ol_journal_v1"; // PGlite dataDir; IDB DB name is /pglite/ol_journal_v1

/**
 * `PgliteService` is the only service the gear-up's `Layer` provides. The
 * class-based `Context.Tag` pattern gives nominal typing — two structurally
 * identical tags do NOT unify, preventing accidental substitution. The shape
 * exposes the raw PGlite handle; raw SQL lives in `journal-store.ts`.
 */
export class PgliteService extends Context.Tag("PgliteService")<PgliteService, { readonly db: PGlite }>() {}

/**
 * `PgliteLive` opens a PGlite handle backed by IndexedDB, runs the migration
 * registry, and exposes the handle as `PgliteService`. `Layer.scoped` wraps
 * `Effect.acquireRelease` so the handle is closed on runtime dispose
 * (e.g., when the React component unmounts). On the server (`typeof window
 * === "undefined"`) the layer fails fast with `StorageUnavailable` — the
 * React layer guards by initialising the runtime inside `useEffect`, so the
 * server path is not normally reached.
 */
export const PgliteLive: Layer.Layer<PgliteService, StorageUnavailable> = Layer.scoped(
  PgliteService,
  Effect.acquireRelease(
    Effect.tryPromise({
      try: async () => {
        if (typeof window === "undefined") {
          throw new Error("PGlite cannot open during SSR");
        }
        const { PGlite } = await import("@electric-sql/pglite");
        const db = new PGlite(`idb://${JOURNAL_STORE_DATA_DIR}`);
        await runMigrations(db);
        if (process.env.NODE_ENV !== "production") {
          (globalThis as { __ol_db?: PGlite }).__ol_db = db;
        }
        return { db };
      },
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    }),
    ({ db }) => Effect.promise(() => db.close()),
  ),
);

/**
 * `makeJournalRuntime` builds a fresh `ManagedRuntime` for the provided layer.
 * The React layer calls this inside `useMemo(() => makeJournalRuntime(), [])`
 * and disposes via `useEffect(() => () => runtime.dispose(), [runtime])`.
 * Tests substitute `PgliteLive` with a `Layer.scoped(PgliteService,
 * Effect.acquireRelease(... new PGlite() ..., db.close))` providing in-memory
 * PGlite — the rest of the runtime stays identical.
 */
export const makeJournalRuntime = (layer: Layer.Layer<PgliteService, StorageUnavailable> = PgliteLive) =>
  ManagedRuntime.make(layer);

export type JournalRuntime = ReturnType<typeof makeJournalRuntime>;
```

## Journal Store (Effect-returning)

```typescript
// src/lib/journal/journal-store.ts (signatures)

import { Effect } from "effect";
import { PgliteService } from "./runtime";
import type { JournalEntry, EntryId, NewEntryInput, UpdateEntryInput } from "./schema";
import type { EmptyBatch, NotFound, StorageUnavailable, StoreError } from "./errors";

/**
 * Append a batch of new entries atomically inside a single statement. Every
 * entry in the batch shares the same `createdAt` (one `now()` call) and starts
 * with `updatedAt === createdAt`. Returns persisted entries in input order.
 *
 * Fails with `EmptyBatch` when `input.length === 0`; with `StorageUnavailable`
 * on quota / corruption.
 */
export const appendEntries: (
  input: ReadonlyArray<NewEntryInput>,
) => Effect.Effect<ReadonlyArray<JournalEntry>, EmptyBatch | StorageUnavailable, PgliteService>;

/**
 * Patch an entry by id. Refreshes `updatedAt = now()`; preserves `createdAt`,
 * `storage_seq`, and `id`. Fails with `NotFound` on missing id; with
 * `StorageUnavailable` on IO failure.
 */
export const updateEntry: (
  id: EntryId,
  patch: UpdateEntryInput,
) => Effect.Effect<JournalEntry, NotFound | StorageUnavailable, PgliteService>;

/**
 * Remove an entry by id. Returns `true` when a row was removed, `false` when
 * the id did not match (non-exceptional — the React layer treats both
 * outcomes as a successful delete-confirm resolution). Fails only with
 * `StorageUnavailable` on IO failure.
 *
 * Asymmetry with `updateEntry` / `bumpEntry` (which fail with `NotFound`)
 * is intentional: deleting a row that already vanished IS the desired end
 * state, while editing or bumping a missing row is a logical error.
 */
export const deleteEntry: (id: EntryId) => Effect.Effect<boolean, StorageUnavailable, PgliteService>;

/**
 * "Bring to top" — the only rearrangement primitive. Sets
 * `createdAt = updatedAt = now()` for the matched entry; preserves `id`,
 * `name`, `payload`, and `storage_seq`. Because `listEntries` sorts by
 * `createdAt DESC`, the bumped entry becomes newest. Fails with `NotFound` on
 * missing id.
 *
 * Destructive of the previous `createdAt`; the gear-up does not retain prior
 * values (see Forward Compatibility for `original_created_at`).
 */
export const bumpEntry: (id: EntryId) => Effect.Effect<JournalEntry, NotFound | StorageUnavailable, PgliteService>;

/**
 * Return all entries sorted newest-first by `createdAt` with `storage_seq` ASC
 * as deterministic tiebreaker. Returns `[]` on empty database.
 */
export const listEntries: () => Effect.Effect<ReadonlyArray<JournalEntry>, StorageUnavailable, PgliteService>;

/** Remove every stored entry (`TRUNCATE journal_entries`). Test / dev convenience only. */
export const clearEntries: () => Effect.Effect<void, StorageUnavailable, PgliteService>;
```

Implementations use `Effect.gen(function* () { … })` (no adapter — the `$` /
`_` adapter is deprecated as of TypeScript 5.5+); raw IO is wrapped via
`Effect.tryPromise({ try, catch })` with explicit catch mappers so the error
channel never widens to `UnknownException`. Schema-typed inputs are encoded
to plain JSON via `Schema.encodeSync(NewEntryInput)` before being passed to
PGlite's parameterised SQL; query rows are decoded via
`Schema.decodeUnknownSync(JournalEntry)` — both calls are total inside the
Effect (decode failure raises `InvalidPayload` if a future column drift
slips past migrations).

**SQL implementation sketches** (every statement runs against the `db` handle
pulled from `PgliteService` via `const { db } = yield* PgliteService` inside
each store function's `Effect.gen` body):

```sql
-- appendEntries (called once per batch with N values)
INSERT INTO journal_entries (id, name, payload, created_at, updated_at)
VALUES
  ($1, $2, $3::jsonb, $4, $4),  -- $4 reused for both timestamps
  ($5, $6, $7::jsonb, $4, $4),
  ...
RETURNING id, name, payload, created_at, updated_at, storage_seq;

-- updateEntry
UPDATE journal_entries
SET name = COALESCE($2, name),
    payload = COALESCE($3::jsonb, payload),
    updated_at = now()
WHERE id = $1
RETURNING id, name, payload, created_at, updated_at, storage_seq;

-- deleteEntry
DELETE FROM journal_entries WHERE id = $1;
-- store inspects rowCount

-- bumpEntry
UPDATE journal_entries
SET created_at = now(),
    updated_at = now()
WHERE id = $1
RETURNING id, name, payload, created_at, updated_at, storage_seq;

-- listEntries
SELECT id, name, payload, created_at, updated_at, storage_seq
FROM journal_entries
ORDER BY created_at DESC, storage_seq ASC;

-- clearEntries
TRUNCATE journal_entries RESTART IDENTITY;
```

**Sort tiebreaker**: handled by the composite index
`journal_entries_created_at_desc (created_at DESC, storage_seq ASC)`. No application-level
sort is needed; PostgreSQL guarantees deterministic ordering against the index.

**Atomicity**: PGlite supports proper transactions. `appendEntries` wraps the
multi-row INSERT in a single statement (Postgres treats it as atomic). For the
rare callers that mutate multiple rows in one logical operation, use
`db.transaction(tx => { ... })` from PGlite.

**SSR safety**: `PgliteLive`'s acquire-effect throws `StorageUnavailable` when
`typeof window === "undefined"`, and the React layer constructs the
`ManagedRuntime` inside `useEffect` (never during render), so the server path
is not reached during normal Next.js rendering. The PGlite WASM module is
loaded via `dynamic(() => import('@electric-sql/pglite').then(m => m.PGlite),
{ ssr: false })` inside the layer's `acquireRelease` body so the WASM never
reaches the server.

**Schema migration**: `PgliteLive`'s acquire-effect calls `runMigrations(db)`
after the PGlite handle opens, applying any pending migrations from the
timestamp-named files in `src/lib/journal/migrations/` (see "Database migration
framework" above for the multi-developer-safe authoring model). Migration
failure short-circuits the layer's acquire path with `StorageUnavailable`,
which propagates to the React layer's error banner.

**Corruption tolerance**: PGlite stores the database in a single IndexedDB blob
managed by Postgres internals. If IndexedDB throws (quota exceeded, corrupted
write), the acquire-effect's `tryPromise` `catch` mapper produces
`StorageUnavailable({ cause })` instead of leaking `UnknownException`. The
React layer narrows on `state.status === "error"` and renders "Storage
unavailable — data was not saved." The user keeps in-memory drafts until
retry; the gear-up does not silently swallow storage errors.

**ID generation**: `crypto.randomUUID()` — available in all evergreen browsers
and in Node 20+. UUIDs collide with negligible probability across devices, which
is the property the future PWA sync relies on.

**Type marshalling**: PGlite returns Postgres `TIMESTAMPTZ` as JS `Date` and
`JSONB` as a JS object by default. The store decodes each raw row through
`Schema.decodeUnknownEither(JournalEntry)` (after coercing `Date` →
`toISOString()` and casting `JSONB` to `unknown`). Decode failure raises
`InvalidPayload` rather than silently widening to `unknown` — keeping the
return type honestly `JournalEntry`, not `JournalEntry & { payload: unknown }`.

## React Hook (`ManagedRuntime` bridge)

```typescript
// src/lib/journal/use-journal.ts (signature)

import type { JournalEntry, EntryId, NewEntryInput, UpdateEntryInput } from "./schema";
import type { StoreError } from "./errors";

/**
 * Discriminated UI state — each branch lists exactly the fields the JSX needs;
 * `Either<StoreError, JournalEntry[]>` is rejected because it cannot model the
 * `idle` and `loading` phases. The narrowing in the JSX is total: a
 * `state.status === "error"` branch is required to read `state.cause`.
 */
export type JournalState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly entries: ReadonlyArray<JournalEntry> }
  | { readonly status: "error"; readonly cause: StoreError };

export interface UseJournalResult {
  /** Discriminated UI state — narrow before rendering. */
  readonly state: JournalState;
  /** Append a batch of drafts. Resolves with `Either<StoreError, void>`. */
  readonly addBatch: (drafts: ReadonlyArray<NewEntryInput>) => Promise<void>;
  /** Patch one entry by id. */
  readonly edit: (id: EntryId, patch: UpdateEntryInput) => Promise<void>;
  /** Remove one entry by id. */
  readonly remove: (id: EntryId) => Promise<void>;
  /** Bump (bring to top) one entry by id. */
  readonly bump: (id: EntryId) => Promise<void>;
  /** Truncate the journal_entries table. Test / dev helper. */
  readonly clear: () => Promise<void>;
}

/**
 * Bridges Effect-returning store functions into React.
 *
 * - `useMemo(() => makeJournalRuntime(), [])` constructs the `ManagedRuntime`
 *   once per mount. `useEffect(() => () => runtime.dispose(), [runtime])`
 *   tears it down — `Layer.scoped` finalisers (close PGlite handle) run
 *   inside `dispose`.
 * - First render: `{ status: "idle" }`. After `useEffect` fires, transitions
 *   to `loading`, awaits `runtime.runPromise(listEntries())`, then `ready`
 *   on success or `error` (typed `StoreError`) on failure.
 * - Every mutating method runs the store Effect, then re-runs `listEntries`
 *   to refresh state — same "mutate then re-list" pattern as before, now
 *   typed end-to-end. Mutation errors fall into a per-call rejection (the
 *   form sheet decides how to surface), without poisoning the global state.
 * - `runtime.runPromise` enforces `R extends PgliteService` at compile time
 *   — the layer must provide the service, otherwise the call site won't
 *   compile.
 * - The hook does NOT subscribe to PGlite's live-query plugin
 *   (`@electric-sql/pglite/live`); deferred to bigger plan / PWA sync plan.
 */
export function useJournal(): UseJournalResult;
```

The hook is the **single Effect→Promise boundary** in the gear-up. UI
components never import from `effect/Effect` directly — they consume
`UseJournalResult` only. This keeps the run-at-the-edge invariant trivially
auditable: `git grep -n "runPromise" apps/organiclever-web/src` should match
exactly two places (this hook and tests).

## UI Components

### `<AddEntryButton>` (Phase 2)

- Props: `{ onClick: () => void }`
- Renders a button labelled "Add entry" with `aria-label="Add entry"`.
- Visual: top-right of the page header (mobile) and floating bottom-right FAB on
  wider viewports. Either rendering may be used; the requirement is that the
  button is keyboard-reachable.
- Source-of-truth class names live in this component; no ts-ui changes.

### `<EntryFormSheet>` (Phase 2)

- Props (batch / create mode):

  ```typescript
  type EntryFormSheetProps =
    | { open: true; mode: "create"; onSubmit: (drafts: NewEntryInput[]) => void; onCancel: () => void }
    | {
        open: true;
        mode: "edit";
        initial: JournalEntry;
        onSubmit: (patch: UpdateEntryInput) => void;
        onCancel: () => void;
      }
    | { open: false };
  ```

- **Create mode** state:
  - `drafts: Array<{ name: string; payloadText: string; error: string | null }>`
  - Starts with one empty draft on open
  - "+ Add another" pushes a new empty draft
  - "Remove draft" splice-removes a draft (disabled when only one remains)
- **Edit mode** state: a single draft seeded from `initial.name` and
  `JSON.stringify(initial.payload, null, 2)`.
- Preset name chips (clickable buttons) for `workout`, `reading`, `meditation`
  available on every draft; clicking a chip overwrites that draft's `name`.
- Validation on submit (per draft):
  1. If `name.trim() === ""` → set draft's error to `"Name is required"`, abort save.
  2. Try `JSON.parse(payloadText)` → on throw, set error to `"Payload must be valid JSON"`, abort.
  3. If parsed payload is not a plain object (array, scalar, null) → set error to `"Payload must be a JSON object"`, abort.
- Save is **all-or-nothing**: if ANY draft fails validation, no `onSubmit` call;
  invalid drafts are highlighted, others remain editable.
- On valid submit:
  - **Create mode**: call `onSubmit(drafts.map(d => ({ name: d.name.trim(), payload: JSON.parse(d.payloadText) })))`
  - **Edit mode**: call `onSubmit({ name: drafts[0].name.trim(), payload: JSON.parse(drafts[0].payloadText) })`
- Cancel calls `onCancel` and discards every local draft.

### `<JournalList>` (Phase 2)

- Props:

  ```typescript
  interface JournalListProps {
    entries: ReadonlyArray<JournalEntry>;
    onEdit: (id: EntryId) => void;
    onDelete: (id: EntryId) => void;
    onBump: (id: EntryId) => void;
  }
  ```

- Renders empty-state copy `"No entries yet — press + to add one"` when
  `entries.length === 0`.
- Otherwise renders a `<ul>` of `<EntryCard>` items, forwarding
  `onEdit`, `onDelete`, and `onBump` to each card.

### `<EntryCard>` (Phase 2)

- Props:

  ```typescript
  interface EntryCardProps {
    entry: JournalEntry;
    onEdit: (id: EntryId) => void;
    onDelete: (id: EntryId) => void;
    onBump: (id: EntryId) => void;
  }
  ```

- Renders:
  - `<header>` with `name`, relative `createdAt`
    (`formatRelativeTime(entry.createdAt)`), and an "edited Xm ago" line
    rendered only when `entry.updatedAt > entry.createdAt`
  - Action row: three buttons — **Edit**, **Bring to top**, **Delete**
  - `<details>` with summary `"View payload"` and a `<pre>` showing
    `JSON.stringify(entry.payload, null, 2)`
  - **Delete** uses an inline two-step confirm: first click swaps the Delete
    button for "Are you sure? Yes / Cancel"; clicking "Yes" invokes `onDelete`;
    clicking "Cancel" reverts to the default action row.

### `<JournalPage>` (Phase 3)

- Combines hook + components:

  ```typescript
  const { state, addBatch, edit, remove, bump } = useJournal();
  const [sheetState, setSheetState] = useState<
    { open: false } | { open: true; mode: "create" } | { open: true; mode: "edit"; entryId: EntryId }
  >({ open: false });
  ```

  - `state.status === "loading"` renders a skeleton row.
  - `state.status === "error"` renders an inline error banner. The banner narrows
    further on `state.cause._tag` (e.g., a "Storage unavailable — data was not
    saved" message for `StorageUnavailable`).
  - `state.status === "ready"` renders `<h1>Journal</h1>`,
    `<AddEntryButton onClick={() => setSheetState({ open: true, mode: "create" })} />`,
    `<JournalList entries={state.entries} onEdit={...} onDelete={remove} onBump={bump} />`,
    and a single `<EntryFormSheet>` whose props depend on `sheetState`.
  - `onEdit(id)` resolves the entry (only reachable in `ready`, where
    `state.entries` is in scope) and sets `sheetState = { open: true, mode: "edit", entryId: id }`.

- No router, no tabs, no nav.

### `/app/page.tsx` (Phase 3)

```typescript
// apps/organiclever-web/src/app/app/page.tsx

"use client";

import { JournalPage } from "@/components/app/journal-page";

export const dynamic = "force-dynamic";

export default function AppPage() {
  return <JournalPage />;
}
```

## Time Formatting

```typescript
// src/lib/journal/format-relative-time.ts

/**
 * Returns a human-readable relative time string.
 *  < 60s   → "just now"
 *  < 60m   → "{n}m ago"
 *  < 24h   → "{n}h ago"
 *  < 7d    → "{n}d ago"
 *  else    → ISO date "YYYY-MM-DD"
 *
 * `now` is injected for deterministic tests; defaults to `new Date()`.
 */
export function formatRelativeTime(iso: string, now?: Date): string;
```

## Test Strategy

| Level               | Tool                                                      | Files                                                                                                                                                                                  |
| ------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit — schema       | Vitest                                                    | `schema.unit.test.ts` covers `JournalEntry` decode round-trip, branded-id rejection of plain strings, `PayloadFromJsonString` field-error formatting via `ArrayFormatter`              |
| Unit — store        | `@effect/vitest` + Layer-swapped in-memory PGlite         | `journal-store.unit.test.ts` covers `appendEntries` (batch), `listEntries` (sort + tiebreaker), `updateEntry` (refreshes only `updatedAt`), `deleteEntry`, `bumpEntry`, `clearEntries` |
| Unit — hook         | Vitest + RTL                                              | `use-journal.unit.test.tsx` covers `idle → loading → ready` transitions, `addBatch`, `edit`, `remove`, `bump`, `clear`, typed-error propagation into `state.cause`                     |
| Unit — formatter    | Vitest                                                    | `format-relative-time.unit.test.ts` covers each branch + ISO fallback                                                                                                                  |
| Unit — runtime      | `@effect/vitest`                                          | `runtime.unit.test.ts` covers `PgliteLive` acquire-release lifecycle (in-memory layer), `StorageUnavailable` mapping on SSR pretend                                                    |
| Unit — page render  | `@effect/vitest` + RTL + PGlite in-memory (Layer-swapped) | `journal-page.unit.test.tsx` covers empty state, batch submit, validation errors, edit flow, delete-confirm flow, bump reorder, error-banner narrowing                                 |
| FE E2E — round-trip | Playwright-BDD                                            | `apps/organiclever-web-e2e/steps/journal-mechanism.steps.ts` consumes `journal-mechanism.feature` (all batch / edit / delete / bump scenarios)                                         |

**Three test levels per the [three-level testing standard](../../../governance/development/quality/three-level-testing-standard.md)**:

#### `test:unit` — fast, isolated

- Pure logic plus colocated `*.unit.test.ts(x)` files. Unit tests target the
  formatter (`format-relative-time.unit.test.ts`), the schema decoders
  (`schema.unit.test.ts`), the migration runner (`run-migrations.unit.test.ts`
  — uses a real in-memory PGlite (`new PGlite()`) since PGlite spins up
  cheaply; mocking is more brittle than running the actual code), individual
  UI components (RTL with the `useJournal` hook stubbed via a test harness
  wrapper), and store / runtime via Layer-swap (`journal-store.unit.test.ts`,
  `runtime.unit.test.ts`) using `@effect/vitest`'s `it.effect`.
- Vitest + jsdom; no real IndexedDB (the in-memory PGlite mode bypasses IDBFS).

#### `test:integration` — real PGlite in-process

- Real PGlite instantiated in **in-memory mode** (`new PGlite()` with no
  `dataDir`) inside a **test Layer** (`Layer.scoped(PgliteService,
Effect.acquireRelease(... new PGlite() ..., db.close))`) provided to
  `@effect/vitest`'s `it.effect("…", … , { layer: TestPgliteLayer })` — each
  test gets a fresh empty database; no IndexedDB stubbing, no module mocking.
  The exact same `Effect`-returning store functions that run in production
  run in tests; the only difference is the substituted Layer.
- Coverage:
  - Migration runner: applies v1 cleanly on a fresh database; second run is a
    no-op; partial-failure rolls back.
  - `appendEntries` batch atomicity: 3-element batch results in 3 rows with
    identical `created_at`; failed batch (e.g., constraint violation midway)
    leaves zero rows.
  - `listEntries` ordering: entries with same `created_at` come back in
    `storage_seq` ascending; entries from later batches sort first.
  - `updateEntry` preserves `created_at` and `storage_seq`; refreshes
    `updatedAt` strictly later than `createdAt`.
  - `bumpEntry` mutates both timestamps; subsequent `listEntries` puts the
    bumped entry first.
  - `deleteEntry` rowcount return value semantics (`true` on hit, `false` on miss).
  - `clearEntries` empties the table; subsequent `listEntries` returns `[]`.
  - SQL queries from the "Future Consumer: Stats" section all execute against
    a seeded fixture and produce the expected aggregations (date-trunc per
    name, total minutes, streak).
- Per the existing `nx.json` pattern for in-process integration tests
  (`organiclever-web` already has `cache: true`), this stays cacheable.

#### `test:e2e` — real browser, real IndexedDB

- Playwright-BDD against the dev server. The `organiclever-web-e2e` project
  already exists; we add `journal-mechanism.steps.ts` consuming the new
  Gherkin feature. Coverage:
  - Empty-state on first visit
  - Single-draft submit, three-draft batch submit, draft removal in sheet
  - Edit flow (no reorder), delete-confirm flow (cancel + confirm), bump flow
    (reorders)
  - **Persistence**: hard-reload survives all of the above
  - **IndexedDB inspection**: a step reads
    `await page.evaluate(() => indexedDB.databases())` and asserts the
    `/pglite/ol_journal_v1` entry exists (PGlite mounts IDBFS at
    `/pglite/<dataDir>`, so that — not the bare `ol_journal_v1` — is the IDB
    database name), plus runs PGlite SQL via
    `await page.evaluate(() => globalThis.__ol_db.exec("SELECT count(*) FROM journal_entries"))`
    (the dev page exposes `__ol_db` for E2E inspection only — guarded behind
    `process.env.NODE_ENV !== "production"` so it never ships)
  - WASM load in real Chrome: an early step asserts no console errors during
    initial PGlite import (no COOP/COEP failures, no CSP rejections)

Coverage threshold: **≥ 70 %** LCOV (existing project threshold for
`organiclever-web`).

`apps/organiclever-web/vitest.config.ts` ships with two pre-existing constraints
that this plan must amend in Phase 0 before any test file is added:

1. **Coverage `exclude` list** includes `src/lib/**`, `src/services/**`,
   `src/layers/**`, `src/app/api/**`, `src/proxy.ts`, `src/test/**`,
   `src/app/layout.tsx`, `src/generated-contracts/**`, and the standard
   `*.{test,spec,stories}.{ts,tsx}` patterns. Because every gear-up file lands
   under `src/lib/journal/`, the `src/lib/**` exclude must be **removed** (or
   narrowed to specific subpaths) so the new code contributes to the LCOV
   numerator. The other entries stay.
2. **Vitest projects' `include` globs** match unit tests at
   `test/unit/**/*.steps.{ts,tsx}` + `**/*.unit.{test,spec}.{ts,tsx}` and
   integration tests at `test/integration/**/*.{test,spec}.{ts,tsx}` only.
   Files named `journal-store.unit.test.ts` colocated under `src/lib/journal/` would
   not match either project. Phase 0 amends the unit project to also include
   `src/**/*.{test,spec}.{ts,tsx}` and the integration project to also include
   `src/**/*.int.{test,spec}.{ts,tsx}` so colocated tests run.

After those amendments, the dormant `src/services/` and `src/layers/`
directories stay covered-out by their explicit excludes; the new
`src/lib/journal/**` code is included; and colocated `*.test.ts` /
`*.int.test.ts` files run under the unit / integration projects respectively.
The threshold guard in `rhino-cli test-coverage validate` then enforces
≥ 70 % LCOV against the actual gear-up code.

## Design Decisions

### Open `name: string` vs. discriminated union

The bigger app plan's entry-name union freezes six names. This plan deliberately
keeps `name: string` open. Reason: the round-trip mechanism does not need to
know the name set to function. Constraining the type here would force the
bigger plan to either (a) widen back to `string` to migrate, or (b) ship a
breaking schema change at every new name. Bigger plan adds the discriminated
union one layer above the store, narrowing on read; the store stays generic.

### `Record<string, unknown>` payload vs. typed payload union

Same reasoning: the gear-up only needs JSON-serialisable payload. Typed payloads
belong in the bigger plan, where each logger UI knows its own shape and the
store can be wrapped with type-narrowed read helpers (`getReadingEvents`, etc.).

### PGlite database `ol_journal_v1` vs. reusing the bigger plan's `ol_db_v12`

The bigger plan's `OLDb` class was designed against localStorage with a
17-method imperative API. This plan introduces a SQL-queryable Postgres-WASM
database; sharing a name with the localStorage blob would mislead readers.
A distinct PGlite `dataDir` (`ol_journal_v1`, mounted as IDB database
`/pglite/ol_journal_v1`) keeps both stores independent during the gear-up. Migration path
(deferred to the bigger plan): either (a) keep PGlite as the canonical store
and have the bigger plan's typed loggers call into `appendEntries` /
`updateEntry` / `bumpEntry`, OR (b) extend the schema with the bigger plan's
`routines`, `settings`, `app_state` tables and rename the database to a
shared identifier.

### PGlite (Postgres-WASM) vs. localStorage / SQLite-WASM / Dexie

Three constraints decide this:

- **FOSS** — all options must be MIT/Apache 2.0; rules out Dexie Cloud,
  PowerSync FSL server, Turso Cloud, ElectricSQL premium plugins.
- **SQL-queryable** — the bigger plan's stats consumer wants window functions,
  range queries on `created_at`, and JSON operators on `payload`. Rules out
  Dexie (key-value/index API) and RxDB (NoSQL document API).
- **Vercel-friendly** — no COOP/COEP HTTP headers required; rules out the
  OPFS-backed SQLite-WASM stack (which needs `SharedArrayBuffer` →
  `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`).

PGlite checks all three: Apache 2.0, full PostgreSQL SQL dialect (window
functions, JSONB operators, generate_series, etc.), and IndexedDB-backed
persistence by default (no special headers). The 3 MB gzipped bundle is
lazy-loaded via `dynamic(() => import('@electric-sql/pglite'), { ssr: false })`
on `/app` only — landing page (`/`) is unaffected. Postgres dialect also
mirrors the eventual `organiclever-be` Postgres database, so SQL written here
is portable when the PWA sync plan ships.

`wa-sqlite` (MIT, ~800 KB) was the lightweight runner-up; if bundle size
becomes a hard blocker, switching to it is mechanical because the public
`journal-store.ts` API is dialect-neutral (only the SQL strings change).

### No ORM — raw SQL by default; query builder permitted

ORMs (Prisma, Drizzle's ORM mode, TypeORM, MikroORM, etc.) are **forbidden**
in this layer and in any future layer that wraps PGlite. Reason: their
performance characteristics are unpredictable — N+1 patterns, hidden eager
loading, query-plan opacity, and runtime reflection all surface as
hard-to-diagnose latency once the dataset grows. The point of choosing
PGlite was a SQL-queryable store with predictable plans; an ORM defeats it.

Allowed:

- **Raw SQL** (parameterised) — what the gear-up uses. Six functions, ~5
  statements, zero extra dependency, smallest bundle, fully transparent
  query plans.
- **Query builder** (Kysely, Drizzle's query-builder-only mode, etc.) — fine
  if call-sites multiply or column-typo safety becomes valuable. Constraint:
  the library must be a **builder**, not an ORM — no entity classes, no
  lazy associations, no implicit joins, no runtime hydration of related
  records. The builder must emit the SQL it generated for inspection.

Forbidden (illustrative, not exhaustive):

- Prisma (ORM with query engine binary)
- Drizzle in ORM mode (when used as an ORM with relations)
- TypeORM, Sequelize, MikroORM, Objection.js (full-fat ORMs)
- Active-record–style row wrappers that fetch on property access

The gear-up sticks with raw parameterised SQL because the surface is small
enough that a builder would add net cost. If the bigger plan or PWA-sync
plan later finds the SQL strings noisy, swapping to **Kysely** (MIT,
~22 KB gzipped, type-safe, builder-only) is the recommended escape hatch —
its `Compilable` API exposes the generated SQL string for plan-inspection
and audit.

### Free-form JSON textarea vs. structured form

Structured forms per name require a name-aware schema, which is what the bigger
plan ships. The gear-up uses a single textarea so that one piece of UI exercises
arbitrarily-shaped payloads — proving the round-trip works for any shape, not
just the six names the bigger plan will support.

### Append-batch + update + delete + bump in v0

Earlier drafts of this plan kept the gear-up append-only on the theory that
append is the smallest functional unit. That changed once the requirements
clarified that the bigger plan's stats consumer needs CRUD primitives and
rearrange semantics (so that the user can resurface old events). Landing
update / delete / bump in this gear-up means the bigger plan inherits a
working CRUD baseline instead of also designing it from scratch. Bump is
deliberately destructive of the previous `created_at` per product intent —
"bring this to the front again" is the user's explicit signal that the event
is current.

### Effect.ts as the FP runtime (no XState yet)

Adopted: `effect` v3 (`Effect`, `Layer`, `Context`, `Schema`, `Data`, `ManagedRuntime`).
Reasons specific to this app:

- **Typed error channel** — the React layer narrows on `state.cause._tag`
  (`StorageUnavailable` vs `NotFound` vs `InvalidPayload`) without re-wrapping
  unknown exceptions. Plain `Promise<JournalEntry[]>` flattens errors to
  `unknown` at the catch site, defeating discrimination.
- **Schema-driven decoding** — the form sheet's `payload` textarea is decoded
  via `Schema.decodeUnknownEither(PayloadFromJsonString, { errors: "all" })`,
  yielding field-level error arrays via `ArrayFormatter.formatErrorSync`. The
  alternative — `try { JSON.parse } catch` plus per-field shape checks — would
  duplicate the decode logic and lose typed reporting.
- **Layer-based dependency injection** — `PgliteLive` opens / closes the
  IndexedDB-backed handle as a single `Effect.acquireRelease` inside
  `Layer.scoped`. Tests substitute an in-memory `Layer.scoped(PgliteService,
Effect.acquireRelease(... new PGlite() ..., db.close))` via `@effect/vitest`'s
  `it.effect("…", … , { layer: TestPgliteLayer })` — no module mocking, no
  `vi.mock("@electric-sql/pglite")`.
- **Run-at-the-edge** — the `useJournal` hook is the **only** site calling
  `runtime.runPromise(...)`. UI components never import `effect/Effect`. This
  keeps the boundary auditable (`git grep "runPromise"` is the audit) and
  matches the official Effect docs' [Effect vs Promise](https://effect.website/docs/additional-resources/effect-vs-promise/)
  guidance.

XState is **not** adopted in the gear-up. The form-sheet machine is small
enough (`useReducer` over a `drafts` array + `mode: "create" | "edit"`
discriminator) that a state machine would add cost without value. The bigger
plan can promote to XState if the typed-loggers + workout-session machine
makes the surface complex; per the cross-library research (Effect ↔ XState
coexist via `runtime.runPromise` inside `fromPromise` actors), promotion is
mechanical.

Anti-patterns explicitly avoided:

- `Effect.tryPromise` without a `catch` mapper — every wrap supplies a typed
  catch (`(cause): StorageUnavailable => new StorageUnavailable({ cause })`).
- New `ManagedRuntime` per render — `useMemo(() => makeJournalRuntime(), [])`
  - `useEffect` cleanup is the only construction site.
- Adapter-style `Effect.gen(function* ($) { yield* $(eff) })` — the adapter
  is deprecated as of TS 5.5+; gear-up uses bare `yield* eff`.

### No `'storage'` event subscription / no PGlite live queries (yet)

Cross-tab sync and reactive change feeds are out of scope for the gear-up.
PGlite's `live` plugin (`@electric-sql/pglite/live`) supports it, but adding
it now means committing to a particular reactivity model that the bigger plan
or the PWA sync plan may rework. Gear-up follows the dumb "mutate, then
re-list" pattern; bigger plan can opt into live queries later.

### `'use client'` + `force-dynamic` + dynamic PGlite import

`'use client'` ensures React hooks run. `force-dynamic` opts the page out of
static generation so the entries list is never serialised stale. PGlite itself
is loaded via `dynamic(() => import('@electric-sql/pglite'), { ssr: false })`
inside the store so the WASM never reaches the server. These three guards
overlap intentionally — defence in depth keeps the layer reusable if any one
guard is removed in the future.

**Next.js 16 `cacheComponents` incompatibility (note, not a current issue)**:
the new opt-in `cacheComponents: true` flag in `next.config.ts` is incompatible
with `export const dynamic = 'force-dynamic'` and triggers a build error if
both are set. `organiclever-web` does NOT enable `cacheComponents` today, so
the gear-up is unaffected; if a future plan opts in, it must replace
`force-dynamic` on `/app/page.tsx` with the equivalent Cache-Components-era
escape hatch (e.g., `'use cache'` opt-out via `noStore()` or per-fetch
`cache: 'no-store'`).

## Forward Compatibility for PWA Sync (Future Plan)

The PWA sync plan (separate, future) will sync the journal_entries table bidirectionally
with `organiclever-be` via a service worker pull-push loop. The gear-up's
schema is **forward-compatible** — every new column the sync plan needs is
additive, so existing call-sites keep working. Specifically, the sync plan is
expected to add:

| Column                | Type          | Purpose                                                                                       |
| --------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `original_created_at` | `TIMESTAMPTZ` | Immutable creation time, unaffected by `bump`. Lets stats compute true age.                   |
| `deleted_at`          | `TIMESTAMPTZ` | Soft-delete tombstone. The sync plan replaces hard `DELETE` with `UPDATE ... SET deleted_at`. |
| `synced_at`           | `TIMESTAMPTZ` | Server-acknowledged sync watermark. `NULL` until the row reaches the BE.                      |
| `dirty`               | `BOOLEAN`     | Local-only mutation flag; service worker pushes rows where `dirty = true`.                    |
| `client_id`           | `TEXT`        | Originating device identifier; helps LWW when two devices touch the same row.                 |

Backend conflict resolution: the sync plan is expected to use **last-write-wins
on `updated_at`**, with `client_id` as deterministic tiebreaker. Because
`updated_at` is already refreshed by every `updateEntry` and `bumpEntry` call
in the gear-up, and because UUIDs guarantee cross-device collision-free `id`s,
no gear-up code changes are required for this strategy.

Soft-delete migration: when the sync plan lands, `deleteEntry` becomes:

```sql
UPDATE journal_entries SET deleted_at = now(), updated_at = now(), dirty = true WHERE id = $1;
```

…and `listEntries` adds `WHERE deleted_at IS NULL`. The Boolean return value of
`deleteEntry` continues to mean "did anything change?" so call-sites in the
React layer keep working without code changes.

Cross-tab consistency: the sync plan can add a `BroadcastChannel('ol_journal_v1')`
listener so a mutation in tab A causes tab B to re-run `listEntries`. Not in
the gear-up.

## Future Consumer: Stats (Bigger App Plan)

The bigger plan's Home / Progress screens will read aggregated stats over
`journal_entries`. The schema and SQL dialect are chosen so those queries stay
declarative inside the database rather than client-side scans:

```sql
-- Last 7 days, count per name per day:
SELECT date_trunc('day', created_at) AS day,
       name,
       count(*) AS n
FROM journal_entries
WHERE created_at >= now() - interval '7 days'
GROUP BY day, name
ORDER BY day DESC, name;

-- Total minutes per name for the last 30 days, payload introspection:
SELECT name,
       sum((payload->>'durationMins')::int) AS total_mins
FROM journal_entries
WHERE created_at >= now() - interval '30 days'
  AND payload ? 'durationMins'
GROUP BY name;

-- Streak: consecutive days with >= 1 entry:
WITH days AS (
  SELECT DISTINCT date_trunc('day', created_at)::date AS d FROM journal_entries
)
SELECT count(*) AS streak FROM (
  SELECT d, d - row_number() OVER (ORDER BY d)::int AS grp FROM days
) g
WHERE grp = (SELECT max(d - row_number() OVER (ORDER BY d)::int) FROM days);
```

These all run in the client against PGlite; no BE round-trip is needed for
stats. Once the PWA sync plan ships, the same SQL works against the real
Postgres on the BE for any server-side reporting.

If/when `original_created_at` is added (see Forward Compatibility), stats that
care about true age (e.g., "what is the average time between event creation
and last bump?") can use it without changing the gear-up schema.

## Migration Path Into the Bigger Plan

When `2026-04-25__organiclever-web-app/` Phase 1 starts:

1. Replace `src/app/app/page.tsx` body with `<AppRoot />` instead of
   `<JournalPage />`. The bigger plan's Phase 1 already lists this file as new.
2. Keep `lib/journal/journal-store.ts` and have the bigger plan's typed loggers
   delegate to it (`appendEntries`, `updateEntry`, `bumpEntry`, etc.). The
   bigger plan's data model already has `LoggedEvent` whose shape (`{ id,
type, payload, startedAt, finishedAt }`) is one schema migration away from
   the gear-up's `JournalEntry` — the bigger plan adds `started_at` and
   `finished_at` columns and the typed entry-name discriminator without
   removing the gear-up's `created_at` / `updated_at` semantics.
3. The provisional UI (`AddEntryButton`, `EntryFormSheet`, `JournalList`,
   `EntryCard`) is no longer mounted on `/app` directly; the bigger plan's
   bigger plan's typed entry form (Phase 3) owns entry creation from then on. The
   provisional components can be deleted once the bigger plan's typed loggers
   land, or they can be repurposed as a raw-entry debug utility if useful.
4. The gear-up's seed data is empty; the bigger plan's Phase 0 seed runs
   `INSERT` statements against the same `journal_entries` table during first-load.

## Rollback

If the plan needs to be reverted after merging to `main`:

1. **Remove `/app` route**: delete `apps/organiclever-web/src/app/app/page.tsx`.
2. **Remove lib directory**: delete `apps/organiclever-web/src/lib/journal/` in full.
3. **Remove components**: delete `apps/organiclever-web/src/components/app/` files
   added by this plan (`add-entry-button.tsx`, `entry-form-sheet.tsx`,
   `journal-list.tsx`, `entry-card.tsx`, `journal-page.tsx` and their tests).
4. **Remove codegen script**: delete `apps/organiclever-web/scripts/gen-migrations.mjs`.
5. **Revert `vitest.config.ts`** and `package.json` changes (remove PGlite / effect /
   @effect/vitest deps; revert npm scripts).
6. **Clear IndexedDB** (browser only — no server artifact): open DevTools →
   Application → IndexedDB → delete `/pglite/ol_journal_v1`.

## Quality Gates

| Gate                                                 | Command                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Typecheck (incl. contract codegen via `codegen` dep) | `nx run organiclever-web:typecheck`                                                              |
| Lint                                                 | `nx run organiclever-web:lint`                                                                   |
| Unit + coverage validation                           | `nx run organiclever-web:test:quick`                                                             |
| Integration tests (PGlite in-memory)                 | `nx run organiclever-web:test:integration` (not in pre-push hook; run separately per convention) |
| FE E2E (BDD)                                         | `nx run organiclever-web-e2e:test:e2e`                                                           |
| Spec coverage                                        | `nx run organiclever-web:spec-coverage`                                                          |
| Affected gate (matches pre-push hook)                | `nx affected -t typecheck lint test:quick spec-coverage`                                         |
