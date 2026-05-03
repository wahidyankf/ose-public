# Ubiquitous Language — journal

**Bounded context**: `journal`
**Maintainer**: organiclever-web team
**Last reviewed**: 2026-05-02

## One-line summary

Append-only event log (PGlite-backed) that is the system of record for everything the user did — workout, reading, learning, meal, focus — modelled as typed payloads on `JournalEvent` rows.

## Terms

| Term                 | Definition                                                                                                                                      | Code identifier(s)                                              | Used in features                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `JournalEvent`       | A single, append-only record of something the user did. Carries a typed payload, a creation timestamp, and (after a bump) an updated timestamp. | `JournalEvent` (TS type)                                        | `journal/journal-mechanism.feature`                                        |
| `Typed payload`      | The structured body of a `JournalEvent`. Initial types: `workout`, `reading`. Extensible via the `typed-payloads` schema.                       | `WorkoutPayload`, `ReadingPayload`, `JournalPayload` (TS union) | `journal/journal-mechanism.feature`                                        |
| `Append`             | The only mutating verb on the journal. Adds a new `JournalEvent`; never replaces an existing one.                                               | `appendEvent` (use-case fn)                                     | `journal/journal-mechanism.feature`                                        |
| `Bump`               | Re-touch an existing `JournalEvent` to mark it as recently revisited (updates its `updatedAt`, never the payload).                              | `bumpEvent` (use-case fn)                                       | `journal/journal-mechanism.feature`                                        |
| `Entry list`         | The ordered, descending-by-time view over `JournalEvent`s for a single user, filtered or unfiltered.                                            | `listEvents` (use-case fn)                                      | `journal/journal-mechanism.feature`, `journal/home-screen.feature`         |
| `Empty state`        | The journal projection when no `JournalEvent`s exist yet for the current user.                                                                  | (component name) `EmptyState`                                   | `journal/journal-mechanism.feature` (Scenario: Empty state on first visit) |
| `Edited line`        | Subtle UI line under a journal entry indicating the entry was bumped after creation.                                                            | (component name) `EditedLine`                                   | `journal/journal-mechanism.feature`                                        |
| `Relative timestamp` | Human-friendly duration string ("just now", "3m ago") rendered next to a `JournalEvent`.                                                        | `formatRelativeTime` (helper, lives in `shared/utils/`)         | `journal/journal-mechanism.feature`                                        |

## Forbidden synonyms

- "Entry" — used by `routine` to mean a routine _exercise_ entry. Inside `journal`, prefer "event".
- "Workout" — used by `workout-session` to mean an _active session_. Inside `journal`, prefer "workout payload" or `WorkoutPayload`.
- "Aggregate" — used by `stats` to mean a derived rollup. Inside `journal`, prefer "event".
- "Record" — used by `health` to mean a backend health-probe record. Inside `journal`, prefer "event".
