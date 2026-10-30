# P3 Local Run of the Frozen Project-Target Matrix

This file records the Phase 3 local run of the frozen project-target matrix. It compares the run with the
Phase 0 baseline in [baseline-targets.md](../P0/baseline-targets.md) and with the later pin-upgrade results in
[pin-upgrade-target-results.md](../P0/pin-upgrade-target-results.md). The matrix itself is defined in
`plans/done/2026-10-29__docker-to-podman/tech-docs.md` under "Affected project target matrix", and its 107 audited rows
are listed in [target-matrix.md](../P0/target-matrix.md). The baseline revision is `71bb3aa5`.

## Result and scope

- **Rows run:** 102 of the 107 audited rows (106 real target identities plus 1 N/A caller observation) ran locally.
- **Final result:** all 102 rows ended with exit code 0. That is 102 of 106 real identities passing locally.
- **Runs recorded:** 116 target runs in the ledgers. 102 are the final passing runs. The other 14 are earlier runs
  of 7 rows that did not pass or never started (see "Rows that needed more than one run").
- **Rows not run:** 26, 33, 92, 100 and 107. I checked `rows.txt` against the ledgers. These five numbers are the
  only gaps in 1 to 107, and every row listed in `rows.txt` has a final exit code. Row 101 did run and passed.
  See "Rows not run in this local pass".
- **How each row ran:** one row at a time through HIPPO from the repository root, as
  `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run <project>:<target>`.
  `:bundle` and `:codegen` rows used the `transactional` class. The final run of row 14 used the `heavy` tier. Nx
  cache was disabled with `NX_SKIP_NX_CACHE=true`, and the Compose provider variable was set.
- **Wall seconds** in the table come from the ledger. They include HIPPO admission and any Nx dependency tasks.
- **Counts** are only those plainly printed in the final run's log. Build, lint, typecheck, codegen and bundle rows
  print no test count. Static mapping rows print features and expanded scenarios, not executed tests.

### Rows that needed more than one run

HIPPO exit 124 means the work was deferred before it started, or was shed for memory pressure. Exit 130 means the
run was interrupted. Neither is a product result.

| Row | Target                           | Earlier runs (exit, seconds)           | Why, from the logs                                                                                                                                                                                                                                                         | Final run      |
| --: | -------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
|  14 | `ayokoding-www:build`            | 130 (5), 124 (11), 124 (628), 124 (17) | Interrupted once (130). Then HIPPO shed the child for memory pressure at 11 seconds, and again after the Next.js build had started (628 seconds). The last 124 took 17 seconds, which fits a deferral; its log was overwritten by the final run. None are product results. | 0 (696), heavy |
|  17 | `ayokoding-www:test:quick`       | 1 (603)                                | Vitest: 1 failed file, 4 failed tests, 4,236 passed of 4,240. All four failures were in `course-metadata.steps.ts` (see below).                                                                                                                                            | 0 (608)        |
|  20 | `ayokoding-www:test:integration` | 124 (562)                              | HIPPO shed the run for memory pressure after the payload had run, during the Next.js build dependency.                                                                                                                                                                     | 0 (725)        |
|  21 | `ayokoding-www:test:unit`        | 1 (619)                                | Same four `course-metadata.steps.ts` failures as row 17 (4,236 passed of 4,240).                                                                                                                                                                                           | 0 (571)        |
|  76 | `ose-be-e2e:test:e2e`            | 1 (14), 1 (36)                         | First run: short image name `nats:latest` could not resolve under Podman. Second run: after the image fix, 4 of 5 cases passed and the migrations case failed because a step helper still called the `docker` command.                                                     | 0 (41)         |
|  80 | `organiclever-be:typecheck`      | 124 (16)                               | HIPPO deferred the work: "safe admission was not reached" (capacity deferred).                                                                                                                                                                                             | 0 (24)         |
|  88 | `organiclever-be-e2e:test:e2e`   | 1 (14), 1 (34), 124 (17), 124 (17)     | Same two defects as row 76. The second run passed 11 of 12 cases and failed the migrations case. The two 124 runs were HIPPO capacity deferrals (the log of the second 124 was overwritten by the final run).                                                              | 0 (40)         |

**Rows 17 and 21, `course-metadata`.** The log reports `just-enough-csharp: estimatedHours: stored 3, expected 5`
for 1 course. The check derives the expected value from the files it reads in each course directory, so a stray
file in the content tree during that run is the leading hypothesis. This is **not confirmed**: the worktree was
clean when checked afterwards, and the failing run's file list was not kept. Both rows passed on rerun with no
code change, at 251 files and 4,240 tests. The cause stays open as a learning (see `learnings.md`) and is not
claimed as fixed.

**Rows 76 and 88, two real migration defects.** Both are fixed in commit `88a20850c`.

1. Short Docker Hub image names (for example `nats:latest`) cannot be resolved by rootless Podman, which has no
   unqualified-search registry. The fix qualifies them, for example as `docker.io/library/...`. Regression
   validator: `scripts/container-image-qualified.test.mjs`.
2. The be-e2e step helpers (`backend-process.ts` in both projects) still called the `docker` command to reset the
   database. That call was denied at the Docker socket. The fix runs them through Podman. Regression validator:
   `scripts/no-docker-binary-calls.test.mjs`.

### Rows not run in this local pass

