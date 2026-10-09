# 004 — Toolchain Additions and CI Budget

This plan puts 34 courses into the harness. It needs seven toolchain or service ids that plan 05's catalog lacks,
and every unit it adds runs twice. This page says which ids those are and how each is added; what the check costs
and why any addition is dangerous for CI; the thirteen Phase 1 spikes that must pass before a course depends on a
new capability; and the order of responses when the projection is too tight. All CI figures here are **planning
figures** with invented per-invocation seconds, used only to size the work. Phase 1 (SP12) replaces them with
measurements, and every decision below is re-taken on the measured numbers (decision D10).

## What the Catalog Gives

Toolchain ids and pins as plan 05's catalog reads on 2026-10-09; Phase 0 re-reads the merged catalog, which plans
06 to 11 extend, and records any change that touches an id this plan uses.

| Catalog id       | Pin (2026-10-09)                                 | Used here for                                                               |
| ---------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| `python`         | 3.14.8                                           | Most courses; locks for third-party packages                                |
| `go`             | 1.27.2                                           | `csp-style-concurrency`, `build-your-own-raft`                              |
| `rust`           | 1.99.0                                           | `modern-system-programming`                                                 |
| `elixir`         | 1.20.4 on OTP 29.1.1                             | `actor-model-concurrency`                                                   |
| `gcc`            | 16.2                                             | `computer-architecture`, `linux-os`, `system-programming`                   |
| `shell`          | Debian snapshot                                  | `bash`, `coreutils`, `git`, `jq`, `sqlite3`; command-line units             |
| `postgres`       | 18.6 (service)                                   | `advanced-sql-and-query-performance`, `data-access-orms-and-query-builders` |
| `neo4j`          | 2026.09.0 Community, Cypher 25                   | `graph-databases`                                                           |
| `windows-static` | mingw `-fsyntax-only` plus the PowerShell parser | `windows-os`                                                                |
| `psql`           | added by plan 06                                 | `advanced-sql-and-query-performance` (the command-line client)              |

How many of the 34 courses use each id, and which, including the ids this plan adds:

| Id               | Source             | Courses | Which                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `python`         | plan 05 catalog    | 27      | `advanced-algorithms`, `computer-science-foundations`, `concurrency-and-parallelism`, `data-structures-and-algorithms-essentials`, `functional-programming`, `object-oriented-design-and-patterns`, `object-oriented-programming-essentials`, `programming-paradigms`, `advanced-networking`, `computer-architecture`, `networking-essentials`, `advanced-sql-and-query-performance`, `build-your-own-database`, `build-your-own-orm-and-query-builder`, `data-access-orms-and-query-builders`, `data-engineering`, `database-internals-and-storage-engines`, `graph-databases`, `nosql-databases`, `search-and-information-retrieval`, `sql-essentials`, `capstone-solid-core`, `distributed-systems`, `domain-driven-design`, `event-driven-architecture`, `software-architecture`, `system-design` |
| `shell`          | plan 05 catalog    | 8       | `advanced-networking`, `linux-os`, `networking-essentials`, `system-programming`, `graph-databases`, `nosql-databases`, `sql-essentials`, `capstone-solid-core`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `gcc`            | plan 05 catalog    | 3       | `computer-architecture`, `linux-os`, `system-programming`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `go`             | plan 05 catalog    | 2       | `csp-style-concurrency`, `build-your-own-raft`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `rust`           | plan 05 catalog    | 1       | `modern-system-programming`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `elixir`         | plan 05 catalog    | 1       | `actor-model-concurrency`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `windows-static` | plan 05 catalog    | 1       | `windows-os`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `psql`           | added by plan 06   | 1       | `advanced-sql-and-query-performance`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `postgres`       | plan 05 catalog    | 2       | `advanced-sql-and-query-performance`, `data-access-orms-and-query-builders`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `neo4j`          | plan 05 catalog    | 1       | `graph-databases`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `valkey`         | added by this plan | 1       | `nosql-databases`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `mongodb`        | added by this plan | 1       | `nosql-databases`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `cassandra`      | added by this plan | 1       | `nosql-databases`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `dynamodb-local` | added by this plan | 1       | `nosql-databases`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `timescaledb`    | added by this plan | 1       | `nosql-databases`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `gremlin`        | added by this plan | 1       | `graph-databases`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `neo4j-gds`      | added by this plan | 1       | `graph-databases`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## What Plan 09 Changes and Probe P9

Plan 09 changes the catalog in two ways, and its pull request is merged before this plan starts (series decision
42), so its full-run effect on CI is over:

| Change by plan 09                               | What it is                                                                                             | What it means here                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| A `clojure` language entry                      | A derived image on the Temurin 25 base with SHA-256-checked jars and a wrapper on `PATH`               | None of the 34 courses teaches Clojure. This plan neither uses nor re-adds it                                 |
| The `java` entry gains a hash-locked jar recipe | A derived image that installs jars from a `jars.lock` of `<group>:<artifact>:<version> <sha256>` lines | None of the 34 courses uses `java`, `JarFetch`, or a `jars.lock`. The `gremlin` image does not use the recipe |

Plan 09's probe P9 asks whether Spring Boot 4.1.1 runs offline from jars installed by that recipe. The facts for
this plan:

1. **No course here is blocked by P9.** A P9 failure blocks only plan 09's `enterprise-java-and-the-jvm`.
2. **My JVM items are independent of the recipe.** The Gremlin console is a derived image on the same Temurin base,
   with the TinkerPop console zip checked by SHA-256 in the image's own Dockerfile. The other JVM items are upstream
   service images (Neo4j, Cassandra, DynamoDB Local) that carry their own runtime.
3. **Phase 0 still re-reads the merged entries.** It records the merged `java` and `clojure` entries, runs
   `toolchains list`, and takes the Temurin base digest from the merged `java` entry for the `gremlin` image, so the
   two images share a base layer. If the `java` entry was reverted or changed, the digest is read from whatever the
   merged entry pins.
4. **Plans 09 to 11 take no course from this slice.** Plan 09's `build-your-own-git`,
   `compilers-parsers-and-transpilers`, and `type-systems` are not among the 34. The six courses of this plan that
   sit in plan 09's filler baseline are rewritten here (decision D12).

## This Plan's Own Additions

Seven ids are added, each gated by its spike. Five are service images for the NoSQL course; two are derived images
for the graph course.

| Id               | Kind                    | Built from                                                                                             | Course            | Code units that name it today | Attributed planning minutes per full run |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ | ----------------- | ----------------------------- | ---------------------------------------- |
| `valkey`         | service                 | The Valkey image, pinned by digest                                                                     | `nosql-databases` | 12                            | 6.4                                      |
| `mongodb`        | service                 | The MongoDB image, pinned by digest                                                                    | `nosql-databases` | 31                            | 16.4                                     |
| `cassandra`      | service                 | The Apache Cassandra image, pinned by digest                                                           | `nosql-databases` | 22                            | 11.7                                     |
| `dynamodb-local` | service                 | The DynamoDB Local vendor image, pinned by digest                                                      | `nosql-databases` | 12                            | 6.4                                      |
| `timescaledb`    | service                 | The TimescaleDB image (PostgreSQL based), pinned by digest                                             | `nosql-databases` | 6                             | 3.2                                      |
| `gremlin`        | derived toolchain image | The Temurin 25 base (the digest the `java` entry uses) plus the TinkerPop console zip, SHA-256-checked | `graph-databases` | 7                             | 6.1                                      |
| `neo4j-gds`      | derived service image   | The pinned Neo4j image plus the Graph Data Science plugin jar, SHA-256-checked                         | `graph-databases` | 10                            | 8.7                                      |

The last column attributes each course's planning minutes to the store by the units that name it. It is a planning
attribution, not a measurement. ClickHouse and a separate PostgreSQL image for `pg_stat_statements` are **not**
added: the baseline scan finds one code unit that names ClickHouse and one that needs `pg_stat_statements`, below
the value floor of the budget rule.

**How each id is added.** Plan 05's "Adding a Toolchain" procedure is three steps, and every addition follows it:

1. **A catalog entry and its files.** A service entry gives the image reference **with a digest**, a `ready` argv, a
   `readyTimeout`, and the `resources` the service needs. A derived entry also gets a Dockerfile under
   `apps/ayokoding-cli/toolchains/<id>/` whose downloads are checked by SHA-256 (`gremlin`, `neo4j-gds`). Phase 0
   records the merged field names; this page uses plan 05's names as of 2026-10-09.
2. **A fixture unit and a smoke row.** The CLI's own fixture course gets one unit for the id, and the smoke table
   gets a row, so `toolchains build <id>` and the double run are tested without a real course.
3. **`ayokoding-cli toolchains build <id>`.** Run once per id in Phase 1 and recorded with the build time and image
   size.

**Fallback if a spike fails.** The id is not added. The units that needed it become labelled in-process models of the
mechanism the lesson teaches (rule TC1 of plan 11, applied here) and the real command is shown as an illustration
within the course's budget:

| Id               | Fallback if its spike does not pass                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `valkey`         | The key-value units run a Python model of the commands the lesson teaches (strings, hashes, lists, sets, sorted sets, expiry on a model clock)                                             |
| `mongodb`        | The document units run a Python document-store model with the query and update operators the lesson teaches                                                                                |
| `cassandra`      | The wide-column units run a partition and clustering model with tunable consistency on the virtual-clock simulation; Cassandra is the likeliest to fail on start time and memory           |
| `dynamodb-local` | The serverless key-value units run a table model with key schema, conditional writes, and capacity arithmetic                                                                              |
| `timescaledb`    | The time-series units run on the pinned `postgres` service with plain partitioned tables and `generate_series`; the hypertable calls are shown as illustrations                            |
| `gremlin`        | The seven Gremlin units become Python traversal models over the same graph, and the Gremlin text is shown as illustrations; the illustration budget of `graph-databases` rises from 3 to 8 |
| `neo4j-gds`      | The GDS units become Python models of the algorithm over the same graph; with `gremlin` also failing, the budget of `graph-databases` is still 8                                           |

A failed addition changes lesson text for its units and nothing else. It is not BLOCKED, and the ledger records the
fallback with the spike measurement.

## Why an Addition Is Expensive

- **Any change under `apps/ayokoding-cli/toolchains/` puts the PR's examples check in FULL mode** (plan 05). The
  check then runs every opted-in course in the repository, not the changed ones.
- **FULL mode in a pull request still runs as `selection: since`.** The shard list for it is the same as for any
  `since` run, and the reusable workflow gives `since` a 60-minute timeout (plan 11 may have raised it; Phase 0
  reads the merged workflow). Only the monthly run has the 300-minute `all` timeout.
- **It lasts for the whole PR.** The base is `origin/main`, so every push after the toolchain commit, up to the
  merge, runs the full check. This plan pushes four times.

Plan 11 measured the same danger on its own plan: its 32 courses project 378.5 planning minutes, plans 06 to 10 add
118 courses (about 470 minutes at a deliberately low 4 minutes each), and so the full run at the end of plan 11 is
about 850 planning minutes. This plan's 34 courses add 465 more, so the full run at the end state
is about 1,315 planning minutes. Eight shards leave a longest shard of at least 164 minutes, above the 120-minute
timeout that plan 11's rung 3 allows. **A FULL-mode pull request therefore cannot fit** whatever the shard count
is, and the response is not a longer timeout: it is not to be in FULL mode (rung 2t below).

## The Toolchain Budget Rule

An id is added only if **all four** hold (this plan's rule, in the spirit of plan 11's):

1. **Technical proof.** Its spike passes: the image installs from a digest or a SHA-256-checked download, works with
   the network off, and gives byte-identical output on the double run at half the CPU quota (AU1, AU2).
2. **Honest value.** At least **5 code units** of the course name it today, and the brief says what a model would
   teach worse. A language toolchain would need more (plan 11 uses 10); a service image is the only way to run a
   store's own query language, so the floor is lower. The baseline counts are in the table above: ClickHouse (1
   unit) and a PostgreSQL image for `pg_stat_statements` (1 unit) fail this test and are not planned.
3. **Budget.** Phase 1's projection of the check, with toolchain-aware selection (rung 2t) in place or with the
   ladder applied, has a longest shard at or below 75 percent of the timeout that applies (45 minutes under 60, 90
   under 120).
4. **One commit.** All additions that pass land together in one early commit, so the check's selection changes from
   one known point, and the ledger records the commit and the measured effect.

The default for an id whose spike is not run is **not added**: the fallback table above is the plan of record until
the evidence says otherwise.

## The CI Budget

**What the check does today.** Plan 05's `examples-plan` job runs `ayokoding-cli examples affected` and emits the
shard list; the reusable workflow runs each shard with `--shard K/N`, which splits the selected courses by sorted
slug (shard K keeps every N-th course starting at K). Plan 11 adds the shard count by units (up to 8, rung 2b), a
conditional weighted split (rung 2c), and a `since` timeout of 120 minutes (rung 3). Phase 0 reads the merged
workflow and CLI to see what is actually in place and what each shard's limit is.

**The binding rule** (plans 08 and 11): the projected time of the longest shard of the PR must be at most 75
percent of the timeout that applies: 45 minutes under a 60-minute timeout, and 90 under 120.

**Planning figures per course.** A course's minutes are seconds per invocation × 2 executions × the number of runs
(examples + 2 × katas + 3). The seconds are invented per-toolchain constants (a Python container start about 2 s,
`gcc` 4 to 6 s, Go 6 s, Rust 7 s, a PostgreSQL service about 9 s, a Neo4j service about 26 s because the JVM starts
inside the run); SP12 measures them. Environment builds for hash-locked Python wheels (16 courses have a lock) are
not in these figures; SP12 measures them too.

The four heaviest courses are the four service-backed courses, and `graph-databases` alone is 18 percent of the whole load:

| Course                                | Planning seconds per invocation | Runs | Planning minutes | Services                                                          |
| ------------------------------------- | ------------------------------- | ---- | ---------------- | ----------------------------------------------------------------- |
| `graph-databases`                     | 26.0                            | 99   | 85.8             | `neo4j`, `neo4j-gds`                                              |
| `nosql-databases`                     | 12.0                            | 110  | 44.0             | `valkey`, `mongodb`, `cassandra`, `dynamodb-local`, `timescaledb` |
| `advanced-sql-and-query-performance`  | 9.5                             | 104  | 32.9             | `postgres`                                                        |
| `data-access-orms-and-query-builders` | 9.0                             | 97   | 29.1             | `postgres`                                                        |
| `modern-system-programming`           | 6.0                             | 97   | 19.4             | none                                                              |
| `actor-model-concurrency`             | 4.0                             | 97   | 12.9             | none                                                              |

All 34 courses:

| Course                                      | Wave | Seconds per invocation (planning) | Runs (examples + 2 × katas + 3) | Shard-minutes (× 2 executions) |
| ------------------------------------------- | ---- | --------------------------------- | ------------------------------- | ------------------------------ |
| `actor-model-concurrency`                   | 9    | 4.0                               | 97                              | 12.9                           |
| `advanced-algorithms`                       | 6    | 2.6                               | 99                              | 8.6                            |
| `computer-science-foundations`              | 2    | 2.5                               | 68                              | 5.7                            |
| `concurrency-and-parallelism`               | 4    | 2.8                               | 106                             | 9.9                            |
| `csp-style-concurrency`                     | 9    | 4.0                               | 97                              | 12.9                           |
| `data-structures-and-algorithms-essentials` | 1    | 2.5                               | 101                             | 8.4                            |
| `functional-programming`                    | 5    | 2.5                               | 99                              | 8.2                            |
| `object-oriented-design-and-patterns`       | 2    | 2.5                               | 103                             | 8.6                            |
| `object-oriented-programming-essentials`    | 1    | 2.5                               | 99                              | 8.2                            |
| `programming-paradigms`                     | 3    | 2.6                               | 99                              | 8.6                            |
| `advanced-networking`                       | 10   | 3.0                               | 75                              | 7.5                            |
| `computer-architecture`                     | 4    | 3.2                               | 99                              | 10.6                           |
| `linux-os`                                  | 3    | 3.2                               | 97                              | 10.3                           |
| `modern-system-programming`                 | 4    | 6.0                               | 97                              | 19.4                           |
| `networking-essentials`                     | 6    | 2.8                               | 101                             | 9.4                            |
| `system-programming`                        | 8    | 3.2                               | 97                              | 10.3                           |
| `windows-os`                                | 12   | 3.5                               | 97                              | 11.3                           |
| `advanced-sql-and-query-performance`        | 2    | 9.5                               | 104                             | 32.9                           |
| `build-your-own-database`                   | 9    | 2.8                               | 97                              | 9.1                            |
| `build-your-own-orm-and-query-builder`      | 8    | 2.4                               | 97                              | 7.8                            |
| `data-access-orms-and-query-builders`       | 7    | 9.0                               | 97                              | 29.1                           |
| `data-engineering`                          | 11   | 2.8                               | 65                              | 6.1                            |
| `database-internals-and-storage-engines`    | 5    | 2.6                               | 99                              | 8.6                            |
| `graph-databases`                           | 11   | 26.0                              | 99                              | 85.8                           |
| `nosql-databases`                           | 10   | 12.0                              | 110                             | 44.0                           |
| `search-and-information-retrieval`          | 7    | 2.5                               | 99                              | 8.2                            |
| `sql-essentials`                            | 1    | 2.2                               | 99                              | 7.3                            |
| `build-your-own-raft`                       | 10   | 4.0                               | 97                              | 12.9                           |
| `capstone-solid-core`                       | 7    | 3.0                               | 58                              | 5.8                            |
| `distributed-systems`                       | 8    | 2.6                               | 104                             | 9.0                            |
| `domain-driven-design`                      | 5    | 2.5                               | 99                              | 8.2                            |
| `event-driven-architecture`                 | 6    | 2.6                               | 99                              | 8.6                            |
| `software-architecture`                     | 3    | 2.5                               | 65                              | 5.4                            |
| `system-design`                             | 11   | 2.5                               | 66                              | 5.5                            |

By wave (the PR's cumulative load at each wave's head):

