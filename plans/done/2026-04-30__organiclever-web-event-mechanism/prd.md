# Product Requirements Document

## Product Overview

A minimal `/app` page in `apps/organiclever-web/` that lets a user submit a **batch**
of generic journal entries and see, edit, or delete every entry they have saved so far. Each
entry is a `{ id, name, payload, createdAt, updatedAt }` record where `name` is an
open string (e.g., `workout`, `reading`, `meditation`) and `payload` is an arbitrary
JSON object. The page is the round-trip skeleton on top of which the bigger app
plan ([`2026-04-25__organiclever-web-app/`](../2026-04-25__organiclever-web-app/README.md))
later builds typed payloads, screens, and analytics.

**Key behaviors**:

- Plus button opens a sheet that holds **one or more drafts**. "+ Add another"
  stacks drafts; Save commits the whole batch atomically.
- Submission is **flattened**: a batch `[{name, payload}, ...]` becomes N appended
  entries in storage, never a nested array.
- All entries in one batch share the same `createdAt` (the submission timestamp);
  `updatedAt` is set equal to `createdAt` on creation and refreshed only on edit.
- The list is **sorted by `createdAt` desc** with `storage_seq` (BIGSERIAL) as tiebreaker, so
  within a batch the first draft entered appears first within its timestamp group;
  editing an entry **never** changes its position.

## Personas

- **Solo maintainer (product owner hat)**: confirms the gear-up scope and the
  cut-line between this plan and the bigger app plan.
- **Solo maintainer (developer hat)**: implements all six phases (Phase 0
  through Phase 5) via the delivery checklist.
- **`plan-executor` agent**: runs delivery items step-by-step.
- **`plan-execution-checker` agent**: validates acceptance criteria after
  execution.
- **`swe-typescript-dev` agent**: assists with `lib/journal/*` and React UI.
- **`swe-e2e-dev` agent**: assists with the Playwright FE E2E spec.

## User Stories

1. As a user landing on `/app`, I want to see a clearly-labelled plus button so
   that I know how to record an entry.
2. As a user, I want pressing the plus button to open a small form where I can
   pick a `name` and provide a free-form payload — and stack multiple drafts
   before saving — so that I can capture a busy moment in one action.
3. As a user, I want to submit and immediately see every new entry at the top of
   the list, so that I get instant feedback that the action worked.
4. As a user, I want to edit an entry I logged earlier (typo in the payload, wrong
   name) without it jumping to the top of the list.
5. As a user, I want to delete an entry I logged by mistake, with one inline
   confirmation so I do not nuke real data accidentally.
6. As a user, I want a "Bring to top" action on each row that promotes an old
   entry to the front of the list — accepting that the original `createdAt` is
   replaced by `now` — so that I can resurface something I am thinking about
   again today without re-typing it.
7. As a user, I want to hard-reload the page and still see every entry I logged
   (with edits and bumps preserved), so that I trust the app with my data.
8. As a user, I want to log multiple names in one session (`workout`, `reading`,
   `meditation`) without restarting or signing up, so that the app fits my real
   day.
9. As a developer reading the code, I want the storage layer to expose a small,
   stable API (`appendEntries`, `listEntries`, `updateEntry`, `deleteEntry`,
   `bumpEntry`, `clearEntries`) so that the bigger app plan can wrap or replace
   it without a churn-y migration.

## Product Scope

### In Scope

- `/app` route at `apps/organiclever-web/src/app/app/page.tsx`, client-rendered
  with `'use client'` + `export const dynamic = 'force-dynamic'`
- Plus button (FAB-style or top-right) labelled "Add entry" — keyboard-reachable
- **Batch form sheet** holding 1..N drafts, each with:
  - `Name` text input (free-form string; preset chips: `workout`, `reading`,
    `meditation`)
  - `Payload` textarea (free-form JSON object)
  - "Remove draft" button on every draft except when only one remains