| Row | Target                              | What the files say                                                                                                                                                                                                                                                                           |
| --: | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  26 | `ayokoding-www-be-e2e:test:e2e`     | `delivery.md` records a maintainer exception: rows 14, 20, 26 and 33 may be proven in test-only CI. `evidence/P2/ci.md` defines the temporary CI proof job that runs rows 26 and 33. Rows 14 and 20 also ran locally here and passed.                                                        |
|  33 | `ayokoding-www-fe-e2e:test:e2e`     | Same exception and same CI proof job as row 26. The job sets `E2E_FULL_MATRIX=1` so all three browsers run with zero retries.                                                                                                                                                                |
|  92 | `organiclever-www:test:integration` | N/A at baseline. The project has no integration target. The workflow caller ran no task and exited 0. It is a caller observation, not a test.                                                                                                                                                |
| 100 | `ose-app-web-e2e:test:e2e`          | Legacy app scaffold. `tech-docs.md` and `delivery.md` keep it unsupported and caller or syntax proof only. At baseline the row was blocked (browser prerequisite). No file I read gives a separate reason for skipping it in this pass; the run operator marked it as intentionally not run. |
| 107 | `organiclever-app-web-e2e:test:e2e` | Same as row 100. The P0 readiness notes record an earlier native run where 60 of 63 Chromium cases passed and 3 failed (two language, one progress), so it was not a clean pass. That run is not part of this pass.                                                                          |

## Per-row results

Verdict codes: `match` means the observed count equals the baseline count. `differs` points to a note below the
table. Nothing in the table is marked UNEXPLAINED. Notes C and D say exactly which part of the count change is
itemized and which part is not.

