# 002 — Capstone Course Contract and Modes

This page says what "done" means for one capstone course, which teaching mode each capstone uses and
why, and the measurable targets every brief in [../syllabus/courses/](../syllabus/courses/README.md)
refers to.

## Definition of Done

Series decision 27 (user, restated here on 2026-10-09): a course is done when it meets the
repository's tutorial convention for its mode, has a drilling section, passes its mode quality gate and
the Content Quality Gate with no blocking finding, and every code example is green in the code harness.
For a capstone that becomes ten checks. A capstone is done only when all ten hold:

| #   | Check                                                                                                                                                                                                                                                                 | How it is proven                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| D1  | The course follows its mode's shape: themes, counts, layout, `### Worked Example N:` (or `### Worked Scenario N:`) headings with context, takeaway, and "Why It Matters" of 50–100 words, annotation density 1.0–2.25 on code-bearing examples, no body H1            | The mode quality gate, `normal` mode, at most 2 cycles                                                                      |
| D2  | The course meets the word, example, diagram, and drilling targets below                                                                                                                                                                                               | The content-shape test in [006](./006-e2e-rebinding-and-testing-strategy.md) (words, headings, sections) plus the mode gate |
| D3  | The mode quality gate ends `PASS` or `PASS_WITH_FINDINGS` (no open CRITICAL, HIGH, or `needs-decision` finding)                                                                                                                                                       | The gate's final report, saved under `generated-reports/`                                                                   |
| D4  | The Content Quality Gate ends `PASS` or `PASS_WITH_FINDINGS` the same way                                                                                                                                                                                             | The gate's final report                                                                                                     |
| D5  | The course is opted into the code harness, every unit has a `run.yaml`, and `ayokoding-cli examples check --course <slug>` exits 0 (every run passes twice with identical output, no sync finding). The no-code course has no code and is "not applicable"            | The command's exit status and its JSON report; for the no-code course, a search that finds no `code/` folder                |
| D6  | The capstone contract holds: a project brief, milestones that each map to a stage run, acceptance criteria that each name the run that proves them, a rubric of six or more criteria, and a reference solution whose stage runs and `tests` run are green (see below) | The content-shape test (headings, AC table) plus `examples check` (the reference solution)                                  |
| D7  | `status: outline` is gone; `format: capstone`, `category`, `description`, and `estimatedHours` are set and valid; `prerequisites` equal the list in the course brief                                                                                                  | Plan 03's metadata drift test passes; the prerequisite check in [003](./003-prerequisites-readiness-and-ordering.md)        |
| D8  | Every external claim has a source with an access date in the course's `## References` section, and every stated standard is the one in force (or the course states its effective date)                                                                                | The Content Quality Gate's factual check, and the accuracy notes in each brief                                              |
| D9  | The course-level coupling rule holds (links, restated concepts, no imports from a prerequisite, `relies-on` table), and the three security-flavoured courses keep their safety boundary                                                                               | The coupling check in the content-shape test, and the safety checks in [004](./004-code-harness-and-determinism-design.md)  |
| D10 | Generated `_index.md` files are up to date, and the course renders on the dev server at its URL, and its path pages show it without an "Outline" badge                                                                                                                | `generate-indexes` leaves no diff; manual browser check on port 3101 in [../delivery.md](../delivery.md)                    |