| Wave | Courses                                                                                                     | Wave shard-minutes | Cumulative at the PR head |
| ---- | ----------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------- |
| 1    | `sql-essentials`, `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`     | 23.9               | 23.9                      |
| 2    | `advanced-sql-and-query-performance`, `computer-science-foundations`, `object-oriented-design-and-patterns` | 47.2               | 71.1                      |
| 3    | `software-architecture`, `programming-paradigms`, `linux-os`                                                | 24.3               | 95.5                      |
| 4    | `concurrency-and-parallelism`, `computer-architecture`, `modern-system-programming`                         | 39.9               | 135.3                     |
| 5    | `domain-driven-design`, `functional-programming`, `database-internals-and-storage-engines`                  | 25.1               | 160.4                     |
| 6    | `event-driven-architecture`, `networking-essentials`, `advanced-algorithms`                                 | 26.6               | 187.0                     |
| 7    | `capstone-solid-core`, `data-access-orms-and-query-builders`, `search-and-information-retrieval`            | 43.1               | 230.1                     |
| 8    | `system-programming`, `distributed-systems`, `build-your-own-orm-and-query-builder`                         | 27.1               | 257.2                     |
| 9    | `actor-model-concurrency`, `build-your-own-database`, `csp-style-concurrency`                               | 34.9               | 292.2                     |
| 10   | `build-your-own-raft`, `advanced-networking`, `nosql-databases`                                             | 64.4               | 356.6                     |
| 11   | `system-design`, `graph-databases`, `data-engineering`                                                      | 97.4               | 454.0                     |
| 12   | `windows-os`                                                                                                | 11.3               | 465.3                     |

