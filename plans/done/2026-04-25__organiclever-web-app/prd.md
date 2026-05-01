# Product Requirements Document

## Product Overview

`organiclever-web` is a local-first life-event tracker that runs entirely in the browser
on PGlite (Postgres-WASM over IndexedDB) wrapped in Effect.ts — both shipped by the
gear-up plan. Users log workouts (with routines, rest timers, and personal records),
quick events (reading, learning, meal, focus sessions), and custom event types — all
without accounts or a server. The app is accessible at `/app` as a hash-routed
single-page application embedded within the OrganicLever Next.js site (the `/app`
route already exists from the gear-up — this plan replaces its provisional body with
the full app shell). It ships with seed data so the first launch shows a populated,
usable state. The v0 scope covers seven distinct screens (Home, History, Progress,
Settings, Workout, Finish, EditRoutine) plus five event loggers and a bilingual
(EN/ID) UI.

## Personas

- **Solo maintainer (product owner hat)**: defines what the app should do and approves
  delivery. Also the primary user of the shipped product.
- **Solo maintainer (developer hat)**: implements all phases using the delivery checklist
  and tech-docs.
- **`plan-executor` agent**: runs delivery checklist items step-by-step.
- **`plan-execution-checker` agent**: validates that all acceptance criteria are met after
  execution.
- **`swe-typescript-dev` agent**: assists with TypeScript and React implementation.
- **`swe-e2e-dev` agent**: assists with Playwright spec authoring and debugging.

## User Stories

1. As a user, I want to log a workout session from a routine template so that I can track
   my sets, reps, and rest periods without paper notes.
2. As a user, I want to log a quick event (reading, focus, meal) so that I have a complete
   picture of my productive day beyond just workouts.
3. As a user, I want to view my history of all logged sessions so that I can see what I
   have done and how consistently I am working out.
4. As a user, I want to see exercise progress charts so that I can identify strength
   improvements and personal records over time.
5. As a user, I want my data to persist across browser sessions so that I never lose my
   history by accidentally closing a tab.
6. As a user, I want to switch the UI to Bahasa Indonesia so that the app feels native
   to my primary language.
7. As a user, I want to toggle dark mode so that the app is comfortable to use at night.
8. As a user, I want to create and edit workout routines so that I can customize my
   training plan without re-entering exercise details every session.

## Product Scope

### In Scope

- `/app` hash-routed SPA within the existing Next.js site
- Home screen with week rhythm strip, module filter chips, and recent event timeline
- Workout screen with active exercise rows, set logging, rest timer, and finish flow
- History screen with weekly bar chart and expandable session cards
- Progress screen with per-module analytics and SVG exercise progress charts
- Settings screen with name, rest defaults, language toggle, and dark mode
- EditRoutine screen with group/exercise CRUD
- Five quick-log event types: Reading, Learning, Meal, Focus, Custom
- Bilingual support: English and Bahasa Indonesia
- PGlite persistence (gear-up's `dataDir` `ol_journal_v1`, IndexedDB key
  `/pglite/ol_journal_v1`) extended via this plan's v2 migration; seed data
  applied on first launch when both `journal_entries` and `routines` tables are empty
- PWA manifest for home-screen installation

### Out of Scope

- Cloud / PWA sync (gear-up's Forward-Compatibility section reserves the
  necessary columns; this plan does not enable the sync layer)
- Re-implementing the storage layer (`lib/journal/journal-store.ts`,
  `runtime.ts`, `errors.ts`, `schema.ts`) — these belong to the gear-up; this
  plan extends, never replaces
- Authentication, accounts, or user profiles beyond the local name field
- Push notifications or local notifications
- Native iOS or Android packaging
- Custom event-type definition UI (logging custom types works; defining new type names
  from a UI is a future plan)
- Data export or import
- ts-ui component additions (already shipped by `plans/done/2026-04-25__organiclever-web-landing-uikit/`)

## Product Risks

