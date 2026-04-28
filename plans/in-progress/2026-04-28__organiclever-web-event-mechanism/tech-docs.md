# Technical Documentation

## Route Architecture

```text
/                       → existing landing page (untouched)
/system/status/be       → existing backend status (untouched)
/app                    → NEW — apps/organiclever-web/src/app/app/page.tsx
                          'use client'
                          export const dynamic = 'force-dynamic'
                          mounts <EventsPage />
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
│       └── page.tsx                          ← Phase 2 (provisional)
├── components/
│   └── app/
│       ├── events-page.tsx                   ← Phase 2 (composes the trio)
│       ├── events-page.test.tsx              ← Phase 3
│       ├── add-event-button.tsx              ← Phase 2
│       ├── event-form-sheet.tsx              ← Phase 2
│       ├── event-list.tsx                    ← Phase 2
│       └── event-card.tsx                    ← Phase 2
└── lib/
    └── events/
        ├── types.ts                          ← Phase 0
        ├── run-migrations.ts                 ← Phase 0
        ├── run-migrations.test.ts            ← Phase 0
        ├── migrations/                       ← Phase 0 (one .ts per migration)
        │   ├── 2026_04_28T14_05_30__create_events_table.ts   ← Phase 0
        │   └── index.generated.ts            ← gitignored, emitted by gen:migrations
        ├── event-store.ts                    ← Phase 0
        ├── event-store.test.ts               ← Phase 0
        ├── event-store.int.test.ts           ← Phase 1
        ├── use-events.ts                     ← Phase 0
        ├── use-events.test.ts                ← Phase 0
        ├── format-relative-time.ts           ← Phase 0
        └── format-relative-time.test.ts      ← Phase 0

apps/organiclever-web/scripts/
└── gen-migrations.mjs                        ← Phase 0 (codegen)

apps/organiclever-web-e2e/
└── steps/
    └── events-mechanism.steps.ts             ← Phase 3

specs/apps/organiclever/fe/gherkin/
└── events-mechanism.feature                  ← Phase 3
```

The bigger plan's `lib/db/`, `components/app/app-root.tsx`, `components/app/tab-bar.tsx`,
etc. are NOT created here. The bigger plan's Phase 1 will replace
`src/app/app/page.tsx` and `src/components/app/events-page.tsx`. The bigger plan
may keep `lib/events/*` as the underlying store, wrap it inside `OLDb`, or
migrate data from `ol_events_v1` to `ol_db_v12` — the call is deferred to that
plan.

## Data Model

```typescript
// src/lib/events/types.ts (complete)

/**
 * EventKind is an open string. The gear-up plan does NOT constrain it.
 * The bigger app plan layers a discriminated union (`workout` | `reading` |
 * `learning` | `meal` | `focus` | `custom`) on top of this primitive.
 */
export type EventKind = string;

/**
 * EventPayload is an arbitrary JSON object. The gear-up plan does NOT constrain
 * its shape. The bigger app plan introduces typed payload interfaces and narrows
 * the type via the `kind` discriminator.
 */
export type EventPayload = Record<string, unknown>;

export interface EventEntry {
  /** UUID v4 generated at append-time. */
  id: string;
  /** Open string. Convention: lowercase, kebab-case. */
  kind: EventKind;
  /** Arbitrary JSON-serialisable payload. */
  payload: EventPayload;
  /** ISO-8601 timestamp set at append-time; mutated only by `bumpEvent`. */
  createdAt: string;
  /**
   * ISO-8601 timestamp set equal to `createdAt` on creation; refreshed on every
   * `updateEvent` and on `bumpEvent`. The render layer shows "edited Xm ago"
   * only when `updatedAt > createdAt`.
   */
  updatedAt: string;
}

/** Input shape for `appendEvents` — `id`, `createdAt`, `updatedAt` assigned by the store. */
export type NewEventInput = Pick<EventEntry, "kind" | "payload">;

/** Input shape for `updateEvent` — `kind` and/or `payload` are patched. */
export type UpdateEventInput = Partial<Pick<EventEntry, "kind" | "payload">>;
```

## Storage Layer — PGlite (Postgres-WASM)

