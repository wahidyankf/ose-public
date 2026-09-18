# Business Requirements — FERRET Init 02 Protocol-Independent Local Backend

> **Evidence scope:** Existing repository/Plan 01 facts are **[Repo-grounded]**; product outcomes and boundaries
> are approved **[Judgment calls]**; storage ranges are **[Unverified]** until measured during delivery.

## Business Goal

Consolidate durable local FERRET evidence in PostgreSQL and expose stable raw/aggregate APIs without making
the backend a dependency of capture or locking the product to one presentation/agent protocol.

## Problem

Plan 01 deliberately retains only 30 days on one machine. Cross-machine or longer-lived analysis needs a
backend, but coupling domain logic to FastAPI route handlers would make later GraphQL dashboard queries and MCP
tools duplicate authorization, filtering, analytics, and persistence. Network delivery also introduces
partial batches, retries, replay, client crashes, and authentication failures that the standalone store does
not solve.

## Business Outcomes

1. A locally running backend accepts Plan 01 events idempotently and retains them until explicit pruning.
2. Backend outages never block capture; eligible local rows retry until acknowledged or their 30-day expiry.
3. Local scripts can retrieve filtered raw events and usage/outcome/capability aggregates over REST.
4. REST, future GraphQL, and future MCP adapters share one application policy and persistence implementation.
5. Protocol-specific schemas and errors stay at adapters; the core does not import transport/framework types.
6. PostgreSQL growth, indexes, WAL, prune impact, and recovery behavior are measured before completion.

## Affected Roles

| Role                       | Need                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Local developer            | Optional backend that can stop/restart without losing recent CLI events.                   |
| Data analyst/script author | Stable authenticated raw and aggregate REST APIs.                                          |
| Future dashboard author    | Reusable query/application ports and change notices, not REST-handler reuse.               |
| Future MCP adapter author  | Tool/resource operations that call the same use cases and policy.                          |
| Operator/reviewer          | Health, migration, authentication, retention, storage, recovery, and idempotency evidence. |

## Success Measures

- A CLI batch accepted before the client's acknowledgement can be resent after a crash without creating a
  second event row or ambiguous status.
- Partial acceptance returns one deterministic status per submitted event; only matching accepted/duplicate
  acknowledgements leave the local queue.
- Backend-disabled, backend-down, unauthorized, throttled, invalid, and server-error paths leave Plan 01 local
  commands useful and maintain bounded retry metadata outside capture transactions.
- Every REST data operation requires the local bearer token, rejects unsafe/non-loopback runtime exposure, and
  never returns/stores forbidden content fields.
- Architecture fitness tests reject imports from FastAPI/Pydantic transport models, SQLAlchemy, GraphQL, or MCP
  inside domain/application packages.
- Unit targets enforce at least 99% line coverage; static BDD maps every scenario to Unit and applicable
  Integration/E2E proof.

## Storage Budget

`[Unverified — low confidence]` Reserve **1–2 KiB per PostgreSQL event** only until measurement. This is an
engineering allowance, not an external benchmark: it intentionally brackets the Plan 01 SQLite probe while
allowing for PostgreSQL tuple/index/WAL overhead. At that range, 5,000/20,000/100,000 events per day add roughly
0.14–0.29/0.57–1.14/2.86–5.72 GiB per 30-day month before WAL retention, backups, or free-space headroom. Plan
02 replaces every figure with a deterministic 100,000- and 1,000,000-record fixture reporting seed, event mix,
PostgreSQL/image version and digest, filesystem, heap, TOAST, each index, sequence/catalog overhead, WAL per
batch, vacuum/prune effects, and arithmetic. Because backend retention is unlimited by default, status and
operations docs show projections derived from those measured bytes, labeled with measurement date and machine.

## Options and Trade-offs

| Option                               | Benefits                                                   | Costs and risks                                                   | Decision                                |
| ------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| Hexagonal core + REST first          | Current delivery stays small; later protocols are adapters | Requires explicit mapping/fitness tests up front                  | **Chosen**                              |
| FastAPI route/service monolith       | Fastest initial endpoints                                  | Future GraphQL/MCP duplicate or extract coupled policy later      | Rejected                                |
| GraphQL-first ingestion/query        | Flexible dashboard query surface                           | Adds schema/runtime complexity; CLI needs simple reliable batches | Rejected for current delivery           |
| Implement REST, GraphQL, and MCP now | Immediate protocol breadth                                 | Three contracts/test matrices before any demonstrated consumers   | Rejected as premature                   |
| Generated OpenAPI client/models      | Strong wire typing                                         | Adds runtime generator/dependencies and breaks stdlib-only CLI    | Rejected; shared contract tests instead |

## Risks and Mitigations

| Risk                               | Consequence                         | Mitigation or stop condition                                                   |
| ---------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| Protocol leakage into core         | Later adapter requires rewrite      | Dependency rules, application dataclasses/protocols, fake adapter conformance  |
| Replay/partial acknowledgement bug | Duplicate or lost events            | Lease outside network transaction, per-event ACK, unique ID+hash, crash E2E    |
| Token exposure                     | Local data disclosure               | 256-bit file, private permissions, loopback bind, redaction, no tracked values |
| Backend outage exceeds 30 days     | Oldest pending local data expires   | Status warning/near-expiry metrics; explicitly accepted Plan 01 boundary       |
| Unlimited backend retention        | Unbounded PostgreSQL growth         | Storage projection, dry-run prune, explicit `--execute`, operational docs      |
| Premature realtime infrastructure  | Complexity without consumer         | Change-publisher port with no-op adapter; defer transport/pub-sub              |
| Analytics interpreted causally     | Misleading effectiveness conclusion | Operational-proxy vocabulary and API metadata disclaimer                       |

## Business Non-Goals

This plan does not deliver the dashboard or "all protocols." It delivers an architecture where those adapters
can be added through separate authorized plans with their own contracts and operational requirements.