| Row | Target                                            | Final exit | Wall s | Observed counts                                                                | Baseline counts                                                                  | Verdict                                                                    |
| --: | ------------------------------------------------- | ---------: | -----: | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
|   1 | `ayokoding-cli:build`                             |          0 |      7 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|   2 | `ose-contracts:bundle`                            |          0 |     15 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|   3 | `ose-be:codegen`                                  |          0 |     23 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|   4 | `ose-app-web:codegen`                             |          0 |     18 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|   5 | `organiclever-contracts:bundle`                   |          0 |     15 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|   6 | `organiclever-be:codegen`                         |          0 |     18 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|   7 | `organiclever-app-web:codegen`                    |          0 |     16 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|   8 | `ayokoding-cli:lint`                              |          0 |     16 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|   9 | `ayokoding-cli:typecheck`                         |          0 |      9 | compile-only; no tests run                                                     | compile-only; no tests run                                                       | match                                                                      |
|  10 | `ayokoding-cli:test:unit`                         |          0 |    217 | Go: 15 packages ok, no case counts printed                                     | Go: bdd (and integration for row 11) package ok; no case counts printed          | match (both print package results only)                                    |
|  11 | `ayokoding-cli:test:integration`                  |          0 |    179 | Go: 2 packages ok (bdd, integration), no case counts printed                   | Go: bdd (and integration for row 11) package ok; no case counts printed          | match (both print package results only)                                    |
|  12 | `ayokoding-cli:test:e2e`                          |          0 |    222 | Go: 1 package ok (bdd), no case counts printed                                 | Go: bdd (and integration for row 11) package ok; no case counts printed          | match (both print package results only)                                    |
|  13 | `ayokoding-cli:test:coverage:behaviour`           |          0 |      4 | mapping 14 features / 70 scenarios                                             | mapping 13 features / 64 scenarios                                               | differs: see note A                                                        |
|  14 | `ayokoding-www:build`                             |          0 |    696 | 3,278 static pages built                                                       | 3,278 static pages built                                                         | match                                                                      |
|  15 | `ayokoding-www:lint`                              |          0 |      5 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  16 | `ayokoding-www:typecheck`                         |          0 |      8 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  17 | `ayokoding-www:test:quick`                        |          0 |    608 | Vitest 251 files / 4,240 tests; mapping 63 features / 500 scenarios            | Vitest 247 files / 4,177 tests; mapping 63 features / 487 scenarios              | differs: see notes B and C (file count explained; test split not itemized) |
|  18 | `ayokoding-www:test:coverage:behaviour`           |          0 |     10 | mapping 63 features / 500 scenarios                                            | mapping 63 features / 487 scenarios                                              | differs: see note B                                                        |
|  19 | `ayokoding-www:test:coverage`                     |          0 |     18 | mapping 63 features / 500 scenarios                                            | mapping 63 features / 487 scenarios                                              | differs: see note B                                                        |
|  20 | `ayokoding-www:test:integration`                  |          0 |    725 | Vitest 13 files / 192 tests; 3,278 static pages                                | Vitest 13 files / 192 tests; 3,278 static pages                                  | match                                                                      |
|  21 | `ayokoding-www:test:unit`                         |          0 |    571 | Vitest 251 files / 4,240 tests                                                 | Vitest 247 files / 4,177 tests                                                   | differs: see note C (file count explained; test split not itemized)        |
|  22 | `ayokoding-www-be-e2e:lint`                       |          0 |      8 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  23 | `ayokoding-www-be-e2e:typecheck`                  |          0 |      7 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  24 | `ayokoding-www-be-e2e:test:quick`                 |          0 |     10 | mapping 7 features / 43 scenarios                                              | mapping 7 features / 43 scenarios                                                | match                                                                      |
|  25 | `ayokoding-www-be-e2e:test:coverage`              |          0 |      6 | mapping 7 features / 43 scenarios                                              | mapping 7 features / 43 scenarios                                                | match                                                                      |
|  27 | `ayokoding-www-fe-e2e:lint`                       |          0 |      5 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  28 | `ayokoding-www-fe-e2e:typecheck`                  |          0 |      9 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  29 | `ayokoding-www-fe-e2e:test:quick`                 |          0 |     24 | mapping 63 features / 500 scenarios                                            | mapping 63 features / 487 scenarios                                              | differs: see note B                                                        |
|  30 | `ayokoding-cli:test:quick`                        |          0 |    201 | Go: 15 packages ok, no case counts printed; mapping 14 features / 70 scenarios | Go package ok; line coverage 100.00% (25/25); mapping 13 features / 64 scenarios | differs: mapping only, see note A; coverage 100.00% (25/25) unchanged      |
|  31 | `ayokoding-www-be-e2e:test:coverage:behaviour`    |          0 |      4 | mapping 7 features / 43 scenarios                                              | mapping 7 features / 43 scenarios                                                | match                                                                      |
|  32 | `ayokoding-www-fe-e2e:test:coverage`              |          0 |     18 | mapping 63 features / 500 scenarios                                            | mapping 63 features / 487 scenarios                                              | differs: see note B                                                        |
|  34 | `ayokoding-www-fe-e2e:test:coverage:behaviour`    |          0 |      9 | mapping 63 features / 500 scenarios                                            | mapping 63 features / 487 scenarios                                              | differs: see note B                                                        |
|  35 | `ose-www:build`                                   |          0 |     47 | 19 static pages built                                                          | 19 static pages built                                                            | match                                                                      |
|  36 | `ose-www:lint`                                    |          0 |      9 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  37 | `ose-www:typecheck`                               |          0 |      7 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  38 | `ose-www:test:quick`                              |          0 |     40 | Vitest 17 files / 155 tests; mapping 11 features / 29 scenarios                | Vitest 17 files / 155 tests; mapping 11 features / 29 scenarios                  | match                                                                      |
|  39 | `ose-www:test:unit`                               |          0 |     22 | Vitest 17 files / 155 tests                                                    | Vitest 17 files / 155 tests                                                      | match                                                                      |
|  40 | `ose-www:test:integration`                        |          0 |      9 | Vitest 4 files / 54 tests                                                      | Vitest 4 files / 54 tests                                                        | match                                                                      |
|  41 | `ose-www:build:e2e`                               |          0 |     13 | 13 static pages built                                                          | 13 static pages built                                                            | match                                                                      |
|  42 | `ose-www:test:coverage:behaviour`                 |          0 |      4 | mapping 11 features / 29 scenarios                                             | mapping 11 features / 29 scenarios                                               | match                                                                      |
|  43 | `ose-www:test:coverage`                           |          0 |      8 | mapping 11 features / 29 scenarios                                             | mapping 11 features / 29 scenarios                                               | match                                                                      |
|  44 | `ose-www-be-e2e:test:coverage`                    |          0 |      6 | mapping 5 features / 12 scenarios                                              | mapping 5 features / 12 scenarios                                                | match                                                                      |
|  45 | `ose-www-fe-e2e:test:coverage`                    |          0 |      6 | mapping 11 features / 29 scenarios                                             | mapping 11 features / 29 scenarios                                               | match                                                                      |
|  46 | `ose-www-be-e2e:lint`                             |          0 |      4 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  47 | `ose-www-be-e2e:typecheck`                        |          0 |      6 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  48 | `ose-www-be-e2e:test:quick`                       |          0 |     14 | mapping 5 features / 12 scenarios                                              | mapping 5 features / 12 scenarios                                                | match                                                                      |
|  49 | `ose-www-be-e2e:test:e2e`                         |          0 |     19 | Playwright 12 passed; 13 static pages                                          | Playwright 12 passed; 13 static pages                                            | match                                                                      |
|  50 | `ose-www-fe-e2e:lint`                             |          0 |      7 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  51 | `ose-www-fe-e2e:typecheck`                        |          0 |      7 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  52 | `ose-www-fe-e2e:test:quick`                       |          0 |     12 | mapping 11 features / 29 scenarios                                             | mapping 11 features / 29 scenarios                                               | match                                                                      |
|  53 | `ose-www-fe-e2e:test:e2e`                         |          0 |     75 | Playwright 81 passed                                                           | blocked at baseline (no count); later P0 continuation: 81 passed (readiness.md)  | no baseline count; match with the later P0 continuation                    |
|  54 | `ose-www-fe-e2e:test:coverage:behaviour`          |          0 |      6 | mapping 11 features / 29 scenarios                                             | mapping 11 features / 29 scenarios                                               | match                                                                      |
|  55 | `organiclever-www:build`                          |          0 |     10 | no tests; build passed                                                         | baseline build failed (exit 1); pin-upgrade results: PASS                        | differs from baseline, matches pin-upgrade results; see note E             |
|  56 | `organiclever-www:lint`                           |          0 |      5 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  57 | `organiclever-www:typecheck`                      |          0 |      7 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  58 | `organiclever-www:test:quick`                     |          0 |     21 | Vitest 6 files / 68 tests; mapping 3 features / 19 scenarios                   | Vitest 6 files / 68 tests; mapping 3 features / 19 scenarios                     | match                                                                      |
|  59 | `organiclever-www:test:unit`                      |          0 |     12 | Vitest 6 files / 68 tests                                                      | Vitest 6 files / 68 tests                                                        | match                                                                      |
|  60 | `organiclever-www:test:coverage:behaviour`        |          0 |      4 | mapping 3 features / 19 scenarios                                              | mapping 3 features / 19 scenarios                                                | match                                                                      |
|  61 | `organiclever-www-fe-e2e:lint`                    |          0 |      5 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  62 | `organiclever-www-fe-e2e:typecheck`               |          0 |      6 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  63 | `organiclever-www-fe-e2e:test:quick`              |          0 |     10 | mapping 3 features / 19 scenarios                                              | mapping 3 features / 19 scenarios                                                | match                                                                      |
|  64 | `organiclever-www-fe-e2e:test:e2e`                |          0 |     66 | Playwright 39 passed                                                           | blocked at baseline (no count); later P0 continuation: 39 passed (readiness.md)  | no baseline count; match with the later P0 continuation                    |
|  65 | `organiclever-www-fe-e2e:test:coverage:behaviour` |          0 |      4 | mapping 3 features / 19 scenarios                                              | mapping 3 features / 19 scenarios                                                | match                                                                      |
|  66 | `ose-be:build`                                    |          0 |     28 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  67 | `ose-be:lint`                                     |          0 |     59 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  68 | `ose-be:typecheck`                                |          0 |     19 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  69 | `ose-be:test:quick`                               |          0 |    107 | .NET 44 tests; mapping 10 features / 15 scenarios                              | .NET 44 tests; mapping 10 features / 15 scenarios                                | match                                                                      |
|  70 | `ose-be:test:unit`                                |          0 |     28 | .NET 44 tests                                                                  | .NET 44 tests                                                                    | match                                                                      |
|  71 | `ose-be:test:integration`                         |          0 |     15 | .NET 5 tests                                                                   | .NET 5 tests                                                                     | match                                                                      |
|  72 | `ose-be:test:coverage:behaviour`                  |          0 |      4 | mapping 10 features / 15 scenarios                                             | mapping 10 features / 15 scenarios                                               | match                                                                      |
|  73 | `ose-be-e2e:lint`                                 |          0 |      5 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  74 | `ose-be-e2e:typecheck`                            |          0 |      8 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  75 | `ose-be-e2e:test:quick`                           |          0 |     12 | mapping 10 features / 15 scenarios                                             | mapping 10 features / 15 scenarios                                               | match                                                                      |
|  76 | `ose-be-e2e:test:e2e`                             |          0 |     41 | Playwright 5 passed                                                            | Playwright 5 passed                                                              | match                                                                      |
|  77 | `ose-be-e2e:test:coverage:behaviour`              |          0 |      4 | mapping 10 features / 15 scenarios                                             | mapping 10 features / 15 scenarios                                               | match                                                                      |
|  78 | `organiclever-be:build`                           |          0 |     26 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  79 | `organiclever-be:lint`                            |          0 |     47 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  80 | `organiclever-be:typecheck`                       |          0 |     24 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  81 | `organiclever-be:test:quick`                      |          0 |    108 | .NET 49 tests; mapping 7 features / 18 scenarios                               | .NET 49 tests; mapping 7 features / 18 scenarios                                 | match                                                                      |
|  82 | `organiclever-be:test:unit`                       |          0 |     27 | .NET 49 tests                                                                  | .NET 49 tests                                                                    | match                                                                      |
|  83 | `organiclever-be:test:integration`                |          0 |     13 | .NET 4 tests                                                                   | .NET 4 tests                                                                     | match                                                                      |
|  84 | `organiclever-be:test:coverage:behaviour`         |          0 |      4 | mapping 7 features / 18 scenarios                                              | mapping 7 features / 18 scenarios                                                | match                                                                      |
|  85 | `organiclever-be-e2e:lint`                        |          0 |      4 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  86 | `organiclever-be-e2e:typecheck`                   |          0 |      8 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  87 | `organiclever-be-e2e:test:quick`                  |          0 |     10 | mapping 7 features / 18 scenarios                                              | mapping 7 features / 18 scenarios                                                | match                                                                      |
|  88 | `organiclever-be-e2e:test:e2e`                    |          0 |     40 | Playwright 12 passed                                                           | Playwright 12 passed                                                             | match                                                                      |
|  89 | `organiclever-be-e2e:test:coverage:behaviour`     |          0 |      4 | mapping 7 features / 18 scenarios                                              | mapping 7 features / 18 scenarios                                                | match                                                                      |
|  90 | `ose-www-be-e2e:test:coverage:behaviour`          |          0 |      4 | mapping 5 features / 12 scenarios                                              | mapping 5 features / 12 scenarios                                                | match                                                                      |
|  91 | `organiclever-www:test:coverage`                  |          0 |      7 | mapping 3 features / 19 scenarios                                              | mapping 3 features / 19 scenarios                                                | match                                                                      |
|  93 | `organiclever-www-fe-e2e:test:coverage`           |          0 |      5 | mapping 3 features / 19 scenarios                                              | mapping 3 features / 19 scenarios                                                | match                                                                      |
|  94 | `ose-be:test:coverage`                            |          0 |     12 | mapping 10 features / 15 scenarios                                             | mapping 10 features / 15 scenarios                                               | match                                                                      |
|  95 | `ose-app-web:lint`                                |          0 |      8 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
|  96 | `ose-app-web:test:quick`                          |          0 |     27 | Vitest 7 files / 32 tests; mapping 1 features / 1 scenarios                    | Vitest 7 files / 32 tests; mapping 1 features / 1 scenarios                      | match                                                                      |
|  97 | `ose-app-web:test:coverage`                       |          0 |      8 | mapping 1 features / 1 scenarios                                               | mapping 1 features / 1 scenarios                                                 | match                                                                      |
|  98 | `ose-be-e2e:test:coverage`                        |          0 |      6 | mapping 10 features / 15 scenarios                                             | mapping 10 features / 15 scenarios                                               | match                                                                      |
|  99 | `ose-app-web-e2e:test:coverage`                   |          0 |      5 | mapping 1 features / 1 scenarios                                               | mapping 1 features / 1 scenarios                                                 | match                                                                      |
| 101 | `organiclever-be:test:coverage`                   |          0 |      9 | mapping 7 features / 18 scenarios                                              | mapping 7 features / 18 scenarios                                                | match                                                                      |
| 102 | `organiclever-app-web:lint`                       |          0 |      8 | no tests (not a test target)                                                   | no tests                                                                         | match (exit 0)                                                             |
| 103 | `organiclever-app-web:test:quick`                 |          0 |    124 | Vitest 53 files / 555 tests; mapping 13 features / 68 scenarios                | Vitest 52 files / 547 tests; mapping 13 features / 68 scenarios                  | differs: see note D (file count explained; test split not itemized)        |
| 104 | `organiclever-app-web:test:coverage`              |          0 |      8 | mapping 13 features / 68 scenarios                                             | mapping 13 features / 68 scenarios                                               | match                                                                      |
| 105 | `organiclever-be-e2e:test:coverage`               |          0 |      6 | mapping 7 features / 18 scenarios                                              | mapping 7 features / 18 scenarios                                                | match                                                                      |
| 106 | `organiclever-app-web-e2e:test:coverage`          |          0 |      6 | mapping 13 features / 68 scenarios                                             | mapping 13 features / 68 scenarios                                               | match                                                                      |

