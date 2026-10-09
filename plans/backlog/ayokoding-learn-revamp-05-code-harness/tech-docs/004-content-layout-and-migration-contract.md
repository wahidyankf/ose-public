# Content Layout Today and the Migration Contract

This file records how course code is laid out today (measured 2026-10-09 at `origin/main`
`bb7f90137`) and fixes the contract that content plans 06–13 follow when they migrate a course
onto the harness. This plan migrates no course.

## Layout Today

| Measure                                  | Value                                                                                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Courses                                  | 181                                                                                                                                                                                                         |
| Courses with at least one code dir       | 110 (222 code dirs)                                                                                                                                                                                         |
| Courses with code fences but no code dir | 6: `capstone-build-your-own-pentest-engine`, `capstone-concurrency-and-systems`, `capstone-concurrency-showdown`, `capstone-data-pipeline`, `capstone-secure-service`, `self-managed-kubernetes-and-gitops` |
| Courses with neither                     | 65 (not applicable to the harness until code is added)                                                                                                                                                      |
| Applicable courses                       | 116 (110 + 6)                                                                                                                                                                                               |
| `run.yaml` files                         | 0                                                                                                                                                                                                           |

How the 110 courses with code dirs arrange their first-level entries:

| Arrangement                                          | Courses |
| ---------------------------------------------------- | ------- |
| `ex-NN-*` directories plus other entries             | 74      |
| `ex-NN-*` directories only                           | 11      |
| Other entries only (capstone projects, shared files) | 21      |
| Flat `ex-NN-*.<ext>` files only                      | 2       |
| Flat files plus other entries                        | 2       |

Where the 222 code dirs sit:

| Placement                      | Count | Contract status                         |
| ------------------------------ | ----- | --------------------------------------- |
| `learning/code/`               | 100   | Canonical (examples)                    |
| `learning/capstone/code/`      | 84    | Canonical (capstone unit)               |
| `drilling/code/`               | 31    | Canonical (katas)                       |
| `code/` at the course root     | 5     | Move to `learning/capstone/code/`       |
| `learning/coroutines/code/`    | 1     | Move into `learning/code/ex-NN-<slug>/` |
| `learning/capstone/live/code/` | 1     | Move into `learning/capstone/code/`     |

Other shapes:

- 6,109 `ex-NN-*` directories, of which 808 hold a test-like file;
- 136 flat `ex-NN-*.<ext>` files, which must become directories;
- 666 other entries directly under code dirs, mostly shared READMEs, lockfiles, and linter configs;
- katas at `drilling/code/kata-NN-<slug>/{before,after}/kata.<ext>`, referenced in drilling pages as
  ``**Before** (`drilling/code/.../before/kata.sql`)``, which is already the labelled-path anchor
  form.

### Lesson-to-File Agreement Today

Across 1,967 Markdown files outside code dirs:

- 3,568 bold-path anchors are followed by a fence;
- 3,401 of them resolve to a file and 167 point to a missing file;
- 2,277 match the file exactly and 1,124 do not.

The mismatches are spread over 25 courses. The worst are:

| Course                                 | Mismatches |
| -------------------------------------- | ---------- |
| database-internals-and-storage-engines | 120        |
| version-control-and-git                | 94         |
| nosql-databases                        | 93         |
| extending-neovim                       | 89         |
| just-enough-lua                        | 87         |
| search-and-information-retrieval       | 84         |
| self-hosting-essentials                | 82         |
| build-your-own-reactive-ui             | 80         |
| just-enough-c                          | 78         |
| linux-app-development                  | 78         |
| windows-app-development                | 78         |

Some missing-file anchors resolve relative to the Markdown file instead of the course. The contract
requires course-relative paths.

### Languages

| Dominant code language per course | Courses |
| --------------------------------- | ------- |
| Python                            | 59      |
| Shell                             | 8       |
| C                                 | 6       |
| TypeScript                        | 4       |
| Go                                | 4       |
| Lua                               | 3       |
| Every other language              | 2 or 1  |

Fence info strings across all lessons:

| Info string | Fences |
| ----------- | ------ |
| text        | 5,251  |
| python      | 1,436  |
| mermaid     | 1,373  |
| sh          | 325    |
| bash        | 266    |
| go          | 204    |
| shell       | 172    |
| elixir      | 157    |
| swift       | 154    |
| dart        | 149    |
| yaml        | 139    |
| kotlin      | 83     |
| c           | 82     |
| csharp      | 77     |
| cpp         | 75     |
| typescript  | 69     |
| lua         | 54     |
| rust        | 46     |

