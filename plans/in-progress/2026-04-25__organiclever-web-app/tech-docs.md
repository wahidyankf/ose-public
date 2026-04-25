# Technical Documentation

## Raw Design Files

Prototype source files are in `raw/`. See `raw/README.md` for the full file list and
confirmed design decisions. Primary references by phase:

- `raw/colors_and_type.css` — design token system (hues, warm scale, dark mode, type)
- `raw/db.js` — `OLDb` class + seed data (Phase 0 reference)
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
/                    → landing page (handled by landing-uikit plan)
/app                 → app/app/page.tsx  ('use client', force-dynamic)
/system/status/be    → existing, untouched
```

`/app/page.tsx` mounts `<AppRoot />`. Hash routing lives entirely in the browser.
`next/navigation` is not used inside app screens.

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
│   ├── db/
│   │   ├── types.ts                   ← Phase 0
│   │   ├── db.ts                      ← Phase 0
│   │   ├── seed.ts                    ← Phase 0
│   │   └── db.test.ts                 ← Phase 0
│   ├── hooks/
│   │   └── use-hash.ts                ← Phase 1
│   ├── i18n/
│   │   ├── translations.ts            ← Phase 0
│   │   └── use-t.ts                   ← Phase 0
│   └── utils/
│       ├── fmt.ts                     ← Phase 0
│       └── fmt.test.ts                ← Phase 0
├── services/                          ← dormant, untouched
├── layers/                            ← dormant, untouched
└── lib/auth/                          ← dormant, untouched
```

## Data Model

```typescript
// lib/db/types.ts (complete)

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

## localStorage DB

Single key `ol_db_v12`. Class `OLDb`:

```typescript
class OLDb {
  // settings
  getSettings(): AppSettings;
  saveSettings(patch: Partial<AppSettings>): void;

  // routines
  getRoutines(): Routine[];
  saveRoutine(r: Routine): void;
  deleteRoutine(id: string): void;
  reorderRoutineExercises(routineId: string, groupId: string, from: number, to: number): void;

  // events
  saveEvent(e: Omit<LoggedEvent, "id">): void;
  getEvents(): LoggedEvent[]; // newest-first
  getSessions(): LoggedEvent[]; // alias

  // computed
  getLast7Days(): DayEntry[];
  getWeeklyStats(): WeeklyStats;
  getVolume(days: number): number;
  getExerciseProgress(days: number): Record<string, ExerciseProgress>;
}
```

Seed applied on first load (key absent). Seed = "Yoka" profile + Kettlebell day + Calisthenics
routines + 6 recent events across all types (one per type, including one custom event).

Custom type derivation: no dedicated method; consumer calls `getEvents()` and filters for
`type === 'custom'` to build the list of user-created type names and their payload metadata.
Example: `getEvents().filter(e => e.type === 'custom').map(e => (e.payload as CustomPayload).name)`

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
export function useT() {
  const [lang, setLang] = useState<Lang>(() => new OLDb().getSettings().lang ?? "en");
  return (key: keyof (typeof TRANSLATIONS)["en"]) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}
```

Language switch: `new OLDb().saveSettings({ lang: code }); window.location.reload()` — same
as prototype.

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

### `ol_db_v12` localStorage key naming instead of a versioned migration system

A migration system (e.g., Dexie, idb-keyval with schema versions) would require defining
upgrade paths for each schema change. At v0 scope, schema stability is not yet established.
Using a versioned string key (`ol_db_v12`) means: when the schema changes incompatibly,
bump the key suffix and accept that existing data is abandoned (users get fresh seed data).
This is acceptable for a v0 app with no user base and simplifies the codebase significantly.

## Rollback

1. **localStorage key rollback**: The key `ol_db_v12` is version-scoped. Reverting to a
   previous git commit automatically reverts the code that reads/writes this key. Existing
   data stored under `ol_db_v12` is ignored by older code if the schema is incompatible —
   the seed is re-applied on the next load. No manual migration step is needed.
2. **`/app` route is additive**: The new `src/app/app/page.tsx` adds a route; it does not
   modify `/` or `/system/status/be`. Reverting this plan's commits removes the route
   without touching any existing pages.
3. **No DB migration path**: Because the key is versioned, there is no forward migration
   to undo. A rollback simply means older code runs with its own key (or no key, triggering
   seed). No cleanup of existing `localStorage` data is needed by the rollback procedure.

## Dependencies

| Dependency                   | Version          | Status       | Notes                                                    |
| ---------------------------- | ---------------- | ------------ | -------------------------------------------------------- |
| Next.js                      | 16 (existing)    | Existing     | No change — app route added under existing Next.js setup |
| TypeScript                   | Existing         | Existing     | All new files are `.tsx` / `.ts`                         |
| Vitest                       | Existing         | Existing     | Unit tests use existing test runner                      |
| Playwright                   | Existing         | Existing     | E2E via `organiclever-web-e2e` (existing project)        |
| ts-ui `Textarea`             | From uikit plan  | Prerequisite | Required by Phase 3+ logger notes fields                 |
| ts-ui `Badge`                | From uikit plan  | Prerequisite | Required by Phase 2+ event-type chips and day-streak     |
| ts-ui (all other components) | Existing exports | Existing     | Button, Icon, StatCard, AppHeader, TabBar, SideNav, etc. |
| rhino-cli test-coverage      | Existing         | Existing     | Validates ≥ 70 % coverage threshold in `test:quick`      |
| rhino-cli spec-coverage      | Existing         | Existing     | Validates Gherkin step coverage                          |

**No new npm packages are introduced by this plan.** All functionality is implemented using
existing dependencies and the ts-ui component library extended by the landing-uikit plan.

## Testing Strategy

- **Unit (Vitest + Gherkin)**: all DB methods, i18n keys, fmt utilities, stateless component
  render assertions
- **Gherkin specs**: `specs/apps/organiclever/fe/gherkin/<feature>/` — one `.feature` per
  phase feature
- **E2E (Playwright)**: `organiclever-web-e2e` — smoke suite per phase
- **Coverage**: ≥ 70 % lines enforced by `rhino-cli test-coverage validate` in `test:quick`
- **Spec coverage**: `nx run organiclever-web:spec-coverage` validates that all Gherkin
  feature scenarios have corresponding step implementations in the app test suite
