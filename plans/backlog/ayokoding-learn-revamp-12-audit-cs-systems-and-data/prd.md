# Product Requirements — Audit of Computer Science, Systems, and Data Courses

## Personas

| Persona                   | Who they are                                                                                                                          | What they need from this plan                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Dina, systems learner** | A developer who follows a software-engineer path and opens `linux-os` after `just-enough-c`, then `system-programming`.               | A finished course: every example shown with the exact code and output of a program that ran, honest about what a sandbox cannot show. |
| **Raka, data engineer**   | An engineer who studies `advanced-sql-and-query-performance`, `nosql-databases`, and `graph-databases` to choose and run real stores. | Examples that run against the real store where one is available, and a plain label where an example runs a model of a mechanism.      |
| **Content maintainer**    | A person who edits a course after merge, or an author of plan 13.                                                                     | A test that fails when a finished course loses its shape, a harness that fails when an example stops running, and one written method. |
| **PR reviewer**           | The person who reviews this very large PR.                                                                                            | One commit per course, a gate record for each, and a committed execution summary.                                                     |

## User Stories

- **US1.** As Dina, I want every course I meet on my path to be complete, so that no step is a thin list of headings
  (two courses today have about 2,200 and 2,600 words for 78 examples).
- **US2.** As Dina, I want each example to show real code and its real output, so that I can run it and get the same
  result.
- **US3.** As Dina, I want a drilling page with recall questions, applied problems, code katas, a self-check, and
  self-explanation prompts, so that I can test what I learned.
- **US4.** As Raka, I want a lesson to say when an example runs a model of a store, a network, a cluster, or a CPU
  instead of the real thing, so that I never mistake a simulation for a measurement.
- **US5.** As Raka, I want the database examples to run against the real database where the harness can host it, so that
  the queries I copy are the ones that ran.
- **US6.** As a content maintainer, I want a test that lists the audited courses and fails when one drops under its
  floors, so that the courses stay finished.
- **US7.** As a content maintainer, I want the filler guard to pass for every course, with the baseline entries of this
  plan removed, so that templated courses cannot return.
- **US8.** As a reader who follows the AI Engineer path, I want its core to stay the same unless the user chose
  otherwise, so that the path does not change under me.
- **US9.** As the PR reviewer, I want one commit per course and a record of the gates, so that I can review a course on
  its own.
- **US10.** As a reader of `capstone-solid-core`, I want a project brief, milestones, acceptance criteria, a rubric, and a
  reference solution, so that I can tell when I have finished the capstone.

## Functional Requirements

