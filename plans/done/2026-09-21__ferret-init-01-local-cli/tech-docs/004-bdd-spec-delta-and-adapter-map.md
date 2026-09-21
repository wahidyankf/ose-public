# BDD/Spec Delta and Adapter Map

## Frozen Canonical Owner Tree

```text
specs/apps/ferret/cli/behaviours/
├── storage/initialization-and-concurrency.feature [N]
├── storage/retention-and-space.feature [N]
├── privacy/metadata-envelope.feature [N]
├── queries/local-query-and-export.feature [N]
├── analytics/usage-and-outcomes.feature [N]
└── harness/fail-open-capabilities-and-platforms.feature [N]
```

Feature files contain the durable titles below but no AC/plan IDs, plan tags, phases, or test-layer labels.
Every Scenario Outline example expands independently; all examples have the same layer disposition unless a row
states otherwise.

## One-to-One Product Scenario Map

| Action/source   | Durable scenario title                                  | Exact feature path                                                                      | Unit                           | Integration                           | E2E                                            | Static proof                                                                        |
| --------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| ADD / AC-CLI-01 | Initialize one private store from multiple repositories | `specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature`       | required                       | temp filesystem/SQLite                | built CLI from two repos                       | owner `test:coverage:unit,integration,behaviour`; E2E `test:coverage:e2e,behaviour` |
| ADD / AC-CLI-02 | Capture a valid lifecycle event                         | `specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature`                    | required                       | exact SQLite row/hash                 | canonical stdin/export                         | same                                                                                |
| ADD / AC-CLI-03 | Reject a forbidden capture field                        | `specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature`                    | each of six examples required  | no partial row                        | value-free process diagnostic                  | same                                                                                |
| ADD / AC-CLI-04 | Keep a harness fail-open after a local failure          | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | each of four examples required | missing/busy/storage/timeout          | POSIX wrapper/plugin zero/no-output/deadline   | same                                                                                |
| ADD / AC-CLI-05 | Capture concurrently across repositories                | `specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature`       | transaction policy             | concurrent real SQLite                | three-repo burst                               | same                                                                                |
| ADD / AC-CLI-06 | Mark an unobservable capability unknown                 | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | field-level visibility         | snapshot persistence                  | Codex skill unknown                            | same                                                                                |
| ADD / AC-CLI-07 | Filter and export deterministic local events            | `specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature`               | filter/cursor/serializer       | indexed SQLite                        | JSON/JSONL stdout                              | same                                                                                |
| ADD / AC-CLI-08 | Summarize outcomes with incomplete visibility           | `specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature`                 | aggregation/disclaimer         | representative SQLite                 | machine/human output                           | same                                                                                |
| ADD / AC-CLI-09 | Hide then prune every expired usage-derived record      | `specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature`                  | cutoff/per-table/counter rules | pre-prune reads and post-prune tables | inactive-clock then next-operation maintenance | same                                                                                |
| ADD / AC-CLI-10 | Measure storage before and after retention              | `specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature`                  | formula/threshold              | WAL/checkpoint/compaction             | benchmark/status                               | same                                                                                |
| ADD / AC-CLI-11 | Use FERRET without a backend                            | `specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature`               | backend-absent state           | denied sockets                        | complete local commands                        | same                                                                                |
| ADD / AC-CLI-12 | Remove FERRET without changing harness behaviour        | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | resolver/removal               | missing executable                    | configured POSIX simulations                   | same                                                                                |

## CLI Contract Scenario Map

| Contract scenario                                                | Exact feature path                                                                      | Layer disposition                                                               |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Emit stable machine-readable command results and errors          | `specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature`               | Unit serializer snapshots; Integration streams; built-process E2E               |
| Produce the fixed canonical event hash across implementations    | `specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature`                    | Python Unit plus Plan 02 cross-language fixture; SQLite Integration; export E2E |
| Preserve independent subject/outcome/duration provenance         | `specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature`                 | invariant Unit matrix; SQLite Integration; analytics E2E                        |
| Project raw hook JSON without retaining content                  | `specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature`                    | mapper Unit matrix; bounded-input Integration; POSIX adapter E2E                |
| Capture a versioned capability snapshot                          | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | schema Unit; SQLite Integration; adapter E2E                                    |
| Round-trip the same capability through two snapshots             | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | composite-key Unit; real SQLite Integration; status E2E                         |
| Enforce exact event-type subject/outcome invariants              | `specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature`                    | one Unit example per event type; SQLite Integration; canonical capture E2E      |
| Keep expiry counters stable across the future delivery migration | `specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature`                  | counter Unit fixture; Plan 01 migration seed Integration; Plan 02 consumer      |
| Install privately for the current user                           | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | path and mode Unit; POSIX filesystem Integration; built-artifact E2E            |

