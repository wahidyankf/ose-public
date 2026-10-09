# 003 — Definition of Done and Targets

This file turns series decision 27 into checks a junior engineer can run. It also fixes the targets the course
specifications use, the file layout of a finished course, the drilling convention, the metadata, and the
References rule. The numbers and the layout are aligned with plan 06's accounting courses so the 24 accounting
courses and these 30 ERP courses feel alike to a reader; where plan 06's merged text differs, Phase 0 records the
difference and the merged text wins.

## Definition of Done

Series decision 27 (user, restated here on 2026-10-09): a course is done when it meets the repository's tutorial
convention for its mode, has a drilling section, passes its mode quality gate and the Content Quality Gate with no
blocking finding, and every code example is green in the code harness. For this plan that becomes ten checks. A
course is **done** only when all ten hold. The execution ledger records the proof.

| #      | Requirement                                                                                                                                                                                                                                                                  | Proof                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| DoD-1  | The course follows its mode's shape: parts, counts, layout, headings, `=>` annotation, annotation density 1.0 to 2.25 on code-bearing examples, "Why It Matters" of 50 to 100 words, no body H1                                                                              | The mode quality gate, `normal` mode, at most 2 cycles                                                                          |
| DoD-2  | The course meets the word, example, diagram, and drilling targets below                                                                                                                                                                                                      | The content-shape test (`erp-course-completion`: words, drilling sections) plus the mode gate (example count, diagram band)     |
| DoD-3  | The mode quality gate ends `PASS` or `PASS_WITH_FINDINGS` (no open CRITICAL, HIGH, or `needs-decision` finding)                                                                                                                                                              | The gate's final report, summarized in the ledger                                                                               |
| DoD-4  | The Content Quality Gate ends `PASS` or `PASS_WITH_FINDINGS` the same way                                                                                                                                                                                                    | The gate's final report, summarized in the ledger                                                                               |
| DoD-5  | The course is opted into the code harness, every code unit has a `run.yaml`, every lesson code fence is anchored or marked as an illustration, and `examples check --course <slug>` exits 0 (every run passes twice with identical output, no sync finding)                  | The command's exit status                                                                                                       |
| DoD-6  | `status: outline` is gone; `category: erp-systems`, `description`, `format`, and `estimatedHours` are set and valid                                                                                                                                                          | `CORPUS-GUARD` (plan 03's metadata drift test) names no row for the course                                                      |
| DoD-7  | The course ends with a clean `## References` section (series decision 24): every external claim has a source with an access date, no `## Accuracy notes` heading, no inline confidence label, and every stated standard is the one in force or has its effective date stated | The Content Quality Gate's factual check; `grep -c '^## References'` over the course pages is at least 1                        |
| DoD-8  | The three Sharia courses also follow plan 06's Sharia content rules (SC1 to SC8) and pass the [course checks](./005-sharia-policy-and-source-register.md#course-checks)                                                                                                      | The four checks SH1 to SH4, the ERP gate scenarios, the Content Quality Gate                                                    |
| DoD-9  | Generated `_index.md` files are up to date                                                                                                                                                                                                                                   | `VALIDATE-INDEXES` exits 0 after `GEN-INDEXES`                                                                                  |
| DoD-10 | The course renders on the dev server at its URL, and its path pages show it without an "Outline" badge                                                                                                                                                                       | The manual matrix in [the testing file](./008-testing-and-verification.md#manual-verification-matrix), run once at the end gate |

A course that cannot meet DoD-3, DoD-4, or DoD-5 within 2 cycles is **BLOCKED**. It is recorded in the execution
ledger with its open findings and reported to the user, and the batch moves on
([BLOCKED handling](./007-execution-batching-and-ledger.md#blocked-courses)).

The gates are advisory by contract: no verdict stops a caller or authorizes publishing. This plan adds its own
rule on top, that a course with an open blocking row after the cap is not committed as done.

## Targets

The tutorial gates fix floors and bands. The rest are targets chosen by this plan (and plan 06, for the same
numbers). They are **plan-defined estimates**, not gate rules, and the gates never enforce them
([D14](./009-decision-records.md#d14--targets-are-plan-defined-estimates)). The content-shape test enforces only
the word floor, the drilling sections and their word floor, and the run-specification presence, because those are
countable without judgement.

| Target                                               | By Example                                         | Annotated-Concept                                      |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Examples (planned)                                   | 78 (25 / 28 / 25 by level)                         | 48 in 9 themes (5 / 5 / 5, 6 / 6 / 6, 5 / 5 / 5)       |
| Gate floor and band                                  | floor 75, band 75 to 85                            | floor 45, band 45 to 60                                |
| Pages                                                | `overview`, `beginner`, `intermediate`, `advanced` | `overview` and nine theme pages `theme-a` to `theme-i` |
| Code-bearing runnable examples                       | all 78                                             | at least 32 (at most 16 diagram- or table-only)        |
| Diagrams                                             | at least 30 (adapter band 30 to 50)                | at least 10, at least one per theme                    |
| Course words (all Markdown pages, code included)     | at least 28,000                                    | at least 22,000                                        |
| Capstone overview                                    | at least 800 words, with `run.yaml` code           | at least 800 words, with `run.yaml` code               |
| Drilling recall questions                            | 24 (at least one per concept)                      | 24 (at least one per concept)                          |
| Drilling applied problems                            | at least 8                                         | at least 8                                             |
| Drilling code katas                                  | at least 8                                         | at least 5                                             |
| Drilling self-check items                            | 24                                                 | 24                                                     |
| Drilling why and why-not prompts                     | at least 6                                         | at least 6                                             |
| Drilling words (`drilling/overview.md`)              | at least 5,000                                     | at least 5,000                                         |
| Sharia board decision spotting (Sharia courses only) | at least 6 scenarios                               | at least 6 scenarios                                   |

### Where Each Number Comes From

| Number                                                                  | Source                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| By Example: 75 to 85 examples, 30 to 50 diagrams, density 1.0 to 2.25   | The AyoKoding gate adapter, `repo-governance/development/quality/gate-adapters/ayokoding-www/tutorial-kinds.md` (a count below the floor is a HIGH-confidence finding)                                                                                                                                                                                                                                       |
| Annotated-Concept: floor 45, density band only on code-bearing examples | The same file; the gate treats 45 as a floor, never a cap                                                                                                                                                                                                                                                                                                                                                    |
| 78 and 48 planned examples                                              | Plan choice: 78 gives By Example a margin of 3 above the floor of 75 and splits 8 / 9 / 8, 9 / 10 / 9, and 8 / 9 / 8 over three levels of three clusters; 48 gives Annotated-Concept a margin of 3 above 45 and splits 5 / 5 / 5, 6 / 6 / 6, and 5 / 5 / 5 over nine themes                                                                                                                                  |
| Nine theme pages (Annotated-Concept)                                    | Plan choice, a deviation from plan 06's five theme pages of about nine examples. Each ERP course has nine concept clusters, and a page of five or six examples reads as one idea. The adapter requires per-theme clusters and a floor of 45, and nine pages satisfy both ([D19](./009-decision-records.md#d19--nine-theme-pages-for-annotated-concept-courses))                                              |
| At least 32 code-bearing Annotated-Concept examples                     | Plan choice: two thirds of 48 are runnable, so the course is a code course with room for diagram- and table-only concept examples (plan 06 uses 60%)                                                                                                                                                                                                                                                         |
| At least 28,000 words (By Example) and 22,000 (Annotated-Concept)       | Plan 06's derivation from the minimum part lengths: 75 examples at about 270 words is 20,250, plus about 1,000 for overviews, 1,500 for the capstone page, and 5,000 for drilling is 27,750, rounded up to 28,000. For Annotated-Concept, 45 examples at about 290 words is 13,050, plus 1,750, 1,500, and 5,000 is 21,300, rounded up to 22,000. At the planned counts the sums are about 28,500 and 22,200 |
| Capstone overview at least 800 words                                    | The peers measured 3,124 words (`sql-essentials`) and 3,646 words (`api-design`); 800 is a floor that still forces a real design discussion                                                                                                                                                                                                                                                                  |
| Drilling counts and 5,000 words                                         | Plan 06's floors, each reached by at least two of the three measured exemplars (`sql-essentials`, `statistics-for-evaluation`, `backend-essentials`); applied problems 8, katas 8 (By Example) or 5 (Annotated-Concept), recall 24, checklist 24, why prompts 6                                                                                                                                              |

Word counting is the whitespace-split token count of the Markdown files with frontmatter removed and code blocks
included (the same method plan 06's content-shape test uses). A target missed by a small margin is a finding for
the maker to fix with real content, never a reason to pad.

## Layout of a Finished Course

Paths are relative to `apps/ayokoding-www/content/en/learn/courses/<slug>/`. The skeleton has `_index.md`,
`overview.md`, `learning/overview.md`, `learning/capstone/`, and `drilling/overview.md`; the rest are new.

```text
<slug>/
├── _index.md                  frontmatter below; the link list is generated
├── overview.md                150 to 400 words of prose: what the course is and who it is for; then ## References
├── learning/
│   ├── _index.md              generated
│   ├── overview.md            Examples by Level (By Example) or the theme list (Annotated-Concept)
│   ├── beginner.md            By Example: Examples 1 to 25      | Annotated-Concept: theme-a-<slug>.md to theme-i-<slug>.md,
│   ├── intermediate.md        By Example: Examples 26 to 53     |   one page per theme, Worked Examples 1 to 48
│   ├── advanced.md            By Example: Examples 54 to 78     |
│   ├── capstone/
│   │   ├── _index.md          generated
│   │   ├── overview.md        the capstone brief, steps, and expected output (at least 800 words)
│   │   └── code/              one harness unit with run.yaml, the program, and a golden expected output
│   └── code/
│       ├── README.md          how to run the units
│       ├── requirements.in, requirements.lock   only a course with a Python PostgreSQL unit
│       └── ex-NN-<slug>/      one harness unit per code-bearing example
└── drilling/
    ├── _index.md              generated
    ├── overview.md            every drill section
    └── code/
        └── kata-NN-<slug>/    before/, after/, and run.yaml
```

- By Example headings are `### Example N: Title`; Annotated-Concept headings are `### Worked Example N: Title`.
  A By Example page groups its examples under three cluster headings. An Annotated-Concept theme page opens with
  its theme intro and holds five or six worked examples.
- `NN` is the two-digit example number (`ex-07-...`); the By Example band ends at 85, so no number passes 99.
- The Sharia disclaimer sentence sits in the root `overview.md`; the `## References` section ends it.
- Code lives only at the three canonical places (`learning/code/`, `learning/capstone/code/`,
  `drilling/code/`); any other code location is a harness layout finding.

## Drilling Convention

This is plan 06's convention, restated. All drill sections live in `drilling/overview.md`, as in `sql-essentials`;
katas live in `drilling/code/kata-NN-<slug>/before/` and `.../after/`. The H2 headings are exact, so the
content-shape test can find each section:

| Drill section (exact H2 heading)                  | Floor                                 | Notes                                                                                                                                                                               |
| ------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `## Recall Q&A`                                   | 24                                    | At least one question for each concept `co-01` to `co-16`; each answer in a `<details>` block                                                                                       |
| `## Applied problems`                             | 8                                     | A short scenario, the task, and a worked answer in `<details>` that names the concepts used; the spec lists the themes                                                              |
| `## Code katas`                                   | 8 (By Example), 5 (Annotated-Concept) | A kata is `drilling/code/kata-NN-<slug>/` with `before/` (a defect or gap) and `after/` (the fix) and one `run.yaml`; the page shows both with anchored fences; the spec names them |
| `## Self-check checklist`                         | 24                                    | "I can ..." items, at least one per concept                                                                                                                                         |
| `## Elaborative interrogation & self-explanation` | 6                                     | Why and why-not prompts: a design choice and a rejected alternative, with a model answer                                                                                            |
| `## Sharia board decision spotting`               | 6 (the three Sharia courses only)     | Scenarios where the reader names the decision a Sharia board must make                                                                                                              |
| Drilling words                                    | 5,000                                 | Counted over `drilling/overview.md`                                                                                                                                                 |

## Metadata

The `_index.md` frontmatter of a finished course (plan 03's schema):

```yaml
---
title: "<unchanged from the skeleton>"
date: <unchanged>
draft: false
weight: <unchanged>
prerequisites: [<result of the rubric re-run>]
category: erp-systems
description: "<plan 03's one sentence, unless the objectives no longer fit it>"
format: by-example # or annotated-concept
estimatedHours: <value printed by the drift test>
---
```

- `status: outline` is deleted.
- `category` and `description` keep the values plan 03 set. The maker changes a description only if the course
  spec's objectives no longer fit it, and records why in the ledger row.
- `estimatedHours` comes from the real-corpus drift test's failure message, which prints
  `Expected estimatedHours for every non-outline course:` followed by one line per course. The formula is plan 03's:
  `max(1, round((proseWords / 200 + max(inlineCodeLines, codeFileLines) / 10) / 60))`. No script and no guess sets
  it. The test compares a course only once it is no longer an outline, so the value is set after the course passes
  DoD-5 and `status: outline` is removed.
- `prerequisites` is re-derived with plan 02's rubric (T1 to T4, L1, C1), which plan 02 left to the plans that
  rewrite outline courses. L1 makes the primary code medium a prerequisite: every ERP example is Python 3.14, so
  every course lists `just-enough-python`, and the 14 PostgreSQL courses also list `sql-essentials`
  ([D18](./009-decision-records.md#d18--prerequisites-are-re-derived-by-the-rubric)).

## References Rule

Series decision 24 turns "Accuracy notes" into a clean `## References` section. Each course ends its root
`overview.md` with `## References`: a list of the standards, documentation, and books the course relies on, each
with title, publisher or issuer, an access date, and a link where one exists. There are no confidence labels and
no internal tags in the published pages. The `## Accuracy notes` heading survives only in the plan's own syllabus
files, where the syllabus template requires it. The prose before the section is what the 150 to 400 word range
counts.

## Measuring

Run these from the execution worktree root, with `<dir>` the course folder
(`apps/ayokoding-www/content/en/learn/courses/<slug>`). They are the commands the per-course checklists name. The
content-shape test is the authoritative count for words and drilling sections; these commands give the maker the
same numbers earlier.

````bash
# Example headings (By Example): one count per page, expected 25 / 28 / 25
grep -c "^### Example " <dir>/learning/beginner.md <dir>/learning/intermediate.md <dir>/learning/advanced.md

# Example headings (Annotated-Concept): one count per theme page, expected total 48
grep -c "^### Worked Example " <dir>/learning/theme-*.md

# Diagrams in the learning pages
grep -c '^```mermaid' <dir>/learning/overview.md <dir>/learning/beginner.md <dir>/learning/intermediate.md <dir>/learning/advanced.md
grep -c '^```mermaid' <dir>/learning/theme-*.md

# Course words (all Markdown pages of the course; frontmatter included, so the figure is slightly high)
find <dir> -name '*.md' -print0 | xargs -0 cat | wc -w

# Capstone and drilling words
wc -w <dir>/learning/capstone/overview.md <dir>/drilling/overview.md

# Drilling sections (the H2 headings must match the table above)
grep -n "^## " <dir>/drilling/overview.md

# Units and katas (count the lines)
find <dir>/learning/code -mindepth 1 -maxdepth 1 -type d -name 'ex-*'
find <dir>/drilling/code -mindepth 1 -maxdepth 1 -type d -name 'kata-*'

# Accuracy-note leftovers: expect no output
grep -rn -i 'accuracy notes' <dir>
````
