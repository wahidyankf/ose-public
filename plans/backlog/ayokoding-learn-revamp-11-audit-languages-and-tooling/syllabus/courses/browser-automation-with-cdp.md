# Browser Automation with CDP (By Example)

**Course ID**: `browser-automation-with-cdp` · **Format**: By Example · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `browser-automation-with-cdp` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `just-enough-python`, `networking-essentials` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: The Chrome DevTools Protocol (CDP) below browser wrappers: targets and sessions, commands and events, navigation and readiness, DOM and input, network observation, safe request handling, and bounded concurrency. Every example runs against a deterministic local simulator written in Python's standard library.

## Why this exists · the big idea

- **The problem before the solution**: The lessons say what to run and what to expect but never show the program or its output, and examples 1 to 16 are subcommands of one shared file, so a reader cannot run one idea at a time.
- **Keep-this-if-you-forget-everything**: Every CDP example is one small program on the local simulator, shown in full with its recorded output, and it says plainly where a real browser would differ.

## Prerequisites

- **Prior courses**: `just-enough-python`, `networking-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Seventy-five contiguous, runnable CDP-shaped examples already exist in order. Each protocol command or event is a rule a reader can run against the simulator and break, which is the By Example shape.
- **Wave**: 4 (slot 3); **size class**: XL (words to write 21,102, new unit folders 25); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                      | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 6,898                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | 21,102 to write                 |
| Examples as `### Example N: Title`                            | 75                                                                                                                                                                                                   | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 0                                                                                                                                                                                                    | 30 to 50 (adapter band)                                                                                                                                                                  | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | 75 of 75 present; 75 under 50 words; 0 over 100; median 10 words                                                                                                                                     | one per example, 50 to 100 words                                                                                                                                                         | 75 to write or fix              |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                                    | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | all new                         |
| Code fences                                                   | 1 fences; 1 code fences unanchored                                                                                                                                                                   | every code fence anchored or marked as an illustration (budget: at most 8 fences (browser launch commands))                                                                              | 1 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                 | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 59 example folders, 0 kata folders, 61 code files, 0 `run.yaml`                                                                                                                                      | 75 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 25, convert 59           |
| Drilling page                                                 | 443 words; 4 of 5 standard `##` sections exact; 6 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,557 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                       | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                               | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X5** Hollow lessons: one code fence in 6,898 words. Each example gives a command line ("Code: python3 code/cdp_simulation.py ...", relative to `learning/`) and an expected observation instead of showing the program and its output.
- **X19** Missing units: examples 1 to 16 are subcommands of one shared `cdp_simulation.py`, so only 59 example folders exist (ex-17 to ex-75). The 8 katas and the capstone unit do not exist (the capstone page has no code folder).
- **X8** "Why It Matters" has a median of 10 words and 75 of 75 are under the 50-word floor.
- **X20** Zero Mermaid diagrams against the 30 to 50 band.
- **X11** Drilling is 443 words with five sections but no kata units.
- **X18** The overview says direct browser actions are optional adaptations. The audit must make the simulator boundary honest in the description and in each lesson.

## Fixes and design

- Split examples 1 to 16 into their own units, one program per example, sharing no helper between units except a copied module that the unit owns.
- Show each unit's program and its recorded output in the lesson as anchored fences, and wire all 75 lessons to their units.
- Write 75 "Why It Matters" paragraphs of 50 to 100 words, add 30 to 50 diagrams, expand drilling to 5,000 words, write 8 katas and the capstone unit.
- Decision (D8): keep the deterministic Python simulator. Real Chromium is rejected for determinism, image size, and flakiness; revisit only if the catalog gains a deterministic browser image.
- The standard library only: no lockfile. Loopback sockets are allowed by the harness, but the simulator stays in-process. Examples 51 to 75 (bounded concurrency and observability) follow plan 05's simulation convention (rules S1 to S9) with a virtual clock and a fixed seed set.
- A real-browser step (launching Chrome with `--remote-debugging-port`) is shown as `<!-- harness: illustration -->` because it launches a tool.

## Harness mode and toolchain

- **Harness mode**: Real mode, `python`, 75 example units, 8 kata units, 1 capstone unit.
- **Toolchain ids**: python (standard library only).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP3 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 8 fences (browser launch commands).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 95 runs (75 examples + 2 × 8 kata runs + 4 capstone runs) ≈ 6.3 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 21,102 (the larger of the word gap and the drilling shortfall), new unit folders 25.
- **Agent packets**: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 4**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: `networking-essentials` is outside this plan and stays. Re-check that the prose still uses WebSocket and HTTP basics from it (T1).
- In-plan prerequisites are audited first: `just-enough-python` in wave 1.
- Prerequisites outside this plan (unchanged here): `networking-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `browser-automation-with-cdp` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X5, X8, X11, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `browser-automation-with-cdp`; a course that fires is fixed, never baselined.
- [ ] Units: 75 example units, 8 kata units, 1 capstone unit (create 25, convert 59); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 fences (browser launch commands).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `browser-automation-with-cdp` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `browser-automation-with-cdp` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit browser-automation-with-cdp course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/browser-automation-with-cdp/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–25 (25): from "Launch Chrome with a Debug Port" to "Set a Cookie".
- **co-02 · intermediate** — examples 26–50 (25): from "Drive Multiple Tabs" to "Capstone Browser Service".
- **co-03 · advanced** — examples 51–75 (25): from "Create an Isolated Browser Context" to "Verify the Complete Local Service Flow".

## Lineage

- Written to the 2026 by-example convention as the browser-control course; it sits in the three software-engineer paths and, at baseline, in the AI Engineer path as an extension course.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 51 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 15 of 26 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 50 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 47 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — an extension course after plan 08; not part of the core closure.
