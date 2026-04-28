# Technical Documentation

## Raw Design Files

Prototype source files are in `raw/`. See `raw/README.md` for the full file list and
confirmed design decisions. Primary references by phase:

- `raw/colors_and_type.css` — design token system (hues, warm scale, dark mode, type)
- `raw/db.js` — Original prototype `OLDb` class + seed data. **Reference only**;
  this plan does NOT port the class. Storage is PGlite (gear-up); this plan
  reuses the seed _content_ (Yoka profile, Kettlebell day, Calisthenics + Super
  Exercise routines, six recent events) for `lib/events/seed.ts`
- `raw/i18n.js` — all translation keys (Phase 0 reference)
- `raw/App.jsx` — shell layout, state model, screen stack (Phase 1 reference)
- `raw/Components.jsx` — `TabBar`, `SideNav`, `AddEventSheet`, etc. (Phase 1 reference)
- `raw/HomeScreen.jsx` — `WeekRhythmStrip`, module chips, event timeline (Phase 2 reference)
- `raw/WorkoutScreen.jsx` — set rows, rest timer, sheets (Phase 4 reference)
- `raw/EditRoutineScreen.jsx` — exercise CRUD (Phase 5 reference)
- `raw/HistoryScreen.jsx` — bar chart, session cards (Phase 6 reference)
- `raw/ProgressScreen.jsx` — analytics, SVG charts, 1RM (Phase 7 reference)
- `raw/SettingsScreen.jsx` — all 6 rest options, lang toggle, dark mode (Phase 8 reference)
- `raw/EventLoggers.jsx` — Reading/Learning/Meal/Focus sheets (Phase 3 reference)
- `raw/CustomEvents.jsx` — custom event logger (Phase 3 reference)

When any implementation detail is unclear, read the raw source before guessing.

## Route Architecture

```text
/                    → landing page (shipped by landing-uikit done plan)
/app                 → app/app/page.tsx  ('use client', force-dynamic) — already
                       exists from the gear-up plan; this plan replaces its body
                       with <AppRoot /> instead of the gear-up's <EventsPage />
/system/status/be    → existing, untouched
```

`/app/page.tsx` mounts `<AppRoot />`. Hash routing lives entirely in the browser.
`next/navigation` is not used inside app screens.

## Assumed-Done Foundation (from the gear-up plan)

This plan **does not re-create** any of the following. Treat them as fixed
points landed by [`2026-04-28__organiclever-web-event-mechanism/`](../2026-04-28__organiclever-web-event-mechanism/README.md):

| Artifact                                                               | Owner         | This plan's relationship                                                                            |
| ---------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `apps/organiclever-web/src/lib/events/schema.ts`                       | gear-up       | Extended via per-kind `Schema.Union` narrowing the open `kind` discriminator                        |
| `lib/events/errors.ts`                                                 | gear-up       | Reused; this plan adds no new tagged-error variants in v0                                           |
| `lib/events/runtime.ts` (`PgliteService` Layer)                        | gear-up       | Reused; one `ManagedRuntime` lives at `<AppRoot />` and is provided down the tree via React Context |
| `lib/events/event-store.ts` (Effect-returning)                         | gear-up       | Reused; typed loggers wrap `appendEvents` with kind-narrowed input, but never bypass the store      |
| `lib/events/run-migrations.ts` + migration runner                      | gear-up       | Reused; this plan adds **one** new file under `lib/events/migrations/` (v2: typed-payload columns)  |
| `lib/events/use-events.ts` hook                                        | gear-up       | Reused; new hooks (`useRoutines`, `useSettings`) follow the same `ManagedRuntime` bridge pattern    |
| `effect`, `@effect/platform`, `@electric-sql/pglite`, `@effect/vitest` | gear-up       | Already in `package.json`; no install step                                                          |
| ts-ui `Textarea` + `Badge`                                             | landing-uikit | Already in `libs/ts-ui`; consumed directly                                                          |

## File Map

