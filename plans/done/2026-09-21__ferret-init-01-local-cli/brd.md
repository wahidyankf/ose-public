# Business Requirements — FERRET Init 01 Standalone Local CLI

## Business Goal

Produce reliable local evidence about actual agent, skill, and tool usage across supported coding-agent
harnesses without depending on a running service and without risking the developer's primary workflow.

## Problem

The repository has a growing catalog of agents and skills, but it has no durable, comparable evidence of
which capabilities are invoked, which harness surfaces expose them, or which observable operations end in
success, failure, cancellation, or an unknown outcome. Anecdote cannot distinguish unused capability from
capability that a harness cannot observe. Direct network calls from lifecycle hooks would also make a local
backend outage part of the harness critical path.

## Business Outcomes

1. One developer machine has one coherent 30-day local evidence store across repositories and harnesses.
2. Harness execution never fails, blocks, or changes because FERRET is missing or unhealthy.
3. Usage and operational outcome summaries distinguish observed values from unavailable observations.
4. Local evidence contains no content payloads, secrets, usernames, or absolute machine paths.
5. The client remains complete and useful when no backend has ever been configured.
6. The event contract can later synchronize to a protocol-independent backend without replacing local
   capture or local analytics.

## Affected Roles

| Role                   | Need                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Repository maintainer  | Evidence about which maintained agents and skills are actually observable and used. |
| Local developer        | Private, fast, inspectable telemetry that does not depend on another process.       |
| Harness integrator     | A small fail-open adapter with explicit capability gaps per harness.                |
| Privacy reviewer       | A closed metadata schema and negative proof that content and secrets are rejected.  |
| Later backend executor | A stable versioned event model and measured local storage behaviour.                |

## Success Measures

- Concurrent capture from at least three repositories and every supported macOS/Linux POSIX harness adapter produces one
  coherent SQLite dataset without corruption or unbounded lock waits.
- Every hook/plugin path returns control to the harness successfully when FERRET is absent, times out, sees
  invalid input, or cannot persist.
- The owner Unit target enforces at least 99% line coverage over authored production code. Static BDD
  coverage proves every scenario has exactly one Unit binding and each applicable Integration/E2E binding.
- A privacy test corpus rejects every forbidden field and verifies that exported records contain no raw
  workspace path, username, prompt, response, transcript, tool input/output, or environment value.
- Every read excludes rows at or beyond the 30-day cutoff. The next FERRET operation attempts a separate prune
  transaction, stopping at the first of 100 rows or 100 monotonic milliseconds, and reports
  `expiredLocalTotal`; `expiredBeforeAckTotal` remains zero throughout Plan 01.
- The actual SQLite schema is benchmarked at 5,000, 20,000, and 100,000 events per day; measured bytes per
  event, index share, WAL high-water mark, prune result, and post-compaction size are recorded.

## Storage Budget

**[Judgment call] Preliminary estimate.** A disposable authoring probe inserted 100,000 synthetic rows with
17 metadata columns and five indexes, checkpointed WAL, and divided the 68,972,544-byte database by row count,
yielding about 690 bytes/event. The disposable probe was not committed, so this is sizing guidance rather than
durable measured evidence. Until delivery commits its reproducible fixture schema, command, sanitized result,
and arithmetic, use a conservative **0.7–1.5 KiB per event** envelope:

| Events per day | Events retained for 30 days | Estimated steady SQLite footprint |
| -------------: | --------------------------: | --------------------------------: |
|          5,000 |                     150,000 |                       100–220 MiB |
|         20,000 |                     600,000 |                       410–880 MiB |
|        100,000 |                   3,000,000 |                       2.0–4.3 GiB |

The estimate excludes transient WAL and temporary-file high-water marks. Delivery does not pass until the
final implementation publishes measured values and explains any result outside this envelope.

## Options and Trade-offs

| Option                           | Benefits                                                             | Costs and risks                                                                      | Decision                                      |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- |
| SQLite-first Python CLI          | Survives backend outage; one local source; portable standard library | Must coordinate concurrent writers and retention                                     | **Chosen**                                    |
| Hooks send directly to a backend | Fewer local components                                               | Couples harness latency/reliability to network/service health and loses offline data | Rejected                                      |
| One database per repository      | Simple ownership                                                     | Fragments machine-wide usage and duplicates synchronization/retention                | Rejected                                      |
| Permanent background daemon      | Predictable schedules                                                | Adds lifecycle, installation, recovery, and resource complexity                      | Rejected; use opportunistic/manual work later |

## Risks and Mitigations

| Risk                                | Consequence                             | Mitigation or stop condition                                                                  |
| ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| Hook latency or failure             | Coding harness becomes unreliable       | Local-only short transaction, bounded timeout, no network, fail-open wrapper                  |
| Incomplete harness visibility       | Missing observations look like no usage | Capability matrix and per-field `unknown` visibility; never synthesize zero                   |
| Sensitive payload enters storage    | Privacy/security exposure               | Closed schema, allowlist mapper, size limits, negative tests, redacted diagnostics            |
| SQLite writer contention            | Dropped telemetry or slow hooks         | WAL, one short-lived connection, short transaction, bounded busy timeout, stress test         |
| Storage growth                      | Disk pressure                           | Thirty-day cutoff, 100-row/100-ms next-operation prune, manual maintenance, status warning    |
| Power loss or disk failure          | Recent or complete data loss            | `synchronous=FULL`, atomic transaction, integrity diagnostics; document no absolute guarantee |
| Custom names are misread as quality | Incorrect product decisions             | Operational-proxy labels and explicit no-causation/no-semantic-quality language               |

## Business Non-Goals

This delivery does not make FERRET a hosted analytics platform. It establishes trustworthy local evidence
and a safe harness boundary; backend ingestion and query APIs belong to Plan 02.
