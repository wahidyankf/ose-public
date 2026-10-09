# Product Requirements — Filler Course Rewrites

## Personas

| Persona                           | Who they are                                                                                                                                                          | What they need from this plan                                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rin, systems-curious engineer** | A backend engineer on the software-engineer path who reaches the extension phases and opens `build-your-own-git`, `type-systems`, or `lisp` to learn how things work. | Courses that teach one idea per example, show the real output, explain why it matters, and let her run and change the code.                                         |
| **Ben, security-minded engineer** | An application engineer who wants to learn detection, response, and vulnerability triage safely, without a real target.                                               | Security courses that use only invented data, never ask for a host, and still teach the concepts the capstones assume.                                              |
| **Content maintainer**            | A later plan (10 to 14) or a person editing a course after merge.                                                                                                     | A test that fails when a course turns back into the same few sentences, a baseline that names who owns each remaining filler course, and a rule that explains both. |
| **Plan 14 owner**                 | The author of the series' end-state gate.                                                                                                                             | One deterministic scan to call, an interface that does not change, and a baseline that is empty or names the plans that did not finish.                             |
| **PR reviewer**                   | The person who reviews this large PR.                                                                                                                                 | One commit per course, the gate reports, an execution summary, and the guard's metrics table, so each course can be checked on its own.                             |

## User Stories

- **US1.** As Rin, I want every one of the eight courses to show a different idea in every example, so that
  I learn something from each page instead of reading the same sentence 78 times.
- **US2.** As Rin, I want every example to print a result that is checked in a test, so that the output I see
  is the output the code gives.
- **US3.** As Rin, I want drilling with recall questions, applied problems, code katas, a self-check, and
  why-prompts, so that I can test what I learned.
- **US4.** As Rin, I want the Git course to give the object ids that real Git gives, so that what I build
  matches the tool I use every day.
- **US5.** As Ben, I want every address, host, finding, and token in the security courses to be invented and
  in a reserved range, so that I can run everything without touching a real system.
- **US6.** As Ben, I want the security courses to keep teaching what a detection rule, a log source, a severity
  rating, and a finding are, so that the capstones that rely on them still make sense.
- **US7.** As a content maintainer, I want a test that fails on a new templated course and lets a known one leave
  its list only by being fixed, so that filler cannot return unnoticed.
- **US8.** As the plan 14 owner, I want to call one scan and one baseline, so that the series' end-state gate can
  prove "no filler" without new code.
- **US9.** As a PR reviewer, I want the PR to separate the guard, the toolchain change, and each course into its own
  commit, so that I can review them one at a time.

## Functional Requirements

