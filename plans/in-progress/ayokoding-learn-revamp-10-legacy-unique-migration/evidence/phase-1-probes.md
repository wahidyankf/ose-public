# Phase 1 probes

Maven image for lock generation: `maven:3.9-eclipse-temurin-25@sha256:93b8a14ea2f412782e4e842651273b4d903e35cc496284f178fbbe2d67d00976`
(throwaway authoring container with network; never committed, never run).
All probes run through the real harness on probe courses under
`local-tmp/ayokoding-learn/probe-content/` (once to record, once more to
compare); no probe content is committed. Disposition PASS means exit 0
with two agreeing executions (and, where noted, the negative case).

## PR1 — Pedestal on Clojure 1.12.6 (PASS)

- Lock: 77 lines (61 Maven Central, 16 Clojars) via `mvn dependency:copy-dependencies`
  from a scratch pom (pedestal.service + pedestal.jetty 0.8.2, slf4j-simple 2.0.20);
  origins from each artifact's `_remote.repositories`; the three Clojure core jars
  omitted (image carries 1.12.6). Header names the direct libraries + 2026-10-20.
- Pedestal 0.8.2 + Jetty 12 RUNS on Clojure 1.12.6 (declares 1.12.5): the unit
  prebinds a `ServerSocket(0)`, closes it, starts the service on that port,
  sends one request with `java.net.http`, prints the response body
  (`pedestal-ok`), and stops. Exit 0, two executions agree, stderr empty.
