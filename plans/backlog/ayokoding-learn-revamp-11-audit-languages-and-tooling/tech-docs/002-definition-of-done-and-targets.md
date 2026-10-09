# 002 — Definition of Done and Targets

This page says what "done" means for each of the 32 courses, which targets apply to which mode, what the
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

## The Definition of Done

A course is **done** when all ten criteria hold. A1 to A10 are the checklist every brief and the delivery
checklist point at.

| Id  | Criterion                                                                                                                                                                                                                                                                                                   | Who or what proves it                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| A1  | The course is in one tutorial mode, named in the brief with a reason, and the `format` frontmatter equals that mode. The mode never changes in this plan.                                                                                                                                                   | The mode checker; the completion test (`format` equals the registry)   |
| A2  | Total words reach the mode's floor: 28,000 (By Example, Primer), 22,000 (Annotated Concept), 18,000 (Annotated Concept, no-code), 23,000 (capstone).                                                                                                                                                        | The completion test                                                    |
| A3  | The example count reaches the mode's floor (75 for By Example and Primer, 45 for Annotated Concept and the capstone, 20 for no-code), the headings are in the mode's form (`### Example N: Title`, `### Worked Example N: Title`, `### Worked Scenario N: Title`), and the numbers run 1 to N without gaps. | The completion test; the mode checker                                  |
| A4  | Diagrams: 30 to 50 for By Example (the adapter's band); at least 10 for Annotated Concept, capstone, and no-code (this plan's target); no count band for Primer, where a diagram appears where it helps.                                                                                                    | The completion test (counts); the mode checker (usefulness)            |
| A5  | Every example ends with a "Why It Matters" block of 50 to 100 words, and every code-bearing example has an annotation density of 1.0 to 2.25 comment lines per code line (By Example and Primer; the same density for code-bearing Annotated Concept examples).                                             | The completion test (length); the mode checker (density)               |
| A6  | Drilling: at least 5,000 words; the five exact `##` sections; the kata units (at least 8 for By Example and Primer, at least 5 for Annotated Concept and the capstone; five design exercises, with no code, for no-code).                                                                                   | The completion test (words, sections); the harness (kata units)        |
| A7  | Every code fence in a lesson is anchored to its file or marked `<!-- harness: illustration -->`, within the brief's illustration budget; every `Output` block is anchored to an expected file; every anchor matches its file.                                                                               | `examples sync` exits 0; the Content Quality Gate reads the budget     |
| A8  | Every example, kata, and capstone with code is a unit with a `run.yaml`; the course's harness mode is `real`, or `static` with a reason the catalog allows; `ayokoding-cli examples check --course <slug>` exits 0.                                                                                         | `examples check`; the completion test (every code unit has `run.yaml`) |
| A9  | The mode quality gate and the Content Quality Gate each end `PASS` or `PASS_WITH_FINDINGS` within 2 cycles, with no open `needs-decision` row.                                                                                                                                                              | The gate reports, recorded in the ledger                               |
| A10 | The frontmatter has no `status: outline`; `format`, `category`, and `description` are set (plan 03); `estimatedHours` equals the drift test's value after the last edit; `prerequisites` follow plan 02's rubric and closure checks.                                                                        | The completion test; plan 03's drift test; plan 02's integrity test    |

**What "done" does not require.** It does not require new topics, a new mode, a new slug, or a new
position in any path (decision D1). It does not require that a lesson claim anything the harness cannot
check: a tool the sandbox cannot host is modelled or shown as an illustration, and the lesson says which
(decision D12).

## Targets by Mode

The floors come from the AyoKoding adapter (`repo-governance/development/quality/gate-adapters/ayokoding-www.md`
and `tutorial-kinds.md`) and from plan 06's accounting convention, which this plan reuses so that all
audited courses meet one bar. Where the adapter sets no band, this plan's target is marked.

