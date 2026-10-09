# Build Automation and Task Runners (By Example)

**Course ID**: `build-automation-and-task-runners` · **Format**: By Example · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `build-automation-and-task-runners` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `just-enough-bash`, `version-control-and-git`, `just-enough-typescript` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Build automation from one Make rule to a reproducible, cached build graph: GNU Make, `just`, npm scripts, and optional Bazel and Gradle build definitions, every artifact local and kept in a temporary directory under its own example.

## Why this exists · the big idea

- **The problem before the solution**: A third of the code fences are not tied to their files, 31 of the "examples" are decision notes rather than programs, and Gradle wrapper files sit in the code tree.
- **Keep-this-if-you-forget-everything**: Each build idea is one runnable unit whose output the lesson shows; a tool the harness cannot host is modelled, and the lesson says so.

## Prerequisites

- **Prior courses**: `just-enough-bash`, `version-control-and-git`, `just-enough-typescript` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Eighty examples already move from one Make rule to a cached build graph. Each rule, recipe, and cache behaviour is something a reader can run and break.
- **Wave**: 9 (slot 1); **size class**: L (words to write 12,429, new unit folders 10); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                  | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 15,571                                                                                                                                                           | at least 28,000                                                                                                                                                                          | 12,429 to write                 |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                               | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 30                                                                                                                                                               | 30 to 50 (adapter band)                                                                                                                                                                  | none                            |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 0 under 50 words; 2 over 100; median 57 words                                                                                                  | one per example, 50 to 100 words                                                                                                                                                         | 2 to write or fix               |
| Annotation density (comment lines per code line)              | median 1.0; 1 examples below 1.0; 0 above 2.25 (of 48 code-bearing)                                                                                              | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 1 to fix                        |
| Code fences                                                   | 110 fences; 48 code fences unanchored                                                                                                                            | every code fence anchored or marked as an illustration (budget: at most 14 fences (bazel and gradle launch lines, install lines))                                                        | 48 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                             | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                    | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 79 example folders, 0 kata folders, 176 code files, 0 `run.yaml`                                                                                                 | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 10, convert 79           |
| Drilling page                                                 | 204 words; 1 of 5 standard `##` sections exact; 3 `<details>` blocks; headings found: Recall Q&A, Scenario Judgment, Hands-On Repetition, Automaticity Checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,796 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                   | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                           | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X3** 48 code fences are unanchored (Makefile 27, just 7, JSONC 7, Kotlin 5, Starlark 1, Groovy 1).
- **X19** There are 79 example folders but no `run.yaml` and 0 kata units; 31 Markdown files inside `code/` are `decision.md` notes, which are not runnable units.
- **X2** Gradle wrapper scaffolding sits in the code tree (19 `.properties`, 12 `.bin`, 18 `.lock` files) and is not canonical unit content.
- **X11** Drilling is 204 words with four headings that differ from the standard ones (Scenario Judgment, Hands-On Repetition, Automaticity Checklist), so Applied problems, Code katas, Self-check checklist, and Elaborative interrogation are missing.
- **X13** Words 15,571 against the 28,000 floor, a gap of 12,429.
- **X17** Four of the tools the lessons teach are not in the catalog: `just`, Gradle, Bazel (and Make needs the `gcc` image).

## Fixes and design

- Decide per `decision.md` note: give it a runnable model (a decision table the unit evaluates) or fold it into the neighbouring example. A By Example lesson needs annotated code in every example.
- Remove wrapper scaffolding; one unit per example; anchor all fences; write the drilling page to the five standard sections and 5,000 words; 8 katas.
- Tool mapping: Make in `gcc`; `just` through a hash-locked PyPI wheel (`rust-just`) in `python`, to be proven by spike SP3; npm scripts in `node`; Bazel as a Python model of the target graph plus `ast.parse` syntax checks of BUILD and Starlark files, with `bazel build` lines as launch illustrations; Gradle by decision D6 (a model plus illustrations unless spike SP7 passes the budget rule).
- Bazel is not added as a toolchain: toolchain resolution needs the network, and the image is large. The units teach the target graph, caching keys, and hermetic inputs with a Python model.
- Gradle: about 12 units. If spike SP7 passes the budget rule in tech-docs/004, a `gradle` toolchain (Temurin 25 plus the Gradle distribution, SHA256-checked, core plugins only, `--offline`) is added; otherwise those units are a Python task-graph model with the DSL shown as an illustration.
- Timestamps and cache hits must not reach output: print task names and `UP-TO-DATE` states, never durations.

## Harness mode and toolchain

- **Harness mode**: Real mode: `gcc` for Make, `node` for npm scripts, `python` for `just` and the models; Gradle as above.
- **Toolchain ids**: gcc (Make), node (npm scripts), python (just and Starlark checks); gradle only if the budget rule allows.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): gradle (budget-gated).
- **Phase 1 spikes**: SP3, SP4, SP7 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 14 fences (Bazel and Gradle launch lines, install lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 3.0 s per container invocation × 2 executions × 100 runs (80 examples + 2 × 8 kata runs + 4 capstone runs) ≈ 10.0 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 12,429 (the larger of the word gap and the drilling shortfall), new unit folders 10.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 9**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: All three are in this plan and are audited before this course (waves 1, 2, and 4).
- In-plan prerequisites are audited first: `just-enough-bash` in wave 1, `version-control-and-git` in wave 4, `just-enough-typescript` in wave 2.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `build-automation-and-task-runners` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X2, X3, X11, X13, X17, X19.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `build-automation-and-task-runners`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 10, convert 79); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 14 fences (bazel and gradle launch lines, install lines).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `build-automation-and-task-runners` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `build-automation-and-task-runners` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit build-automation-and-task-runners course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/build-automation-and-task-runners/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–27 (27): from "Choose Automation Over Repetition" to "Run the Default `just` Recipe".
- **co-02 · intermediate** — examples 28–55 (28): from "List Available just Recipes" to "Compare Three Freshness Policies".
- **co-03 · advanced** — examples 56–80 (25): from "Declare a Bazel Build Target" to "Assemble the Build-Automation Capstone".

## Lineage

- The local layer that the CI/CD course later repeats on a hosted runner.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 44 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 43 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 37 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