## Required Negative and Race Fixtures

- Duplicate JSON keys, invalid UTF-8, raw >256 KiB, canonical >16 KiB, non-object root, unknown property,
  forbidden content, invalid enum, overlong/path-like name, control character, future schema, timestamp skew,
  duration bounds, identical duplicate, ID/hash conflict, and server-recomputed fixed-vector mismatch.
- Concurrent init/capture, duplicate race, reader/writer, 250 ms busy timeout, interrupted transaction,
  permissions, disk-full simulation, and copied-database integrity failure.
- Cutoff equality before any prune, every read path's logical predicate, 100-row/100-monotonic-ms first-operation prune, orphan
  workspaces, two snapshots sharing a capability name, duplicate capability within one snapshot, snapshot/item
  cascade, singleton maintenance state, `expired_local_total` with zero `expired_before_ack_total`, migration
  non-reclassification, checkpoint reader, and compaction free-space failure.
- Each POSIX harness: byte-for-byte raw forwarding, supported/unsupported event, raw-content field, missing CLI, invalid payload, hung child,
  TERM/KILL deadline, no output, and terminal commit.
- Install and uninstall: owner-only modes, atomic staged replacement, artifact-digest verification, refusal on a
  non-FERRET collision, and ownership-safe removal that touches no unowned file.

## Complete Feature-File Inventory

Each block is the frozen, complete contents of one `.feature` file: every Scenario and Scenario Outline it will
contain, in file order. Reviewers approve this inventory before Phase 2 authors any feature file.