| Id   | Requirement                                                                                                                                                                                                                                    | Story    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR1  | Each of the 34 courses meets the floors of its mode in [tech-docs/002](./tech-docs/002-definition-of-done-and-audit-method.md#targets-by-mode): words, example count and numbering, diagrams, "Why It Matters" length, and annotation density. | US1      |
| FR2  | Every example, kata, and capstone with code is a harness unit with a deterministic `run.yaml`; its lesson shows the unit's code and its recorded output from the files.                                                                        | US2      |
| FR3  | Every course has a drilling page of at least 5,000 words with the five exact sections, and the kata units of its mode (at least 8 for By Example, at least 5 for Annotated Concept and the capstone).                                          | US3      |
| FR4  | Every example that models a store, a network, a cluster, or a CPU, or that is a static check or an illustration, says so in one plain sentence beside its fence (rule TC1), and the illustration count stays within the course's budget.       | US4      |
| FR5  | Every course that teaches a store runs it as a service where the store passes the admission test (AU2), and as a labelled model where it does not; no course is BLOCKED for a failed admission.                                                | US5      |
| FR6  | Anchored lesson fences equal their files; every `Output` block is anchored to an expected file; `examples sync` exits 0 for each course.                                                                                                       | US2      |
| FR7  | `ayokoding-cli examples check --course <slug>` exits 0 for every course, and `examples coverage` reports `covered: true` for all 34 courses; `windows-os` is covered in static mode.                                                           | US2      |
| FR8  | Each course passes its mode quality gate and the Content Quality Gate (`PASS` or `PASS_WITH_FINDINGS`, no open `needs-decision` row) within 2 cycles each, or is recorded BLOCKED and reported.                                                | US1, US9 |
| FR9  | The six courses tagged `plan-12` leave `FILLER_BASELINE` in the same commit that fixes them, the cap falls by six, to 6, and the filler guard passes for all 34 courses.                                                                       | US7      |
| FR10 | Plan 11's content-shape test holds 34 more registry rows, enforces FR1, FR3, and the code-unit rule of FR2 for every registered course, and a ninth scenario requires all 34 slugs to be registered at the end.                                | US6      |
| FR11 | Every course's `estimatedHours` equals the drift test's value after its last edit; `prerequisites` follow plan 02's rubric; the integrity tests stay green; the AI Engineer core is unchanged unless the user chose otherwise.                 | US8      |
| FR12 | The CI examples check passes on every checkpoint push and on the final head within the timeout that applies, using only the ladder rungs of [tech-docs/004](./tech-docs/004-toolchain-additions-and-ci-budget.md#the-response-ladder).         | US9      |
| FR13 | Each finished course is one commit, `fix(ayokoding-www): audit <slug> course` (or the filler or capstone header), and the execution summary lists every course with its status, cycles, verdicts, and harness result.                          | US9      |
| FR14 | Each added toolchain or service id passes its spike and the budget rule, or is not added and its units become labelled models; the additions land in one early commit.                                                                         | US5      |
| FR15 | Concurrency, distributed, database-internals, and similar units follow the simulation convention S1 to S9: virtual clock, seeds 1 to 64, invariants after every step, the summary line, and `AYOKODING_SEED` replay.                           | US2, US4 |
| FR16 | Networking examples never reach a real host (rule AU3), and no output depends on the processor count (rule AU1).                                                                                                                               | US2, US4 |
| FR17 | `capstone-solid-core` has the capstone contract: the mode sentence, 45 worked examples in five themes, a capstone page with six sections, a `relies-on` table, a drilling tree, and no top-level `code/`.                                      | US10     |

## Non-Functional Requirements

- **Determinism.** Every unit gives the same output on two runs, the second with half the CPU (plan 05's rule), with
  `TZ=UTC`, `PYTHONHASHSEED=0`, and no network. No output depends on the CPU count, a clock, a random value without a
  seed, a map order, a thread order, a process id, or a temporary path.
- **Honesty.** A model, a static check, or an illustration is never described as the real thing (rule TC1). A
  simulation proves its model, not the world, and the lesson says so.
- **Accuracy.** Tool and store versions in the lessons match the catalog pins; where a lesson prints a version-specific
  message, it comes from the recorded run. Claims about named systems carry a source and a date in References.
- **Performance.** No new client JavaScript. The projected longest CI shard stays at or below 75 percent of the
  applicable timeout.
- **Accessibility.** Lessons keep one `h1`, ordered headings, alt text on any image, and the diagram accessibility title
  and description (`accTitle`, `accDescr`) already required for Mermaid.
- **Language.** All text is English; nothing under `content/id/**` changes.
- **No weakened checks.** No loosened, skipped, retried, or quarantined check, and no lowered target recorded as done.

## Acceptance Criteria (Gherkin)

How each scenario is bound to tests is in [tech-docs/007](./tech-docs/007-testing-strategy.md#scenario-to-test-map).

### Audited Course Completion: The Ninth Scenario

Plan 11 creates `backend/content/audited-course-completion.feature` with eight scenarios (the first seven check the
mechanical floors of every registered course; the eighth requires its own 32 slugs). This plan registers 34 more
courses against those seven scenarios without changing them, and adds one scenario, in the same file, after the eighth.
Phase 0 copies the merged wording of the scenarios and step names, and the text below follows them.

```gherkin
  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / The registry lists every course audited by plan 12
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / The registry lists every course audited by plan 12
  @integration-exempt @e2e-exempt
  Scenario: The registry lists every course audited by plan 12
    Given the 34 course slugs audited by plan 12
    And the list of courses the user deferred in writing
    When the audited-course registry is read
    Then every slug that is not deferred is registered with its format
    And the format of each slug is the one planned: by-example for 28 courses, annotated-concept for 5, and capstone for 1
    And no slug is registered twice
    And no deferred slug is registered
```

Phase 7 adds the scenario, Gherkin first, because it cannot be green until the last course is registered. The deferred
list is empty unless the user decides in writing to ship the PR without a BLOCKED course.

### Conditional: CLI Selection Scenarios

These scenarios are written and bound only if Phase 1 builds the response ladder's rung 2t or rung 2d
([tech-docs/004](./tech-docs/004-toolchain-additions-and-ci-budget.md#the-response-ladder)). They go into plan 05's CLI
selection feature as merged (Phase 1 finds its name and the step file), with the exemptions that feature already uses,
and are bound by Go tests in `apps/ayokoding-cli`, written first (RED). Rungs 2b and 2c reuse plan 11's scenarios if
they merged there; otherwise this plan writes them from plan 11's text.

```gherkin
  Scenario: A toolchain change selects only the courses that declare it
    Given ten opted-in courses, two of which declare the "valkey" service in a run specification
    When the only changed paths are under "apps/ayokoding-cli/toolchains/valkey"
    Then the selection holds exactly the two courses that declare "valkey"
    And the selection is not full mode

  Scenario: A change to a shared toolchain file selects every opted-in course
    Given ten opted-in courses
    When the changed paths include the toolchain catalog schema
    Then the selection holds all ten courses
    And the selection is full mode

  Scenario: The units of one heavy course are divided across shards
    Given an examples selection of one course with 99 units and eight other courses
    When the shard list is computed with 8 shards
    Then the heavy course appears in at least 2 shards
    And every unit of the heavy course runs in exactly one shard
    And the course-level checks of the heavy course run in exactly one shard
```

### Rules Proved Both Ways

Rules AU1 and AU2 are gated by the harness and the CLI's fixture units; AU3 is judged by the Content Quality Gate. Their
break-and-restore proofs are in
[tech-docs/010](./tech-docs/010-rule-and-docs-impact.md#enforcement-proof-both-ways). Rules TC1 and TC2 are plan 11's
and are applied; the filler rules FILL1 and FILL2 are plan 09's and are not restated.

## UI Design Funnel

**Not required.** This plan changes course content (Markdown and code files), adds registry rows and one scenario to
an existing test, adds catalog entries to the code harness, and, only if a ladder rung triggers, changes how the CI
check selects and divides courses. It adds or changes no component, page, route, style, or copy outside the 34
courses' own pages, which render through the existing content pipeline. Plans 01 and 04 own navigation, display, and
the learning experience.

The rendered pages are still checked: [Phase 9](./delivery.md#phase-9-manual-verification) opens one course per
category, the capstone, and the Windows course on the dev server (port 3101) at 375 and 1280 px, checks the catalog,
the wire data, and the Indonesian pages, and runs the UI Web Quality Gate on three rendered course pages. The tester
triad is not run, because no interactive surface changes.

## Copy Changes

None. The courses' own text is the deliverable; no label, button, banner, or error message elsewhere in the app
changes.
