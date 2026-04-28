# Delivery Checklist

**Prerequisite plans (must be in `plans/done/`)**:

- `plans/done/2026-04-25__organiclever-web-landing-uikit/` — `Textarea` +
  `Badge` exported from ts-ui; `apps/organiclever-web/src/app/page.tsx`
  renders the landing page.
- `plans/in-progress/2026-04-28__organiclever-web-event-mechanism/` — must
  archive to `plans/done/` before THIS plan starts execution. Provides
  `lib/events/{schema,errors,runtime,event-store,use-events,run-migrations,format-relative-time}.ts`,
  PGlite `dataDir` `ol_events_v1`, migration registry v1, and a provisional
  `/app/page.tsx`. **Do not re-implement the storage layer; do not invent
  a new database key. Extend the gear-up's primitives.**

---

## Environment Setup

- [ ] Install dependencies in the root worktree: `npm install`
- [ ] Converge the full polyglot toolchain: `npm run doctor -- --fix`
- [ ] Verify dev server starts: `nx dev organiclever-web` (expect `localhost:3200`)
- [ ] Confirm existing tests pass before making changes — gear-up's
      `lib/events/` and provisional `/app/page.tsx` should be green: - `nx run organiclever-web:typecheck` - `nx run organiclever-web:lint` - `nx run organiclever-web:test:quick` - `nx run organiclever-web:test:integration` - `nx run organiclever-web-e2e:test:e2e`
- [ ] Confirm gear-up artifacts present: - `apps/organiclever-web/src/lib/events/event-store.ts` exists and exports
      Effect-returning `appendEvents`, `updateEvent`, `deleteEvent`, `bumpEvent`,
      `listEvents`, `clearEvents` - `apps/organiclever-web/src/lib/events/runtime.ts` exposes `PgliteService`
      and `makeEventsRuntime` - `apps/organiclever-web/src/lib/events/migrations/2026_04_28T14_05_30__create_events_table.ts` exists - `package.json` already lists `effect`, `@effect/platform`,
      `@electric-sql/pglite`, `@effect/vitest`

### Commit Guidelines

- [ ] Commit changes thematically — group related changes into logically cohesive commits
- [ ] Follow Conventional Commits format: `<type>(<scope>): <description>`
      Examples:
      `feat(events-v2): add typed-payload Schema union narrowing kind`,
      `feat(events-v2): add v2 migration adding started_at/finished_at/labels columns`,
      `feat(events-v2): add Effect-returning routine-store + settings-store + seed`,
      `feat(shell): replace provisional /app/page.tsx body with AppRoot (TabBar + SideNav)`,
      `feat(loggers): add reading and focus typed loggers wrapping appendEvents`,
      `feat(workout): add WorkoutScreen and rest timer`,
      `feat(history): add HistoryScreen and SessionCard`,
      `feat(progress): add ProgressScreen and exercise charts`,
      `feat(settings): add SettingsScreen with lang and dark mode`
- [ ] Split different domains/concerns into separate commits — keep
      `feat(events-v2):` (storage extensions) separate from `feat(loggers):`
      (UI), `feat(shell):` (route wiring), and `test(*):` (tests)

---

## Phase 0 — Foundation (extension on gear-up)

> **Reminder**: gear-up already shipped `lib/events/{schema,errors,runtime,
event-store,use-events,run-migrations,format-relative-time}.ts`. This phase
> ADDS new files; it does NOT re-create those.

### 0.1 v2 migration (typed-payload columns + routines + settings tables)

- [ ] Substitute the actual UTC second-precision timestamp at file-creation
      time. Create `apps/organiclever-web/src/lib/events/migrations/<TS>__add_typed_payload_columns.ts`
      following the gear-up filename regex
      `^\d{4}_\d{2}_\d{2}T\d{2}_\d{2}_\d{2}__[a-z0-9_]{1,60}\.ts$`
- [ ] Body per `tech-docs.md` "v2 migration" sketch:
  - [ ] `export const id = "<filename without .ts>"`
  - [ ] `export async function up(db: Queryable)` running:
        `ALTER TABLE events ADD COLUMN started_at TIMESTAMPTZ, ADD COLUMN finished_at TIMESTAMPTZ, ADD COLUMN labels TEXT[] NOT NULL DEFAULT '{}';`
        then backfill `UPDATE events SET started_at = created_at, finished_at = updated_at WHERE started_at IS NULL;`
        then `ALTER TABLE events ALTER COLUMN started_at SET NOT NULL, ALTER COLUMN finished_at SET NOT NULL;`
        then `ALTER TABLE events ADD CONSTRAINT events_kind_v0 CHECK (kind IN ('workout','reading','learning','meal','focus','custom'));`
        then `CREATE TABLE IF NOT EXISTS routines (...);`
        then `CREATE TABLE IF NOT EXISTS settings (...);`
  - [ ] `export async function down(db: Queryable)` reversing in the inverse order
