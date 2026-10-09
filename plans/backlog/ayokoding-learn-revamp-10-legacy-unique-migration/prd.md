# Product Requirements — Legacy Unique Migration

## Personas

| Persona                     | Who they are                                                                                                                        | What they need from this plan                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sari, bootcamp graduate** | Wants to learn a specific tool (Claude Code, a database-migration tool, a web framework) that today only exists in the legacy tree. | A real course at the same quality bar as the rest of the catalog, discoverable from the catalog, not buried in a tree the site calls temporary.   |
| **plan 14's author**        | The agent that deletes `learn/legacy/`, adds its 308 redirects, and repoints the 94 `docs/` files.                                  | One machine-checkable table that names, for every legacy file, its disposition and its exact redirect destination.                                |
| **plans 11–13's authors**   | The agents that audit the other 111 pre-existing courses.                                                                           | A record of which legacy topics were judged `covered` by which of those courses, usable as optional audit evidence.                               |
| **PR reviewer**             | The person who reviews this large, 48-course PR.                                                                                    | One commit per course, the gate reports, and the mapping table itself as a reviewable artifact, so each course and each row can be checked alone. |

## User Stories

- **US1.** As Sari, I want every legacy topic with no course equivalent to become a real course, so that
  I never have to learn from a tree the site itself calls temporary reference material.
- **US2.** As Sari, I want each new course to meet the same definition of done as every other course
  (its mode's targets, a capstone, drilling, green code), so that I cannot tell a migrated course from
  one written in an earlier plan.
- **US3.** As Sari learning one of the four AI coding-agent tools, I want the course to say plainly when
  its facts were last verified, so that I know to re-check anything that might have changed since.
- **US4.** As plan 14's author, I want one table that names every legacy file's disposition and exact
  redirect destination, so that I can build the 308 redirects and repoint the 94 `docs/` files without
  re-deriving the classification myself.
- **US5.** As a plan 11 to 13 auditor, I want to know which legacy topics this plan judged `covered` and
  by which course, so that I can use that legacy material as optional source evidence during my own audit.
- **US6.** As a content maintainer, I want tests that fail if a new course regresses to `status: outline`,
  falls under its word floor, or loses its code's green harness status, so that the 48 courses stay
  complete after this plan merges.
- **US7.** As a content maintainer, I want the catalog's hard-coded course and per-category counts to be
  correct after this plan, so that the catalog's own tests do not silently drift out of date.
- **US8.** As a reviewer, I want proof that `learn/legacy/` itself is untouched, so that I know this plan
  stayed inside its stated boundary and left plan 14's deletion step clean to do.

## Functional Requirements

| Id   | Requirement                                                                                                                                                                                                                                                                                                                  | Story    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR1  | [`syllabus/legacy-to-course-mapping.md`](./syllabus/legacy-to-course-mapping.md) has exactly one row per legacy topic, in the exact seven-field row format its own header defines, and every one of the 1,150 real legacy files is matched by exactly one row.                                                               | US1, US4 |
| FR2  | Each of the 48 new courses is written in its assigned mode (41 By Example, 7 Annotated-Concept) and meets that mode's targets and the definition of done in [tech-docs/002](./tech-docs/002-course-modes-and-definition-of-done.md).                                                                                         | US1, US2 |
| FR3  | Each new course's `learning/capstone/overview.md` states a project brief of at least 800 words plus `learning/capstone/code/` with a `run.yaml`.                                                                                                                                                                             | US2      |
| FR4  | Every code-bearing example, kata, and capstone across the 48 courses is a harness unit with a deterministic `run.yaml`; no unit performs a real network call or depends on wall-clock time.                                                                                                                                  | US2      |
| FR5  | Each of the 4 AI coding-agent courses' `## References` section records, for every version-specific or current-behaviour claim, the exact version string, an access date, and a direct link; the Content Quality Gate checks the date is no more than 30 days before the course's last content commit.                        | US3      |
| FR6  | Each new course's frontmatter has no `status: outline`, has the `format` this plan assigned, `category`, `description` (20 to 120 chars, ends with a period), and `estimatedHours` equal to plan 03's drift-test value.                                                                                                      | US2, US7 |
| FR7  | The mapping table's Target column names, for every `covered` and `new` row, the exact course slug(s) plan 14 and plans 11 to 13 read mechanically; a stale or renamed slug is corrected in the same commit as the rename.                                                                                                    | US4, US5 |
| FR8  | `course-categories.ts`'s per-category counts and any other hard-coded course-count assertion (including the 181-course and per-category corpus tests) are updated to the post-plan totals (229 total; the 7 affected categories' new counts).                                                                                | US7      |
| FR9  | A content-shape test over the real content enforces FR2's word floors and capstone/drilling requirements for all 48 new courses, and a new mapping-validation test enforces FR1 (every legacy file matched, every row's Target slug resolves to a real course or `-`).                                                       | US6      |
| FR10 | The WebAssembly toolchain addition and the install-recipe extensions of plan 09's merged `clojure` entry and of `kotlin` each follow plan 05's "Adding a Toolchain" procedure exactly, and the one resulting full `ayokoding-www:examples:check` run is green before any course depending on a changed entry is marked done. | US2      |
| FR11 | No commit in this plan's branch changes any file under `apps/ayokoding-www/content/en/learn/legacy/`.                                                                                                                                                                                                                        | US8      |

