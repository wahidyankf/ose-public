# Raw Design Files — App Feature Implementation

Source: Claude Design handoff bundle exported from `https://api.anthropic.com/v1/design/h/JJ1lz9FxESB1EHhRZmkZIA`.

These are the original prototype files. Use them as pixel-accurate implementation references.
Do **not** copy the prototype's internal structure — recreate visual output in Next.js/TypeScript.

## Files

| File                    | What it contains                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors_and_type.css`   | Full design token system (same file as in landing-uikit raw/)                                                                                               |
| `App.jsx`               | Root shell: tab state, screen stack, responsive layout, desktop SideNav, mobile TabBar, AddEventSheet wiring, all logger mounts                             |
| `db.js`                 | localStorage data layer (`ol_db_v12`), full `OLDb` class, seed data (3 routines + 6 events), all computed queries                                           |
| `i18n.js`               | `TRANSLATIONS` object — `en` + `id` keys for all UI strings                                                                                                 |
| `Icon.jsx`              | All icon SVGs by name — authoritative source for `IconName` union values                                                                                    |
| `Components.jsx`        | Shared UI components: `TabBar`, `SideNav`, `StatCard`, `AppHeader`, `HuePicker`, `Toggle`, `ProgressRing`, `Sheet`, `InfoTip`, `AddEventSheet`, `TextInput` |
| `HomeScreen.jsx`        | Home: week stats card, `WeekRhythmStrip`, module filter chips, `WorkoutModuleView`, event timeline, `EventDetailSheet`                                      |
| `WorkoutScreen.jsx`     | Active workout: exercise rows, set buttons, rest timer, elapsed ticker, `SetEditSheet`, `SetTimerSheet`, `EndWorkoutSheet`                                  |
| `FinishScreen.jsx`      | Post-workout summary screen                                                                                                                                 |
| `EditRoutineScreen.jsx` | Routine CRUD: groups, exercises, hue picker, type/bilateral/rest toggles                                                                                    |
| `HistoryScreen.jsx`     | History: weekly bar chart, `SessionCard` list                                                                                                               |
| `ProgressScreen.jsx`    | Analytics: module tabs, range picker, exercise progress SVG charts, 1RM                                                                                     |
| `SettingsScreen.jsx`    | Profile, rest defaults (6 options), language toggle, dark mode, data info                                                                                   |
| `EventLoggers.jsx`      | `ReadingLogger`, `LearningLogger`, `MealLogger`, `FocusLogger` bottom sheets                                                                                |
| `CustomEvents.jsx`      | `CustomEventLogger` — custom event type creation + logging                                                                                                  |

## Key design decisions confirmed from source

- **Seed profile**: `{ name: 'Yoka', restSeconds: 60, darkMode: false }` — no `lang` in seed; code must default to `'en'` when absent
- **Seed routines**: 3 routines — "Kettlebell day" (teal), "Calisthenics" (honey), "Super Exercise" (plum, featured)
- **`RestSeconds` options**: `['reps', 'reps2', 0, 30, 60, 90]` — all 6 confirmed in `SettingsScreen.jsx` line 62
  - `'reps'` displays as `"= reps/duration"`, `'reps2'` as `"= 2× reps/duration"`, `0` as `"No rest"`
- **ExerciseTemplate `type` field**: exercises in seed may omit `type`; default to `'reps'` when absent
- **`ExerciseTemplate.weight`** in seed uses `weight` (not `targetWeight`) — plan uses `targetWeight`; the prototype's field names differ, implement per plan TypeScript types
- **Tab persistence**: `localStorage.getItem('ol_tab')` key, not part of `ol_db_v12`
- **`lang` default**: `settings.lang===code || (code==='en' && !settings.lang)` — English active when lang unset
- **SideNav sub-text**: `"Life event tracker"` below the brand name
- **Desktop layout**: content pane `maxWidth: 480`, `sticky`, `top: 0`, `overflow: hidden`; `radial-gradient(ellipse at top, var(--warm-100), transparent 70%)` background when on main screen
- **`refreshKey` pattern**: increment to force DB re-reads in all children without prop drilling
- **RestTimer cleanup**: `clearInterval(timerRef.current)` in `useEffect` return — prevent stale countdowns
