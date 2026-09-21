# BDD/Spec Delta and Adapter Map

**Evidence scope:** Plan 01 corpus ownership and repository BDD rules are **[Repo-grounded]**. Every Plan 02
feature path, scenario title, binding, and test disposition below is an approved **[Judgment call — new
artifact]**.

## Canonical Corpora

Plan 02 extends the CLI owner corpus and creates one backend owner corpus:

```text
specs/apps/ferret/
├── cli/behaviours/
│   └── synchronization/
│       ├── backend-configuration.feature
│       ├── lease-retry-and-crash-recovery.feature
│       └── standalone-regression.feature
└── be/behaviours/
    ├── ingestion/event-batch.feature
    ├── queries/raw-events.feature
    ├── analytics/usage-outcomes-and-capabilities.feature
    ├── security/local-bearer-and-privacy.feature
    ├── operations/health-migrations-pruning-and-storage.feature
    └── architecture/protocol-adapter-conformance.feature
```

`ferret-cli-e2e` consumes the CLI corpus; `ferret-be-e2e` consumes the BE corpus. Neither E2E project owns an
independent feature file. Feature text excludes plan IDs, layer tags, test targets, and protocol implementation
details unless externally observable.

## Layer Ownership

- CLI owner: Unit plus SQLite/HTTP Integration; process E2E in `ferret-cli-e2e`.
- BE owner: Unit plus real-PostgreSQL/FastAPI Integration; public HTTP E2E in `ferret-be-e2e`.
- Every expanded scenario has Unit proof. Integration/E2E exemptions are explicit, scenario-specific, and
  valid only when that boundary is genuinely inapplicable.
- Both production owners enforce at least 99% Unit line coverage. Static unit/integration/e2e/behaviour coverage
  targets and quick composition follow repository rules.

## Exact Acceptance Map

The titles below are durable scenario titles. Implementation copies them exactly into the named feature; it may
add examples and negative scenarios but cannot rename or move these owner scenarios without amending this plan.

| AC       | Exact owner feature                                                      | Exact durable scenario title                                               | Unit                                          | Integration                                           | E2E                                                                 |
| -------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| AC-BE-01 | `cli/behaviours/synchronization/standalone-regression.feature`           | `Use FERRET with backend synchronization disabled`                         | disabled/config and no-network policy         | socket-denied SQLite commands                         | built CLI with no backend                                           |
| AC-BE-02 | `cli/behaviours/synchronization/backend-configuration.feature`           | `Configure loopback synchronization with a token file`                     | URL/token/revision validation                 | private files plus atomic configure/capture race      | local stack configure/auth                                          |
| AC-BE-03 | `be/behaviours/ingestion/event-batch.feature`                            | `Synchronize a valid batch`                                                | telemetry use case, canonical hash, ACK logic | SQLite lease plus lossless real-PostgreSQL round-trip | built CLI to live BE with event and capability snapshot             |
| AC-BE-04 | `cli/behaviours/synchronization/lease-retry-and-crash-recovery.feature`  | `Resend after the client crashes before local acknowledgement`             | state machine                                 | backend-commit/client-drop fault                      | kill/restart/resend                                                 |
| AC-BE-05 | `be/behaviours/ingestion/event-batch.feature`                            | `Reuse an event ID with different content`                                 | recomputed conflict result                    | unique ID/hash real DB                                | wire conflict and local rejected state                              |
| AC-BE-06 | `be/behaviours/ingestion/event-batch.feature`                            | `Receive mixed batch results`                                              | ordered dual-array result/cardinality         | mixed real transaction                                | request/ACK/local state                                             |
| AC-BE-07 | `cli/behaviours/synchronization/lease-retry-and-crash-recovery.feature`  | `Synchronization encounters a retryable failure`                           | backoff/jitter/error map                      | loopback fault server                                 | capture deadline during outage/429/503                              |
| AC-BE-08 | `be/behaviours/security/local-bearer-and-privacy.feature`                | `Call a data endpoint without the matching token`                          | token/scope/error mapping                     | constant-time auth dependency                         | every data endpoint credential matrix                               |
| AC-BE-09 | `be/behaviours/queries/raw-events.feature`                               | `Page through filtered events`                                             | filters/cursor/watermark policy               | projections, index plan, backdated concurrent insert  | full cursor/filter HTTP journey                                     |
| AC-BE-10 | `be/behaviours/analytics/usage-outcomes-and-capabilities.feature`        | `Request usage and outcome analytics with visibility gaps`                 | grouping/unknown/duration policy              | aggregates plus latest snapshot provenance            | three analytics HTTP operations                                     |
| AC-BE-10 | `be/behaviours/analytics/usage-outcomes-and-capabilities.feature`        | `Page capability evidence across installations at one watermark`           | complete keyset and as-of selection           | identical keys, later snapshot, and prune races       | capability cursor traversal                                         |
| AC-BE-11 | `be/behaviours/operations/health-migrations-pruning-and-storage.feature` | `Preview and execute backend pruning`                                      | cutoff/dry-run policy                         | real prune/vacuum fixture                             | management command and query consistency                            |
| AC-BE-11 | `cli/behaviours/synchronization/lease-retry-and-crash-recovery.feature`  | `Preserve distinct local expiry counters after synchronization is enabled` | state-to-counter policy                       | non-retroactive SQLite migration and expiry           | built CLI status after local and before-ACK expiry                  |
| AC-BE-12 | `be/behaviours/architecture/protocol-adapter-conformance.feature`        | `Exercise application use cases through a fake protocol adapter`           | import rules/use-case conformance             | REST/fake adapter mapping                             | Exempt: source dependency direction is not public process behaviour |

