# 002 — Definition of Done and Targets

This page says what "done" means for each of the 45 courses, which targets apply to which mode, what the
defect classes are, and how a course is sized. The numbers for each course are in its brief under
[../syllabus/courses/](../syllabus/courses/README.md); this page holds the rules those numbers come from.

## Series Decisions Behind It

Decisions 26, 27, 28, and 29 of the series (resolved by the user on 2026-10-09) fix the shape:

- Every course ends complete, pedagogically sound, and with solid code (26).
- A course is done when it meets the tutorial convention for its mode plus drilling, passes its mode
  quality gate and the Content Quality Gate with no blocking finding, and every code example is green in
  the harness (27).
- This plan audits existing courses; it does not rewrite them from scratch (28: "audit the other 111").
- Per course: fix, mode gate (at most 2 cycles), Content Quality Gate (at most 2 cycles), harness green.
  A course still blocked at the cap is BLOCKED, reported, and the work moves on (29).

Decision 40 adds the end state this plan closes: harness coverage of every course with code. Plan 13 is the last
audit plan, so its Phase 9 proves the series coverage gate ([007](./007-testing-strategy.md#the-series-harness-coverage-gate)).

## The Definition of Done

A course is **done** when all ten criteria hold. A1 to A10 are the checklist every brief and the delivery
checklist point at.

| Id  | Criterion                                                                                                                                                                                                                                                                                                                                     | Who or what proves it                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A1  | The course is in one tutorial mode, named in the brief with a reason, and the `format` frontmatter equals that mode. The mode never changes in this plan, except the two `format` corrections of decision D3 (`behavioral-and-leadership-interviews` and `system-design-interview`, from `annotated-concept` to `annotated-concept-no-code`). | The mode checker; the completion test (`format` equals the registry)   |
| A2  | Total words reach the mode's floor: 28,000 (By Example), 22,000 (Annotated Concept), 18,000 (Annotated Concept, no-code), 23,000 (capstone).                                                                                                                                                                                                  | The completion test                                                    |
| A3  | The example count reaches the mode's floor (75 for By Example, 45 for Annotated Concept and the capstone, 20 for no-code), the headings are in the mode's form (`### Example N: Title`, `### Worked Example N: Title`, `### Worked Scenario N: Title`), and the numbers run 1 to N without gaps.                                              | The completion test; the mode checker                                  |
| A4  | Diagrams: 30 to 50 for By Example (the adapter's band); at least 10 for Annotated Concept, capstone, and no-code (the target plan 06 set and plan 11 adopted).                                                                                                                                                                                | The completion test (counts); the mode checker (usefulness)            |
| A5  | Every example ends with a "Why It Matters" block of 50 to 100 words, and every code-bearing example has an annotation density of 1.0 to 2.25 comment lines per code line (By Example; the same density for code-bearing Annotated Concept examples).                                                                                          | The completion test (length); the mode checker (density)               |
| A6  | Drilling: at least 5,000 words; the five exact `##` sections; the kata units (at least 8 for By Example, at least 5 for Annotated Concept and the capstone; five design exercises, with no code, for no-code).                                                                                                                                | The completion test (words, sections); the harness (kata units)        |
| A7  | Every code fence in a lesson is anchored to its file or marked `<!-- harness: illustration -->`, within the brief's illustration budget; every `Output` block is anchored to an expected file; every anchor matches its file.                                                                                                                 | `examples sync` exits 0; the Content Quality Gate reads the budget     |
| A8  | Every example, kata, and capstone with code is a unit with a `run.yaml`; the course's harness mode is `real`, or `static` with a reason the catalog allows (`android`, `ios`, `windows` in this plan); `ayokoding-cli examples check --course <slug>` exits 0. A no-code course has no `code/` folder and is "not applicable".                | `examples check`; the completion test (every code unit has `run.yaml`) |
| A9  | The mode quality gate and the Content Quality Gate each end `PASS` or `PASS_WITH_FINDINGS` within 2 cycles, with no open `needs-decision` row.                                                                                                                                                                                                | The gate reports, recorded in the ledger                               |
| A10 | The frontmatter has no `status: outline`; `format`, `category`, and `description` are set (plan 03); `estimatedHours` equals the drift test's value after the last edit; `prerequisites` follow plan 02's rubric and closure checks.                                                                                                          | The completion test; plan 03's drift test; plan 02's integrity test    |

**What "done" does not require.** It does not require new topics, a new mode, a new slug, or a new position in any
path (decision D1). It does not require that a lesson claim anything the harness cannot check: a tool the sandbox
cannot host is modelled or shown as an illustration, and the lesson says which (decision D12).

### How A5, A7, A8, and A9 apply to AI, security, and mobile courses

These are not new criteria. They say what the same criteria mean where the subject is unusual.

- **AI courses (14).** A8 means a deterministic unit: a scripted fake model, recorded responses, fixed seeds, a counter
  clock, and no network or key ([011](./011-ai-fixtures-and-sourcing-policy.md)). A9's Content Quality Gate also
  reads the dated references the sourcing policy requires (AI7).
- **Security courses (5, of which four have code).** A7 and A9 include the safe-lab rules: synthetic data, no real
  target, no attack code for real software, reserved addresses only, fictional identifiers, and a `## Safety boundary`
  section ([012](./012-safe-lab-and-content-safety-rules.md)).
- **Mobile and desktop courses (4).** A8 is `static` for the files the Linux container cannot build or run, with a
  `static.note` that says what the run proves ([003](./003-harness-conversion-design.md#static-mode)).
- **No-code courses (8).** A6's katas are five design exercises with no code; A8 is "not applicable".

## Targets by Mode

The floors come from the AyoKoding adapter (`repo-governance/development/quality/gate-adapters/ayokoding-www.md`
and `tutorial-kinds.md`) and from plan 06's accounting convention, which plan 11 adopted so that all audited courses
meet one bar. Where the adapter sets no band, this plan's target is marked.

| Measure                            | By Example                       | Annotated Concept                              | Annotated Concept, no-code       | Capstone (standard)           |
| ---------------------------------- | -------------------------------- | ---------------------------------------------- | -------------------------------- | ----------------------------- |
| Courses in this plan               | 27                               | 7                                              | 8                                | 3                             |
| Word floor                         | 28,000                           | 22,000                                         | 18,000                           | 23,000                        |
| Examples                           | 75 to 85                         | 45 to 60                                       | 20 to 30                         | 45 or more                    |
| Heading form                       | `### Example N: Title`           | `### Worked Example N: Title`                  | `### Worked Scenario N: Title`   | `### Worked Example N: Title` |
| Diagrams                           | 30 to 50                         | at least 10 (this plan)                        | at least 10 (this plan)          | at least 10 (this plan)       |
| Code-bearing examples              | all                              | at least 27 of 45 (60 percent, plan 06's rule) | none                             | 45 units                      |
| "Why It Matters"                   | 50 to 100 words                  | 50 to 100 words                                | 50 to 100 words                  | 50 to 100 words               |
| Annotation density                 | 1.0 to 2.25                      | 1.0 to 2.25 on code-bearing examples           | not applicable                   | 1.0 to 2.25                   |
| Drilling                           | 5,000 words, five exact sections | same                                           | same, with five design exercises | same                          |
| Katas (`before` and `after` units) | at least 8                       | at least 5                                     | five exercises, no code          | at least 5                    |
| Capstone unit                      | 1                                | 1                                              | none                             | 1                             |

The five exact `##` sections of the drilling page are, in this order: `Recall Q&A`, `Applied problems`,
`Code katas`, `Self-check checklist`, and `Elaborative interrogation & self-explanation` (the title has an
ampersand, not "and"). Drilling pages under 5,000 words need expansion in 39 of the 45 courses
(130,763 words in total).

**Where the targets come from.** The adapter floors Annotated Concept at 45 examples and the no-code sub-mode at 20.
Plan 06 adds the code-bearing share (27 of 45) and the diagram floor (10), and plan 11 adopted both; this plan adopts
them unchanged (decision D11). A mode with no band for a measure gets none from this plan either.

**Capstones.** The three existing capstones of this plan (`capstone-first-working-software`,
`capstone-full-stack-app`, and `capstone-interview-loop`) follow the capstone column and also plan 08's capstone
contract (CC1 to CC7 and the course-level link rules CL1 to CL4): a `learning/` folder, a six-heading capstone page,
a rubric, and a `## What this course relies on` table. Two of them have no `learning/` folder today (class X12) and
fall under the shape-3 rule described in
[005](./005-prerequisites-ai-path-and-capstone-integrity.md#capstones-that-gain-a-learning-folder).

## Defect Classes

Twenty classes cover everything the baseline audit found. Each brief lists the classes it expects, with the measured
fact for the course; the first checker run (CP-1) confirms or corrects them. A class is a labelled kind of finding,
not a severity: severity comes from the checker. The class codes and meanings are plan 11's, with X12 widened by one
case (a `format` value that disagrees with the mode).

| Code | Class                                               | What it means                                                                                                                                                                                               | Who fixes it                                                                           | Courses expected |
| ---- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------- |
| X1   | Code without units                                  | Code files exist, but a unit has no `run.yaml` (opt-in is all-or-nothing), or kata units do not exist.                                                                                                      | swe-developer: write the `run.yaml` and the expected files                             | 37               |
| X2   | Layout                                              | Code sits outside `learning/code/ex-NN-<slug>/`, `drilling/code/kata-NN-<slug>/{before,after}`, or `learning/capstone/code/`; or build caches, scaffolding, or Markdown are committed inside a code folder. | swe-developer: move or delete; keep the lesson's anchors                               | 8                |
| X3   | Unanchored code fences                              | A code fence is neither anchored to a file nor marked `<!-- harness: illustration -->`.                                                                                                                     | `examples sync --write`, then the maker anchors the rest                               | 26               |
| X4   | Unanchored output blocks                            | An `Output` block is not a labelled anchor to an expected file.                                                                                                                                             | record, anchor, read                                                                   | 16               |
| X5   | Hollow or thin lessons                              | The lesson does not show the program or its output (few or no fences for the number of examples).                                                                                                           | the mode maker rewrites the lesson around the unit                                     | 18               |
| X6   | Wrong heading form                                  | Example headings are not in the mode's form (`### Example N: Title`, `### Worked Example N: Title`, or `### Worked Scenario N: Title`), or sit one level too high.                                          | the mode fixer renames and renumbers                                                   | 7                |
| X7   | Missing required parts                              | No "Why It Matters" blocks, or `## Examples by Level` is absent from the learning overview.                                                                                                                 | the mode maker adds them                                                               | 15               |
| X8   | "Why It Matters" length                             | Blocks fall outside 50 to 100 words.                                                                                                                                                                        | the mode fixer rewrites                                                                | 17               |
| X9   | Annotation density                                  | Comment lines per code line fall outside 1.0 to 2.25.                                                                                                                                                       | the mode fixer adds or trims annotations (comments carry meaning, not filler)          | 14               |
| X10  | Missing annotation notation                         | The `=>` result notation is absent from the fences.                                                                                                                                                         | the mode maker adds it                                                                 | 4                |
| X11  | Drilling                                            | Under 5,000 words, nonstandard `##` headings, or missing kata units.                                                                                                                                        | the mode maker; swe-developer for katas                                                | 44               |
| X12  | Missing scope or contract text, or a wrong `format` | No scope sentence or dependent-topics sentence in the overview, a capstone page without its contract, or a `format` value that disagrees with the mode (decision D3).                                       | the mode maker adds the text; the coordinator corrects `format` with the registry row  | 5                |
| X13  | Words below the floor                               | Total words under the mode's floor.                                                                                                                                                                         | the mode maker writes the missing lessons                                              | 27               |
| X14  | Filler comments                                     | A template comment is repeated through the code (the plan 09 filler guard lists six of these courses), or one directive line opens nearly every file.                                                       | swe-developer replaces filler with real annotations                                    | 8                |
| X15  | Nondeterminism or network                           | Clock, threads, random values, hashes, dates, addresses, or network calls change the output between two runs.                                                                                               | swe-developer fixes the unit, never loosens the check                                  | 23               |
| X16  | Unlocked dependencies                               | A third-party package has no lockfile with hashes (`dependencies.lockfile`).                                                                                                                                | swe-developer adds the lockfile                                                        | 10               |
| X17  | Tool or privilege gap                               | The lesson needs a tool the catalog lacks, a privilege, a device, a browser, or a service the sandbox removes.                                                                                              | model it, make it static, or mark an illustration; a new toolchain only by decision D9 | 22               |
| X18  | Stale or dishonest prose                            | Versions, prerequisites, product claims, vendor names, or a model boundary the lessons state wrongly.                                                                                                       | the mode fixer, with `docs-validating-factual-accuracy` and policy AI7 for AI content  | 32               |
| X19  | Missing units                                       | Promised examples have no unit folder, or non-runnable notes stand in as units.                                                                                                                             | swe-developer creates the units                                                        | 16               |
| X20  | Structure and diagram shortfall                     | Pages, numbered worked examples, or Mermaid diagrams are below the mode's or this plan's target.                                                                                                            | the mode maker adds them                                                               | 40               |

The per-course matrix of expected classes is below. A course with more classes is not necessarily larger; the size
class below decides the effort.

| Course                                                                                                                      | Classes | Which                                                  |
| --------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| [`advanced-frontend`](../syllabus/courses/advanced-frontend.md)                                                             | 10      | X1, X3, X4, X8, X9, X11, X15, X16, X17, X20            |
| [`android-app-development`](../syllabus/courses/android-app-development.md)                                                 | 10      | X1, X8, X9, X10, X11, X13, X14, X16, X17, X20          |
| [`api-design`](../syllabus/courses/api-design.md)                                                                           | 9       | X1, X3, X4, X9, X11, X14, X17, X18, X20                |
| [`async-python-and-fastapi-services`](../syllabus/courses/async-python-and-fastapi-services.md)                             | 10      | X1, X3, X4, X8, X9, X15, X16, X17, X18, X20            |
| [`backend-at-scale`](../syllabus/courses/backend-at-scale.md)                                                               | 11      | X1, X3, X4, X8, X9, X11, X14, X15, X17, X18, X20       |
| [`backend-essentials`](../syllabus/courses/backend-essentials.md)                                                           | 8       | X1, X3, X4, X8, X11, X15, X16, X18                     |
| [`build-your-own-reactive-ui`](../syllabus/courses/build-your-own-reactive-ui.md)                                           | 8       | X1, X3, X4, X11, X13, X14, X17, X20                    |
| [`build-your-own-web-framework`](../syllabus/courses/build-your-own-web-framework.md)                                       | 7       | X1, X5, X7, X11, X13, X15, X20                         |
| [`capstone-first-working-software`](../syllabus/courses/capstone-first-working-software.md)                                 | 12      | X1, X2, X3, X4, X11, X12, X13, X15, X16, X18, X19, X20 |
| [`capstone-full-stack-app`](../syllabus/courses/capstone-full-stack-app.md)                                                 | 11      | X1, X2, X4, X11, X12, X13, X16, X17, X18, X19, X20     |
| [`frontend-essentials`](../syllabus/courses/frontend-essentials.md)                                                         | 8       | X1, X3, X4, X8, X9, X11, X16, X17                      |
| [`hybrid-app-development`](../syllabus/courses/hybrid-app-development.md)                                                   | 9       | X1, X3, X5, X8, X9, X11, X13, X17, X19                 |
| [`information-architecture-and-seo`](../syllabus/courses/information-architecture-and-seo.md)                               | 11      | X1, X3, X5, X6, X8, X9, X10, X11, X13, X14, X20        |
| [`ios-app-development`](../syllabus/courses/ios-app-development.md)                                                         | 9       | X1, X3, X5, X7, X11, X13, X17, X19, X20                |
| [`linux-app-development`](../syllabus/courses/linux-app-development.md)                                                     | 12      | X1, X3, X5, X7, X9, X10, X11, X13, X14, X15, X17, X20  |
| [`windows-app-development`](../syllabus/courses/windows-app-development.md)                                                 | 8       | X1, X2, X3, X9, X11, X13, X14, X17                     |
| [`agent-context-and-memory`](../syllabus/courses/agent-context-and-memory.md)                                               | 9       | X1, X5, X6, X7, X11, X13, X15, X18, X20                |
| [`agent-orchestration-subagents-and-observability`](../syllabus/courses/agent-orchestration-subagents-and-observability.md) | 9       | X1, X5, X6, X8, X11, X13, X15, X18, X20                |
| [`agent-permissions-and-sandboxing`](../syllabus/courses/agent-permissions-and-sandboxing.md)                               | 10      | X1, X5, X7, X11, X13, X14, X15, X18, X19, X20          |
| [`agent-tools-and-mcp`](../syllabus/courses/agent-tools-and-mcp.md)                                                         | 11      | X1, X5, X7, X8, X11, X13, X15, X17, X18, X19, X20      |
| [`agentic-ai`](../syllabus/courses/agentic-ai.md)                                                                           | 9       | X1, X5, X7, X8, X11, X13, X15, X18, X20                |
| [`agentic-coding`](../syllabus/courses/agentic-coding.md)                                                                   | 12      | X1, X3, X4, X8, X9, X10, X11, X15, X17, X18, X19, X20  |
| [`creating-ai-powered-apps`](../syllabus/courses/creating-ai-powered-apps.md)                                               | 11      | X1, X3, X5, X7, X8, X9, X11, X13, X15, X18, X20        |
| [`evaluating-ai-output-essentials`](../syllabus/courses/evaluating-ai-output-essentials.md)                                 | 7       | X1, X3, X4, X11, X15, X18, X20                         |
| [`evaluating-ai-systems-in-depth`](../syllabus/courses/evaluating-ai-systems-in-depth.md)                                   | 7       | X1, X3, X4, X11, X15, X18, X20                         |
| [`fine-tuning-and-adaptation`](../syllabus/courses/fine-tuning-and-adaptation.md)                                           | 9       | X1, X3, X4, X6, X11, X17, X18, X19, X20                |
| [`inference-serving-and-model-deployment`](../syllabus/courses/inference-serving-and-model-deployment.md)                   | 8       | X1, X4, X8, X11, X15, X17, X18, X20                    |
| [`product-patterns-for-probabilistic-systems`](../syllabus/courses/product-patterns-for-probabilistic-systems.md)           | 3       | X11, X18, X20                                          |
| [`statistics-for-evaluation`](../syllabus/courses/statistics-for-evaluation.md)                                             | 10      | X1, X3, X4, X8, X9, X11, X15, X16, X18, X20            |
| [`the-agent-loop`](../syllabus/courses/the-agent-loop.md)                                                                   | 9       | X1, X5, X7, X11, X13, X15, X18, X19, X20               |
| [`analytics-and-experimentation`](../syllabus/courses/analytics-and-experimentation.md)                                     | 11      | X1, X2, X3, X5, X7, X11, X13, X15, X17, X19, X20       |
| [`engineering-management`](../syllabus/courses/engineering-management.md)                                                   | 3       | X11, X18, X20                                          |
| [`project-management`](../syllabus/courses/project-management.md)                                                           | 3       | X11, X18, X20                                          |
| [`software-product-engineering`](../syllabus/courses/software-product-engineering.md)                                       | 3       | X11, X18, X20                                          |
| [`technical-communication`](../syllabus/courses/technical-communication.md)                                                 | 2       | X11, X18                                               |
| [`behavioral-and-leadership-interviews`](../syllabus/courses/behavioral-and-leadership-interviews.md)                       | 6       | X6, X11, X12, X13, X18, X20                            |
| [`capstone-interview-loop`](../syllabus/courses/capstone-interview-loop.md)                                                 | 8       | X1, X2, X3, X11, X12, X13, X19, X20                    |
| [`coding-interview`](../syllabus/courses/coding-interview.md)                                                               | 9       | X1, X3, X5, X7, X11, X13, X15, X19, X20                |
| [`system-design-interview`](../syllabus/courses/system-design-interview.md)                                                 | 7       | X6, X11, X12, X13, X17, X18, X20                       |
| [`take-home-and-live-coding`](../syllabus/courses/take-home-and-live-coding.md)                                             | 10      | X1, X2, X3, X5, X7, X11, X13, X18, X19, X20            |
| [`detection-engineering-and-siem-operations`](../syllabus/courses/detection-engineering-and-siem-operations.md)             | 11      | X1, X2, X3, X5, X7, X11, X13, X17, X18, X19, X20       |
| [`it-and-application-security`](../syllabus/courses/it-and-application-security.md)                                         | 11      | X1, X2, X5, X8, X11, X13, X16, X17, X18, X19, X20      |
| [`it-governance-grc`](../syllabus/courses/it-governance-grc.md)                                                             | 4       | X11, X13, X18, X20                                     |
| [`offensive-security`](../syllabus/courses/offensive-security.md)                                                           | 12      | X1, X3, X5, X6, X7, X11, X13, X15, X17, X18, X19, X20  |
| [`security-essentials`](../syllabus/courses/security-essentials.md)                                                         | 12      | X1, X3, X4, X7, X8, X9, X11, X15, X16, X17, X18, X20   |

## Size Class Rule

The size class tells the coordinator how to split a course into agent packets. It does not estimate time (this
repository's principle "No Time Estimates"). The rule uses two measured numbers: the words to write, which is the
larger of the gap to the word floor and the drilling shortfall, and the number of new unit folders to create.

| Class | Words to write | New unit folders | Agent packets                                                                                                                                                                       |
| ----- | -------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S     | 4,000 or fewer | 10 or fewer      | One packet per defect group (mechanical fixes, then prose fixes); no page split                                                                                                     |
| M     | up to 12,000   | up to 40         | One packet per defect group plus one authoring packet for the word gap                                                                                                              |
| L     | up to 20,000   | up to 90         | Authoring split by learning page (one packet per page), then one packet per remaining defect group                                                                                  |
| XL    | above L        | above L          | Authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists |

A course takes the largest class either number reaches. For example, `agent-context-and-memory` needs 20,300 words
and 6 new unit folders, so it is XL by words; `windows-app-development` needs 3,488 words (all drilling) and 3 new
folders, so it is S, although its 87 units make it the heaviest course for CI (42.0 planning minutes). The size class
says how to split the writing; the CI column of [004](./004-toolchain-additions-and-ci-cost.md) says how much compute
a course needs.

| Size class | Courses | Which                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S          | 18      | `advanced-frontend`, `api-design`, `async-python-and-fastapi-services`, `backend-at-scale`, `backend-essentials`, `frontend-essentials`, `windows-app-development`, `evaluating-ai-output-essentials`, `evaluating-ai-systems-in-depth`, `fine-tuning-and-adaptation`, `inference-serving-and-model-deployment`, `product-patterns-for-probabilistic-systems`, `statistics-for-evaluation`, `engineering-management`, `project-management`, `software-product-engineering`, `technical-communication`, `security-essentials` |
| M          | 5       | `android-app-development`, `build-your-own-reactive-ui`, `agentic-coding`, `system-design-interview`, `it-governance-grc`                                                                                                                                                                                                                                                                                                                                                                                                    |
| L          | 9       | `capstone-first-working-software`, `capstone-full-stack-app`, `hybrid-app-development`, `information-architecture-and-seo`, `ios-app-development`, `agent-orchestration-subagents-and-observability`, `behavioral-and-leadership-interviews`, `detection-engineering-and-siem-operations`, `it-and-application-security`                                                                                                                                                                                                     |
| XL         | 13      | `build-your-own-web-framework`, `linux-app-development`, `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-tools-and-mcp`, `agentic-ai`, `creating-ai-powered-apps`, `the-agent-loop`, `analytics-and-experimentation`, `capstone-interview-loop`, `coding-interview`, `take-home-and-live-coding`, `offensive-security`                                                                                                                                                                                |

## Measured Totals Against the Targets

| Measure                                                           | Today (2026-10-09) | Target                                        |
| ----------------------------------------------------------------- | ------------------ | --------------------------------------------- |
| Words in the 45 courses                                           | 1,136,652          | each course at or above its floor             |
| Words short of the floor (27 courses are short)                   | 476,972            | 0                                             |
| Words to write, counting drilling shortfalls                      | 487,871            | 0                                             |
| Drilling words short of 5,000 (39 courses)                        | 130,763            | 0                                             |
| Example folders                                                   | 1,753              | 2,528 example units                           |
| Kata folders                                                      | 58                 | 266 kata units                                |
| Capstone units                                                    | see briefs         | 37 capstone units                             |
| Unanchored code fences                                            | 755                | 0 beyond the illustration budget (274 in all) |
| Unanchored `Output` blocks                                        | 1,064              | 0                                             |
| Anchors that disagree with their files or point at a missing file | 326                | 0                                             |

The per-course rows are in [001](./001-current-state-and-partition.md#baseline-per-course).

## What a Maker May and May Not Change

- **May:** lessons, drilling, code, `run.yaml`, expected files, the learning and drilling overviews, the capstone
  page, `estimatedHours`, and `prerequisites` (only through the check in
  [005](./005-prerequisites-ai-path-and-capstone-integrity.md)). The coordinator, not a maker, edits every `_index.md`.
- **May not:** the slug, the title, the mode (except decision D3), the category, the weight, anything under
  `content/id/**`, any path manifest (except the AI manifest rule in 005), or another course's folder.
- **Must keep:** every concept name that plan 08's capstones restate in their `## What this course relies on` tables
  (see CP-7 in each brief and [005](./005-prerequisites-ai-path-and-capstone-integrity.md#capstone-relies-on-rows-cp-7)).
  A renamed or removed concept is a `needs-decision` row until the capstone row is reconciled in the same commit.
