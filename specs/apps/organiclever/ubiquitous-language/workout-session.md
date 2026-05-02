# Ubiquitous Language — workout-session

**Bounded context**: `workout-session`
**Maintainer**: organiclever-web team
**Last reviewed**: 2026-05-02

## One-line summary

In-progress workout state machine: lifts a `Routine` template into an active `WorkoutSession`, tracks set-by-set progress, and persists the outcome through the journal context as a `WorkoutPayload` `JournalEvent`.

## Terms

| Term              | Definition                                                                                                                     | Code identifier(s)                                              | Used in features                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------- |
| `WorkoutSession`  | The aggregate modelling one in-progress workout. Owns transitions `idle → active → finished` and the per-set log.              | `WorkoutSession` (TS type), `workoutSessionMachine` (xstate v5) | `workout-session/*.feature`              |
| `Start`           | Transition `idle → active`. Loads a `Routine` and seeds the per-set log.                                                       | `start` (machine event)                                         | `workout-session/*.feature`              |
| `Finish`          | Transition `active → finished`. Triggers `saveWorkout` (cross-context call into `journal/application/index.ts`).               | `finish` (machine event)                                        | `workout-session/*.feature`              |
| `Workout outcome` | The data captured at finish — sets completed, reps, weights, duration. Encoded as `WorkoutPayload` and written to the journal. | `WorkoutPayload` (TS type)                                      | `workout-session/*.feature`, `journal/*` |
| `Set log`         | The list of completed sets within an active `WorkoutSession`, one entry per set.                                               | `WorkoutSession.setLog`                                         | `workout-session/*.feature`              |
| `Workout screen`  | The route `/app/workout` that renders the active session UI.                                                                   | (route segment) `workout`                                       | `workout-session/*.feature`              |
| `Finish screen`   | The route `/app/workout/finish` showing the post-session summary.                                                              | (route segment) `workout/finish`                                | `workout-session/*.feature`              |

## Forbidden synonyms

- "Routine" — used by `routine` to mean the template. Inside `workout-session`, prefer "workout session" or "session".
- "Entry" — used by `journal` for a generic event. Inside `workout-session`, prefer "set" (per-set log entry) or "outcome" (the persisted record).
- "Plan" — not a domain term. Use "session" for the active flow, "routine" only when explicitly referencing the template the session was lifted from.