- [ ] Run `npm run gen:migrations` (already wired by gear-up) and verify the
      regenerated `index.generated.ts` includes the v2 entry
- [ ] Add `apps/organiclever-web/src/lib/events/migrations/<TS>__add_typed_payload_columns.unit.test.ts`:
  - [ ] In-memory PGlite — apply v1 + v2 in sequence; assert the new columns + tables exist
  - [ ] Insert gear-up shape rows BEFORE applying v2; apply v2; assert
        `started_at = created_at` and `finished_at = updated_at` for those
        rows (backfill semantics)
  - [ ] Force a constraint violation by attempting `INSERT ... kind = 'unknown'`
        after v2; assert the `events_kind_v0` CHECK rejects it

### 0.2 Per-kind typed Schema union (`typed-payloads.ts`)

- [ ] Create `apps/organiclever-web/src/lib/events/typed-payloads.ts` per
      `tech-docs.md` sketch:
  - [ ] `WorkoutPayload`, `ReadingPayload`, `LearningPayload`, `MealPayload`,
        `FocusPayload`, `CustomPayload` — six `Schema.Struct` types matching
        the prototype's fields
  - [ ] `TypedEvent = Schema.Union(...)` discriminating on `kind` literal
  - [ ] Export `TypedEvent` type via `Schema.Type<typeof TypedEvent>`
- [ ] Create `apps/organiclever-web/src/lib/events/typed-payloads.unit.test.ts`:
  - [ ] Each kind round-trips through `Schema.encodeSync` →
        `Schema.decodeUnknownSync` cleanly
  - [ ] Wrong kind/payload combo (e.g., `kind: 'workout'` with reading
        payload) is rejected by the union decoder
  - [ ] Decode failure surfaces field-level errors via `ArrayFormatter`

### 0.3 Effect-returning routine store

- [ ] Create `apps/organiclever-web/src/lib/events/routine-store.ts` per
      `tech-docs.md`:
  - [ ] `listRoutines: Effect<ReadonlyArray<Routine>, StorageUnavailable, PgliteService>`
  - [ ] `saveRoutine: (r: Routine) => Effect<Routine, StorageUnavailable, PgliteService>`
  - [ ] `deleteRoutine: (id: RoutineId) => Effect<boolean, StorageUnavailable, PgliteService>`
  - [ ] `reorderRoutineExercises: (...) => Effect<Routine, NotFound | StorageUnavailable, PgliteService>`
  - [ ] Every `Effect.tryPromise` MUST supply a typed `catch` mapper (no
        `UnknownException` leaks)
- [ ] Create `apps/organiclever-web/src/lib/events/routine-store.unit.test.ts`
      using `@effect/vitest` Layer-swap (in-memory PGlite + v1 + v2 migrations)

### 0.4 Effect-returning settings store

- [ ] Create `apps/organiclever-web/src/lib/events/settings-store.ts`:
  - [ ] `getSettings: Effect<AppSettings, StorageUnavailable, PgliteService>`
        (lazily creates the singleton row from defaults if missing)
  - [ ] `saveSettings: (patch: Partial<AppSettings>) => Effect<AppSettings, StorageUnavailable, PgliteService>`
- [ ] Create `apps/organiclever-web/src/lib/events/settings-store.unit.test.ts`

### 0.5 Seed

- [ ] Create `apps/organiclever-web/src/lib/events/seed.ts`:
  - [ ] `seedIfEmpty: Effect<void, StorageUnavailable, PgliteService>` runs
        once when both `events` and `routines` are empty
  - [ ] Settings: `{ name: 'Yoka', restSeconds: 60, darkMode: false, lang: 'en' }`
  - [ ] Routine "Kettlebell day" (teal) — 1 group, 6 exercises
  - [ ] Routine "Calisthenics" (honey) — 1 group "Future", 5 bodyweight exercises
  - [ ] Routine "Super Exercise" (plum) — featured per raw/README.md
  - [ ] 6 seed events (1 per kind, all `started_at` within last 7 days,
        custom kind = "Meditation" plum/moon/20-min)
  - [ ] All writes go through `appendEvents` / `saveRoutine` / `saveSettings`
        — never raw SQL — so the typed `Schema.Union` validates the seed
