# 002 — Course Modes and Definition of Done

## Mode assignment across the 48 new courses

| Mode              | Courses | Rule applied                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| By Example        | 41      | The legacy source corpus already has 75 to 90-plus `### Example N: Title` headings, or the subject is a tool/language/framework best taught as many small, independently runnable scenarios (plan 06/07's own rule for choosing this mode).                                                                                                                                                                                                                                                    |
| Annotated-Concept | 7       | The legacy source corpus (or the merged set of small source topics) is naturally thematic — a handful of interlocking ideas, each needing a diagram and a worked case, rather than a long flat example list (`corporate-finance-essentials`, `practical-data-analytics`, `datomic-and-datalog-essentials`, `text-processing-with-awk-sed-and-jq`, `modern-frontend-meta-frameworks`, `frontend-styling-with-tailwind-and-radix-ui`, `typescript-advanced-tooling-zod-effect-trpc-and-xstate`). |

No course in this plan uses Primer, Annotated-Concept's no-code sub-mode, or Capstone as its own
top-level mode (every course still has its own capstone section, per the definition of done below; that
is a required section, not the course's teaching mode).

## Targets by mode (restated here so this plan is self-contained)

### By Example

| Target             | Value                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                             |
| Runnable examples  | Every example, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                   |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings |
| Diagrams           | at least 30 (band 30 to 50)                                                                              |
| Annotation density | 1.0 to 2.25 comment lines per code line                                                                  |
| Course words       | at least 28,000 (a plan estimate aligned with plans 06 to 09, not a gate rule)                           |
| Capstone           | `learning/capstone/overview.md` at least 800 words, plus `learning/capstone/code/` with a `run.yaml`     |
| Metadata           | `format`, `estimatedHours` from the drift-test message, `description`, `category`, no `status: outline`  |

### Annotated-Concept

| Target                         | Value                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Worked examples                | 48 in 9 themes (5/5/5, 6/6/6, 5/5/5; floor 45, band 45 to 60)                        |
| Pages                          | `learning/overview.md` plus nine theme pages; `### Worked Example N: Title` headings |
| Code-bearing runnable examples | at least 32 of 48, each with a `run.yaml`; at most 16 may be diagram- or table-only  |
| Diagrams                       | at least 10, at least one per theme                                                  |
| Course words                   | at least 22,000                                                                      |
| Capstone                       | same as By Example                                                                   |
| Metadata                       | same as By Example                                                                   |

### Drilling (both modes)

`drilling/overview.md` holds, in order: Recall Q&A (24 questions, one per concept, `<details>` answers),
Applied problems (at least 8), Code katas (at least 8 for By Example, at least 5 for Annotated-Concept,
each under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`), Self-check
checklist (24 "I can ..." items), Elaborative interrogation & self-explanation (at least 6 why/why-not
prompts). Floor: 5,000 words.

## Definition of done (series decision 27, restated)

A course is done when, and only when:

1. It meets its assigned mode's tutorial convention (above) plus drilling.
2. It passes its mode quality gate and the Content Quality Gate, each with `max-cycles` 2, with a
   verdict of `PASS` or `PASS_WITH_FINDINGS` and no blocking finding.
3. Every code example, kata, and capstone unit is green in the harness
   (`ayokoding-www:examples:check`), per [tech-docs/003](./003-code-harness-determinism-and-toolchain-additions.md).

A course that reaches the 2-cycle cap without a clean verdict is marked BLOCKED (not shipped with a
known defect); see [tech-docs/006](./006-execution-model-waves-and-ledger.md).

## The `in-the-field` format: defined, not used by this plan

Plan 03's `format` enum includes `in-the-field`, and before this plan no course in the catalog uses it
(noted as a gap in plan 06's tech-docs). Several legacy topics this plan migrates (Playwright, Go, Java,
Elixir, TypeScript) had their own `in-the-field/` track in the legacy tree, holding production-pattern
guides rather than leveled examples. This plan folds that material into the migrated course's By Example
structure as an additional cluster (for example, `playwright-end-to-end-testing`'s advanced cluster) rather
than giving any course a standalone `format: in-the-field`, because every one of those five legacy topics
also has a full by-example corpus of its own, and splitting one subject across two course entries (one
by-example, one in-the-field) would fragment a single learning subject into two catalog cards for no
reader benefit.

Because the format value exists in the schema and a later content plan may still want it, this plan
defines its course-level layout once, so the next plan that needs it does not have to invent one:

- `_index.md`, `overview.md` at the course root (same as every other format).
- `learning/overview.md`: what "in the field" means for this course and how to read a guide.
- `learning/in-the-field/overview.md` plus one `learning/in-the-field/guide-NN-<slug>.md` per guide,
  20 to 40 guides, 10 to 20 diagrams total (matching the tutorial-kinds adapter's in-the-field band).
- Each guide has four sections in order: `## The problem`, `## The pattern`, `## Trade-offs`,
  `## When not to use this`. A guide may include a code anchor with a `run.yaml`; where it illustrates a
  fragment, pseudo-code, or a broken example on purpose, the block carries `<!-- harness: illustration -->`
  instead (plan 05's existing rule, not a new one).
- No `beginner.md`/`intermediate.md`/`advanced.md` split (the content is not leveled); no theme pages
  (the content is not thematic in the Annotated-Concept sense).
- `drilling/overview.md` and a capstone section exist exactly as in every other format.

This definition is a design record for a future plan to adopt or revise; it does not obligate this plan to
use it, and no test added by this plan depends on it.
