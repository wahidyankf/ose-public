# Product Requirements — Capstone Courses

## Personas

| Persona                     | Who they are                                                                                                                                                | What they need from this plan                                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mira, bootcamp graduate** | Finished a bootcamp six months ago. She has taken several AyoKoding courses and wants to prove, with something that runs, that she can join ideas together. | A capstone with a clear brief, milestones she can check one by one, acceptance criteria that name the proof, and a rubric to mark her own work. |
| **Arjun, AI Engineer path** | A developer who already codes and follows the AI Engineer path to build agents.                                                                             | A short core that ends in a project he can finish, a clear "before you start" list, and optional extensions he can take later.                  |
| **Content maintainer**      | A later plan (09 to 13) or a person editing a course after merge.                                                                                           | Rules that stop a capstone from silently becoming thin again, and a `relies-on` table that says what a rewrite of a prerequisite must keep.     |
| **PR reviewer**             | The person who reviews this large PR.                                                                                                                       | One commit per course, the gate reports, and an evidence summary so each course can be checked on its own.                                      |

## User Stories

- **US1.** As Mira, I want each capstone to be a finished course with lessons, a project, and exercises,
  so that I am not left with an empty page after the course title.
- **US2.** As Mira, I want a project brief, milestones, acceptance criteria that each name the run that
  proves them, and a rubric, so that I can tell whether my work is done and how good it is.
- **US3.** As Mira, I want every example to show code and its real output, and the finished project to
  run green, so that I can trust the code and compare mine with a working version.
- **US4.** As Mira, I want drilling with recall questions, applied problems, code katas, a self-check,
  and why-questions, so that I can test what I learned.
- **US5.** As Mira, I want the security capstones to say plainly what they will not teach and to use only
  a safe, local practice lab, so that I learn defence and auditable testing without touching real systems.
- **US6.** As Arjun, I want the AI Engineer path to end in the coding-agent capstone with a core that
  contains exactly what that project needs, so that I know what to take first and what is optional.
- **US7.** As Arjun, I want the path page to list the four courses it assumes and group the extras into
  named phases, so that I can skip what I know and come back for depth.
- **US8.** As a content maintainer, I want tests that fail when a capstone loses its project contract,
  falls under its word floor, links into a prerequisite's lessons, or adds a network call to a security
  course, so that the courses stay complete after this plan.
- **US9.** As a content maintainer, I want every career path to declare a goal, so that no career core is
  a hand-curated list that nothing checks.

## Functional Requirements

