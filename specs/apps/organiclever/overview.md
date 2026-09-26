# OrganicLever — Product Overview

**Audience:** Engineers, Technical Product/Project Managers

OrganicLever is a local-first life journal that helps you log what you do — workouts,
reading, learning, meals, focus sessions — and see your progress over time. Everything
stays on your device: no account, no server, no sync. The browser is the database.

## Who it is for

| Persona                    | Need                                            |
| -------------------------- | ----------------------------------------------- |
| **The consistent trainer** | Wants to log workout sets without a bulky app   |
| **The curious learner**    | Tracks reading pages and learning topics weekly |
| **The self-optimizer**     | Reviews a week of data to spot what worked      |

The initial focus is on the consistent trainer. Workout logging is the deepest feature
shipped today; all other entry types (reading, learning, meal, focus) follow the same
append-and-bump pattern but with lighter UIs.

## Ships today

OrganicLever delivers one closed loop today:

1. **Build a routine** — name a workout template, add exercise groups with default sets /
   reps / weight.
2. **Start a session** — pick a routine, log sets one at a time as you go, rest timer
   counts down automatically.
3. **Review your history** — see every logged entry in reverse-chronological order with
   relative timestamps ("3h ago").
4. **Track your streak** — a weekly streak badge appears on the home screen once you hit
   two workouts in a week.

## Deferred

OrganicLever is rolling-release on `main` — items below ship when ready, no version cut.

- **Authentication and accounts** — all data is local; no login flow ships today.
- **Cloud sync** — no server writes; PGlite (Postgres-WASM, IndexedDB-backed) is the
  only storage.
- **Social or sharing features** — private log only.
- **Weight/length unit settings** — kg only today; `lb`/`in` support is placeholdered.
- **Data export and reset** — UI stubs exist in Settings; backend not yet implemented.
- **Progress charts** — the `/app/progress` screen exists but chart data is still
  placeholder.

## Primary user flows

The two flows a user runs most often today:

**Flow A — Log a workout (5–15 min)**

```mermaid
%% Color palette: Blue #0173B2 (screen), Teal #029E73 (action)
graph TD
    accTitle: Primary user flows
    accDescr: Home screen leads to FAB; FAB leads to pick Workout; pick Workout leads to pick Routine; pick Routine leads to Workout screen log sets, rest timer; and 4 more links.
    HOME["Home screen"]:::screen
    FAB["FAB"]:::action
    PICK_W["pick Workout"]:::action
    PICK_R["pick Routine"]:::action
    WORK["Workout screen<br/>log sets, rest timer"]:::screen
    DONE["End Workout"]:::action
    CONF["Confirm"]:::action
    FIN["Finish screen"]:::screen
    HOME2["Home"]:::screen

    HOME --> FAB
    FAB --> PICK_W
    PICK_W --> PICK_R
    PICK_R --> WORK
    WORK --> DONE
    DONE --> CONF
    CONF --> FIN
    FIN --> HOME2

    classDef screen fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef action fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Flow B — Check recent activity (< 1 min)**

```mermaid
%% Color palette: Blue #0173B2 (screen), Teal #029E73 (action)
graph TD
    accTitle: Primary user flows 2
    accDescr: Home screen leads to recent entry list bump entry to resurface; Home screen leads to History tab; History tab leads to filter by type.
    HOME["Home screen"]:::screen
    RECENT["recent entry list<br/>bump entry to<br/>resurface"]:::action
    HIST["History tab"]:::screen
    FILTER["filter by type"]:::action

    HOME --> RECENT
    HOME --> HIST
    HIST --> FILTER

    classDef screen fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef action fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## In plain language

- You log what you did. It remembers. You see it later.
- No account. No subscription. No data leaves your phone.
- The streak badge is the only "game mechanic" today.

## Related

- [App client architecture](./app-web/architecture.md) — how OrganicLever fits into the
  broader technical landscape
- [Backend architecture](./be/architecture.md) — web app + backend health diagnostic
- [Behaviour specs](./app-web/behaviours/README.md) — Gherkin acceptance criteria per
  feature context
