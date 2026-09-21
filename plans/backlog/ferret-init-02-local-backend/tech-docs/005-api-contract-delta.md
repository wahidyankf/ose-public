# API Contract Delta — FERRET Init 02

> **Evidence scope:** Existing Plan 01 wire/hash contracts and repository OpenAPI project patterns are
> **[Repo-grounded]**. Every FERRET endpoint, schema, path fragment, operation ID, limit, status, cursor field,
> and test fixture below is an approved **[Judgment call — new artifact]**. External protocol claims retain their
> explicit citations in the decisions companion.

## Contract Authority

Delivery adds `specs/apps/ferret/be/contracts/openapi.yaml` as the canonical OpenAPI 3.1 REST contract. This
plan fixes the required operations and behaviour; the checked-in OpenAPI document owns exact machine-readable
schemas after implementation. FastAPI-generated OpenAPI and CLI fixtures must conform to it. No generated
runtime client or model is committed.

Base URL is `http://127.0.0.1:8601`. Every response includes `X-Request-ID` as a UUID and
`Cache-Control: no-store`. JSON uses UTF-8, camelCase wire names, RFC 3339 UTC timestamps with millisecond
precision, lowercase UUID strings, and closed enums for every FERRET-owned vocabulary. `harness` is the one
exception: Plan 01's D15 makes it an open bounded slug, so `openapi.yaml` declares it as a `string` with
pattern `^[a-z][a-z0-9_]{0,31}$` and never as an `enum`, in the event envelope and in the `harness` query
parameter alike. An unrecognized but conforming slug is stored and returned, never rejected. Unknown
properties are rejected. `/api/v1/**` requires
`Authorization: Bearer <token>` with constant-time comparison; health operations are unauthenticated and expose
no data or secret detail.

## Operation Index