## Non-Functional Requirements

- **Determinism.** Every unit gives the same output on two runs, the second with half the CPU (plan 05's
  rule), with `TZ=UTC`, `PYTHONHASHSEED=0`, no network, and fixed seeds.
- **Accuracy.** Every external claim has a source and an access date in the course's `## References`
  section; the four AI-agent courses re-verify same-day, since their subject changes fast.
- **Safety.** No course content requires a real account, a real API key, or a real network call to run;
  every fixture shim's simplifications are documented, not implied to be the vendor's guarantee.
- **Accessibility.** No new interactive control is added. Tables on the mapping page fit at 375 px by
  scrolling inside the table, not the page; headings keep their hierarchy.
- **Performance.** No new client JavaScript. CI time for the new units stays inside the budget measured in
  Phase 0 of [delivery.md](./delivery.md).
- **Language.** All new course text is English; nothing under `content/id/**` changes.
- **Reading level.** The audience is a junior bootcamp graduate: plain words, terms defined at first use,
  no unexplained acronyms.
- **Boundary.** `apps/ayokoding-www/content/en/learn/legacy/` is read-only input to this plan; this
  plan's own commits never write to it.

## Acceptance Criteria (Gherkin)

How each scenario binds to tests is in
[tech-docs/008](./tech-docs/008-testing-strategy.md#layer-summary-and-scenario-to-test-map).

### New: `backend/content/legacy-mapping-completeness.feature`

```gherkin
Feature: The legacy-to-course mapping is complete and mechanically checkable

  As plan 14's author
  I want one table that resolves every legacy file's disposition and redirect destination
  So that I can delete learn/legacy and repoint its links without re-deriving the classification

  # Exemption(integration): the scenario reads committed content and mapping files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every legacy file is matched by exactly one mapping row
  @integration-exempt
  # Exemption(e2e): mapping completeness is a property of committed files, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every legacy file is matched by exactly one mapping row
  @e2e-exempt
  Scenario: Every legacy file is matched by exactly one mapping row
    Given every Markdown file under apps/ayokoding-www/content/en/learn/legacy
    And every row of syllabus/legacy-to-course-mapping.md
    When each legacy file's path is matched against every row's Legacy path field
    Then every legacy file matches exactly one row
    And every row's Disposition is covered, new, or obsolete

  # Exemption(integration): the scenario reads committed mapping and course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every mapping row's target resolves to a real course or a dash
  @integration-exempt
  # Exemption(e2e): target resolution is a property of committed files, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every mapping row's target resolves to a real course or a dash
  @e2e-exempt
  Scenario: Every mapping row's target resolves to a real course or a dash
    Given every row of syllabus/legacy-to-course-mapping.md
    When a row's Disposition is covered or new
    Then every slug in its Target field is a real course directory under apps/ayokoding-www/content/en/learn/courses
    And when a row's Disposition is obsolete its Target field is exactly a dash

  # Exemption(integration): the scenario reads committed content files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / learn/legacy is untouched by this plan
  @integration-exempt
  # Exemption(e2e): a file-tree diff is not observable at a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / learn/legacy is untouched by this plan
  @e2e-exempt
  Scenario: learn/legacy is untouched by this plan
    Given this plan's branch diffed against the commit where plans 01 to 09 merged
    When the diff is filtered to apps/ayokoding-www/content/en/learn/legacy
    Then the filtered diff is empty
```

### New: `backend/content/legacy-migrated-course-completion.feature`

```gherkin
Feature: Legacy-migrated courses are complete

  As Sari, a learner who needs a subject only the legacy tree used to teach
  I want each of the 48 migrated courses to be a finished course
  So that I am not left with a thinner experience than the rest of the catalog

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / No migrated course is an outline
  @integration-exempt
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / No migrated course is an outline
  @e2e-exempt
  Scenario: No migrated course is an outline
    Given the 48 course slugs this plan writes
    When each course's frontmatter is read
    Then no course carries the outline status
    And each course declares the format this plan assigned it

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every migrated course reaches its mode's word floor and has a capstone and drilling
  @integration-exempt
  # Exemption(e2e): course size and structure are properties of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every migrated course reaches its mode's word floor and has a capstone and drilling
  @e2e-exempt
  Scenario: Every migrated course reaches its mode's word floor and has a capstone and drilling
    Given the 48 course slugs this plan writes
    When each course's pages are read
    Then each By Example course has at least 28000 words and each Annotated-Concept course has at least 22000 words
    And each course has a learning/capstone/overview.md of at least 800 words
    And each course has a drilling/overview.md with the five required sections

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Every code-bearing example is a harness unit
  @integration-exempt
  # Exemption(e2e): harness opt-in is a property of committed files, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every code-bearing example is a harness unit
  @e2e-exempt
  Scenario: Every code-bearing example is a harness unit
    Given the 48 course slugs this plan writes
    When each course's learning/code and drilling/code folders are searched for run specifications
    Then every code-bearing example, kata, and capstone has a run.yaml
    And no run.yaml performs a real network call

  # Exemption(integration): the scenario reads committed course files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / AI coding-agent courses date every version-specific claim
  @integration-exempt
  # Exemption(e2e): reference dating is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / AI coding-agent courses date every version-specific claim
  @e2e-exempt
  Scenario: AI coding-agent courses date every version-specific claim
    Given the claude-code-for-engineers, hermes-agent-for-engineers, openclaw-for-engineers, and pi-coding-agent-for-engineers courses
    When each course's References section is read
    Then every version-specific or current-behaviour claim has an access date
    And every runnable example drives a fixture shim rather than a live network call
```

### New: `frontend/course-paths/catalog-count-after-migration.feature`

```gherkin
Feature: The catalog's course and category counts stay correct after migration

  As a content maintainer
  I want the catalog's hard-coded counts to match the real course corpus after this plan
  So that the catalog's own tests do not silently drift out of date

  # Exemption(integration): the scenario reads committed content and counts a real corpus, with no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / The total course count and every per-category count match the real corpus
  @integration-exempt
  # Exemption(e2e): a corpus count is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / The total course count and every per-category count match the real corpus
  @e2e-exempt
  Scenario: The total course count and every per-category count match the real corpus
    Given every course directory under apps/ayokoding-www/content/en/learn/courses
    When courses are counted in total and grouped by category
    Then the total is 229
    And each category's count matches the number of courses declaring that category
```

## UI Design Funnel

**Not required.** This plan adds no screen, component, route, or interaction. It adds course content
(Markdown), a mapping document (data), one new toolchain plus two install-recipe extensions inside `apps/ayokoding-cli` (which is a
backend CLI, not a UI surface), and updates to hard-coded test counts. The catalog page already renders
any course that declares a `category` through plan 03's existing grouping logic, and a course with no path
already renders with "no path chips" (plan 04's existing graceful-fallback behaviour), so 48 more courses
need no new UI code. Manual browser verification (port 3101) is still done in
[delivery.md](./delivery.md#manual-browser-verification) to confirm the catalog renders the new courses
and counts correctly, not because new UI code was written.

## Copy Changes

| Place                                              | Before                                                 | After                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog page course and category counts (rendered) | 181 total, 14 category counts from plan 03/06/07/08/09 | 229 total; the 7 affected categories' counts rise as listed in [brd.md](./brd.md#evidence-measured-2026-10-09-at-originmain-bb7f90137); the other 7 categories are unchanged |
| Course descriptions                                | N/A (new courses)                                      | Each new course's one-sentence `description`, written per plan 03's rule (20 to 120 chars, ends with a period)                                                               |
