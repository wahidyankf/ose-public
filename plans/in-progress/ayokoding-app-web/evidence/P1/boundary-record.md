# P1 boundary — coordinator re-verification (execution worktree, branch `ayokoding-app-web-exec`)

All P1 worker outputs were ported without modification (P1D: `libs/ayokoding-data`,
six TS adapters, two characterization suites, `project.json` cache inputs; P1H: full
`apps/ayokoding-web` scaffold) and re-proven here. Worker-tree logs are cited, not trusted.

## P1D (AC-08/09)

- RED: characterization suites failed before extraction (worker `red-test-unit.log`).
- `ayokoding-data:test:quick` → PASS (this tree).
- `ayokoding-www:test:unit` → 252 files pass, 1 file fails with the SAME 4 course-metadata
  assertions as the P0 baseline (`unit-with-adapters.log`): pre-existing content drift
  (`just-enough-csharp`, `windows-app-development` estimatedHours), zero regressions from
  the adapters. The worker's isolated tree reported 39 mermaid collection failures; that set
  does NOT reproduce in this tree and is attributed to their constrained environment.
- `ayokoding-www:validate-benchmark-reference` → PASS, generated blocks unchanged.
- `test:validators` → 216 pass / 0 fail (covers the new `lang:go`/`lang:ts` projects via the
  existing tag-derivation test; no test change required).
- `test:integration` for the old app remains blocked by the pre-existing `next build` SIGBUS
  in this 7 GB host (fails identically with and without adapters; worker
  `integration-blocker.log`). Disposition: environmental, owned by the host, not the plan;
  PR CI (resourced runners) proves build/integration there.

## P1H (AC-11)

- RED: `nx run ayokoding-web:test:coverage:behaviour` → `Cannot find project 'ayokoding-web'`
  (recorded before scaffold); godog steps failed on pending domain code (worker `red-*.log`).
- `ayokoding-web:test:quick` (typecheck+lint+unit+static behaviour) → PASS, this tree.
- `ayokoding-web:test:integration` → PASS (`tests/bdd-integration`, `tests/integration`).
- Probed `scripts/behaviour-coverage.test.mjs` for a Go-discovery gap first: none exists (Go
  adapter + strictness fully covered), so no script churn — minimal sufficiency per plan.

## Rules propagation (same unit)

- Frozen transaction: `rule-transaction.md`. Scan: no conflicts; existing rules reused unchanged.
- Placements: adopter Go web-framework row; `ayokoding-data` naming exception in adopter Local
  Rules + monorepo-structure naming section + Current Libraries entry; `repo-config.yml`
  inventory (`ayokoding-web`, `ayokoding-web-e2e`, `ayokoding-data`) + README globs;
  `apps/README.md`, `libs/README.md`, `monorepo-structure.md` app/lib rows;
  `web-sites.md` 3102 row + `AYOKODING_WEB_PORT` + 3191 test-port row.
- `repo-config validate` → no findings. `rules-quality-gate`: 4/5 PASS first cycle, blocking
  FAIL on the unrecorded naming exception → repaired → recheck PASS.

## Coordinator repairs after worker handoff (same unit)

- `env-validate` required the new `.env.example` registered in `repo-config.yml`
  (`environment.examples`, `staged.allowed`, `contracts`) plus a `go` detector entry.
  `AYOKODING_WEB_PORT` was then `declared-but-unread` because config resolution used an
  injected lookup seam invisible to the detector. Repaired honestly: `ResolveConfig`
  reads `os.LookupEnv` directly, tests use `t.Setenv`, BDD glue applies the scenario
  environment with save/restore (`withScenarioEnv`). Simpler code, same determinism.
- `AYOKODING_WEB_FIXTURE` declared in the contract keys (test-only; correctly absent from
  the example file). Env gate fully clean afterward.
- The refactor exposed one latent godog expectation mismatch: the step asserted
  `--sidebar-width:240px` but the formatter-canonical template emits
  `--sidebar-width: 240px`. The step now asserts the canonical serialization
  (`steps_shell.go`); quick + integration re-verified green uncached.

## Deferred honestly

- `specs/libs/ayokoding-data` corpus: `behaviour-coverage.json` is schema-valid `pending:true`
  (empty corpus); the three-entry spec corpus lands in P2-Bindings per plan.
- `apps/ayokoding-web-e2e`: registered in inventory/indexes, implemented in P2 per plan.