### Notes on differences

**Note A, ayokoding-cli static mapping (rows 13 and 30): 13 features / 64 scenarios became 14 / 70.** Evidence is
the git diff from the baseline revision. The branch added `rootless-runtime.feature` (3 scenarios, new file) and
grew `toolchain-catalog.feature` from 3 to 5 scenarios and `environment-failures.feature` from 4 to 5. That is
3 + 2 + 1 = 6 more scenarios and 1 more feature file. This matches the "Runner behavior specification delta" in
`tech-docs.md`. Row 30 also shows selected production line coverage 100.00% (25/25 statements), the same as at
baseline.

**Note B, ayokoding-www static mapping (rows 17, 18, 19, 29, 32, 34): 487 scenarios became 500, features stay 63.**
The branch changed `build-workers.feature` from 1 to 5 scenario headings. The three new Scenario Outlines have 3,
5 and 4 example rows, and there is 1 new plain scenario: 3 + 5 + 4 + 1 = 13 more expanded scenarios, and
487 + 13 = 500. No feature file was added. The www-be-e2e rows (24, 25, 31) did not change (7 / 43).

**Note C, ayokoding-www Vitest (rows 17 and 21): 247 files / 4,177 tests became 251 / 4,240.** The file count is
fully explained: four test files were added on the branch since the baseline revision
(`ai-benchmark-browser-setup.unit.test.ts`, `content-layout-sidebar.test.tsx`, `mermaid.test.tsx`, and
`build-typecheck-config.unit.test.ts`), and 247 + 4 = 251. The P0 pin-upgrade results show the count rising in
steps: 248 / 4,180 (three Mermaid regressions), 249 / 4,187, and 250 / 4,235. The last step here, 250 / 4,235 to
251 / 4,240, equals the last added file, `build-typecheck-config.unit.test.ts`, which has 5 test blocks (commit
`aee7ca07f`). Not itemized: how the earlier +58 tests (4,177 to 4,235) split between the other new files and the
edited `build-workers` and `sidebar-host` tests. The four new files hold 13 test blocks by a simple text count.
I did not run any test to measure the split.