- [ ] Wire the seed into `<AppRoot />`'s mount effect (Phase 1.3) so it runs
      after `runtime.runPromise(...)` resolves the gear-up's migration runner

### 0.6 i18n

- [ ] Create `apps/organiclever-web/src/lib/i18n/translations.ts` —
      `TRANSLATIONS` object; all keys from prototype `i18n.js` (both `en` +
      `id` locales complete)
- [ ] Create `apps/organiclever-web/src/lib/i18n/use-t.ts` — `useT()` hook
      reading `lang` from `useSettings()` (the new Effect-runtime hook from
      Phase 0.4); fallback to `'en'` when settings are still loading
- [ ] Unit test: all keys present in both locales (diff check)

### 0.7 Utilities

- [ ] Create `apps/organiclever-web/src/lib/utils/fmt.ts`: `fmtTime`,
      `fmtKg`, `fmtSpec`
- [ ] Create `apps/organiclever-web/src/lib/utils/fmt.unit.test.ts`:
  - [ ] `fmtTime(90)` → `"1:30"`, `fmtTime(45)` → `"45s"`, `fmtTime(0)` → `"0s"`
  - [ ] `fmtKg(1500)` → `"1.5k"`, `fmtKg(850)` → `"850"`
  - [ ] `fmtSpec` reps mode, duration mode, one-off mode, bilateral flag

### 0.8 Validation

- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes (≥ 70 % LCOV)
- [ ] `nx run organiclever-web:test:integration` passes — including the v2
      migration backfill test
- [ ] Fix ALL failures found — including any preexisting failures not caused
      by your changes

---

## Phase 1 — App Shell

### 1.1 App route (replace gear-up's provisional body)

- [ ] `src/app/app/page.tsx` already exists from gear-up; KEEP `'use client'`
      and `export const dynamic = 'force-dynamic'`. Replace the body so it
      renders `<AppRoot />` instead of `<EventsPage />`. Add
      `document.body.classList.add('app-mode')` inside a `useEffect` (with
      cleanup that removes the class on unmount)
- [ ] The gear-up's `<EventsPage />` is no longer mounted on `/app`. The
      provisional UI components in `components/app/{add-event-button,event-form-sheet,event-list,event-card,events-page}.tsx`
      can be deleted in this phase OR kept as a debug-only "raw event" panel
      mountable behind a dev flag — record the decision in the commit message

### 1.2 useHash hook

- [ ] Create `src/lib/hooks/use-hash.ts` — listens to `hashchange` + initial read;
      returns current `window.location.hash`
      Use `useEffect` for the initial read and event listener attachment; return `''`
      as the initial state to avoid ReferenceError if hook runs outside browser context.
      SSR guard: hook reads `window.location.hash` only inside `useEffect`, never at
      module level or during render — prevents ReferenceError on Node.js / server-side.

### 1.3 AppRoot component

- [ ] Create `src/components/app/app-root.tsx` with all state fields from tech-docs.md:
  - [ ] `tab` (localStorage `ol_tab`), `screen`, `screenData`, `isDesktop`, `darkMode`,
        `refreshKey`, `addEvent`, `activeLogger`, `customLogger`
  - [ ] `darkMode` effect: sets `data-theme` on `<html>`
  - [ ] `isDesktop` effect: `window.innerWidth >= 768` + resize listener
  - [ ] `navigate()`, `refresh()`, `startRoutine()`, `startBlank()`, `finishWorkout()`,
        `newRoutine()`, `editRoutine()`, `backToMain()` callbacks
  - [ ] Desktop layout: `SideNav` + sticky 480 px content pane + card shadow
  - [ ] Mobile layout: full-width pane + `TabBar` when `screen === 'main'`
  - [ ] Routes to correct screen component based on `screen` + `tab`
  - [ ] `AddEventSheet`, quick logger sheets, `CustomEventLogger` overlays

### 1.4 TabBar

- [ ] Create `src/components/app/tab-bar.tsx` — this is a **custom** TabBar, NOT the
      `TabBar` from ts-ui (which uses `h-[60px]`); this custom component uses `h-[64px]`:
  - [ ] 5 slots: Home (left), Progress (left-center), FAB (center), History (right-center),
        Settings (right)
  - [ ] Tab icons: Home→`icon="home"`, Progress→`icon="trend"`, History→`icon="history"`,
        Settings→`icon="settings"`
  - [ ] FAB: 52×52 teal rounded-[16px]; `icon="plus"`; box-shadow teal glow; scale-90
        on press
  - [ ] Active tab: `--hue-teal` color + bold text; icon `filled` prop true
  - [ ] 64 px height + `env(safe-area-inset-bottom,0)` padding

