# Information Architecture and SEO (Annotated Concept (standard))

**Course ID**: `information-architecture-and-seo` · **Format**: Annotated Concept (standard) · **Family**: application-development.

**Scope note**: Audits and fixes the existing `information-architecture-and-seo` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Structuring web content so people, search engines, and screen readers can use it: information architecture systems, navigation, document outline, sitemaps, metadata, structured data, and URL signals.

## Why this exists · the big idea

- **The problem before the solution**: 53 worked examples hold 24 fences in 6,948 words, 24 of the 57 files are the only code, the filler guard fires FG6 (repeated-paragraph share 0.34), and no example has an executable check.
- **Keep-this-if-you-forget-everything**: Findability is a set of rules over files; every rule here is a short check that reads a page, a sitemap, or a JSON-LD block.

## Prerequisites

- **Prior courses**: `frontend-essentials`, `advanced-frontend` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (standard). **Reason**: Annotated Concept (standard), as plan 03 records it: 53 numbered examples are concept-first, and the code-bearing ones (HTML, XML, JSON-LD, sitemaps) are artifacts a script can check.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md`, worked-example pages (by theme), and `learning/capstone/`; CP-1 checks the layout against the mode checker. Example headings per page today: `learning/advanced.md` (15), `learning/beginner.md` (18), `learning/intermediate.md` (20).
- **Wave**: 10 (slot 3); **size class**: L (words to write 15,052, new unit folders 6); **expected defect classes**: 11 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                          | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 6,948                                                                                                                                    | at least 22,000                                                                                                                                                      | 15,052 to write                 |
| Examples as `### Worked Example N: Title`                     | 0 (53 more in the wrong form)                                                                                                            | at least 45, numbered 1 to N without gaps                                                                                                                            | none; rename the headings       |
| Mermaid diagrams                                              | 4                                                                                                                                        | at least 10 (this plan's target)                                                                                                                                     | 6 to add                        |
| "Why It Matters" (50 to 100 words each)                       | 53 of 53 present; 53 under 50 words; 0 over 100; median 43 words                                                                         | one per example, 50 to 100 words                                                                                                                                     | 53 to write or fix              |
| Annotation density (comment lines per code line)              | median 0.0; 19 examples below 1.0; 0 above 2.25 (of 24 code-bearing)                                                                     | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 19 to fix                       |
| Code fences                                                   | 24 code fences in the lessons; 24 unanchored                                                                                             | every code fence anchored or marked as an illustration (budget: 6 at most; search-console and browser-extension steps)                                               | 24 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                     | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                            | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 53 example folders, 0 kata folders, 57 code files, 0 `run.yaml`                                                                          | 53 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 6, convert 53            |
| Drilling page                                                 | 181 words; 1 of 5 standard `##` sections exact; 3 `<details>` blocks; headings found: Recall Q&A, Scenario Judgment, Hands-On Repetition | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,819 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                           | at least 5 as `before`/`after` units                                                                                                                                 | 5                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                   | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 57 code files (53 example folders, 0 kata folders, 0 test-like files); none has a `run.yaml`.
- **X3** 24 of 24 code fences are neither anchored nor marked as illustrations.
- **X5** The three level pages hold 53 examples in 2,432, 2,217, and 1,758 words (about 120 words per example); the learning overview is 126 words and lists no theme pages.
- **X6** 53 headings use `### Example N: Title` in an Annotated Concept course (the form is `### Worked Example N: Title`).
- **X8** 53 "Why It Matters" blocks present: 53 under 50 words, 0 over 100, median 43 words.
- **X9** Annotation density: median 0.0; 19 examples below 1.0 and 0 above 2.25 (of 24 code-bearing).
- **X10** The `=>` result notation appears in 8 of 24 code fences.
- **X11** Drilling: 181 words (4,819 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 5.
- **X13** 6,948 words against a floor of 22,000; 15,052 to write.
- **X14** The plan 09 filler guard lists this course (owner `plan-13`): FG6 fires with a repeated-paragraph share of 0.34 (limit 0.25) on 2026-10-09; the stub share is 0.66 (FG4 needs 0.80, so it does not fire, but 35 of 53 programs are short).
- **X20** 4 Mermaid diagrams against this plan's floor of 10.
- **Filler baseline**: the course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Keep the 53 examples and group them into theme pages; make at least 27 code-bearing (HTML, XML, JSON-LD, robots, sitemaps) with a Python check that reads each artifact (`html.parser`, `xml.etree`, `json`) and prints findings.
- Rewrite example bodies so no closing paragraph repeats across examples (FG6) and remove the `information-architecture-and-seo` entry from `FILLER_BASELINE` in the same commit.
- Anchor the 24 fences, add the 5 exact drilling sections with 5 kata units, add diagrams (4 today, 10 needed), and write the missing 15,052 words.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only (the single `node:http` file becomes a Python check).
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Illustration budget**: at most 6 (search-console and browser-extension steps).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 66 runs (53 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 4.4 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 15,052 (the larger of the word gap and the drilling shortfall), new unit folders 6.
- **Estimated effort** (size, not time): class L; agent packets: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 10**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `frontend-essentials` in wave 1, `advanced-frontend` in wave 2.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `information-architecture-and-seo` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=information-architecture-and-seo:annotated-concept` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X3, X5, X6, X8, X9, X10, X11, X13, X14, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `information-architecture-and-seo`; a course that fires is fixed, never baselined.
- [ ] Units: 53 example units, 5 kata units, 1 capstone unit (create 6, convert 53); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 (search-console and browser-extension steps).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `information-architecture-and-seo` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `information-architecture-and-seo`.
- [ ] CP-6 The registry row for `information-architecture-and-seo` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit information-architecture-and-seo course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `information-architecture-and-seo` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "information-architecture-and-seo" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/information-architecture-and-seo/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–18 (18): from "Name the Four IA Systems" to "Inspect the Document Outline".
- **co-02 · intermediate** — examples 19–38 (20): from "Publish a Valid XML Sitemap" to "Align Every URL Signal".
- **co-03 · advanced** — examples 39–53 (15): from "Model an Article in JSON-LD" to "Assemble a Discoverable Site".

## Lineage

- Builds on: `frontend-essentials`, `advanced-frontend`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 49 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 36 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 39 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