| Risk                                            | Mitigation                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| Complex workout flow cognitive load             | Seed data populated on first load so UI is never empty; progressive disclosure          |
| Empty-state confusion without seed              | Seed applied automatically on first visit; clearly visible data immediately             |
| Hash routing conflicting with Next.js hydration | `'use client'` + `force-dynamic` on `/app/page.tsx`; no `next/navigation` used          |
| Icon name gaps in ts-ui                         | Use `calendar` icon for Reading per tech-docs icon assignment table; no Phase 3 blocker |
| Coverage threshold not met at 70 %              | Gherkin step files and DB unit tests scaffolded in every phase                          |
| Prerequisite `landing-uikit` plan not ready     | Delivery checklist explicitly gates Phase 3+ on `Textarea` + `Badge` export             |

## Screen Inventory

### App Shell (`/app`)

- Hash router: `#/app` → app; anything else → landing page
- Mobile (< 768 px): full-width content pane + sticky `TabBar` (64 px) at bottom
- Desktop (≥ 768 px): `SideNav` (220 px) at left + content pane centered 480 px max,
  card shadow, sticky top; desktop radial gradient behind pane
- Dark mode: `data-theme="dark"` on `<html>`; persisted in DB settings

### TabBar (mobile)

Four navigation tabs + 1 center FAB: Home · Progress · **+ FAB** (center, 52×52 teal
rounded-[16px]) · History · Settings. Active tab: `--hue-teal`. Height 64 px +
`env(safe-area-inset-bottom)`. FAB opens `AddEntrySheet`.

#### Tab Icon Mapping

```text
Home tab:     icon="home"
Progress tab: icon="trend"
History tab:  icon="history"
Settings tab: icon="settings"
FAB:          icon="plus"
```

### SideNav (desktop)

220 px. OrganicLever logo section (teal zap icon + name + "Life event tracker" sub). "Log event"
teal full-width button. Four nav items: Home / History / Progress / Settings. Active item:
teal-wash background + teal-ink text.

### Home Screen

- Header: day-of-week + date (small caps); user name (24 px extrabold); dark-mode moon/sun
  icon button (40×40); settings user icon button (40×40)
- Week card (card + border, 18 px radius): "Last 7 days" label; mono event count + "event(s)
  logged"; `WeekRhythmStrip` (7 stacked mini-bars); `InfoTip`
- Workout templates panel (visible when routines exist AND recent workout in last 30 d):
  "Workout templates" label + `InfoTip` + "New" outline button; up to 3 `RoutineCard`s;
  "+N more" if > 3
- Module filter chips (horizontal scroll): All · Workout · Reading · Learning · Meal · Focus
  - Workout chip active → `WorkoutModuleView` (4 `StatCard`s + volume card + full template
    list)
  - Other chip active → `GenericModuleView` (filtered event list or empty state)
  - All → recent events timeline
- Recent events: date-group headings + `EntryItem` rows; `EntryDetailSheet` on tap;
  infinite scroll (+10 per `IntersectionObserver` trigger); clipboard empty state

### WorkoutModuleView

Four `StatCard`s (2-col grid): Sessions/7d (teal dumbbell), Streak/wks (terracotta flame),
Time moved/min (honey clock), Sets done/sets (sage zap). Volume card: plum trend icon + mono
kg value + 5 range buttons (7d/30d/3m/6m/1y). Full template list.

### AddEntrySheet

Bottom sheet. Rows: Workout (teal, starts blank), Reading (plum), Learning (honey), Meal
(terracotta), Focus (sky), any saved custom types (sage), "New custom type" (dashed). Close
on backdrop tap.

### Event Loggers (bottom sheets)

All share `LoggerShell`: drag handle + hued icon + title + close × + scrollable body + sticky
footer (Cancel + Save). Save disabled until required fields filled.

| Logger   | Required          | Optional                                                                                |
| -------- | ----------------- | --------------------------------------------------------------------------------------- |
| Reading  | Title             | Author, Pages, Duration (min), Completion % chips (10/25/50/75/100), Notes              |
| Learning | Subject           | Source, Duration (min), Quality 1–5 emoji row, Notes                                    |
| Meal     | Name              | Meal type chips (Breakfast/Lunch/Dinner/Snack/Drink), Energy 1–5 emoji row, Notes       |
| Focus    | Task OR Duration  | Duration preset chips (15/25/45/60/90/120 min) + custom input, Quality 1–5 emoji, Notes |
| Custom   | Name + hue + icon | Duration (min), Notes                                                                   |

