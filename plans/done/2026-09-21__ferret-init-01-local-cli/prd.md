# Product Requirements — FERRET Init 01 Standalone Local CLI

## Product Overview

`ferret` is a local command-line client installed once per operating-system user. Every harness adapter submits
one bounded raw vendor payload to the Python `ferret capture-hook` privacy boundary. Python alone allowlists,
maps, pseudonymizes, validates, and stores a canonical record in a shared SQLite database, then
returns immediately. Humans and scripts can inspect status, list/filter events, export JSON Lines, and view
usage or operational outcome summaries without any backend.

## Personas

- **Maintainer:** compares observed usage across harnesses, repositories, agents, skills, and tools.
- **Developer:** needs invisible, reliable local capture and transparent storage/retention controls.
- **Harness adapter author:** maps only supported lifecycle data and declares missing capabilities.
- **Privacy reviewer:** verifies the record cannot contain content or machine-identifying paths.
- **Local analyst:** exports raw metadata or consumes deterministic summary output from a script.

## User Stories

- As a maintainer, I want observed usage and visibility gaps separated so that I do not treat unobservable
  skills as unused. Proof: “Mark an unobservable capability unknown” and “Summarize outcomes with incomplete visibility.”
- As a macOS/Linux developer, I want fail-open lifecycle capture so that telemetry never changes my harness
  result or terminal output. Proof: “Keep a harness fail-open after a local failure” and “Capture
  concurrently across repositories.”
- As a privacy reviewer, I want a closed event schema and ephemeral raw-hook projection so that prompts,
  responses, tool payloads, paths, and secrets cannot persist. Proof: “Reject a forbidden capture field.”
- As a local analyst, I want deterministic JSON/JSONL contracts so that scripts can process records without
  parsing human output. Proof: “Filter and export deterministic local events” and the CLI contract proof map.
- As a developer with no backend, I want all local capabilities to remain complete so that FERRET is useful
  before Plan 02. Proof: “Use FERRET without a backend.”

## Product Scope

**In scope:** standard-library Python CLI on macOS and Linux, WSL included as Linux; SQLite data home; strict canonical
event/capability schemas; local queries/exports/analytics/retention; macOS/Linux POSIX Claude Code, Codex, and
OpenCode adapters; user artifact install/removal; machine-readable contracts.

**Out of scope:** every platform other than macOS and Linux, backend/sync/network/authentication, frontend/cloud,
content capture, semantic grading, human ratings, experiments, and CI enforcement. Another platform is
reconsidered only when both a stable supported harness surface and a repository CI runner can prove equivalent
deadline/privacy behaviour.

## Product Risks

| Product risk                               | Mitigation or stop condition                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Raw hook JSON crosses the privacy boundary | Dumb wrapper plus Python allowlist mapper; raw input never opens SQLite/log/spool; negative payload tests |
| Hook adds visible latency                  | 50 ms async return target, 1,000 ms absolute child deadline, 250 ms SQLite busy timeout, measured matrix  |
| Scripts depend on unstable output          | Versioned strict JSON/JSONL schemas and fixed hash/output vectors                                         |
| Thirty-day physical deletion waits for use | Every read expires logically; next prune stops at 100 rows/100 monotonic ms; status distinguishes bytes   |

## User-Facing Commands

| Command                               | Result                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `ferret init`                         | Creates the private data home, installation secret/ID, SQLite schema, and config if absent.     |
| `ferret capture`                      | Reads one strict JSON event from standard input and stores it atomically.                       |
| `ferret capture-hook`                 | Privately maps one raw harness payload; emits nothing and always fails open to the harness.     |
| `ferret status [--json]`              | Reports paths, schema, retained rows, database/WAL bytes, health, and expiry counters.          |
| `ferret events list`                  | Lists paginated local events with time, harness, workspace, type, subject, and outcome filters. |
| `ferret events export --format jsonl` | Writes filtered canonical events to standard output, oldest first.                              |
| `ferret usage`                        | Aggregates observed counts by selected dimensions and labels unknown visibility.                |
| `ferret outcomes`                     | Aggregates observable success/failure/cancellation/duration proxies without quality claims.     |
| `ferret maintenance`                  | Applies retention, checkpoints WAL when safe, measures space, and runs integrity diagnostics.   |
| `ferret self install/uninstall`       | Atomically manages only the user's artifact/launcher/manifest; data persists unless purged.     |

Exact grammar, `--json` applicability, schemas, examples, cursors, defaults, and exit codes are fixed in
[the CLI and shared data contract](tech-docs/005-cli-and-shared-data-contract.md). Harness adapters suppress
both streams and always return zero.