```text
apps/organiclever-web/src/
├── app/
│   └── app/
│       └── page.tsx                   ← Phase 1 (app entry)
├── components/
│   └── app/
│       ├── app-root.tsx               ← Phase 1
│       ├── tab-bar.tsx                ← Phase 1
│       ├── side-nav.tsx               ← Phase 1
│       ├── add-event-sheet.tsx        ← Phase 3
│       ├── home/
│       │   ├── home-screen.tsx        ← Phase 2
│       │   ├── week-rhythm-strip.tsx  ← Phase 2
│       │   ├── event-entry.tsx        ← Phase 2
│       │   ├── event-detail-sheet.tsx ← Phase 2
│       │   ├── workout-module-view.tsx← Phase 2
│       │   └── routine-card.tsx       ← Phase 2
│       ├── loggers/
│       │   ├── logger-shell.tsx       ← Phase 3
│       │   ├── reading-logger.tsx     ← Phase 3
│       │   ├── learning-logger.tsx    ← Phase 3
│       │   ├── meal-logger.tsx        ← Phase 3
│       │   ├── focus-logger.tsx       ← Phase 3
│       │   └── custom-event-logger.tsx← Phase 3
│       ├── workout/
│       │   ├── workout-screen.tsx     ← Phase 4
│       │   ├── active-exercise-row.tsx← Phase 4
│       │   ├── set-edit-sheet.tsx     ← Phase 4
│       │   ├── rest-timer.tsx         ← Phase 4
│       │   ├── set-timer-sheet.tsx    ← Phase 4
│       │   └── finish-screen.tsx      ← Phase 4
│       ├── routine/
│       │   ├── edit-routine-screen.tsx← Phase 5
│       │   └── exercise-editor-row.tsx← Phase 5
│       ├── history/
│       │   ├── history-screen.tsx     ← Phase 6
│       │   ├── session-card.tsx       ← Phase 6
│       │   └── weekly-bar-chart.tsx   ← Phase 6
│       ├── progress/
│       │   ├── progress-screen.tsx    ← Phase 7
│       │   └── exercise-progress-card.tsx ← Phase 7
│       └── settings/
│           └── settings-screen.tsx    ← Phase 8
├── lib/
│   ├── events/                        ← gear-up plan (DO NOT RE-CREATE)
│   │   ├── schema.ts                  ← gear-up; this plan extends via typed-payload union (see below)
│   │   ├── errors.ts                  ← gear-up
│   │   ├── runtime.ts                 ← gear-up
│   │   ├── event-store.ts             ← gear-up
│   │   ├── use-events.ts              ← gear-up
│   │   ├── run-migrations.ts          ← gear-up
│   │   ├── format-relative-time.ts    ← gear-up
│   │   ├── migrations/
│   │   │   ├── 2026_04_28T14_05_30__create_events_table.ts   ← gear-up
│   │   │   ├── 2026_05_03T09_22_15__add_typed_payload_columns.ts ← THIS PLAN, Phase 0 (v2)
│   │   │   └── index.generated.ts    ← gitignored, codegen
│   │   ├── typed-payloads.ts          ← THIS PLAN, Phase 0 (per-kind Schema union)
│   │   ├── typed-payloads.unit.test.ts ← THIS PLAN, Phase 0
│   │   ├── routine-store.ts           ← THIS PLAN, Phase 0 (Effect-returning routines CRUD)
│   │   ├── routine-store.unit.test.ts ← THIS PLAN, Phase 0
│   │   ├── settings-store.ts          ← THIS PLAN, Phase 0 (Effect-returning settings CRUD)
│   │   ├── settings-store.unit.test.ts ← THIS PLAN, Phase 0
│   │   ├── seed.ts                    ← THIS PLAN, Phase 0 (typed seed for first-load)
│   │   └── stats.ts                   ← THIS PLAN, Phase 7 (Progress / Home aggregations)
│   ├── hooks/
│   │   └── use-hash.ts                ← Phase 1
│   ├── i18n/
│   │   ├── translations.ts            ← Phase 0
│   │   └── use-t.ts                   ← Phase 0
│   ├── utils/
│   │   ├── fmt.ts                     ← Phase 0
│   │   └── fmt.unit.test.ts           ← Phase 0
│   └── auth/                          ← dormant, untouched (full path: src/lib/auth/)
├── services/                          ← dormant, untouched (excluded from coverage)
└── layers/                            ← dormant, untouched (excluded from coverage)
```

## Data Model