**Note D, organiclever-app-web quick (row 103): 52 files / 547 tests became 53 / 555.** The branch added
`apps/organiclever-app-web/tests/unit/e2e-fixture-contracts.unit.test.ts` (commit `82224fb9b`), which accounts for
the extra file. The +8 tests are not itemized: the file has 4 test blocks by a simple text count, and some sit in
loops. The P0 pin-upgrade results record 53 files / 555 tests as the later accepted count, which equals this run.

**Note E, organiclever-www build (row 55).** The baseline run failed with exit 1 (Next.js 16.2.6, Turbopack could
not resolve the Google font module). The pin-upgrade results record the row as PASS. This run passed under
Next.js 16.4.3, which the log banner shows. `evidence/P0/next-prerequisite.md` records the repin to 16.4.3 and
that its release notes include a fix for extensionless Google Font URLs. No file I read states outright that the
repin fixed this exact failure, so treat the cause as consistent with the repin, not proven.

**Other checks that match.** Row 14 built 3,278 of 3,278 static pages (baseline: 3,278). Row 35 built 19 pages and
row 41 built 13, as at baseline. Rows 53 (81 cases) and 64 (39 cases) were blocked at baseline, so they have no
baseline count. Both equal the later P0 continuation counts in `evidence/P0/readiness.md`. No final log prints a
failed or skipped test count. The final log of row 20 carries an Nx notice, "detected a flaky task", for the
`ayokoding-www:build` dependency. The log gives no reason. That build task had been shed by HIPPO in earlier
runs (row 14 and the first row 20 run). The notice is not a test failure, and no test was retried.