**Title authority.** The string in the `Scenario` column is what literally appears in the feature file. When a
scenario's canonical Gherkin lives in [the PRD](../prd.md), that AC's `Scenario:` line is authoritative and is
never duplicated here. Scenarios marked **inline** have no PRD home; their canonical Gherkin is
[below](#contract-and-fixture-gherkin). The "durable scenario title" column in the two maps above is
the same string, verbatim.

Twenty-six scenarios land across six files: twelve authored in the PRD and fourteen inline below. Sixteen are
canonical Gherkin under `specs/apps/ferret/`; ten ship as tests only, per the boundary immediately below.

### Corpus Boundary

Not every scenario below belongs in `specs/apps/ferret/`. The
[BDD contract](../../../../repo-governance/development/behaviour-driven-development.md) scopes the canonical corpus
to **observable behaviour** in the owner's durable domain language, and forbids plan-specific identifiers there.
Ten scenarios fail one of those tests and ship as ordinary parametrized unit or integration tests instead,
marked **tests only** in the tables. They still carry mandatory Unit proof and still count toward the 99%
coverage denominator; they simply are not product behaviour a reader of `specs/` should have to wade through.

| Scenario                                                     | Why it is not canonical Gherkin                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Produce the fixed canonical event hash                       | Golden digest vectors. The observable promise is that export round-trips; the hex constant is an implementation fixture. |
| Enforce one event type's subject and outcome invariants      | Validator truth table over internal field combinations, already implied by AC-CLI-02 and AC-CLI-03.                      |
| Reject a malformed or oversized capture input                | Parser and bounds matrix. The user-visible privacy promise is AC-CLI-03; the remaining rows are input hardening.         |
| Resolve a repeated event identity                            | Idempotency and conflict mechanics of a producer-owned key, invisible outside the storage layer.                         |
| Preserve one provenance dimension independently              | Twelve-row internal matrix behind AC-CLI-06 and AC-CLI-08.                                                               |
| Capture a versioned capability snapshot                      | Internal snapshot schema. The observable behaviour is AC-CLI-06 reporting a gap as unknown.                              |
| Round-trip one capability name through two snapshots         | Composite-primary-key behaviour of one table.                                                                            |
| Keep expiry counters stable for the later delivery migration | Names a later plan, which `specs/` must never reference; also an internal counter contract.                              |
| Survive a concurrency or storage fault                       | Fault-injection matrix proving AC-CLI-04's promise at the storage layer rather than a distinct behaviour.                |
| Enforce one retention or reclamation rule                    | Prune budget and reclamation mechanics behind AC-CLI-09 and AC-CLI-10.                                                   |

The sixteen remaining scenarios are the canonical corpus: the twelve PRD acceptance criteria plus
`Project raw hook JSON without retaining content`, `Emit a stable machine-readable command result`,
`Install privately for the current user`, and `Keep one POSIX adapter fail-open at the wrapper boundary`.

### `storage/initialization-and-concurrency.feature`

| #   | Scenario (feature-file string)                          | Type                | Gherkin home |
| --- | ------------------------------------------------------- | ------------------- | ------------ |
| 1   | Initialize one private store from multiple repositories | Scenario            | AC-CLI-01    |
| 2   | Capture concurrently across repositories                | Scenario            | AC-CLI-05    |
| 3   | Survive a concurrency or storage fault                  | Outline, 8 examples | tests only   |

### `storage/retention-and-space.feature`

| #   | Scenario (feature-file string)                               | Type                | Gherkin home |
| --- | ------------------------------------------------------------ | ------------------- | ------------ |
| 1   | Hide then prune every expired usage-derived record           | Scenario            | AC-CLI-09    |
| 2   | Measure storage before and after retention                   | Scenario            | AC-CLI-10    |
| 3   | Keep expiry counters stable for the later delivery migration | Scenario            | tests only   |
| 4   | Enforce one retention or reclamation rule                    | Outline, 8 examples | tests only   |

### `privacy/metadata-envelope.feature`

| #   | Scenario (feature-file string)                          | Type                 | Gherkin home |
| --- | ------------------------------------------------------- | -------------------- | ------------ |
| 1   | Capture a valid lifecycle event                         | Scenario             | AC-CLI-02    |
| 2   | Reject a forbidden capture field                        | Outline, 6 examples  | AC-CLI-03    |
| 3   | Produce the fixed canonical event hash                  | Scenario             | tests only   |
| 4   | Project raw hook JSON without retaining content         | Scenario             | inline       |
| 5   | Enforce one event type's subject and outcome invariants | Outline, 8 examples  | tests only   |
| 6   | Reject a malformed or oversized capture input           | Outline, 14 examples | tests only   |
| 7   | Resolve a repeated event identity                       | Outline, 3 examples  | tests only   |

### `queries/local-query-and-export.feature`

| #   | Scenario (feature-file string)                | Type                | Gherkin home |
| --- | --------------------------------------------- | ------------------- | ------------ |
| 1   | Filter and export deterministic local events  | Scenario            | AC-CLI-07    |
| 2   | Use FERRET without a backend                  | Scenario            | AC-CLI-11    |
| 3   | Emit a stable machine-readable command result | Outline, 9 examples | inline       |

### `analytics/usage-and-outcomes.feature`

| #   | Scenario (feature-file string)                  | Type                 | Gherkin home |
| --- | ----------------------------------------------- | -------------------- | ------------ |
| 1   | Summarize outcomes with incomplete visibility   | Scenario             | AC-CLI-08    |
| 2   | Preserve one provenance dimension independently | Outline, 12 examples | tests only   |

### `harness/fail-open-capabilities-and-platforms.feature`

| #   | Scenario (feature-file string)                           | Type                | Gherkin home |
| --- | -------------------------------------------------------- | ------------------- | ------------ |
| 1   | Keep a harness fail-open after a local failure           | Outline, 4 examples | AC-CLI-04    |
| 2   | Mark an unobservable capability unknown                  | Scenario            | AC-CLI-06    |
| 3   | Remove FERRET without changing harness behaviour         | Scenario            | AC-CLI-12    |
| 4   | Capture a versioned capability snapshot                  | Scenario            | tests only   |
| 5   | Round-trip one capability name through two snapshots     | Scenario            | tests only   |
| 6   | Install privately for the current user                   | Outline, 2 examples | inline       |
| 7   | Keep one POSIX adapter fail-open at the wrapper boundary | Outline, 6 examples | inline       |

## Contract and Fixture Gherkin

Canonical Gherkin for every scenario with no PRD home. These carry no AC identifiers, plan tags, phases, or
layer labels; their layer disposition is in the maps above.

### Storage

```gherkin
Scenario Outline: Survive a concurrency or storage fault
  Given FERRET is initialized
  When <fault> occurs during initialization or capture
  Then no partial or corrupt row is committed
  And any harness adapter still exits zero without output

Examples:
  | fault |
  | two initializations race for the same data home |
  | two writers submit the same event ID simultaneously |
  | a reader queries while a writer holds the lock |
  | a writer waits beyond the 250 millisecond busy timeout |
  | a transaction is interrupted mid-write |
  | the data home denies write permission |
  | the filesystem reports no free space |
  | a copied database fails an integrity check |
```

```gherkin
Scenario: Keep expiry counters stable for the later delivery migration
  Given FERRET has physically removed expired records that never held a delivery state
  When the user runs status
  Then expiredLocalTotal counts those removals
  And expiredBeforeAckTotal is exactly zero
  And a later migration never reclassifies a local expiry as a before-acknowledgement expiry
```

```gherkin
Scenario Outline: Enforce one retention or reclamation rule
  Given a database seeded against a fixed reference clock
  When <situation>
  Then <expectation>

Examples:
  | situation | expectation |
  | a row reaches exactly the thirty-day cutoff before any prune | every read path already excludes it |
  | the first operation after an inactive period runs | prune stops at the first of 100 rows or 100 monotonic milliseconds |
  | the prune cannot take the lock within its budget | it skips without advancing the maintenance marker |
  | a workspace loses its last retained event | the orphan workspace row is removed |
  | a capability snapshot expires | its capability items cascade with it |
  | maintenance runs twice | the singleton maintenance state keeps only the latest run |
  | a checkpoint is attempted while a reader is open | the checkpoint is skipped rather than forced |
  | compaction cannot reclaim free space | status still reports freelist, WAL, and high-water bytes |
```

### Privacy

```gherkin
Scenario: Produce the fixed canonical event hash
  Given the fixed Event vector from the shared data contract
  When an implementation canonicalizes it as ordered compact JSON excluding the hash field
  Then the SHA-256 digest is 199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c
  And the fixed capability-snapshot vector digests to 6d3ccc88afa715385e7b04aa0056e1455ae679906354d18bc5d0113c474a6590
  And a recomputed digest is compared in constant time
```

```gherkin
Scenario: Project raw hook JSON without retaining content
  Given a raw harness payload carrying prompt text, tool arguments, and environment values
  When capture-hook maps it through that harness's allowlist mapper
  Then only allowlisted metadata reaches the canonical envelope
  And the raw bytes stay in memory and are never spooled, logged, or written to SQLite
  And any diagnostic about the payload names no value taken from it
```

```gherkin
Scenario Outline: Enforce one event type's subject and outcome invariants
  Given FERRET is initialized with an empty local database
  When an adapter submits a <event_type> event
  Then capture requires <subject> and rejects every irrelevant subject name
  And it requires outcome <outcome> and duration <duration>

Examples:
  | event_type | subject | outcome | duration |
  | session.started | no subject name | not_applicable | null |
  | session.ended | no subject name | terminal or unknown | nullable non-negative |
  | agent.started | only agentName | not_applicable | null |
  | agent.ended | only agentName | terminal or unknown | nullable non-negative |
  | skill.invoked | only skillName | not_applicable | null |
  | tool.started | only toolName | not_applicable | null |
  | tool.completed | only toolName | success | nullable non-negative |
  | tool.failed | only toolName | failure | nullable non-negative |
```

```gherkin
Scenario Outline: Reject a malformed or oversized capture input
  Given FERRET is initialized with an empty local database
  When an adapter submits <input>
  Then capture rejects the complete event without storing a partial row
  And the diagnostic echoes no value from the input

Examples:
  | input |
  | a JSON object with duplicate keys |
  | invalid UTF-8 bytes |
  | a raw hook payload larger than 256 KiB |
  | a canonical event larger than 16 KiB |
  | a JSON root that is not an object |
  | an unknown additional property at any object level |
  | an invalid value for a closed enum |
  | a harness value that does not match the slug pattern |
  | a name longer than 128 characters |
  | a name containing an absolute path or a parent-directory segment |
  | a name containing a control character or line break |
  | a schema version newer than 1.0 |
  | an occurredAt more than 24 hours in the future |
  | a durationMs outside 0 to 86400000 |
```

```gherkin
Scenario Outline: Resolve a repeated event identity
  Given a stored event with a known event ID and canonical hash
  When capture receives <submission>
  Then the result is <result>

Examples:
  | submission | result |
  | the identical event ID and identical hash | idempotent success with no second row |
  | the same event ID with a different hash | a conflict error leaving the stored row unchanged |
  | a different event ID with an identical hash | both rows are stored and never deduplicated |
```

### Queries

```gherkin
Scenario Outline: Emit a stable machine-readable command result
  Given FERRET is initialized
  When the user runs <command> with --json
  Then stdout is one JSON object carrying schemaVersion and command
  And the human output of the same command derives from that same result
  And a failure instead emits a closed error code exposing no path beyond the resolved data home

Examples:
  | command |
  | init |
  | status |
  | events list |
  | events export |
  | usage |
  | outcomes |
  | maintenance |
  | self install |
  | self uninstall |
```

### Analytics

```gherkin
Scenario Outline: Preserve one provenance dimension independently
  Given a stored event whose <dimension> visibility is <visibility>
  When the user runs usage or outcomes
  Then the report labels that dimension <visibility>
  And it borrows no other dimension's provenance
  And it never substitutes a zero count for an unobserved dimension

Examples:
  | dimension | visibility |
  | subject | observed |
  | subject | derived |
  | subject | unknown |
  | subject | not_applicable |
  | outcome | observed |
  | outcome | derived |
  | outcome | unknown |
  | outcome | not_applicable |
  | duration | observed |
  | duration | derived |
  | duration | unknown |
  | duration | not_applicable |
```

### Harness

```gherkin
Scenario: Capture a versioned capability snapshot
  Given an adapter reports its observable lifecycle surface for one harness and version
  When FERRET records a capability snapshot
  Then the snapshot is immutable and carries its own canonical hash
  And each capability item states observed, derived, or unknown with its source
  And the snapshot expires on the same thirty-day boundary as events
```

```gherkin
Scenario: Round-trip one capability name through two snapshots
  Given two capability snapshots taken at different times for the same harness
  And both contain the same capability name
  When the user runs status
  Then the composite key of snapshot and capability name keeps both rows
  And status reads only the most recent snapshot
  And one snapshot may never contain that capability name twice
```

```gherkin
Scenario Outline: Install privately for the current user
  Given a supported environment with no FERRET artifact installed where <situation>
  When the user runs self install --target user
  Then the artifact, launcher, and manifest are created with owner-only access
  And the command reports path action <path_action>
  And no shell startup file and no machine-wide PATH are modified

Examples:
  | situation | path_action |
  | the user bin directory is already on PATH | none |
  | the user bin directory is absent from PATH | add_home_local_bin |
```

```gherkin
Scenario Outline: Keep one POSIX adapter fail-open at the wrapper boundary
  Given a <harness> binding invokes the shared wrapper
  When <condition>
  Then the wrapper exits zero and writes nothing to either stream
  And any surviving child is terminated by TERM at 900 milliseconds and KILL at 1000 milliseconds

Examples:
  | harness | condition |
  | claude_code | stdin is forwarded byte-for-byte for a supported event |
  | claude_code | the event is not one FERRET registers |
  | codex | the payload carries raw content fields |
  | codex | the ferret executable is missing |
  | opencode | the plugin forwards an invalid payload |
  | opencode | the child process hangs past the deadline |
```

## Gherkin Implementation Review

After adapters are green, run the repository Gherkin implementation review. Static targets prove structure and
mapping, not semantic correctness. Preserve exact findings/dispositions; a mismatch reopens its owning RED/
GREEN/REFACTOR packet.
