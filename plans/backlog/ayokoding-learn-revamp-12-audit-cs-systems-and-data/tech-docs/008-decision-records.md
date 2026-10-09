# 008 — Decision Records

Each record gives the choice, two alternatives, prior art, trade-offs, consequences, and what would make us revisit
it. Series decisions (numbered 1 to 42, made by the user on 2026-10-09) are inputs, not re-decided here; a record
cites them where they bind. The user made no choice about the items below, so each is a default taken on the user's
behalf, recorded so it can be reversed; none is an open question for the user.

## D1 — Audit in Place, With Honest Authoring Where a Course Is Thin

- **Selected:** each of the 34 courses keeps its slug, title, mode, category, weight, subject, and place in every
  path. The audit closes the defect classes in place and writes only what the definition of done needs. It is stated
  plainly that about 14 to 16 courses need real authoring.
- **Alternatives:** (a) rewrite the weak courses from scratch, as plans 06 to 09 do for outlines and filler; (b) leave
  the courses and only add `run.yaml` files.
- **Prior art:** series decision 28 splits the work into "rewrite from scratch" (outlines, filler) and "audit" (the
  other 111 courses). The 34 courses here are measured on 2026-10-09 as real courses with 2,211 to 100,135 words; 20
  of them already reach their word floor and 14 are short of it.
- **Trade-offs:** an audit keeps what is good, and the healthiest courses need little; but a course with 2,211 words
  for 85 examples is closer to a rewrite than an audit, and option (b) would leave courses that fail the definition of
  done. Calling the whole plan an audit would hide that.
- **Consequences:** briefs list defects, not outlines; the size class decides the effort; a course that cannot meet
  its mode after 2 cycles is BLOCKED (D2), not rewritten into another shape.
- **Revisit when:** more than 16 courses turn out to need real authoring, or the first audit shows a course where
  more than half of the existing text is replaced; the user may then prefer to treat it as a rewrite plan.

## D2 — One PR, Twelve Waves, One Commit per Course, Four Checkpoint Pushes

- **Selected:** one plan, one PR; 12 waves of at most three courses ([005](./005-execution-model-waves-and-ledger.md));
  one commit per DONE course made by the coordinator, plus separate commits for harness or workflow changes; pushes
  after waves 3, 6, 9, and 12, with a draft PR opened at the first.
- **Alternatives:** (a) one commit per wave, as plan 07 does; (b) several PRs (forbidden by the series: one plan, one
  PR).
- **Prior art:** plan 06 commits per course; plan 07 per wave because its courses are gated together; plan 11 chose
  per course for the same reason as here.
- **Trade-offs:** 34 course commits are more to read than 12, but each course is independent, already shipping, and
  may be BLOCKED or deferred on its own; a per-course commit can be reverted without touching a neighbour, and a PR of
  9,000 to 11,000 files is only reviewable commit by commit.
- **Consequences:** every commit leaves `test:quick` green (the registry row, the baseline entry, and the course land
  together). A BLOCKED course is never in a commit.
- **Revisit when:** commit count slows the push leak review or CI beyond the wave budget.

## D3 — Harness Mode per Course: Real Mode First, Simulation Where Order or Failure Is the Subject