## Not proven here

- **Rows 26 and 33** (Ayo backend and frontend E2E) were not run locally. They depend on the temporary CI proof job
  defined in `evidence/P2/ci.md`. This file claims no result for them. The copy of `ci.md` in this worktree says
  no run had executed when I read it, so any CI result must be taken from that file once it records one.
- **The Ayo public stack and acceptance criterion AC-03** (container-backed test entry points) are not proven by
  this matrix run. Exit codes and test counts here do not show which container engine served each row, and
  the Ayo stack depends on the same CI proof job.
- **Rows 100 and 107** (legacy app scaffolds) were not run. They stay unsupported and are not supported-stack
  evidence either way.
- **Row 92** is N/A and is not a test.
- **Browser coverage for Ayo frontend E2E** (three browsers, zero retries) is only defined by the CI job. Nothing
  here covers it.
- **Test counts that differ from baseline** (notes C and D) are explained by added tests, but the exact per-file
  split is not measured.

## Final-head reruns

This section records a rerun of the rows whose project inputs changed after the matrix above was recorded. It does not
replace the table above.

- **Head:** `60a35faf1425001c5444239444f1404c61ff84b4` (branch `docker-to-podman-base`), run on 2026-10-29.
  `git status` shows no uncommitted change under `apps/`, `libs/`, `specs/` or `scripts/`. Only docs and plans edits by
  other work were uncommitted.
- **What changed since the table above** (commit `60a35faf1`, with the ayokoding-www edits after `88a20850c`):
  `ayokoding-www` `src/features/content/shell/mermaid.tsx`, unit tests and Gherkin step binders, the Ayo frontend E2E
  `content-rendering.steps.ts`, both Ayo Playwright configs, and three feature files
  (`content-rendering`, `canonical-fallback`, `sidebar-course-categories`).
- **How each row ran:** the same shape as above, one row at a time:
  `./hippo run --class ephemeral --resource-tier <tier> --disk-path . -- npm exec nx -- run <project>:<target>`, with
  `NX_SKIP_NX_CACHE=true`, the Compose provider variable set, and `TMPDIR=<short-tmp>`. Tier was `standard`, except
  rows 14 and 20 (see below). Nothing else ran from this session at the same time.
- **Not rerun:** rows 26 and 33 (CI only) and the web-UI extra.
- **Wall seconds** include HIPPO admission and any Nx dependency tasks. **Counts** are only those printed in the
  final passing log of each row.

### Per-row results

| Row | Target                                         | Final exit | Wall s | HIPPO                        | Observed counts                                     | Baseline (table above)                       | Verdict                         |
| --: | ---------------------------------------------- | ---------: | -----: | ---------------------------- | --------------------------------------------------- | -------------------------------------------- | ------------------------------- |
|  14 | `ayokoding-www:build`                          |          0 |    716 | heavy; shed 124 once (775 s) | 3,278 of 3,278 static pages built                   | 3,278 static pages built                     | match                           |
|  15 | `ayokoding-www:lint`                           |          0 |      7 | admitted first try           | no tests (not a test target)                        | no tests                                     | match (exit 0)                  |
|  16 | `ayokoding-www:typecheck`                      |          0 |     21 | admitted first try           | no tests (not a test target)                        | no tests                                     | match (exit 0)                  |
|  17 | `ayokoding-www:test:quick`                     |          0 |    661 | admitted first try           | Vitest 251 files / 4,291 tests; mapping 63 / 509    | Vitest 251 / 4,240; mapping 63 / 500         | differs: see notes F and G      |
|  18 | `ayokoding-www:test:coverage:behaviour`        |          0 |     11 | admitted first try           | mapping 63 features / 509 scenarios                 | mapping 63 / 500                             | differs: see note F             |
|  19 | `ayokoding-www:test:coverage`                  |          0 |     17 | admitted first try           | mapping 63 features / 509 scenarios                 | mapping 63 / 500                             | differs: see note F             |
|  20 | `ayokoding-www:test:integration`               |          0 |    732 | heavy; shed 124 three times  | Vitest 13 files / 192 tests; 3,278 static pages     | Vitest 13 / 192; 3,278 static pages          | match (see note H for the tier) |
|  21 | `ayokoding-www:test:unit`                      |          0 |    613 | admitted first try           | Vitest 251 files / 4,291 tests                      | Vitest 251 / 4,240                           | differs: see note G             |
|  22 | `ayokoding-www-be-e2e:lint`                    |          0 |      5 | admitted first try           | no tests (not a test target)                        | no tests                                     | match (exit 0)                  |
|  23 | `ayokoding-www-be-e2e:typecheck`               |          0 |      7 | admitted first try           | no tests (not a test target)                        | no tests                                     | match (exit 0)                  |
|  24 | `ayokoding-www-be-e2e:test:quick`              |          0 |     11 | admitted first try           | mapping 7 features / 43 scenarios                   | mapping 7 / 43                               | match                           |
|  25 | `ayokoding-www-be-e2e:test:coverage`           |          0 |      9 | admitted first try           | mapping 7 features / 43 scenarios                   | mapping 7 / 43                               | match                           |
|  31 | `ayokoding-www-be-e2e:test:coverage:behaviour` |          0 |      4 | admitted first try           | mapping 7 features / 43 scenarios                   | mapping 7 / 43                               | match                           |
|  27 | `ayokoding-www-fe-e2e:lint`                    |          0 |      5 | admitted first try           | no tests (not a test target)                        | no tests                                     | match (exit 0)                  |
|  28 | `ayokoding-www-fe-e2e:typecheck`               |          0 |     10 | admitted first try           | no tests (not a test target)                        | no tests                                     | match (exit 0)                  |
|  29 | `ayokoding-www-fe-e2e:test:quick`              |          0 |     26 | admitted first try           | mapping 63 features / 509 scenarios                 | mapping 63 / 500                             | differs: see note F             |
|  32 | `ayokoding-www-fe-e2e:test:coverage`           |          0 |     17 | admitted first try           | mapping 63 features / 509 scenarios                 | mapping 63 / 500                             | differs: see note F             |
|  34 | `ayokoding-www-fe-e2e:test:coverage:behaviour` |          0 |     10 | admitted first try           | mapping 63 features / 509 scenarios                 | mapping 63 / 500                             | differs: see note F             |
| 100 | `ose-app-web-e2e:test:e2e`                     |          0 |     21 | admitted first try           | Playwright 1 passed (Chromium); built `ose-app-web` | blocked at baseline; P0 continuation: 1 case | match with the P0 continuation  |
| 107 | `organiclever-app-web-e2e:test:e2e`            |          0 |    148 | admitted first try           | Playwright 63 passed, 0 failed (Chromium, 1 worker) | P0 continuation: 60 passed, 3 failed         | differs: see note I             |