> These are the data-model contracts the bigger plan adds. Physically the
> declarations are split across multiple Effect `Schema` modules under
> `apps/organiclever-web/src/lib/events/`:
>
> - `typed-payloads.ts` — `EventType`, `WorkoutPayload`, `ReadingPayload`,
>   `LearningPayload`, `MealPayload`, `FocusPayload`, `CustomPayload`,
>   `EventPayload`, `LoggedEvent` — all as `Schema.Struct` / `Schema.Union`
>   with TS types via `Schema.Type<...>`
> - `routine-store.ts` (types section) — `Hue`, `ExerciseType`, `TimerMode`,
>   `ExerciseTemplate`, `ExerciseGroup`, `Routine`, `CompletedSet`,
>   `ActiveExercise`
> - `settings-store.ts` — `RestSeconds`, `Lang`, `AppSettings`
> - `stats.ts` — `WeeklyStats`, `DayEntry`, `ExerciseProgressPoint`,
>   `ExerciseProgress` (computed; not persisted)
>
> The block below shows the TS shapes for review purposes; the actual
> implementation files use `Schema.Struct({...})` and derive the TS type via
> `Schema.Type`. Plain `export interface` is acceptable only for the computed
> stats types that are never decoded from the wire.

```typescript
// Conceptual data-model snapshot — implementation is Schema-first per files above

export type Hue = "terracotta" | "honey" | "sage" | "teal" | "sky" | "plum";
export type ExerciseType = "reps" | "duration" | "oneoff";
export type TimerMode = "countdown" | "countup";
export type RestSeconds = "reps" | "reps2" | 0 | 30 | 60 | 90;
export type Lang = "en" | "id";

export interface ExerciseTemplate {
  id: string;
  name: string;
  type: ExerciseType;
  targetSets: number;
  targetReps: number;
  targetWeight: string | null;
  targetDuration: number | null;
  timerMode: TimerMode;
  bilateral: boolean;
  dayStreak: number;
  restSeconds: number | null;
}
export interface ExerciseGroup {
  id: string;
  name: string;
  exercises: ExerciseTemplate[];
}
export interface Routine {
  id: string;
  name: string;
  hue: Hue;
  type: "workout";
  createdAt: string;
  groups: ExerciseGroup[];
}

export interface CompletedSet {
  reps: number | null;
  weight: string | null;
  duration: number | null;
  restTaken: number | null;
}
export interface ActiveExercise extends ExerciseTemplate {
  sets: CompletedSet[];
}

// EventType has 6 members; "workout" is a session type initiated from AddEventSheet.
// The "5 event types" referenced in BRD/README refer to the quick-log types:
// reading, learning, meal, focus, custom. Workout is always session-initiated, not quick-log.
export type EventType = "workout" | "reading" | "learning" | "meal" | "focus" | "custom";
export interface WorkoutPayload {
  routineName: string | null;
  durationSecs: number;
  exercises: Array<ActiveExercise & { name: string }>;
}
export interface ReadingPayload {
  title: string;
  author: string | null;
  pages: number | null;
  durationMins: number | null;
  completionPct: number | null;
  notes: string | null;
}
export interface LearningPayload {
  subject: string;
  source: string | null;
  durationMins: number | null;
  rating: number | null;
  notes: string | null;
}
export interface MealPayload {
  name: string;
  mealType: string | null;
  energyLevel: number | null;
  notes: string | null;
}
export interface FocusPayload {
  task: string | null;
  durationMins: number | null;
  quality: number | null;
  notes: string | null;
}
export interface CustomPayload {
  name: string;
  hue: Hue;
  icon: string;
  durationMins: number | null;
  notes: string | null;
}
export type EventPayload =
  | WorkoutPayload
  | ReadingPayload
  | LearningPayload
  | MealPayload
  | FocusPayload
  | CustomPayload;

export interface LoggedEvent {
  id: string;
  type: EventType;
  labels: string[];
  startedAt: string;
  finishedAt: string;
  payload: EventPayload;
}
export interface AppSettings {
  name: string;
  restSeconds: RestSeconds;
  darkMode: boolean;
  lang: Lang;
}

// Stats
export interface WeeklyStats {
  workoutsThisWeek: number;
  streak: number;
  totalMins: number;
  totalSets: number;
}
export interface DayEntry {
  date: Date;
  label: string;
  durationMins: number;
  sessions: number;
}
export interface ExerciseProgressPoint {
  date: string;
  weight: number;
  reps: number;
  estimated1RM: number | null;
  isPR: boolean;
}
export interface ExerciseProgress {
  routineName: string | null;
  points: ExerciseProgressPoint[];
}
```

## Persistence: PGlite + Effect (extension on top of gear-up)