## Data Home and Privacy

FERRET uses one data home per OS user:

- macOS and Linux: `~/.ferret`
- override: absolute local path in `FERRET_DATA_HOME`

Directories are mode `0700` and files mode `0600`. Unsafe ownership, mode, symlink, or hard link stops the
command rather than being weakened automatically. Tests always set an isolated temporary `FERRET_DATA_HOME`; a test-mode guard refuses the real user store. Workspace and harness-native session IDs
are converted to stable HMAC-SHA-256 opaque IDs using the private installation secret. Raw values are never
stored or exported.

## Canonical Event Semantics

Every record uses schema version `1.0`, a UUIDv4 event ID, a SHA-256 hash of canonical JSON excluding the
hash field, RFC 3339 UTC timestamps, bounded normalized identifiers, and explicit enum values. Supported
event types are:

- `session.started`, `session.ended`;
- `agent.started`, `agent.ended`;
- `skill.invoked`;
- `tool.started`, `tool.completed`, `tool.failed`.

Outcome is `success`, `failure`, `cancelled`, `unknown`, or `not_applicable`. Subject, outcome, and duration
each have independent visibility: `observed`, `derived`, `unknown`, or `not_applicable`. A field that the
harness does not expose is null with the corresponding `unknown`; the adapter never invents a value. The
strict invariants and SQLite mapping live in the technical design.

## Retention and Standalone Behavior

All usage-derived rows become logically invisible 30 days after `captured_at`. Every read enforces that cutoff.
There is no daemon: an inactive installation can retain physical bytes, and the first subsequent FERRET
operation attempts a separate prune transaction before its main operation, stopping at the first of 100 rows
or 100 monotonic milliseconds. Explicit maintenance repeats those transactions and may reclaim pages. `ferret status` distinguishes logical rows, freelist bytes, WAL bytes,
and high-water bytes. `expiredLocalTotal` counts Plan 01 rows expired before ever becoming pending;
`expiredBeforeAckTotal` is exactly zero in Plan 01. No command attempts a network connection in this plan.

## Harness Experience

The installed integration is intentionally asymmetric:

- **Claude Code:** repository hook configuration invokes a shared shell wrapper for lifecycle events that
  official hooks expose, including session, subagent, skill-tool, and tool completion/failure where verified.
- **Codex:** hand-authored hook configuration invokes the same wrapper for exposed session, subagent, and
  tool lifecycle. Skill use remains unknown unless the current official surface provides a stable signal.
- **OpenCode:** a project plugin forwards bounded raw event JSON to the same Python `capture-hook`; it does not
  map, pseudonymize, canonicalize, hash, or open SQLite. Python records a skill observation only when the
  payload identifies it unambiguously.

FERRET targets macOS and Linux only; WSL is a Linux environment and needs no separate treatment. No other
platform is claimed, tested, or shipped, so the plan carries no unsupported-platform surface to maintain.

Phase 0 re-verifies current official lifecycle names and payloads before authoring bindings. Unsupported or
changed lifecycle surfaces reduce FERRET coverage, never block harness execution.

## Acceptance Criteria

### AC-CLI-01 — Initialize one private machine store

```gherkin
Scenario: Initialize one private store from multiple repositories
  Given FERRET has not been initialized for the current operating-system user
  When the user runs ferret init from two different repositories
  Then both commands resolve the same private data home and SQLite database
  And exactly one installation identity and current schema exist
  And POSIX modes make every artifact private
  And no repository-local telemetry database is created
```

### AC-CLI-02 — Capture strict metadata

```gherkin
Scenario: Capture a valid lifecycle event
  Given FERRET is initialized with an empty local database
  When an adapter submits one schema-version-1.0 tool-completed event
  Then the CLI stores one event with its canonical hash and opaque identifiers
  And the stored record contains no raw workspace or harness session value
  And the direct capture command reports success
```

### AC-CLI-03 — Reject content and unknown fields

```gherkin
Scenario Outline: Reject a forbidden capture field
  Given FERRET is initialized with an empty local database
  When an adapter submits an otherwise valid event containing <field>
  Then capture rejects the complete event without storing a partial row
  And the diagnostic names the field category without echoing its value

Examples:
  | field |
  | prompt |
  | response |
  | tool_arguments |
  | transcript_path |
  | environment |
  | an unknown arbitrary field |
```

### AC-CLI-04 — Keep the harness fail-open