| Measure                            | By Example                       | Primer                 | Annotated Concept                              | Annotated Concept, no-code       | Capstone (standard)           |
| ---------------------------------- | -------------------------------- | ---------------------- | ---------------------------------------------- | -------------------------------- | ----------------------------- |
| Courses in this plan               | 12                               | 15                     | 3                                              | 1                                | 1                             |
| Word floor                         | 28,000                           | 28,000                 | 22,000                                         | 18,000                           | 23,000                        |
| Examples                           | 75 to 85                         | 75 to 85               | 45 to 60                                       | 20 to 30                         | 45 or more                    |
| Heading form                       | `### Example N: Title`           | `### Example N: Title` | `### Worked Example N: Title`                  | `### Worked Scenario N: Title`   | `### Worked Example N: Title` |
| Diagrams                           | 30 to 50                         | no count band          | at least 10 (this plan)                        | at least 10 (this plan)          | at least 10 (this plan)       |
| Code-bearing examples              | all                              | all                    | at least 27 of 45 (60 percent, plan 06's rule) | none                             | 45 units                      |
| "Why It Matters"                   | 50 to 100 words                  | 50 to 100 words        | 50 to 100 words                                | 50 to 100 words                  | 50 to 100 words               |
| Annotation density                 | 1.0 to 2.25                      | 1.0 to 2.25            | 1.0 to 2.25 on code-bearing examples           | not applicable                   | 1.0 to 2.25                   |
| Drilling                           | 5,000 words, five exact sections | same                   | same                                           | same, with five design exercises | same                          |
| Katas (`before` and `after` units) | at least 8                       | at least 8             | at least 5                                     | five exercises, no code          | at least 5                    |
| Capstone unit                      | 1                                | 1                      | 1                                              | none                             | 1                             |

The five exact `##` sections of the drilling page are, in this order: `Recall Q&A`, `Applied problems`,
`Code katas`, `Self-check checklist`, and `Elaborative interrogation & self-explanation` (the title has an
ampersand, not "and"). Drilling pages under 5,000 words need expansion in 24 of the 32
courses (95,746 words in total).

**Where the Annotated Concept targets come from.** The adapter floors Annotated Concept at 45 examples and
the no-code sub-mode at 20. Plan 06 adds the code-bearing share (27 of 45) and the diagram floor (10); this
plan adopts both unchanged (decision D11). A mode with no band for a measure gets none from this plan
either, so a Primer's diagram count is judged by the checker, not counted.

## Defect Classes

Twenty classes cover everything the baseline audit found. Each brief lists the classes it expects, with
the measured fact for the course; the first checker run (CP-1) confirms or corrects them. A class is a
labelled kind of finding, not a severity: severity comes from the checker.

| Code | Class                           | What it means                                                                                                                                                                | Who fixes it                                                                           | Courses expected |
| ---- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------- |
| X1   | Code without units              | Code files exist, but a unit has no `run.yaml` (opt-in is all-or-nothing), or kata units do not exist.                                                                       | swe-developer: write the `run.yaml` and the expected files                             | 18               |
| X2   | Layout                          | Code sits outside `learning/code/ex-NN-<slug>/`, `drilling/code/kata-NN-<slug>/{before,after}`, or `learning/capstone/code/`; or build caches and scaffolding are committed. | swe-developer: move or delete; keep the lesson's anchors                               | 4                |
| X3   | Unanchored code fences          | A code fence is neither anchored to a file nor marked `<!-- harness: illustration -->`.                                                                                      | `examples sync --write`, then the maker anchors the rest                               | 15               |
| X4   | Unanchored output blocks        | An `Output` block is not a labelled anchor to an expected file.                                                                                                              | record, anchor, read                                                                   | 2                |
| X5   | Hollow or thin lessons          | The lesson does not show the program or its output (few or no fences for the number of examples).                                                                            | the mode maker rewrites the lesson around the unit                                     | 5                |
| X6   | Wrong heading form              | Example headings are not in the mode's form (`### Example N: Title` or `### Worked Example N: Title`), or sit one level too high.                                            | the mode fixer renames and renumbers                                                   | 7                |
| X7   | Missing required parts          | No "Why It Matters" blocks, or `## Examples by Level` is absent from the learning overview.                                                                                  | the mode maker adds them                                                               | 6                |
| X8   | "Why It Matters" length         | Blocks fall outside 50 to 100 words.                                                                                                                                         | the mode fixer rewrites                                                                | 14               |
| X9   | Annotation density              | Comment lines per code line fall outside 1.0 to 2.25.                                                                                                                        | the mode fixer adds or trims annotations (comments carry meaning, not filler)          | 11               |
| X10  | Missing annotation notation     | The `=>` result notation is absent from the fences.                                                                                                                          | the mode maker adds it                                                                 | 1                |
| X11  | Drilling                        | Under 5,000 words, nonstandard `##` headings, or missing kata units.                                                                                                         | the mode maker; swe-developer for katas                                                | 22               |
| X12  | Missing scope or contract text  | No "just enough" scope sentence or dependent-topics sentence in the overview, or a capstone page without its contract.                                                       | the mode maker adds it                                                                 | 2                |
| X13  | Words below the floor           | Total words under the mode's floor.                                                                                                                                          | the mode maker writes the missing lessons                                              | 16               |
| X14  | Filler comments                 | A template comment is repeated through the code (for example, 194 copies of one line).                                                                                       | swe-developer replaces filler with real annotations                                    | 4                |
| X15  | Nondeterminism or network       | Clock, threads, random values, hashes, dates, addresses, or network calls change the output between two runs.                                                                | swe-developer fixes the unit, never loosens the check                                  | 7                |
| X16  | Unlocked dependencies           | A third-party package or crate has no lockfile with hashes (`dependencies.lockfile`).                                                                                        | swe-developer adds the lockfile                                                        | 6                |
| X17  | Tool or privilege gap           | The lesson needs a tool the catalog lacks or a privilege (`ptrace`, perf events, a UI) the sandbox removes.                                                                  | model it, make it static, or mark an illustration; a new toolchain only by decision D9 | 11               |
| X18  | Stale or dishonest prose        | Versions, prerequisites, topic numbers, vendor names, or a simulator boundary the lessons state wrongly.                                                                     | the mode fixer, with `docs-validating-factual-accuracy`                                | 15               |
| X19  | Missing units                   | Promised examples have no unit folder, or non-runnable notes stand in as units.                                                                                              | swe-developer creates the units                                                        | 4                |
| X20  | Structure and diagram shortfall | Pages, numbered worked examples, or Mermaid diagrams are below the mode's or this plan's target.                                                                             | the mode maker adds them                                                               | 9                |

The per-course matrix of expected classes is below. A course with more classes is not necessarily larger;
the size class below decides the effort.

| Course                                                                                            | Classes | Which                          |
| ------------------------------------------------------------------------------------------------- | ------- | ------------------------------ |
| [`browser-automation-with-cdp`](../syllabus/courses/browser-automation-with-cdp.md)               | 6       | X5, X8, X11, X18, X19, X20     |
| [`build-automation-and-task-runners`](../syllabus/courses/build-automation-and-task-runners.md)   | 6       | X2, X3, X11, X13, X17, X19     |
| [`building-production-cli-tools`](../syllabus/courses/building-production-cli-tools.md)           | 7       | X1, X3, X7, X9, X11, X16, X20  |
| [`capstone-forge-ready`](../syllabus/courses/capstone-forge-ready.md)                             | 5       | X2, X13, X15, X18, X20         |
| [`debugging-and-profiling`](../syllabus/courses/debugging-and-profiling.md)                       | 6       | X1, X3, X9, X11, X15, X17      |
| [`extending-neovim`](../syllabus/courses/extending-neovim.md)                                     | 5       | X1, X3, X8, X15, X18           |
| [`just-enough-nvim`](../syllabus/courses/just-enough-nvim.md)                                     | 4       | X1, X3, X17, X18               |
| [`software-engineering-practices`](../syllabus/courses/software-engineering-practices.md)         | 7       | X3, X6, X8, X11, X15, X17, X20 |
| [`software-testing`](../syllabus/courses/software-testing.md)                                     | 6       | X1, X3, X8, X11, X16, X17      |
| [`version-control-and-git`](../syllabus/courses/version-control-and-git.md)                       | 5       | X1, X3, X9, X15, X18           |
| [`just-enough-bash`](../syllabus/courses/just-enough-bash.md)                                     | 6       | X1, X4, X8, X15, X17, X18      |
| [`just-enough-c`](../syllabus/courses/just-enough-c.md)                                           | 6       | X3, X6, X11, X13, X14, X18     |
| [`just-enough-cpp`](../syllabus/courses/just-enough-cpp.md)                                       | 5       | X7, X11, X13, X14, X17         |
| [`just-enough-csharp`](../syllabus/courses/just-enough-csharp.md)                                 | 7       | X1, X6, X7, X9, X11, X16, X18  |
| [`just-enough-dart`](../syllabus/courses/just-enough-dart.md)                                     | 5       | X3, X11, X13, X18, X19         |
| [`just-enough-elixir`](../syllabus/courses/just-enough-elixir.md)                                 | 5       | X1, X6, X10, X11, X13          |
| [`just-enough-go`](../syllabus/courses/just-enough-go.md)                                         | 6       | X1, X7, X9, X11, X13, X14      |
| [`just-enough-java`](../syllabus/courses/just-enough-java.md)                                     | 5       | X1, X5, X6, X11, X13           |
| [`just-enough-kotlin`](../syllabus/courses/just-enough-kotlin.md)                                 | 6       | X2, X6, X7, X12, X13, X16      |
| [`just-enough-lua`](../syllabus/courses/just-enough-lua.md)                                       | 5       | X1, X3, X8, X9, X18            |
| [`just-enough-python`](../syllabus/courses/just-enough-python.md)                                 | 7       | X1, X4, X8, X9, X13, X16, X18  |
| [`just-enough-rust`](../syllabus/courses/just-enough-rust.md)                                     | 6       | X2, X5, X8, X9, X11, X13       |
| [`just-enough-swift`](../syllabus/courses/just-enough-swift.md)                                   | 5       | X6, X7, X11, X13, X18          |
| [`just-enough-typescript`](../syllabus/courses/just-enough-typescript.md)                         | 5       | X1, X3, X8, X9, X16            |
| [`bare-metal-virtualization`](../syllabus/courses/bare-metal-virtualization.md)                   | 5       | X5, X8, X11, X13, X17          |
| [`cicd-and-release-engineering`](../syllabus/courses/cicd-and-release-engineering.md)             | 5       | X1, X3, X11, X14, X17          |
| [`cloud-and-iac`](../syllabus/courses/cloud-and-iac.md)                                           | 7       | X1, X3, X8, X9, X11, X18, X20  |
| [`containers-and-orchestration`](../syllabus/courses/containers-and-orchestration.md)             | 3       | X11, X17, X19                  |
| [`platform-engineering-and-devex`](../syllabus/courses/platform-engineering-and-devex.md)         | 5       | X8, X11, X12, X13, X20         |
| [`self-hosting-essentials`](../syllabus/courses/self-hosting-essentials.md)                       | 7       | X1, X3, X8, X9, X15, X18, X20  |
| [`self-managed-kubernetes-and-gitops`](../syllabus/courses/self-managed-kubernetes-and-gitops.md) | 6       | X5, X8, X11, X13, X17, X20     |
| [`site-reliability-engineering`](../syllabus/courses/site-reliability-engineering.md)             | 5       | X1, X11, X13, X18, X20         |

## Size Class Rule

The size class tells the coordinator how to split a course into agent packets. It does not estimate time
(this repository's principle "No Time Estimates"). The rule uses two measured numbers: the words to
write, which is the larger of the gap to the word floor and the drilling shortfall, and the number of new
unit folders to create.

| Class | Words to write | New unit folders | Agent packets                                                                                                                                                                       |
| ----- | -------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S     | 4,000 or fewer | 10 or fewer      | One packet per defect group (mechanical fixes, then prose fixes); no page split                                                                                                     |
| M     | up to 12,000   | up to 40         | One packet per defect group plus one authoring packet for the word gap                                                                                                              |
| L     | up to 20,000   | up to 90         | Authoring split by learning page (one packet per page), then one packet per remaining defect group                                                                                  |
| XL    | above L        | above L          | Authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists |

A course takes the largest class either number reaches. For example, `just-enough-rust` needs 23,290 words
and 86 new unit folders, so it is L by words and L by folders; `bare-metal-virtualization` needs 14,332
words and 89 new folders, so it is L.

| Size class | Courses | Which                                                                                                                                                                                                                                                                   |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S          | 11      | `debugging-and-profiling`, `extending-neovim`, `just-enough-nvim`, `software-engineering-practices`, `software-testing`, `version-control-and-git`, `just-enough-bash`, `just-enough-lua`, `just-enough-python`, `just-enough-typescript`, `self-hosting-essentials`    |
| M          | 5       | `just-enough-c`, `just-enough-cpp`, `just-enough-go`, `cicd-and-release-engineering`, `platform-engineering-and-devex`                                                                                                                                                  |
| L          | 10      | `build-automation-and-task-runners`, `building-production-cli-tools`, `just-enough-dart`, `just-enough-elixir`, `just-enough-kotlin`, `just-enough-swift`, `bare-metal-virtualization`, `cloud-and-iac`, `containers-and-orchestration`, `site-reliability-engineering` |
| XL         | 6       | `browser-automation-with-cdp`, `capstone-forge-ready`, `just-enough-csharp`, `just-enough-java`, `just-enough-rust`, `self-managed-kubernetes-and-gitops`                                                                                                               |

## Measured Totals Against the Targets

| Measure                                           | Today (2026-10-09) | Target                                        |
| ------------------------------------------------- | ------------------ | --------------------------------------------- |
| Words in the 32 courses                           | 705,141            | each course at or above its floor             |
| Words short of the floor (21 courses are short)   | 305,207            | 0                                             |
| Words to write, counting drilling shortfalls      | 312,328            | 0                                             |
| Drilling words short of 5,000 (24 courses)        | 95,746             | 0                                             |
| Example folders                                   | 1,651              | 2304 example units                            |
| Kata folders                                      | 70                 | 236 kata units                                |
| Capstone units                                    | see brief          | 31 capstone units                             |
| Code fences in lessons                            | 3,980              | every one anchored or an illustration         |
| Unanchored code fences                            | 1,368              | 0 beyond the illustration budget (252 in all) |
| Unanchored `Output` blocks                        | 792                | 0                                             |
| Anchors that disagree with their files (mismatch) | 494                | 0                                             |
| Anchors whose file is missing                     | 13                 | 0                                             |
| "Why It Matters" blocks present / under 50 words  | 1,560 / 653        | every example, 50 to 100 words                |

The per-course rows are in [001](./001-current-state-and-partition.md#baseline-per-course).

## What a Maker May and May Not Change

- **May:** lessons, drilling, code, `run.yaml`, expected files, the learning and drilling overviews, the
  capstone page, `estimatedHours`, and `prerequisites` (only through the check in
  [005](./005-prerequisites-ai-core-and-integrity.md)).
- **May not:** the slug, the title, the mode, the category, the weight, anything under `content/id/**`,
  any path manifest (except the AI manifest rule in 005), or another course's folder.
- **Must keep:** every figure that another course copies. Two are known: the 43.2-minute error budget and
  the burn rates 14.4, 6, and 1 in `site-reliability-engineering`, which plan 08's concurrency capstone
  copies. The audit leaves them exactly as they are.
