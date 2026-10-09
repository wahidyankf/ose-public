# Product Requirements — Audit of Language and Tooling Courses

## Personas

| Persona                      | Who they are                                                                                                                | What they need from this plan                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Rani, language learner**   | A developer who follows a software-engineer path and opens `just-enough-rust` after `just-enough-python`.                   | A finished primer: every example shown with the exact code and output of a program that ran, then drilling to test herself.           |
| **Budi, tools practitioner** | An engineer who studies `cicd-and-release-engineering` or `containers-and-orchestration` to run a real pipeline or cluster. | Honest examples: what really ran, what is a model, and what is only validated, each said plainly beside the code.                     |
| **Content maintainer**       | A person who edits a course after merge, or an author of plans 12 and 13.                                                   | A test that fails when a finished course loses its shape, a harness that fails when an example stops running, and one written method. |
| **PR reviewer**              | The person who reviews this very large PR.                                                                                  | One commit per course, a gate record for each, and a committed execution summary.                                                     |

## User Stories

- **US1.** As Rani, I want every course I meet on my path to be complete, so that no step is a thin list of
  headings.
- **US2.** As Rani, I want each example to show real code and its real output, so that I can run it and get the
  same result.
- **US3.** As Rani, I want a drilling page with recall questions, applied problems, code katas, a self-check, and
  self-explanation prompts, so that I can test what I learned.
- **US4.** As Budi, I want a lesson to say when an example models a tool or only validates a configuration, so
  that I never mistake it for a real run.
- **US5.** As Budi, I want the infrastructure examples to be checked as far as a sandbox allows, so that the
  configuration I copy is at least well formed.
- **US6.** As a content maintainer, I want a test that lists the audited courses and fails when one drops under its
  floors, so that the courses stay finished.
- **US7.** As a content maintainer, I want the filler guard to pass for every course, with the baseline entries of
  this plan removed, so that templated courses cannot return.
- **US8.** As a reader who follows the AI Engineer path, I want its core to stay the same unless the user chose
  otherwise, so that the path does not change under me.
- **US9.** As the PR reviewer, I want one commit per course and a record of the gates, so that I can review a
  course on its own.

## Functional Requirements

