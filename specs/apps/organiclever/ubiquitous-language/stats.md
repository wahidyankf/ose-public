# Ubiquitous Language — stats

**Bounded context**: `stats`
**Maintainer**: organiclever-web team
**Last reviewed**: 2026-05-02

## One-line summary

Read-only projections over `JournalEvent`s — daily/weekly/monthly aggregates, streaks, and progress charts. No persistence of its own; pure derivations from the journal context.

## Terms

| Term            | Definition                                                                                                                 | Code identifier(s)                                       | Used in features                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| `Aggregate`     | A derived rollup over a period (day, week, month) — counts, totals, and averages of `JournalEvent`s.                       | `aggregateByPeriod` (use-case fn), `Aggregate` (TS type) | `stats/*.feature`                               |
| `Projection`    | A purely derived view over journal events. Always read-only — never writes back to the journal.                            | `Projection<E>` (TS type alias)                          | `stats/*.feature`                               |
| `Period`        | The window over which an aggregate is computed. Values: `day`, `week`, `month`.                                            | `Period` (TS string-literal union)                       | `stats/*.feature`                               |
| `Streak`        | A consecutive-day count of journal activity for a given payload type or category.                                          | `streak` (use-case fn), `Streak` (TS type)               | `stats/*.feature`                               |
| `History view`  | The chronological list of `JournalEvent`s rendered by the `/app/history` page (a stats projection, not journal mutations). | (route segment) `app/history`                            | `stats/*.feature` (history-flavoured scenarios) |
| `Progress view` | The aggregated chart-and-streak view rendered by the `/app/progress` page.                                                 | (route segment) `app/progress`                           | `stats/*.feature` (progress scenarios)          |

## Forbidden synonyms

- "Event" — owned by `journal`. Inside `stats`, prefer "aggregate" or "projection".
- "Append", "bump" — write verbs owned by `journal`. Stats never mutates.
- "Entry" — used by `journal`/`routine` with their own meanings. Inside `stats`, prefer "aggregate row" or "projection row".
