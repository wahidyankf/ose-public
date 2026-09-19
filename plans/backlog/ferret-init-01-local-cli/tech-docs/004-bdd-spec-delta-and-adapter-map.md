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

| Action/source       | Durable scenario title                                  | Exact feature path                                                                      | Unit                           | Integration                           | E2E                                                       | Static proof                                                                        |
| ------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| ADD / AC-CLI-01     | Initialize one private store from multiple repositories | `specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature`       | required                       | temp filesystem/SQLite                | built CLI from two repos                                  | owner `test:coverage:unit,integration,behaviour`; E2E `test:coverage:e2e,behaviour` |
| ADD / AC-CLI-02     | Capture a valid lifecycle event                         | `specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature`                    | required                       | exact SQLite row/hash                 | canonical stdin/export                                    | same                                                                                |
| ADD / AC-CLI-03     | Reject a forbidden capture field                        | `specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature`                    | each of six examples required  | no partial row                        | value-free process diagnostic                             | same                                                                                |
| ADD / AC-CLI-04     | Keep a harness fail-open after a local failure          | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | each of four examples required | missing/busy/storage/timeout          | POSIX wrapper/plugin zero/no-output/deadline              | same                                                                                |
| ADD / AC-CLI-05     | Capture concurrently across repositories                | `specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature`       | transaction policy             | concurrent real SQLite                | three-repo burst                                          | same                                                                                |
| ADD / AC-CLI-06     | Mark an unobservable capability unknown                 | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | field-level visibility         | snapshot persistence                  | Codex skill unknown                                       | same                                                                                |
| ADD / AC-CLI-07     | Filter and export deterministic local events            | `specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature`               | filter/cursor/serializer       | indexed SQLite                        | JSON/JSONL stdout                                         | same                                                                                |
| ADD / AC-CLI-08     | Summarize outcomes with incomplete visibility           | `specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature`                 | aggregation/disclaimer         | representative SQLite                 | machine/human output                                      | same                                                                                |
| ADD / AC-CLI-09     | Hide then prune every expired usage-derived record      | `specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature`                  | cutoff/per-table/counter rules | pre-prune reads and post-prune tables | inactive-clock then next-operation maintenance            | same                                                                                |
| ADD / AC-CLI-10     | Measure storage before and after retention              | `specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature`                  | formula/threshold              | WAL/checkpoint/compaction             | benchmark/status                                          | same                                                                                |
| ADD / AC-CLI-11     | Use FERRET without a backend                            | `specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature`               | backend-absent state           | denied sockets                        | complete local commands                                   | same                                                                                |
| ADD / AC-CLI-12     | Remove FERRET without changing harness behavior         | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | resolver/removal               | missing executable                    | configured POSIX simulations                              | same                                                                                |
| ADD / product scope | Keep Windows lifecycle adapters explicitly unsupported  | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | platform policy                | Windows temp data-home contract       | CLI-only Windows runner; POSIX hook E2E exempt on Windows | same                                                                                |

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
| Install privately for the current user on every CLI platform     | `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature` | path/ACL Unit; POSIX/Windows filesystem Integration; built-artifact E2E         |

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
  TERM/KILL deadline, no output, and terminal commit. Windows proves only CLI-local behavior and
  `unsupported_platform` adapter status, protected user/SYSTEM ACLs, atomic user install/PATH ownership, and
  ownership-safe uninstall.

## Gherkin Implementation Review

After adapters are green, run the repository Gherkin implementation review. Static targets prove structure and
mapping, not semantic correctness. Preserve exact findings/dispositions; a mismatch reopens its owning RED/
GREEN/REFACTOR packet.
