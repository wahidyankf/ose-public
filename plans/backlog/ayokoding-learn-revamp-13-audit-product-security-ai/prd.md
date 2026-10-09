# Product Requirements — Audit of Product, Security, and AI Courses

## Personas

| Persona                                | Who they are                                                                                                                             | What they need from this plan                                                                                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sari, AI engineer in training**      | A developer on the AI Engineer path who opens `the-agent-loop`, then `agent-tools-and-mcp`, then `agent-permissions-and-sandboxing`.     | Examples she can run with no account and no key, that print the same thing every time; facts about products and models that carry a date and a source, so she knows what may have changed.     |
| **Andi, security learner**             | A developer who works through `security-essentials` and `offensive-security` to understand attacks in order to defend against them.      | Labs that run on his own machine against nothing real, a clear statement of the boundary, and detail that teaches the mechanism and not a working weapon.                                      |
| **Maya, interview candidate**          | A software engineer who follows the interview path through `coding-interview`, `system-design-interview`, and `capstone-interview-loop`. | Finished courses: coding drills whose solutions run, and design and behavioural courses that are honest about having no code.                                                                  |
| **Budi, mobile and desktop developer** | An engineer who studies `android-app-development`, `ios-app-development`, or `windows-app-development`.                                  | A plain sentence beside each file that says what was checked (parsed or validated, not built or run), and logic that really runs.                                                              |
| **Content maintainer**                 | A person who edits a course after merge, or the author of plan 14.                                                                       | A test that fails when a finished course loses its shape, a harness that fails when an example stops running, guards that keep AI and security examples within bounds, and one written method. |
| **Security reviewer**                  | A person who must be able to say that no course teaches aiming at a real system and that CI touches none.                                | A tested scan, a stated boundary in each course, and no cycle cap that can waive a safety finding.                                                                                             |
| **PR reviewer**                        | The person who reviews this very large PR.                                                                                               | One commit per course, a gate record for each, and a committed execution summary.                                                                                                              |

## User Stories

- **US1.** As Sari, I want every course I meet on my path to be complete, so that no step is a thin list of headings.
- **US2.** As Sari, I want each example to show real code and its real output, so that I can run it and get the same
  result.
- **US3.** As Sari, I want AI examples to run on a scripted model with stored responses, so that I need no key and no
  network, and the output never changes.
- **US4.** As Sari, I want every claim about a product, model, protocol, price, or limit to carry an "as of" date and a
  source, so that I can tell what may have changed.
- **US5.** As Andi, I want security examples to run in process on synthetic data behind a stated boundary, so that I can
  try them safely and never aim them at a real system.
- **US6.** As Budi, I want a lesson to say when a file is only parsed or validated, so that I never mistake a static
  check for a build or a run.
- **US7.** As Maya, I want coding-interview drills with solutions that run, and no-code courses that say they are
  no-code, so that I know what each course gives me.
- **US8.** As a reader of any course, I want a drilling page with recall questions, applied problems, code katas (or
  design exercises), a self-check, and self-explanation prompts, so that I can test what I learned.
- **US9.** As a content maintainer, I want a test that lists the audited courses and fails when one drops under its
  floors, so that the courses stay finished.
- **US10.** As a content maintainer, I want the filler guard to pass for every course and its baseline to end empty, so
  that templated courses cannot return.
- **US11.** As a security reviewer, I want a test that fails when a security course gains a socket, a shell call, or a
  real address, and when an AI course gains a hosted-model call, so that a later edit cannot undo the plan.
- **US12.** As a reader of a capstone that names these courses, I want its "what this course relies on" table to match
  what the courses teach, so that the capstone does not promise a lesson that is gone.
- **US13.** As a reader who follows the AI Engineer path, I want its core to stay the same unless the user chose
  otherwise, so that the path does not change under me.
- **US14.** As the PR reviewer, I want one commit per course and a record of the gates, so that I can review a course on
  its own.

## Functional Requirements