### EntryDetailSheet

Full-detail bottom sheet (up to 80 vh, scrollable). 44×44 icon + name + date/time + close ×.
2-col stat grid. Reading: progress bar. Workout: exercise breakdown list. Notes block. Label
chips. Closes on backdrop tap.

### WorkoutScreen

- `AppHeader`: back (triggers end-workout confirm), routine name or "Quick workout", elapsed
  ticker (HH:MM:SS or MM:SS)
- Scrollable list of groups with collapsible group-name headers
- `ActiveExerciseRow` per exercise:
  - Name + day-streak `Badge` (honey outline) + `InfoTip`
  - Done/target set counter (sage when complete)
  - Spec line: mono font, "3 × 20 LR @ 8 kg" or timer icon for duration
  - Set buttons: teal border = pending; sage fill = done. Tap toggles. Tap done set → `SetEditSheet`
  - Duration exercise: "Log set" → `SetTimerSheet`
  - One-off: single toggle button
  - ↑↓ reorder buttons (hidden when first/last in group)
  - "Next up" card: teal ring + teal border glow
- Rest timer strip (below completed set): countdown; "Skip" button; turns positive after expiry
  with "Rest over — whenever you're ready" message
- "Add exercise" button (blank workout mode)
- "Finish workout" sticky button → `EndWorkoutSheet`:
  - "Save & finish" (saves to DB, goes to FinishScreen)
  - "Keep going" (dismisses)
  - "Discard" (drops session, back to Home)

### SetEditSheet

Modal sheet. "Actual reps" number input. "Actual weight" text input. Done-set index display.
Save / Cancel.

### SetTimerSheet

Full-screen overlay. `ProgressRing` 200 px / 10 px stroke. Mono elapsed or countdown time
(48 px). Target display. Color: teal → honey when > 80 % elapsed → sage on finish. "Target
reached!" state. Start / Pause / Resume (teal xl button). "Done — log Xs" secondary (outline).
Cancel ghost button (only before starting). On done: calls `onComplete({ duration })`.

### FinishScreen

"Nice work." (900 weight display) + "Workout complete" sub. Three mono summary cards:
Duration, Volume (kg), Exercises. Exercise breakdown list (done/target sets per exercise).
"Back to home" teal full-width button.

### EditRoutineScreen

- `AppHeader` "New routine" or "Edit routine" + back
- Name `Input` + `HuePicker` (6 hues; selected hue rings the swatch)
- Groups (collapsible): group name input; exercise list
- Per exercise (`ExerciseEditorRow`):
  - Name input
  - Type toggle: Reps / Duration / One-off (3-button row)
  - Reps mode: Sets + Reps + Weight inputs + Bilateral `Toggle`
  - Duration mode: Sets + Target duration (sec) + Timer mode (Countdown/Countup) toggle
  - Per-exercise rest override: No rest / App default / 30 / 60 / 90 s (chip row)
  - Day streak (read-only `Badge`)
  - Delete exercise icon button
- "Add exercise to [group]" button
- "Add group" button
- "Delete routine" destructive button (confirm modal; only in edit mode)
- "Save" teal full-width button

### HistoryScreen

- "History" heading
- `WeeklyBarChart`: 7-bar weekly workout chart (teal fill today, teal-wash others; height
  proportional to duration; minute label above bar; dot if > 1 session; day labels)
- Reverse-chronological `SessionCard` list (all event types):
  - Collapsed: type icon + name + date/time + duration/sets + expand chevron
  - Expanded workout: exercise breakdown (done/target sets)
  - Expanded reading: progress bar + pages + author
  - Expanded learning: quality ⭐ display
  - Expanded meal: meal type + energy ⚡ display
  - Expanded focus: quality 🧠 display
  - All: notes block if present
