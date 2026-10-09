# Product Requirements — ERP Courses

## Personas

| Persona                          | Who they are                                                                                                                           | What they need from this plan                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Rina, ERP engineer**           | A backend engineer who joined a team that builds an ERP product. She codes well but has never traced a purchase from order to payment. | Courses that teach the business process behind her code, with code she can run, change, and test, in an order that builds up.     |
| **Farid, Islamic-bank engineer** | An engineer at an Islamic institution in Jakarta who must build Sharia-aware ERP features: contract flows, zakat, configurable policy. | To know which standard applies, where AAOIFI, DSN-MUI, and other bodies differ, and which choices only his Sharia board can make. |
| **Content maintainer**           | A later plan (08, 11 to 13) or a person editing a course after merge.                                                                  | Guards that stop an ERP course from silently becoming thin again, and a path model with no leftover exception to remember.        |
| **PR reviewer**                  | The person who reviews this very large PR.                                                                                             | One commit per wave, the gate reports, and an evidence summary so each course can be checked on its own.                          |

## User Stories

- **US1.** As Rina, I want every course in the Conventional ERP path to be a finished course, so that no step of
  the path is an empty outline.
- **US2.** As Rina, I want every example to show code and its real output, so that I can trust the code and
  reuse it.
- **US3.** As Rina, I want drilling with recall questions, applied problems, code katas, and a self-check, so
  that I can test what I learned.
- **US4.** As Farid, I want each Sharia position attributed to its source with a date, and differences shown
  side by side, so that I can see the options instead of one view presented as the only one.
- **US5.** As Farid, I want every point that needs a Sharia board decision marked the same way, so that I can
  list them for my board and never mistake the course for a ruling.
- **US6.** As a reader of either ERP path, I want the path page to show phases with plain outcomes and the
  courses I must already know, so that I know what I can do after each phase and what to learn first.
- **US7.** As a content maintainer, I want a test that fails when an ERP course loses its drilling page, falls
  under its word floor, or adds an unchecked AAOIFI link, so that the courses stay complete after this plan.
- **US8.** As a content maintainer, I want the temporary pending-restructure mechanism gone, so that no code
  still carries a special case for paths that no longer need it.

## Functional Requirements

