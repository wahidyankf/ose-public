# Product Requirements — FERRET Init 02 Protocol-Independent Local Backend

> **Evidence scope:** Current repository workflows and the delivered Plan 01 contract are **[Repo-grounded]**.
> Every FERRET API path, command, port allocation, type, limit, status, and future source/test path in this PRD is
> an approved **[Judgment call — new artifact]** unless marked otherwise. Dependency versions remain
> **[Unverified]** until the execution worktree locks and audits them.

## Product Overview

`ferret-be` is a loopback-only FastAPI service backed by PostgreSQL. `ferret sync --once` leases eligible rows
from the Plan 01 SQLite store, sends a bounded REST batch, applies per-event acknowledgements, and releases or
retries the rest. Capture never waits for sync. Raw and aggregate REST queries reuse protocol-independent
application use cases designed for later GraphQL and MCP adapters.

## Personas

- **Local FERRET user:** starts/stops the backend and expects capture to remain independent.
- **Script/analysis consumer:** queries authenticated raw/aggregate JSON with stable filters/pagination.
- **Future dashboard engineer:** attaches GraphQL resolvers/subscriptions to application/query/change ports.
- **Future MCP engineer:** attaches tools/resources to the same use cases and authorization principal.
- **Backend maintainer:** migrates, measures, prunes, recovers, and tests PostgreSQL safely.

## User Stories

- As a local FERRET user, I want capture to stay local when the backend is stopped so that every retained
  unacknowledged record can synchronize later without blocking my harness.
- As an analysis consumer, I want stable authenticated REST resources so that I can distinguish unknown
  visibility from zero use.
- As a maintainer, I want a pinned reproducible stack so that schema, retention, storage, and failure behaviour
  can be verified locally.
- As a future adapter engineer, I want framework-free application ports so that GraphQL or MCP can be added
  without importing REST or PostgreSQL models into the core.

## Product Scope

In scope: a loopback FastAPI service, PostgreSQL persistence, OpenAPI 3.1 contract, CLI backend configuration,
durable event and capability-snapshot synchronization, authenticated raw/aggregate APIs, explicit pruning, and
local BDD/E2E proof. Out of scope: frontend/dashboard, GraphQL endpoint/subscription, MCP endpoint, remote/cloud
deployment, multi-user identity, OAuth, durable realtime publication, and automatic backend retention.

## Product Risks

- A reconfiguration/capture race could strand records; serialized SQLite configuration/capture transactions
  and revision tests are release blockers.
- At-least-once delivery can duplicate requests; server-side recomputation plus ID/hash idempotency is required.
- An opaque cursor can imply a false snapshot; every traversal carries an ingestion watermark and prune epoch,
  and explicit pruning invalidates older cursors.
- Behavioral metadata can still be sensitive; loopback binding, bearer scope, redaction, and closed schemas are
  mandatory.
- Storage estimates are provisional until deterministic benchmarks replace them; capacity claims carry their
  evidence and confidence label.

## Local Operation

- **[Repo-grounded target]** HTTP binds to `127.0.0.1:8601`; PostgreSQL binds to `127.0.0.1:5440` through the
  Compose-owned local runner. These author-time selections are free in `docs/reference/web-sites.md`; Phase 0
  verifies availability and stops on a collision instead of silently changing the contract. Tests use isolated
  runner-assigned ports.
- `ferret-be token init` creates exactly 32 random bytes at
  `<FERRET_DATA_HOME>/backend-api.token` using atomic create and mode `0600` and never prints the value. BE requires `FERRET_API_TOKEN_FILE` to resolve to
  that absolute file; CLI config records the absolute token-file path, not token value. The file is never
  stored in SQLite/PostgreSQL, copied into a container image, or included in backup/evidence fixtures.
- `ferret-be token write-curl-config --output <ignored-path>` writes a mode-`0600` curl config for manual local
  API verification without exposing the token in argv/stdout; the verifier removes it during cleanup.
- BE rejects non-Local/Test environment startup and non-loopback listener configuration in this plan.
- `ferret backend configure --url http://127.0.0.1:8601 --token-file <path>` validates and stores optional
  backend configuration. `ferret backend disable` stops sync without deleting queue state.
- `ferret sync --once` performs one bounded drain attempt and reports machine-readable counts. A due capture
  may detach this command at most once per five-minute interval; there is no daemon.
- `ferret-be events prune --before <RFC3339>` is dry-run by default and requires `--execute` plus confirmation
  of exact cutoff/count. It never runs automatically.

## REST Surface

The canonical contract is `specs/apps/ferret/be/contracts/openapi.yaml` using OpenAPI 3.1 and reusable JSON
Schema components. The CLI uses standard-library `urllib`/`json`; FastAPI uses adapter-local Pydantic models.
No runtime client/model generation is added.