The service-backed share of the load is in the table in
[003](./003-harness-modes-simulation-and-determinism.md#service-backed-units).

**Shards by checkpoint.** The plan pushes four times (after waves 3, 6, 9, and 12), and each push runs the check on
every course finished so far. The table gives the longest shard for plan 05's split (sorted slug, round-robin) and
for the best possible split by course, with four and eight shards.

| Selection                        | Courses | Total planning minutes | Shards | Longest shard, sorted-slug split | Longest shard, best split | Real split within 45 | Real split within 90 | Best split within 45 | Best split within 90 |
| -------------------------------- | ------- | ---------------------- | ------ | -------------------------------- | ------------------------- | -------------------- | -------------------- | -------------------- | -------------------- |
| waves 1 to 3 (push 1)            | 9       | 95.5                   | 4      | 48.8                             | 32.9                      | no                   | yes                  | yes                  | yes                  |
| waves 1 to 3 (push 1)            | 9       | 95.5                   | 8      | 40.2                             | 32.9                      | yes                  | yes                  | yes                  | yes                  |
| waves 1 to 6 (push 2)            | 18      | 187.0                  | 4      | 65.4                             | 49.9                      | no                   | yes                  | no                   | yes                  |
| waves 1 to 6 (push 2)            | 18      | 187.0                  | 8      | 48.4                             | 32.9                      | no                   | yes                  | yes                  | yes                  |
| waves 1 to 9 (push 3)            | 27      | 292.2                  | 4      | 119.2                            | 75.3                      | no                   | no                   | no                   | yes                  |
| waves 1 to 9 (push 3)            | 27      | 292.2                  | 8      | 91.8                             | 38.3                      | no                   | no                   | yes                  | yes                  |
| waves 1 to 12 (push 4, final PR) | 34      | 465.3                  | 4      | 219.1                            | 116.7                     | no                   | no                   | no                   | no                   |
| waves 1 to 12 (push 4, final PR) | 34      | 465.3                  | 8      | 132.2                            | 85.8                      | no                   | no                   | no                   | yes                  |

Reading the table: four shards fit the 90-minute rule only through push 2, and never fit the 45-minute rule with
the real split. Eight shards with the real split fit push 1 (40.2 minutes), miss the 45-minute rule from push 2
(48.4) and the 90-minute rule from push 3 (91.8); the best split by course fits 45 minutes through push 3. At the
last push the best split of 34 whole courses is 85.8 minutes, which is the course `graph-databases` alone in a shard:
it leaves almost no margin under 90 and cannot go lower unless the course itself is split (rung 2d). So the expected
path at planning figures is rungs 2t, 2b, 2c, and 3 of the ladder, plus 2d if SP12 confirms the graph course is
that heavy.

The shard contents for the final push at eight shards with the real split:

| Shard (of 8) | Planning minutes | Courses | Which (sorted slug, round-robin)                                                                                                   |
| ------------ | ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1            | 86.9             | 5       | `actor-model-concurrency`, `computer-architecture`, `distributed-systems`, `nosql-databases`, `system-programming`                 |
| 2            | 42.4             | 5       | `advanced-algorithms`, `computer-science-foundations`, `domain-driven-design`, `object-oriented-design-and-patterns`, `windows-os` |
| 3            | 34.2             | 4       | `advanced-networking`, `concurrency-and-parallelism`, `event-driven-architecture`, `object-oriented-programming-essentials`        |
| 4            | 62.7             | 4       | `advanced-sql-and-query-performance`, `csp-style-concurrency`, `functional-programming`, `programming-paradigms`                   |
| 5            | 132.2            | 4       | `build-your-own-database`, `data-access-orms-and-query-builders`, `graph-databases`, `search-and-information-retrieval`            |
| 6            | 29.6             | 4       | `build-your-own-orm-and-query-builder`, `data-engineering`, `linux-os`, `software-architecture`                                    |
| 7            | 48.0             | 4       | `build-your-own-raft`, `data-structures-and-algorithms-essentials`, `modern-system-programming`, `sql-essentials`                  |
| 8            | 29.3             | 4       | `capstone-solid-core`, `database-internals-and-storage-engines`, `networking-essentials`, `system-design`                          |

## The Response Ladder

Apply the first rungs that bring the projection to the binding rule, in the order below. Write each rung taken in
the ledger with the measured figures that required it. Evaluate the ladder at Phase 1 (on the spike seconds) and
again before every checkpoint push (on the measured `examples check` minutes of the finished courses). Rungs 1, 2b,
2c, 3, and 4 are plan 11's names and meanings; rungs 2t and 2d are this plan's.

- **Rung 2t. Toolchain-aware selection (this plan's; applied first).** A change under
  `apps/ayokoding-cli/toolchains/` selects the courses that use the changed ids (the `toolchain` and `services` fields
  of their `run.yaml`) instead of every opted-in course. The rule maps a changed path or catalog entry to the ids it
  affects: a folder or entry of one id affects that id; a shared file (the catalog schema, a base Dockerfile
  fragment) affects every id, so a real base bump still runs everything. A new id, with its folder, its catalog entry,
  and the fixture unit and smoke row it adds, affects only itself, and no opted-in course declares it yet, so it
  selects nothing extra. Phase 1 reads how the merged selection maps paths to ids and keeps that mapping. This turns
  the seven additions from a repository-wide event into a local one. The change is a harness edit to plan 05's
  `selection/` package with tests first (below).
- **Rung 1. Author for speed.** One run per example unit (`main` only, with no extra `tests` runs unless the lesson
  is about tests), short programs, one source file per example. A unit is never merged with another to save time: one
  unit per example is plan 05's contract. A unit declares a service only if it needs one (the five
  relational-contrast units of the graph course run on `sqlite3` and declare none). Service settings that shorten
  start (a small heap, a small page cache, no optional modules) are allowed when SP2 or SP3 shows the output is
  unchanged.
- **Rung 2b. Scale the shard count with the units, up to 8** (`[1]` for at most 120 units, `[1..4]` for at most 800,
  `[1..8]` above 800, for every selection mode). Reuse plan 11's change if it merged; otherwise make it with a
  regression test first.
- **Rung 2c. A weighted split.** `--shard K/N` splits by unit count, largest first, when the sorted-slug split is
  above the limit and the best split fits. Reuse plan 11's change if it merged.
- **Rung 3. Raise the `since` timeout.** If the longest shard is above 45 minutes but at or below 90, raise
  `timeout-minutes` for `selection: since` from 60 to 120 in the reusable workflow (plan 11 may have done it), and
  record the reason in the workflow comment. At planning figures this is needed from push 2.
- **Rung 2d. Split a heavy course by unit (this plan's; conditional).** If, after rungs 2b, 2c, and 3, one course's
  measured minutes alone exceed two-thirds of the limit that applies (60 minutes under the 90-minute limit), change
  `--shard K/N` so the units of that course divide across shards (sorted by path, round-robin, each unit in exactly
  one shard), and the course-level checks run in shard 1 only. At planning figures this triggers for
  `graph-databases` (85.8 minutes); a lower measured Neo4j start time may make it unnecessary.
- **Rung 4. Stop and report.** If the projection is still above 75 percent of the applicable timeout after the
  rungs above, mark the heaviest course BLOCKED with the cause "does not fit the CI budget" and report to the user.
  A course is never weakened (fewer examples, merged units, a skipped run) to fit.

Phase 0 records which of plan 11's rungs are already in the merged workflow and CLI, and does nothing for those.

**If rung 2t cannot be built** (plan 05's selection resists the change, or its tests cannot be made to pass), no
addition is made: the seven fall back as in the table above, `graph-databases` keeps the `neo4j` service that is
already in the catalog, and the PR never enters FULL mode. This is the safe path, it still meets the definition of
done for every course, and it is recorded in the ledger as a decision D4 and D6 outcome. It is not BLOCKED.

**Tests for rungs 2t and 2d** (regression test first, in plan 05's `apps/ayokoding-cli` test layout, expected under
`internal/selection/` and the CLI's selection feature file; Phase 1 finds the merged paths):

- **2t RED:** a changed-path set that adds `toolchains/valkey/**` and one catalog entry selects every opted-in course.
  **GREEN:** it selects only the courses whose `run.yaml` declares `valkey` (none yet) plus the courses changed by
  path.
- **2t RED:** a change to the `python` Dockerfile selects every opted-in course. **GREEN:** it selects every course
  that declares `python`, and a change to the catalog schema selects every opted-in course.
- **2d RED:** a course of 99 units selected into eight shards appears in one shard. **GREEN:** it appears in at
  least two, every unit runs exactly once, and the course-level checks run once.

The rung 2t and 2d changes ride the same PR. They change what is selected and how it is divided; they loosen no
check. They are recorded as decision D10 in [008](./008-decision-records.md).

## The Monthly Full Run

Plan 05 runs every opted-in course monthly with a 300-minute `all` timeout (the limit is 75 percent, 225). Plan 11's
rung 2b makes the shard count scale with the units for every mode, so the monthly run scales to eight shards too.
At planning figures the end state after this plan is about 1,315 minutes in the full run (850 at the end of plan 11
plus this plan's 465); eight shards with the best split give about 164 minutes each, inside 225, and four
shards give about 329, outside 300. Plan 13 and plan 14 add and remove courses later; the end-of-series figure is
theirs. Phase 0 recomputes the projection from the merged units, SP12 from measured seconds, and Phase 8 records it
in the final gate. Plan 05's revisit trigger applies: full-run shards above 300 minutes, or derived environment
builds above 15 minutes per shard on a warm cache.

## Phase 1 Spikes

A spike answers one question with a small experiment before any course depends on the answer. Each spike writes its
measurement and verdict (`PASS` or `FAIL`, with the fallback taken) to `harness-measurements.md` in this plan's
folder, created in Phase 1, and the same line goes to the ledger. A course's CP-0 readiness check names the spikes it
needs; none of its packets starts until those spikes are recorded.

| Spike | Question                                                                                                                    | Pass condition                                                                                                                                                                                            | Fallback on FAIL                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| SP1   | Do the hash-locked Python locks resolve and install offline, on Python 3.14 and both architectures?                         | Every package of every course lock has a cp314 wheel (or a pure-Python wheel) for amd64 and arm64, installs with `--require-hashes` and no network, and one lock serves both architectures                | Replace a package with the standard library where the lesson allows, rewrite the unit otherwise; record the architecture split |
| SP2   | Does each NoSQL store pass the five admission tests (AU2)?                                                                  | Digest recorded; no secret; ready inside `readyTimeout` (at most 60 s); byte-identical output on the double run for a fixture unit; shard cost fits the ladder                                            | The store is not added; its units become labelled models                                                                       |
| SP3   | Does a derived `neo4j-gds` image run GDS procedures deterministically on Community Edition?                                 | The plugin jar checks by SHA-256; procedures run with `concurrency: 1` and a `randomSeed`; double run byte-equal at half CPU; the licence statement is recorded                                           | GDS units become Python models                                                                                                 |
| SP4   | Does a derived `gremlin` image run a Groovy script against an in-memory TinkerGraph offline?                                | The console zip checks by SHA-256; `gremlin.sh` runs a script non-interactively; the start cost per unit is recorded; double run byte-equal                                                               | Gremlin units become Python traversal models                                                                                   |
| SP5   | Can `pg_stat_statements` be loaded for one unit?                                                                            | The merged service contract has an `args` (or equivalent) field that passes `shared_preload_libraries`, and the unit's output is stable                                                                   | Example 82 is a labelled illustration within the course's budget                                                               |
| SP6   | Is output independent of the CPU count with the pins this plan names?                                                       | A probe unit per toolchain (Python pool, Go with `GOMAXPROCS`, Elixir with the scheduler flag, Rust with a fixed thread count, DuckDB with `threads = 1`) prints equal bytes at both CPU quotas           | Rewrite the unit so no value depends on the count                                                                              |
| SP7   | Do loopback sockets and a throwaway TLS key work under `--network none`?                                                    | A listener on `127.0.0.1` with a test-chosen port and a client run in one container; a TLS 1.3 handshake succeeds with a key made in the unit (or a stored test-only key pair); output is stable          | Networking units that need a socket become fixture or model units                                                              |
| SP8   | Does the `gcc` image support `-std=c23`, sanitizers, and the process calls `linux-os` and `system-programming` teach?       | `-std=c23 -Wall -Wextra -Werror` builds; `-fsanitize=address,undefined` runs with `detect_leaks=0` and gives the expected exit; `fork`, signals, pipes, and `mmap` work under the default seccomp         | Units that need a blocked call are shown as the refusal (`EPERM`) or become models                                             |
| SP9   | Does Rust 1.99.0 build offline with single files and a lock-free `cargo` project?                                           | `rustc --edition 2024 --color never` builds and runs; a `cargo` project with no dependencies builds with `--offline` into a target folder under `/tmp`; compile-error diagnostics are stable              | Capstone units use `rustc` on several files                                                                                    |
| SP10  | Does Go 1.27.2 run `testing/synctest` and modules offline, with a pinned `GOMAXPROCS`?                                      | `go test` with a synctest bubble passes in the sandbox with `GOCACHE=/tmp/gocache`; a module with no dependencies builds; the double run is byte-equal                                                    | Timer units use the kit's virtual clock instead of a bubble                                                                    |
| SP11  | Does the `windows-static` validator accept the course's Win32 C, PowerShell, and .NET, and how is a sample output anchored? | A fixture course of each kind passes; the merged contract has a form for a labelled sample output that the static run does not compare                                                                    | Sample outputs are labelled illustration fences (budget 0 is raised only for this reason, recorded in the ledger)              |
| SP12  | What do the planning figures become when measured?                                                                          | Seconds per invocation for each toolchain and service, environment build minutes per lock, and the shard table recomputed; the ladder decision written down                                               | Rungs of the ladder in order                                                                                                   |
| SP13  | Does the capstone fit one or two toolchains per unit with an ASGI test client, linters, and git?                            | Each of the capstone's 45 worked-example units declares one toolchain (two at most) and runs; `fastapi`, `pydantic`, `starlette`, `argon2-cffi`, `pytest`, `hypothesis`, and the three linter wheels lock | The failing units become `kind: check` runs over fixture files                                                                 |

Which course needs which spikes:

| Course                                      | Spikes it needs     |
| ------------------------------------------- | ------------------- |
| `actor-model-concurrency`                   | SP6, SP12           |
| `advanced-algorithms`                       | SP1, SP12           |
| `computer-science-foundations`              | SP12                |
| `concurrency-and-parallelism`               | SP1, SP6, SP12      |
| `csp-style-concurrency`                     | SP6, SP10, SP12     |
| `data-structures-and-algorithms-essentials` | SP1, SP12           |
| `functional-programming`                    | SP1, SP12           |
| `object-oriented-design-and-patterns`       | SP1, SP12           |
| `object-oriented-programming-essentials`    | SP1, SP12           |
| `programming-paradigms`                     | SP1, SP12           |
| `advanced-networking`                       | SP7, SP12           |
| `computer-architecture`                     | SP6, SP8, SP12      |
| `linux-os`                                  | SP8, SP12           |
| `modern-system-programming`                 | SP6, SP9, SP12      |
| `networking-essentials`                     | SP7, SP12           |
| `system-programming`                        | SP8, SP12           |
| `windows-os`                                | SP11, SP12          |
| `advanced-sql-and-query-performance`        | SP1, SP5, SP12      |
| `build-your-own-database`                   | SP12                |
| `build-your-own-orm-and-query-builder`      | SP1, SP12           |
| `data-access-orms-and-query-builders`       | SP1, SP12           |
| `data-engineering`                          | SP1, SP6, SP12      |
| `database-internals-and-storage-engines`    | SP1, SP12           |
| `graph-databases`                           | SP1, SP3, SP4, SP12 |
| `nosql-databases`                           | SP1, SP2, SP12      |
| `search-and-information-retrieval`          | SP12                |
| `sql-essentials`                            | SP1, SP12           |
| `build-your-own-raft`                       | SP6, SP10, SP12     |
| `capstone-solid-core`                       | SP1, SP12, SP13     |
| `distributed-systems`                       | SP12                |
| `domain-driven-design`                      | SP12                |
| `event-driven-architecture`                 | SP12                |
| `software-architecture`                     | SP12                |
| `system-design`                             | SP12                |

**Order.** SP12's first measurements, SP1, and SP2 start first because most courses depend on them. SP3, SP4, and
SP5 can run in parallel with them. SP6 to SP11 are run by the `swe-*` agent of the course that needs them, inside
the wave that first reaches that course, with the same recording rule; a spike result is reused by later courses and
is not repeated. SP13 runs before wave 7 (`capstone-solid-core`).

## Phase 0 and Phase 1 Measurements

Phase 0 records the shard facts (the merged `examples-plan` rule, the timeouts, the shard split), the merged
catalog (ids, pins, the `java` and `clojure` entries, plan 06's `psql`), the Temurin digest, and computes the
FULL-run projection with a conservative per-course figure. Phase 1 runs the spikes, builds the passing images with
`toolchains build`, records the seconds per invocation for `python`, `shell`, `gcc`, `go`, `rust`, `elixir`,
`postgres`, `neo4j`, and each added service, fills the shard table, decides the rungs, builds rung 2t with tests
first if the merged selection lacks it, and lands the additions in one commit. After each finished course the
ledger replaces its planning minutes with the measured `EX-CHECK` time.