| Id   | Requirement                                                                                                                                                                                                                                         | Story    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR1  | Each of the 32 courses meets the floors of its mode in [tech-docs/002](./tech-docs/002-definition-of-done-and-targets.md#targets-by-mode): words, example count and numbering, diagrams, "Why It Matters" length, and annotation density.           | US1      |
| FR2  | Every example, kata, and capstone with code is a harness unit with a deterministic `run.yaml`; its lesson shows the unit's code and its recorded output from the files.                                                                             | US2      |
| FR3  | Every course has a drilling page of at least 5,000 words with the five exact sections, and the kata units of its mode (at least 8 for By Example and Primer, at least 5 for Annotated Concept and the capstone; five design exercises for no-code). | US3      |
| FR4  | Every example that models a tool, validates configuration without applying it, or shows an illustration says so in one plain sentence beside its fence (rule TC1), and the illustration count stays within the course's budget.                     | US4, US5 |
| FR5  | `static` units use only reasons plan 05 allows; `opentofu` units use `cloud`, `kubeconform` units use `cluster`, and `swift-parse` uses `ios`.                                                                                                      | US5      |
| FR6  | Anchored lesson fences equal their files; every `Output` block is anchored to an expected file; `examples sync` exits 0 for each course.                                                                                                            | US2      |
| FR7  | `ayokoding-cli examples check --course <slug>` exits 0 for every course with code, and `examples coverage` reports `covered: true` for 31 courses and "not applicable" for the no-code course.                                                      | US2      |
| FR8  | Each course passes its mode quality gate and the Content Quality Gate (`PASS` or `PASS_WITH_FINDINGS`, no open `needs-decision` row) within 2 cycles each, or is recorded BLOCKED and reported.                                                     | US1, US9 |
| FR9  | The five courses tagged `plan-11` leave `FILLER_BASELINE` in the same commit that fixes them, the cap falls by five, and the filler guard passes for all 32 courses.                                                                                | US7      |
| FR10 | A new content-shape test with a registry of audited courses enforces FR1, FR3, and the code-unit rule of FR2 for every registered course, and the registry holds all 32 courses at the end.                                                         | US6      |
| FR11 | Every course's `estimatedHours` equals the drift test's value after its last edit; `prerequisites` follow plan 02's rubric; the integrity tests stay green; the AI Engineer core is unchanged unless the user chose otherwise.                      | US8      |
| FR12 | The CI examples check passes on every checkpoint push and on the final head within the timeout that applies, using only the ladder rungs of [tech-docs/004](./tech-docs/004-toolchain-additions-and-ci-cost.md#the-response-ladder).                | US9      |
| FR13 | Each finished course is one commit, `fix(ayokoding-www): audit <slug> course`, and the execution summary lists every course with its status, cycles, verdicts, and harness result.                                                                  | US9      |

## Non-Functional Requirements

- **Determinism.** Every unit gives the same output on two runs, the second with half the CPU (plan 05's rule),
  with `TZ=UTC`, `PYTHONHASHSEED=0`, and no network. No output depends on the CPU count, a clock, a random value
  without a seed, a map order, or a temporary path.
- **Honesty.** A model, a static check, or an illustration is never described as the real tool (rule TC1).
- **Accuracy.** Tool versions in the lessons match the catalog pins; where a lesson prints a version-specific
  message, it comes from the recorded run.
- **Performance.** No new client JavaScript. The projected longest CI shard stays at or below 75 percent of the
  applicable timeout.
- **Accessibility.** Lessons keep one `h1`, ordered headings, alt text on any image, and the diagram
  accessibility title and description (`accTitle`, `accDescr`) already required for Mermaid.
- **Language.** All text is English; nothing under `content/id/**` changes.
- **No weakened checks.** No loosened, skipped, retried, or quarantined check, and no lowered target recorded as
  done.

## Acceptance Criteria (Gherkin)

How each scenario is bound to tests is in
[tech-docs/007](./tech-docs/007-testing-strategy.md#scenario-to-test-map).

### New: `backend/content/audited-course-completion.feature`

```gherkin
Feature: Audited courses stay complete

  As a software engineer following a learning path
  I want every audited course to be a finished course
  So that no step of my path is thin or untested

  # Exemption(integration): the scenarios read committed course files only and have no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / each scenario below
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / each scenario below
  @integration-exempt @e2e-exempt
  Scenario: No audited course is an outline and each declares its mode
    Given the audited-course registry
    When each registered course's frontmatter is read
    Then no course carries the outline status
    And every course declares the format listed for it in the registry
    And the format is by-example, primer, annotated-concept, annotated-concept-no-code, or capstone

  @integration-exempt @e2e-exempt
  Scenario Outline: Every audited course reaches the word floor of its mode
    Given the audited-course registry
    When the words on the pages of each "<format>" course are counted
    Then every such course has at least <words> words

    Examples:
      | format                    | words |
      | by-example                | 28000 |
      | primer                    | 28000 |
      | annotated-concept         | 22000 |
      | annotated-concept-no-code | 18000 |
      | capstone                  | 23000 |

  @integration-exempt @e2e-exempt
  Scenario Outline: Every audited course has the example count and numbering of its mode
    Given the audited-course registry
    When the example headings of each "<format>" course are read in page order
    Then every such course has at least <examples> headings of the form "<heading>"
    And the numbers run from 1 to the last number without a gap

    Examples:
      | format                    | examples | heading                      |
      | by-example                | 75       | ### Example N: Title          |
      | primer                    | 75       | ### Example N: Title          |
      | annotated-concept         | 45       | ### Worked Example N: Title   |
      | annotated-concept-no-code | 20       | ### Worked Scenario N: Title  |
      | capstone                  | 45       | ### Worked Example N: Title   |

  @integration-exempt @e2e-exempt
  Scenario: Every audited course has the diagrams of its mode
    Given the audited-course registry
    When the Mermaid diagrams of each registered course are counted
    Then every by-example course has between 30 and 50 diagrams
    And every annotated-concept, annotated-concept-no-code, and capstone course has at least 10 diagrams

  @integration-exempt @e2e-exempt
  Scenario: Every example has a Why It Matters block of 50 to 100 words
    Given the audited-course registry
    When the Why It Matters block under each example is read
    Then every example of a registered course has one
    And its length is between 50 and 100 words

  @integration-exempt @e2e-exempt
  Scenario: Every audited course has the full drilling page
    Given the audited-course registry
    When each registered course's drilling overview is read
    Then it has the sections Recall Q&A, Applied problems, Code katas, Self-check checklist, and Elaborative interrogation & self-explanation in that order
    And its drilling pages have at least 5000 words

  @integration-exempt @e2e-exempt
  Scenario: Every audited course keeps its code in units with a run specification
    Given the audited-course registry
    When each registered course folder is searched for code units
    Then every example folder under learning/code, every kata folder under drilling/code, and the capstone folder have a run.yaml
    And every course except the no-code course has at least one run.yaml under learning/code

  @integration-exempt @e2e-exempt
  Scenario: The registry lists every course of this plan
    Given the 32 course slugs audited by this plan
    And the list of courses the user deferred in writing
    When the audited-course registry is read
    Then every slug that is not deferred is registered with its format
    And no slug is registered twice
    And no deferred slug is registered
```

Phase 1 creates the first seven scenarios, which pass on an empty registry. Phase 7 adds the eighth, Gherkin first,
because it cannot be green until the last course is registered. The deferred list is empty unless the user
decides in writing to ship the PR without a BLOCKED course.

### Conditional: modified CLI selection scenarios

These scenarios are written and bound only if Phase 1 finds that the response ladder's rung 2b or 2c is needed
([tech-docs/004](./tech-docs/004-toolchain-additions-and-ci-cost.md#the-response-ladder)). They go into plan 05's
CLI selection feature as merged (Phase 1 finds its name and the step file), with the exemptions that feature
already uses, and are bound by Go tests in `apps/ayokoding-cli` or workflow-plan tests, written first (RED).

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
```

### Rules proved both ways

Rule TC2 is gated by the new feature, and its break-and-restore proofs are in
[tech-docs/010](./tech-docs/010-rule-and-docs-impact.md#enforcement-proof-both-ways). Rule TC1 is judged by the
Content Quality Gate. The filler rules FILL1 and FILL2 are plan 09's and are not restated.

## UI Design Funnel

**Not required.** This plan changes course content (Markdown and code files), adds one test and one test-support
file, and, only if a ladder rung triggers, changes a shard count or a timeout. It adds or changes no component,
page, route, style, or copy outside the 32 courses' own pages, which render through the existing content
pipeline. Plans 01 and 04 own navigation, display, and the learning experience.

The rendered pages are still checked: [Phase 9](./delivery.md#phase-9-manual-verification) opens one course per
family on the dev server (port 3101) at 375 and 1280 px, checks the catalog, the wire data, and the Indonesian
pages, and runs the UI Web Quality Gate on three rendered course pages. The tester triad is not run, because
no interactive surface changes.

## Copy Changes

None. The courses' own text is the deliverable; no label, button, banner, or error message elsewhere in the app
changes.