Storage continues to be **PGlite (Postgres-WASM over IndexedDB)** as landed by
the gear-up plan — `dataDir` `ol_events_v1`, IndexedDB key `/pglite/ol_events_v1`,
opened via `PgliteService` Layer. This plan introduces no new database; instead
it adds:

1. A **v2 migration** under `lib/events/migrations/` adding typed-payload
   columns (`started_at TIMESTAMPTZ`, `finished_at TIMESTAMPTZ`, plus a CHECK
   constraint narrowing `kind` to the six v0 values). All `ALTER TABLE` is
   additive — gear-up rows survive with `started_at = created_at` and
   `finished_at = updated_at` defaults filled by the migration's UPDATE pass.
2. **Per-kind `Schema.Union`** in `lib/events/typed-payloads.ts` narrowing the
   open `kind: string` to `'workout' | 'reading' | 'learning' | 'meal' |
'focus' | 'custom'` and pairing each `kind` with its typed `payload`
   `Schema.Struct`. Typed loggers decode-on-write through this union; the
   gear-up's open-`kind` `appendEvents` is the underlying call.
3. **`routine-store.ts` + `settings-store.ts`** — two new modules adding
   `routines` and `settings` tables (via the same migration), exposing
   `Effect`-returning CRUD that re-uses the gear-up's `PgliteService`.
4. **`seed.ts`** — runs once on first load when `(SELECT count(*) FROM events) = 0`
   AND `(SELECT count(*) FROM routines) = 0`. Seed = "Yoka" profile + Kettlebell
   day + Calisthenics + Super Exercise (plum) routines + 6 recent events
   across all types (one per type, including one custom event).

### v2 migration (typed-payload columns)