| Action | Operation ID           | Method/path                      | Caller                      | Detailed packet                                                       |
| ------ | ---------------------- | -------------------------------- | --------------------------- | --------------------------------------------------------------------- |
| ADD    | `getLiveness`          | `GET /health/live`               | local runner/operator       | [Liveness](#add-getliveness--get-healthlive)                          |
| ADD    | `getReadiness`         | `GET /health/ready`              | local runner/operator       | [Readiness](#add-getreadiness--get-healthready)                       |
| ADD    | `ingestTelemetryBatch` | `POST /api/v1/event-batches`     | configured FERRET CLI       | [Batch ingestion](#add-ingesttelemetrybatch--post-apiv1event-batches) |
| ADD    | `listEvents`           | `GET /api/v1/events`             | local script/future adapter | [Raw events](#add-listevents--get-apiv1events)                        |
| ADD    | `getUsageAnalytics`    | `GET /api/v1/analytics/usage`    | local script/future adapter | [Usage](#add-getusageanalytics--get-apiv1analyticsusage)              |
| ADD    | `getOutcomeAnalytics`  | `GET /api/v1/analytics/outcomes` | local script/future adapter | [Outcomes](#add-getoutcomeanalytics--get-apiv1analyticsoutcomes)      |
| ADD    | `getCapabilities`      | `GET /api/v1/capabilities`       | local script/future adapter | [Capabilities](#add-getcapabilities--get-apiv1capabilities)           |

## Shared Schemas and Errors

`Problem` has exactly `type` (stable URN), `title`, `status`, `code`, `requestId`, and optional `field` (safe
schema field name) plus `retryAfterSeconds`. It never includes token, request body, event payload, SQL,
exception text, path, username, or stack trace. Error media type is `application/problem+json`.

```json
{
  "type": "urn:ferret:error:unauthorized",
  "title": "Authentication required",
  "status": 401,
  "code": "unauthorized",
  "requestId": "b91ba6c1-5313-43bb-a58d-4c2098e934fe"
}
```

Common failures are `400 invalid_request`, `401 unauthorized`, `403 forbidden`, `413 payload_too_large`,
`415 unsupported_media_type`, `422 validation_failed`, `500 internal_error`, and `503 not_ready`/
`storage_unavailable`. A retryable `503` may include `Retry-After` and matching bounded
`retryAfterSeconds`. Plan 02 applies no server-side rate limit on its loopback-only, single-user surface; the
future cloud plan selects an authenticated rate policy. The CLI still handles `429` from a future compatible
deployment or an E2E fault server.

Every query cursor is base64url-without-padding compact JSON plus HMAC-SHA-256. Its common signed members, in
canonical order, are `version`, `endpoint`, `filterDigest`, `limit`, `pruneEpoch`, `watermark`, and `lastKey`.
Event/aggregate watermark is `{ingestedAt,eventId}`; capability watermark is `{ingestedAt,snapshotId}`. Raw
event `lastKey` is `{occurredAt,eventId}`. Usage `lastKey` is `{eventCount,dimensions}`. Outcome `lastKey` is
`{totalOutcomeCount,dimensions}`. Capability `lastKey` is
`{installationId,harness,harnessVersion,capability}`. Dimensions are in requested group order, with explicit
nulls. A valid signed cursor whose epoch differs from current `telemetry_state.prune_epoch` returns
`409 cursor_invalidated`; malformed/tampered/filter-boundary failures remain `400 invalid_cursor`.

Canonical `Event` matches Plan 01 schema `1.0` exactly. All strings are length-bounded; `additionalProperties`
is false. Event examples below abbreviate neither required fields nor forbidden fields.

```json
{
  "schemaVersion": "1.0",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "eventHash": "199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c",
  "occurredAt": "2026-09-18T08:15:30.123Z",
  "capturedAt": "2026-09-18T08:15:30.130Z",
  "harness": "claude_code",
  "harnessVersion": "1.0.123",
  "installationId": "00000000-0000-4000-8000-000000000002",
  "workspaceId": "ws_327b250d010590da40f0f76d18da910a",
  "sessionId": "ss_d0de260ca18a8379984031556b2d43ac",
  "parentSessionId": null,
  "eventType": "tool.completed",
  "agentName": null,
  "skillName": null,
  "toolName": "Read",
  "outcome": "success",
  "durationMs": 27,
  "subjectVisibility": "observed",
  "outcomeVisibility": "observed",
  "durationVisibility": "observed"
}
```

Canonical `CapabilitySnapshot` also matches Plan 01 schema `1.0` exactly, including `installationId`, the
closed capability/state/source vocabularies, sorted unique items, and the fixed snapshot hash vector. The REST
contract references the same component from ingestion ACK and capability-query tests; it does not substitute a
server-created documentation source.

## ADD `getLiveness` — `GET /health/live`

**Owner/caller:** FastAPI inbound adapter; local process supervisor. **Authentication/authorization:** none;
no principal/context. **Request:** no body; no query/path parameters; `Accept: application/json` optional. Other
media/body content is ignored only as standard GET semantics permit; no credentials are read.

**Success:** `200 application/json`; exact body below. It proves only that the process event loop can answer.

```json
{
  "status": "live"
}
```

**Failures:** standard router `405 method_not_allowed` for a non-GET method; `500 internal_error` only when the
handler cannot create the minimal response. It never checks or
reveals PostgreSQL, migration, token, file, version, hostname, or environment state. **Validation/idempotency/
concurrency/pagination/rate:** safe/idempotent GET; no pagination or local rate limit; concurrent requests do
not mutate state. **Cache/privacy/logging:** `no-store`; access log records method/path/status/request ID only,
not headers. **Contract effects:** ADD one public OpenAPI operation and `HealthLive` schema. **Compatibility/
rollout/rollback:** add before runner health wiring; older clients have no dependency. Revert runner check before
removing route. **Scenarios:** [API-LIVE scenarios](#scenarios-api-live) →
`specs/apps/ferret/be/behaviours/operations/health-migrations-pruning-and-storage.feature`; Unit + E2E, Integration
exempt because liveness intentionally touches no real resource.

## ADD `getReadiness` — `GET /health/ready`

**Owner/caller:** FastAPI adapter; local runner/operator. **Authentication/authorization:** none; response is
deliberately non-sensitive. **Request:** no body or query/path parameter; optional JSON Accept.

**Success:** `200 application/json` only after configured token file is readable, PostgreSQL connection/query
succeeds, expected Alembic head is present, and application startup checks pass.

```json
{
  "status": "ready"
}
```

**Failures:** `503 application/problem+json` with code `not_ready`; all causes share the same public body.

```json
{
  "type": "urn:ferret:error:not_ready",
  "title": "Service is not ready",
  "status": 503,
  "code": "not_ready",
  "requestId": "e85b138e-4eae-472c-b971-b3ee287f0ba0",
  "retryAfterSeconds": 2
}
```

**Validation/idempotency/concurrency/pagination/rate:** idempotent GET, finite database timeout, no mutation,
no pagination or local rate limit. **Cache/privacy/logging:** no-store; server logs categorize readiness cause
with closed safe codes, never DSN/token/SQL/exception. **Contract effects:** ADD `HealthReady`; readiness is not
an `/api/v1` authorization oracle. **Compatibility/rollout/rollback:** migrations/token exist before runner
requires readiness; rollback restores previous runner config before route removal. **Scenarios:**
[API-READY scenarios](#scenarios-api-ready) → operations feature; Unit + Integration + E2E.

## ADD `ingestTelemetryBatch` — `POST /api/v1/event-batches`

**Owner/caller:** REST adapter mapping to `IngestTelemetryBatch`; configured CLI only. **Authentication/
authorization:** bearer token → local principal with `events:write`; failure is identical for missing, malformed,
or wrong token. **Headers:** required `Authorization`, `Content-Type: application/json`, and `X-Request-ID`
UUIDv4; optional `Accept: application/json`. Body limit is 1,048,576 bytes before JSON parsing.

**Request:** exact top-level fields, `additionalProperties: false`; `batchId` UUIDv4; `events` 0–500 canonical
events and `capabilitySnapshots` 0–100 canonical snapshots, with at least one total record and at most 500 total
records. Both record types must be structurally valid; domain violations that require existing-state or time
evaluation are item rejections. This is the only Plan 02 synchronization family; automatic lifecycle capture
still reaches it through CLI REST, never GraphQL or MCP.

```json
{
  "batchId": "00000000-0000-4000-8000-000000000003",
  "events": [
    {
      "schemaVersion": "1.0",
      "eventId": "00000000-0000-4000-8000-000000000001",
      "eventHash": "199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c",
      "occurredAt": "2026-09-18T08:15:30.123Z",
      "capturedAt": "2026-09-18T08:15:30.130Z",
      "harness": "claude_code",
      "harnessVersion": "1.0.123",
      "installationId": "00000000-0000-4000-8000-000000000002",
      "workspaceId": "ws_327b250d010590da40f0f76d18da910a",
      "sessionId": "ss_d0de260ca18a8379984031556b2d43ac",
      "parentSessionId": null,
      "eventType": "tool.completed",
      "agentName": null,
      "skillName": null,
      "toolName": "Read",
      "outcome": "success",
      "durationMs": 27,
      "subjectVisibility": "observed",
      "outcomeVisibility": "observed",
      "durationVisibility": "observed"
    }
  ],
  "capabilitySnapshots": [
    {
      "schemaVersion": "1.0",
      "snapshotId": "00000000-0000-4000-8000-000000000004",
      "snapshotHash": "6d3ccc88afa715385e7b04aa0056e1455ae679906354d18bc5d0113c474a6590",
      "capturedAt": "2026-09-18T08:00:00.000Z",
      "harness": "codex",
      "harnessVersion": "1.2.3",
      "installationId": "00000000-0000-4000-8000-000000000002",
      "capabilities": [
        { "name": "session_lifecycle", "state": "observed", "source": "official_hook" },
        { "name": "skill_invocation", "state": "unknown", "source": "unavailable" }
      ]
    }
  ]
}
```

**Success:** `200 application/json`; `eventItems` and `capabilityItems` separately preserve request order and
cardinality. Status is `accepted`, `duplicate`, or `rejected`; rejected requires a safe `errorCode`, other
statuses require null. Counts must sum to total records.

```json
{
  "requestId": "9d72dc32-3804-44e8-9319-2e0caa2f9cec",
  "batchId": "00000000-0000-4000-8000-000000000003",
  "eventItems": [
    {
      "eventId": "00000000-0000-4000-8000-000000000001",
      "eventHash": "199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c",
      "status": "accepted",
      "errorCode": null
    }
  ],
  "capabilityItems": [
    {
      "snapshotId": "00000000-0000-4000-8000-000000000004",
      "snapshotHash": "6d3ccc88afa715385e7b04aa0056e1455ae679906354d18bc5d0113c474a6590",
      "status": "accepted",
      "errorCode": null
    }
  ],
  "acceptedCount": 2,
  "duplicateCount": 0,
  "rejectedCount": 0
}
```

**Failures:** request-level `400 invalid_request` for malformed request ID/JSON, `401 unauthorized`,
`403 forbidden`, `413 payload_too_large`, `415 unsupported_media_type`, `422 validation_failed` for structural
schema/cardinality errors, `409 batch_id_conflict` when a batch ID is replayed with a different canonical hash,
`503 storage_unavailable`, `500 internal_error`. Existing-state/domain item failures use
HTTP 200 plus `rejected` codes `invalid_event`, `event_id_conflict`, or `unsupported_schema`; no partial response
on transaction failure.

**Hashing/idempotency/replay/concurrency:** the server first validates and recomputes each Event and
CapabilitySnapshot digest by Plan 01's language-neutral algorithm and rejects a mismatched client digest. It
then canonicalizes the request as UTF-8 compact JSON with fixed top-level order `batchId`, `events`,
`capabilitySnapshots`, preserving array order and embedding the canonical record objects including their digest;
SHA-256 lowercase hex is the request hash. The fixed example request above has request hash
`11f2def84a7bed16b251cfd467e46a7f0338bde41cb5bc2d516a4a97d8008568`. Python and TypeScript execute the same
bytes/digest fixture. `batchId`, not `X-Request-ID`, is the replay identity. Same batch ID and same recomputed
request hash returns the exact stored ordered JSON result, including the original body `requestId`; the current
HTTP response header still carries the current transport request ID. Same batch ID with a different hash returns
`409 batch_id_conflict`. Reusing an `X-Request-ID` with another batch has no idempotency effect. Independently,
same record ID/hash is duplicate and same ID/different hash is item
conflict. Concurrent batches serialize through unique constraints/transaction retry and yield one accepted plus
duplicates, never two rows. **Rate/validation:** no local rate limit; top/body/item bounds above;
occurred/captured timestamp and
name/enum/privacy rules match Plan 01. **Cache/privacy/logging:** no-store; body/token/events never logged;
metrics use status/count/latency only with no event/name/workspace labels. **Contract effects:** ADD request,
event, ACK, result, and problem components; CLI hand-writes urllib calls validated by fixtures. **Compatibility/
rollout/rollback:** deploy migration/backend before enabling CLI sync; old standalone CLI unaffected. Disable CLI
sync before route rollback. **Scenarios:** [API-BATCH scenarios](#scenarios-api-batch) →
`specs/apps/ferret/be/behaviours/ingestion/event-batch.feature`; Unit + Integration + E2E for every scenario.

## ADD `listEvents` — `GET /api/v1/events`

**Owner/caller:** REST adapter → `ListEvents`; local scripts/future adapters. **Authentication/authorization:**
bearer with `events:read`. **Headers:** required Authorization; JSON Accept optional. **Query:** required `from`
and `to` UTC instants (`from` inclusive, `to` exclusive), maximum range 90 days; optional closed filters
`harness`, `workspaceId`, `eventType`, `agentName`, `skillName`, `toolName`, `outcome`,
`subjectVisibility`, `outcomeVisibility`, `durationVisibility`; `limit`
default 100, 1–500; optional opaque `cursor`. Repeated unknown parameters are rejected. A cursor carries version,
endpoint, the first-page maximum `(ingestedAt,eventId)` watermark, current `pruneEpoch`, full last result sort
key, limit, and filter digest protected by HMAC; changing any filter/time/limit invalidates it.

**Request example:**

```http
GET /api/v1/events?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&harness=claude_code&eventType=skill.invoked&limit=100 HTTP/1.1
Host: 127.0.0.1:8601
Authorization: Bearer <redacted>
Accept: application/json
```

**Success:** `200`; descending `(occurredAt,eventId)` order; each canonical event adds server `ingestedAt` and
contains no internal batch/database fields. `nextCursor` is null at end.

```json
{
  "items": [
    {
      "schemaVersion": "1.0",
      "eventId": "00000000-0000-4000-8000-000000000001",
      "eventHash": "199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c",
      "occurredAt": "2026-09-18T08:15:30.123Z",
      "capturedAt": "2026-09-18T08:15:30.130Z",
      "ingestedAt": "2026-09-18T08:16:00.000Z",
      "harness": "claude_code",
      "harnessVersion": "1.0.123",
      "installationId": "00000000-0000-4000-8000-000000000002",
      "workspaceId": "ws_327b250d010590da40f0f76d18da910a",
      "sessionId": "ss_d0de260ca18a8379984031556b2d43ac",
      "parentSessionId": null,
      "eventType": "skill.invoked",
      "agentName": null,
      "skillName": "plan-creating-project-plans",
      "toolName": null,
      "outcome": "not_applicable",
      "durationMs": null,
      "subjectVisibility": "observed",
      "outcomeVisibility": "not_applicable",
      "durationVisibility": "not_applicable"
    }
  ],
  "nextCursor": null
}
```

**Failures:** `400 invalid_filter`/`invalid_cursor`, `409 cursor_invalidated`, `401`, `403`, `503`, `500`. Empty valid range returns 200
with empty items. No local rate limit applies. **Pagination/concurrency:** every page constrains
`(ingestedAt,eventId)` to the first-page watermark, so any concurrent insert—including a backdated event—is
excluded until a new traversal. Every page also compares the cursor prune epoch with current state; an execute-
prune increments the epoch atomically and invalidates all older cursors instead of promising retained rows. No
total count. **Cache/privacy/logging:**
no-store; filters and token excluded from access
logs/metrics; event output is closed metadata. **Contract effects:** ADD filter/cursor/page schemas. **Compatibility/
rollout/rollback:** read route starts after schema readiness; removing it does not affect ingestion, but future
consumers must be inventoried before rollback. **Scenarios:** [API-EVENTS scenarios](#scenarios-api-events) → raw
events feature; Unit + Integration + E2E.

## ADD `getUsageAnalytics` — `GET /api/v1/analytics/usage`

**Owner/caller:** REST adapter → `SummarizeUsage`; scripts/future dashboard/MCP adapter. **Authentication/
authorization:** bearer with `analytics:read`. **Query:** required inclusive `from` and exclusive `to`, max 90
days; optional event filters shared with `listEvents`; required repeated/comma-normalized `groupBy` with 1–3
unique values from `harness`, `workspace`, `event_type`, `agent`, `skill`, `tool`, `outcome`,
`subject_visibility`;
`limit` default 100/max 500 and optional signed filter-bound cursor. No arbitrary field/expression/order.

```http
GET /api/v1/analytics/usage?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=harness%2Cskill&limit=100 HTTP/1.1
Host: 127.0.0.1:8601
Authorization: Bearer <redacted>
Accept: application/json
```

**Success:** `200`; rows ordered by count descending then canonical dimension values. Null dimension values and
each subject-visibility state are explicit, never omitted or converted to zero.

```json
{
  "from": "2026-09-01T00:00:00.000Z",
  "to": "2026-10-01T00:00:00.000Z",
  "groupBy": ["harness", "skill"],
  "rows": [
    {
      "dimensions": [
        { "name": "harness", "value": "claude_code" },
        { "name": "skill", "value": "plan-creating-project-plans" }
      ],
      "eventCount": 14,
      "observedSubjectCount": 14,
      "derivedSubjectCount": 0,
      "unknownSubjectCount": 0,
      "notApplicableSubjectCount": 0
    }
  ],
  "nextCursor": null,
  "interpretation": "Operational usage only; unknown visibility is not zero usage."
}
```

**Failures:** `400 invalid_filter`/`invalid_group`/`invalid_cursor`, `409 cursor_invalidated`, `401`, `403`, `503`, `500`; no local rate limit.
**Validation/pagination/concurrency:** bounded dimensions/range; signed keyset over deterministic aggregate order;
the cursor carries the first-page ingestion watermark and prune epoch. Every aggregate page excludes later
writes, including backdated events. A new traversal sees them. An execute-prune increments the epoch and a later
page returns `409 cursor_invalidated`, because recomputing groups after deletion could reorder them. No total group count. **Cache/privacy/
logging:** no-store; no prompt/content; group values are metadata but excluded from metrics labels/logs.
**Contract effects:** ADD usage query/row/dimension/page components. **Compatibility/rollout/rollback:** add after
query indexes benchmarked; remove only after consumer inventory. **Scenarios:**
[API-USAGE scenarios](#scenarios-api-usage) → analytics feature; Unit + Integration + E2E.

## ADD `getOutcomeAnalytics` — `GET /api/v1/analytics/outcomes`

**Owner/caller:** REST adapter → `SummarizeOutcomes`. **Authentication/authorization:** bearer with
`analytics:read`. **Request:** same range/filter/group/cursor/limit rules as usage; groupBy excludes `outcome`
because outcomes are fixed measures and permits 1–3 of `harness`, `workspace`, `event_type`, `agent`, `skill`,
`tool`, `outcome_visibility`.

```http
GET /api/v1/analytics/outcomes?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=harness%2Ctool HTTP/1.1
Host: 127.0.0.1:8601
Authorization: Bearer <redacted>
Accept: application/json
```

**Success:** `200`; fixed outcome counts include zeros only for groups proven by rows; duration statistics use
observed non-null values only and are null when no qualifying value exists.

```json
{
  "from": "2026-09-01T00:00:00.000Z",
  "to": "2026-10-01T00:00:00.000Z",
  "groupBy": ["harness", "tool"],
  "rows": [
    {
      "dimensions": [
        { "name": "harness", "value": "claude_code" },
        { "name": "tool", "value": "Read" }
      ],
      "successCount": 9,
      "failureCount": 1,
      "cancelledCount": 0,
      "unknownCount": 2,
      "notApplicableCount": 0,
      "outcomeVisibilityCounts": {
        "observed": 10,
        "derived": 0,
        "unknown": 2,
        "notApplicable": 0
      },
      "durationVisibilityCounts": {
        "observed": 10,
        "derived": 0,
        "unknown": 2,
        "notApplicable": 0
      },
      "observedDurationCount": 10,
      "durationMs": { "min": 4, "median": 18, "p95": 41, "max": 44 }
    }
  ],
  "nextCursor": null,
  "interpretation": "Operational correlation only; this is not semantic quality or causal attribution."
}
```

**Failures/validation/pagination/rate/concurrency:** same as usage, including `409 cursor_invalidated` after an
execute-prune, with `invalid_group` for outcome group and no
local rate limit. The
nearest-rank percentile rule is documented in schema description. **Cache/privacy/logging:** no-store; no names
in metrics/log labels; fixed interpretation required. **Contract effects:** ADD outcome/duration components.
**Compatibility/rollout/rollback:** as usage. **Scenarios:**
[API-OUTCOMES scenarios](#scenarios-api-outcomes) → analytics feature; Unit + Integration + E2E.

## ADD `getCapabilities` — `GET /api/v1/capabilities`

**Owner/caller:** REST adapter → `ListCapabilities`; scripts/future adapters. **Authentication/authorization:**
bearer with `capabilities:read`. **Query:** optional `installationId`, `harness`, `harnessVersion`, `capability`,
`state`; `limit`
default 100/max 200; optional signed filter-bound cursor. Values use closed harness/state/capability vocabularies;
version is safe bounded text.

```http
GET /api/v1/capabilities?harness=codex&limit=100 HTTP/1.1
Host: 127.0.0.1:8601
Authorization: Bearer <redacted>
Accept: application/json
```

**Success:** `200`; unique stable `(installationId,harness,harnessVersion,capability)` order; state is `observed`, `derived`, or
`unknown`. `source` and `capturedAt` come from the latest synchronized immutable snapshot for that
installation/harness/version/name; the server does not invent documentation provenance.

```json
{
  "items": [
    {
      "installationId": "00000000-0000-4000-8000-000000000002",
      "harness": "codex",
      "harnessVersion": "1.2.3",
      "capability": "skill_invocation",
      "state": "unknown",
      "source": "unavailable",
      "capturedAt": "2026-09-18T08:00:00.000Z"
    }
  ],
  "nextCursor": null,
  "interpretation": "Unknown means unavailable visibility, not zero usage."
}
```

**Failures:** `400 invalid_filter`/`invalid_cursor`, `409 cursor_invalidated`, `401`, `403`, `503`, `500`. Empty valid filter is
200 empty. **Pagination/concurrency:** the signed cursor contains prune epoch, capability watermark
`(ingestedAt,snapshotId)`, and the complete last response key. Restrict eligible snapshots to that watermark,
then select latest by `(capturedAt DESC,snapshotId DESC)` per
`(installationId,harness,harnessVersion,capability)` before applying the response keyset. Later snapshots appear
only on a new traversal; execute-prune invalidates the cursor. **Cache/
privacy/logging:** no-store; version/capability filters excluded from metrics labels; no internal evidence path.
**Contract effects:** ADD capability item/page. **Compatibility/rollout/rollback:** add after capability
persistence; removing it does not alter event ingestion. **Scenarios:**
[API-CAPABILITIES scenarios](#scenarios-api-capabilities) → analytics feature; Unit + Integration + E2E.

## Detailed API Scenario Catalog

Each scenario below is copied verbatim in behaviour (allowing only repository language/style normalization) to
the named owner feature and receives the layer dispositions stated in its operation packet.

### Scenarios API-LIVE

```gherkin
Scenario: API-LIVE-01 Report process liveness without data disclosure
  Given the FERRET backend process can serve requests
  When a caller requests GET /health/live without credentials
  Then the response is 200 with only status live
  And the response is not cacheable
  And no database, token, host, version, or environment detail is returned
```

### Scenarios API-READY

```gherkin
Scenario: API-READY-01 Report ready only after local dependencies pass
  Given the token file, PostgreSQL connection, and expected migration head are available
  When a caller requests GET /health/ready without credentials
  Then the response is 200 with only status ready
  And the response is not cacheable

Scenario Outline: API-READY-02 Hide a readiness failure cause
  Given readiness fails because <cause>
  When a caller requests GET /health/ready
  Then the response is 503 with code not_ready
  And no connection, migration, token, path, or exception detail is returned

Examples:
  | cause |
  | PostgreSQL is unavailable |
  | the schema is behind |
  | the schema is ahead |
  | the token file is unreadable |
```

### Scenarios API-BATCH

```gherkin
Scenario: API-BATCH-01 Accept an authenticated new batch
  Given a bearer principal has events write scope
  And the request contains new structurally valid canonical events
  When the caller posts the batch with a unique batch ID
  Then the response is 200 with one accepted item per event in request order
  And PostgreSQL contains each event exactly once

Scenario: API-BATCH-02 Replay the same batch identity and content
  Given an authenticated batch ID and canonical request hash were committed
  When the same batch ID and content are submitted with a different transport request ID
  Then the response repeats the byte-equivalent stored ordered result
  And the response header carries the current transport request ID
  And the response body retains the original response request ID
  And no second event row is created

Scenario: API-BATCH-03 Reject a batch ID replay with different content
  Given an authenticated batch ID and request hash were committed
  When that batch ID is submitted with a different canonical body
  Then the response is 409 with code batch_id_conflict
  And stored events remain unchanged

Scenario: API-BATCH-04 Return mixed per-event statuses
  Given an authenticated batch contains a new event, an identical duplicate, and an event ID hash conflict
  When the caller posts the batch
  Then the response is 200 with accepted, duplicate, and rejected items in request order
  And the rejected item has only the event_id_conflict safe code

Scenario: API-BATCH-05 Synchronize a versioned capability snapshot
  Given an authenticated batch contains the Plan 01 capability snapshot fixed vector
  When the caller posts the batch
  Then the server recomputes and accepts the snapshot hash
  And the ordered capability acknowledgement matches the snapshot ID and hash
  And capability queries preserve each state and source without server-invented provenance

Scenario Outline: API-BATCH-06 Reject an invalid request without disclosure
  Given the caller submits <condition>
  When the event-batch route handles the request
  Then it returns the documented request-level problem
  And no token, request body, event content, SQL, or exception is returned or logged

Examples:
  | condition |
  | no bearer token |
  | a wrong bearer token |
  | a non-JSON media type |
  | more than 1 MiB |
  | more than 500 events |
  | an unknown event property |

Scenario: API-BATCH-07 Reject a client digest that does not match canonical bytes
  Given an authenticated event has valid fields and an altered event hash
  When the caller posts the batch
  Then the server returns rejected with code invalid_event
  And no event or capability row is committed for that record
  And the safe batch audit records only the rejection code and recomputed digest
```

### Scenarios API-EVENTS

```gherkin
Scenario: API-EVENTS-01 Traverse a filtered event result
  Given authenticated raw-event access and events matching multiple pages
  When the caller follows cursors with unchanged filters
  Then each matching event appears exactly once in descending occurred-time and event-ID order
  And the final next cursor is null

Scenario Outline: API-EVENTS-02 Reject unsafe query input
  Given the caller is authenticated
  When the caller supplies <input>
  Then the response is 400 with the documented safe code
  And no query or storage detail is disclosed

Examples:
  | input |
  | an invalid UTC range |
  | a range longer than 90 days |
  | an unknown filter |
  | a page size above 500 |
  | a tampered cursor |
  | a cursor with changed filters |

Scenario: API-EVENTS-03 Protect raw data from an unauthenticated caller
  Given events exist in PostgreSQL
  When a caller without the matching token requests raw events
  Then the response is 401 with the generic unauthorized problem
  And no count, filter validity, event field, or token detail is disclosed

Scenario: API-EVENTS-04 Invalidate a traversal after explicit prune
  Given an authenticated caller holds an event cursor from the current prune epoch
  When an execute-prune commits before the caller requests the next page
  Then the response is 409 with code cursor_invalidated
  And the caller must begin a new traversal
```

### Scenarios API-USAGE

```gherkin
Scenario: API-USAGE-01 Group usage while preserving unknown visibility
  Given authenticated analytics access and observed and unknown event visibility
  When the caller groups usage by harness and skill
  Then the response returns deterministic grouped counts
  And unknown counts remain explicit rather than becoming zero observed usage
  And the operational-usage interpretation is present

Scenario Outline: API-USAGE-02 Reject an invalid usage query
  Given the caller is authenticated
  When groupBy contains <condition>
  Then the response is 400 with code invalid_group
  And no event or SQL detail is disclosed

Examples:
  | condition |
  | no dimension |
  | more than three dimensions |
  | a repeated dimension |
  | an unknown dimension |

Scenario: API-USAGE-03 Invalidate grouped traversal after explicit prune
  Given an authenticated caller holds a usage cursor from the current prune epoch
  When an execute-prune commits before the caller requests the next group page
  Then the response is 409 with code cursor_invalidated
  And no recomputed group is returned under the stale cursor
```

### Scenarios API-OUTCOMES

```gherkin
Scenario: API-OUTCOMES-01 Summarize operational outcomes honestly
  Given authenticated analytics access and mixed observed and unknown outcomes
  When the caller groups outcomes by harness and tool
  Then every fixed outcome bucket is returned for each proven group
  And duration statistics use only observed non-null durations
  And the response states that results are neither semantic quality nor causal attribution

Scenario: API-OUTCOMES-02 Reject outcome as a grouping dimension
  Given the caller is authenticated
  When the caller requests outcome in groupBy
  Then the response is 400 with code invalid_group
  And no aggregate or storage detail is disclosed

Scenario: API-OUTCOMES-03 Invalidate outcome traversal after explicit prune
  Given an authenticated caller holds an outcome cursor from the current prune epoch
  When an execute-prune commits before the caller requests the next group page
  Then the response is 409 with code cursor_invalidated
  And no recomputed group is returned under the stale cursor
```

### Scenarios API-CAPABILITIES

```gherkin
Scenario: API-CAPABILITIES-01 Return tri-state capability evidence
  Given authenticated capability access and multiple harness capability states
  When the caller filters by harness
  Then the response returns observed, derived, or unknown for each matching capability
  And unknown is explained as unavailable visibility rather than zero usage

Scenario: API-CAPABILITIES-02 Traverse capabilities by installation at a fixed watermark
  Given two installations share the same harness version and capability name
  And a later snapshot is committed after the first page watermark
  When the caller follows the capability cursor
  Then each eligible installation capability appears exactly once in full logical-key order
  And the later snapshot appears only in a new traversal

Scenario: API-CAPABILITIES-03 Protect capabilities from an unauthenticated caller
  Given capability rows exist
  When a caller without the matching token requests capabilities
  Then the response is 401 with the generic unauthorized problem
  And no harness version or capability state is disclosed

Scenario: API-CAPABILITIES-04 Invalidate a capability traversal after explicit prune
  Given an authenticated caller holds a capability cursor from the current prune epoch
  When an execute-prune commits before the next page
  Then the response is 409 with code cursor_invalidated
  And the caller must begin a new traversal
```

## Illustrative Wire Calls (Not Acceptance Evidence)

Delivery creates `local-tmp/ferret-api/curl-auth.conf` with mode `0600` through a safe `ferret-be token
write-curl-config` management command; the command reads the token file and never prints the token. It also
creates a synthetic batch at `local-tmp/ferret-api/batch.json`. Both paths are ignored and removed after the
test. Run the following literal recipes from the repository root, recording headers/body separately under the
ignored plan evidence directory. Replace neither the URL nor authentication with a browser/client abstraction.

Liveness success and readiness success/failure (the runner fixture stops PostgreSQL before the failure call):

```bash
rtk curl --silent --show-error --fail-with-body --dump-header local-tmp/ferret-api/live.headers --output local-tmp/ferret-api/live.json http://127.0.0.1:8601/health/live
rtk curl --silent --show-error --fail-with-body --dump-header local-tmp/ferret-api/ready.headers --output local-tmp/ferret-api/ready.json http://127.0.0.1:8601/health/ready
rtk curl --silent --show-error --dump-header local-tmp/ferret-api/not-ready.headers --output local-tmp/ferret-api/not-ready.json http://127.0.0.1:8601/health/ready
```

Batch success, duplicate replay, wrong-token failure, and structural failure:

```bash
rtk curl --silent --show-error --fail-with-body --config local-tmp/ferret-api/curl-auth.conf --header 'Content-Type: application/json' --header 'X-Request-ID: 9d72dc32-3804-44e8-9319-2e0caa2f9cec' --data-binary @local-tmp/ferret-api/batch.json --dump-header local-tmp/ferret-api/batch.headers --output local-tmp/ferret-api/batch.json.out http://127.0.0.1:8601/api/v1/event-batches
rtk curl --silent --show-error --fail-with-body --config local-tmp/ferret-api/curl-auth.conf --header 'Content-Type: application/json' --header 'X-Request-ID: 9d72dc32-3804-44e8-9319-2e0caa2f9cec' --data-binary @local-tmp/ferret-api/batch.json --dump-header local-tmp/ferret-api/batch-replay.headers --output local-tmp/ferret-api/batch-replay.json http://127.0.0.1:8601/api/v1/event-batches
rtk curl --silent --show-error --header 'Authorization: Bearer intentionally-wrong-test-token' --header 'Content-Type: application/json' --header 'X-Request-ID: 21903be2-800f-4df1-9edc-48a95eca93e1' --data-binary @local-tmp/ferret-api/batch.json --dump-header local-tmp/ferret-api/batch-unauthorized.headers --output local-tmp/ferret-api/batch-unauthorized.json http://127.0.0.1:8601/api/v1/event-batches
rtk curl --silent --show-error --config local-tmp/ferret-api/curl-auth.conf --header 'Content-Type: application/json' --header 'X-Request-ID: 2e2bfca4-a843-4d50-8525-41fb590db9c9' --data-binary @local-tmp/ferret-api/invalid-batch.json --dump-header local-tmp/ferret-api/batch-invalid.headers --output local-tmp/ferret-api/batch-invalid.json.out http://127.0.0.1:8601/api/v1/event-batches
```

Raw-event first page, next page, invalid cursor/filter binding, and missing-token failure:

```bash
rtk curl --silent --show-error --fail-with-body --config local-tmp/ferret-api/curl-auth.conf --dump-header local-tmp/ferret-api/events.headers --output local-tmp/ferret-api/events.json 'http://127.0.0.1:8601/api/v1/events?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&harness=claude_code&limit=1'
rtk node -e 'const fs=require("fs");process.stdout.write(JSON.parse(fs.readFileSync("local-tmp/ferret-api/events.json","utf8")).nextCursor)' > local-tmp/ferret-api/events.cursor
rtk curl --silent --show-error --fail-with-body --config local-tmp/ferret-api/curl-auth.conf --get --data-urlencode 'from=2026-09-01T00:00:00.000Z' --data-urlencode 'to=2026-10-01T00:00:00.000Z' --data-urlencode 'harness=claude_code' --data-urlencode 'limit=1' --data-urlencode cursor@local-tmp/ferret-api/events.cursor --dump-header local-tmp/ferret-api/events-next.headers --output local-tmp/ferret-api/events-next.json http://127.0.0.1:8601/api/v1/events
rtk curl --silent --show-error --config local-tmp/ferret-api/curl-auth.conf --get --data-urlencode 'from=2026-09-01T00:00:00.000Z' --data-urlencode 'to=2026-10-01T00:00:00.000Z' --data-urlencode 'harness=codex' --data-urlencode 'limit=1' --data-urlencode cursor@local-tmp/ferret-api/events.cursor --dump-header local-tmp/ferret-api/events-bad-cursor.headers --output local-tmp/ferret-api/events-bad-cursor.json http://127.0.0.1:8601/api/v1/events
rtk curl --silent --show-error --dump-header local-tmp/ferret-api/events-unauthorized.headers --output local-tmp/ferret-api/events-unauthorized.json 'http://127.0.0.1:8601/api/v1/events?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z'
```

Usage, outcomes, and capabilities success plus invalid/unauthorized cases:

```bash
rtk curl --silent --show-error --fail-with-body --config local-tmp/ferret-api/curl-auth.conf --dump-header local-tmp/ferret-api/usage.headers --output local-tmp/ferret-api/usage.json 'http://127.0.0.1:8601/api/v1/analytics/usage?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=harness%2Cskill'
rtk curl --silent --show-error --config local-tmp/ferret-api/curl-auth.conf --dump-header local-tmp/ferret-api/usage-invalid.headers --output local-tmp/ferret-api/usage-invalid.json 'http://127.0.0.1:8601/api/v1/analytics/usage?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=harness%2Charness'
rtk curl --silent --show-error --fail-with-body --config local-tmp/ferret-api/curl-auth.conf --dump-header local-tmp/ferret-api/outcomes.headers --output local-tmp/ferret-api/outcomes.json 'http://127.0.0.1:8601/api/v1/analytics/outcomes?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=harness%2Ctool'
rtk curl --silent --show-error --config local-tmp/ferret-api/curl-auth.conf --dump-header local-tmp/ferret-api/outcomes-invalid.headers --output local-tmp/ferret-api/outcomes-invalid.json 'http://127.0.0.1:8601/api/v1/analytics/outcomes?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=outcome'
rtk curl --silent --show-error --fail-with-body --config local-tmp/ferret-api/curl-auth.conf --dump-header local-tmp/ferret-api/capabilities.headers --output local-tmp/ferret-api/capabilities.json 'http://127.0.0.1:8601/api/v1/capabilities?harness=codex&limit=100'
rtk curl --silent --show-error --dump-header local-tmp/ferret-api/capabilities-unauthorized.headers --output local-tmp/ferret-api/capabilities-unauthorized.json 'http://127.0.0.1:8601/api/v1/capabilities?harness=codex'
```

For every command, assert the documented status, `Content-Type`, `Cache-Control`, `X-Request-ID`, exact schema,
row/ACK effects, redaction, and cursor/interpretation semantics with repository-approved tooling. Also verify:

- live 200 and ready 200/503;
- batch accepted, duplicate, `batch_id_conflict`, mixed item results, missing/wrong token, malformed request ID,
  invalid schema, 413, and backend unavailable behaviour from the CLI;
- raw events first/next/final page, every filter family, empty set, tampered/filter-mismatch cursor, 401;
- usage/outcomes valid groupings, invalid grouping/range/cursor, unknown handling, interpretation text, 401;
- capabilities observed/derived/unknown, empty filter, cursor, and 401.

The API Quality Gate must report `final-status: pass` and Rule-16 exploratory testing must retest every fixed API
defect before archival. Store no bearer value or full event body in evidence; use `<redacted>` placeholders and
synthetic IDs.

## Mandatory Self-contained Manual Packets

The grouped examples above are orientation only. Delivery must add these exact ignored helpers:

- `apps/ferret-be-e2e/src/manual/setup.ts --profile <name> --reset` starts the pinned local stack, applies
  migrations, creates a temporary token/curl config, and seeds only deterministic synthetic records for that
  profile;
- `apps/ferret-be-e2e/src/manual/fault.ts` applies/reverts a named local fault;
- `apps/ferret-be-e2e/src/manual/assert-response.ts` validates status, media type, `no-store`, request ID,
  exact JSON schema, redaction, and declared PostgreSQL side effects through the management CLI;
- `apps/ferret-be-e2e/src/manual/cleanup.ts --profile <name>` stops the stack, removes its synthetic volume and
  `local-tmp/ferret-api/<name>/`, and fails if a process/volume remains.

Every packet is run independently from a clean repository root. `<DIR>` below means the literal
`local-tmp/ferret-api/<profile>` created by that packet; the implementation substitutes that literal path, not
an environment-dependent directory. The assertion helper writes only sanitized status/schema/count evidence to
the in-progress plan evidence directory. A failed assertion or cleanup blocks the API gate.

### Packet M1 — `getLiveness`

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/setup.ts --profile live --reset
rtk curl --silent --show-error --dump-header local-tmp/ferret-api/live/success.headers --output local-tmp/ferret-api/live/success.json --write-out '%{http_code}' http://127.0.0.1:8601/health/live > local-tmp/ferret-api/live/success.status
rtk curl --silent --show-error --request POST --dump-header local-tmp/ferret-api/live/failure.headers --output local-tmp/ferret-api/live/failure.json --write-out '%{http_code}' http://127.0.0.1:8601/health/live > local-tmp/ferret-api/live/failure.status
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/assert-response.ts --profile live --case live-success-200 --case live-method-failure-405
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/cleanup.ts --profile live
```

The public route has no dependency whose failure can safely be injected. The failure call therefore proves the
operation's method contract (`405`, safe problem, no internal detail); a Unit-only injected serializer failure
proves its otherwise-catastrophic `500`. A live process unable to serialize the minimal body is not a stable
manual-test state.

### Packet M2 — `getReadiness`

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/setup.ts --profile ready --reset
rtk curl --silent --show-error --dump-header local-tmp/ferret-api/ready/success.headers --output local-tmp/ferret-api/ready/success.json --write-out '%{http_code}' http://127.0.0.1:8601/health/ready > local-tmp/ferret-api/ready/success.status
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/fault.ts --profile ready --apply postgres-unavailable
rtk curl --silent --show-error --dump-header local-tmp/ferret-api/ready/failure.headers --output local-tmp/ferret-api/ready/failure.json --write-out '%{http_code}' http://127.0.0.1:8601/health/ready > local-tmp/ferret-api/ready/failure.status
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/assert-response.ts --profile ready --case ready-success-200 --case ready-postgres-failure-503
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/cleanup.ts --profile ready
```

### Packet M3 — `ingestTelemetryBatch`

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/setup.ts --profile batch --reset
rtk curl --silent --show-error --config local-tmp/ferret-api/batch/curl-auth.conf --header 'Content-Type: application/json' --header 'X-Request-ID: 00000000-0000-4000-8000-000000000005' --data-binary @local-tmp/ferret-api/batch/telemetry-batch.json --dump-header local-tmp/ferret-api/batch/success.headers --output local-tmp/ferret-api/batch/success.json --write-out '%{http_code}' http://127.0.0.1:8601/api/v1/event-batches > local-tmp/ferret-api/batch/success.status
rtk curl --silent --show-error --header 'Authorization: Bearer intentionally-wrong-test-token' --header 'Content-Type: application/json' --header 'X-Request-ID: 00000000-0000-4000-8000-000000000006' --data-binary @local-tmp/ferret-api/batch/telemetry-batch.json --dump-header local-tmp/ferret-api/batch/failure.headers --output local-tmp/ferret-api/batch/failure.json --write-out '%{http_code}' http://127.0.0.1:8601/api/v1/event-batches > local-tmp/ferret-api/batch/failure.status
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/assert-response.ts --profile batch --case batch-event-capability-success-200 --case batch-wrong-token-401
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/cleanup.ts --profile batch
```

The success assertion checks both returned ACK arrays, recomputed fixed hashes, exact lossless Event round-trip,
one immutable capability snapshot with both items, and one database row per ID. The failure assertion proves no
additional batch/event/snapshot row.

### Packet M4 — `listEvents`

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/setup.ts --profile events --reset
rtk curl --silent --show-error --config local-tmp/ferret-api/events/curl-auth.conf --dump-header local-tmp/ferret-api/events/success.headers --output local-tmp/ferret-api/events/success.json --write-out '%{http_code}' 'http://127.0.0.1:8601/api/v1/events?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&limit=1' > local-tmp/ferret-api/events/success.status
rtk curl --silent --show-error --config local-tmp/ferret-api/events/curl-auth.conf --dump-header local-tmp/ferret-api/events/failure.headers --output local-tmp/ferret-api/events/failure.json --write-out '%{http_code}' 'http://127.0.0.1:8601/api/v1/events?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&cursor=tampered' > local-tmp/ferret-api/events/failure.status
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/assert-response.ts --profile events --case events-watermark-success-200 --case events-tampered-cursor-400
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/cleanup.ts --profile events
```

The success assertion follows the returned cursor after inserting one recent and one backdated event and proves
both are excluded until a fresh traversal.

### Packet M5 — `getUsageAnalytics`

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/setup.ts --profile usage --reset
rtk curl --silent --show-error --config local-tmp/ferret-api/usage/curl-auth.conf --dump-header local-tmp/ferret-api/usage/success.headers --output local-tmp/ferret-api/usage/success.json --write-out '%{http_code}' 'http://127.0.0.1:8601/api/v1/analytics/usage?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=harness%2Cskill' > local-tmp/ferret-api/usage/success.status
rtk curl --silent --show-error --config local-tmp/ferret-api/usage/curl-auth.conf --dump-header local-tmp/ferret-api/usage/failure.headers --output local-tmp/ferret-api/usage/failure.json --write-out '%{http_code}' 'http://127.0.0.1:8601/api/v1/analytics/usage?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=harness%2Charness' > local-tmp/ferret-api/usage/failure.status
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/assert-response.ts --profile usage --case usage-success-200 --case usage-repeated-group-400
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/cleanup.ts --profile usage
```

### Packet M6 — `getOutcomeAnalytics`

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/setup.ts --profile outcomes --reset
rtk curl --silent --show-error --config local-tmp/ferret-api/outcomes/curl-auth.conf --dump-header local-tmp/ferret-api/outcomes/success.headers --output local-tmp/ferret-api/outcomes/success.json --write-out '%{http_code}' 'http://127.0.0.1:8601/api/v1/analytics/outcomes?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=harness%2Ctool' > local-tmp/ferret-api/outcomes/success.status
rtk curl --silent --show-error --config local-tmp/ferret-api/outcomes/curl-auth.conf --dump-header local-tmp/ferret-api/outcomes/failure.headers --output local-tmp/ferret-api/outcomes/failure.json --write-out '%{http_code}' 'http://127.0.0.1:8601/api/v1/analytics/outcomes?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z&groupBy=outcome' > local-tmp/ferret-api/outcomes/failure.status
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/assert-response.ts --profile outcomes --case outcomes-success-200 --case outcomes-invalid-group-400
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/cleanup.ts --profile outcomes
```

### Packet M7 — `getCapabilities`

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/setup.ts --profile capabilities --reset
rtk curl --silent --show-error --config local-tmp/ferret-api/capabilities/curl-auth.conf --dump-header local-tmp/ferret-api/capabilities/success.headers --output local-tmp/ferret-api/capabilities/success.json --write-out '%{http_code}' 'http://127.0.0.1:8601/api/v1/capabilities?harness=codex&limit=100' > local-tmp/ferret-api/capabilities/success.status
rtk curl --silent --show-error --dump-header local-tmp/ferret-api/capabilities/failure.headers --output local-tmp/ferret-api/capabilities/failure.json --write-out '%{http_code}' 'http://127.0.0.1:8601/api/v1/capabilities?harness=codex' > local-tmp/ferret-api/capabilities/failure.status
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/assert-response.ts --profile capabilities --case capabilities-success-200 --case capabilities-missing-token-401
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec tsx apps/ferret-be-e2e/src/manual/cleanup.ts --profile capabilities
```

After M1–M7 pass, run the API Quality Gate against the same built artifact. Its report must identify the exact
OpenAPI commit/head, report `final-status: pass`, execute Rule 16 exploratory testing, and list every defect plus
the exact packet/scenario retested after its fix. Evidence that contains a bearer value, raw request body,
machine path, or unsanitized exception is a failed gate and must be destroyed and regenerated safely.