### 1.5 SideNav

- [ ] Create `src/components/app/side-nav.tsx`:
  - [ ] 220 px, border-right, card background
  - [ ] Logo section: 32×32 teal icon + "OrganicLever" 800 + "Life event tracker" sub
  - [ ] "Log event" teal full-width button; margin-bottom 12 px
  - [ ] 4 nav items (Home/History/Progress/Settings): active = teal-wash bg + teal-ink

### 1.6 Gherkin specs

- [ ] Create `specs/apps/organiclever/fe/gherkin/app-shell/navigation.feature`
- [ ] Step implementations `test/unit/steps/app-shell/app-shell.steps.tsx`
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes
- [ ] Fix ALL failures found — including any preexisting failures not caused by your changes

---

## Phase 2 — Home Screen

### 2.1 WeekRhythmStrip

- [ ] Create `src/components/app/home/week-rhythm-strip.tsx`:
  - [ ] Props: `last7Days: DayEntry[]`, `recentEvents: LoggedEvent[]`
  - [ ] Color map: workout=teal, reading=plum, learning=honey, meal=terracotta,
        focus=sky, custom=sage
  - [ ] 7 columns flex-aligned bottom; today 100 % opacity, others 70 %; min-height 6 px
  - [ ] Day label below; today: teal-ink bold

### 2.2 EventEntry

- [ ] Create `src/components/app/home/event-entry.tsx`:
  - [ ] Props: `event: LoggedEvent`, `onClick?: () => void`
  - [ ] 34×34 hued `Icon` box; name (ellipsis); time + duration + sets sub-row
  - [ ] `Badge` variant="default" size="sm" hue=event.hue for type tag

### 2.3 EventDetailSheet

- [ ] Create `src/components/app/home/event-detail-sheet.tsx`:
  - [ ] Props: `event: LoggedEvent | null`, `onClose: () => void`
  - [ ] Bottom sheet (fixed inset-0, backdrop, slide-up inner panel max-w-480 max-h-[80vh])
  - [ ] 44×44 icon; name + date/time; close × button
  - [ ] 2-col stat grid; reading progress bar; workout exercise list; notes; label chips
        as `Badge` variant="outline" hue=event.hue

### 2.4 RoutineCard

- [ ] Create `src/components/app/home/routine-card.tsx`:
  - [ ] 52×52 hued dumbbell icon; name + exercise count + group count; chevron-right
  - [ ] Edit pencil button (right border strip); scale-98 press effect

### 2.5 WorkoutModuleView

- [ ] Create `src/components/app/home/workout-module-view.tsx`:
  - [ ] 4 `StatCard`s (2-col grid): Sessions/7d (hue="teal" icon="dumbbell"),
        Streak/wks (hue="terracotta" icon="flame"), Time moved/min (hue="honey" icon="clock"),
        Sets done/sets (hue="sage" icon="zap")
  - [ ] Volume card: plum trend icon; mono kg value; 5 range buttons (7d / 30d / 3m / 6m / 1y)
  - [ ] "Workout templates" label + `InfoTip` + "New" button; full `RoutineCard` list

### 2.6 HomeScreen

- [ ] Create `src/components/app/home/home-screen.tsx`:
  - [ ] Header row + week card + filter chips + conditional module views
  - [ ] Infinite scroll: `IntersectionObserver` on loader sentinel; +10 events per trigger
  - [ ] Date-grouped event list with `EventEntry` rows
  - [ ] `EventDetailSheet` overlay; `selectedEvent` state

### 2.7 Gherkin specs

- [ ] Create `specs/apps/organiclever/fe/gherkin/home/home-screen.feature`
- [ ] Step implementations `test/unit/steps/home/home-screen.steps.tsx`
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes
- [ ] Fix ALL failures found — including any preexisting failures not caused by your changes

---

## Phase 3 — Event Loggers

### 3.1 LoggerShell

- [ ] Create `src/components/app/loggers/logger-shell.tsx`:
  - [ ] Bottom sheet: fixed, backdrop, slide-up panel
  - [ ] Drag handle (24×4 rounded pill, warm-200)
  - [ ] Header: hued 44×44 icon + title + close × `Button` icon-sm variant secondary
  - [ ] Scrollable `<div>` content slot
  - [ ] Sticky footer: "Cancel" ghost + "Save" teal; Save `disabled={saveDisabled}`