Version mentions that pin toolchain choices:

- the database courses mention PostgreSQL 18 110 times;
- `graph-databases` teaches Cypher 25 and Cypher 5 and mentions Neo4j 2026.02;
- `just-enough-lua` mentions Lua 5.1, LuaJIT, and Lua 5.5;
- `just-enough-typescript` mentions TypeScript 7.0;
- `cloud-and-iac` mentions Terraform in 29 files and OpenTofu in 5.

## Migration Contract for Plans 06–13

Each content plan applies these steps to every course it owns. Each course belongs to exactly one
content plan. The steps are numbered so a content plan's per-course checklist can cite them.

| Step | Obligation                                                                                                                                                                                                                                                                                                        | Proof                                                                   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| M1   | Baseline: run `ayokoding-cli examples validate --course <slug>` and `ayokoding-cli examples sync --course <slug>` and save the finding counts. An explicit `--course` works before the course opts in.                                                                                                            | Finding counts in the execution ledger                                  |
| M2   | Layout: put every runnable program in a canonical unit. Flat `ex-NN-<slug>.<ext>` files become `ex-NN-<slug>/` folders, and other code dirs move to the canonical place. Rewrite every anchor to the course-relative path.                                                                                        | `examples validate --course <slug>` has no `ayokoding.layout.*` finding |
| M3   | Toolchain: pick a catalog id. If the course needs a toolchain the catalog lacks, add it in the same PR under [Adding a Toolchain](./005-runners-and-toolchain-catalog.md#adding-a-toolchain); that PR then gets a full run.                                                                                       | `ayokoding-cli toolchains list` shows the id                            |
| M4   | Dependencies: each third-party dependency is locked with hashes in a lockfile inside the course and declared in `dependencies.lockfile`. Nothing is downloaded at run time.                                                                                                                                       | The run passes with `--network none`                                    |
| M5   | Run specs: write one `run.yaml` per unit under [tech-docs/003](./003-run-yaml-contract.md). Record missing expected files with `examples run --course <slug> --record` (it writes only missing files), then **read every recorded file** and confirm it shows what the lesson claims.                             | Every unit covered; expected files reviewed                             |
| M6   | Lessons: anchor every code fence or mark it `<!-- harness: illustration -->`; anchor every `**Output**` block to its expected file; then run `examples sync --write --course <slug>`.                                                                                                                             | `examples sync --course <slug>` exits 0                                 |
| M7   | Determinism: no network, no wall clock, no unseeded randomness, no output that depends on thread order. Distributed, concurrency, Raft, actor, and CSP examples follow the simulation convention in [tech-docs/006](./006-determinism-and-simulation.md).                                                         | The double run passes; simulation runs print the summary line           |
| M8   | Static mode only for the closed reasons (`cloud`, `cluster`, `ios`, `android`, `windows`), each with a note saying what the static run proves.                                                                                                                                                                    | `examples validate` accepts the spec                                    |
| M9   | Green: `ayokoding-cli examples check --course <slug>` exits 0. Under decision 29 this is the last step after the mode gate and the Content Quality Gate. A course still red after the 2-cycle caps is marked BLOCKED with its findings.                                                                           | Exit status and summary in the execution ledger                         |
| M10  | Coverage: at the end of the plan, `ayokoding-cli examples coverage --output json` shows `covered: true` for every course the plan owns.                                                                                                                                                                           | JSON saved as plan evidence                                             |
| M11  | Harness defects: a harness bug that blocks the plan is fixed as root-cause work with a regression test in `apps/ayokoding-cli`, in the same PR. A content plan never weakens the contract, never edits an expected file to hide a wrong output, and never marks a runnable block as an illustration to pass sync. | Regression test, or a recorded follow-up                                |

### What "Covered" Means

Coverage is static and cheap. It does not run containers.

- A **unit** is covered when it holds a `run.yaml` that validates.
- A **course** is applicable when it has a code dir with files or a code fence. It is covered when
  all of these hold:
  - it is opted in;
  - every unit is covered;
  - validation and sync report no finding.
- The course percentage is covered applicable courses divided by applicable courses. Courses that
  are not applicable are listed separately and are not in the denominator.
- "Green" is a runtime fact proved by `examples run` or `examples check`. Plan 14's end-state gate
  needs both: coverage at 100% and a green full run on the same commit.
