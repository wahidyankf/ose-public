# 002 — Course Modes and Definition of Done

This page says what "done" means for one accounting course, which teaching mode each course uses and
why, and the measurable targets every course brief in [../syllabus/courses/](../syllabus/courses/README.md)
refers to.

## Definition of Done

Series decision 27 (user, restated here on 2026-10-09): a course is done when it meets the
repository's tutorial convention for its mode, has a drilling section, passes its mode quality gate
and the Content Quality Gate with no blocking finding, and every code example is green in the code
harness. For this plan that becomes ten checks. A course is done only when all ten hold:

| #   | Check                                                                                                                                                                                                   | How it is proven                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | The course follows its mode's shape: parts, counts, layout, headings, `=>` annotation, annotation density 1.0–2.25 on code-bearing examples, "Why It Matters" of 50–100 words, no body H1               | The mode quality gate, `normal` mode, at most 2 cycles                                                                                    |
| D2  | The course meets the word, example, diagram, and drilling targets below                                                                                                                                 | The content-shape test in [007](./007-testing-strategy.md) (words, example headings, drilling sections) plus the mode gate (diagram band) |
| D3  | The mode quality gate ends `PASS` or `PASS_WITH_FINDINGS` (no open CRITICAL, HIGH, or `needs-decision` finding)                                                                                         | The gate's final report, saved under `generated-reports/`                                                                                 |
| D4  | The Content Quality Gate ends `PASS` or `PASS_WITH_FINDINGS` the same way                                                                                                                               | The gate's final report                                                                                                                   |
| D5  | The course is opted into the code harness, every code unit has a `run.yaml`, and `ayokoding-cli examples check --course <slug>` exits 0 (every run passes twice with identical output, no sync finding) | The command's exit status and its JSON report                                                                                             |
| D6  | `status: outline` is gone; `format`, `category`, `description`, and `estimatedHours` are set and valid                                                                                                  | Plan 03's metadata drift test passes                                                                                                      |
| D7  | Every external claim has a source with an access date in the course's References section, and every stated standard is the one in force (or the course states its effective date)                       | The content gate's factual check, and for the Sharia courses the rules in [004](./004-sharia-content-policy-and-sources.md)               |
| D8  | The five Sharia courses follow the Sharia content rules in [004](./004-sharia-content-policy-and-sources.md)                                                                                            | The content-shape test (disclaimer sentence, callout form) plus the content gate                                                          |
| D9  | Generated `_index.md` files are up to date                                                                                                                                                              | `generate-indexes.ts` leaves no diff                                                                                                      |
| D10 | The course renders on the dev server at its URL, and its path pages show it without an "Outline" badge                                                                                                  | Manual browser check on port 3101 in [../delivery.md](../delivery.md)                                                                     |