```gherkin
Scenario Outline: Keep a harness fail-open after a local failure
  Given a harness invokes the FERRET adapter
  And FERRET is <condition>
  When the adapter handles a lifecycle event
  Then the adapter returns exit code zero within 1000 milliseconds
  And it writes no output into the harness conversation

Examples:
  | condition |
  | not installed |
  | given invalid metadata |
  | unable to open SQLite |
  | blocked by a concurrent writer beyond the timeout |
```

### AC-CLI-05 — Preserve concurrent local capture

```gherkin
Scenario: Capture concurrently across repositories
  Given three repositories and three harness adapters use the same initialized data home
  When each adapter submits a bounded burst of unique events concurrently
  Then every successful direct capture has exactly one durable row
  And no row is partially written or duplicated
  And every adapter returns within 1000 milliseconds
```

### AC-CLI-06 — Show unknown instead of zero

```gherkin
Scenario: Mark an unobservable capability unknown
  Given the selected harness exposes tool events but no stable skill lifecycle event
  When the user requests usage grouped by skill for that harness
  Then the result marks skill subject visibility as unknown
  And the result does not report zero skill invocations as an observed fact
```

### AC-CLI-07 — Query and export deterministic events

```gherkin
Scenario: Filter and export deterministic local events
  Given the database contains events from two workspaces and two harnesses
  When the user filters by UTC interval, harness, workspace, event type, and outcome
  Then only matching events are returned in stable timestamp and event-ID order
  And JSON Lines export contains one canonical event object per line
  And diagnostics do not contaminate standard output
```

### AC-CLI-08 — Report operational proxies honestly

```gherkin
Scenario: Summarize outcomes with incomplete visibility
  Given some completed operations have observed durations and some outcomes are unknown
  When the user requests outcome analytics
  Then observed success, failure, cancellation, and duration values are aggregated separately
  And unknown outcomes remain in an explicit unknown bucket
  And the output states that the summary is not a semantic quality or causal evaluation
```

### AC-CLI-09 — Enforce thirty-day retention

```gherkin
Scenario: Hide then prune every expired usage-derived record
  Given the database contains rows captured before and after the thirty-day cutoff
  When a read runs before physical pruning and then the next FERRET operation runs with a fixed clock
  Then no row at or beyond the cutoff is returned by the read
  And the next operation stops physical pruning at the first of 100 rows or 100 monotonic milliseconds
  And every newer row remains queryable
  And status increments expiredLocalTotal for locally expired rows
  And expiredBeforeAckTotal remains zero
```

### AC-CLI-10 — Diagnose space without hiding high-water usage

```gherkin
Scenario: Measure storage before and after retention
  Given a representative event fixture has populated the database and WAL
  When maintenance checkpoints, prunes expired rows, and performs the planned compaction policy
  Then status reports database, WAL, and total high-water bytes separately
  And the benchmark reports bytes per event and index share
  And a size outside the planning envelope fails the storage acceptance gate pending explanation
```

### AC-CLI-11 — Remain fully standalone

```gherkin
Scenario: Use FERRET without a backend
  Given no backend URL, token, or process exists
  When the user captures, lists, exports, summarizes, and maintains local events
  Then every command completes using only the local data home
  And status identifies backend synchronization as unavailable by design
  And no network connection is attempted
```

### AC-CLI-12 — Preserve install and removal boundaries

```gherkin
Scenario: Remove FERRET without changing harness behaviour
  Given supported harness adapters are configured to call FERRET
  When the ferret executable and local integration are removed
  Then every harness continues to run normally
  And the repository contains no newly generated telemetry data
  And the existing user database remains recoverable or removable by an explicit user action
```

## Product Scope Exclusions

No backend configuration command, sync state, bearer token, server health, HTTP request, GraphQL schema,
MCP server, dashboard, prompt inspection, automatic human rating, or cloud resource belongs to this plan.

**Reconciliation added by the terminal closure delivery.** Decision D16 authorizes an annotated tag, a
GitHub release, and a published `checksums.txt`, and the release delivered against it publishes assets to
GitHub. The terminal audit asked whether that contradicts the cloud-resource exclusion above, and judged
that it does not: the exclusion names running infrastructure this plan would have to operate — a backend,
a database, a dashboard, a deployed environment — while a release asset is a published artifact with
nothing to run, no endpoint, no state, and no cost after publication. The release workflow adds no backend,
no network client in product code, no frontend, and writes no branch. This paragraph says so explicitly
rather than leaving a reader to derive it, which is what the audit actually faulted. No acceptance
criterion is added for the release: writing a new one into an archived PRD after execution would reshape
the requirements the delivery was judged against, and the release is bound instead by the eight unit cases
in `apps/ferret-cli/tests/unit/test_release_contract.py`.