### 3.2 AddEventSheet

- [ ] Create `src/components/app/add-event-sheet.tsx`:
  - [ ] Rows for Workout, Reading, Learning, Meal, Focus (hued icons + labels)
  - [ ] Rows for each saved custom type (derive by calling `new OLDb().getEvents()` and
        filtering for `type === 'custom'`, then extracting unique custom type names)
  - [ ] "New custom type" row (dashed icon)
  - [ ] Close on backdrop tap

### 3.3 Reading, Learning, Meal, Focus loggers

- [ ] Create `src/components/app/loggers/reading-logger.tsx` — plum; title required;
      author + pages + duration + completion % chips + `<Textarea>` notes
- [ ] Create `src/components/app/loggers/learning-logger.tsx` — honey; subject required;
      source + duration + quality emoji row + `<Textarea>` notes
- [ ] Create `src/components/app/loggers/meal-logger.tsx` — terracotta; name required;
      meal type chips + energy emoji row + `<Textarea>` notes
- [ ] Create `src/components/app/loggers/focus-logger.tsx` — sky; task or duration
      required; duration presets + custom `Input` + quality emoji row + `<Textarea>` notes

### 3.4 CustomEventLogger

- [ ] Create `src/components/app/loggers/custom-event-logger.tsx`:
  - [ ] Name `Input` (required); `HuePicker`; icon picker (grid of 12 common icon names)
  - [ ] Duration `Input` + `<Textarea>` notes
  - [ ] "new" mode: saves type definition to DB settings before logging event

### 3.5 Gherkin specs

- [ ] Create `specs/apps/organiclever/fe/gherkin/loggers/event-loggers.feature`
- [ ] Step implementations `test/unit/steps/loggers/event-loggers.steps.tsx`
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes
- [ ] Fix ALL failures found — including any preexisting failures not caused by your changes

---

## Phase 4 — Workout Active Session

### 4.1 RestTimer

- [ ] Create `src/components/app/workout/rest-timer.tsx`:
  - [ ] Props: `duration: number`, `onSkip: () => void`
  - [ ] Countdown with `setInterval`; turns positive after expiry; "Skip" button;
        "Rest over — whenever you're ready" when > 0 elapsed past target
  - [ ] `setInterval` stored in `useRef`; `clearInterval` called in `useEffect` cleanup
        to prevent memory leaks on unmount
  - (See tech-docs.md §Rest Timer Logic for resolvedRest() spec and all 6 cases)

### 4.2 SetEditSheet

- [ ] Create `src/components/app/workout/set-edit-sheet.tsx`:
  - [ ] Bottom sheet; "Actual reps" number `Input`; "Actual weight" text `Input`
  - [ ] Set index display; Save / Cancel; calls `onSave({ reps, weight })`

### 4.3 SetTimerSheet

- [ ] Create `src/components/app/workout/set-timer-sheet.tsx`:
  - [ ] Full-screen overlay (fixed, `bg-background`)
  - [ ] Header: set index + exercise name + close ×
  - [ ] Center: `ProgressRing` 200/10 + mono time; ring teal → honey > 80 % → sage done
  - [ ] "Target reached!" state with checkmark
  - [ ] Start/Pause/Resume teal xl button; "Done — log Xs" outline lg (when elapsed > 0);
        Cancel ghost (before start only)

### 4.4 ActiveExerciseRow

- [ ] Create `src/components/app/workout/active-exercise-row.tsx`:
  - [ ] "Next up" ring: teal border + `ring-[3px] ring-teal/12`
  - [ ] Name + streak `Badge` (honey outline) + `InfoTip` (streak rule explanation)
  - [ ] Spec line: `fmtSpec(exercise)` in font-mono
  - [ ] Set buttons: pending = teal border + teal-wash bg; done = sage fill; scale-97 press
  - [ ] Duration: single "Log set" button → `SetTimerSheet`
  - [ ] One-off: single toggle
  - [ ] ↑↓ buttons (icon-xs secondary); hidden when first/last

### 4.5 WorkoutScreen

- [ ] Create `src/components/app/workout/workout-screen.tsx`:
  - [ ] `AppHeader`: back (→ end confirm sheet), title, elapsed timer (`useInterval`)
  - [ ] Groups with collapsible headers; exercises via `ActiveExerciseRow`
  - [ ] `RestTimer` auto-starts after each set (using `resolvedRest(exercise, settings)`)
        (see resolvedRest logic in tech-docs.md §Rest Timer Logic section)
  - [ ] "Add exercise" button (blank workout)
  - [ ] `EndWorkoutSheet`: Save & finish / Keep going / Discard
  - [ ] `SetEditSheet` overlay; `SetTimerSheet` overlay

