# 009 — Decision Records

Each record names the selected option, at least two rejected alternatives, prior art, evidence, trade-offs,
consequences, and what would make the team revisit it. "Series decision n" refers to the resolved decisions in
[brd.md](../brd.md#resolved-series-decisions-this-plan-relies-on). D1 and D12 follow the user's rulings (series
decisions 39 and 42 and the one-plan-one-PR rule); the others are this plan's design choices.

## D1 — Order against the other plans

- **Selected:** the 14 plans of the series run strictly in sequence, one plan, one worktree, and one PR at a time
  (series decision 42, 2026-10-09). This plan starts after plans 01 to 06 have merged, so plan 04 (the phase
  roadmap with its flat mode) is on `origin/main` and this plan removes that flat mode. Plan 08 follows this plan,
  so the eight capstone courses are still outlines while this plan runs. Phase 0 checks every consumed name
  against `origin/main`.
- **Alternative 1 — run before plan 06.** Rejected: the ERP paths assume accounting courses that plan 06 fills,
  and the skills category landing is shared with plan 06.
- **Alternative 2 — run beside plans 04 or 08 and reconcile at merge.** Rejected by decision 42: two plans in
  flight need rebases, "whichever lands second" rules, and fallback branches. A strict sequence removes all
  three.
- **Prior art:** the repository's DAG-first rule orders dependent work by explicit edges, not by hope
  ([operating budgets](../../../../repo-governance/development/agents/agent-workflow-orchestration/operating-budgets-dag-first-and-background-slot.md));
  the series README orders the 14 plans the same way.
- **Evidence:** plan 02 hands this plan the mechanism removal; plan 04 owns the flat mode this plan removes;
  plan 05 provides the harness; plan 03 provides the metadata and the drift test; plan 06 provides the accounting
  prerequisites, the landing work, and the Sharia rules.
- **Trade-offs:** the plan cannot start early, and a defect in an earlier plan blocks this one until it is fixed.
  The plan is stable once it starts.
- **Consequences:** Phase 0 verifies every consumed name against `origin/main` and stops on a missing one. A
  missing plan is not an expected state: it means the sequence was broken, and the user decides.
- **Revisit when:** the plan order of the series changes.

## D2 — Mode assignment: 18 By Example and 12 Annotated-Concept

