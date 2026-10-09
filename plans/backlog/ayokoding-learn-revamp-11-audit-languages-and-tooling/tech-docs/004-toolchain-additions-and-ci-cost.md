# 004 — Toolchain Additions and CI Cost

This plan puts 2,571 units into the harness, and every unit runs twice. That is the largest harness load
in the series so far, and the harness has one hard limit that plan 05 set for pull requests: the check must
finish inside a runner timeout. This page treats that limit as a measured quantity. It says which
toolchains the courses could use but the catalog lacks, why the plan adds none by default, what the check
costs, and what to do when the projection is too tight. All CI figures here are **planning figures** with
invented per-invocation seconds, used only to size the work; Phase 1 replaces them with measurements and every
decision below is re-taken on the measured numbers (decision D16).

## What the Catalog Gives

Toolchain ids and pins as plan 05's catalog reads on 2026-10-09; Phase 0 re-reads the merged catalog, which
plans 06 to 10 extend, and records any change that touches an id this plan uses. Two extensions are known from
plan 09's design (the next section lists them): a `clojure` entry, and a hash-locked jar install recipe that
turns the `java` entry into a derived image. Plan 10's design adds WebAssembly. This plan reuses them
where it can and adds none of its own by default.

| Catalog id    | Pin (2026-10-09) | Notes                                                           |
| ------------- | ---------------- | --------------------------------------------------------------- |
| `python`      | 3.14.8           | Language                                                        |
| `go`          | 1.27.2           | Language                                                        |
| `rust`        | 1.99.0           | Language                                                        |
| `node`        | 24.21.0          | Language                                                        |
| `typescript`  | 7.0.2            | Derived from `node`                                             |
| `java`        | Temurin 25       | Language; plan 09 adds a hash-locked jar recipe (derived image) |
| `kotlin`      | 2.4.21           | Derived from `java`                                             |
| `clojure`     | 1.12.6 (plan 09) | Not used by these 32 courses                                    |
| `dotnet`      | SDK 10 (C# 14)   | Language                                                        |
| `elixir`      | 1.20.4 on OTP 29 | Language                                                        |
| `lua`         | 5.5.1            | Language                                                        |
| `luajit`      | v2.1             | Language                                                        |
| `neovim`      | 0.12.5           | Language (headless)                                             |
| `gcc`         | 16.2             | C and C++ (and Make)                                            |
| `swift`       | 6.4 (Linux)      | Language                                                        |
| `dart`        | 3.13.5           | Language                                                        |
| `flutter`     | 3.41.5           | Language                                                        |
| `shell`       | Debian snapshot  | `bash`, `coreutils`, `git`, `jq`, `sqlite3`                     |
| `opentofu`    | per catalog      | Validator                                                       |
| `kubeconform` | per catalog      | Validator                                                       |
| `swift-parse` | per catalog      | Validator                                                       |
| `ktlint`      | per catalog      | Validator                                                       |

How many of the 32 courses use each id:

| Catalog id    | Courses | Which                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `python`      | 16      | `browser-automation-with-cdp`, `build-automation-and-task-runners`, `capstone-forge-ready`, `debugging-and-profiling`, `extending-neovim`, `software-engineering-practices`, `software-testing`, `just-enough-bash`, `just-enough-python`, `bare-metal-virtualization`, `cicd-and-release-engineering`, `cloud-and-iac`, `containers-and-orchestration`, `self-hosting-essentials`, `self-managed-kubernetes-and-gitops`, `site-reliability-engineering` |
| `shell`       | 8       | `debugging-and-profiling`, `software-engineering-practices`, `version-control-and-git`, `just-enough-bash`, `bare-metal-virtualization`, `cloud-and-iac`, `self-hosting-essentials`, `self-managed-kubernetes-and-gitops`                                                                                                                                                                                                                                |
| `gcc`         | 3       | `build-automation-and-task-runners`, `just-enough-c`, `just-enough-cpp`                                                                                                                                                                                                                                                                                                                                                                                  |
| `go`          | 2       | `building-production-cli-tools`, `just-enough-go`                                                                                                                                                                                                                                                                                                                                                                                                        |
| `rust`        | 2       | `building-production-cli-tools`, `just-enough-rust`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `node`        | 3       | `build-automation-and-task-runners`, `software-testing`, `just-enough-typescript`                                                                                                                                                                                                                                                                                                                                                                        |
| `typescript`  | 2       | `software-testing`, `just-enough-typescript`                                                                                                                                                                                                                                                                                                                                                                                                             |
| `java`        | 2       | `just-enough-java`, `just-enough-kotlin`                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `kotlin`      | 1       | `just-enough-kotlin`                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `dotnet`      | 1       | `just-enough-csharp`                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `elixir`      | 1       | `just-enough-elixir`                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lua`         | 1       | `just-enough-lua`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `luajit`      | 1       | `just-enough-lua`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `neovim`      | 4       | `capstone-forge-ready`, `extending-neovim`, `just-enough-nvim`, `just-enough-lua`                                                                                                                                                                                                                                                                                                                                                                        |
| `swift`       | 1       | `just-enough-swift`                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `dart`        | 1       | `just-enough-dart`                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `flutter`     | 1       | `just-enough-dart`                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `opentofu`    | 2       | `bare-metal-virtualization`, `cloud-and-iac`                                                                                                                                                                                                                                                                                                                                                                                                             |
| `kubeconform` | 2       | `containers-and-orchestration`, `self-managed-kubernetes-and-gitops`                                                                                                                                                                                                                                                                                                                                                                                     |
| `swift-parse` | 1       | `just-enough-swift`                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Entries Other Plans Add, and This Plan's Own Additions

Plan 09 changes the catalog in two ways, and its draft PR is merged before this plan starts (series decision
42), so its full-run effect on CI is over:

| Change by plan 09                               | What it is                                                                                                                                                                                                     | What it means here                                                                                                                                                                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A `clojure` language entry (1.12.6)             | A derived image from `eclipse-temurin:25-jdk` with three SHA-256-checked jars and a wrapper on `PATH`                                                                                                          | None of the 32 courses teaches Clojure, so this plan neither uses nor re-adds it                                                                                                                                                                    |
| The `java` entry gains a hash-locked jar recipe | A derived image with `JarFetch.java`; an `install` block that reads a `jars.lock` of `<group>:<artifact>:<version> <sha256>` lines from Maven Central, used only by units that declare `dependencies.lockfile` | `just-enough-java` and `just-enough-kotlin` (which derives from `java`) run on the changed image; neither needs a lockfile. Phase 0 builds and smoke-tests both images. The recipe is the first place to look for a jar-based option in SP6 (below) |

**The risk plan 09 carries.** Plan 09's probe P9 asks whether Spring Boot 4.1.1 runs offline from jars installed
by the recipe. If P9 fails, `enterprise-java-and-the-jvm` (not one of the 32) is BLOCKED there and plan 09's
human stop decides what happens next. For this plan that has four consequences:

1. **No course here is blocked by P9 itself.** None of the 32 uses Spring, Maven, or a `jars.lock`.
2. **The `java` and `kotlin` images must still work.** Plan 09 may have kept, repaired, or reverted the recipe.
   Phase 0 runs `toolchains list`, `toolchains build java`, `toolchains build kotlin`, and the CLI's smoke
   fixtures for both, and records the merged `java` entry. If either image fails to build or its smoke
   fixture fails, `just-enough-java` and `just-enough-kotlin` cannot start, so Phase 0 stops and reports to the
   user; no course is weakened to fit.
3. **SP6 depends on the recipe.** A lock-file jar for Kotlin coroutines is possible only if the merged
   `kotlin` entry can use the `java` install recipe without a new catalog change (a lockfile in the course
   folder is not a change under `toolchains/`). If the recipe is absent, broken, or not inherited by `kotlin`,
   the default of decision D7 stands and the coroutine preview uses the standard library only.
4. **No Java-related course is moved, reordered, or reduced.** `just-enough-java` stays in wave 3 and
   `just-enough-kotlin` in wave 3 whatever P9 did.

**This plan's own additions: none.** The four candidates below are the only ones considered. Each is default
NO-GO under the budget rule and appears here so that a measured GO changes the packets at once. If a candidate
becomes GO, the change is listed in the ledger, lands in the single early commit the rule requires, and the
plan's file-impact table is updated.

## Candidates the Catalog Lacks

Four additions would turn modelled units into real ones. None is needed to meet the definition of done,
because each course has an honest fallback (the last column).

| Candidate                                                                                                                | Course                              | Units it would unlock | Spike | Fallback if not added (default)                                                                |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | --------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| `gradle` (Temurin 25 plus Gradle)                                                                                        | `build-automation-and-task-runners` | about 12              | SP7   | A Python task-graph model, with the Groovy and Kotlin DSL shown as illustrations (decision D6) |
| `kotlinx-coroutines` jar for `kotlin` (through plan 09's lock recipe if `kotlin` can use it, otherwise a catalog change) | `just-enough-kotlin`                | up to 8               | SP6   | The preview uses only the standard library's `kotlin.coroutines` and `sequence` (decision D7)  |
| `caddy`                                                                                                                  | `self-hosting-essentials`           | about 13              | SP8   | A Python structure check of the Caddyfile, labelled as a model                                 |
| `systemd-analyze`                                                                                                        | `self-hosting-essentials`           | about 14              | SP9   | An INI parse with the unit-file rules the lesson teaches, labelled as a model                  |

Gaps the plan accepts without a candidate: Clang (C and C++ units use `gcc`, and the prose says Clang
compiles the same source; decision D5), Groovy and Gremlin validators, a stronger Android validator, and
WinUI. A Rust or Go crate that is locked in a `Cargo.lock` or `go.sum` is **not** a catalog change: the
harness builds an environment image from the lockfile (plan 05's `dependencies.lockfile`), outside the
`toolchains/` folder.

## Why an Addition Is Expensive

Plan 05's procedure to add a toolchain is three steps: a catalog entry with a derived Dockerfile and
SHA256-checked downloads, a fixture unit with a smoke-table row, and `ayokoding-cli toolchains build <id>`.
The code is small. The cost is in CI:

- **Any change under `apps/ayokoding-cli/toolchains/` puts the PR's examples check in FULL mode.** The check
  then runs every opted-in course in the repository, not the changed ones.
- **FULL mode in a pull request still runs as `selection: since`.** The `examples-plan` job emits four
  shards for it and the reusable workflow gives `since` a 60-minute timeout. Only the monthly run uses the
  300-minute `all` timeout.
- **It lasts for the whole PR.** The base is `origin/main`, so every push after the toolchain commit, up to
  the merge, runs the full check. This plan pushes at least four times.

This plan's 32 courses alone project 378.5 planning minutes. Plans 06 to 10 add 118 courses (24, 30,
8, 8, and 48). Assume a deliberately low 4 planning minutes for each; they then add about 470 minutes, the
full run is about 850, and eight shards leave a longest shard of at least 106 minutes, above the 90-minute
limit that the 120-minute timeout allows. That assumption is not a measurement: Phase 0 replaces it with the
merged units and the measured seconds.

## The Toolchain Budget Rule

A toolchain is added only if **all four** hold (decision D9):

1. **Technical proof.** Its spike passes: the tool installs from a SHA256-checked download, works with the
   network off, and gives byte-identical output on the double run.
2. **Honest value.** It unlocks at least 10 units that a model would teach worse, and the brief says why.
3. **Budget.** Phase 1's projection of the FULL run, using the merged units of every earlier plan and the
   measured seconds, divided over the shard count the ladder below allows, has a longest shard at or below
   75 percent of the timeout that will apply to the PR's check.
4. **One commit.** All additions land together in a single early commit, so the PR's check is FULL from one
   known point, and the ledger records the commit and the measured effect.

The default is **NO-GO**: when any item is unmeasured, the answer is no. At planning time item 3 fails, so no
toolchain is planned. The briefs list each candidate with its fallback, and the fallback is the plan of
record. If a measurement turns a candidate to GO, the maker's packet for that course changes at once, and the
ledger records it.

## The CI Budget

**What the check does today.** Plan 05's `examples-plan` job runs `ayokoding-cli examples affected` and emits
the shard list: `[1]` when at most 8 courses are selected, otherwise `[1,2,3,4]`. The reusable workflow
runs each shard with `--shard K/N`, which splits the selected courses by sorted slug (shard 2 of 2 of five
courses gets the second and fourth). `since` has `timeout-minutes: 60`. Plan 08 changes the rule to count
units and adds the same ladder; Phase 0 reads the merged workflow and the merged CLI to see what is actually
in place.

**The binding rule** (plan 08's, restated): the projected time of the longest shard of the PR must be at most
75 percent of the timeout that applies, which leaves room for image pulls and a slow runner. That is 45
minutes under a 60-minute timeout and 90 under 120.

**Planning figures per course.** A run costs one container invocation per execution, and every run executes
twice. A course's minutes are seconds per invocation × 2 × the number of runs. The seconds are invented
per-toolchain constants (a Python container start about 2 s, `gcc` 4 to 6 s, Go 6 s, Rust 7 s, Kotlin 10 s,
.NET 12 s); Phase 1 measures them.

| Course                                                                                            | Toolchains                                                                                                                           | Planning seconds per invocation | Runs (examples + 2 x katas + capstone) | Runs total | Executions | Planning minutes |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | -------------------------------------- | ---------- | ---------- | ---------------- |
| [`browser-automation-with-cdp`](../syllabus/courses/browser-automation-with-cdp.md)               | python (standard library only)                                                                                                       | 2.0                             | 75 + 2 x 8 + 4                         | 95         | 2          | 6.3              |
| [`build-automation-and-task-runners`](../syllabus/courses/build-automation-and-task-runners.md)   | gcc (Make), node (npm scripts), python (just and Starlark checks); gradle only if the budget rule allows                             | 3.0                             | 80 + 2 x 8 + 4                         | 100        | 2          | 10.0             |
| [`building-production-cli-tools`](../syllabus/courses/building-production-cli-tools.md)           | go and rust (standard library first; cobra and clap locked)                                                                          | 7.0                             | 78 + 2 x 8 + 4                         | 98         | 2          | 22.9             |
| [`capstone-forge-ready`](../syllabus/courses/capstone-forge-ready.md)                             | neovim (headless) and python                                                                                                         | 2.5                             | 45 + 2 x 5 + 5                         | 60         | 2          | 5.0              |
| [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | python (debugpy, hypothesis locked), shell for git bisect                                                                            | 2.5                             | 80 + 2 x 8 + 3                         | 99         | 2          | 8.2              |
| [`extending-neovim`](../syllabus/courses/extending-neovim.md)                                     | neovim (headless), python for 2 helper files                                                                                         | 2.5                             | 80 + 2 x 8 + 4                         | 100        | 2          | 8.3              |
| [`just-enough-nvim`](../syllabus/courses/just-enough-nvim.md)                                     | neovim (headless keystroke replay)                                                                                                   | 2.5                             | 91 + 2 x 8 + 3                         | 110        | 2          | 9.2              |
| [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | shell (git), python (pytest, ruff locked)                                                                                            | 2.0                             | 29 + 2 x 5 + 3                         | 42         | 2          | 2.8              |
| [`software-testing`](../syllabus/courses/software-testing.md)                                     | python (pytest, hypothesis, pytest-bdd, fastapi stack locked); node/typescript for 2 files                                           | 2.5                             | 86 + 2 x 8 + 3                         | 105        | 2          | 8.8              |
| [`version-control-and-git`](../syllabus/courses/version-control-and-git.md)                       | shell (bash, git, coreutils, jq, sqlite3)                                                                                            | 1.5                             | 82 + 2 x 8 + 3                         | 101        | 2          | 5.0              |
| [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | shell (bash, coreutils, git, jq, sqlite3); python plus locked `shellcheck-py` and `shfmt-py` wheels for the lint examples            | 1.5                             | 83 + 2 x 8 + 3                         | 102        | 2          | 5.1              |
| [`just-enough-c`](../syllabus/courses/just-enough-c.md)                                           | gcc (C17, Make)                                                                                                                      | 4.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 12.9             |
| [`just-enough-cpp`](../syllabus/courses/just-enough-cpp.md)                                       | gcc (C++17, Make, CMake only if present)                                                                                             | 6.0                             | 75 + 2 x 8 + 3                         | 94         | 2          | 18.8             |
| [`just-enough-csharp`](../syllabus/courses/just-enough-csharp.md)                                 | dotnet (SDK 10, C# 14); xunit locked                                                                                                 | 12.0                            | 78 + 2 x 8 + 3                         | 97         | 2          | 38.8             |
| [`just-enough-dart`](../syllabus/courses/just-enough-dart.md)                                     | dart (3.13); flutter only if a widget test is kept                                                                                   | 4.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 12.9             |
| [`just-enough-elixir`](../syllabus/courses/just-enough-elixir.md)                                 | elixir (1.20 on OTP 29, standard library and OTP only)                                                                               | 4.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 12.9             |
| [`just-enough-go`](../syllabus/courses/just-enough-go.md)                                         | go (1.27; standard library only)                                                                                                     | 6.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 19.4             |
| [`just-enough-java`](../syllabus/courses/just-enough-java.md)                                     | java (Temurin 25; single-file source launch; the image is the one plan 09 changes with a jar recipe, which this course does not use) | 6.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 19.8             |
| [`just-enough-kotlin`](../syllabus/courses/just-enough-kotlin.md)                                 | kotlin (2.4; `kotlinc`, derived from the `java` image that plan 09 changes); coroutine library by decision D7 and spike SP6          | 10.0                            | 78 + 2 x 8 + 3                         | 97         | 2          | 32.3             |
| [`just-enough-lua`](../syllabus/courses/just-enough-lua.md)                                       | luajit by default, neovim for `vim.*` units, lua 5.5 for version-difference units                                                    | 1.0                             | 84 + 2 x 8 + 3                         | 103        | 2          | 3.4              |
| [`just-enough-python`](../syllabus/courses/just-enough-python.md)                                 | python (3.14); pytest locked                                                                                                         | 2.0                             | 84 + 2 x 8 + 3                         | 103        | 2          | 6.9              |
| [`just-enough-rust`](../syllabus/courses/just-enough-rust.md)                                     | rust (1.99; `rustc` for single files, `cargo` only for locked crates)                                                                | 7.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 22.6             |
| [`just-enough-swift`](../syllabus/courses/just-enough-swift.md)                                   | swift (6.4, Linux) real; swift-parse static (reason `ios`) for UI code                                                               | 8.0                             | 78 + 2 x 8 + 3                         | 97         | 2          | 25.9             |
| [`just-enough-typescript`](../syllabus/courses/just-enough-typescript.md)                         | typescript (7.0, derived from node 24); eslint and prettier locked                                                                   | 4.0                             | 82 + 2 x 8 + 3                         | 101        | 2          | 13.5             |
| [`bare-metal-virtualization`](../syllabus/courses/bare-metal-virtualization.md)                   | shell and python models; opentofu (static, reason cloud) for Terraform HCL                                                           | 2.0                             | 80 + 2 x 8 + 3                         | 99         | 2          | 6.6              |
| [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)             | python (PyYAML, check-jsonschema locked)                                                                                             | 2.0                             | 83 + 2 x 8 + 4                         | 103        | 2          | 6.9              |
| [`cloud-and-iac`](../syllabus/courses/cloud-and-iac.md)                                           | opentofu (static, reason cloud) and shell/python models                                                                              | 6.0                             | 30 + 2 x 5 + 3                         | 43         | 2          | 8.6              |
| [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)             | kubeconform (static, reason cluster) for manifests; python models and parsers for Dockerfiles and Compose                            | 2.5                             | 83 + 2 x 8 + 3                         | 102        | 2          | 8.5              |
| [`platform-engineering-and-devex`](../syllabus/courses/platform-engineering-and-devex.md)         | none (no code, no run.yaml)                                                                                                          | -                               | -                                      | -          | 0          | 0.0              |
| [`self-hosting-essentials`](../syllabus/courses/self-hosting-essentials.md)                       | shell (scripts with stub binaries) and python; caddy and systemd validators budget-gated                                             | 1.5                             | 78 + 2 x 8 + 4                         | 98         | 2          | 4.9              |
| [`self-managed-kubernetes-and-gitops`](../syllabus/courses/self-managed-kubernetes-and-gitops.md) | shell/jq and python models; kubeconform (static, reason cluster)                                                                     | 2.5                             | 82 + 2 x 8 + 3                         | 101        | 2          | 8.4              |
| [`site-reliability-engineering`](../syllabus/courses/site-reliability-engineering.md)             | python (typed, deterministic simulations)                                                                                            | 2.0                             | 30 + 2 x 5 + 4                         | 44         | 2          | 2.9              |

**Shards by checkpoint.** The plan pushes four times (after waves 3, 6, 9, and 11), and each push runs the
check on every course finished so far. The table gives the longest shard for plan 05's split (sorted slug,
round-robin) and for the best possible split, with four and eight shards.

| Selection                | Courses | Total planning minutes | Shards | Longest shard, plan 05's split (sorted slug, round-robin) | Longest shard, best possible split | Within 45 (timeout 60) | Within 90 (timeout 120) |
| ------------------------ | ------- | ---------------------- | ------ | --------------------------------------------------------- | ---------------------------------- | ---------------------- | ----------------------- |
| waves 1 to 3 (push 1)    | 9       | 141.7                  | 4      | 50.9                                                      | 38.7                               | no                     | yes                     |
| waves 1 to 3 (push 1)    | 9       | 141.7                  | 8      | 32.3                                                      | 32.3                               | yes                    | yes                     |
| waves 1 to 6 (push 2)    | 18      | 278.6                  | 4      | 95.7                                                      | 70.6                               | no                     | no                      |
| waves 1 to 6 (push 2)    | 18      | 278.6                  | 8      | 60.2                                                      | 38.8                               | no                     | yes                     |
| waves 1 to 9 (push 3)    | 27      | 355.7                  | 4      | 97.0                                                      | 89.6                               | no                     | no                      |
| waves 1 to 9 (push 3)    | 27      | 355.7                  | 8      | 55.9                                                      | 45.9                               | no                     | yes                     |
| waves 1 to 11 (final PR) | 32      | 378.5                  | 4      | 105.2                                                     | 96.1                               | no                     | no                      |
| waves 1 to 11 (final PR) | 32      | 378.5                  | 8      | 55.4                                                      | 48.9                               | no                     | yes                     |

Reading the table: four shards never fit the 45-minute rule, and they do not fit the 90-minute rule from
push 2 onward, even with the best possible split (96.1 minutes for the final PR; 105.2 with the real
split). Eight shards bring the final PR to 55.4 minutes with the real split and 48.9 at best, which fits
90 and not 45. So the expected path is the ladder's rungs 2b and 3 together, applied before the push that
first needs them.

The shard contents for the final PR at eight shards, with the real split:

| Shard (of 8) | Planning minutes | Courses | Which (sorted slug, round-robin)                                                                             |
| ------------ | ---------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| 1            | 47.7             | 4       | `bare-metal-virtualization`, `debugging-and-profiling`, `just-enough-go`, `just-enough-typescript`           |
| 2            | 34.4             | 4       | `browser-automation-with-cdp`, `extending-neovim`, `just-enough-java`, `platform-engineering-and-devex`      |
| 3            | 52.3             | 4       | `build-automation-and-task-runners`, `just-enough-bash`, `just-enough-kotlin`, `self-hosting-essentials`     |
| 4            | 47.6             | 4       | `building-production-cli-tools`, `just-enough-c`, `just-enough-lua`, `self-managed-kubernetes-and-gitops`    |
| 5            | 35.9             | 4       | `capstone-forge-ready`, `just-enough-cpp`, `just-enough-nvim`, `site-reliability-engineering`                |
| 6            | 55.4             | 4       | `cicd-and-release-engineering`, `just-enough-csharp`, `just-enough-python`, `software-engineering-practices` |
| 7            | 52.9             | 4       | `cloud-and-iac`, `just-enough-dart`, `just-enough-rust`, `software-testing`                                  |
| 8            | 52.3             | 4       | `containers-and-orchestration`, `just-enough-elixir`, `just-enough-swift`, `version-control-and-git`         |

## The Response Ladder

Apply the first rungs that bring the projection to the binding rule, in order. Write each rung taken in the
ledger with the measured figures that required it. Evaluate the ladder at Phase 1 (on the spike seconds) and
again before every checkpoint push (on the measured `examples check` minutes of the finished courses).

1. **Author for speed.** One run per example unit (`main` only, with no extra `tests` runs unless the lesson
   is about tests), short programs, one source file per example so that a compiled toolchain builds as little
   as possible. A unit is never merged with another to save time: one unit per example is plan 05's
   contract.
2. **Count units, not courses (plan 08's harness fix).** If plan 08 merged the rule that counts selected
   units (`[1]` when at most 120 units, otherwise `[1,2,3,4]`), nothing is needed here. If it did not, make
   the change under plan 05's migration step M11, with a regression test first.
   - **2b. Scale the shard count with the units, up to 8.** `[1]` when at most 120 units are selected,
     `[1,2,3,4]` when at most 800, and `[1,2,3,4,5,6,7,8]` above 800, for every selection mode. RED: 813 units
     over 9 courses still return four shards; GREEN: they return eight. Runner minutes stay the same; wall
     time falls. Eight is the cap because the OSE repositories share a limited runner pool (plan 05's cost
     note). Where the rule lives (the workflow step or the CLI's `affected` output) is found in Phase 1.
   - **2c. A weighted split, only if needed.** If the measured longest shard under the sorted-slug split is
     above the limit while the best possible split would fit, change `--shard K/N` to split by unit count
     (largest first), with the same regression-test-first order.
3. **Raise the `since` timeout.** If the longest shard is above 45 minutes but at or below 90, raise
   `timeout-minutes` for `selection: since` from 60 to 120 in the reusable workflow, and record the reason in
   the workflow comment. At planning figures this is needed from the second push.
4. **Stop and report.** If the projection is still above 75 percent of the applicable timeout after rung 3,
   mark the heaviest course BLOCKED with the cause "does not fit the CI budget" and report to the user. A
   course is never weakened (fewer examples, merged units, a skipped run) to fit.

The rung 2b and 3 changes are small, tested harness and workflow edits made in Phase 1 (or at the first
checkpoint that needs them), so they ride the same PR. They are recorded as decision D10 in
[008](./008-decision-records.md). They change CI timeouts and shard counts only; no course check is loosened.

## The Monthly Full Run

Plan 05 runs every opted-in course monthly in four shards with a 300-minute timeout (limit 225). Rung 2b is
written for every selection mode, so the monthly run also scales to eight shards. After this plan, the
monthly run covers 31 more courses; Phase 0 computes the projected full-run shard from the merged
units and records whether it stays below 225 minutes. Plan 05's revisit trigger applies: full-run shards above
300 minutes, or derived environment builds above 15 minutes per shard on a warm cache.

## Phase 0 and Phase 1 Measurements

Phase 0 records the shard facts (the merged `examples-plan` rule, the timeouts, and the shard split) and
computes the FULL-run projection with a conservative per-course figure. Phase 1 measures, with the CLI's own
smoke fixtures, the seconds per invocation for `python`, `shell`, `gcc`, `go`, `rust`, `node`, `typescript`,
`java`, `kotlin`, `dotnet`, `elixir`, `lua`, `luajit`, `neovim`, `swift`, `dart`, `opentofu`, and
`kubeconform`; computes each course's minutes as the sum of runs × 2 × seconds plus environment builds; fills
the shard table; and writes the rung decision to the evidence file. After each finished course the ledger
replaces its planning minutes with the measured `EX-CHECK` time.