- Empty state: clipboard + "No sessions yet."

### ProgressScreen

- "Analytics" heading + `InfoTip` (1RM formula note)
- Module tabs: Workout / Reading / Learning / Meal / Focus (hued pill tabs)
- Range picker: 7d / 30d / 3m / 6m / 1y
- **Workout** (group-by toggle: exercise / routine):
  - `ExerciseProgressCard` per exercise: collapsed header (name + latest weight);
    expanded: SVG weight-over-time line chart (polyline, 200×80 viewBox); ★ PR markers;
    1RM estimate (Brzycki, 1–10 reps only); volume stat
  - Empty state when no data
- **Other modules**: event count by day bar chart + total duration stat
- Empty state per module

### SettingsScreen

- "Settings" heading
- Avatar card: 56×56 circle (foreground bg, card text, first-letter initial 800);
  name + "OrganicLever · local"
- Profile section: name `Input` (saves on change)
- Workout defaults: rest time chip row (= reps/dur, = 2× reps/dur, No rest, 30 s, 60 s, 90 s)
  - `InfoTip`
- Language: English / Bahasa Indonesia (page reloads on switch)
- Appearance: dark mode `Toggle`
- Data: "Stored locally" `Alert` variant info — "clearing browser storage will erase all data"
- "Saved" toast (15 px honey-ink, fades out after 1.5 s)

---

## Gherkin Acceptance Criteria

### App navigation

```gherkin
Feature: App tab navigation

  Background:
    Given I navigate to "/app"

  Scenario: Home tab active by default
    Then the "Home" tab is active
    And I see text "Last 7 days"

  Scenario: Navigate to History
    When I tap the "History" tab
    Then I see heading "History"

  Scenario: Navigate to Progress
    When I tap the "Progress" tab
    Then I see heading "Analytics"

  Scenario: Navigate to Settings
    When I tap the "Settings" tab
    Then I see heading "Settings"

  Scenario: FAB opens AddEntrySheet
    When I tap the FAB
    Then I see the add-event sheet
    And I see row "Workout"
    And I see row "Reading"
```

### Home screen

```gherkin
Feature: Home screen

  Background:
    Given I navigate to "/app"

  Scenario: Week rhythm strip visible
    Then I see a section "Last 7 days"

  Scenario: Module chips visible
    Then I see a chip "All"
    And I see a chip "Workout"
    And I see a chip "Reading"

  Scenario: Empty state when no events
    Given no events are logged
    Then I see text "Your life log is empty"

  Scenario: Events appear after logging
    Given I log a reading event titled "Dune"
    When I return to Home
    Then I see text "Dune" in the recent events list
```

### Workout session

```gherkin
Feature: Workout logging

  Background:
    Given I navigate to "/app"
    And I tap the FAB
    And I tap "Workout"

  Scenario: Blank workout starts
    Then I see the workout screen
    And I see a button "Add exercise"

  Scenario: Add exercise and complete a set
    When I add an exercise "Push-up" reps mode 3 sets 10 reps
    And I tap set 1 button for "Push-up"
    Then set 1 shows as completed

  Scenario: Rest timer starts after set
    Given default rest is 60 seconds
    When I complete a set
    Then a rest countdown starts from 60

  Scenario: Finish saves to history
    Given I have completed 1+ sets
    When I tap "Finish workout" and confirm save
    Then I see the finish screen
    And navigating to History shows the session

  Scenario: Discard does not save
    When I tap "Finish workout" and choose "Discard"
    Then I return to Home
    And no new session appears in History
```

### Event loggers

```gherkin
Feature: Event loggers

  Background:
    Given I navigate to "/app"

  Scenario: Log reading session
    Given I tap the FAB and tap "Reading"
    When I enter "Thinking Fast and Slow" in title
    And I tap "Save"
    Then the sheet closes
    And Home shows a reading event "Thinking Fast and Slow"

  Scenario: Reading save blocked without title
    Given I tap the FAB and tap "Reading"
    Then the Save button is disabled

  Scenario: Log focus session with preset duration
    Given I tap the FAB and tap "Focus"
    When I tap duration preset "25"
    And I enter "Writing" in task
    And I tap "Save"
    Then Home shows a focus event "Writing"
```