- **Selected:** By Example for courses whose subject is a set of small, runnable, deterministic scenarios;
  Annotated-Concept for courses whose subject is linked models, lifecycles, calendars, and policies. The reason
  for each of the 30 courses is in [002](./002-course-catalog-and-modes.md#why-each-mode).
- **Alternative 1 — everything By Example.** Rejected: concept-heavy courses (the module map, the foundations)
  would need 75 or more runnable examples and would be padded.
- **Alternative 2 — everything Annotated-Concept.** Rejected: process and costing courses are learned by running
  scenarios, and the By Example gate's density and part rules give them a stricter, better-checked shape.
- **Prior art:** the repository's tutorial kinds ([Tutorial Types](../../../../repo-governance/conventions/tutorials/naming.md)).
  The completed `sql-essentials` and `api-design` courses are By Example for the same reason.
- **Evidence:** the Why-this-mode paragraph in each course spec; the By Example peers measured in
  [001](./001-current-state-and-architecture.md#current-state-measured-2026-10-09-at-originmain-bb7f90137).
- **Trade-offs:** two quality gates and two maker agents are in play instead of one.
- **Consequences:** targets differ by mode ([003](./003-definition-of-done-and-targets.md#targets)).
- **Revisit when:** a mode gate repeatedly blocks courses of one kind for the same reason.

## D3 — No primer, in-the-field, or no-code course

- **Selected:** none of the 30 courses uses the primer, In the Field, or no-code Annotated-Concept mode.
- **Alternative 1 — a primer for the ERP domain ("Just Enough ERP").** Rejected: primers are language or tool
  on-ramps; the library already has `just-enough-python` and `sql-essentials`.
- **Alternative 2 — no-code courses for the Sharia topics.** Rejected: no-code invites prose that reads like a
  ruling (series decision 19). Showing the system storing terms, evidence, and decisions keeps the course
  technical.
- **Alternative 3 — In the Field guides for production ERP practice.** Rejected: that kind is organised by
  language and framework, with 20 to 40 guides per language.
- **Prior art:** the tutorial-kind definitions cited in D2.
- **Evidence:** the 30 course topics in the syllabus.
- **Trade-offs:** the Sharia courses carry more demanding source rules instead of a prose-only shortcut.
- **Consequences:** only the By Example and Annotated-Concept gates are used.
- **Revisit when:** a course topic turns out to be pure leadership or governance with no code.

## D4 — Runtimes: Python 3.14 and PostgreSQL 18

- **Selected:** every example is Python 3.14 standard library or, for the PostgreSQL courses, a `psql` SQL unit or a
  Python unit with the `pg8000` driver; 14 courses use PostgreSQL 18; two courses use seeded simulation. No other
  toolchain. This is this plan's own decision, made to match plan 06's choice of the same medium for the
  accounting courses, so one reader moves from the accounting track to the ERP track without changing tools.
- **Alternative 1 — TypeScript or Node.** Rejected: JavaScript has no decimal type, so money would need a decimal
  library locked into every course. Python has `decimal` in the standard library.
- **Alternative 2 — Java or C#.** Rejected: ERP is a common home for them, but slower unit starts multiply across
  about 2,000 units that each run twice, and no ERP topic here needs their features.
- **Alternative 3 — Python only, with `sqlite3` for SQL.** Rejected: the ERP courses teach what PostgreSQL
  enforces (constraints, locks, isolation, sequences), and `sqlite3` behaves differently on exactly those points.
- **Prior art:** plan 05's catalog supports `python` and `postgres`; plan 06 adds the `psql` toolchain; the
  completed `sql-essentials` course teaches SQL and is a prerequisite here.
- **Evidence:** catalog versions (Python 3.14.8, PostgreSQL 18.6) read on 2026-10-09 in plan 05
  [tech-docs/005](../../ayokoding-learn-revamp-05-code-harness/tech-docs/005-runners-and-toolchain-catalog.md).
- **Trade-offs:** ERP practitioners in other languages see Python; the lessons teach models, not syntax, and
  state this.
- **Consequences:** prerequisite rubric rule L1 adds `just-enough-python` to every course
  ([D18](#d18--prerequisites-are-re-derived-by-the-rubric)).
- **Revisit when:** the user wants another primary language for the ERP track.

## D5 — PostgreSQL example shape

- **Selected:** plan 06's conventions, adopted unchanged: `psql` SQL units for SQL-only examples; Python units with
  the pure-Python `pg8000` driver and one hash-locked lockfile per course (the same bytes in every course, copied
  from the lock plan 06 merged); no helper shared between units; every unit in its own schema with quiet notices
  ([004](./004-code-runtime-and-run-yaml.md#postgresql-example-shape)).
- **Alternative 1 — `psycopg` 3 with `psycopg-binary` and a shared `pgkit.py`.** Rejected: it ships platform wheels
  with a bundled C library (the lockfile needs hashes per platform), and a helper shared by 14 courses breaks the
  gates' rule that each example reads on its own. It would also give the site two database habits.
- **Alternative 2 — a derived image with Python and the PostgreSQL client together.** Rejected: a new image to
  build, pin, and maintain, when the `psql` toolchain reuses the service image the catalog already trusts.
- **Alternative 3 — a pgTAP-style SQL test framework.** Rejected: it teaches a test tool instead of the ERP
  concept and needs a PostgreSQL extension in the service image.
- **Prior art:** plan 06 decision D14; PostgreSQL's own isolation tester runs scripted sessions in a fixed step
  order and detects a blocked step through the lock tables
  ([`src/test/isolation`](https://github.com/postgres/postgres/tree/master/src/test/isolation)).
- **Evidence:** the probes P3 to P6 and P9 re-prove each part against the merged text before a course is written.
- **Trade-offs:** a few repeated lines of setup in every unit, in exchange for self-contained examples and one
  driver pin across 44 courses.
- **Consequences:** one environment image per distinct lockfile; a lock change is copied to every PostgreSQL course
  and proven with `cmp`.
- **Revisit when:** probe P9 shows no usable wheels, or plan 06's merged conventions differ (the merged text wins
  and the difference is recorded).

## D6 — Deterministic interleavings, not timed ones

- **Selected:** concurrency is shown with `dblink` from one `psql` script (a polling block that waits for the state
  `pg_stat_activity` reports), or with two `pg8000` connections in a fixed step order in which no statement waits
  (`NOWAIT`, `SKIP LOCKED`, serialization failures `40001`), and a per-session `deadlock_timeout` so the same
  session is always the deadlock victim. There are no threads. Interleaving search uses a seeded simulation (plan 05
  convention).
- **Alternative 1 — `sleep` to order threads.** Rejected: timing differs under the harness's half-CPU second run,
  so the double run would catch it intermittently at best.
- **Alternative 2 — run threads freely and sort the output.** Rejected: it hides the interleaving the lesson is
  about, and plan 06 forbids threads in course code.
- **Prior art:** FoundationDB's simulation testing makes behaviour repeatable by removing real time and thread
  scheduling ([testing](https://apple.github.io/foundationdb/testing.html)); the plan 05 convention follows it;
  plan 06's "Two Sessions in One Run".
- **Evidence:** probe P5 runs each behaviour 20 times and then under the double run.
- **Trade-offs:** examples need careful scripting; some natural race demonstrations are rewritten as scripted
  schedules.
- **Consequences:** no ERP example depends on elapsed time.
- **Revisit when:** probe P5 cannot make a behaviour deterministic; that example idea is then dropped, or shown with
  `NOWAIT` when `dblink` is unusable.

## D7 — 13 waves of at most three courses

- **Selected:** 13 waves in prerequisite order, each wave at most three courses (the repository's N=3), run in
  sequence, with checkpoint pushes after waves 3, 6, 9, and 12 ([007](./007-execution-batching-and-ledger.md#waves)).
- **Alternative 1 — one wave per path phase.** Rejected: phases have 3 to 8 courses, more than the slots, and
  later courses would wait on unrelated ones.
- **Alternative 2 — overlap waves to keep slots busy.** Rejected: the short waves (1, 2, 3, 11, 12, and 13) leave
  slots idle, but overlap makes the ledger and the resume rules harder to follow for a saving of a few idle
  slots.
- **Prior art:** the repository's DAG-first orchestration rule
  ([operating budgets](../../../../repo-governance/development/agents/agent-workflow-orchestration/operating-budgets-dag-first-and-background-slot.md)).
- **Evidence:** `validate()` in the plan generator checks that every course follows its in-plan prerequisites and
  that no wave exceeds three.
- **Trade-offs:** two waves with one course each.
- **Consequences:** the checklists are per wave and per course.
- **Revisit when:** plan 05 raises the safe parallelism budget.

## D8 — Slices and loop caps of two

- **Selected:** each course is written in slices S0 to S6 and judged by two gates with at most 2 cycles each,
  with at most 2 harness repair attempts and the unit rule (first run plus 2 fix attempts, one simpler
  replacement). The user set the cap of 2 on 2026-10-09 ("semua jadi 2 aja").
- **Alternative 1 — the repository gate default (a higher cycle cap).** Rejected by the user.
- **Alternative 2 — unbounded fix loops until green.** Rejected: it hides cost and risks never finishing.
- **Prior art:** the repository's quality-gate contract (bounded cycles, a frozen ledger, one writer, an advisory
  verdict) ([contract](../../../../repo-governance/development/workflow/quality-gate-contract/README.md)).
- **Evidence:** the gate input `max-cycles` accepts 1, 2, or 3.
- **Trade-offs:** a harder course may end `BLOCKED` where a third cycle might have rescued it. Blocked courses
  are reported and decided by the user (D9).
- **Consequences:** every "Bounded loops" line and checklist in the delivery says 2.
- **Revisit when:** more than a few courses end `BLOCKED` for a cause that one more cycle would have fixed.

## D9 — A `BLOCKED` course is restored, recorded, and reported

- **Selected:** partial work is copied to `local-tmp/ayokoding-learn/blocked/<slug>/`, the course returns to its
  skeleton, the ledger records the findings, and the user decides. The batch moves on.
- **Alternative 1 — commit partial work as a Preview course.** Rejected by decision 39: no Preview status.
- **Alternative 2 — shrink the targets until the course passes.** Rejected: quiet narrowing; decision 40 requires
  filled courses.
- **Alternative 3 — stop the whole batch at the first blocked course.** Rejected: independent courses can still
  finish and the user can decide once with the full picture.
- **Prior art:** stop-the-line in lean production, adapted so only the blocked line stops; the series rule
  "no quiet narrowing" (decision 39).
- **Evidence:** a course with a `run.yaml` is all or nothing in the harness, so partial work cannot ship anyway.
- **Trade-offs:** the end-state gate stays red until the user decides.
- **Consequences:** options and the exact steps are in [007](./007-execution-batching-and-ledger.md#blocked-courses).
- **Revisit when:** blocked courses become common; that points to a design problem in the specs.

## D10 — Sharia rules consumed from plan 06; AAOIFI register kept here

- **Selected:** the three Sharia ERP courses follow plan 06's rules SC1 to SC8 and the durable module that plan 06
  created. This plan adds four per-course checks (SH1 to SH4), four gated scenarios for the ERP courses, and an
  AAOIFI URL register in which a person ticks every AAOIFI URL (including `cis.aaoifi.com`) before merge
  ([005](./005-sharia-policy-and-source-register.md)).
- **Alternative 1 — write this plan's own Sharia rules.** Rejected: two rule sets for one subject would drift, and
  plan 06 made the module the durable home (its decision D9).
- **Alternative 2 — an automated link check as the only AAOIFI control.** Rejected: a live page can resolve and
  still show the wrong content, which the series brief records for this domain.
- **Alternative 3 — give a "recommended position" per topic.** Rejected: that is a ruling (decision 19).
- **Prior art:** AAOIFI, IIFA, and DSN-MUI publish standards and resolutions without being substitutes for a
  board's own decision; plan 06's rule module and its content-shape test.
- **Evidence:** the register lists each source's verification state as of 2026-10-09.
- **Trade-offs:** some course sentences stay general where sources conflict; the `cis.aaoifi.com` links are held to
  a stricter check than plan 06's SC7 requires.
- **Consequences:** Phase 7 holds a `[HUMAN]` tick step; the ticked URLs are added to the shared checked-links list
  that the gated scenario reads.
- **Revisit when:** a Sharia scholar reviews the courses and sets other rules, or plan 06's module changes.

## D11 — Delete the pending mechanism in the same PR, and keep plan 02's phases

- **Selected:** delete the marker field, the allowlist, the flat branches, and the marker scenarios here. Keep
  plan 02's phase boundaries and outcome wording; add `just-enough-python` to `assumes`
  ([006](./006-path-restructure-and-pending-removal.md)).
- **Alternative 1 — leave the dead mechanism for a later cleanup.** Rejected: dead code with a plan-specific name
  invites misuse, and decision 40 requires that no pending mechanism remains.
- **Alternative 2 — redesign the phases from scratch.** Rejected: the finished course set matches plan 02's
  draft, the reader-facing outcomes were reviewed there, and a redesign adds no value.
- **Prior art:** parallel change, whose last step removes the old path
  ([Martin Fowler](https://martinfowler.com/bliki/ParallelChange.html)).
- **Evidence:** the removal inventory in [006](./006-path-restructure-and-pending-removal.md#removal-inventory)
  and the closure derivation tables in the syllabus path files.
- **Trade-offs:** a larger final phase, with deletions across the code base.
- **Consequences:** from the merge on, R4 to R8 apply to every manifest.
- **Revisit when:** a future path needs a staged restructure again (it would need a new, named mechanism).

## D12 — One PR for the whole plan

- **Selected:** one branch and one PR carry the 30 courses, the path restructure, and the deletions
  (series rule: one plan, one PR; decision 39 ties the restructure to the filled courses).
- **Alternative 1 — one PR per wave.** Rejected: the manifests could not lose their marker until all courses are
  filled, so every wave PR would leave the paths unrestructured and the PR sequence would need a second integration
  step.
- **Alternative 2 — courses in PRs, paths in a final PR.** Rejected: it breaks the series rule, and content PRs
  with an opted-in course would each need their own CI shard run on partial state.
- **Prior art:** small changes are easier to review
  ([Google engineering practices](https://google.github.io/eng-practices/review/developer/small-cls.html)); this
  plan consciously exceeds that guidance because a partial result would break the series rule.
- **Evidence:** the PR is estimated at 8,000 to 10,000 files (about 1,800 example units and 200 kata units of three
  to five files each, plus lessons), almost all new course content and example code.
- **Trade-offs:** a very large PR. GitHub's "Files changed" view shows at most 300 files and 20,000 lines
  (1,000 files in the new preview; see GitHub's [repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits) and the [September 2025 changelog](https://github.blog/changelog/2025-09-11-pull-request-files-changed-public-preview-experience-september-11-updates)), so the PR cannot be read in the
  browser. Mitigations: checkpoint pushes after waves 3, 6, 9, and 12 with the push leak review and CI at each;
  wave commits that each add only complete, gated courses; a ledger and a committed execution summary; reviewers
  and the leak reviews read the commits locally with `git show` and `git diff --stat`, which have no such limit.
- **Consequences:** rollback is one revert ([008](./008-testing-and-verification.md#rollback)).
- **Revisit when:** the series allows content plans to land in more than one PR.

## D13 — The landing split with plan 06 is reconciled in Phase 0

- **Selected:** Phase 0 reads what plan 06 merged for each landing item, does what remains, and extends any
  accounting-only wording to cover ERP ([006](./006-path-restructure-and-pending-removal.md#landing-split-with-plan-06)).
- **Alternative 1 — this plan does all landing work and plan 06 none.** Rejected: plan 02 says plan 06 owns the
  removal of the ramp strip along with its accounting restructure.
- **Alternative 2 — fix the exact target text now.** Rejected: plan 06 may word things differently, and the two
  must agree.
- **Prior art:** none needed; this is coordination between two plans.
- **Evidence:** plan 02's hand-off table lists both plans as owners.
- **Trade-offs:** the executor decides row by row.
- **Consequences:** an evidence file records plan 06's merge commit and each decision.
- **Revisit when:** plan 06 changes its landing scope.

## D14 — Targets are plan-defined estimates

- **Selected:** the gates fix floors and bands (By Example 75 to 85 examples, Annotated-Concept floor 45). The
  plan adds targets for words, diagrams, drilling, and code-bearing share, and labels them as estimates
  ([003](./003-definition-of-done-and-targets.md#targets)).
- **Alternative 1 — present the extra numbers as gate rules.** Rejected: that would be false; the gates do not
  enforce them.
- **Alternative 2 — no extra targets.** Rejected: "filled" needs a measurable floor, or thin courses pass.
- **Prior art:** the well-built peers measured on 2026-10-09 (503 and 593 words per example).
- **Evidence:** the peer measurements and the thin Annotated-Concept peer in 001.
- **Trade-offs:** a target can be set too high or too low.
- **Consequences:** a miss by a small margin is a finding to fix with content; a systematic miss is a reason to
  revisit the target, with the user.
- **Revisit when:** more than a few courses fail the same target for sound reasons.

## D15 — The harness repair cap and what a repair may touch

- **Selected:** a harness pre-check before the gates and a harness run after them; at most 2 repair attempts each;
  after the gates a repair may change only code, `run.yaml`, expected files, anchored fences (through sync), and
  prose needed to keep a stated output true ([007](./007-execution-batching-and-ledger.md#rules-that-keep-the-loop-bounded)).
- **Alternative 1 — run the harness only at the end.** Rejected: the gates would judge code that may not run.
- **Alternative 2 — let repairs change anything.** Rejected: a repair that rewrites a lesson would need a new
  gate pass, which the cap forbids.
- **Prior art:** the quality-gate contract's separation between the read-only checker and the one writer.
- **Evidence:** the plan 05 sync tool repairs fence bodies from files mechanically and idempotently.
- **Trade-offs:** a late structural defect makes the course `BLOCKED` rather than patched.
- **Consequences:** gates never loop through the harness.
- **Revisit when:** late structural repairs become a frequent cause of `BLOCKED`.

## D16 — Commit and checkpoint cadence

- **Selected:** one commit per wave (header `docs(ayokoding-www): write ERP courses, wave N`, body naming the
  slugs), four checkpoint pushes, and a draft PR from the first.
- **Alternative 1 — one commit per course.** Rejected: 30 commits each running the hooks, with no review gain,
  since the ledger already records per-course results.
- **Alternative 2 — one commit for all courses.** Rejected: nothing to pause or resume on, and the push leak
  review would see one huge range.
- **Prior art:** [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), as the repository
  enforces with commitlint (header at most 100 characters, which three course slugs exceed).
- **Evidence:** the wave headers measured against the 100-character limit.
- **Trade-offs:** a wave commit is large.
- **Consequences:** CI feedback arrives at waves 3, 6, 9, and 12, early enough to catch lockfile and driver problems.
- **Revisit when:** a checkpoint CI run exceeds the job timeout.

## D17 — The UI design funnel is exempt

- **Selected:** no new screen, component, or interaction is designed here; the funnel is documented as exempt in
  [prd.md](../prd.md#ui-design-funnel).
- **Alternative 1 — run a funnel for the ERP path pages.** Rejected: plans 02 and 04 designed the phase rendering
  and the roadmap; this plan only gives them data and removes a branch.
- **Alternative 2 — redesign the skills category landing.** Rejected: the change is a copy edit and the removal of
  a strip.
- **Prior art:** plan 02's funnel for screens S1 to S3.
- **Evidence:** the file-impact tree lists only deletions and copy changes in UI code.
- **Trade-offs:** none beyond the review of the copy.
- **Consequences:** the UI Web gate and the UX review triad still run on the changed pages.
- **Revisit when:** reviewers find a layout problem that needs a new design.

## D18 — Prerequisites are re-derived by the rubric

- **Selected:** each course's `prerequisites` are re-derived with plan 02's rubric (T1 to T4, L1, C1); L1 adds
  `just-enough-python` to every ERP course and `sql-essentials` to the 14 PostgreSQL courses. The two ERP
  `assumes` lists grow by `just-enough-python`.
- **Alternative 1 — keep the skeleton prerequisites.** Rejected: they were set before the code medium was chosen,
  and rule L1 requires the medium.
- **Alternative 2 — add only a note in the course text.** Rejected: the closure check reads frontmatter, and the
  path page lists assumed courses from it.
- **Prior art:** plan 02's rubric
  ([tech-docs/003](../../ayokoding-learn-revamp-02-path-model/tech-docs/003-prerequisite-rubric-and-evidence.md)).
- **Evidence:** the closure derivation tables in the syllabus path files (12 and 14 assumed courses).
- **Trade-offs:** plan 02's drafts and this plan differ by one assumed course; the syllabus path files say so.
- **Consequences:** the paths' "Before you start" list shows Python and SQL.
- **Revisit when:** plan 02 changes the rubric.

## D19 — Nine theme pages for Annotated-Concept courses

- **Selected:** each Annotated-Concept course has nine theme pages (`theme-a-<slug>.md` to `theme-i-<slug>.md`) of
  five or six worked examples, 48 in all.
- **Alternative 1 — plan 06's five theme pages of about nine examples.** Rejected: each ERP course has nine concept
  clusters in its spec, and merging clusters into five pages would hide the cluster boundaries the S0 plan and the
  mode gate use.
- **Alternative 2 — three level pages, as By Example does.** Rejected: the Annotated-Concept skill clusters by
  theme, not by tier.
- **Prior art:** the `annotated-concept` authoring skill's per-theme clustering rule; plan 06's page layout, which
  this plan follows except for the page count.
- **Evidence:** the adapter sets a floor of 45 worked examples and no page count, and `learning/overview.md` lists
  every example either way.
- **Trade-offs:** the two tracks differ in page count; a reader sees the same page names and headings.
- **Consequences:** the Measuring commands and the content-shape test read `theme-*.md`, whatever the count.
- **Revisit when:** the series standardizes a page count for Annotated-Concept courses.

## D20 — A content-shape test for the 30 ERP courses, sharing plan 06's helpers

- **Selected:** a new feature `erp-course-completion.feature`, bound by a Unit step file over the real content,
  mirrors plan 06's `accounting-course-completion.feature` for the ERP courses (no outline, word floors, full
  drilling page, run specifications, and the Sharia scenarios). Shared readers and lists (word count, the superseded
  standards list, the checked AAOIFI links) move into one helper that both step files import.
- **Alternative 1 — extend plan 06's feature to cover ERP.** Rejected: its Givens name "the two accounting skills
  paths", and widening them would edit a merged plan's scenarios.
- **Alternative 2 — a one-time measurement recorded as evidence only.** Rejected: it would not stop a later
  regression, and plan 06 chose a test for the same reason (its decision D12).
- **Prior art:** plan 06 decision D12; plan 02's outline guard and plan 03's drift test read real content in the
  Unit suite; series decision 37 forbids ad-hoc scripts.
- **Evidence:** the scenario-to-test map in [008](./008-testing-and-verification.md#gherkin-to-test-binding-map).
- **Trade-offs:** a second feature file and one refactor of plan 06's step file; two lists that must stay equal are
  now one.
- **Consequences:** `QUICK` guards the 30 courses from the merge on.
- **Revisit when:** plan 14's series-completion gate adds a general check that covers both features.

## D21 — Re-point outline-example tests before wave 1

- **Selected:** Phase 1 re-points every test that uses an ERP course as "an outline course" to a course that stays
  an outline after this PR, before the first ERP course is filled ([006](./006-path-restructure-and-pending-removal.md#outline-example-tests-handoff-from-plan-06)).
- **Alternative 1 — re-point at the end of the plan.** Rejected: the first checkpoint push (wave 3) would run the
  tests with `erp-foundations-and-history` already filled, and CI would fail for a reason that has nothing to do
  with the wave.
- **Alternative 2 — convert the tests to synthetic fixtures now.** Rejected: end-to-end tests run against real course
  content with fixture manifests, so a synthetic course would have to exist on the real site (plan 06 reached the
  same conclusion).
- **Prior art:** plan 06 decision D16, which created this hand-off.
- **Evidence:** the search in the cited section lists every hit; the capstone courses stay outlines until plan 08.
- **Trade-offs:** a small test change before any content work.
- **Consequences:** if no outline course would remain, the Outline badge needs a user decision.
- **Revisit when:** the last outline course in the library is filled.