| Id   | Requirement                                                                                                                                                                                                                                                                       | Story        |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| FR1  | Each of the eight courses is rewritten in its assigned mode (seven By Example, `just-enough-fsharp` as a Primer) and meets that mode's targets in [tech-docs/002](./tech-docs/002-course-modes-and-definition-of-done.md): at least 75 examples, 28,000 words, 30 to 50 diagrams. | US1          |
| FR2  | Every example with code, every kata, and every capstone is a harness unit with a deterministic `run.yaml`. The lesson's code block, the unit's files, and the recorded output match; the maker has read every recorded output.                                                    | US2          |
| FR3  | Every course has a drilling page with Recall Q&A (at least 24), Applied problems (8), Code katas (8), a Self-check checklist (24), and Elaborative interrogation & self-explanation (6), and at least 5,000 words.                                                                | US3          |
| FR4  | Every object id the Git course prints equals the id real Git computes (a shell unit proves it against a shared vectors file), and no Python file in the course writes `\\0` as the header terminator.                                                                             | US4          |
| FR5  | The two security courses follow the safe-lab rules S1 to S7 in [tech-docs/005](./tech-docs/005-security-content-and-accuracy.md); every IPv4 literal is in a reserved range and every IPv6 literal is in `2001:db8::/32` or is `::1`.                                             | US5          |
| FR6  | The security courses keep teaching a detection rule, a log source, a severity rating, and a finding at the example numbers fixed in the briefs; the `relies-on` rows of the capstones that name them are re-read before merge and edited in the same PR if needed.                | US6          |
| FR7  | A deterministic filler guard in `apps/ayokoding-www` applies six structural rules (FG1 to FG6) to every non-outline course, runs in `test:quick`, and reports each rule's value and limit. There is no per-course exemption.                                                      | US7, US8     |
| FR8  | A baseline lists the non-outline courses that fire a rule: 25 at the start, 17 after this plan. A new entry is forbidden, an entry must leave in the commit that fixes its course, and the cap is lowered in that same commit.                                                    | US7          |
| FR9  | A completion test reads the list of rewritten courses and checks, for each, the status, the word floor, the drilling page, the examples list, the harness files, the Git header, the reserved addresses, and the primer scope.                                                    | US1, US3–US5 |
| FR10 | Every rewritten course has no `status: outline`, declares `format` (`by-example`, or `primer` for `just-enough-fsharp`), keeps plan 03's `category` and `description`, and has an `estimatedHours` equal to the drift test's expected value.                                      | US1          |
| FR11 | The harness catalog gains a `clojure` language entry and the `java` entry gains a hash-locked jar install recipe, each with a fixture unit and a smoke-table row, through plan 05's "Adding a Toolchain".                                                                         | US2          |
| FR12 | `just-enough-fsharp` states, in its overview, what "just enough" means and that `compilers-parsers-and-transpilers` is the topic that needs it, and has a light capstone.                                                                                                         | US1          |
| FR13 | Every changeable fact in a course (a version, a default, a policy, a score) carries "as of <month year>" and a source with an access date, and the word "latest" does not appear without both (rules A1 to A7).                                                                   | US1, US5     |
| FR14 | The prerequisites of the three courses with planned changes equal the lists in [tech-docs/001](./tech-docs/001-current-state.md#prerequisite-changes) if plan 02's integrity rules stay green; an edge that fails is dropped and recorded.                                        | US1          |
| FR15 | The three rules (FILL1, FILL2, SEC1) have a durable home in a new skill reference module, with a pointer in the AyoKoding gate adapter, and the generated harness routes are regenerated.                                                                                         | US7          |
| FR16 | No career manifest, skills manifest, path page, or catalog datum changes, and nothing under `content/id/**` changes.                                                                                                                                                              | US9          |

## Non-Functional Requirements

- **Determinism.** Every unit gives the same output on two executions, the second with half the CPU (plan 05's
  rule), with `TZ=UTC`, `PYTHONHASHSEED=0`, and no network. JVM and .NET output never depends on the CPU count.
- **Accuracy.** Every fact is re-verified at execution against its primary source and dated (rule A3). A fact the
  maker cannot verify is stated as uncertain or left out.
- **Safety.** No unit takes a target, opens a socket, or reads outside its folder; the security courses show
  detection, response, and remediation, never a working exploit.
- **Performance.** The real-corpus guard scan finishes in 30 seconds or less under HIPPO's `standard` tier; if it
  does not, the scanner reads files with bounded concurrency and does not skip any.
- **Accessibility.** Every Mermaid diagram has `accTitle` and `accDescr` and follows the repository's colour-palette
  rule; every code block names its language; no information is carried by colour alone.
- **Language.** All course text is English; nothing under `content/id/**` changes.
- **Licensing.** All examples are original; external text is cited, not copied.
- **No new runtime behaviour.** The guard is a test-time check; no page, route, or component changes.

## Acceptance Criteria (Gherkin)

How each scenario is bound to tests is in
[tech-docs/007](./tech-docs/007-testing-strategy.md#scenario-to-test-map). Each feature is a new file under
`specs/apps/ayokoding/www/behaviours/backend/content/`.

### New `backend/content/course-filler-guard.feature`

```gherkin
Feature: Course filler guard

  As a maintainer of the AyoKoding course library
  I want a deterministic check that tells a templated filler course from a written one
  So that no course that looks finished is secretly the same few sentences repeated

  # Exemption(integration): the scenarios build in-memory samples, temporary course trees, or read committed course files and have no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / each scenario below
  # Exemption(e2e): course structure is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / each scenario below
  @integration-exempt @e2e-exempt
  Scenario Outline: FG1 flags example text that repeats
    Given a course sample with <bodies> example bodies of which <distinct> are different
    When the course is evaluated
    Then rule FG1 <outcome>

    Examples:
      | bodies | distinct | outcome       |
      | 10     | 4        | fires         |
      | 10     | 5        | does not fire |
      | 78     | 1        | fires         |

  @integration-exempt @e2e-exempt
  Scenario Outline: FG2 flags code units that repeat
    Given a course sample with <units> code units of which <distinct> are different once comments, strings, and numbers are removed
    When the course is evaluated
    Then rule FG2 <outcome>

    Examples:
      | units | distinct | outcome       |
      | 10    | 4        | fires         |
      | 10    | 5        | does not fire |

  @integration-exempt @e2e-exempt
  Scenario: Comments, strings, and numbers do not hide a template
    Given two code units that differ only in comments, string literals, and numbers
    When the two units are normalized
    Then they count as one distinct unit

  @integration-exempt @e2e-exempt
  Scenario Outline: FG3 flags example text that differs by a few words
    Given a course sample with 20 example bodies of which <clustered> have a near-duplicate with 4-token shingle similarity of at least 0.8
    When the course is evaluated
    Then rule FG3 <outcome>

    Examples:
      | clustered | outcome       |
      | 10        | fires         |
      | 9         | does not fire |

  @integration-exempt @e2e-exempt
  Scenario Outline: FG4 flags courses made of stubs
    Given a course sample with 10 code units of which <stubs> have fewer than 4 non-blank lines
    When the course is evaluated
    Then rule FG4 <outcome>

    Examples:
      | stubs | outcome       |
      | 8     | fires         |
      | 7     | does not fire |

  @integration-exempt @e2e-exempt
  Scenario Outline: FG5 flags a course that is too short
    Given a course sample with <words> words in total
    When the course is evaluated
    Then rule FG5 <outcome>

    Examples:
      | words | outcome       |
      | 999   | fires         |
      | 1000  | does not fire |

  @integration-exempt @e2e-exempt
  Scenario Outline: FG6 flags a paragraph repeated across example bodies
    Given a course sample with 20 example bodies that each end with the same 30-word paragraph and hold <unique> other words
    When the course is evaluated
    Then rule FG6 <outcome>

    Examples:
      | unique | outcome       |
      | 90     | fires         |
      | 91     | does not fire |

  @integration-exempt @e2e-exempt
  Scenario: A sample below the minimum is not judged
    Given a course sample with 9 example bodies that are all the same
    When the course is evaluated
    Then rules FG1, FG3, and FG6 are not evaluated
    And rule FG5 is still evaluated

  @integration-exempt @e2e-exempt
  Scenario: A templated course on disk is flagged
    Given a temporary course whose 12 example bodies and 12 code units differ only by a number
    When the course tree is scanned
    Then the report for that course lists the rules FG1, FG2, and FG3

  @integration-exempt @e2e-exempt
  Scenario: A varied course on disk passes
    Given a temporary course with 12 different example bodies and 12 different code units
    When the course tree is scanned
    Then the report for that course lists no fired rule

  @integration-exempt @e2e-exempt
  Scenario: An outline course is skipped
    Given a temporary course whose frontmatter has the outline status and 300 words
    When the course tree is scanned
    Then the report for that course says it was skipped as an outline
    And no rule is listed for it

  @integration-exempt @e2e-exempt
  Scenario: A flat file counts as one code unit
    Given a temporary course whose code folder holds 12 flat files named ex-NN with different content
    When the course tree is scanned
    Then the report counts 12 code units

  @integration-exempt @e2e-exempt
  Scenario: A file type the scanner does not know is still compared
    Given a temporary course with 12 code units in a file type with no comment rule, differing only by a number
    When the course tree is scanned
    Then the report lists rule FG2 for that course

  @integration-exempt @e2e-exempt
  Scenario: Every non-outline course that fires a rule is in the baseline
    Given the real course library
    When the course tree is scanned
    Then every non-outline course that fires a rule is listed in the filler baseline

  @integration-exempt @e2e-exempt
  Scenario: Every baseline course still fires a rule
    Given the filler baseline
    When the course tree is scanned
    Then every baseline slug names an existing course
    And every baseline course still fires at least one rule

  @integration-exempt @e2e-exempt
  Scenario: The baseline never exceeds its cap
    Given the filler baseline and its cap
    When their sizes are compared
    Then the number of baseline entries is at most the cap

  @integration-exempt @e2e-exempt
  Scenario: Every baseline entry has an owner and a reason
    Given the filler baseline
    When each entry is read
    Then its owner is one of plan-09, plan-11, plan-12, or plan-13
    And its reason is not empty
    And the entries are sorted by slug with no duplicates

  @integration-exempt @e2e-exempt
  Scenario: No course is both baselined and rewritten
    Given the filler baseline and the list of rewritten filler courses
    When the two lists are compared
    Then no slug appears in both

  @integration-exempt @e2e-exempt
  Scenario: Every rewritten course passes all six rules
    Given the list of rewritten filler courses
    When the course tree is scanned
    Then no rewritten course fires any rule
```

### New `backend/content/filler-course-completion.feature`

The first eight scenarios are added in Phase 1 and are green as soon as each course is listed in
`REWRITTEN_FILLER_COURSES`; the ninth is added in Phase 7, after the last course lands, because it is red until then.

Every scenario reads that list. The three that name one course (Git, the security courses, and the primer) check
a course only once it is listed; for a course not yet listed the step logs `pending: <slug> not yet rewritten`
and passes, so the scenarios stay green while the waves run. The ninth scenario closes that gap: it fails until
all eight courses are listed.

```gherkin
Feature: Filler courses are rewritten

  As a software engineer following a path that contains one of the eight former filler courses
  I want each of them to be a finished course
  So that every example teaches something and every claim is checked

  # Exemption(integration): the scenarios read committed course files only and have no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / each scenario below
  # Exemption(e2e): course completeness is a property of committed content, not of a browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / each scenario below
  @integration-exempt @e2e-exempt
  Scenario: No rewritten course is an outline or fires a filler rule
    Given the courses listed as rewritten filler courses
    When each course's frontmatter and filler report are read
    Then no course carries the outline status
    And no filler rule fires for any course

  @integration-exempt @e2e-exempt
  Scenario: Every rewritten course reaches the word floor of its format
    Given the courses listed as rewritten filler courses
    When the words on each course's pages are counted
    Then every course has at least 28000 words

  @integration-exempt @e2e-exempt
  Scenario: Every rewritten course has the full drilling page
    Given the courses listed as rewritten filler courses
    When each course's drilling overview is read
    Then it has the sections Recall Q&A, Applied problems, Code katas, Self-check checklist, and Elaborative interrogation & self-explanation
    And it has at least 24 recall questions, 8 applied problems, 8 code katas, 24 checklist items, and 6 elaborative prompts
    And its drilling overview has at least 5000 words

  @integration-exempt @e2e-exempt
  Scenario: Every rewritten course lists its examples by level
    Given the courses listed as rewritten filler courses
    When each course's learning overview and level pages are read
    Then the learning overview has the section Examples by Level
    And the three level pages hold at least 75 example headings
    And every example heading has an entry in that section

  @integration-exempt @e2e-exempt
  Scenario: Every rewritten course runs its code in the example harness
    Given the courses listed as rewritten filler courses
    When each course folder is searched for run specifications
    Then every example folder, every kata folder, and the capstone code folder has a run.yaml
    And the number of example folders equals the number of example headings not marked as illustrations
    And every kata has a before folder and an after folder

  @integration-exempt @e2e-exempt
  Scenario: The Git course writes the NUL terminator, not a backslash and a zero
    Given the course build-your-own-git
    When every Python file under its code folders is read
    Then none contains a bytes literal with a backslash followed by a backslash and a zero
    And every 40-digit identifier in the capstone's expected output also appears in the learning folder's git-oracle-vectors.txt
    And the capstone's copy of that file equals the learning folder's copy

  @integration-exempt @e2e-exempt
  Scenario: Security courses use only reserved addresses
    Given the courses defensive-security and vulnerability-management-and-assessment
    When every page, code file, and fixture of the two courses is read
    Then every IPv4 literal is in 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 192.0.2.0/24, 198.51.100.0/24, or 203.0.113.0/24
    And every IPv6 literal is in 2001:db8::/32 or is ::1

  @integration-exempt @e2e-exempt
  Scenario: The primer states its scope and its dependent topic
    Given the course just-enough-fsharp
    When its overview is read
    Then it has a Scope heading
    And the text under that heading names compilers-parsers-and-transpilers

  @integration-exempt @e2e-exempt
  Scenario: All eight filler courses are rewritten
    Given the list of rewritten filler courses and the filler baseline
    When the two lists are compared with the eight former filler courses
    Then the rewritten list equals build-your-own-git, compilers-parsers-and-transpilers, type-systems, just-enough-fsharp, lisp, enterprise-java-and-the-jvm, defensive-security, and vulnerability-management-and-assessment
    And the baseline holds none of them
```

If the user decides to merge with a BLOCKED course (see [tech-docs/006](./tech-docs/006-execution-model.md#blocked-courses)),
the last scenario's list is edited in the same PR to name the courses that were rewritten, and the final report names the
course that stays in the baseline.

## UI Design Funnel

**Not applicable.** This plan changes course content (Markdown and code files), adds tests and one reference
module, and adds two toolchain entries to the code harness. It adds or changes no component, page, route, style, or
copy outside the eight courses' own pages, which render through the existing content pipeline. The reader-visible
surface is therefore not redesigned here; plans 01 and 04 own navigation, display, and the learning experience.

The rendered course pages are still checked by hand: Phase 10 opens the catalog, each course page, a level page of
each course, and the career paths on the dev server (port 3101) at 375, 768, and 1280 px with zero console
errors, and the UI and tester gates that apply to a content change run there
([tech-docs/007](./tech-docs/007-testing-strategy.md#manual-checks)).