- "+ Add another" appends a fresh empty draft to the sheet
- Save validates every draft, then commits the batch via `appendEntries`
- Cancel discards every draft without persisting
- Per-row affordances on each entry card:
  - **Edit** — opens the form sheet seeded with that single entry's `name` and
    `payload`; Save patches the entry in place via `updateEntry` (refreshes
    `updatedAt`, leaves `createdAt` and order untouched)
  - **Delete** — shows an inline confirm ("Delete this entry? Yes / Cancel"); on
    confirm, removes via `deleteEntry`
  - **Bring to top** — sets `createdAt = updatedAt = new Date().toISOString()`
    via `bumpEntry`; because sort is `createdAt` desc, the row becomes the
    newest. No confirmation prompt (the action is non-destructive of `name`
    and `payload`); the previous `createdAt` is overwritten
- Empty-state copy when zero entries are stored
- Entry list sorted by `createdAt` desc (tiebreaker: `storage_seq` ASC),
  each row showing:
  - `name` (rendered prominently)
  - relative `createdAt` (`just now`, `2m ago`, `1h ago`, `3d ago`, ISO fallback)
  - "edited Xm ago" line shown only when `updatedAt` differs from `createdAt`
  - payload preview via `<details>` (full pretty-printed JSON inside)
- PGlite (Postgres-WASM, Apache 2.0, FOSS) over IndexedDB; database name
  `ol_journal_v1` (deliberately distinct from bigger plan's `ol_db_v12`); v1
  migration creates the `journal_entries` table and a composite
  `(created_at DESC, storage_seq ASC)` index
- Pure English UI strings (i18n is bigger plan's concern)

### Out of Scope

- **Per-name** typed payload validation (no `WorkoutPayload` / `ReadingPayload`
  discriminated union; bigger plan owns those). The gear-up DOES use Effect's
  `Schema` to decode the **shape** (`{ name: non-empty string, payload: JSON object }`)
  and to surface field-level errors in the form sheet — `Schema` is adopted; the
  per-name union is deferred
- Drag-to-arbitrary-position reorder; only "Bring to top" is supported
- Undo for delete (single confirmation; bigger plan can layer undo)
- Undo for bump (the previous `createdAt` is overwritten and not recoverable)
- Cross-tab sync via the `storage` event
- Hash routing, TabBar, SideNav, dark mode, bilingual i18n
- Charts, analytics, weekly rhythm, streaks
- Cloud sync, auth
- ts-ui component additions
- PWA manifest

## Product Risks

| Risk                                                   | Mitigation                                                                                                                                                                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Free-form JSON payload entry is user-hostile           | Acceptable for v0 — proof-of-mechanism only; bigger plan replaces with typed loggers                                                                                                                                                                        |
| Invalid JSON crashes form                              | Per draft: `Schema.decodeUnknownEither(DraftSchema, { errors: "all" })`; `Left` (`ParseError`) is formatted via `ArrayFormatter.formatErrorSync` into per-field messages; submit is blocked until every draft is `Right`. No raw `try { JSON.parse } catch` |
| Mixed-validity batch (one bad draft) loses good ones   | All-or-nothing batch: if any draft fails validation, no entries are persisted; the failing draft is highlighted, others remain editable                                                                                                                     |
| Editing wrong row                                      | Operations key by `id` (not array index); the edit sheet shows the entry's `id` (or first 8 chars) and current `name`                                                                                                                                       |
| Accidental delete                                      | Inline "Are you sure?" confirm; user must click Yes to commit                                                                                                                                                                                               |
| Sort flicker on edit                                   | Sort key is `createdAt`; **edit** refreshes only `updatedAt`, so order is stable. **Bump** is the explicit opt-in that mutates `createdAt`.                                                                                                                 |
| User accidentally bumps and loses original `createdAt` | Bump is a separately-labelled affordance (distinct from edit/delete); previous timestamp is overwritten and not recoverable (out-of-scope)                                                                                                                  |
| Storage name collides with bigger plan                 | Distinct PGlite database `ol_journal_v1` (IndexedDB); bigger plan's localStorage blob is `ol_db_v12`                                                                                                                                                        |
| `'use client'` + Next.js hydration glitch              | `force-dynamic` plus PGlite loaded via `dynamic(() => import('@electric-sql/pglite'), { ssr: false })` — WASM never reaches the server                                                                                                                      |
| `lib/journal/*` API churns when bigger plan starts     | API limited to six async functions; signature designed to wrap a typed layer above (see `tech-docs.md`)                                                                                                                                                     |
| Migration registry leaves DB half-migrated             | Each migration runs inside `db.transaction(...)`; `_migrations` row write is part of the same transaction so partial apply rolls back                                                                                                                       |
| IndexedDB unavailable (private browsing, quota)        | Hook `status` transitions to `"error"`; UI surfaces "Storage unavailable — data was not saved" instead of silent failure                                                                                                                                    |
| PGlite WASM bundle (~3 MB) bloats `/app` cold start    | Loaded only on `/app` via `dynamic`; landing page (`/`) unaffected; Vercel CDN caches the WASM after first hit                                                                                                                                              |
| Dev-only `globalThis.__ol_db` leaks to production      | Handle assigned only when `process.env.NODE_ENV !== "production"`; lint / grep gate in `test:quick` blocks production references                                                                                                                            |

## Acceptance Criteria

### Feature: Generic journal entry mechanism on `/app`

```gherkin
Feature: Generic journal entry mechanism on /app
  As a user of organiclever-web
  I want to log, edit, and delete generic journal entries with a name and payload
  So that I have a working entry-capture loop before the typed app ships

  Background:
    Given the app is running
    And I have opened "/app" in a fresh browser session

  Scenario: Empty state on first visit
    Given PGlite database "ol_journal_v1" (IndexedDB) is empty
    Then I see a heading "Journal"
    And I see empty-state copy "No entries yet — press + to add one"
    And I see a focusable button labelled "Add entry"

  Scenario: Adding a single entry
    When I press the "Add entry" button
    Then a form sheet opens with one draft containing a "Name" input and a "Payload" textarea
    When I type "workout" into the "Name" input of draft 1
    And I type "{\"reps\": 12, \"weight\": 20}" into the "Payload" textarea of draft 1
    And I press the "Save" button
    Then the form sheet closes
    And the list shows one entry with name "workout"
    And the list entry shows a relative timestamp "just now"
    And the list entry does not show an "edited" line
    And PGlite database "ol_journal_v1" (IndexedDB) contains exactly one entry with name "workout"

  Scenario: Adding a batch of three drafts
    When I press the "Add entry" button
    And I type "workout" into the "Name" input of draft 1
    And I type "{\"reps\": 12}" into the "Payload" textarea of draft 1
    And I press the "+ Add another" button
    And I type "reading" into the "Name" input of draft 2
    And I type "{\"title\": \"Sapiens\"}" into the "Payload" textarea of draft 2
    And I press the "+ Add another" button
    And I type "meditation" into the "Name" input of draft 3
    And I type "{\"durationMins\": 20}" into the "Payload" textarea of draft 3
    And I press the "Save" button
    Then the form sheet closes
    And the list shows three entries
    And the entries appear in storage order: "workout", "reading", "meditation"
    And the rendered list shows them with the same "createdAt" timestamp
    And every entry has "updatedAt" equal to its "createdAt"
    And PGlite database "ol_journal_v1" (IndexedDB) contains exactly three entries (no nested arrays)

  Scenario: Batch timestamp + sort across batches
    Given the list shows three entries from a single earlier batch
    When I press the "Add entry" button
    And I add a draft with name "focus" and payload "{}"
    And I press the "Save" button
    Then the list shows four entries
    And the newest entry "focus" appears first in the list
    And the three earlier entries appear after, in their original within-batch order

  Scenario: Removing a draft from the sheet before saving
    When I press the "Add entry" button
    And I press the "+ Add another" button
    And I press the "Remove draft" button on draft 2
    Then the sheet shows one draft

  Scenario: Persisting entries across reload
    Given the list shows two entries with names "workout" and "reading"
    When I hard-reload the page
    Then the list still shows two entries with names "workout" and "reading"
    And the order is preserved (newest first)

  Scenario: Cancelling the form discards every draft
    When I press the "Add entry" button
    And I type "workout" into the "Name" input of draft 1
    And I press the "+ Add another" button
    And I type "reading" into the "Name" input of draft 2
    And I press the "Cancel" button
    Then the form sheet closes
    And the list still shows zero entries
    And PGlite database "ol_journal_v1" (IndexedDB) remains empty

  Scenario: Mixed-validity batch is rejected as a whole
    When I press the "Add entry" button
    And I type "workout" into the "Name" input of draft 1
    And I type "{\"reps\": 12}" into the "Payload" textarea of draft 1
    And I press the "+ Add another" button
    And I leave the "Name" input of draft 2 empty
    And I press the "Save" button
    Then I see an inline error on draft 2: "Name is required"
    And the form sheet remains open
    And PGlite database "ol_journal_v1" (IndexedDB) remains empty

  Scenario: Submitting invalid JSON payload is rejected
    When I press the "Add entry" button
    And I type "workout" into the "Name" input of draft 1
    And I type "{not json}" into the "Payload" textarea of draft 1
    And I press the "Save" button
    Then I see an inline error on draft 1: "Payload must be valid JSON"
    And the form sheet remains open

  Scenario: Storage unavailable surfaces a typed error banner
    Given the IndexedDB API is unavailable in this browser session
    When I open "/app"
    Then I see an inline error banner reading "Storage unavailable — data was not saved"
    And the banner is rendered because the React layer narrowed `state.status === "error"` and `state.cause._tag === "StorageUnavailable"`
    And no "Add entry" button is rendered while `state.status !== "ready"`

  Scenario: Preset name chips fill the name input of the focused draft
    When I press the "Add entry" button
    And I click the "reading" preset chip on draft 1
    Then the "Name" input of draft 1 has the value "reading"

  Scenario: Expanding payload preview shows the full JSON
    Given the list shows one entry with payload "{\"title\": \"Sapiens\", \"pages\": 320, \"notes\": \"Excellent\"}"
    When I click the "View payload" disclosure on that entry
    Then the row expands to show the full pretty-printed JSON payload

  Scenario: Editing an entry refreshes updatedAt without reordering
    Given the list shows two entries:
      | name    | payload                |
      | reading | {"title": "Sapiens"}   |
      | workout | {"reps": 12}           |
    And the newest entry in the list is "reading"
    When I press the "Edit" button on the "reading" entry
    Then the form sheet opens seeded with name "reading" and payload "{\"title\": \"Sapiens\"}"
    When I change the payload to "{\"title\": \"Sapiens\", \"pages\": 320}"
    And I press the "Save" button
    Then the form sheet closes
    And the "reading" entry still appears first in the list
    And the "reading" entry shows an "edited just now" line
    And the "reading" entry's "createdAt" is unchanged
    And the "reading" entry's "updatedAt" is later than its "createdAt"

  Scenario: Deleting an entry requires confirmation
    Given the list shows two entries with names "workout" and "reading"
    When I press the "Delete" button on the "reading" entry
    Then I see an inline confirm "Delete this entry? Yes / Cancel"
    When I press the "Cancel" confirm button
    Then the list still shows two entries
    When I press the "Delete" button on the "reading" entry
    And I press the "Yes" confirm button
    Then the list shows one entry with name "workout"
    And PGlite database "ol_journal_v1" (IndexedDB) contains exactly one entry with name "workout"

  Scenario: Bumping (bring to top) mutates createdAt and reorders
    Given the list shows two entries:
      | name    | payload                |
      | reading | {"title": "Sapiens"}   |
      | workout | {"reps": 12}           |
    And the newest entry in the list is "reading"
    And I record the original "createdAt" of the "workout" entry as T0
    When I press the "Bring to top" button on the "workout" entry
    Then the list shows the "workout" entry first
    And the "reading" entry appears second
    And the "workout" entry's "createdAt" is later than T0
    And the "workout" entry's "updatedAt" equals its new "createdAt"
    And PGlite database "ol_journal_v1" (IndexedDB) reflects the new "createdAt" for the "workout" entry

  Scenario: Bump persists across reload
    Given the list shows two entries with names "workout" and "reading"
    And I press the "Bring to top" button on the "workout" entry
    When I hard-reload the page
    Then the list still shows two entries
    And the "workout" entry still appears first
```

## Out-of-scope criteria (deferred to bigger plan)

- "Workout sessions" — multi-set, multi-exercise typed payloads
- "Per-name specialised loggers" — typed forms per entry name
- "History tab", "Progress tab", "Settings tab" — single page only here
- "Charts and analytics"
- "Bilingual UI"
- "Routine CRUD"
- "Undo / restore for deleted entries"
- "Undo for bump (restore the original `createdAt`)"
- "Drag-to-arbitrary-position reordering" (only "Bring to top" is supported)