Row 107 also needed `organiclever-app-web:build` first (heavy, exit 0, 29 s, admitted first try). Its `test:e2e`
target has no build dependency, and the old standalone build in `.next` pre-dated commit `82224fb9b`. The build is a
prerequisite step, not a matrix row.

### Notes on differences

**Note F, ayokoding-www static mapping (rows 17, 18, 19, 29, 32, 34): 500 scenarios became 509, features stay 63.**
Evidence is `git diff 88a20850c 60a35faf1 -- specs`. `content-rendering.feature` grew from 13 to 17 scenarios (+4:
two Mermaid keyboard scenarios, one focus-order scenario, one focus-indicator scenario). `canonical-fallback.feature`
gained one Scenario Outline with 4 example rows (+4 expanded). `sidebar-course-categories.feature` grew from 4 to 5
(+1). That is 4 + 4 + 1 = 9, and 500 + 9 = 509, as printed. No feature file was added. The ayokoding-www-be-e2e rows
(24, 25, 31) did not change (7 / 43).

**Note G, ayokoding-www Vitest (rows 17 and 21): 251 files / 4,240 tests became 251 / 4,291 (+51), files unchanged.**
No test file was added or removed. The +51 is itemized from the diff and from `vitest list` of the three changed step
files, where the `vitest-cucumber` binder makes one test per step and one `Background` test per scenario:

- `content-rendering.steps.tsx`: 4 new scenarios, 7 + 7 + 3 + 5 = 22 step tests, plus 4 `Background` tests = 26.
- `canonical-fallback.steps.tsx`: 1 new outline, 4 steps for each of 4 example rows = 16.
- `sidebar-course-categories.steps.tsx`: 1 new scenario, 7 step tests = 7.
- `mermaid.test.tsx`: 2 new tests in "Mermaid source focus indicator" = 2.

26 + 16 + 7 + 2 = 51, equal to 4,291 - 4,240. The two one-line comment edits in `content-layout-sidebar.test.tsx`
and `sidebar-host.test.tsx` add no tests. Row 17 line coverage is 99.54% (the 99% floor holds), the same as the P0 record.
Both rows ran with no retry.

**Note H, rows 14 and 20 and HIPPO shedding.** HIPPO exit 124 here was `hippo.limit.pressure-shed`, "host pressure shed
this work after the payload ran". It is not a product result. The Next.js build had reached or finished page
generation each time, and the log ends with the Nx failed-task summary for `ayokoding-www:build`.

- Row 14: first run (heavy, run in sequence after row 21) shed at 775 s. The rerun alone, heavy, was admitted and
  passed in 716 s with 3,278 of 3,278 pages in 10.1 min.
- Row 20: three runs at the `standard` tier shed (663 s in sequence; 601 s alone; 434 s alone). A fourth run at the
  `heavy` tier, alone, was admitted and passed in 732 s (build 3,278 of 3,278 pages in 9.6 min; Vitest 13 files /
  192 tests). Row 20 is therefore recorded at `heavy`, not the `standard` tier of the table above. The tier was raised
  because the build dependency, not the integration tests, is what the host sheds. No test, timeout or threshold was
  changed.
- The final logs of rows 14 and 20 carry the Nx notice "detected a flaky task" for `ayokoding-www:build`. That is Nx
  seeing the same task fail (shed) and then pass. No test or build was retried by a tool inside a run.
- The shed logs are kept in `local-tmp/claude/final/` as `log-14-attempt1-shed.txt` and
  `log-20-attempt{1,2,3}-shed.txt`.

