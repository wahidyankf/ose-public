# Phase 3 REFACTOR — Mandatory Nx Quality Matrix

## Commands

```bash
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- affected \
  -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD
```

captured at `affected-matrix-35-projects.txt` (35 affected projects across the whole diff since
`origin/main`, since no PR has merged yet). Isolated re-run of the two projects it reported as
failed:

```bash
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many \
  -t test:quick -p ose-id-be ose-id-be-e2e
```

captured at `test-quick-ose-id-be-and-e2e.txt`, to read the full, untruncated coverage-validator
output. `test:coverage`'s adapters run sequentially and stop at the first failure, so `test:quick`
alone only ever reaches the Unit adapter for `ose-id-be` and the E2E adapter for `ose-id-be-e2e`
before stopping. The Integration adapter was run directly and separately to complete the picture:

```bash
rtk ./hippo run --class ephemeral --disk-path . -- node scripts/behaviour-coverage.mjs \
  --config apps/ose-id-be/behaviour-coverage.json --adapter integration
```

captured at `coverage-integration-adapter.txt`.

## Result

33 of the 35 affected projects (including `crane-cli`, `rhino-cli`, and every non-`ose-id`
project touched transitively) are fully green: build, typecheck, lint, and `test:quick` all pass.

`ose-id-be:test:quick` and `ose-id-be-e2e:test:quick` each fail solely inside
`test:coverage:{unit,e2e}` — `scripts/behaviour-coverage.mjs` reports **13 findings per adapter**
(Unit, Integration — checked directly, see above — and E2E all agree exactly), and every one of
them is `undefined {Unit,Integration,E2E} binding` for a scenario in `health.feature`,
`local-stack.feature`, or `stateless-instances.feature`. Those three feature files are Phase 4
scope (Health, Statelessness, Local Runner — the next phase in this same plan), not Phase 3
(PostgreSQL, Migrations, and Privilege Boundaries). `database-privilege.feature` and
`database-audit-and-soft-delete.feature` — Phase 3's own two features — have **zero** undefined,
orphan, duplicate, ambiguous, or unused findings across all three adapters; every one of their
scenarios binds at Unit and at every boundary-applicable Integration/E2E layer, matching the
RED/GREEN/REFACTOR evidence already captured under `evidence/phase-3-{red,green,schema}/`.

This is the same "permitted nonzero" condition the Phase 1 Gate established and the Phase 2 Gate
re-applied (see `evidence/phase-2/behaviour-coverage-classification.md`'s "Gate re-run
confirmation"): `scripts/behaviour-coverage.mjs` returns non-zero for any undefined binding,
including one caused only by a later phase in this same plan not having landed yet, so a literal
`exit 0` is not achievable before Phase 4 lands real step bindings for those three features. The
acceptance carried forward is: zero orphan/duplicate/ambiguous/unused/config findings, and every
remaining non-zero line is exactly a named-absent, not-yet-implemented later-phase scenario — never
a Phase 3 feature and never a configuration defect. Both properties hold here.

All build/typecheck/lint output for both projects is 0 Warning(s)/0 Error(s) (`dotnet build`,
`dotnet format --verify-no-changes`). The real `dotnet test` runs for `ose-id-be`'s Unit (62/62)
and Integration (22/22) suites, and `ose-id-be-e2e`'s E2E suite (11/11, twice consecutively), are
captured separately in `evidence/phase-3-green/` and `evidence/phase-3-persistence/` — this
directory covers only the corpus-structure/coverage-validator layer of `test:quick`, not the test
execution itself.
