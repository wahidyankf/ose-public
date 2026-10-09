# Just Enough Bash (Primer)

**Course ID**: `just-enough-bash` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-bash` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Bash for productive scripting: quoting and expansion, exit status and `trap`, pipelines and redirection, functions, text tools (`grep`, `sed`, `awk`, `find`, `xargs`), safe scripting habits, and static analysis with ShellCheck and shfmt.

## Why this exists · the big idea

- **The problem before the solution**: This is the healthiest course in the plan (its 108 anchors match), but 86 outputs are unanchored, 7 "Why It Matters" blocks are outside the 50 to 100 word band, and nothing runs in the harness yet.
- **Keep-this-if-you-forget-everything**: Shell is a language of exit codes and streams; every example shows both and prints the same bytes every run.

## Prerequisites

- **Prior courses**: none (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 83 examples are shell scripts that run as written.
- **Wave**: 1 (slot 2); **size class**: S (words to write 0, new unit folders 0); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                                                   | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 32,786                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | none                 |
| Examples as `### Example N: Title`                            | 83                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                 |
| Mermaid diagrams                                              | 7                                                                                                                                                                                                     | no count band (a diagram where it helps)                                                                                                                                                 | none required        |
| "Why It Matters" (50 to 100 words each)                       | 83 of 83 present; 6 under 50 words; 1 over 100; median 62 words                                                                                                                                       | one per example, 50 to 100 words                                                                                                                                                         | 7 to write or fix    |
| Annotation density (comment lines per code line)              | median 1.2; 0 examples below 1.0; 0 above 2.25 (of 83 code-bearing)                                                                                                                                   | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 0 to fix             |
| Code fences                                                   | 232 fences; 1 code fences unanchored                                                                                                                                                                  | every code fence anchored or marked as an illustration (budget: at most 4 fences (installing tools))                                                                                     | 1 to anchor          |
| Lesson-to-file anchors (plan 05's method)                     | 92 path anchors (match 92, mismatch 0, missing 0); 16 labelled anchors (match 16, mismatch 0, missing 0)                                                                                              | every anchor matches its file                                                                                                                                                            | 0 to repair          |
| Output blocks                                                 | 86 output fences; 86 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                                    | 86 to anchor         |
| Harness units                                                 | 83 example folders, 8 kata folders, 123 code files, 0 `run.yaml`                                                                                                                                      | 83 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 0, convert 92 |
| Drilling page                                                 | 6,818 words; 5 of 5 standard `##` sections exact; 46 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | words ok             |
| Katas                                                         | 8 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                                     | 0                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 123 files (100 shell scripts) in 83 example folders, 8 kata folders, and a capstone folder, with no `run.yaml`.
- **X4** 86 `Output` blocks are unanchored. The 92 path anchors and 16 labelled anchors all match their files (the best baseline in this plan).
- **X8** 6 "Why It Matters" blocks are under 50 words and 1 is over 100 (median 62).
- **X15** `$RANDOM`, `$$`, `date`, and `mktemp` reach output in some examples; `trap` examples depend on signal timing.
- **X17** ShellCheck and shfmt are mentioned about 100 times, but the `shell` image does not contain them.
- **X18** The overview lists `shellcheck` and `shfmt` as installed tools; the lesson must say how the examples ran them.

## Fixes and design

- Set `RANDOM` with a seed, avoid `$$` and `date` in output, use fixed temporary directories, and make `trap` examples send the signal to themselves (`kill -s TERM $$` inside the unit) so the order is fixed.
- ShellCheck and shfmt examples run through hash-locked PyPI wheels that bundle the binaries (spike SP3); no catalog change.
- Anchor the 86 outputs, lengthen the 6 short "Why It Matters" blocks, shorten the long one, write the missing `run.yaml` files and expected outputs.
- This course is the pilot (wave 1) for the `shell` toolchain: its double-run results set the conventions for every shell-based unit in later waves.
- AI core: the AI path assumes this course (plan 08). Plan 02 removes its `just-enough-python` prerequisite, which leaves the path's assumption intact.

## Harness mode and toolchain

- **Harness mode**: Real mode, `shell` (and `python` for the two lint tools).
- **Toolchain ids**: shell (bash, coreutils, git, jq, sqlite3); python plus locked `shellcheck-py` and `shfmt-py` wheels for the lint examples.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP3 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 4 fences (installing tools).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 1.5 s per container invocation × 2 executions × 102 runs (83 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 5.1 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 1**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `build-automation-and-task-runners`, `debugging-and-profiling`, `software-engineering-practices`, `version-control-and-git`, `just-enough-c`, `cloud-and-iac`, `containers-and-orchestration`, `self-hosting-essentials` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Plan 02 removes `just-enough-python`; the course has no prerequisites. Re-check that nothing in the prose now needs Python.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-bash` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X4, X8, X15, X17, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-bash`; a course that fires is fixed, never baselined.
- [ ] Units: 83 example units, 8 kata units, 1 capstone unit (create 0, convert 92); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 fences (installing tools).
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-bash` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-bash` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-bash course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-bash/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Shebang Script" to "Simple Pipe".
- **co-02 · intermediate** — examples 29–60 (32): from "Case Statement -- Dispatching on an Action Word" to "pipefail Catches a Failing First Stage".
- **co-03 · advanced** — examples 61–83 (23): from "trap ... EXIT for Cleanup" to "Process Substitution -- Diffing Two Live Pipelines".

## Lineage

- Assumed (not core) by the AI Engineer path after plan 08; prerequisite of most tools and infrastructure courses.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 6 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 6 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 6 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — an assumed course after plan 08 (`assumes` lists it); this plan leaves it assumed.
