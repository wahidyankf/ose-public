# 003 — Code Harness, Determinism, and Toolchain Changes

## Harness contract (restated from plan 05)

Every runnable unit (an example, a kata, or a capstone) lives in its own directory with a `run.yaml`
(`schema: ayokoding.run/v1`): `toolchain`, `mode: real|static`, `services`, `dependencies.lockfile`,
`resources`, and `runs[]` (name, kind `example|test|check`, command argv, `expect.exit`/`stdout`/`stderr`/
`invariant`, `timeout`, `simulation`). `static.reason` is one of `cloud`, `cluster`, `ios`, `android`,
`windows`, with a written note. Determinism: a double run with half the CPU budget must match; `TZ=UTC`,
`PYTHONHASHSEED=0`, `SOURCE_DATE_EPOCH=0`, no network, fixed seeds. A Markdown code block anchored to a
unit's file must be byte-identical to it, or carry `<!-- harness: illustration -->` (reserved for
fragments, pseudo-code, broken snippets, or install/launch commands — never for a block this plan could
make runnable instead).

Third-party dependencies are never fetched at run time (plan 05 decision D9). A unit that needs one names
a course-relative lockfile in `dependencies.lockfile`; the harness builds one environment image per
`(toolchain, lockfile)` pair, with network, by running the toolchain entry's `install` recipe against
that hash-locked file, and every run then uses `--network none`. A toolchain without an `install` recipe
therefore cannot host a unit that has a lockfile.

## Runtime design per course group

| Course group                                                                                                   | Runtime                                                                                                                            | Notes                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4 AI coding-agent courses                                                                                      | Python 3.14, standard library only, driving a deterministic fixture shim                                                           | No real network, no real API key, no real binary; the shim's simplifications are documented in the course text, per [tech-docs/005](./005-fast-changing-tool-sourcing-policy.md).                                                                                                                                               |
| `github-actions-and-gh-cli`                                                                                    | Shell (Debian) plus Python 3.14 validators                                                                                         | Workflow YAML is schema-validated offline; `gh` responses come from committed JSON fixtures. No `static` mode is used, because the reason enum (`cloud`/`cluster`/`ios`/`android`/`windows`) has no entry for "no live account," and offline fixture validation already satisfies plan 05's no-network rule under `mode: real`. |
| `text-processing-with-awk-sed-and-jq`, `advanced-shell-scripting-in-depth`                                     | Shell (Debian, bash/coreutils/jq pinned)                                                                                           | No network; every fixture is committed under the example's own directory.                                                                                                                                                                                                                                                       |
| 11 database-migration courses                                                                                  | Each course's language toolchain driving a real, pinned PostgreSQL 18 service container                                            | Matches plan 05's rule that anything runnable in a container runs for real; migrations are exercised against the real database, never mocked. The JVM-hosted ones (Java, Kotlin, Clojure) get their jars from the shared hash-locked jar recipe below.                                                                          |
| 8 web-backend-framework courses                                                                                | Each course's language toolchain, in-process (no real network socket); tests bind a loopback port chosen by the harness            | Matches `backend-essentials`'s own existing pattern for the same reason (FastAPI, in-process testing). The JVM-hosted ones (Vert.x, Ktor, Pedestal) get their jars from the shared recipe below.                                                                                                                                |
| 12 per-language in-depth courses                                                                               | Each language's pinned standard-toolchain compiler/interpreter, standard library only                                              | Matches `just-enough-X`'s own existing runtime pattern. The two exceptions are `clojure-essentials` (two `org.clojure` libraries, see below) and `webassembly-essentials` (the new toolchain).                                                                                                                                  |
| `flutter-for-the-web`                                                                                          | Dart/Flutter, widget-test harness (headless, no real browser)                                                                      | Flutter is already a catalog toolchain (used by `hybrid-app-development`); the web target needs no new toolchain.                                                                                                                                                                                                               |
| `cross-platform-mobile-with-react-native`                                                                      | Node/TypeScript test runner for 7 of 9 anchors; `mode: static`, `reason: android` for 2 of 9 (native-module bridge, build variant) | React Native has no dedicated catalog toolchain; this plan uses the existing Node/TypeScript toolchain for logic and navigation, and validates (does not execute) the 2 native-module examples against an Android build tool, with the static reason recorded in each `run.yaml`.                                               |
| `datomic-and-datalog-essentials`                                                                               | Python 3.14, standard library only, an in-process reference datom store and Datalog evaluator                                      | Deliberate design choice, not a workaround: the real, licensed Datomic server is not required or run; the course states this explicitly (see the course's own Accuracy notes). This avoids both a licensing question and a toolchain change for a single course.                                                                |
| `clojure-essentials`, `web-backends-in-clojure-with-pedestal`, `database-migrations-with-clojure-and-migratus` | The `clojure` entry that plan 09 merges first, extended by this plan with an `install` recipe                                      | See "The Clojure entry: libraries by course" below.                                                                                                                                                                                                                                                                             |
| `webassembly-essentials`                                                                                       | A new `webassembly` toolchain                                                                                                      | See change 4 under "Toolchain changes" below.                                                                                                                                                                                                                                                                                   |

## Toolchain changes

Plan 05's toolchain catalog (python, go, rust, node, typescript, java, kotlin, dotnet, elixir, lua,
luajit, neovim, gcc, racket, ocaml, swift, dart, flutter, shell, powershell, postgres, neo4j, plus
validators) is extended by plan 09, which merges before this plan starts (series decision 42). The
baseline this plan builds on is therefore fixed, not conditional:

| Plan 09 baseline                                                                                                                                                                                                                                                                                                                                                             | Source                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A `clojure` entry: `kind: language`, version 1.12.6, a derived image on the `eclipse-temurin:25-jdk` base (the same base as `java`), three SHA-256-checked jars under `/opt/clojure/` (`org.clojure:clojure` 1.12.6, `org.clojure:spec.alpha` 0.5.238, `org.clojure:core.specs.alpha` 0.4.74), a `clojure` wrapper on `PATH`, and **no** `install` recipe                    | Plan 09 `tech-docs/004-code-harness-and-determinism.md`, "The `clojure` entry", and its decision D6       |
| A `java` entry that is now a derived image with an `install` recipe: `JarFetch.java` (a single-file Java program), lock lines of the form `<group>:<artifact>:<version> <sha256>` fetched from Maven Central, a course lockfile named `jars.lock`, install argv `java /opt/tools/JarFetch.java /deps/lock/jars.lock /deps/java`, and the run-time variable `JARS=/deps/java` | Plan 09 `tech-docs/004-code-harness-and-determinism.md`, "The `java` install recipe", and its decision D5 |

Phase 0 of [delivery.md](../delivery.md) re-reads the merged catalog and confirms both rows. If the merged
names differ from the ones above (the file name, the lockfile name, the argv, the variable), this plan uses
the merged names everywhere; there is no second design for a different merge order.

This plan makes four changes to the catalog, following plan 05's "Adding a Toolchain" procedure (an entry or
entry edit, a `Dockerfile` with SHA-256-checked downloads where an image changes, a smoke course under
`apps/ayokoding-cli/tests/testdata/toolchain-smoke/` with its row in the toolchain smoke table,
`toolchains build <id>`, and the smoke for that id; Phase 0 records the as-merged layout):

1. **`JarFetch.java` learns one optional lock field (shared by `java`, `kotlin`, and `clojure`).** A lock
   line becomes `<group>:<artifact>:<version> <sha256> [<repository>]`, where `<repository>` is `central`
   (the default, `https://repo.maven.apache.org/maven2/`) or `clojars` (`https://repo.clojars.org/`). A
   two-field line behaves exactly as in plan 09, so every existing `java` lock keeps working. The change is
   needed for one reason only: Pedestal, Migratus, and `next.jdbc` are published on Clojars (their
   repository metadata was read from Clojars on 2026-10-10, and Maven Central answered 404 for the same
   three coordinates), and plan 09's recipe reads Maven Central only. A Docker build context is one
   toolchain directory, so `toolchains/clojure/` and `toolchains/kotlin/` each hold a copy of
   `toolchains/java/JarFetch.java`; one CLI unit asserts the three files are byte-identical, so the copies
   can never become a fork.