### History screen

```gherkin
Feature: History screen

  Background:
    Given I navigate to "/app"
    And I tap the "History" tab

  Scenario: History heading visible
    Then I see heading "History"

  Scenario: Weekly bar chart visible
    Then I see a weekly bar chart with 7 bars

  Scenario: Empty state when no sessions
    Given no events are logged
    Then I see text "No sessions yet."

  Scenario: Session card appears after workout
    Given I have logged a workout session
    Then I see a session card in the list

  Scenario: Session card expands to show workout breakdown
    Given at least one workout session exists
    When I tap the session card expand chevron
    Then I see exercise breakdown rows inside the card
```

### Progress screen

```gherkin
Feature: Progress screen

  Background:
    Given I navigate to "/app"
    And I tap the "Progress" tab

  Scenario: Analytics heading visible
    Then I see heading "Analytics"

  Scenario: Module tabs visible
    Then I see tabs "Workout", "Reading", "Learning", "Meal", "Focus"

  Scenario: Workout empty state when no data
    Given no events are logged
    When I tap the "Workout" module tab
    Then I see an empty state for workout analytics

  Scenario: Exercise progress card appears after workout
    Given I have logged at least one set for exercise "Push-up"
    When I tap the "Workout" module tab
    Then I see an exercise card for "Push-up"

  Scenario: Group by routine toggle
    Given workout data exists grouped by routines
    When I tap "Group by Routine"
    Then exercises are grouped by routine name in the progress view
```

### Routine management

```gherkin
Feature: Routine management

  Background:
    Given I navigate to "/app"

  Scenario: Create a new routine
    Given I tap the FAB and tap "Workout"
    When I tap "Add exercise" on the blank workout screen
    Then I see the exercise editor

  Scenario: New routine saved and visible
    Given I navigate to the edit routine screen
    And I enter routine name "Morning Flow"
    And I add an exercise "Squat" with reps mode
    When I tap "Save"
    Then I return to home
    And I see routine card "Morning Flow"

  Scenario: Delete routine removes it from list
    Given a routine "Morning Flow" exists
    When I open the edit routine screen for "Morning Flow"
    And I tap "Delete routine" and confirm
    Then the routine "Morning Flow" no longer appears on Home
```

### Dark mode

```gherkin
Feature: Dark mode

  Scenario: Toggle from home header
    Given I navigate to "/app"
    When I tap the moon icon
    Then html has attribute data-theme "dark"

  Scenario: Persists across reload
    Given dark mode is active
    When I reload the page
    Then html still has attribute data-theme "dark"
```

### Language

```gherkin
Feature: Language toggle

  Scenario: Switch to Bahasa Indonesia
    Given I navigate to settings
    When I tap "Bahasa"
    Then the page reloads
    And the bottom tab shows "Beranda"

  Scenario: Switch back to English
    Given language is set to Bahasa
    When I navigate to settings and tap "English"
    Then the bottom tab shows "Home"
```

### Settings

```gherkin
Feature: Settings screen

  Background:
    Given I navigate to "/app"
    And I tap the "Settings" tab

  Scenario: Name change persists
    When I change the name to "Wahid"
    And I reload the page
    Then the home header shows "Wahid"

  Scenario: Rest time saved
    When I tap rest time "30s"
    Then the rest timer defaults to 30 seconds in next workout
```

### Data persistence

```gherkin
Feature: Data persistence across browser sessions

  Background:
    Given I navigate to "/app"

  Scenario: Events survive a hard page reload
    Given I log a reading event titled "Atomic Habits"
    When I reload the page
    Then I navigate to "/app"
    And I see text "Atomic Habits" in the recent events list

  Scenario: Dark mode preference survives a hard page reload
    Given dark mode is active
    When I reload the page
    Then html still has attribute data-theme "dark"
```