| Operation ID           | Method and path                  | Purpose                                                         |
| ---------------------- | -------------------------------- | --------------------------------------------------------------- |
| `getLiveness`          | `GET /health/live`               | Process liveness; no database check, no bearer token            |
| `getReadiness`         | `GET /health/ready`              | Migration/database/readiness state; no secret detail            |
| `ingestTelemetryBatch` | `POST /api/v1/event-batches`     | Accept up to 500 events/snapshots and 1 MiB with per-record ACK |
| `listEvents`           | `GET /api/v1/events`             | Filtered raw metadata with opaque cursor pagination             |
| `getUsageAnalytics`    | `GET /api/v1/analytics/usage`    | Counts grouped by allowed dimensions and subject visibility     |
| `getOutcomeAnalytics`  | `GET /api/v1/analytics/outcomes` | Operational outcome/duration aggregates and disclaimer          |
| `getCapabilities`      | `GET /api/v1/capabilities`       | Observability matrix by harness/version/capability              |

Every `/api/v1/**` operation requires `Authorization: Bearer <token>`, returns `application/json`, sends
`Cache-Control: no-store`, and uses a stable problem schema. The complete packets are in the API contract delta.

## Protocol-Independent Use Cases

Application ports expose `ingest_telemetry_batch`, `list_events`, `summarize_usage`, `summarize_outcomes`,
`list_capabilities`, and `prune_events`. Inputs/outputs are frozen standard-library dataclasses. Protocol
adapters convert their credentials to one internal local principal and map typed application errors to their
wire-specific representation. Domain/application modules import neither FastAPI/Pydantic transport models nor
SQLAlchemy, GraphQL, or MCP packages.

After a successful commit, the application emits minimal typed notices such as `events.accepted` and
`analytics.invalidated` through a `ChangePublisher` port. Plan 02 uses a no-op production adapter and in-memory
test adapter. Future GraphQL subscriptions or MCP notifications may consume that port only after separate plans
choose transport, reconnect, backpressure, authentication, and pub/sub behaviour.

## Synchronization Semantics

Plan 02 expands SQLite events and capability snapshots with delivery state, attempt time/count, next-attempt
time, lease ID/expiry, last safe error code, backend ID, and configuration revision. Capture and backend
enable/reconfigure serialize with `BEGIN IMMEDIATE`: a record is atomically inserted as `local` while disabled
or `pending` with the current revision while enabled, and enabling converts retained local records before it
commits. Reconfiguration refuses a live lease. A sync transaction reclaims expired leases, leases up to 500
eligible records, and
commits before HTTP. The request occurs outside SQLite transactions. A second transaction accepts only ACKs
whose event ID/hash and lease ID match; accepted/duplicate rows become delivered, retryable failures return to
pending with bounded exponential backoff and jitter, and permanent rejections remain rejected until 30-day
expiry. Authentication failure disables automatic attempts until configuration changes; manual sync reports it.

The backend uniquely identifies events and capability snapshots by producer ID plus server-recomputed canonical
hash: same ID/hash is duplicate success; same ID/different hash is conflict. One database transaction inserts
valid new records, resolves duplicates/conflicts, and returns a status for every submitted record. Invalid
records are rejected individually; request-level invalid JSON/size/authentication errors reject the whole
request. `batchId` is the replay identity: same ID and canonical request hash returns the stored ordered response;
same ID with another hash returns `batch_id_conflict`. `X-Request-ID` is correlation only.

## Acceptance Criteria

### AC-BE-01 — Preserve standalone operation

```gherkin
Scenario: Use FERRET with backend synchronization disabled
  Given the Plan 01 local database contains events
  And no backend is configured or running
  When the user captures, queries, exports, summarizes, and maintains local data
  Then every standalone command keeps its Plan 01 behaviour
  And capture makes no network request
  And no event changes delivery state merely because the backend is absent
```

### AC-BE-02 — Configure one private local backend

```gherkin
Scenario: Configure loopback synchronization with a token file
  Given the local backend generated a private token file without printing its value
  When the user configures the loopback URL and token-file path
  Then the CLI stores no bearer value in tracked files or command history
  And readiness succeeds with the matching token available to data requests
  And a non-loopback or non-Local/Test configuration is rejected
```

### AC-BE-03 — Ingest a new batch

```gherkin
Scenario: Synchronize a valid batch
  Given 500 or fewer eligible local events and capability snapshots are leased
  And the authenticated backend is ready
  When the CLI sends the batch
  Then each new record is committed once in PostgreSQL without losing a canonical field
  And each response item identifies the matching record ID and server-recomputed hash as accepted
  And replaying the batch ID with the same canonical hash returns the stored ordered response
  And only matching acknowledgements mark local records delivered
```

### AC-BE-04 — Recover after acceptance before acknowledgement

```gherkin
Scenario: Resend after the client crashes before local acknowledgement
  Given the backend committed an event but the CLI did not commit its acknowledgement
  When the lease expires and the CLI sends the same event ID and hash again
  Then the backend returns duplicate for that event
  And PostgreSQL still contains exactly one event row
  And the CLI marks the matching local event delivered
```

