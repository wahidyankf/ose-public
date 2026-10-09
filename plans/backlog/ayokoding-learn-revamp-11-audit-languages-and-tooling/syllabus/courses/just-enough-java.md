# Just Enough Java (Primer)

**Course ID**: `just-enough-java` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-java` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring course `object-oriented-programming-essentials` keeps its own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: A compact modern-Java on-ramp: syntax, objects, records and sealed types, generics, collections, streams, testing, and a JVM-memory orientation.

## Why this exists · the big idea

- **The problem before the solution**: The lessons contain zero code fences in 6,315 words: the 80 programs exist as files but no lesson shows them.
- **Keep-this-if-you-forget-everything**: Java 25 programs launched from a single source file, each shown in full with its output.

## Prerequisites

- **Prior courses**: `object-oriented-programming-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 80 examples each have a colocated Java source artifact.
- **Wave**: 3 (slot 2); **size class**: XL (words to write 21,685, new unit folders 8); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                           | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 6,315                                                                                                                                                                                                     | at least 28,000                                                                                                                                                                          | 21,685 to write                 |
| Examples as `### Example N: Title`                            | 80 (headings in the wrong form today)                                                                                                                                                                     | at least 75, numbered 1 to N without gaps                                                                                                                                                | none; rename the headings       |
| Mermaid diagrams                                              | 0                                                                                                                                                                                                         | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | none of 80 examples has one                                                                                                                                                                               | one per example, 50 to 100 words                                                                                                                                                         | 80 to write                     |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                                         | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | all new                         |
| Code fences                                                   | 0 fences; 0 code fences unanchored                                                                                                                                                                        | every code fence anchored or marked as an illustration (budget: at most 6 fences (maven and gradle lines))                                                                               | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                      | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                             | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 80 example folders, 0 kata folders, 84 code files, 0 `run.yaml`                                                                                                                                           | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 8, convert 81            |
| Drilling page                                                 | 361 words; 1 of 5 standard `##` sections exact; 3 `<details>` blocks; headings found: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist, Why / why not prompts | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,639 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                            | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                    | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X5** Hollow lessons: zero code fences in 6,315 words; the 80 example sources exist (82 `.java` files) but no lesson shows them.
- **X6** All 80 example headings are `##`; X7 no key takeaways and no "Why It Matters" blocks.
- **X11** Drilling is 361 words under six nonstandard headings (Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist, Why / why not prompts); 0 kata units.
- **X13** Words 6,315, a gap of 21,685.
- **X1** 84 files in 80 example folders and a capstone folder, no `run.yaml`; one `pom.xml`.
- **Filler guard (plan 09, owner `plan-11`)**: fires FG2, FG3, and FG4 on 2026-10-09 (unique-code ratio 0.34 against the floor 0.5; near-duplicate share 1.00; stub share 0.95). The course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Anchor each existing source into its lesson, add annotations to the density band, write all missing parts, rewrite drilling to the standard five sections, write 8 katas.
- Units run as `java Main.java` (single-file source launch, Temurin 25); JUnit examples use a locked jar only if spike-free: otherwise a hand-rolled check method with exit status.
- The overview recommends Maven or Gradle; the units do not use them. The lesson says the harness runs plain `javac` and `java`, and shows `pom.xml` and Gradle lines as illustrations.

## Harness mode and toolchain

- **Harness mode**: Real mode, `java`.
- **Toolchain ids**: java (Temurin 25; single-file source launch; the image is the one plan 09 changes with a jar recipe, which this course does not use).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Illustration budget**: At most 6 fences (Maven and Gradle lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 6.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 19.8 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 21,685 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Agent packets**: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 3**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept; outside this plan.
- Prerequisites outside this plan (unchanged here): `object-oriented-programming-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-java` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X5, X6, X11, X13.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-java`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 8, convert 81); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 fences (maven and gradle lines).
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-java` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-java` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-java course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `just-enough-java` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-java/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "maven-project" to "equals-vs-identity".
- **co-02 · intermediate** — examples 27–52 (26): from "record-compact-ctor" to "stream-of-records".
- **co-03 · advanced** — examples 53–80 (28): from "grouping-collector" to "compact-source-instance-main".

## Lineage

- Follows Object-Oriented Programming Essentials.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 13 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 17 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 18 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