A course that cannot meet D3, D4, or D5 within 2 cycles is **BLOCKED**. It keeps `status: outline`, is
recorded in the execution ledger with its open findings, and is reported to the user. The batch moves
on. The handling is in [007](./007-execution-model.md#blocked-courses).

### What "capstone contract" (D6) means

Every capstone page `learning/capstone/overview.md` has these H2 headings, in this order (the
content-shape test looks for them by exact text):

1. `## Project brief` — who you are, what you build, what it must do, in plain words.
2. `## Milestones` — a table; each row names its theme and the capstone-unit run that is its
   checkpoint (the no-code course names the document instead).
3. `## Acceptance criteria` — a table with an ID, a criterion, and the **proof run**. A criterion with no
   proof run is a finding. Standard courses: 8–13 criteria. The no-code course: 8 criteria, each a
   checkable property of a named document.
4. `## Rubric` — levels 0 to 3; a pass needs every criterion at level 2 or higher and every acceptance
   criterion green; at least six criteria.
5. `## Evidence to keep` — what the learner keeps: logs, outputs, documents.
6. `## Extensions` — optional work, not graded and not run.

The three security-flavoured courses add `## Safety boundary` to the course `overview.md`, before
the first lesson link. Each standard course's capstone unit holds a **reference solution**: the
finished project, in the `learning/capstone/code/` unit, that makes every stage run and the `tests`
run pass. The lessons teach toward it, and its green run is the proof that the acceptance criteria are
achievable.

## Mode Selection

The repository has four tutorial modes. Their rules live in
`repo-governance/development/quality/gate-adapters/ayokoding-www/tutorial-kinds.md`. There is no
"capstone" mode. The catalog label `format: capstone` (plan 03) tells a reader the course is an
integration project; it does not say how the course teaches. Every capstone therefore declares one of
the four real modes, and the declaration sits in `learning/overview.md` under `## How this course is
organized` (the maker and the checker both read the mode from there, as the skill says the "format
designation" must be stated explicitly in the syllabus).

Plan 03's rule R3 reads a course's mode from its `format` field when that field is `annotated-concept` or
`annotated-concept-no-code`. For `format: capstone` it has nothing to read, so rule CC1 in
[009](./009-rule-and-docs-impact.md) adds the clause for capstones: the mode is the one declared in
`learning/overview.md`. All eight courses keep `format: capstone`, including the no-code course, so the
catalog shows one label for every capstone.

| Mode                                | What it is for                                                                                         | Used here?                                                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| By Example (`by-example`)           | 75–85 short examples, each in five parts, per language or tool                                         | No. A capstone adds no new syntax. Seventy-five examples would repeat each prerequisite's own examples; the value of a capstone is the seams between them                                                                                      |
| Annotated Concept, standard         | 45–60 worked examples in themes; code where it proves the point; density band on code-bearing examples | Yes, 7 courses: each worked example is one seam with one verifiable claim, and the themes follow the project's milestones                                                                                                                      |
| Annotated Concept, no-code sub-mode | 20–30 scenarios with a decision artifact and no `code/` folder, for leadership and governance topics   | Yes, 1 course (`capstone-lead-at-altitude`): every deliverable is a decision document                                                                                                                                                          |
| Primer                              | `just-enough-<x>/` language primers                                                                    | No. These are integration courses, not language on-ramps                                                                                                                                                                                       |
| In the Field                        | 20–40 production guides for one language under `<language>/in-the-field/`                              | No. The site's course layout has no `in-the-field/` track, and the project spans several courses, not one language                                                                                                                             |
| A new "capstone" mode               | A dedicated mode, checker, and fixer for projects                                                      | Rejected. It would need a new maker, checker, fixer, and workflow, a rule-module change in plan 05's propagation, and a gate-adapter update for eight courses. The decision record D1 in [008](./008-decision-records.md) has the alternatives |

The rule used to pick between standard and no-code:

- **Standard** when the deliverable is software a reader can run, and each worked example can be proven
  by a run.
- **No-code** when the deliverables are documents and the "run" is a review against criteria. The
  adapter assigns leadership and governance topics to the no-code sub-mode.

| Pos | Course                                   | Mode                        | Reason (short; the full reason is in the course brief)                                                                   |
| --- | ---------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | `capstone-build-your-own-coding-agent`   | Annotated Concept, standard | Each example is one seam of an agent (provider, tools, permissions, context, trace) with one claim a run can prove       |
| 2   | `capstone-data-pipeline`                 | Annotated Concept, standard | The layers (bronze, silver, gold) and their quality gates are design decisions, each proven by a query or a count        |
| 3   | `capstone-concurrency-and-systems`       | Annotated Concept, standard | Pools, cancellation, readiness, and SLOs are simulated in Go and judged by invariants                                    |
| 4   | `capstone-concurrency-showdown`          | Annotated Concept, standard | The comparison is the point: the same workload in Go and in Elixir, with one invariant each                              |
| 5   | `capstone-lead-at-altitude`              | Annotated Concept, no-code  | Five decision documents over a constructed case; no code anywhere                                                        |
| 6   | `capstone-secure-service`                | Annotated Concept, standard | Six weaknesses are reproduced, fixed, and detected; each example is an exploit test then a fix test                      |
| 7   | `capstone-build-your-own-pentest-engine` | Annotated Concept, standard | A scope-guarded assessment engine against a fixture lab; each example proves a safety or evidence property               |
| 8   | `capstone-real-world-delivery`           | Annotated Concept, standard | Architecture, events, delivery, and security joined; some examples are validators of IaC, some are Python on the service |

Totals: 7 standard, 1 no-code. The mode for each course is fixed by this plan. A maker may not switch
modes; a course that does not fit its mode after 2 cycles is BLOCKED and the mode question goes to the
user.

## Example Targets

| Target                  | Standard                                                                                  | No-code                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Worked items            | Floor 45, band 45–60, as `### Worked Example N: Title`; this plan uses 45 (5 themes of 9) | Floor 20, band 20–30, as `### Worked Scenario N: Title`; this plan uses 24 (4 themes of 6) |
| Pages                   | Five theme pages, `theme-a-<slug>.md` to `theme-e-<slug>.md`                              | Four theme pages, `theme-a-<slug>.md` to `theme-d-<slug>.md`                               |
| Code-bearing examples   | All 45; each is a harness unit `learning/code/ex-NN-<slug>/`                              | None; no `code/` folder anywhere in the course                                             |
| Diagrams                | At least 5, one per theme (this plan's target; the adapter sets no band for this mode)    | At least 4, one per theme                                                                  |
| Overview of `learning/` | A theme list with one bullet per worked example                                           | A theme list with one bullet per scenario                                                  |
| Capstone                | `learning/capstone/overview.md` plus `learning/capstone/code/` (one unit)                 | `learning/capstone/overview.md`, no code                                                   |
| Katas                   | 5, each a unit `drilling/code/kata-NN-<slug>/{before,after}/`                             | 5 design exercises with worked answers (no code)                                           |

All counts are floors, never caps. A course is never split or merged to hit a number. The maker may add
examples up to the band's ceiling of 60; every added example needs its own unit and `run.yaml`.

## Word and Hour Targets

The floors come from the minimum part lengths in the mode rules and from the measured size of
comparable existing courses. Words are counted over every Markdown page of the course, code blocks
included, frontmatter excluded.

| Part                                                                | Standard          | No-code          |
| ------------------------------------------------------------------- | ----------------- | ---------------- |
| One item at minimum length                                          | about 290 words   | about 380 words  |
| — context or scenario set-up                                        | 60                | 80               |
| — annotated code, or the filled-in decision artifact (density 1.0+) | 150               | 150              |
| — key takeaway (1–2 sentences)                                      | 20                | 20               |
| — "Why It Matters" (50–100 words)                                   | 50                | 50               |
| — heading, label, output                                            | 10                | 80               |
| All items at the floor                                              | 45 × 290 = 13,050 | 24 × 380 = 9,120 |
| Overviews (course, learning, theme intros)                          | about 2,250       | about 1,200      |
| Capstone page (brief, milestones, criteria, rubric, evidence)       | about 2,500       | about 2,500      |
| Drilling page                                                       | at least 5,000    | at least 5,000   |
| **Sum, rounded up to the next thousand**                            | **23,000**        | **18,000**       |

Why 23,000 and 18,000 and not the 28,000 or 22,000 of the accounting plan: a capstone has fewer, larger
ideas than a domain course, so the example count is the mode floor (45), but the capstone page carries
real weight (a brief, five milestones, criteria, and a rubric) and the drilling page is the same size.
The measured benchmark on 2026-10-09 (existing Annotated Concept courses with at least 4 estimated
hours) ranges from 17.6k to 26k words, with a median near 21.5k. 23,000 sits above the median and
inside the range; 18,000 for the no-code course sits at the low end, which is right for a course with
no code. The quality gates, not the word count, judge whether the writing is good.

Decision 40 also needs every course above 1,000 words; the floors exceed that by far. The skeletons
today total 2,143 words in their 24 hand-written pages (whitespace-split tokens, frontmatter excluded),
between 216 and 395 words per course.

### Expected hours

`estimatedHours` is never estimated by hand. After a course passes D5, run plan 03's metadata drift
test; it prints `Expected estimatedHours for every non-outline course:` followed by one line per
course. Copy the course's number. Plan 03's formula is
`max(1, round((proseWords / 200 + max(inlineCodeLines, codeFileLines) / 10) / 60))`.

A worked check for a standard course: about 15,000 prose words give 75 minutes of reading, and about
3,000 lines of code (45 examples of about 35 lines, a capstone unit of about 900 lines) give 300
minutes of doing; the sum is 375 minutes, which rounds to 6 hours. The no-code course: 18,000 words give
90 minutes and no code, which rounds to 2.

The brief of each course states an **expected range**. The range is a sanity check, not a target. If
the printed value falls outside the range, the maker does not edit the number: the executor looks for a
missing section (too low) or a bloated one (too high), records the cause in the ledger, and keeps the
printed value.

| Course                                   | Expected range (hours) |
| ---------------------------------------- | ---------------------- |
| `capstone-build-your-own-coding-agent`   | 6–10                   |
| `capstone-data-pipeline`                 | 6–9                    |
| `capstone-concurrency-and-systems`       | 5–8                    |
| `capstone-concurrency-showdown`          | 5–8                    |
| `capstone-lead-at-altitude`              | 2                      |
| `capstone-secure-service`                | 6–10                   |
| `capstone-build-your-own-pentest-engine` | 6–10                   |
| `capstone-real-world-delivery`           | 7–11                   |

## Drilling Targets

Drilling is the second half of decision 27. All drill sections live in `drilling/overview.md`, as in
`sql-essentials`; katas live in `drilling/code/kata-NN-<slug>/before/` and `.../after/`.

| Drill section (exact H2 heading)                  | Floor | Notes                                                                                                                                              |
| ------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `## Recall Q&A`                                   | 24    | One or more per concept; each answer in a `<details>` block                                                                                        |
| `## Applied problems`                             | 8     | A short scenario, the task, and a worked answer in `<details>`                                                                                     |
| `## Code katas`                                   | 5     | A broken `before/` and a fixed `after/`, each a harness unit; the `before` run expects a non-zero exit. The no-code course uses 5 design exercises |
| `## Self-check checklist`                         | 24    | "I can …" items, one or more per concept                                                                                                           |
| `## Elaborative interrogation & self-explanation` | 6     | Why and why-not prompts: a design choice and a rejected alternative, with a model answer                                                           |
| Drilling words                                    | 5,000 | Counted over `drilling/overview.md`                                                                                                                |

The headings are the exemplars' own, so the content-shape test can find each section. The floors repeat
the values that at least two exemplar courses reach (`sql-essentials`, `statistics-for-evaluation`, and
`backend-essentials`).

## Metadata

Each course's `_index.md` frontmatter ends in this shape (plan 03's schema; values per course):

```yaml
title: "Capstone · Build Your Own Coding Agent"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1005
prerequisites:
  [
    "just-enough-python",
    "the-agent-loop",
    "agent-tools-and-mcp",
    "agent-context-and-memory",
    "agent-permissions-and-sandboxing",
    "agent-orchestration-subagents-and-observability",
    "async-python-and-fastapi-services",
    "software-engineering-practices",
  ]
category: ai-engineering
description: "Combine the agent courses into a small local coding assistant."
format: capstone
estimatedHours: 0 # placeholder: replaced by the value the drift test prints
```

- `status: outline` is deleted (plan 02 added it to these eight courses).
- `format: capstone` is the catalog label. It is set for all eight; it is not a teaching mode.
- `category` and `description` keep plan 03's values; the maker changes a description only if the
  course brief's objectives no longer fit it, and records why in the ledger.
- `estimatedHours` follows the drift test as above. The placeholder is a valid value for the schema
  only while the course is not yet marked done.
- `prerequisites` change as listed in
  [003](./003-prerequisites-readiness-and-ordering.md#prerequisite-rubric-re-run).
- `title`, `date`, and `weight` stay as plan 01 and plan 03 left them.

## File Layout per Course

Standard course (7 of the 8):

```text
content/en/learn/courses/<slug>/
├── _index.md                       generated body, hand-edited frontmatter
├── overview.md                     250–400 words; the Safety boundary (security courses); ends with ## References
├── learning/
│   ├── _index.md                   generated
│   ├── overview.md                 prerequisites, relies-on table, big idea, how this course is organized (mode), theme list
│   ├── theme-a-<slug>.md           9 worked examples
│   ├── theme-b-<slug>.md …
│   ├── theme-e-<slug>.md
│   ├── capstone/
│   │   ├── _index.md               generated
│   │   ├── overview.md             the six required headings
│   │   └── code/                   ONE capstone unit: run.yaml, reference solution, tests, expected/
│   └── code/
│       └── ex-NN-<slug>/           one harness unit per worked example
└── drilling/
    ├── _index.md                   generated
    ├── overview.md                 every drill section
    └── code/
        └── kata-NN-<slug>/{before,after}/
```

No-code course (`capstone-lead-at-altitude`):

```text
content/en/learn/courses/capstone-lead-at-altitude/
├── _index.md
├── overview.md
├── learning/
│   ├── _index.md
│   ├── overview.md
│   ├── theme-a-reading-the-posture.md … theme-d-cadence-and-communication.md
│   └── capstone/{_index.md, overview.md}
└── drilling/{_index.md, overview.md}
```

`NN` is the two-digit example number (`ex-07-…`, `ex-45-…`); the band ends at 60. A course never has a
top-level `code/` folder, a flat `ex-NN-<slug>.<ext>` file, or code under a theme folder: plan 05 reports
each as a layout finding.

### Required headings in `learning/overview.md`

`## Prerequisites` (prior courses as links, tools and environment, assumed knowledge),
`## What this course relies on` (the `relies-on` table: prerequisite course, the concept names the course
uses, and where it first uses each), `## Why this exists — the big idea`, and
`## How this course is organized` (the mode in words, the item count, the theme list). The first
sentence of the last section is the mode declaration, in one of two exact forms: "This is an
annotated-concept course (standard mode) with 45 worked examples in five themes." or "This is an
annotated-concept course (no-code mode) with 24 worked scenarios in four themes."

## Gate Settings

| Gate                                    | Agent pair                                                                | Inputs                                                        |
| --------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Tutorial Annotated Concept Quality Gate | `tutorial-annotated-concept-checker` / `tutorial-annotated-concept-fixer` | `subject`: the course folder; `mode: normal`; `max-cycles: 2` |
| Content Quality Gate                    | `content-checker` / `content-fixer`                                       | Same                                                          |
| Plan quality gate (deferred)            | `plan-checker` / `plan-fixer`                                             | `max-cycles: 2`; runs once at the start of execution          |

`normal` blocks on CRITICAL and HIGH findings. `max-cycles: 2` is the user's cap from 2026-10-09
("semua jadi 2 aja"): every gate and every maker-checker loop in this plan stops after its second
cycle. It replaces the repository default of 3 that decision 29 first recorded. A gate's verdict never
stops the plan; the executor reads the verdict and applies the BLOCKED rule.