- **Selected:** every course runs in real mode. Fifteen courses use the simulation convention for some or all of their units
  (S1 to S9: a virtual clock, seeds 1 to 64, invariants, a summary line) because their subject is interleaving,
  failure, or load; two run networking on loopback with fixtures and models; two use deterministic models
  (hardware counts and load); the rest are plain real mode, with the services of D4 and D6 where a store is the
  subject, and `windows-os` in static mode
  ([003](./003-harness-modes-simulation-and-determinism.md#harness-modes-in-this-plan)).
- **Alternatives:** (a) mark the concurrency and distributed courses static or illustration-only, because their
  output varies on real hardware; (b) drop the examples that cannot be made deterministic.
- **Prior art:** plan 05's convention S1 to S9 and its sources (FoundationDB's simulation testing, TigerBeetle's VOPR);
  plan 11's rule TC1 that a model's lesson says it is a model.
- **Trade-offs:** a simulation proves the model, not the world, and the lesson must say so; but a course whose
  examples are not run teaches nothing a reader can trust, and dropping examples breaks the mode floor.
- **Consequences:** about 70 of the 85 `distributed-systems` units are cluster models; a unit that demonstrates a bug
  names a failing seed and expects exit 1; the summary line and the `AYOKODING_SEED` replay are part of the contract.
- **Revisit when:** a gate finds that a model misleads about real behaviour in a way the lesson text cannot repair.

## D4 — Five NoSQL Services, an Admission Test, and Models as the Fallback

- **Selected:** `valkey`, `mongodb`, `cassandra`, `dynamodb-local`, and `timescaledb` are added as digest-pinned
  service images, each only after the five admission tests of rule AU2 pass in its spike (SP2). An id that fails is
  not added: its units become labelled in-process models, and the real command is shown as an illustration within
  `nosql-databases`' budget of 6. DuckDB runs in process and needs no service.
- **Alternatives:** (a) model every store in Python and add no service; (b) also add ClickHouse and a PostgreSQL image
  that preloads `pg_stat_statements`.
- **Prior art:** plan 05's service contract (`postgres`, `neo4j`); plan 11's budget rule and its default of no.
- **Trade-offs:** a real store teaches its own query language and failure messages, which a model cannot; it also
  costs start time and CI minutes, and `cassandra` is the likeliest to fail on start time. Option (b) fails the value
  floor: each of those would serve one code unit.
- **Consequences:** `nosql-databases` plans 110 runs at about 12 planning seconds per invocation; the budget rule (at least 5 code units name the id) keeps the list at five services; a failed spike
  changes lesson text, never the course's status.
- **Revisit when:** a spike passes with start times that make a sixth store (ClickHouse) worth five or more units.

## D5 — `pg_stat_statements` Uses a Service Argument or Is an Illustration

- **Selected:** Example 82 of `advanced-sql-and-query-performance` needs the `pg_stat_statements` library loaded at
  server start. If the merged service contract has an `args` field (or an equivalent) that passes
  `shared_preload_libraries`, the unit uses it (SP5). Otherwise the example is a labelled illustration inside the
  course's budget of 3.
- **Alternatives:** (a) add a second PostgreSQL service id with the library preloaded; (b) drop the example.
- **Prior art:** plan 05's service fields; the budget rule's value floor of 5 units.
- **Trade-offs:** a second image for one unit costs an addition and a smoke row; dropping the example loses the
  standard tool for finding slow queries.
- **Consequences:** no new id; the lesson says plainly whether the output was run.
- **Revisit when:** a second course needs a PostgreSQL extension that the base image lacks.

## D6 — Graph Courses: Derived Images for GDS and Gremlin, Relational Contrast on SQLite

- **Selected:** `neo4j-gds` (the pinned Neo4j plus the Graph Data Science jar, SHA-256-checked) serves the 10 GDS
  units; `gremlin` (the Temurin base plus the TinkerPop console zip, SHA-256-checked, no use of plan 09's jar recipe)
  serves the 7 Gremlin units. The five relational-contrast units run on `sqlite3` and declare no service, so they
  cost no start time. Fallbacks: Python models, and the illustration budget of `graph-databases` rises from 3 to 8.
- **Alternatives:** (a) models for GDS and Gremlin only; (b) run Gremlin through a hosted service (forbidden: network
  none).
- **Prior art:** plan 05's `neo4j` entry (Community, Cypher 25); plan 09's Temurin base for `java`.
- **Trade-offs:** GDS is the course's reason to exist at the algorithm level and Gremlin is a different language, so a
  model teaches them worse; but `graph-databases` is 18 percent of the plan's CI load, and a Neo4j start costs about
  26 planning seconds a run.
- **Consequences:** the course is the heaviest in CI and may trigger rung 2d (D10); its prerequisites no longer include
  `nosql-databases` (plan 02).
- **Revisit when:** SP3 or SP4 shows the image cannot be made deterministic at half the CPU quota.

## D7 — Networking Courses Never Reach a Real Host

- **Selected:** every network unit takes one of three forms: a loopback pair, a fixture file, or a seeded virtual
  network. Rule AU3 limits every address and name in an expected file to documentation values (`example.com`,
  RFC 5737, RFC 3849) or loopback. The recorded outputs the two courses hold today are never expected files unless a
  new unit reproduces them.
- **Alternatives:** (a) allow a declared network for a few units; (b) mark the network units as illustrations.
- **Prior art:** plan 05's `--network none`; plan 09's SEC1 for security courses; RFC 5737 and RFC 3849.
- **Trade-offs:** a model of TCP congestion control is not a measurement of a real link, and the lesson says so; a
  declared network breaks the double run, and illustrations would put about 100 units outside the harness.
- **Consequences:** `advanced-networking` loses 39 network-bound units and gains about 23 new units; TLS examples print
  protocol facts only, never key bytes.
- **Revisit when:** SP7 shows loopback or TLS cannot work under `--network none`.

## D8 — Computer Architecture: Counts From Models, Not Timings

- **Selected:** each timing example in `computer-architecture` becomes a model unit that prints counts (hits, misses,
  mispredictions, stall cycles) under invariants, or an explained measurement whose figure is labelled typical and not
  measured. No unit reads the CPU count, cache size, or a clock into output (rule AU1).
- **Alternatives:** (a) keep timings with a tolerance band; (b) remove the hardware-effect examples.
- **Prior art:** plan 05's rule against timing in compared streams; cache and branch simulators such as
  cachegrind.
- **Trade-offs:** a count shows why an effect happens but not how large it is on a given machine; a tolerance band
  would be a loosened check (forbidden).
- **Consequences:** about 60 of 80 examples are rewritten; the lessons that quoted measured speedups are rewritten to
  quote model counts and say what a real machine would add.
- **Revisit when:** the gates find the explained-measurement examples teach a false picture.

## D9 — `capstone-solid-core` Is Brought to Plan 08's Capstone Contract

- **Selected:** the course keeps its slug and place and takes plan 08's contract: standard Annotated Concept mode, 45
  worked examples in five themes, a capstone page with six required sections, a `relies-on` table, no top-level
  `code/`, a drilling tree with five exact sections, and five katas ([006](./006-prerequisites-metadata-and-closure.md#capstone-solid-core)).
- **Alternatives:** (a) keep the single 15,009-word page and only add `run.yaml` files to the 35 root files (fails the
  contract); (b) split it into several smaller capstones (changes the slug and the paths).
- **Prior art:** plan 08 decisions D1 to D3 on capstone modes and layout; plan 05's unit layout.
- **Trade-offs:** about 20,000 new words and 51 units; but the course is the goal of a career path and a dependency of
  `capstone-real-world-delivery`, so a partial form would break an invariant of the series.
- **Consequences:** the course is wave 7, size class L, with its own commit header; the duty to re-read the `relies-on`
  row of `capstone-real-world-delivery` falls on this plan.
- **Revisit when:** SP13 shows the app cannot be exercised in process, in which case the failing units become check
  runs over fixture files.

## D10 — The CI Ladder: Toolchain-Aware Selection First, Unit-Level Split Last

- **Selected:** the response ladder in [004](./004-toolchain-additions-and-ci-budget.md#the-response-ladder) puts
  rung 2t (a toolchain change selects only the courses that use it) first, then plan 11's rungs 1, 2b, 2c, and 3, then
  rung 2d (divide the units of one heavy course across shards) if one course alone exceeds two-thirds of the limit,
  then rung 4 (stop and report). The binding rule is the longest shard at or below 75 percent of the timeout.
- **Alternatives:** (a) accept FULL mode and raise the timeout (the full run is about 1,315 planning minutes and
  cannot fit at eight shards); (b) add no toolchain at all, which is the fallback if rung 2t cannot be built.
- **Prior art:** plan 08's rung ladder; plan 11's rungs 2b, 2c, and 3; plan 05's FULL-mode rule for any change under
  `apps/ayokoding-cli/toolchains/`.
- **Trade-offs:** rung 2t changes plan 05's selection code, with tests, for the sake of seven additions; without it,
  the toolchain additions would make every push of the series run the entire repository.
- **Consequences:** if rung 2t cannot be built, no addition is made, every course still meets the definition of done,
  and nothing is BLOCKED. The ladder is re-decided before every push on measured minutes.
- **Revisit when:** Phase 1 measures seconds per invocation that make a lower rung unnecessary, or plan 05's selection
  gains toolchain awareness on its own.

## D11 — Modes Follow Plan 03; `advanced-networking` Stays Annotated Concept

- **Selected:** each course keeps the `format` plan 03 gave it: 28 By Example, five Annotated Concept
  (`computer-science-foundations`, `data-engineering`, `advanced-networking`, `software-architecture`,
  `system-design`), and one capstone. A maker may not switch it.
- **Alternatives:** (a) turn `advanced-networking` into By Example because it has 39 example units; (b) turn the five
  Annotated Concept courses into By Example for uniformity.
- **Prior art:** plan 03's `format` field and the adapter's separate floors; plan 11's D2.
- **Trade-offs:** `advanced-networking` has 62 numbered sections and 39 units, which is awkward in either mode; but the
  mode is the reader's contract and every floor depends on it.
- **Consequences:** the five courses need the heading form `### Worked Example N: Title`, at least 45 worked examples,
  and at least 10 diagrams; the completion test reads the same `format` from the registry.
- **Revisit when:** a gate returns `needs-decision` that the mode itself caused.

## D12 — Six Filler Courses Leave the Baseline in the Same Commit

- **Selected:** the six courses plan 09 baselined for this plan are rewritten inside their folders, and each commit
  that finishes one deletes its `FILLER_BASELINE` entry and lowers `FILLER_BASELINE_CAP` by one
  ([007](./007-testing-strategy.md#the-filler-baseline-ratchet)). `REWRITTEN_FILLER_COURSES` is not touched.
- **Alternatives:** (a) leave all entries until plan 14 removes them together; (b) add the six slugs to
  `REWRITTEN_FILLER_COURSES`.
- **Prior art:** plan 09's FILL2 (the baseline only shrinks, the cap falls in the commit that removes an entry); plan 11
  does the same for its five.
- **Trade-offs:** a per-course edit to a shared file serialises on the coordinator; but a baseline that outlives its
  courses is a rule that does not bind.
- **Consequences:** the cap goes 12, 11, 10, 9, 8, 7, 6 across this plan; plan 13 then removes its last six.
- **Revisit when:** plan 09's guard gains a different mechanism (for example a generated baseline).

## D13 — Wave Order From Plan 02's Revised Prerequisite Graph

- **Selected:** the 12 waves follow plan 02's revised prerequisites, checked by a script that fails if any in-plan
  prerequisite is not in a strictly earlier wave ([006](./006-prerequisites-metadata-and-closure.md#order-inside-the-plan)),
  with heavy and light courses mixed in each wave. `sql-essentials` is first because nine courses require it.
- **Alternatives:** (a) one wave per category; (b) heaviest courses first.
- **Prior art:** plan 11's D3; the repository's N+1 agent rule with N = 3.
- **Trade-offs:** category order would put the four service-backed courses together and break prerequisite order
  (`capstone-solid-core` needs seven courses from four categories); heaviest first would start courses before their
  prerequisites are final.
- **Consequences:** the first push (after wave 3) already exercises PostgreSQL and the C sandbox, and the NoSQL and
  graph courses arrive late, so their measured minutes replace the planning figures last.
- **Revisit when:** a BLOCKED prerequisite blocks more than one dependent in the same wave.

## D14 — `sql-essentials` Stays on SQLite

- **Selected:** `sql-essentials` keeps SQLite (the `sqlite3` CLI from the `shell` image and Python's module). Plans,
  indexes, and locks stay in `advanced-sql-and-query-performance` on PostgreSQL.
- **Alternatives:** (a) move `sql-essentials` to PostgreSQL so every SQL course shares an engine; (b) make the course
  engine-neutral with two outputs per example.
- **Prior art:** the course today; plan 05's `postgres` service and plan 06's `psql`.
- **Trade-offs:** nine courses require `sql-essentials`, and a service in the first course would add start cost to a
  course that needs none; but the engine differs from the one the next course uses.
- **Consequences:** the lessons state which SQLite version each output came from; one unit prints the library version.
- **Revisit when:** a dependent course needs a PostgreSQL feature that `sql-essentials` must introduce.

## D15 — The Completion Test Is Extended, Not Duplicated

- **Selected:** this plan adds 34 rows to plan 11's registry (`AUDITED_COURSES`) and one scenario, the ninth, "The
  registry lists every course audited by plan 12", in the same feature file
  ([007](./007-testing-strategy.md#extending-the-audited-course-completion-feature)). Phase 0 reads plan 11's step
  file and follows its constant, probe variable, and scenario titles.
- **Alternatives:** (a) a second feature and registry for plan 12; (b) no test, relying on the gates and the harness.
- **Prior art:** plan 11's D13 and its statement that plans 12 and 13 add their courses to the same list; series
  decision 37 (checks in tested TypeScript).
- **Trade-offs:** a shared registry means plan 12 edits a file plan 11 created; but one feature keeps the mechanical
  floors in one place and guards every audited course after the plans archive.
- **Consequences:** the registry holds 66 rows at the end of this plan; the ninth scenario is proven both ways by
  removing a row locally.
- **Revisit when:** the registry grows past what a reader can review, or a manifest comes to list all audited courses.