### 4.6 FinishScreen

- [ ] Create `src/components/app/workout/finish-screen.tsx`:
  - [ ] "Nice work." display heading + "Workout complete" sub
  - [ ] 3 mono summary cards: Duration, Volume, Exercises
  - [ ] Exercise breakdown list
  - [ ] "Back to home" teal xl full-width button

### 4.7 Gherkin specs

- [ ] Create `specs/apps/organiclever/fe/gherkin/workout/workout-session.feature`
- [ ] Step implementations `test/unit/steps/workout/workout-session.steps.tsx`
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes
- [ ] Fix ALL failures found — including any preexisting failures not caused by your changes

---

## Phase 5 — Routine Management

### 5.1 ExerciseEditorRow

- [ ] Create `src/components/app/routine/exercise-editor-row.tsx` (separate file —
      matches file map; do NOT inline in `edit-routine-screen.tsx`):
  - [ ] Name `Input`; type chip row (Reps/Duration/One-off)
  - [ ] Reps mode: sets + reps + weight `Input`s + Bilateral `Toggle`
  - [ ] Duration mode: sets + target duration `Input` + countdown/countup chip row
  - [ ] Rest override chips (No rest / App default / 30/60/90 s)
  - [ ] Day streak `Badge` (read-only, honey outline, shown when > 0)
  - [ ] Delete exercise icon button (terracotta ghost)

### 5.2 EditRoutineScreen

- [ ] Create `src/components/app/routine/edit-routine-screen.tsx`:
  - [ ] `AppHeader` + name `Input` + `HuePicker`
  - [ ] Groups list: collapsible group headers; exercise rows
  - [ ] "Add exercise to [group]" button per group
  - [ ] "Add group" button
  - [ ] "Delete routine" destructive button (confirm `Dialog`; edit mode only)
  - [ ] "Save" teal full-width; calls `new OLDb().saveRoutine(r)` then `onSave()`

### 5.3 Gherkin specs

- [ ] Create `specs/apps/organiclever/fe/gherkin/routine/routine-management.feature`
- [ ] Step implementations `test/unit/steps/routine/routine-management.steps.tsx`
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes
- [ ] Fix ALL failures found — including any preexisting failures not caused by your changes

---

## Phase 6 — History Screen

### 6.1 WeeklyBarChart

- [ ] Create `src/components/app/history/weekly-bar-chart.tsx`:
  - [ ] 7 bars; heights proportional to `durationMins`; today = teal, others = teal-wash
  - [ ] Duration label above bar (10 px); dot if `sessions > 1`; day labels below

### 6.2 SessionCard

- [ ] Create `src/components/app/history/session-card.tsx`:
  - [ ] Collapsed: hued icon + name + date/time + duration/sets + chevron
  - [ ] Expanded per type (workout breakdown, reading progress, learning quality,
        meal type, focus quality, notes)
  - [ ] `Badge` variant="outline" hue for type chip

### 6.3 HistoryScreen

- [ ] Create `src/components/app/history/history-screen.tsx`:
  - [ ] "History" heading; `WeeklyBarChart`; reverse-chrono `SessionCard` list
  - [ ] Empty state: clipboard emoji + "No sessions yet."

### 6.4 Gherkin specs

- [ ] Create `specs/apps/organiclever/fe/gherkin/history/history-screen.feature`
- [ ] Step implementations `test/unit/steps/history/history-screen.steps.tsx`
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes
- [ ] Fix ALL failures found — including any preexisting failures not caused by your changes

---

## Phase 7 — Progress Screen

### 7.1 ExerciseProgressCard

- [ ] Create `src/components/app/progress/exercise-progress-card.tsx`:
  - [ ] Collapsed: exercise name + latest weight + PR `Badge`
  - [ ] Expanded: inline SVG `<polyline>` weight chart (200×80 viewBox); ★ PR markers;
        1RM stat when reps 1–10; volume stat

### 7.2 ProgressScreen

- [ ] Create `src/components/app/progress/progress-screen.tsx`:
  - [ ] "Analytics" heading + `InfoTip`
  - [ ] Module pill tabs; range picker; group-by toggle (workout)
  - [ ] Workout: `ExerciseProgressCard` list; empty state
  - [ ] Other modules: daily activity bar chart + total stat; empty state per module