A course that cannot meet D3, D4, or D5 within 2 cycles is **BLOCKED**. It keeps `status: outline`, is
recorded in the execution ledger with its open findings, and is reported to the user. The batch moves
on. The handling is in [006](./006-execution-model.md#blocked-courses).

## Mode Selection

The repository has four tutorial modes. Their rules live in
`repo-governance/development/quality/gate-adapters/ayokoding-www/tutorial-kinds.md`.

| Mode                                    | What it is for                                                                                                                   | Used here?                                                                                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| By Example (`by-example`)               | 75–85 short examples, each in five parts: brief explanation, diagram when useful, annotated code, key takeaway, "Why It Matters" | Yes, 11 courses: every concept is a rule a reader can run and break                                                                                                                                                      |
| Annotated Concept (`annotated-concept`) | 45–60 worked examples in themes; code only where it proves the point; the density band applies only to code-bearing examples     | Yes, 13 courses: the course builds judgement or compares standards, so some ideas are clearer as annotated tables and diagrams                                                                                           |
| Annotated Concept, no-code sub-mode     | 20–30 scenarios with no `code/` folder, for leadership and governance topics                                                     | No. Every accounting course is for engineers who build these systems, so each one has code to run. Even the two most comparative courses (IFRS vs US GAAP, and Sharia standards) produce schedules and registers in code |
| Primer                                  | `just-enough-<x>/` language primers                                                                                              | No. These are domain courses, not language primers                                                                                                                                                                       |
| In the Field                            | 20–40 production guides for one language under `<language>/in-the-field/`                                                        | No. The site's course layout has no `in-the-field/` track, and the content is domain teaching, not language production guides                                                                                            |

The rule used to pick between the two modes that fit:

- **By Example** when the course is a sequence of mechanisms (posting rules, matching, costing,
  conversion, ledger guarantees) and each one has a good input and a bad input a reader can run.
- **Annotated Concept** when the course is mostly reasoning (frameworks, judgement, comparisons,
  specifications) and roughly half of the ideas are better as annotated tables, statements, or
  diagrams, with Python where a computation or a check makes the point.

| Pos | Course                                         | Mode              | Reason (short; the full reason is in the course brief)                                                  |
| --- | ---------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | `accounting-foundations`                       | annotated-concept | Vocabulary and mental models; T-account tables and diagrams, code where it proves a point               |
| 2   | `chart-of-accounts-and-data-modeling`          | by-example        | Every concept is a schema rule or query a reader can run and break                                      |
| 3   | `journal-entries-and-posting-mechanics`        | by-example        | A sequence of engine rules, each accepting good input and refusing bad input                            |
| 4   | `financial-statements-and-close-cycle`         | annotated-concept | Statement layouts and the close process are annotated statements and process diagrams                   |
| 5   | `accrual-accounting-and-revenue-recognition`   | annotated-concept | The five-step model is a reasoning framework, then a Python schedule                                    |
| 6   | `accounts-payable-and-procure-to-pay`          | by-example        | A document workflow with precise rules                                                                  |
| 7   | `accounts-receivable-and-order-to-cash`        | by-example        | Credit check, matching, ageing, and provisions are runnable rules                                       |
| 8   | `managerial-and-cost-accounting`               | annotated-concept | Decision models, many clearest as tables and charts                                                     |
| 9   | `fixed-assets-and-depreciation`                | by-example        | Depreciation is computation; every rule is a schedule                                                   |
| 10  | `inventory-and-cogs-accounting`                | by-example        | Inventory costing is algorithmic, with observable layers                                                |
| 11  | `lease-and-intangible-asset-accounting`        | annotated-concept | Judgement (is it a lease?) plus present-value schedules                                                 |
| 12  | `multi-currency-accounting-and-fx-translation` | by-example        | Precise computation with many edge cases                                                                |
| 13  | `consolidation-and-multi-entity-accounting`    | annotated-concept | Judgement on control and scope plus worksheet mechanics                                                 |
| 14  | `financial-reporting-standards-ifrs-vs-gaap`   | annotated-concept | Comparative reasoning; side-by-side tables, code where two frameworks give different schedules          |
| 15  | `audit-controls-and-compliance`                | annotated-concept | Risk and control tables paired with Python checks that produce evidence                                 |
| 16  | `payroll-and-tax-accounting-essentials`        | annotated-concept | Rule interpretation plus calculation engines; deferred tax needs narrative first                        |
| 17  | `treasury-and-cash-management`                 | by-example        | Data flows (files in, matches, files out) learned by running each step                                  |
| 18  | `financial-reporting-and-xbrl`                 | annotated-concept | Half the material explains specification structures, not behaviour                                      |
| 19  | `general-ledger-system-architecture`           | by-example        | Ledger guarantees convince only when the reader sees the database refuse or the test catch the bug      |
| 20  | `sharia-accounting-and-aaoifi-standards`       | annotated-concept | Frameworks, sources, and differences of opinion; code for the effective-date register and policy model  |
| 21  | `islamic-contract-modeling-for-systems`        | by-example        | Contract sequencing is learned by watching the model refuse an out-of-order step                        |
| 22  | `zakah-computation-and-reporting-for-systems`  | annotated-concept | Each method needs an annotated explanation with sources before the engine computes it                   |
| 23  | `sukuk-and-islamic-capital-markets-accounting` | annotated-concept | Structures need annotated diagrams of parties, assets, and cash flows before computation                |
| 24  | `sharia-ledger-system-architecture`            | by-example        | Ledger guarantees (no interest posting, reproducible allocation, separate funds) convince only when run |

Totals: 11 By Example, 13 Annotated Concept. The mode for each course is fixed by this plan. A maker
may not switch modes; a course that does not fit its mode after 2 cycles is BLOCKED and the mode
question goes to the user.

## Example Targets

| Target                  | By Example                                                              | Annotated Concept                                                                                |
| ----------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Examples                | Floor 75, band 75–85, as `### Example N: Title`                         | Floor 45, band 45–60, as `### Worked Example N: Title`                                           |
| Pages                   | `beginner.md` (1–25), `intermediate.md` (26–50), `advanced.md` (51–75+) | Five theme pages, `theme-a-<slug>.md` to `theme-e-<slug>.md`, about 9 worked examples each       |
| Code-bearing examples   | All                                                                     | At least 27 (60%); at least 23 (about half) in the two comparative courses, positions 14 and 20  |
| Diagrams                | 30–50 Mermaid diagrams (the adapter band)                               | At least 10, at least one per theme (this plan's target; the adapter sets no band for this mode) |
| Overview of `learning/` | `## Examples by Level` with one bullet per example, en-dash ranges      | A theme list with one bullet per worked example                                                  |
| Capstone                | `learning/capstone/overview.md` plus `learning/capstone/code/`          | Same                                                                                             |

All counts are floors, never caps. They are measured, not delivery boundaries: a course is never split
or merged to hit a number.

## Word Targets

The floors come from the minimum part lengths in the mode rules, not from a wish for long pages. Words
are counted over every Markdown page of the course, code blocks included, frontmatter excluded.

| Part                                                      | By Example        | Annotated Concept |
| --------------------------------------------------------- | ----------------- | ----------------- |
| One example at minimum length                             | about 270 words   | about 290 words   |
| — explanation (2–3 sentences, or a short context)         | 40                | 60                |
| — annotated code or annotated table (density 1.0 or more) | 150               | 150               |
| — key takeaway (1–2 sentences)                            | 20                | 20                |
| — "Why It Matters" (50–100 words)                         | 50                | 50                |
| — heading and output label                                | 10                | 10                |
| All examples at the floor                                 | 75 × 270 = 20,250 | 45 × 290 = 13,050 |
| Overviews (course, learning, theme intros)                | about 1,000       | about 1,750       |
| Capstone page                                             | about 1,500       | about 1,500       |
| Drilling page                                             | at least 5,000    | at least 5,000    |
| **Sum, rounded up to the next thousand**                  | **28,000**        | **22,000**        |

For comparison, the two exemplars measured on 2026-10-09 are `sql-essentials` (By Example, 80
examples, 51,943 words) and `statistics-for-evaluation` (Annotated Concept, 46 worked examples, 54,322
words). The floors sit near half of the exemplars, so a course that meets every part length passes,
and the quality gates, not the word count, judge whether the writing is good.

Decision 40 also needs every course above 1,000 words; the floors above exceed that by far.

## Drilling Targets

Drilling is the second half of decision 27. All drill sections live in `drilling/overview.md`, as in
`sql-essentials`; katas live in `drilling/code/kata-NN-<slug>/before/` and `.../after/`.

| Drill section (exact H2 heading)                  | Floor                                 | Exemplar counts (sql-essentials / statistics-for-evaluation / backend-essentials) | Notes                                                                                                                         |
| ------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `## Recall Q&A`                                   | 24                                    | 24 / 24 / 24                                                                      | One or more per concept; each answer in a `<details>` block                                                                   |
| `## Applied problems`                             | 8                                     | 12 / 8 / 16                                                                       | A short scenario, the task, and a worked answer in `<details>`                                                                |
| `## Code katas`                                   | 8 (By Example), 5 (Annotated Concept) | 8 / 5 / 19                                                                        | A broken `before/` and a fixed `after/`, each a harness unit; the names are in each course brief                              |
| `## Self-check checklist`                         | 24                                    | 25 / 24 / 26                                                                      | "I can …" items, one or more per concept                                                                                      |
| `## Elaborative interrogation & self-explanation` | 6                                     | 6 / 6 / none                                                                      | Why and why-not prompts: a design choice and a rejected alternative, with a model answer                                      |
| `## Sharia board decision spotting`               | 6 (Sharia courses only)               | —                                                                                 | Scenarios where the reader names the decision a Sharia board must make; see [004](./004-sharia-content-policy-and-sources.md) |
| Drilling words                                    | 5,000                                 | —                                                                                 | Counted over `drilling/overview.md`                                                                                           |

Each floor is a value that at least two of the three exemplars reach. The headings are the exemplars'
own, so the content-shape test in [007](./007-testing-strategy.md) can find each section.

## Metadata

Each course's `_index.md` frontmatter ends in this shape (plan 03's schema; values per course):

```yaml
title: "Journal Entries and Posting Mechanics"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1102
prerequisites: ["accounting-foundations", "chart-of-accounts-and-data-modeling", "just-enough-python"]
category: accounting
description: "Write and post journal entries with the right accounts, dates, and evidence."
format: by-example
estimatedHours: 0 # placeholder: replaced by the value the drift test prints
```

- `status: outline` is deleted.
- `format` is `by-example` or `annotated-concept`, as in the table above.
- `category: accounting` and `description` keep plan 03's values. The 24 descriptions, as plan 03 wrote
  them, already describe the rewritten courses; the maker changes one only if the course brief's
  objectives no longer fit it, and records why in the ledger.
- `estimatedHours` is never estimated by hand. After a course passes D5, run the metadata drift test.
  It prints `Expected estimatedHours for every non-outline course:` followed by one line per course;
  copy the course's number. The formula (plan 03) is
  `max(1, round((proseWords / 200 + max(inlineCodeLines, codeFileLines) / 10) / 60))`.
- `prerequisites` change as listed in [005](./005-path-restructure-and-integrity.md#prerequisite-changes).
- `weight` changes for two courses only: `journal-entries-and-posting-mechanics` becomes 1102 and
  `financial-statements-and-close-cycle` becomes 1103, so the catalog order matches the path order.
  The `date` keys stay as they are.

## File Layout per Course

```text
content/en/learn/courses/<slug>/
├── _index.md                       generated body, hand-edited frontmatter
├── overview.md                     150–400 words, what the course is and who it is for
├── learning/
│   ├── _index.md                   generated
│   ├── overview.md                 Examples by Level (By Example) or the theme list (Annotated Concept)
│   ├── beginner.md | theme-a-<slug>.md
│   ├── intermediate.md | theme-b-<slug>.md …
│   ├── advanced.md | theme-e-<slug>.md
│   ├── capstone/
│   │   ├── _index.md               generated
│   │   ├── overview.md             the capstone brief, steps, and expected output
│   │   └── code/                   one harness unit with run.yaml
│   └── code/
│       └── ex-NN-<slug>/           one harness unit per code-bearing example
└── drilling/
    ├── _index.md                   generated
    ├── overview.md                 every drill section
    └── code/
        └── kata-NN-<slug>/{before,after}/
```

`NN` is the two-digit example number (`ex-07-…`, `ex-75-…`); a By Example course that goes past 99
examples is not expected (the band ends at 85).

## Gate Settings

| Gate                                    | Agent pair                                                                | Inputs                                                        |
| --------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Tutorial By Example Quality Gate        | `tutorial-by-example-checker` / `tutorial-by-example-fixer`               | `subject`: the course folder; `mode: normal`; `max-cycles: 2` |
| Tutorial Annotated Concept Quality Gate | `tutorial-annotated-concept-checker` / `tutorial-annotated-concept-fixer` | Same                                                          |
| Content Quality Gate                    | `content-checker` / `content-fixer`                                       | Same                                                          |

`normal` blocks on CRITICAL and HIGH findings. `max-cycles: 2` is the user's cap from 2026-10-09
("semua jadi 2 aja"): every gate and every maker-checker loop in this plan stops after its second
cycle. A gate's verdict never stops the batch; the executor reads the verdict and applies the
BLOCKED rule.