**Note I, `organiclever-app-web-e2e:test:e2e` (row 107): 63 passed, 0 failed, where the P0 continuation had 60 passed
and 3 failed.** The earlier failures (two language checks, one exercise-progress card) were recorded on older
source. The commits `82224fb9b` and `24a4c54d4` changed `organiclever-app-web` and its routing specs after that run.
This run passed all 63 on the rebuilt standalone server, with zero retries (`retries` is 0 outside CI). I did not
diagnose the old failures, so I do not claim which change fixed them. The run excludes `@local-fullstack` scenarios, as
declared in the target, so it supplies no fullstack claim. Row 100 passed its one smoke case (4.2 s Playwright time).
Rows 100 and 107 stay legacy scaffolds, unsupported and not supported-stack evidence, as stated above.

### Result of the rerun

All 21 rerun rows ended with exit code 0 on head `60a35faf1`. No failed or skipped test count was printed in any
final log. Test and scenario count differences are fully itemized (notes F and G). The two long rows needed more than
one run because of HIPPO shedding (note H).

## Browser matrix for the changed e2e scenarios (final head)

Head `60a35faf1`. One clean native production build of `ayokoding-www`, then the changed Ayo FE E2E scenarios in
Chromium, Firefox and WebKit with zero retries. The run did not set `CI`, `BASE_URL` or `E2E_FULL_MATRIX`, so
`playwright.config.ts` used all three projects, `retries` 0 and the default worker count (2 on this 4-CPU host).
Playwright started and stopped its own server on port 3101 (`reuseExistingServer: false`); port 3101 was free before the
run. Logs: `local-tmp/claude/browser-matrix/` (`build.log`, `build-attempt1-shed.log`, `list.log`, `run1.log`,
`run1.json`).

**Build.** `.next` and `generated/search-data.json` were removed first. Command (cwd is the repository root):

```text
AYOKODING_WEB_MANIFESTS_DIR=<repo>/apps/ayokoding-www-fe-e2e/fixtures/manifests AYOKODING_WEB_SHOW_DRAFTS=true NX_SKIP_NX_CACHE=true \
  rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-www:build
```

- Attempt 1 (heavy) was shed at 314 s: `hippo.limit.pressure-shed`, exit 124, after the build reached 1,639 of 3,279 pages.
  This is the same host-pressure shed as note H, not a product result.
- Attempt 2 (heavy, alone, after memory pressure had settled) was admitted: exit 0, 716 s wall, 3,279 of 3,279 static
  pages in 9.6 min, search data 2,329 documents (4.1 MB). The Nx notice "detected a flaky task" is attempt 1 then
  attempt 2 of the same task, not a retry inside a run.
- The page count is 3,279, one more than the 3,278 of rows 14 and 20. This build used the fixture manifests directory
  and `AYOKODING_WEB_SHOW_DRAFTS=true`, as the launcher does; I did not diagnose the extra page, and the likely cause is a
  draft page that those two settings reveal.

**Generation and selection.** `npx bddgen` exited 0 (HIPPO `standard` tier, cwd `apps/ayokoding-www-fe-e2e`). The command
`npx playwright test --list --project=chromium --project=firefox --project=webkit -g "<regex>"` printed 45 tests in 3
files: 15 per browser. The regex was
`Content Rendering|Progress screens pass automated accessibility checks|Resetting progress clears it after confirmation`.
The 15 are the 13 `Content Rendering` scenarios that are not `@e2e-exempt`, plus the two learning-progress scenarios.
`content-rendering.feature` has 17 scenarios; four are `@e2e-exempt` (YouTube shortcode, Mermaid keyboard-reachable while
pending, Mermaid keyboard-reachable when the render fails, focused Mermaid source indicator) and are covered at the unit
tier, so playwright-bdd does not generate them. The selection includes the new rendered-Mermaid scenarios
`Mermaid diagram renders as an SVG` and `The Mermaid source leaves keyboard focus order once the diagram renders`.

**Run.** Command (cwd `apps/ayokoding-www-fe-e2e`, with `AYOKODING_WEB_MANIFESTS_DIR` and `AYOKODING_WEB_SHOW_DRAFTS=true`
exported), under `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- bash <script>`; admitted on the
first try, exit 0, 186 s wall:

```text
npx playwright test --project=chromium --project=firefox --project=webkit --retries=0 --trace=retain-on-failure \
  --reporter=list,json -g "Content Rendering|Progress screens pass automated accessibility checks|Resetting progress clears it after confirmation"
```

| Browser  | Executed | Passed | Failed | Skipped | Flaky | First test to last test finish |
| -------- | -------: | -----: | -----: | ------: | ----: | -----------------------------: |
| Chromium |       15 |     15 |      0 |       0 |     0 |                         53.9 s |
| Firefox  |       15 |     15 |      0 |       0 |     0 |                         75.4 s |
| WebKit   |       15 |     15 |      0 |       0 |     0 |                         68.1 s |
| Total    |       45 |     45 |      0 |       0 |     0 |       185.2 s (Playwright run) |

The three browsers ran interleaved on 2 workers, so the per-browser spans overlap and do not add up to the total. The
Firefox `waitForURL` timeout from `markCompleteAndContinue` (`complete-course.ts:78`, see `evidence/P2/ci.md`, "Row 33
failure investigation") did not occur; `Resetting progress clears it after confirmation` and `Progress screens pass
automated accessibility checks` passed in all three browsers on the first attempt. This is one run, so it neither proves
nor rules out the intermittent. No product, step or test file was changed.