```typescript
// lib/events/migrations/2026_05_03T09_22_15__add_typed_payload_columns.ts

import type { PGlite, Transaction } from "@electric-sql/pglite";
type Queryable = PGlite | Transaction;

export const id = "2026_05_03T09_22_15__add_typed_payload_columns";

export async function up(db: Queryable): Promise<void> {
  await db.exec(`
    ALTER TABLE events
      ADD COLUMN started_at  TIMESTAMPTZ,
      ADD COLUMN finished_at TIMESTAMPTZ,
      ADD COLUMN labels      TEXT[] NOT NULL DEFAULT '{}';

    UPDATE events
      SET started_at  = created_at,
          finished_at = updated_at
      WHERE started_at IS NULL;

    ALTER TABLE events
      ALTER COLUMN started_at  SET NOT NULL,
      ALTER COLUMN finished_at SET NOT NULL;

    ALTER TABLE events
      ADD CONSTRAINT events_kind_v0
      CHECK (kind IN ('workout','reading','learning','meal','focus','custom'));

    CREATE TABLE IF NOT EXISTS routines (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      hue         TEXT NOT NULL,
      type        TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL,
      groups      JSONB NOT NULL DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS settings (
      id            TEXT PRIMARY KEY DEFAULT 'singleton',
      name          TEXT NOT NULL,
      rest_seconds  TEXT NOT NULL,
      dark_mode     BOOLEAN NOT NULL DEFAULT false,
      lang          TEXT NOT NULL DEFAULT 'en',
      CHECK (id = 'singleton')
    );
  `);
}

export async function down(db: Queryable): Promise<void> {
  await db.exec(`
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS routines;
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_kind_v0;
    ALTER TABLE events DROP COLUMN IF EXISTS labels;
    ALTER TABLE events DROP COLUMN IF EXISTS finished_at;
    ALTER TABLE events DROP COLUMN IF EXISTS started_at;
  `);
}
```

### Typed-payload `Schema.Union` (narrowing the open `kind`)

```typescript
// lib/events/typed-payloads.ts (sketch)

import { Schema } from "effect";
import { EventPayload, IsoTimestamp } from "./schema";

const WorkoutPayload = Schema.Struct({
  /* ... */
});
const ReadingPayload = Schema.Struct({
  /* ... */
});
// ... LearningPayload, MealPayload, FocusPayload, CustomPayload ...

export const TypedEvent = Schema.Union(
  Schema.Struct({ kind: Schema.Literal("workout"), payload: WorkoutPayload /* timestamps */ }),
  Schema.Struct({ kind: Schema.Literal("reading"), payload: ReadingPayload /* timestamps */ }),
  // ...
);
export type TypedEvent = typeof TypedEvent.Type;
```

Typed loggers (`<ReadingLogger>`, `<WorkoutScreen>`, etc.) build a typed
`TypedEvent`, encode it via `Schema.encodeSync(TypedEvent)`, and pass the
result to `appendEvents`. The store still sees `{ kind: string, payload:
unknown }` and writes faithfully; the read path uses `Schema.decodeUnknownSync(TypedEvent)`
to narrow JSONB rows back into the typed union for screens that need it.

### Effect-returning store extensions

```typescript
// lib/events/routine-store.ts (signatures)

export const listRoutines: () => Effect.Effect<ReadonlyArray<Routine>, StorageUnavailable, PgliteService>;
export const saveRoutine: (r: Routine) => Effect.Effect<Routine, StorageUnavailable, PgliteService>;
export const deleteRoutine: (id: RoutineId) => Effect.Effect<boolean, StorageUnavailable, PgliteService>;
export const reorderRoutineExercises: (
  routineId: RoutineId,
  groupId: GroupId,
  from: number,
  to: number,
) => Effect.Effect<Routine, NotFound | StorageUnavailable, PgliteService>;
```

```typescript
// lib/events/settings-store.ts (signatures)

export const getSettings: () => Effect.Effect<AppSettings, StorageUnavailable, PgliteService>;
export const saveSettings: (
  patch: Partial<AppSettings>,
) => Effect.Effect<AppSettings, StorageUnavailable, PgliteService>;
```

The class-based `OLDb` from earlier drafts of this plan is **discarded**.
Imperative methods would re-introduce the patterns the gear-up's "No ORM"
design decision forbade. Every new store function is a free `Effect`
returning function pulling `PgliteService` from context.

Custom-type derivation: no dedicated method; consumer runs the gear-up's
`listEvents` Effect, decodes the rows through the typed `Schema.Union`,
and filters for `kind === 'custom'` to build the user-created type list.

## useHash Hook — SSR Guard

`use-hash.ts` reads `window.location.hash` exclusively inside `useEffect` — never at module
level or during render. Initial state is `''` (empty string). This pattern prevents
`ReferenceError: window is not defined` if the hook is ever evaluated in a Node.js / SSR
context (even though the current `/app/page.tsx` uses `'use client'` + `force-dynamic`,
defensive coding here keeps the hook reusable outside that guarded context).

## State Management (AppRoot)

No external state library. All state in `AppRoot`:

| State          | Type                                                   | Description                                                                  |
| -------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `tab`          | `'home'\|'history'\|'progress'\|'settings'`            | Active bottom tab; persisted in localStorage (`ol_tab`)                      |
| `screen`       | `'main'\|'workout'\|'finish'\|'editRoutine'`           | Overlay screen stack                                                         |
| `screenData`   | `{ routine? } \| { session? } \| null`                 | Data for current overlay screen                                              |
| `isDesktop`    | `boolean`                                              | `window.innerWidth >= 768`; updates on resize                                |
| `darkMode`     | `boolean`                                              | Read from DB; updates `data-theme` on `<html>`                               |
| `refreshKey`   | `number`                                               | Increment triggers DB re-query in all children                               |
| `addEvent`     | `boolean`                                              | AddEventSheet open                                                           |
| `activeLogger` | `'reading' \| 'learning' \| 'meal' \| 'focus' \| null` | Which quick-log sheet is open; custom types use `customLogger` state instead |
| `customLogger` | string or null                                         | Custom event type or `'new'`                                                 |

## i18n

```typescript
// lib/i18n/translations.ts — TRANSLATIONS['en'] and TRANSLATIONS['id']
// All keys from prototype i18n.js: home, history, settings, progress,
// greeting, last7days, sessions, streak, days, timeMoved, setsDone, ...

// lib/i18n/use-t.ts
import { useSettings } from "@/lib/events/use-settings"; // sibling Effect-runtime hook
export function useT() {
  const { settings } = useSettings(); // returns AppSettings via runtime.runPromise(getSettings())
  const lang = settings?.lang ?? "en";
  return (key: keyof (typeof TRANSLATIONS)["en"]) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}
```

Language switch:

```typescript
const { runtime } = useEventsRuntime(); // shared ManagedRuntime via React Context
await runtime.runPromise(saveSettings({ lang: code }));
window.location.reload();
```

(`saveSettings` is the Effect-returning function from `lib/events/settings-store.ts`.)

## Utilities

```typescript
// lib/utils/fmt.ts
fmtTime(secs: number): string     // 90 → "1:30", 45 → "45s"
fmtKg(kg: number): string         // 1500 → "1.5k", 850 → "850"
fmtSpec(ex: ExerciseTemplate): string  // "3 × 20 LR @ 8 kg"
```

## ts-ui Components Used from Landing-UIKit Plan

`Textarea` — all event logger notes fields.
`Badge` — event-type tags, day-streak badge, module chips hint text.
All other existing ts-ui: `Button`, `Icon`, `StatCard`, `AppHeader`, `TabBar`, `SideNav`,
`HuePicker`, `Toggle`, `ProgressRing`, `Sheet`, `InfoTip`, `Input`, `Label`, `Card`.

### Event-Type Icon Assignments

The `Icon` component's `IconName` union does not include `"book"`. Use these icon names
for event-type rows in `AddEventSheet` and `LoggerShell`:

| Event type | Icon name     | Notes                                     |
| ---------- | ------------- | ----------------------------------------- |
| Workout    | `dumbbell`    | Exists in ts-ui                           |
| Reading    | `calendar`    | Closest available; "book" is not in ts-ui |
| Learning   | `zap`         | Inspiration / energy; exists in ts-ui     |
| Meal       | `clock`       | Time-based; exists in ts-ui               |
| Focus      | `timer`       | Concentration timer; exists in ts-ui      |
| Custom     | `plus-circle` | Additive; exists in ts-ui                 |

If a `"book"` icon is added to ts-ui in a future plan, swap Reading from `calendar` to
`book` at that time. No blocker for Phase 3 implementation.

## Progress Charts (Phase 7)

Pure inline SVG — no charting library:

- Exercise weight chart: `<svg viewBox="0 0 200 80">`; `<polyline>` normalized to viewBox;
  `<circle>` per point; `<text>★</text>` on PR points
- Weekly bar chart (history): CSS flex heights (existing prototype approach)
- Module activity bar chart: 7-bar flex layout per day (same as WeekRhythmStrip but
  per-module single color)

1RM Brzycki: `weight × (36 / (37 - reps))` — only computed when `reps >= 1 && reps <= 10`.

## Rest Timer Logic

```text
resolvedRest(exercise, settings):
  if exercise.restSeconds !== null → use exercise.restSeconds
  else if settings.restSeconds === 'reps' → exercise.targetReps (seconds)
  else if settings.restSeconds === 'reps2' → exercise.targetReps * 2 (seconds)
  else if settings.restSeconds === 0 → skip timer
  else → settings.restSeconds (30|60|90)
```

Timer implementation: timer ID stored in `useRef<ReturnType<typeof setInterval>>`. Cleanup:
`clearInterval(timerRef.current)` called in the `useEffect` return function to prevent
memory leaks and stale countdown-after-unmount bugs.

Day streak: increments when next session within 72 h of last; resets to 1 on miss.

## Design Decisions

### Hash routing instead of Next.js App Router for in-app navigation

`next/navigation` (router, link) is tied to the Next.js page hierarchy. The OrganicLever
app is a single-page experience that must handle deep links like `/#/app/history` without
server-side route changes. Hash routing (`window.location.hash` + a `hashchange` listener
in `use-hash.ts`) keeps all navigation in the browser, avoids server round-trips, and
integrates cleanly with the existing landing-page routes at `/`.

### No external state library (Redux, Zustand, Jotai, etc.)

The app state is a shallow object (`tab`, `screen`, `screenData`, `darkMode`, `refreshKey`,
`addEvent`, `activeLogger`, `customLogger`) that lives entirely in `AppRoot`. All state
transitions are simple value assignments. Adding a state library would introduce a dependency
and boilerplate with no benefit at this scale. State is co-located in the component that
owns it; the `refreshKey` increment pattern forces DB re-reads in children without prop
drilling.

### Pure inline SVG for charts instead of a charting library

`recharts`, `chart.js`, and similar libraries add 40–100 kB to the bundle and impose
opinionated component APIs. The two chart types needed (SVG polyline for exercise progress,
CSS-flex bars for weekly rhythm) are 20–30 lines of JSX each. Building them inline keeps
the bundle small, avoids version lock-in, and keeps chart code readable alongside the
component that renders it.

### Extend gear-up's PGlite migration registry rather than versioned-key swap

Earlier drafts of this plan used a versioned `localStorage` key (`ol_db_v12`)
that abandoned data on schema change. The gear-up plan replaced that with a
proper migration runner over PGlite — every schema change is one new file under
`lib/events/migrations/` with strict timestamp + snake_case naming and a
per-migration transaction. This plan adds **one** new migration file
(v2: typed-payload columns) and one entry to the codegen index. Existing
gear-up rows survive the v2 migration (additive `ALTER TABLE ... ADD COLUMN`
with backfill UPDATE; never `DROP COLUMN`). Future PWA-sync columns
(`original_created_at`, `deleted_at`, `synced_at`, `dirty`, `client_id`)
slot in as v3 the same way.

## Rollback

1. **v2 migration rollback**: Each migration runs inside its own
   `db.transaction(...)` per the gear-up runner. If the v2 migration fails
   mid-apply, the per-migration transaction rolls back the partial
   `ALTER TABLE`; the `_migrations` row is never written; subsequent app
   loads re-apply the migration cleanly. Reverting this plan's commits
   removes the v2 migration file from `lib/events/migrations/`; the codegen
   regenerates `index.generated.ts` without it; PGlite databases that
   already applied v2 keep the extra columns (additive — no data loss),
   though the application code reverts to gear-up open-`kind` behaviour.
2. **`/app` route is additive in route registration**: the route already
   exists from the gear-up plan. This plan only changes the page body
   (`<EventsPage />` → `<AppRoot />`). Reverting restores the gear-up's
   provisional event-mechanism page; `/` and `/system/status/be` are
   untouched.
3. **No data migration is required to roll back**: gear-up data and v2-era
   data both round-trip cleanly through gear-up's open-`kind` store; the
   typed-payload `Schema.Union` is read-side only.

## Dependencies

| Dependency                   | Version            | Status   | Notes                                                                                        |
| ---------------------------- | ------------------ | -------- | -------------------------------------------------------------------------------------------- |
| Next.js                      | 16 (existing)      | Existing | No change                                                                                    |
| TypeScript                   | Existing           | Existing | All new files are `.tsx` / `.ts`; strict mode + `noUncheckedIndexedAccess`                   |
| Vitest                       | Existing           | Existing | Unit + integration tests use existing runner; vitest.config.ts already amended by gear-up    |
| Playwright                   | Existing           | Existing | E2E via `organiclever-web-e2e`                                                               |
| `effect`                     | ^3.16 (in pkg)     | Existing | Already installed; no install step                                                           |
| `@effect/platform`           | ^0.84 (in pkg)     | Existing | Already installed                                                                            |
| `@effect/vitest`             | from gear-up       | Existing | Already installed by gear-up; this plan reuses Layer-swap pattern                            |
| `@electric-sql/pglite`       | from gear-up       | Existing | Already installed by gear-up; this plan reuses `PgliteService` Layer + raw parameterised SQL |
| `lib/events/*` (gear-up)     | from gear-up       | Existing | Schema, errors, runtime, store, hook, migration runner — all reused                          |
| ts-ui `Textarea` / `Badge`   | from landing-uikit | Existing | Already in `libs/ts-ui`                                                                      |
| ts-ui (all other components) | Existing exports   | Existing | Button, Icon, StatCard, AppHeader, TabBar, SideNav, etc.                                     |
| rhino-cli test-coverage      | Existing           | Existing | Validates ≥ 70 % coverage threshold in `test:quick`                                          |
| rhino-cli spec-coverage      | Existing           | Existing | Validates Gherkin step coverage                                                              |

**No new npm packages are introduced by this plan.** Effect, PGlite,
`@effect/vitest`, and ts-ui were all installed by the gear-up + landing-uikit
plans. This plan adds source files and one new migration only.

## Testing Strategy

- **Unit (Vitest + Gherkin)**: all DB methods, i18n keys, fmt utilities, stateless component
  render assertions
- **Gherkin specs**: `specs/apps/organiclever/fe/gherkin/<feature>/` — one `.feature` per
  phase feature
- **E2E (Playwright)**: `organiclever-web-e2e` — smoke suite per phase
- **Coverage**: ≥ 70 % lines enforced by `rhino-cli test-coverage validate` in `test:quick`
- **Spec coverage**: `nx run organiclever-web:spec-coverage` validates that all Gherkin
  feature scenarios have corresponding step implementations in the app test suite