### AC-BE-05 — Reject an identity conflict

```gherkin
Scenario: Reuse an event ID with different content
  Given PostgreSQL contains an event ID and canonical hash
  When a batch submits the same event ID with a different hash
  Then that item is rejected with the stable event_id_conflict code
  And the stored event remains unchanged
  And the CLI retains the conflicting local event as rejected until retention expires
```

### AC-BE-06 — Handle partial acknowledgement safely

```gherkin
Scenario: Receive mixed batch results
  Given a leased batch contains a new event, an exact duplicate, and an invalid event
  When the authenticated backend processes the batch
  Then the response contains one accepted, one duplicate, and one rejected item in request order
  And the CLI delivers only the accepted and duplicate items
  And the rejected item remains locally inspectable with a safe error code
```

### AC-BE-07 — Retry without blocking capture

```gherkin
Scenario Outline: Synchronization encounters a retryable failure
  Given capture can commit to the local SQLite database
  And synchronization encounters <failure>
  When another harness event is captured
  Then capture returns after its local commit without waiting for the backend
  And sync schedules a bounded later attempt without a permanent daemon

Examples:
  | failure |
  | connection refused |
  | request timeout |
  | HTTP 429 |
  | HTTP 503 |
```

### AC-BE-08 — Authenticate every data operation

```gherkin
Scenario Outline: Call a data endpoint without the matching token
  Given the local backend is ready
  When a caller supplies <credential>
  Then the backend returns the stable unauthorized response
  And no event, aggregate, capability, or token detail is disclosed

Examples:
  | credential |
  | no Authorization header |
  | a malformed bearer header |
  | a different bearer token |
```

### AC-BE-09 — Query raw events deterministically

```gherkin
Scenario: Page through filtered events
  Given PostgreSQL contains events from multiple intervals, harnesses, workspaces, types, and outcomes
  When an authenticated caller filters and follows opaque cursors
  Then every matching event appears exactly once in occurred-time and event-ID order
  And records inserted after the first-page watermark remain outside that traversal
  And no non-matching or forbidden content field appears
  And a cursor used with different filters is rejected
  But an explicit prune invalidates the cursor with cursor_invalidated instead of promising deleted rows
```

### AC-BE-10 — Query honest aggregates and capabilities

```gherkin
Scenario: Request usage and outcome analytics with visibility gaps
  Given PostgreSQL contains observed, derived, and unknown events from multiple harnesses
  When an authenticated caller requests grouped usage, outcomes, and capabilities
  Then each result preserves subject, outcome, and duration visibility and their unknown counts
  And duration statistics use only observed valid durations
  And the response states that operational correlation is not semantic quality or causation

Scenario: Page capability evidence across installations at one watermark
  Given two installations share a harness version and capability name
  And a later capability snapshot is inserted after the first page
  When the caller follows the original capability cursor
  Then latest-snapshot selection considers only snapshots at or below the first-page watermark
  And each installation and logical capability key appears exactly once in deterministic order
```

### AC-BE-11 — Prune only by explicit operator action

```gherkin
Scenario: Preview and execute backend pruning
  Given PostgreSQL contains events before and after an operator cutoff
  When the operator runs the prune command without --execute
  Then the command reports the exact eligible count and estimated bytes without deleting rows
  When the operator repeats the command with --execute
  Then only rows older than the cutoff are deleted and audited
  And the prune epoch increments in the same transaction
  And newer rows and aggregates remain consistent

Scenario: Preserve distinct local expiry counters after synchronization is enabled
  Given Plan 01 expiredLocalTotal counts rows that expired while local-only
  And Plan 02 migrated expiredBeforeAckTotal to zero without reconstructing history
  When retention deletes local and pending, leased, or rejected rows
  Then only local rows increment expiredLocalTotal
  And only pending, leased, or rejected rows increment expiredBeforeAckTotal
```

### AC-BE-12 — Add another inbound adapter without changing the core

```gherkin
Scenario: Exercise application use cases through a fake protocol adapter
  Given REST and a framework-free fake adapter map equivalent authenticated inputs
  When each adapter ingests and queries the same synthetic fixture
  Then both receive equivalent application results and stable error codes
  And architecture tests show no protocol or persistence framework import in domain/application modules
  And change notices are emitted only after successful commits
```

## Deferred Protocol Contract

- Future GraphQL may add queries and subscriptions for a dashboard; it owns GraphQL SDL, transport, resolver,
  reconnect/backpressure, authorization, and pub/sub decisions in a separate plan.
- Future MCP may add analytics/event-search tools and resources plus optional ingestion. It owns MCP capability
  negotiation, tool/resource schemas, authorization, JSON-RPC errors, and stdio/Streamable HTTP decisions.
- Automatic telemetry remains hook → CLI → REST. An MCP ingestion tool is optional because a host/agent must
  choose to invoke it, which is not a reliable lifecycle sink.