- Port: the port never reaches output; wall time ~4s including container startup.
- Determinism notes: the whole `create-server` chain is deprecated in 0.8.x with
  a nondeterministic eval-counter call stack on stderr, bypassing logging, so the
  unit sets `PEDESTAL_SUPPRESS_DEPRECATION_WARNINGS=true` (the switch pedestal
  documents in Pedestal's internal `io.pedestal.*` namespaces); slf4j-simple is configured by system
  properties at script top instead of the plan's `simplelogger.properties`
  (the wrapper classpath excludes the unit dir, so no properties file would
  load) with timestamps, thread names, and log names off.
- Disposition: PASS; the probe lock lives with the probe (local-tmp, uncommitted);
  Phase 3 regenerates each course lock with the same procedure.

## PR2 — Migratus against the PostgreSQL 18 service (PASS)

- Lock: 11 lines via `mvn dependency:copy-dependencies` from a scratch pom
  (migratus 1.6.8, next.jdbc 1.3.1118, postgresql 42.7.14, slf4j-simple 2.0.20;
  migratus + next.jdbc from Clojars, rest Maven Central);
  core Clojure jars omitted (image carries them).
- Migratus 1.6.8 runs one `up` (two single-statement files — see below) and
  the matching `down`s against postgres:18, then prints the final schema
  state (`migratus-ok` from the pre-rollback SELECT, `migrations-applied: 0`
  after both rollbacks). Exit 0, two executions agree, stderr empty.
- Two constraints discovered the empirical way:
  1. `:migration-dir` must be a RELATIVE path (`find-migration-dir` throws
     `IllegalArgumentException` for `/work/migrations`); the probe uses the bare
     `"migrations"` since the unit workdir is the unit dir (the bare `main.clj`
     resolves there).
  2. One SQL statement per `.up.sql` file: the pg JDBC driver's `addBatch`
     rejects multi-statement SQL, so the probe ships two migrations
     (`...000-seed`: CREATE TABLE / DROP TABLE; `...001-seed-data`: INSERT /
     DELETE) instead of one three-statement file.
- DB access uses the standard `services: [postgres]` declaration; `main.clj`
  reads `PGHOST/PGPORT/PGDATABASE/PGUSER` env defaulting to the harness
  postgres shape (`postgres:5432`, trust auth). The double rollback leaves
  the database pristine for the second execution.
- Disposition: PASS.

## PR3 — A `clojars` lock line end to end (PASS)

- The PR2 lock holds Clojars-served jars (migratus, next.jdbc). A scratch copy
  of the PR2 probe course with one hash character changed rebuilds its
  environment through the recipe and fails with
  `JarFetch: hash mismatch for lock line: migratus:migratus:1.6.8 3bb23f04… clojars`;
  the build stops naming the line and the unit never starts. The untampered
  lock builds (PR2 green), so the `clojars` third field works end to end.
- Disposition: PASS (positive: PR2 green; negative: named hash-mismatch).

## PR4 — Class-path order (PASS)

- Lock: 1 line (org.clojure:data.json 2.5.0, Maven Central); core jars omitted.
- The unit prints every class-path entry's file name in order:
  `clojure-1.12.6.jar`, `spec.alpha-0.5.238.jar`, `core.specs.alpha-0.4.74.jar`,
  then the locked jars in sorted file-name order (`data.json-2.5.0.jar`).
  Recorded once via `--record`, verified against the rule (three core jars
  first, locked jars sorted), then re-run: two executions agree.
- Disposition: PASS.

## PR5 — `test.check` and `core.async` (PASS)

- Lock: 9 lines via `mvn dependency:copy-dependencies` (test.check 1.1.3,
  core.async 1.9.865 + core.cache, core.memoize, data.priority-map,
  tools.analyzer, tools.analyzer.jvm, tools.reader, asm 9.2; all Maven
  Central); core Clojure jars omitted.
- The unit runs `quick-check` (100 trials, fixed `:seed 42`) and a 2-wide
  `core.async` pipeline over `[3 1 2]`; the pipeline output is sorted before
  printing (`async-sorted: (2 3 4)`), so channel timing cannot leak into the
  output. Prints `pass: true`. Exit 0, two executions agree, stderr empty.
- Disposition: PASS.

## PR6 — Ktor and Flyway on the `kotlin` recipe (PASS)

- Ktor lock: 40 lines (ktor-server-core-jvm + ktor-server-cio-jvm +
  ktor-server-test-host-jvm 3.6.0 and their closure, Maven Central).
  Finding: the PLAIN Ktor coordinates resolve to Kotlin-multiplatform
  metadata jars (e.g. `ktor-server-core-3.6.0.jar` holds
  `androidNative…-cinterop`, no JVM bytecode), so `kotlinc` reports
  `unresolved reference 'io'` — the smoke's gson unit never caught this
  because `Class.forName` needs no compile-time import. Course locks MUST
  name the `-jvm` variants. `kotlin-stdlib` stays out of the lock (kotlinc
  and the runner always carry their own 2.4.21; a locked 2.3.21 would only
  duplicate classes); `kotlin-reflect` stays in.
- Ktor unit: `testApplication` with no socket serves `/hello` and prints the
  response body (`ktor-ok`). Exit 0, two executions agree. `stderr: ignore`
  covers kotlinc's jansi note (smoke precedent) and ktor's slf4j NOP notice.
- Flyway lock: 6 lines (flyway-core + flyway-database-postgresql 13.10.0,
  postgresql 42.7.14 + jackson-annotations, checker-qual, and the
  cockroachdb support module the core pulls in).
- Flyway unit: `V1__seed.sql` (CREATE + INSERT — Flyway parses multi-statement
  files itself) migrates (`flyway-applied: 1`, asserted), prints, then
  `clean()` leaves the database pristine for the second execution.
  Services `[postgres]`, env defaults match the harness shape.
- Record the working form: same kotlinc shape as the smoke
  (`CP=$(ls "$JARS" | sort …)` → explicit sorted entries → `kotlinc -cp` →
  `kotlin -cp /tmp/out:$CP MainKt`); `kotlinc -cp`/`-classpath` both work —
  the earlier failure was the metadata jars, not the flag.
- Disposition: PASS (both units).

## Supplementary probes (beyond the plan's PR1–PR6)

These prove the library sets of Phase 3 database courses the plan does not
probe; each caught a real product defect on the way to green.

## SP1 — next.jdbc transactions (PASS)

- Lock: 5 lines, the PR2 subset minus migratus (next.jdbc 1.3.1118 + postgresql
  42.7.14 + camel-snake-kebab, java.data, checker-qual); the five jar SHA-256
  values are byte-identical to the PR2 lock.
- next.jdbc 1.3.1118 on Clojure 1.12.6: DDL via `execute!`, forced rollback via
  throw-inside-`with-transaction` (JDBC has no `setRollbackOnly`; the
  `ex-info` is caught outside so output stays clean), row-count assert proves
  zero leaked rows, parameterized `execute-one!` round-trips `jdbc-ok`,
  table dropped at the end; exit 0, two executions agree, stderr empty.
- Version note: `com.github.seancorfield:next.jdbc` is NOT on Maven Central —
  the scratch pom needs the Clojars repository (same as PR2).
- Disposition: PASS.

## SP2 — Rust sqlx offline (PASS)

- Lock: `cargo generate-lockfile` in a throwaway container (sqlx 0.8.6 with
  `default-features = false` + `postgres,runtime-tokio`, tokio 1.x `full`):
  143 packages, all `registry+https://github.com/rust-lang/crates.io-index`
  with checksums. Runtime-only `sqlx::query` needs no `DATABASE_URL` at
  compile time, so no sqlx-data.json offline cache is required.
- The harness builds a per-lock env image whose install argv runs
  `fetch.py Cargo.lock /deps/rust` (142 crates fetched, all SHA-256 verified);
  the unit then builds `--offline` with the vendored source replacement,
  twice alike. One transient fetch failure on the first attempt passed on
  retry with no change (network flake during env-image build).
- `main.rs` uses a single `PgConnection` (no pool) with `PGHOST/PGPORT/
PGDATABASE/PGUSER` env defaulting to the harness postgres shape; CREATE +
  parameterized INSERT/SELECT round-trips `sqlx-ok`, table dropped at the end;
  exit 0, two executions agree, stderr empty. The only code fix was a missing
  `use sqlx::Connection` for `PgConnection::connect` (E0599).
- Budgets: the unit declares `memory: 4g` (the sqlx + tokio closure compiles
  ~140 crates; the smoke hello-world fits in 2g) and `timeout: 600s` (the
  runspec maximum; the first draft's 900s was rejected as out of range).
- Disposition: PASS.

## SP3 — dotnet EF migrations (PASS)

- Lock: 15 entries (EF Core 10.0.4 + Npgsql EF 10.0.3 + their transitive
  closure), generated by `dotnet restore --use-lock-file` on the host SDK;
  `Microsoft.EntityFrameworkCore.Design` was dropped after scaffolding (it
  pulls Roslyn/Humanizer and is only needed for `dotnet ef`, not for
  `Database.Migrate()` at runtime): 35 entries → 15.
- The probe found TWO product defects on the way to green:
  1. The dotnet install recipe always failed with NU1004 on locks WITH
     transitive dependencies: it promotes every lock entry to a direct
     `PackageReference` in a rebuilt fetch project, then restores it with
     `--locked-mode`, which compares the rebuilt direct refs against the
     lock's three direct refs. Fixed in `catalog.yaml` (committed
     `4d3561e93`): the fetch restore drops `--locked-mode` — all 35 exact
     pins reproduce the locked graph version for version (verified 35/35
     against `project.assets.json`) — and the tamper gate stays at the
     unit's own `--locked-mode` restore (NU1403). Previous locks were
     unaffected (the smoke lock has zero transitive deps, the only shape
     that ever passed).
  2. Offline restore stalls ~50s per package when the container has a Docker
     DNS that blackholes external names (NuGet's online certificate
     revocation checks); single-runs squeaked under 600s while double-runs
     blew the budget. The unit sets `NUGET_CERT_REVOCATION_MODE: offline`
     plus telemetry/first-run opt-outs in `run.yaml` `env` and restores in
     seconds (double-run in 10s wall). No harness change.
- `Database.Migrate()` applies the scaffolded `Seed` migration at runtime
  (no `dotnet-ef` tool in the offline container); the unit round-trips
  `ef-ok` through a `DbSet`, prints it, and leaves `stderr: ignore` for the
  SDK's offline workload note. Design-time context comes from an
  `IDesignTimeDbContextFactory` (kept in `Program.cs`; harmless at runtime).
- Budgets: `timeout: 600s` (EF restore + build exceeds the 60s default).
- Disposition: PASS.

## SP4 — Elixir ecto (PASS)

- Lock: `mix deps.get` on the host (ecto_sql 3.14.0 + postgrex 0.22.4 +
  db_connection, decimal, ecto, telemetry): 6 hex entries with outer
  tarball checksums.
- The probe found ONE product defect: the elixir `fetch.py` lock regex used
  flat `[^\\]]*` character classes, so entries whose dependency specs nest
  option lists (`[hex: ..., repo: ..., optional: ...]`) never matched —
  2 of 6 packages seeded, and the unit failed with "registry entry not
  cached locally". Fixed in `toolchains/elixir/fetch.py` (committed
  `4d3561e93`): a depth-counting tuple splitter replaces the flat regex
  (verified 6/6 on the probe lock, byte-identical results on the smoke
  thoas lock, malformed entries still fail closed); the Dockerfile fetcher
  blob was regenerated and the derived image tag re-pinned in
  `catalog.yaml` (the `TestCatalogDerivedTagsMatchRecipes` gate enforces
  the re-pin).
- `priv/probe.exs` migrates up via `Ecto.Migrator`, round-trips `ecto-ok`
  through a schema + changeset, prints it, and migrates back down to
  version 0 (`change` reverses `create` into a drop) so the harness's
  second execution meets a pristine database — the same rollback discipline
  as PR2/SP3. Query logging is off (`log: false` + `Logger` at info) and
  `ignore_module_conflict` absorbs the migration-file reload; exit 0, two
  executions agree, unit stderr empty.
- `stderr: ignore` covers one third-party warning: a dependency's mix.exs
  uses the pre-1.20 `xref: [exclude: ...]` form that toolchain mix 1.20.4
  reports at every compile.
- Disposition: PASS.