Persistence uses [PGlite](https://github.com/electric-sql/pglite) (Apache 2.0,
free / open source) — a Postgres build compiled to WebAssembly with an
**IndexedDB**-backed virtual filesystem. Single database name: `ol_events_v1`
(IndexedDB key `idb://ol_events_v1`).

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
`src/lib/events/migrations/` with the filename pattern:

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

- `2026_04_28T14_05_30__create_events_table.ts` (gear-up v1)
- `2026_05_03T09_22_15__add_typed_payload_columns.ts` (bigger plan v2)
- `2026_06_15T11_45_00__add_sync_state_columns.ts` (PWA-sync plan v3)

**Multi-dev safety**: timestamp + title produces unique filenames per branch.
Two PRs adding migrations on the same day collide only if both authors pick
the same second AND the same title — vanishingly improbable; if it happens,
git rejects the second `git add` and the second author bumps the timestamp by
one second.

#### Migration file shape

```typescript
// src/lib/events/migrations/2026_04_28T14_05_30__create_events_table.ts

import type { PGlite } from "@electric-sql/pglite";

export const id = "2026_04_28T14_05_30__create_events_table";

export async function up(db: PGlite): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id          TEXT PRIMARY KEY,
      kind        TEXT NOT NULL CHECK (length(kind) > 0),
      payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at  TIMESTAMPTZ NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL,
      storage_seq BIGSERIAL
    );
    CREATE INDEX IF NOT EXISTS events_created_at_desc
      ON events (created_at DESC, storage_seq ASC);
  `);
}