The API scenarios in `005-api-contract-delta.md` are also exact: API-LIVE and API-READY go to the operations
feature; API-BATCH goes to ingestion; API-EVENTS goes to raw events; API-USAGE, API-OUTCOMES, and
API-CAPABILITIES go to analytics. Each is Unit + real PostgreSQL/FastAPI Integration + public HTTP E2E except
API-LIVE, whose Integration boundary is deliberately absent because it touches no resource.

## Contract-Specific Scenarios

The API delta maps every REST operation to one-to-one scenario IDs and exact destinations. Those scenarios add
success, validation, authentication, stable failure, replay/concurrency, cursor, privacy, cache, and response-
size behaviour beyond the product-level ACs. Copy them into the owner corpus before implementation and keep the
API document's anchors/titles synchronized.

## Required Fault and Race Fixtures

- SQLite lease commit crash, process death during HTTP, backend commit then connection drop, malformed/incomplete
  ACK, stale lease ACK, simultaneous sync processes, 401 config disable, 429 Retry-After, 5xx, timeout/refusal,
  30-day expiry while pending/leased/rejected.
- PostgreSQL duplicate race, same-ID hash conflict, partial validation, transaction rollback, deadlock/lock
  timeout, migration missing/ahead, connection pool reuse, database restart, same/different-hash batch replay,
  contiguous batch-item constraints, capability key collisions across installations, and prune/query cursor
  invalidation.
- HTTP invalid media type/JSON/body size/page size/timestamps/enums/cursor/filter mismatch; missing/malformed/wrong
  bearer; content/unknown field injection; response redaction/cache headers.
- Architecture forbidden imports, adapter bypass of authorization, notice before commit, notice after rollback,
  no-op publisher exception policy, fake/REST result equivalence.

## Required Reviews

- Gherkin implementation review after each corpus/adapter becomes green.
- API Quality Gate against the live local service, including Rule-16 exploratory testing and retest of every
  fixed API defect before archival.
- Schema/migration review with fresh/current/downgrade-empty/upgrade-after-downgrade proof and no-loss SQLite
  expansion reconciliation.
- Manual API recipes from the API delta using literal `rtk curl` commands, synthetic fixtures, assertions,
  cleanup, attributable evidence, and failure routing.