2. **The `clojure` entry gains an `install` recipe (extended, not added).** The same derived image gets
   `JarFetch.java`, an `install` block that names `jars.lock`, the argv
   `java /opt/tools/JarFetch.java /deps/lock/jars.lock /deps/clojure`, and `JARS=/deps/clojure`. The
   `clojure` wrapper builds its class path from the three core jars followed by every jar in `$JARS` in
   sorted file-name order, written out as explicit entries (not a `*` wildcard, whose order the JVM does not
   promise), so the class path is the same on every run. The version stays 1.12.6.
3. **The `kotlin` entry gains the same `install` recipe.** `kotlin` is a derived image on the same Temurin 25
   base, so the identical block, the identical `JarFetch.java`, and `JARS=/deps/kotlin` apply. Two courses
   need it (`database-migrations-with-kotlin-and-flyway`, `web-backends-in-kotlin-with-ktor`).
4. **A new `webassembly` toolchain (the only new entry in this plan).** Needed by 1 course
   (`webassembly-essentials`). It is the Rust toolchain's WASI compilation target (`wasm32-wasip1` in
   current Rust, the renamed `wasm32-wasi`; Phase 1 reads the pinned Rust version's target list) plus a pinned,
   deterministic WASI runtime (no browser, no JIT nondeterminism); the course's examples are Rust compiled
   to WebAssembly and executed under that runtime.