export async function down(db: PGlite): Promise<void> {
  await db.exec(`
    DROP INDEX IF EXISTS events_created_at_desc;
    DROP TABLE IF EXISTS events;
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
const MIGRATION_DIR = "src/lib/events/migrations";
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

import type { PGlite } from "@electric-sql/pglite";
export interface Migration { id: string; up: (db: PGlite) => Promise<void>; down?: (db: PGlite) => Promise<void>; }

export const MIGRATIONS: Migration[] = [${arr}];
`,
);
```

`apps/organiclever-web/.gitignore` adds:

```
src/lib/events/migrations/index.generated.ts
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
// src/lib/events/run-migrations.ts (signature)

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
  introducing `started_at`, `finished_at`, and a typed `kind` check
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
  hard deletes; sync plan replaces `deleteEvent` with a tombstone setter.
- `synced_at TIMESTAMPTZ` / `dirty BOOLEAN` — sync state per row. Sync plan
  adds whichever flavour fits the PWA sync engine chosen.

Adding these later is **additive** — every gear-up call-site keeps working.

```typescript
// src/lib/events/event-store.ts (signatures)

export const EVENT_STORE_DB_NAME = "ol_events_v1"; // PGlite IndexedDB key

/**
 * Lazy-initialised PGlite handle. First call opens / creates the IndexedDB-backed
 * Postgres database, runs the schema migration, and caches the handle. Subsequent
 * calls return the cached handle. SSR-safe: returns `null` on the server.
 */
export async function getDb(): Promise<PGlite | null>;

/**
 * Append a batch of new events atomically inside a single transaction. Every
 * event in the batch shares the same `createdAt` (one `now()` call) and starts
 * with `updatedAt === createdAt`. The batch is FLATTENED — N drafts become N
 * rows. Returns the persisted entries in input order.
 *
 * Throws if `input.length === 0` (callers should guard against empty submits).
 */
export async function appendEvents(input: NewEventInput[]): Promise<EventEntry[]>;

/**
 * Patch an event by id inside a single statement. Refreshes `updatedAt = now()`;
 * preserves `created_at`, `storage_seq`, and `id`. Returns the patched entry, or
 * `null` when no event matches `id`.
 */
export async function updateEvent(id: string, patch: UpdateEventInput): Promise<EventEntry | null>;

/** Remove an event by id. Returns `true` if removed, `false` if no match. */
export async function deleteEvent(id: string): Promise<boolean>;

/**
 * "Bring to top" — the only rearrangement primitive. Sets
 * `created_at = updated_at = now()` for the matched event; preserves `id`,
 * `kind`, `payload`, and `storage_seq`. Returns the bumped entry, or `null` when
 * no match. Because `listEvents` sorts by `created_at` DESC, the bumped event
 * becomes newest.
 *
 * Destructive of the previous `created_at`; the gear-up does not retain prior
 * values. The Forward Compatibility section below documents how `original_created_at`
 * can be added later without breaking call-sites.
 */
export async function bumpEvent(id: string): Promise<EventEntry | null>;

/**
 * Return all events sorted newest-first by `created_at` with `storage_seq` ASC
 * as deterministic tiebreaker. Returns `[]` on empty database / SSR.
 */
export async function listEvents(): Promise<EventEntry[]>;

/** Remove every stored event (`TRUNCATE events`). Test / dev convenience only. */
export async function clearEvents(): Promise<void>;
```

**SQL implementation sketches** (every statement runs inside the singleton PGlite
instance opened by `getDb`):

```sql
-- appendEvents (called once per batch with N values)
INSERT INTO events (id, kind, payload, created_at, updated_at)
VALUES
  ($1, $2, $3::jsonb, $4, $4),  -- $4 reused for both timestamps
  ($5, $6, $7::jsonb, $4, $4),
  ...
RETURNING id, kind, payload, created_at, updated_at, storage_seq;

-- updateEvent
UPDATE events
SET kind = COALESCE($2, kind),
    payload = COALESCE($3::jsonb, payload),
    updated_at = now()
WHERE id = $1
RETURNING id, kind, payload, created_at, updated_at, storage_seq;

-- deleteEvent
DELETE FROM events WHERE id = $1;
-- store inspects rowCount

-- bumpEvent
UPDATE events
SET created_at = now(),
    updated_at = now()
WHERE id = $1
RETURNING id, kind, payload, created_at, updated_at, storage_seq;

-- listEvents
SELECT id, kind, payload, created_at, updated_at, storage_seq
FROM events
ORDER BY created_at DESC, storage_seq ASC;

-- clearEvents
TRUNCATE events RESTART IDENTITY;
```

**Sort tiebreaker**: handled by the composite index
`events_created_at_desc (created_at DESC, storage_seq ASC)`. No application-level
sort is needed; PostgreSQL guarantees deterministic ordering against the index.

**Atomicity**: PGlite supports proper transactions. `appendEvents` wraps the
multi-row INSERT in a single statement (Postgres treats it as atomic). For the
rare callers that mutate multiple rows in one logical operation, use
`db.transaction(tx => { ... })` from PGlite.

**SSR safety**: `getDb` returns `null` on the server (`typeof window === "undefined"`)
and every other store function short-circuits accordingly (`listEvents` →
`[]`, mutators → `null`/`false`/`[]`). The PGlite WASM module is loaded via
`dynamic(() => import('@electric-sql/pglite').then(m => m.PGlite), { ssr: false })`
in the React layer, so the WASM never reaches the server.

**Schema migration**: `getDb` calls `runMigrations(db)` after the PGlite handle
opens, applying any pending migrations from the timestamp-named files in
`src/lib/events/migrations/` (see "Database migration framework" above for
the multi-developer-safe authoring model).

**Corruption tolerance**: PGlite stores the database in a single IndexedDB blob
managed by Postgres internals. If IndexedDB throws (quota exceeded, corrupted
write), `getDb` rejects with the underlying error and the React layer surfaces
"Storage unavailable — data was not saved." The user keeps in-memory drafts
until they retry. The gear-up does not silently swallow storage errors.

**ID generation**: `crypto.randomUUID()` — available in all evergreen browsers
and in Node 20+. UUIDs collide with negligible probability across devices, which
is the property the future PWA sync relies on.

**Type marshalling**: PGlite returns Postgres `TIMESTAMPTZ` as JS `Date` and
`JSONB` as a JS object by default. The store maps each row to:

```typescript
function rowToEntry(row: PGliteRow): EventEntry {
  return {
    id: row.id,
    kind: row.kind,
    payload: row.payload as EventPayload,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
```

so the public `EventEntry` type stays string-typed and JSON-serialisable.

## React Hook

```typescript
// src/lib/events/use-events.ts (signature)

export type DbStatus = "idle" | "loading" | "ready" | "error";

export interface UseEventsResult {
  /** Current sorted event list. Empty during `idle` / `loading`. */
  events: EventEntry[];
  /** PGlite initialisation status. UI shows a skeleton while `loading`. */
  status: DbStatus;
  /** Last error, if any (e.g., quota exceeded, IndexedDB unavailable). */
  error: Error | null;
  /** Append a batch of events. */
  addBatch: (drafts: NewEventInput[]) => Promise<void>;
  /** Patch one event by id. */
  edit: (id: string, patch: UpdateEventInput) => Promise<void>;
  /** Remove one event by id. */
  remove: (id: string) => Promise<void>;
  /** Bump (bring to top) one event by id. */
  bump: (id: string) => Promise<void>;
  /** Truncate the events table. Test / dev helper. */
  clear: () => Promise<void>;
}

/**
 * Hook that drives the PGlite-backed event list into React state.
 * - First render returns `{ events: [], status: 'idle', error: null }` (SSR-safe).
 * - Inside `useEffect`, lazy-imports PGlite, calls `getDb()`, runs `listEvents()`,
 *   sets `status = 'ready'` (or `'error'`).
 * - Every mutating method awaits the corresponding store function, then re-runs
 *   `listEvents()` and updates `events`. This keeps the rendered list consistent
 *   with the database without a separate notification primitive.
 * - The hook does NOT subscribe to PGlite's live-query plugin in this gear-up
 *   (kept out of scope; the bigger plan or sync plan can opt in via
 *   `db.live.query(...)` from `@electric-sql/pglite/live` if reactive updates
 *   from background sync become necessary).
 */
export function useEvents(): UseEventsResult;
```

## UI Components

### `<AddEventButton>` (Phase 2)

- Props: `{ onClick: () => void }`
- Renders a button labelled "Add event" with `aria-label="Add event"`.
- Visual: top-right of the page header (mobile) and floating bottom-right FAB on
  wider viewports. Either rendering may be used; the requirement is that the
  button is keyboard-reachable.
- Source-of-truth class names live in this component; no ts-ui changes.

### `<EventFormSheet>` (Phase 2)

- Props (batch / create mode):

  ```typescript
  type EventFormSheetProps =
    | { open: true; mode: "create"; onSubmit: (drafts: NewEventInput[]) => void; onCancel: () => void }
    | {
        open: true;
        mode: "edit";
        initial: EventEntry;
        onSubmit: (patch: UpdateEventInput) => void;
        onCancel: () => void;
      }
    | { open: false };
  ```

- **Create mode** state:
  - `drafts: Array<{ kind: string; payloadText: string; error: string | null }>`
  - Starts with one empty draft on open
  - "+ Add another" pushes a new empty draft
  - "Remove draft" splice-removes a draft (disabled when only one remains)
- **Edit mode** state: a single draft seeded from `initial.kind` and
  `JSON.stringify(initial.payload, null, 2)`.
- Preset kind chips (clickable buttons) for `workout`, `reading`, `meditation`
  available on every draft; clicking a chip overwrites that draft's `kind`.
- Validation on submit (per draft):
  1. If `kind.trim() === ""` → set draft's error to `"Kind is required"`, abort save.
  2. Try `JSON.parse(payloadText)` → on throw, set error to `"Payload must be valid JSON"`, abort.
  3. If parsed payload is not a plain object (array, scalar, null) → set error to `"Payload must be a JSON object"`, abort.
- Save is **all-or-nothing**: if ANY draft fails validation, no `onSubmit` call;
  invalid drafts are highlighted, others remain editable.
- On valid submit:
  - **Create mode**: call `onSubmit(drafts.map(d => ({ kind: d.kind.trim(), payload: JSON.parse(d.payloadText) })))`
  - **Edit mode**: call `onSubmit({ kind: drafts[0].kind.trim(), payload: JSON.parse(drafts[0].payloadText) })`
- Cancel calls `onCancel` and discards every local draft.

### `<EventList>` (Phase 2)

- Props: `{ events: EventEntry[] }`
- Renders empty-state copy `"No events yet — press + to add one"` when
  `events.length === 0`.
- Otherwise renders a `<ul>` of `<EventCard>` items.

### `<EventCard>` (Phase 2)

- Props:

  ```typescript
  interface EventCardProps {
    event: EventEntry;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onBump: (id: string) => void;
  }
  ```

- Renders:
  - `<header>` with `kind`, relative `createdAt`
    (`formatRelativeTime(event.createdAt)`), and an "edited Xm ago" line
    rendered only when `event.updatedAt > event.createdAt`
  - Action row: three buttons — **Edit**, **Bring to top**, **Delete**
  - `<details>` with summary `"View payload"` and a `<pre>` showing
    `JSON.stringify(event.payload, null, 2)`
  - **Delete** uses an inline two-step confirm: first click swaps the Delete
    button for "Are you sure? Yes / Cancel"; clicking "Yes" invokes `onDelete`;
    clicking "Cancel" reverts to the default action row.

### `<EventsPage>` (Phase 2)

- Combines hook + components:

  ```typescript
  const { events, status, addBatch, edit, remove, bump } = useEvents();
  const [sheetState, setSheetState] = useState<
    { open: false } | { open: true; mode: "create" } | { open: true; mode: "edit"; eventId: string }
  >({ open: false });
  ```

  - `status === "loading"` renders a skeleton row.
  - `status === "error"` renders an inline error banner.
  - `status === "ready"` renders `<h1>Events</h1>`,
    `<AddEventButton onClick={() => setSheetState({ open: true, mode: "create" })} />`,
    `<EventList events={events} onEdit={...} onDelete={remove} onBump={bump} />`,
    and a single `<EventFormSheet>` whose props depend on `sheetState`.
  - `onEdit(id)` resolves the event and sets `sheetState = { open: true, mode: "edit", eventId: id }`.

- No router, no tabs, no nav.

### `/app/page.tsx` (Phase 2)

```typescript
// apps/organiclever-web/src/app/app/page.tsx

"use client";

import { EventsPage } from "@/components/app/events-page";

export const dynamic = "force-dynamic";

export default function AppPage() {
  return <EventsPage />;
}
```

## Time Formatting

```typescript
// src/lib/events/format-relative-time.ts

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

| Level                     | Tool                            | Files                                                                                                                                                                        |
| ------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit — store              | Vitest + PGlite in-memory mode  | `event-store.test.ts` covers `appendEvents` (batch), `listEvents` (sort + tiebreaker), `updateEvent` (refreshes only `updatedAt`), `deleteEvent`, `bumpEvent`, `clearEvents` |
| Unit — hook               | Vitest + RTL                    | `use-events.test.ts` covers `idle → loading → ready` transitions, `addBatch`, `edit`, `remove`, `bump`, `clear`, error propagation                                           |
| Unit — formatter          | Vitest                          | `format-relative-time.test.ts` covers each branch + ISO fallback                                                                                                             |
| Integration — page render | Vitest + RTL + PGlite in-memory | `events-page.test.tsx` covers empty state, batch submit, validation errors, edit flow, delete-confirm flow, bump reorder                                                     |
| FE E2E — round-trip       | Playwright-BDD                  | `apps/organiclever-web-e2e/steps/events-mechanism.steps.ts` consumes `events-mechanism.feature` (all batch / edit / delete / bump scenarios)                                 |

**Three test levels per the [three-level testing standard](../../../governance/development/quality/three-level-testing-standard.md)**:

#### `test:unit` — fast, isolated

- Pure logic only. The store module is **not** unit-tested directly; instead,
  unit tests target the formatter (`format-relative-time.test.ts`), the
  migration runner's "decide what to apply" logic (`run-migrations.test.ts` with
  a mocked PGlite handle), and individual UI components (RTL with the
  `useEvents` hook stubbed via a test harness wrapper).
- Vitest + jsdom, no PGlite, no IndexedDB.

#### `test:integration` — real PGlite in-process

- Real PGlite instantiated in **in-memory mode** (`new PGlite()` with no
  `dataDir`) — each test gets a fresh empty database; no IndexedDB stubbing
  needed. The same SQL that runs in production runs in the test.
- Coverage:
  - Migration runner: applies v1 cleanly on a fresh database; second run is a
    no-op; partial-failure rolls back.
  - `appendEvents` batch atomicity: 3-element batch results in 3 rows with
    identical `created_at`; failed batch (e.g., constraint violation midway)
    leaves zero rows.
  - `listEvents` ordering: events with same `created_at` come back in
    `storage_seq` ascending; events from later batches sort first.
  - `updateEvent` preserves `created_at` and `storage_seq`; refreshes
    `updatedAt` strictly later than `createdAt`.
  - `bumpEvent` mutates both timestamps; subsequent `listEvents` puts the
    bumped event first.
  - `deleteEvent` rowcount return value semantics (`true` on hit, `false` on miss).
  - `clearEvents` empties the table; subsequent `listEvents` returns `[]`.
  - SQL queries from the "Future Consumer: Stats" section all execute against
    a seeded fixture and produce the expected aggregations (date-trunc per
    kind, total minutes, streak).
- Per the existing `nx.json` pattern for in-process integration tests
  (`organiclever-web` already has `cache: true`), this stays cacheable.

#### `test:e2e` — real browser, real IndexedDB

- Playwright-BDD against the dev server. The `organiclever-web-e2e` project
  already exists; we add `events-mechanism.steps.ts` consuming the new
  Gherkin feature. Coverage:
  - Empty-state on first visit
  - Single-draft submit, three-draft batch submit, draft removal in sheet
  - Edit flow (no reorder), delete-confirm flow (cancel + confirm), bump flow
    (reorders)
  - **Persistence**: hard-reload survives all of the above
  - **IndexedDB inspection**: a step reads
    `await page.evaluate(() => indexedDB.databases())` and asserts the
    `ol_events_v1` entry exists, plus runs PGlite SQL via
    `await page.evaluate(() => globalThis.__ol_db.exec("SELECT count(*) FROM events"))`
    (the dev page exposes `__ol_db` for E2E inspection only — guarded behind
    `process.env.NODE_ENV !== "production"` so it never ships)
  - WASM load in real Chrome: an early step asserts no console errors during
    initial PGlite import (no COOP/COEP failures, no CSP rejections)

Coverage threshold: **≥ 70 %** LCOV (existing project threshold for
`organiclever-web`). The dormant `src/services/` and `src/layers/` directories
are not imported by any test or by `src/app/**` code, so Vitest's coverage
reporter naturally skips them — there is no explicit `exclude` entry for those
paths in `vitest.config.ts` (which currently only excludes `src/app/layout.tsx`).
If future code begins importing from those paths, the threshold guard in
`rhino-cli test-coverage validate` will catch the regression.

## Design Decisions

### Open `kind: string` vs. discriminated union

The bigger app plan's `EventType` union freezes six kinds. This plan deliberately
keeps `kind: string` open. Reason: the round-trip mechanism does not need to
know the kind set to function. Constraining the type here would force the
bigger plan to either (a) widen back to `string` to migrate, or (b) ship a
breaking schema change at every new kind. Bigger plan adds the discriminated
union one layer above the store, narrowing on read; the store stays generic.

### `Record<string, unknown>` payload vs. typed payload union

Same reasoning: the gear-up only needs JSON-serialisable payload. Typed payloads
belong in the bigger plan, where each logger UI knows its own shape and the
store can be wrapped with type-narrowed read helpers (`getReadingEvents`, etc.).

### PGlite database `ol_events_v1` vs. reusing the bigger plan's `ol_db_v12`

The bigger plan's `OLDb` class was designed against localStorage with a
17-method imperative API. This plan introduces a SQL-queryable Postgres-WASM
database; sharing a name with the localStorage blob would mislead readers.
A distinct database name (`ol_events_v1` as the IndexedDB key for the PGlite
instance) keeps both stores independent during the gear-up. Migration path
(deferred to the bigger plan): either (a) keep PGlite as the canonical store
and have the bigger plan's typed loggers call into `appendEvents` /
`updateEvent` / `bumpEvent`, OR (b) extend the schema with the bigger plan's
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
`event-store.ts` API is dialect-neutral (only the SQL strings change).

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

Structured forms per kind require a kind-aware schema, which is what the bigger
plan ships. The gear-up uses a single textarea so that one piece of UI exercises
arbitrarily-shaped payloads — proving the round-trip works for any shape, not
just the six kinds the bigger plan will support.

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

### No `'storage'` event subscription / no PGlite live queries (yet)

Cross-tab sync and reactive change feeds are out of scope for the gear-up.
PGlite's `live` plugin (`@electric-sql/pglite/live`) supports it, but adding
it now means committing to a particular reactivity model that the bigger plan
or the PWA sync plan may rework. Gear-up follows the dumb "mutate, then
re-list" pattern; bigger plan can opt into live queries later.

### `'use client'` + `force-dynamic` + dynamic PGlite import

`'use client'` ensures React hooks run. `force-dynamic` opts the page out of
static generation so the events list is never serialised stale. PGlite itself
is loaded via `dynamic(() => import('@electric-sql/pglite'), { ssr: false })`
inside the store so the WASM never reaches the server. These three guards
overlap intentionally — defence in depth keeps the layer reusable if any one
guard is removed in the future.

## Forward Compatibility for PWA Sync (Future Plan)

The PWA sync plan (separate, future) will sync the events table bidirectionally
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
`updated_at` is already refreshed by every `updateEvent` and `bumpEvent` call
in the gear-up, and because UUIDs guarantee cross-device collision-free `id`s,
no gear-up code changes are required for this strategy.

Soft-delete migration: when the sync plan lands, `deleteEvent` becomes:

```sql
UPDATE events SET deleted_at = now(), updated_at = now(), dirty = true WHERE id = $1;
```

…and `listEvents` adds `WHERE deleted_at IS NULL`. The Boolean return value of
`deleteEvent` continues to mean "did anything change?" so call-sites in the
React layer keep working without code changes.

Cross-tab consistency: the sync plan can add a `BroadcastChannel('ol_events_v1')`
listener so a mutation in tab A causes tab B to re-run `listEvents`. Not in
the gear-up.

## Future Consumer: Stats (Bigger App Plan)

The bigger plan's Home / Progress screens will read aggregated stats over
`events`. The schema and SQL dialect are chosen so those queries stay
declarative inside the database rather than client-side scans:

```sql
-- Last 7 days, count per kind per day:
SELECT date_trunc('day', created_at) AS day,
       kind,
       count(*) AS n
FROM events
WHERE created_at >= now() - interval '7 days'
GROUP BY day, kind
ORDER BY day DESC, kind;

-- Total minutes per kind for the last 30 days, payload introspection:
SELECT kind,
       sum((payload->>'durationMins')::int) AS total_mins
FROM events
WHERE created_at >= now() - interval '30 days'
  AND payload ? 'durationMins'
GROUP BY kind;

-- Streak: consecutive days with >= 1 event:
WITH days AS (
  SELECT DISTINCT date_trunc('day', created_at)::date AS d FROM events
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
   `<EventsPage />`. The bigger plan's Phase 1 already lists this file as new.
2. Keep `lib/events/event-store.ts` and have the bigger plan's typed loggers
   delegate to it (`appendEvents`, `updateEvent`, `bumpEvent`, etc.). The
   bigger plan's data model already has `LoggedEvent` whose shape (`{ id,
type, payload, startedAt, finishedAt }`) is one schema migration away from
   the gear-up's `EventEntry` — the bigger plan adds `started_at` and
   `finished_at` columns and the typed `EventType` discriminator without
   removing the gear-up's `created_at` / `updated_at` semantics.
3. The provisional UI (`AddEventButton`, `EventFormSheet`, `EventList`,
   `EventCard`) is no longer mounted on `/app` directly; the bigger plan's
   `AddEventSheet` (per its Phase 3) owns event entry from then on. The
   provisional components can be deleted once the bigger plan's typed loggers
   land, or they can be repurposed as a "raw event" debug utility if useful.
4. The gear-up's seed data is empty; the bigger plan's Phase 0 seed runs
   `INSERT` statements against the same `events` table during first-load.

## Quality Gates

| Gate                                                 | Command                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Typecheck (incl. contract codegen via `codegen` dep) | `nx run organiclever-web:typecheck`                      |
| Lint                                                 | `nx run organiclever-web:lint`                           |
| Unit + coverage validation                           | `nx run organiclever-web:test:quick`                     |
| FE E2E (BDD)                                         | `nx run organiclever-web-e2e:test:e2e`                   |
| Spec coverage                                        | `nx run organiclever-web:spec-coverage`                  |
| Affected gate (matches pre-push hook)                | `nx affected -t typecheck lint test:quick spec-coverage` |