| Id   | Requirement                                                                                                                                                                                                                                                     | Story       |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR1  | Each of the 30 courses is rewritten in its assigned mode (18 By Example, 12 Annotated-Concept) and meets that mode's targets in [tech-docs/003](./tech-docs/003-definition-of-done-and-targets.md#targets).                                                     | US1         |
| FR2  | Every example with code, every kata, and every capstone stage is a harness unit with a deterministic `run.yaml`; the lesson's code block and the recorded output match the unit's files.                                                                        | US2         |
| FR3  | Every course has a drilling page with Recall Q&A, Applied problems, Code katas, Self-check checklist, and Elaborative interrogation & self-explanation (plus Sharia board decision spotting in a Sharia course), at the floors in tech-docs/003.                | US3, US5    |
| FR4  | The three Sharia ERP courses follow rules SC1 to SC8; each has the disclaimer, at least four board-decision callouts, a differences table, and a spotting section; every AAOIFI link was opened by a person.                                                    | US4, US5    |
| FR5  | Every course's frontmatter has no `status: outline`, has `format`, and has plan 03's `category`, `description`, and an `estimatedHours` equal to the drift test's expected value.                                                                               | US1         |
| FR6  | `skills/conventional-erp` has 5 core phases and `skills/sharia-erp` 6, each with a title and an outcome; neither carries the restructure marker or an extension phase; they assume 12 and 14 outside courses.                                                   | US6         |
| FR7  | The prerequisites of the 30 courses equal the closure derivation in the syllabus path files, and plan 02's rules R1 to R10 report no violation for either manifest.                                                                                             | US6         |
| FR8  | The two ERP path pages state who the path is for and contain none of the words in the jargon list; the path-copy test covers every published page under `content/en/learn/paths/`.                                                                              | US6         |
| FR9  | The `restructurePendingIn` field, the allowlist module, rule R9, the marker scenarios, the frozen skills-order data and test, and every flat-render branch (including plan 04's flat mode) are deleted; a manifest that carries the retired key fails to parse. | US8         |
| FR10 | An ERP content-shape test over the real content enforces FR1 word floors, FR3, FR4's checkable parts, FR5's outline status, and the AAOIFI link check; a path-structure test enforces FR6.                                                                      | US7         |
| FR11 | Any part of the skills landing work that plan 06 left undone (strip, statement, hub strapline and description, statement scenario) is finished here.                                                                                                            | US6         |
| FR12 | Every course has an execution-ledger row; a `BLOCKED` course is restored to its skeleton, saved, and reported; a committed execution summary lists every course with its gates, counts, and `estimatedHours`.                                                   | PR reviewer |

## Non-Functional Requirements

- **Determinism.** Every unit gives the same output on two runs, the second with half the CPU (plan 05's rule),
  with `TZ=UTC`, `PYTHONHASHSEED=0`, and no network. Rules E1 to E15 in
  [tech-docs/004](./tech-docs/004-code-runtime-and-run-yaml.md#determinism-rules-for-erp-code).
- **Accuracy.** Every standard, rate, and date in a Sharia course comes from a tier 1 source where one exists,
  with an access date; a fact the maker could not verify is stated as uncertain or left out.
- **Accessibility.** The warning callout keeps its 6.90:1 text contrast (WCAG AA); path phase headings are real
  headings and the outcome lines are text; no new interactive control is added.
- **Performance.** No new client JavaScript; two branches and one module are deleted. Each CI shard of the
  example harness stays under its 60-minute timeout.
- **Coverage.** The app's 99% line threshold stays in force: every deleted branch takes its tests with it.
- **Language.** All new course text is English; nothing under `content/id/**` changes.
- **No rulings.** No course text gives its own Sharia verdict.
- **Reproducibility.** Every counted claim in this plan can be re-measured with the command beside it.

## Acceptance Criteria (Gherkin)

How each scenario is bound to tests is in
[tech-docs/008](./tech-docs/008-testing-and-verification.md#gherkin-to-test-binding-map). Part A lists the
Gherkin that lands in `specs/`; Part B lists the plan-local criteria that no Gherkin can state.

## Part A: Specs-Bound Gherkin

Phase 3 writes these files (test first) and Phase 6 indexes them in the spec READMEs. The exemption comments sit
directly above the tags, exactly as in `manifest-integrity.feature`, and name the scenario they exempt.

### New: `frontend/course-paths/skills-erp-path-structure.feature`

```gherkin
Feature: ERP skills path structure

  As a software engineer who builds ERP systems
  I want each ERP skills path shown as phases with plain outcomes
  So that I know what I can do after each stage and what I must already know

  # Exemption(integration): the scenario reads committed manifest data and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Each ERP skills path is a run of core phases with outcomes
  @integration-exempt
  # Exemption(e2e): the browser-test server replaces production manifests with isolated route fixtures, so the published ERP manifests are unavailable through that public test boundary; alternative-proof: ayokoding-www:test:unit / Each ERP skills path is a run of core phases with outcomes
  @e2e-exempt
  Scenario Outline: Each ERP skills path is a run of core phases with outcomes
    Given the published ERP manifest for "<path-id>"
    When its phases are inspected
    Then it has <phase-count> core phases, each with a title and an outcome
    And it has no extension phase
    And it carries no restructure marker

    Examples:
      | path-id                 | phase-count |
      | skills/conventional-erp | 5           |
      | skills/sharia-erp       | 6           |

  # Exemption(integration): the scenario reads committed manifest data and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / The Sharia ERP path is the conventional ERP path plus three courses
  @integration-exempt
  # Exemption(e2e): the browser-test server replaces production manifests with isolated route fixtures, so the published ERP manifests are unavailable through that public test boundary; alternative-proof: ayokoding-www:test:unit / The Sharia ERP path is the conventional ERP path plus three courses
  @e2e-exempt
  Scenario: The Sharia ERP path is the conventional ERP path plus three courses
    Given the published manifests for "skills/conventional-erp" and "skills/sharia-erp"
    When their courses are listed in path order
    Then the Sharia ERP path contains every conventional ERP course in the same relative order
    And its three extra courses are sharia-compliant-erp-design, islamic-contract-based-transaction-flows, and zakat-and-sharia-compliance-modules

  # Exemption(integration): the scenario reads committed manifest and course data and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / The ERP paths name the courses they assume
  @integration-exempt
  # Exemption(e2e): the browser-test server replaces production manifests with isolated route fixtures, so the published ERP manifests are unavailable through that public test boundary; alternative-proof: ayokoding-www:test:unit / The ERP paths name the courses they assume
  @e2e-exempt
  Scenario: The ERP paths name the courses they assume
    Given the published ERP manifests and the published course frontmatter
    When each path's assumed courses are compared with the prerequisites of its core courses
    Then the conventional ERP path assumes 12 courses and the Sharia ERP path assumes 14
    And every assumed course exists, lies outside its path, and is a prerequisite of at least one core course
    And the Sharia ERP path also assumes islamic-contract-modeling-for-systems and sharia-accounting-and-aaoifi-standards

  # Exemption(integration): the scenario renders one component from committed data and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / An ERP path page shows its phases and outcomes
  @integration-exempt
  # Exemption(e2e): the browser-test server replaces production manifests with isolated route fixtures, so the published ERP manifests are unavailable through that public test boundary; alternative-proof: ayokoding-www:test:unit / An ERP path page shows its phases and outcomes, plus the manual verification matrix in the plan delivery
  @e2e-exempt
  Scenario: An ERP path page shows its phases and outcomes
    Given the published manifest and course titles of an ERP skills path
    When the path landing page renders
    Then a "Before you start" note lists the assumed courses
    And every core phase shows its title and "After this phase you can" followed by its outcome
    And no course in the path shows an Outline badge
```

### New: `backend/content/erp-course-completion.feature`

It mirrors plan 06's `accounting-course-completion.feature` for the 30 ERP courses and shares the same word
counter, superseded-standards list, and checked-links list through one helper.

```gherkin
Feature: ERP courses are complete

  As a software engineer following an ERP skills path
  I want every course in the path to be a finished course
  So that no step of the path is an empty outline

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / No ERP course is an outline
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / No ERP course is an outline
  @e2e-exempt
  Scenario: No ERP course is an outline
    Given the courses listed in the two ERP skills paths
    When each course's frontmatter is read
    Then no course carries the outline status
    And every course declares the format by-example or annotated-concept

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every ERP course reaches the word floor of its format
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every ERP course reaches the word floor of its format
  @e2e-exempt
  Scenario: Every ERP course reaches the word floor of its format
    Given the courses listed in the two ERP skills paths
    When the words on each course's pages are counted
    Then every by-example course has at least 28000 words
    And every annotated-concept course has at least 22000 words

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every ERP course has the full drilling page
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every ERP course has the full drilling page
  @e2e-exempt
  Scenario: Every ERP course has the full drilling page
    Given the courses listed in the two ERP skills paths
    When each course's drilling overview is read
    Then it has the sections Recall Q&A, Applied problems, Code katas, Self-check checklist, and Elaborative interrogation & self-explanation
    And its drilling overview has at least 5000 words

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every ERP course runs its code in the example harness
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every ERP course runs its code in the example harness
  @e2e-exempt
  Scenario: Every ERP course runs its code in the example harness
    Given the courses listed in the two ERP skills paths
    When each course folder is searched for run specifications
    Then every course has a run.yaml under learning/code, under drilling/code, and under learning/capstone/code

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every Sharia ERP course states its limit and flags board decisions in one form
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every Sharia ERP course states its limit and flags board decisions in one form
  @e2e-exempt
  Scenario: Every Sharia ERP course states its limit and flags board decisions in one form
    Given the courses that appear only in the Sharia ERP path
    When each course's pages are read
    Then its overview contains the sentence "This course explains standards and design choices; it does not issue Sharia rulings."
    And it has at least four callouts that start with "Sharia board decision needed."
    And every such callout uses the warning type
    And its drilling overview has the section Sharia board decision spotting

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Sharia ERP courses name superseded AAOIFI standards only as history
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Sharia ERP courses name superseded AAOIFI standards only as history
  @e2e-exempt
  Scenario: Sharia ERP courses name superseded AAOIFI standards only as history
    Given the courses that appear only in the Sharia ERP path
    And the list of AAOIFI standards superseded on 2026-10-09
    When each paragraph of those courses is read
    Then every paragraph that names a superseded standard also says it was replaced or superseded

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every AAOIFI link in a Sharia ERP course was checked by a person
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every AAOIFI link in a Sharia ERP course was checked by a person
  @e2e-exempt
  Scenario: Every AAOIFI link in a Sharia ERP course was checked by a person
    Given the courses that appear only in the Sharia ERP path
    When every link to aaoifi.com or one of its subdomains is collected from their pages
    Then each link appears in the list of links a person has checked in a browser
```

### Modified: `frontend/course-paths/core-closure.feature` (plan 02's, as plan 06 left it)

Phase 0 reads the merged text and applies the same edits to it.

| Edit                  | Scenario or line                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delete one line       | In "An outline course in a core phase fails", delete the Given-side line `And the manifest carries no skills restructure marker`. The rule now applies to every manifest.                                                                                                                                                                                                  |
| Delete five scenarios | "A career manifest cannot carry the skills restructure marker"; "Only an allowlisted skills path may carry the marker, with its own plan"; "A marked skills manifest is exempt only from the core rules"; "Every allowlist entry is still in use"; "The marked skills manifests keep today's course order". Their step definitions and the frozen-order data go with them. |
| Add one scenario      | The scenario below, with both exemption comments and tags in the form of the file's other scenarios.                                                                                                                                                                                                                                                                       |

```gherkin
  Scenario: A manifest file that still declares the retired restructure marker fails to parse
    Given a path manifest file that declares restructurePendingIn
    When the manifest schema parses it
    Then parsing fails
```

Scenarios that stay and now cover the ERP manifests: "The published manifests pass every integrity rule" and
"The rewritten manifests keep every course of their previous version".

### Modified: `frontend/course-paths/path-phases.feature`

Delete the scenario "A skills path awaiting restructure renders as today's flat list" with its two exemption
comments and its step definition. Every other scenario stays.

### Modified: `frontend/course-paths/path-copy.feature`

Plan 02's first scenario (career pages only) and plan 06's added scenario (hub and accounting pages) are replaced
by the two scenarios below. Phase 0 reads the merged text and edits the merged titles the same way.

```gherkin
  Scenario: Learning path pages contain no internal planning vocabulary
    Given every published markdown page under content/en/learn/paths
    When the page text and descriptions are searched case-insensitively
    Then no page contains "Dangerous", "OI-2", "append", "manifest", or "from scratch" in any spelling

  Scenario: Every skills path page says who it is for
    Given the published skills path pages
    When their descriptions and opening text are read
    Then each page says the path is for software engineers
```

The AI Engineer scenario of plan 02 ("The AI Engineer path says who it is for") is unchanged.

### Conditional: `frontend/course-paths/skills-fixed-arc-statement.feature`

Plan 06 rewrote this feature ("... says who its paths are for, once, with no chooser", "no milestone strip
appears"). If Phase 0 finds it still in plan 02's old wording, this plan rewrites it to plan 06's text. Otherwise
it is untouched.

### Modified: plan 04's `path-roadmap.feature`

Delete scenario S26 (the flat roadmap mode) and its step definition. Phase 0 replaces "S26" with the merged
scenario title.

## Part B: Plan-Local Acceptance Criteria

These are checked by the end-state gate and the course checks, not by Gherkin.

| #   | Criterion                                                                                                                                       | Checked by                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| B1  | Each course meets the counts of its mode (examples, diagrams, code-bearing units, capstone words, drilling counts)                              | The Measure commands in [tech-docs/003](./tech-docs/003-definition-of-done-and-targets.md#measuring), per course |
| B2  | Each course's examples are the ones its spec lists, in order, with a stated assertion                                                           | Slice S0 acceptance and the mode gate                                                                            |
| B3  | Each course passed both quality gates within 2 cycles, or is recorded as `BLOCKED` and resolved by the user                                     | The execution summary                                                                                            |
| B4  | The ERP landing and hub copy contain no ramp wording and name the audience                                                                      | End-state rows G10 and G11                                                                                       |
| B5  | Every AAOIFI URL a Sharia ERP course links is ticked by a person in the register                                                                | The `[HUMAN]` step in Phase 7 and row G15                                                                        |
| B6  | The plan's own evidence folder holds one file per phase, the manual screenshots, and the execution summary, with repository-relative paths only | Phase 7 review                                                                                                   |

## UI Design Funnel

**Exempt.** This plan designs no screen, component, or interaction, so no low-fidelity or hi-fidelity options are
drawn. The reasons are recorded in [D17](./tech-docs/009-decision-records.md#d17--the-ui-design-funnel-is-exempt).

### What Changes on Screen

| Surface                                  | Change                                                                                                                                             | Design owner                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| The two ERP path pages                   | They render as phases with outcomes and a "Before you start" list instead of one flat list, because their manifests change. The page copy changes. | Plan 02's screen S1; plan 04's roadmap   |
| The path rail and mobile drawer          | They group courses under phase headings for ERP courses, because the flat branch is deleted.                                                       | Plan 02's rail                           |
| The skills landing and the hub strapline | Only if plan 06 left a row undone (Phase 0 landing split). The target wording is plan 06's.                                                        | Plan 06's screen S1 (option A, no strip) |
| Sharia course pages                      | The board-decision callout in its fixed warning form.                                                                                              | Plan 06's screen S2 (option A)           |
| Catalog and course headers               | Data only: 30 courses lose the Outline badge and gain a format and an estimated time.                                                              | Plan 03                                  |

### Grounding (R5)

- **Shared kit (`libs/web-ui`):** `Alert` with its `warning` variant (the callout), `Card` and `Badge` (path cards
  and the Outline badge, which these courses stop showing).
- **Target app:** `shell/path-landing.tsx` (phases, outcomes, "Before you start"), `shell/path-rail.tsx`,
  plan 04's `PathRoadmap`, and `features/content/shell/callout.tsx`. Each is used as plan 02, 04, and 06 built it.
- **Net-new components:** none. Two flat-render branches and one module are deleted.

### Verification Instead of Design

The changed pages are checked by the manual matrix in
[tech-docs/008](./tech-docs/008-testing-and-verification.md#manual-verification-matrix) (rows M1 to M12 on
port 3101, `en` and `id`, desktop and phone width), the
[UI Web Quality Gate](../../../repo-governance/workflows/quality/ui-web-quality-gate.md), and the UX review
triad (rule 15) on the two ERP path pages and the skills hub. If a reviewer finds a layout problem that needs a
new design, the fix is a new delivery, not part of this plan.

## Copy Changes

| Place                                                    | Before                                                                                            | After                                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Conventional ERP path description (page and manifest)    | "A complete conventional-ERP path for accountable enterprise systems."                            | The "Page Copy" block in [syllabus/paths/](./syllabus/paths/README.md), starting "For software engineers building ERP systems" |
| Sharia ERP path description (page and manifest)          | "A complete Sharia ERP path with shared enterprise depth and configurable jurisdictional design." | The "Page Copy" block in the syllabus path file, starting "For software engineers building Sharia-compliant ERP systems"       |
| Both ERP path page bodies                                | "Dangerous 3", "Dangerous 4", and the old stage wording                                           | The bodies in [syllabus/paths/](./syllabus/paths/README.md)                                                                    |
| Skills landing statement, hub strapline, hub description | Set by plan 06                                                                                    | Unchanged unless Phase 0 finds a row undone; plan 06's wording is the target                                                   |