### 7.3 Gherkin specs

- [ ] Create `specs/apps/organiclever/fe/gherkin/progress/progress-screen.feature`
- [ ] Step implementations `test/unit/steps/progress/progress-screen.steps.tsx`
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes
- [ ] Fix ALL failures found — including any preexisting failures not caused by your changes

---

## Phase 8 — Settings Screen

### 8.1 SettingsScreen

- [ ] Create `src/components/app/settings/settings-screen.tsx`:
  - [ ] Avatar card (56×56 circle initial); name + "OrganicLever · local"
  - [ ] Profile: name `Input` (auto-saves on `onChange`)
  - [ ] Workout defaults: rest chip row + `InfoTip`
  - [ ] Language: EN/ID buttons (reload on switch)
  - [ ] Appearance: dark mode `Toggle`
  - [ ] Data: `Alert` variant="info" about localStorage
  - [ ] "Saved" toast (1.5 s fade-out) — `useState` + `setTimeout`

### 8.2 Gherkin specs

- [ ] Create `specs/apps/organiclever/fe/gherkin/settings/settings-screen.feature`
- [ ] Step implementations `test/unit/steps/settings/settings-screen.steps.tsx`
- [ ] Create `specs/apps/organiclever/fe/gherkin/settings/dark-mode.feature`
- [ ] Create `specs/apps/organiclever/fe/gherkin/settings/language.feature`
- [ ] Step implementations for dark-mode: `test/unit/steps/settings/dark-mode.steps.tsx`
- [ ] Step implementations for language: `test/unit/steps/settings/language.steps.tsx`
- [ ] `nx affected -t typecheck lint test:quick spec-coverage` passes
- [ ] Fix ALL failures found — including any preexisting failures not caused by your changes

---

## Phase 9 — PWA, Polish, A11y, Coverage Gate

### 9.1 PWA manifest

- [ ] Create `apps/organiclever-web/public/manifest.json`:
      `name`, `short_name`, `start_url: "/app"`, `display: "standalone"`,
      `background_color: "#f7f5f0"`, `theme_color` (teal hex approx), icons array
      (192×192 PNG + 512×512 PNG as primary; SVG also acceptable for modern browsers
      but PNG is required for full iOS Safari PWA home-screen icon support)
- [ ] Generate PNG fallbacks: 192×192 and 512×512 PNG from the SVG logo mark (use
      sharp or imagemagick in a one-off script, or hand-create). iOS Safari requires
      PNG for home screen icon.
- [ ] Add `<link rel="manifest" href="/manifest.json">` in `src/app/layout.tsx`
- [ ] Add `<meta name="apple-mobile-web-app-capable" content="yes">` in layout

### 9.2 Dark mode verification (all screens)

- [ ] Set `data-theme="dark"` on `<html>` manually; visually check:
  - [ ] Home, History, Progress, Settings
  - [ ] Workout screen + set timer
  - [ ] All logger sheets
  - [ ] Edit routine screen

### 9.3 Accessibility

- [ ] All icon-only buttons have `aria-label`
- [ ] All form inputs paired with `<Label>` via `htmlFor`/`id`
- [ ] Focus ring visible on keyboard nav (covered by existing globals)
- [ ] Touch targets ≥ 44 px verified on interactive elements

### 9.4 Responsive verification (manual)

- [ ] All screens at 375 px (TabBar, no SideNav)
- [ ] All screens at 1280 px (SideNav, 480 px card)

### 9.5 i18n verification

- [ ] All visible strings in every screen use `t()` — no hardcoded English outside
      seed data
- [ ] Switch to Bahasa Indonesia: all tabs, headings, labels in Indonesian

### 9.6 README update

- [ ] Update `apps/organiclever-web/README.md` to reflect full app routes and screens

### 9.7 Final quality gate

- [ ] `nx affected -t typecheck` passes
- [ ] `nx affected -t lint` passes
- [ ] `nx affected -t test:quick` passes (≥ 70 %, clean non-cached run)
- [ ] `nx affected -t spec-coverage` passes
- [ ] `nx run organiclever-web-e2e:test:e2e` passes
- [ ] Fix ALL failures found — including any preexisting failures not caused by your changes

### 9.8 Manual UI Verification (Playwright MCP)

- [ ] Start dev server: `nx dev organiclever-web`
- [ ] Navigate to app home: `browser_navigate` to `http://localhost:3200/#/app`
- [ ] Verify home screen: `browser_snapshot` — confirm "Last 7 days" strip visible,
      seed data shows, tab bar visible at bottom