Every change under `apps/ayokoding-cli/toolchains/` puts the pull request's examples check in full mode
(plan 05's rule, series decision 33), so one full `ayokoding-www:examples:check` run is scheduled once in
Phase 1 of [delivery.md](../delivery.md), before any course that depends on a changed entry is marked done.
Because the `java` image copy of `JarFetch.java` also changes with change 1, that full run is also the
proof that plan 09's Java units still pass.

### The Clojure entry: libraries by course

All three courses use `toolchain: clojure` with a `dependencies.lockfile` that points to the course's own
`learning/code/jars.lock` (the path is course-relative, so the katas and the capstone reuse it). The recipe
is one; the locks are three. Versions were read on 2026-10-10 from the repository metadata of Maven Central
and Clojars; Phase 1 re-reads them, records each SHA-256, and bumps nothing without re-recording the course
outputs that print version-specific text.

| Course                                          | Direct libraries and pinned versions                                                                                                          | Repository             | Why this course needs them                                                                                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clojure-essentials`                            | `org.clojure:test.check` 1.1.3; `org.clojure:core.async` 1.9.865                                                                              | Maven Central          | Concept co-08 (property-based tests beyond `clojure.test`), co-09 (the concurrency survey), and co-07 (a real hash-locked dependency file instead of a described one). |
| `web-backends-in-clojure-with-pedestal`         | `io.pedestal:pedestal.service` 0.8.2; `io.pedestal:pedestal.jetty` 0.8.2; `org.slf4j:slf4j-simple` 2.0.20                                     | Clojars; Maven Central | The framework, its servlet-container binding for the loopback-port examples, and a stdout logger configured without timestamps so output is deterministic.             |
| `database-migrations-with-clojure-and-migratus` | `migratus:migratus` 1.6.8; `com.github.seancorfield:next.jdbc` 1.3.1118; `org.postgresql:postgresql` 42.7.14; `org.slf4j:slf4j-simple` 2.0.20 | Clojars; Maven Central | The migration tool, the JDBC wrapper it uses (pinned explicitly above the version its POM names), the PostgreSQL 18 driver, and the same deterministic logger.         |

The transitive closure (for example Ring, Jetty 12.0.36, Transit, and the `core.async` analyzer jars) is
resolved once per course, in a throwaway container with network, by the method plan 09 uses for its Spring
lock: Maven resolves a `pom.xml` that lists the direct libraries (and the Clojars repository), the executor
computes each jar's SHA-256, and writes `jars.lock` with a header recording the direct libraries. The three
core jars (`org.clojure:clojure`, `spec.alpha`, `core.specs.alpha`) are left out of every lock, because
`/opt/clojure/` already carries them. Pedestal 0.8.2 declares Clojure 1.12.5 and runs here on 1.12.6; Phase 1
proves that with a probe.

`clojure-essentials` is therefore not purely standard library: its examples that use no library still run on
the three core jars, and only the property-based-testing and `core.async` examples reach into `jars.lock`.

### The Java and Kotlin courses: reuse of the merged recipe

The merged `java` recipe is reused as it stands. It lacks nothing these courses need: every jar below is on
Maven Central, which is the default repository. The only extension is change 1 (the optional `clojars`
field), and no Java or Kotlin course uses it. Each course keeps its own `learning/code/jars.lock`.

| Course                                              | Toolchain | Direct libraries and pinned versions (read 2026-10-10)                                                                                                      | Note                                                                                                                                                                                                                                     |
| --------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `java-in-depth`                                     | `java`    | None                                                                                                                                                        | Standard library only; no lockfile.                                                                                                                                                                                                      |
| `web-backends-in-the-jvm-with-vertx`                | `java`    | `io.vertx:vertx-core`, `io.vertx:vertx-web`, `io.vertx:vertx-web-client` at 5.2.1                                                                           | The web client drives the server in-process on the harness-chosen loopback port.                                                                                                                                                         |
| `database-migrations-with-java-and-liquibase`       | `java`    | `org.liquibase:liquibase-core` 5.0.4; `org.postgresql:postgresql` 42.7.14                                                                                   | Against the PostgreSQL 18 service container.                                                                                                                                                                                             |
| `database-migrations-with-java-and-spring-data-jpa` | `java`    | Spring Boot parent 4.1.1 (the version plan 09 pins; use the merged version if it differs); the Boot 4 data-JPA starter; `org.postgresql:postgresql` 42.7.14 | Same recipe as plan 09's Spring lock, but its own lock: this course needs the data-JPA closure, not plan 09's web closure. Boot 4 split its starters by technology, so the executor reads the Boot 4.1 reference for the artifact names. |
| `database-migrations-with-kotlin-and-flyway`        | `kotlin`  | `org.flywaydb:flyway-core` 13.10.0; `org.flywaydb:flyway-database-postgresql` 13.10.0; `org.postgresql:postgresql` 42.7.14                                  | Uses the `kotlin` entry's new `install` recipe (change 3).                                                                                                                                                                               |
| `web-backends-in-kotlin-with-ktor`                  | `kotlin`  | `io.ktor:ktor-server-core`, `io.ktor:ktor-server-cio`, `io.ktor:ktor-server-test-host` at 3.6.0                                                             | Uses the `kotlin` entry's new `install` recipe (change 3). The test host runs the application in-process with no socket.                                                                                                                 |

### Install recipes for the other toolchains

Plan 05's run contract names `Cargo.lock`, `packages.lock.json`, and `mix.lock` as lockfiles an install
recipe may accept, but plan 09 only states that Python, Node, and Go have recipes. Phase 0 reads the merged
catalog and records, for `rust`, `dotnet`, and `elixir`, whether an `install` recipe exists. Any of the eight
courses that use third-party packages on a toolchain with no recipe (`database-migrations-with-rust-and-sqlx`,
`web-backends-in-rust-with-axum`, `database-migrations-with-csharp-and-ef-core`,
`web-backends-in-csharp-with-aspnetcore`, `database-migrations-with-fsharp-and-dbup`,
`web-backends-in-fsharp-with-giraffe`, `database-migrations-with-elixir-and-ecto`,
`web-backends-in-elixir-with-phoenix-and-liveview`) gets that toolchain extended in Phase 1 by the same method
and with the same RED, GREEN, and REFACTOR steps as the `kotlin` change. If the inventory finds none missing,
that step records "none found" with the inventory as proof.

## Unit volume (planning estimate, not a gate rule)

| Course group                  | Courses | Approx. runnable units each                                  | Approx. total   |
| ----------------------------- | ------- | ------------------------------------------------------------ | --------------- |
| By Example (41 courses)       | 41      | 78 examples + 8 katas + 1 capstone = 87                      | about 3,567     |
| Annotated-Concept (7 courses) | 7       | 32 code-bearing examples (of 48) + 5 katas + 1 capstone = 38 | about 266       |
| **Total**                     | **48**  |                                                              | **about 3,833** |

Phase 1 of [delivery.md](../delivery.md) measures the real per-toolchain run time before the first wave,
the same way plan 08 did, and the same four-rung response ladder (author for speed, shard by unit count,
raise the timeout, stop and report) applies if the measured time threatens the CI budget. No course is
ever weakened to fit a time budget.