| Id   | Requirement                                                                                                                                                                                                                                                                                                                 | Story    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR1  | Each of the 8 capstones is rewritten in its assigned mode (7 Annotated Concept standard, 1 no-code) and meets that mode's targets and the ten checks in [tech-docs/002](./tech-docs/002-capstone-course-contract-and-modes.md).                                                                                             | US1      |
| FR2  | Each capstone's `learning/capstone/overview.md` has the six contract headings in order, acceptance criteria that each name a proof run (or, for the no-code course, a checkable property of a document), and a rubric with at least six criteria.                                                                           | US2      |
| FR3  | Every example, kata, and capstone of the 7 code courses is a harness unit with a deterministic `run.yaml`; each course's reference solution passes every stage run and its `tests` run; the lesson's code block and the recorded output match the unit's files.                                                             | US3      |
| FR4  | Every capstone has a drilling page with Recall Q&A, Applied problems, Code katas, Self-check checklist, and Elaborative interrogation & self-explanation at the floors in tech-docs/002.                                                                                                                                    | US4      |
| FR5  | The three security-flavoured capstones have a `## Safety boundary` section, run only in-process against fixtures, use only documentation-range addresses, and pass the deterministic scan in [tech-docs/004](./tech-docs/004-code-harness-and-determinism-design.md#safety-checks-for-security-courses).                    | US5      |
| FR6  | Each capstone's frontmatter has no `status: outline`, has `format: capstone`, `category`, `description`, and an `estimatedHours` equal to plan 03's drift-test value, and `prerequisites` equal to the target lists in [tech-docs/003](./tech-docs/003-prerequisites-readiness-and-ordering.md#prerequisite-rubric-re-run). | US1, US6 |
| FR7  | A capstone links to a prerequisite only by course URL, restates the concepts it uses, imports nothing from a prerequisite, and keeps a `relies-on` table with a row per prerequisite (rules CL1 to CL4).                                                                                                                    | US8      |
| FR8  | `careers/immediately-effective/ai-engineer` declares the goal `capstone-build-your-own-coding-agent`, a core of 12 courses that equals the goal's closure and ends in the goal, 4 assumed courses, and 5 named extension phases with 16 courses; plan 02's integrity rules pass.                                            | US6, US7 |
| FR9  | The AI path page description and body are the text in [the AI manifest specification](./syllabus/paths/manifest-careers-immediately-effective-ai-engineer.md#page-copy); they contain no word the path-copy test bans.                                                                                                      | US6, US7 |
| FR10 | Every career manifest declares at least one goal.                                                                                                                                                                                                                                                                           | US9      |
| FR11 | A content-shape test over the real content enforces FR1 word floors, FR2, the checkable parts of FR4, FR5, FR7, and the shared-copy and cross-course-figure checks, and a new career-goals test enforces FR8 and FR10.                                                                                                      | US8, US9 |
| FR12 | The "Start falls back to the first learning page" scenario and every scenario that opens a real outline course are exempt at the browser layer with Unit proof over fixtures, and no browser step depends on a course that no longer has that shape or status.                                                              | US8      |
| FR13 | The capstone rules (mode declaration, project contract, coupling, safety, unit limits) have a durable home that the gates read.                                                                                                                                                                                             | US8      |

## Non-Functional Requirements

- **Determinism.** Every unit gives the same output on two runs, the second with half the CPU (plan 05's
  rule), with `TZ=UTC`, `PYTHONHASHSEED=0`, no network, and fixed seeds; concurrency examples use the
  deterministic simulation convention.
- **Safety.** No course contains operational attack material: no real targets, no live exploit code, no
  working payload lists. A safety finding is CRITICAL.
- **Accuracy.** Every external claim has a source and an access date in the course's `## References`
  section; every standard named is the one in force on that date.
- **Accessibility.** No new interactive control is added. Tables on capstone pages fit at 375 px by
  scrolling inside the table, not the page; headings keep their hierarchy.
- **Performance.** No new client JavaScript. CI time for the new units stays inside the budget in
  tech-docs/004.
- **Language.** All new course text is English; nothing under `content/id/**` changes.
- **Reading level.** The audience is a junior bootcamp graduate: plain words, terms defined at first use,
  no unexplained acronyms.

## Acceptance Criteria (Gherkin)

How each scenario is bound to tests is in
[tech-docs/006](./tech-docs/006-e2e-rebinding-and-testing-strategy.md#layer-summary-and-scenario-to-test-map).

### New: `backend/content/capstone-course-completion.feature`

```gherkin
Feature: Capstone courses are complete

  As a learner who has finished the courses a capstone builds on
  I want every capstone to be a finished project course
  So that I can prove, with something running, that I can join the ideas together

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / No capstone course is an outline
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / No capstone course is an outline
  @e2e-exempt
  Scenario: No capstone course is an outline
    Given every course whose identifier starts with capstone-
    When each course's frontmatter is read
    Then no course carries the outline status
    And every course declares the format capstone

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every rewritten capstone reaches its word floor
  @integration-exempt
  # Exemption(e2e): course size is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every rewritten capstone reaches its word floor
  @e2e-exempt
  Scenario: Every rewritten capstone reaches its word floor
    Given the eight capstone courses rewritten from outlines
    When the words on each course's pages are counted
    Then each of the seven code capstones has at least 23000 words
    And the no-code capstone has at least 18000 words

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every rewritten capstone states its project contract
  @integration-exempt
  # Exemption(e2e): the project contract is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every rewritten capstone states its project contract
  @e2e-exempt
  Scenario: Every rewritten capstone states its project contract
    Given the eight capstone courses rewritten from outlines
    When each course's capstone page and learning overview are read
    Then the capstone page has the headings Project brief, Milestones, Acceptance criteria, Rubric, Evidence to keep, and Extensions in that order
    And every acceptance criterion names the run or document that proves it
    And the rubric has at least six criteria
    And the first sentence of How this course is organized states the course mode
    And the learning overview has a table of what the course relies on

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every rewritten capstone has the full drilling page
  @integration-exempt
  # Exemption(e2e): the drilling page is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every rewritten capstone has the full drilling page
  @e2e-exempt
  Scenario: Every rewritten capstone has the full drilling page
    Given the eight capstone courses rewritten from outlines
    When each course's drilling overview is read
    Then it has the sections Recall Q&A, Applied problems, Code katas, Self-check checklist, and Elaborative interrogation & self-explanation
    And its drilling overview has at least 5000 words
    And each of the seven code capstones has at least five kata folders

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every code capstone is a harness course
  @integration-exempt
  # Exemption(e2e): harness opt-in is a property of committed files, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every code capstone is a harness course
  @e2e-exempt
  Scenario: Every code capstone is a harness course
    Given the seven code capstones and the no-code capstone
    When each course folder is searched for run specifications
    Then each code capstone has a run.yaml under learning/code, under drilling/code, and under learning/capstone/code
    And the no-code capstone has no code folder and no run.yaml

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Capstone pages link prerequisites at course level only
  @integration-exempt
  # Exemption(e2e): link form is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Capstone pages link prerequisites at course level only
  @e2e-exempt
  Scenario: Capstone pages link prerequisites at course level only
    Given the eight capstone courses rewritten from outlines
    When every link from their pages to a course is collected
    Then every link ends at a course address with no lesson page or heading
    And every linked course is one of that capstone's own prerequisites
    And every prerequisite has a row in the relies-on table

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Security-flavoured capstones state their boundary and use no network or shell API
  @integration-exempt
  # Exemption(e2e): the safety boundary is a property of committed content and code, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Security-flavoured capstones state their boundary and use no network or shell API
  @e2e-exempt
  Scenario: Security-flavoured capstones state their boundary and use no network or shell API
    Given the secure service, pentest engine, and real-world delivery capstones
    When each course's overview and code files are read
    Then each course overview has a Safety boundary section
    And no code or expected file uses a network, name-resolution, or shell API
    And every IPv4 address is a documentation range, the loopback address, or a private range used as data

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / The lead capstone repeats the concurrency capstone's figures exactly
  @integration-exempt
  # Exemption(e2e): figure agreement is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / The lead capstone repeats the concurrency capstone's figures exactly
  @e2e-exempt
  Scenario: The lead capstone repeats the concurrency capstone's figures exactly
    Given the expected-output files of the error budget, burn-rate table, and simulated outage examples in the concurrency and systems capstone
    When the lead capstone is searched for each figure it quotes
    Then every quoted figure appears in the source file
    And the lead capstone quotes the 43.2 minute budget and the 14.4, 6, and 1 burn rates exactly

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Shared copies are byte-identical
  @integration-exempt
  # Exemption(e2e): file identity is a property of committed files, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Shared copies are byte-identical
  @e2e-exempt
  Scenario: Shared copies are byte-identical
    Given the vectors file in the showdown capstone unit and in its Elixir example unit
    And the manifests and infrastructure files in the delivery capstone unit and in its validator example units
    When each pair of copies is compared byte for byte
    Then every pair is identical
```

### New: `frontend/course-paths/career-path-goals.feature`

```gherkin
Feature: Career paths end in a goal

  As a learner choosing a career path
  I want every career path to name the course I will have built when I finish it
  So that the path is a route to something, not a reading list

  # Exemption(integration): the scenario reads committed manifest files and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every career path declares at least one goal
  @integration-exempt
  # Exemption(e2e): the browser-test server deliberately replaces production manifests with isolated route fixtures, so the published manifests are unavailable through that public test boundary; alternative-proof: ayokoding-www:test:unit / Every career path declares at least one goal
  @e2e-exempt
  Scenario: Every career path declares at least one goal
    Given the published career manifests
    When their goals are read
    Then each manifest declares at least one goal course
    And each goal course is in that manifest's core

  # Exemption(integration): the scenario reads committed manifest files and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / The AI Engineer path ends in the coding agent capstone
  @integration-exempt
  # Exemption(e2e): the browser-test server deliberately replaces production manifests with isolated route fixtures, so the published AI manifest is unavailable through that public test boundary; alternative-proof: ayokoding-www:test:unit / The AI Engineer path ends in the coding agent capstone
  @e2e-exempt
  Scenario: The AI Engineer path ends in the coding agent capstone
    Given the published manifest for "careers/immediately-effective/ai-engineer"
    When its core is read
    Then its goal is capstone-build-your-own-coding-agent
    And its core has 12 courses and the goal is the last core course
    And it assumes api-design, backend-essentials, just-enough-bash, and sql-essentials
    And its core equals the goal's prerequisite closure
```

### Modified: `frontend/course-paths/course-landing-header.feature` (plan 03's file)

The scenario text and its Unit binding do not change. Its E2E binding goes away, and the two exemption
comments are written to match the merged file (the text is in
[tech-docs/006](./tech-docs/006-e2e-rebinding-and-testing-strategy.md#modified-feature-course-landing-headerfeature-plan-03)):

```gherkin
  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Start falls back to the first learning page
  @integration-exempt
  # Exemption(e2e): the browser-test server serves the published course tree, in which no course has a learning folder without an overview page once every capstone has one, and it substitutes manifests only, so the shape cannot be supplied at that boundary; alternative-proof: ayokoding-www:test:unit / Start falls back to the first learning page
  @e2e-exempt
  Scenario: Start falls back to the first learning page
```

### Modified: scenarios that open a real outline course (plans 02 to 04)

Phase 0 finds each scenario that uses a real outline course as its example (expected: the Outline badge
on path pages, the catalog card, the course header, and the roadmap card). For each, the scenario text
does not change; the browser or integration step that opens a real outline course is removed, and an
exemption pair is added with the reason "the browser-test server serves the published course tree, in
which no course carries the outline status by series decision 40, and it substitutes manifests only, so
an outline course cannot be supplied at that boundary; alternative-proof: ayokoding-www:test:unit /
`<scenario title>`". Unit already proves each scenario with a fixture course; Phase 0 adds that proof
first where it is missing.

## UI Design Funnel

**Not required.** This plan adds no screen, component, route, or interaction. It changes course content
(Markdown), one path manifest (data), and the copy of one existing path page. The path page already
renders any manifest through plan 02's phase sections and plan 04's roadmap, so a shorter core with
five extension phases needs no code. Every layout, state, and responsive rule on the page is unchanged
and is checked by the manual browser checks in [tech-docs/006](./tech-docs/006-e2e-rebinding-and-testing-strategy.md#manual-checks).

## Copy Changes

| Place                                   | Before                                                                              | After                                                                                                                                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AI path description (page and manifest) | "For developers who already code: build, evaluate, deploy, and operate AI systems." | "For developers who already code: build an AI coding agent, then go deeper on evaluation, serving, and operations."                                                                                                                                                      |
| AI path page body                       | Plan 02's body, as merged (Phase 0 reads it)                                        | The three paragraphs in [the AI manifest specification](./syllabus/paths/manifest-careers-immediately-effective-ai-engineer.md#page-copy): who the path is for and the "Before you start" list, the short core ending in the agent capstone, and the optional extensions |
| AI path phases                          | Six core phases and one extension phase, no outcomes for the capstone               | Four core phases with outcomes ("After this phase you can … / You cannot yet …") and five named extension phases                                                                                                                                                         |
| Capstone course descriptions            | Plan 03's one-line drafts                                                           | Unchanged unless a written course no longer fits its description; each change is recorded in the ledger with its reason                                                                                                                                                  |