- [ ] Verify no JS errors: `browser_console_messages` — must be zero errors
- [ ] Tap FAB: `browser_click` on FAB center button → `browser_snapshot` confirms
      AddEventSheet slides up with Workout, Reading, Learning, Meal, Focus rows
- [ ] Log a reading event: `browser_click` "Reading" → `browser_fill_form` title
      "Test Book" → `browser_click` "Save" → `browser_snapshot` confirms sheet closes
      and event appears in Home timeline
- [ ] Navigate to History: `browser_click` "History" tab → `browser_snapshot` confirms
      "History" heading, weekly bar chart, session card for logged reading event
- [ ] Navigate to Progress: `browser_click` "Progress" tab → `browser_snapshot` confirms
      "Analytics" heading, module tabs visible
- [ ] Navigate to Settings: `browser_click` "Settings" tab → `browser_snapshot` confirms
      "Settings" heading, name input, dark mode toggle
- [ ] Toggle dark mode: `browser_click` dark mode toggle → `browser_snapshot` confirms
      `data-theme="dark"` on html; toggle back to light
- [ ] Reload and verify persistence: `browser_navigate` to `http://localhost:3200/#/app`
      → `browser_snapshot` confirms all previously logged data still present
- [ ] Verify mobile width: `browser_resize({ width: 375, height: 812 })` — verify
      TabBar visible, no SideNav; `browser_snapshot` to confirm
- [ ] Verify desktop width: `browser_resize({ width: 1280, height: 800 })` — verify
      SideNav visible, content pane centered; `browser_snapshot` to confirm
- [ ] Take final screenshot: `browser_take_screenshot` for visual record
- [ ] WorkoutScreen verification:
  - [ ] Tap FAB: `browser_click` FAB → `browser_click` "Workout" on AddEventSheet
  - [ ] `browser_snapshot` — confirm WorkoutScreen: exercise rows, elapsed timer,
        group headers, "Finish workout" button visible
  - [ ] Tap a set button on the first exercise: `browser_click` on first set button
  - [ ] `browser_snapshot` — confirm set button updates to done state (sage fill)
        and RestTimer appears
- [ ] FinishScreen verification:
  - [ ] Complete all sets and tap "Finish workout": `browser_click` "Finish workout"
        → `browser_click` "Save & finish" on EndWorkoutSheet confirm dialog
  - [ ] `browser_snapshot` — confirm FinishScreen: "Nice work." heading,
        "Workout complete" sub, 3 mono summary cards (Duration, Volume, Exercises),
        "Back to home" button visible
- [ ] EditRoutineScreen verification:
  - [ ] Navigate back to Home: `browser_click` "Back to home"
  - [ ] Tap Settings tab: `browser_click` "Settings" tab
  - [ ] Navigate back to Home tab: `browser_click` "Home" tab
  - [ ] Tap edit pencil on a RoutineCard: `browser_click` edit pencil on first
        RoutineCard
  - [ ] `browser_snapshot` — confirm EditRoutineScreen: name Input, HuePicker,
        exercise editor rows with type chip rows, "Save" button visible
- [ ] Golden path complete: navigate to `/#/app` → log a workout session → tap
      "Finish workout" → confirm save → view History → session card visible → view
      Progress → reload → data persists, dark mode state persists

### 9.9 Post-Push CI/CD Verification

- [ ] Push directly to `main`: `git push origin main`
- [ ] Monitor GitHub Actions workflows for the push
- [ ] Verify all CI checks pass (typecheck, lint, test:quick, spec-coverage, e2e)
- [ ] If any CI check fails, fix immediately and push a follow-up commit to `main`
- [ ] Do NOT proceed to archival until CI is green

### Plan Archival

- [ ] Verify ALL delivery checklist items above are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Optionally update folder date to completion date in the `plans/done/` path
      (e.g. `2026-04-25__organiclever-web-app` → `2026-MM-DD__organiclever-web-app`
      where `MM-DD` is the actual completion date). Retaining the creation date is also
      acceptable — document the choice in the commit message.
- [ ] Move plan folder:
      `git mv plans/in-progress/2026-04-25__organiclever-web-app plans/done/2026-04-25__organiclever-web-app`
- [ ] Remove this plan's entry from `plans/in-progress/README.md`
- [ ] Add this plan to `plans/done/README.md` with completion date
- [ ] Commit: `chore(plans): move organiclever-web-app to done`