| Id   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                  | Story     |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FR1  | Each of the 45 courses meets the floors of its mode in [tech-docs/002](./tech-docs/002-definition-of-done-and-targets.md#targets-by-mode): words, example count and numbering, diagrams, "Why It Matters" length, and annotation density.                                                                                                                                                                                                    | US1       |
| FR2  | Every example, kata, and capstone with code is a harness unit with a deterministic `run.yaml`; its lesson shows the unit's code and its recorded output from the files.                                                                                                                                                                                                                                                                      | US2       |
| FR3  | Every course has a drilling page of at least 5,000 words with the five exact sections, and the kata units of its mode (at least 8 for By Example, at least 5 for Annotated Concept and the capstones; five design exercises for no-code).                                                                                                                                                                                                    | US8       |
| FR4  | The code of the 13 AI courses with code runs on a scripted model and stored responses: it imports no hosted-model SDK, calls no model-download function, reads no credential variable, and opens no network module (rule AF1).                                                                                                                                                                                                               | US3       |
| FR5  | Every changeable fact in an AI course (product, model, protocol revision, price, limit, law) has an "as of" date and a Reference with an access date within 30 days of the commit that adds it, or is rewritten as a pattern (rule AF2). A freshness pass at the end re-verifies any course whose oldest access date is over 60 days old.                                                                                                    | US4       |
| FR6  | The six safety-scanned courses keep attacks, probes, detections, and sandboxes in process on synthetic data. Each states a `## Safety boundary` section; its code opens no socket, resolves no name, and runs no shell; its pages, code, and expected files use only reserved addresses (rules SF1 and SF2).                                                                                                                                 | US5, US11 |
| FR7  | The three mobile and desktop courses split by import: code that imports no platform framework runs for real, and the rest is `mode: static` under the closed reasons `android`, `ios`, and `windows`, with a sentence beside each static fence that says what the run proves.                                                                                                                                                                | US6       |
| FR8  | Every example that models a tool, validates configuration without applying it, uses a scripted model, or shows an illustration says so in one plain sentence beside its fence (rule TC1), and the illustration count stays within the course's budget.                                                                                                                                                                                       | US3, US6  |
| FR9  | Anchored lesson fences equal their files; every `Output` block is anchored to an expected file; `examples sync` exits 0 for each course.                                                                                                                                                                                                                                                                                                     | US2       |
| FR10 | `ayokoding-cli examples check --course <slug>` exits 0 for every course with code, and `examples coverage` reports `covered: true` for the 37 courses with code and "not applicable" for the 8 courses without, per course and repository-wide at `--min-percent 100`, on the same commit as a green full run.                                                                                                                               | US2, US9  |
| FR11 | Each course passes its mode quality gate and the Content Quality Gate (`PASS` or `PASS_WITH_FINDINGS`, no open `needs-decision` row) within 2 cycles each, or is recorded BLOCKED and reported. A safety finding is never waived by the cap.                                                                                                                                                                                                 | US1, US14 |
| FR12 | The six courses tagged `plan-13` leave `FILLER_BASELINE` in the same commit that fixes them, the cap falls by one each time, and the baseline ends empty with a cap of 0.                                                                                                                                                                                                                                                                    | US10      |
| FR13 | The audited-course completion test enforces FR1, FR3, and the code-unit rule of FR2 for every registered course, and its registry holds all 45 courses at the end (tenth scenario).                                                                                                                                                                                                                                                          | US9       |
| FR14 | A new content-safety test enforces FR4 and FR6 for the courses in its scope, with a tested scanner and a tested exceptions list.                                                                                                                                                                                                                                                                                                             | US11      |
| FR15 | Every course's `estimatedHours` equals the drift test's value after its last edit; `prerequisites` follow plan 02's rubric; the integrity tests stay green; the AI Engineer core is unchanged unless the user chose otherwise; two interview courses change `format` to `annotated-concept-no-code`.                                                                                                                                         | US13      |
| FR16 | `capstone-first-working-software`, `capstone-full-stack-app`, and `capstone-interview-loop` meet plan 08's capstone contract; the first two gain a `learning/` folder and a drilling page; the Start button case that depends on a course without a `learning/` folder is rebound or exempted with a reason; every capstone `## What this course relies on` row that names a course of this plan is re-read and corrected where it is stale. | US12      |
| FR17 | The CI examples check passes on every checkpoint push and on the final head within the timeout that applies, using only the ladder rungs of [tech-docs/004](./tech-docs/004-toolchain-additions-and-ci-cost.md#the-response-ladder).                                                                                                                                                                                                         | US14      |
| FR18 | Each finished course is one commit, `fix(ayokoding-www): audit <slug> course`, and the execution summary lists every course with its status, cycles, verdicts, sources checked, and harness result.                                                                                                                                                                                                                                          | US14      |

## Non-Functional Requirements

- **Determinism.** Every unit gives the same output on two runs, the second with half the CPU (plan 05's rule), with
  `TZ=UTC`, `PYTHONHASHSEED=0`, and no network. No output depends on the CPU count, a clock, a random value without a
  seed, a map order, or a temporary path. Numeric courses set `OMP_NUM_THREADS=1`.
- **Offline.** No unit needs a key, a model download, or a network. The harness runs with networking off, so a stray
  call fails the unit instead of reaching a host.
- **Safety.** No course shows a working exploit, a payload that works against real software, or a credential list. No
  unit takes a real target. Every address is reserved.
- **Honesty.** A model, a static check, a scripted response, or an illustration is never described as the real tool
  (rule TC1).
- **Currency.** Tool versions in the lessons match the catalog pins; where a lesson prints a version-specific message,
  it comes from the recorded run. A changeable AI fact is dated and sourced.
- **Performance.** No new client JavaScript. The projected longest CI shard stays at or below 75 percent of the
  applicable timeout.
- **Accessibility.** Lessons keep one `h1`, ordered headings, alt text on any image, and the diagram accessibility title
  and description (`accTitle`, `accDescr`) already required for Mermaid.
- **Language.** All text is English; nothing under `content/id/**` changes.
- **No weakened checks.** No loosened, skipped, retried, or quarantined check, and no lowered target recorded as done.

## Acceptance Criteria (Gherkin)

How each scenario is bound to tests is in
[tech-docs/007](./tech-docs/007-testing-strategy.md#scenario-to-test-map).

### Audited Course Completion: The Tenth Scenario

Plan 11 creates `backend/content/audited-course-completion.feature` with eight scenarios (the first seven check the
mechanical floors of every registered course; the eighth requires plan 11's own 32 slugs), and plan 12 adds a ninth for
its 34 courses. This plan registers 45 more courses against the first seven scenarios without changing them, and adds
one scenario, in the same file, after the ninth. Phase 0 copies the merged wording of the scenarios and step names, and
the text below follows them.

```gherkin
  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / The registry lists every course audited by plan 13
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / The registry lists every course audited by plan 13
  @integration-exempt @e2e-exempt
  Scenario: The registry lists every course audited by plan 13
    Given the 45 course slugs audited by plan 13
    And the list of courses the user deferred in writing
    When the audited-course registry is read
    Then every slug that is not deferred is registered with its format
    And the format of each slug is the one planned: by-example for 27 courses, annotated-concept for 7, annotated-concept-no-code for 8, and capstone for 3
    And no slug is registered twice
    And no deferred slug is registered
```

Phase 8 adds the scenario, Gherkin first, because it cannot be green until the last course is registered. The deferred
list is empty unless the user decides in writing to ship the PR without a BLOCKED course. The two interview courses whose
`format` is corrected are registered with `annotated-concept-no-code` (decision D3).

### New: `backend/content/course-content-safety.feature`

Phase 1 creates the feature, its step file, and its scanner, with the helper test, before the first course uses them.
Each scenario checks only the courses of its list that are in the registry or in the probe row, so a course enters the
checks exactly when its registry row lands ([tech-docs/007](./tech-docs/007-testing-strategy.md#new-feature-course-content-safety)).

```gherkin
Feature: Course content stays offline and safe

  As a learner who runs the examples of a course
  I want AI examples to run offline on a scripted model and security examples to stay in process
  So that no lesson needs a key, reaches a real system, or teaches me to aim at one

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Safety-scanned courses state their safety boundary
  # Exemption(e2e): the safety boundary is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Safety-scanned courses state their safety boundary
  @integration-exempt @e2e-exempt
  Scenario: Safety-scanned courses state their safety boundary
    Given the six safety-scanned courses that are in the audited-course registry
    When the page that holds each course's safety boundary is read
    Then it has a section headed "Safety boundary"
    And that section has at least 60 words

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Safety-scanned course code opens no socket, resolves no name, or runs no shell
  # Exemption(e2e): the absence of network and shell calls is a property of committed code, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Safety-scanned course code opens no socket, resolves no name, or runs no shell
  @integration-exempt @e2e-exempt
  Scenario: Safety-scanned course code opens no socket, resolves no name, or runs no shell
    Given the six safety-scanned courses that are in the audited-course registry
    When every file under their learning/code, drilling/code, and learning/capstone/code folders is scanned, expected files included
    Then no file uses a socket, name-resolution, network-client, process, or shell API
    And a scanner hit passes only if the exceptions list names its file and pattern and gives a reason

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Safety-scanned course pages and code use only reserved addresses
  # Exemption(e2e): the addresses in course files are a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Safety-scanned course pages and code use only reserved addresses
  @integration-exempt @e2e-exempt
  Scenario: Safety-scanned course pages and code use only reserved addresses
    Given the six safety-scanned courses that are in the audited-course registry
    When every Markdown page and every code or expected file of those courses is scanned for IP address literals
    Then every IPv4 address is in the loopback, private, or RFC 5737 documentation ranges
    And every IPv6 address is in 2001:db8::/32 or is ::1

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / AI course code calls no hosted model and reads no credential
  # Exemption(e2e): offline examples are a property of committed code, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / AI course code calls no hosted model and reads no credential
  @integration-exempt @e2e-exempt
  Scenario: AI course code calls no hosted model and reads no credential
    Given the 13 AI engineering courses with code that are in the audited-course registry
    When every file under their learning/code, drilling/code, and learning/capstone/code folders is scanned
    Then no file imports a hosted-model SDK or a network module
    And no file calls a model-download function
    And no file reads a credential environment variable
```

The scanner and its exceptions list are test-support code with their own helper test
(`course-safety-scan.unit.test.ts`): a tree with a `socket` import, an `openai` import, or a public address makes the
matching scenario fail; a clean tree passes; and every exception names a file that exists, a pattern that still occurs
in it, and a reason of at least 10 characters.

### Conditional: CLI Selection Scenarios

These scenarios are written and bound only for a rung of the response ladder that Phase 1 needs and that plans 11 and 12
did not already merge: rung 2b or 2c (plan 11's) and rung 2t or 2d (plan 12's)
([tech-docs/004](./tech-docs/004-toolchain-additions-and-ci-cost.md#the-response-ladder)). They go into plan 05's CLI
selection feature as merged (Phase 1 finds its name and the step file), with the exemptions that feature already uses,
and are bound by Go tests in `apps/ayokoding-cli` or workflow-plan tests, written first (RED). If a rung is merged,
Phase 0 records it and its tests run as regression tests; Phase 0 also copies the merged wording, and the text below
follows plans 11 and 12.

```gherkin
  Scenario Outline: The shard count follows the number of selected units
    Given an examples selection of <units> units over <courses> courses
    When the shard list is computed
    Then it holds <shards> shards

    Examples:
      | units | courses | shards |
      | 120   | 3       | 1      |
      | 800   | 9       | 4      |
      | 813   | 9       | 8      |

  Scenario: A weighted split gives every course to exactly one shard
    Given an examples selection of 9 courses with very different unit counts
    When the courses are split into 8 shards by unit count, largest course first
    Then every course appears in exactly one shard
    And the heaviest shard holds no more units than the largest-first assignment gives

  Scenario: A toolchain change selects only the courses that declare it
    Given ten opted-in courses, two of which declare the "swift" toolchain in a run specification
    When the only changed paths are under "apps/ayokoding-cli/toolchains/swift"
    Then the selection holds exactly the two courses that declare "swift"
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

### Conditional: `frontend/course-paths/course-landing-header.feature` (plan 03's file)

Only when the last course without a `learning/` folder gains one (the commit of `capstone-first-working-software`, wave 11) and no other such course exists, as Phase 0 records
([tech-docs/005](./tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md#capstones-that-gain-a-learning-folder)).
The scenario text and its Unit binding (fixture trees for all three shapes) do not change. Its E2E binding goes away,
and the exemption comments are written to match the merged file:

```gherkin
  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Start falls back to the course overview
  @integration-exempt
  # Exemption(e2e): no course lacks a learning folder once every capstone has one, and the browser-test server substitutes manifests only, so the shape cannot be supplied at that boundary; alternative-proof: ayokoding-www:test:unit / Start falls back to the course overview
  @e2e-exempt
  Scenario: Start falls back to the course overview
```

If another course without a `learning/` folder remains, the E2E step is rebound to that course instead and the
scenario keeps its binding. Phase 0 confirms the merged Unit binding is fixture-based; if it is not, a fixture-based
proof is added first (RED, then GREEN).

### Rules Proved Both Ways

Rules AF1, SF1, and SF2 are gated by the new feature, and rule TC2 by the tenth scenario; their break-and-restore proofs
are in [tech-docs/010](./tech-docs/010-rule-and-docs-impact.md#enforcement-proof-both-ways). Rule AF2 is judged by the
Content Quality Gate, with one negative run recorded. Rule TC1 is plan 11's and is applied; the filler rules FILL1 and
FILL2 and the reserved-address rule SEC1 are plan 09's and are applied.

## UI Design Funnel

**Not required.** This plan changes course content (Markdown and code files), adds test and test-support files, and, only
if a ladder rung triggers, changes a shard count or a timeout. It adds or changes no component, page, route, style, or
copy outside the 45 courses' own pages, which render through the existing content pipeline. Plans 01 and 04 own
navigation, display, and the learning experience.

The rendered pages are still checked: [Phase 10](./delivery.md#phase-10-manual-verification) opens one course per family,
the static course, and both new-folder capstones on the dev server (port 3101) at 375 and 1280 px, checks the catalog, the
wire data, and the Indonesian pages, and runs the UI Web Quality Gate on three rendered course pages. The tester triad is
not run, because no interactive surface changes.

## Copy Changes

None. The courses' own text is the deliverable; no label, button, banner, or error message elsewhere in the app changes.
