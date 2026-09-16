# Phase 3 REFACTOR — Schema and Query Evidence

## Files

- `compiled-sql-snapshot.txt` — `MigrationHistoryQuery.Compile()`'s compiled SQL and parameter
  bindings, generated from the real Infrastructure assembly.
- `catalog-manifest-before-after.txt` — before (empty database, no `ose_id` object) and after
  (full column/constraint/index/trigger/owner/grant catalog, row count, stable non-secret digest)
  a real forward migration on a fresh PostgreSQL 17 container, plus a second migration run proving
  idempotence (row count stays 1).
- `explain-10000-rows.txt` — `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` of the readiness query
  against a synthetic 10,000-row history table (9,999 tombstoned + 1 real active row), run as the
  `ose_id_app` role.

## Finding and correction (recorded, not swept)

`tech-docs/002-runtime-persistence-and-statelessness.md` originally asserted the 10,000-row readiness
query "must use `PK___EFMigrationsHistory` ... and perform no sequential scan." Measured evidence
contradicts that: PostgreSQL's planner chooses a sequential scan both at 1 row and at 10,000 rows,
and this is the _correct_ planner decision — the table's only index (the primary key, on
`MigrationId`) is unrelated to the `deleted_at` filter this query applies, and the table stays a few
hundred KiB even at 10,000 rows, so an index scan would cost more than scanning the whole table. The
tech-doc's "primary key is the only index" contract also forecloses adding an index that would change
this. The tech-doc has been corrected to state the property that is actually true and was verified:
bounded, sub-millisecond execution (0.537ms wall time, 143 shared buffer hits, zero disk reads) and a
result set no larger than the compiled compatible set (exactly 1 row returned out of 10,000).

Separately, the query's `ORDER BY "MigrationId" DESC` was removed: `SchemaCompatibility.Evaluate`
compares the result against the compiled set by membership, never by position, so the ordering was
pure cost with no correctness benefit. Removing it also removed the `EXPLAIN` plan's `Sort` node.

## Absence of an EF runtime query path

`PersistenceRuntimeBoundaryTests` (Integration) proves this as a build-enforced property:
`OseIdHost.RegisterServices` never registers a `DbContext`, the `OseId.Host` assembly references no
`Microsoft.EntityFrameworkCore*` assembly at all, and the one runtime query the serving role executes
is compiled by SqlKata's `PostgresCompiler`. Entity Framework exists in this codebase only inside
`OseId.Migrator`, a separate executable the serving host never runs.

## Migration-compatibility proof (the "old/new schema, rollback, forward-fix" checklist bullet)

`CreateIdentityFoundation` is Plan 01's only migration, so there is no earlier schema to migrate
from — the compatibility matrix the delivery checklist asks for reduces to properties this specific
migration can actually have:

- **No-backfill/no-contract rows, zero domain-data before/after** — `catalog-manifest-before-after.txt`
  shows `other_tables = 0` and `history_rows = 1` both before and after; the migration creates no
  domain table and inserts no row of its own (the one history row is Entity Framework's own insert,
  through the finished audit-envelope contract).
- **Old-code/new-schema PASS** — "old code" here is Phase 2's inert host, which has zero database
  dependency (`PersistenceRuntimeBoundaryTests` proves `OseId.Host` doesn't even reference an EF
  assembly, let alone open a connection). Code that never touches the schema cannot regress when the
  schema gains an object it doesn't know about, so this holds structurally, not by a new runtime
  test.
- **New-code/old-schema fail-closed** — "old schema" here is "not yet migrated" (no `ose_id` schema
  at all). `NpgsqlMigrationHistoryReader` catches `NpgsqlException`, which covers querying a table
  that doesn't exist yet, and returns `MigrationHistoryReadResult.Unavailable()`;
  `ReadSchemaState.ExecuteAsync` maps that to `SchemaState.DatabaseUnavailable` — never `Ready`. The
  seam is built and compiled now; its live behavioural proof against a real un-migrated database is
  `health.feature`'s "Report PostgreSQL becoming unavailable after startup" scenario, which is
  explicitly Phase 4 scope (wiring persistence state onto an observable HTTP readiness response) and
  is correctly still undefined — see `evidence/phase-3-quality-matrix/README.md`.
- **Rollback** — `CreateIdentityFoundation.Down()` unconditionally throws `NotSupportedException`
  ("OSE ID migrations are forward-only; repair a defect with a new forward migration."), proved by
  `PersistenceRuntimeBoundaryTests.CreateIdentityFoundation_Down_IsRejectedRatherThanRunOrSilentlyIgnored`.
  For a forward-only design, "rollback proof" is proof that rollback is rejected loudly, not that it
  succeeds.
- **Forward-fix proof** — `catalog-manifest-before-after.txt`'s final section applies the same
  forward migration a second time and shows the history row count stays at exactly 1: the forward
  path is idempotent and is the only recovery mechanism this schema offers.
