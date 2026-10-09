# 002 — Course Modes and Definition of Done

This page says what "done" means for one of the eight courses, which teaching mode each uses and why,
and the measurable targets every course brief in [../syllabus/courses/](../syllabus/courses/README.md)
refers to. The form follows the sibling plan for the accounting courses (plan 06), with two additions: the
filler guard ([003](./003-filler-guard.md)) is part of "done", and each course has an obligation of its own.

## Definition of Done

Series decision 27 (user, restated here on 2026-10-09): a course is done when it meets the repository's
tutorial convention for its mode, has a drilling section, passes its mode quality gate and the Content
Quality Gate with no blocking finding, and every code example is green in the code harness. For this plan
that becomes eleven checks, named C1 to C11 so they cannot be mistaken for the decision records in
[008](./008-decision-records.md). A course is done only when all eleven hold:

| #   | Check                                                                                                                                                                                                   | How it is proven                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | The course follows its mode's shape: parts, counts, layout, headings, `=>` annotation, annotation density 1.0 to 2.25 on code-bearing examples, "Why It Matters" of 50 to 100 words, no body H1         | The mode quality gate, `normal` mode, at most 2 cycles                                                                                 |
| C2  | The course meets the word, example, diagram, and drilling targets below                                                                                                                                 | The completion test in [007](./007-testing-strategy.md) (words, example headings, drilling sections) plus the mode gate (diagram band) |
| C3  | The mode quality gate ends `PASS` or `PASS_WITH_FINDINGS` (no open CRITICAL, HIGH, or `needs-decision` finding)                                                                                         | The gate's final report                                                                                                                |
| C4  | The Content Quality Gate ends `PASS` or `PASS_WITH_FINDINGS` the same way                                                                                                                               | The gate's final report                                                                                                                |
| C5  | The course is opted into the code harness, every code unit has a `run.yaml`, and `ayokoding-cli examples check --course <slug>` exits 0 (every run passes twice with identical output, no sync finding) | The command's exit status and its JSON report                                                                                          |
| C6  | `format`, `category`, `description`, `prerequisites`, and `estimatedHours` are set and valid; `estimatedHours` equals the drift test's value for the finished course                                    | Plan 03's metadata drift test passes                                                                                                   |
| C7  | Every external claim has a source with an access date in the course's References section, and every stated version, standard, or number is the one in force (or the course states its effective date)   | The Content Quality Gate's factual check, and the accuracy notes in [005](./005-security-content-and-accuracy.md)                      |
| C8  | The course passes all six filler rules and is listed in `REWRITTEN_FILLER_COURSES`, not in `FILLER_BASELINE`                                                                                            | The guard in [003](./003-filler-guard.md), run in `test:quick`                                                                         |
| C9  | Generated `_index.md` files are up to date                                                                                                                                                              | `generate-indexes.ts` leaves no diff                                                                                                   |
| C10 | The course renders on the dev server at its URL, and its code, output, tables, and Mermaid diagrams display                                                                                             | Manual browser check on port 3101 in [../delivery.md](../delivery.md)                                                                  |
| C11 | The course's own obligation holds (see [Course-Specific Obligations](#course-specific-obligations))                                                                                                     | The check named in that table                                                                                                          |

Plan 06 numbers its ten checks D1 to D10; C1 to C7 and C9 to C10 here are the same checks, C8 is new, and C11
replaces plan 06's Sharia check.

A course that cannot meet C3, C4, C5, or C8 within 2 cycles is **BLOCKED**. Its pages are not committed (the
old course stays on the branch and in the baseline), it is recorded in the execution ledger with its open
findings, and it is reported to the user. The batch moves on. The handling is in
[006](./006-execution-model.md#blocked-courses).

## Mode Selection

The repository has four tutorial modes. Their rules live in
`repo-governance/development/quality/gate-adapters/ayokoding-www/tutorial-kinds.md`.

| Mode                                    | What it is for                                                                                                                      | Used here?                                                                                                                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| By Example (`by-example`)               | 75 to 85 short examples, each in five parts: brief explanation, diagram when useful, annotated code, key takeaway, "Why It Matters" | Yes, 7 courses: every concept is a mechanism a reader can run, break, and compare with the correct result                                                                                       |
| Primer (`primer`)                       | `just-enough-<x>/` language primers: By Example pace and parts, scoped to the topics that depend on the language                    | Yes, 1 course: `just-enough-fsharp`, scoped to what its dependent course `compilers-parsers-and-transpilers` uses                                                                               |
| Annotated Concept (`annotated-concept`) | 45 to 60 worked examples in themes; code only where it proves the point                                                             | No. All eight are code-first: the existing code folders, the course names, and the series decision to keep seven of the eight as `by-example` agree, and none is mostly reasoning or comparison |
| In the Field                            | 20 to 40 production guides for one language under `<language>/in-the-field/`                                                        | No. The site's course layout has no `in-the-field/` track for these courses                                                                                                                     |

The rule used to pick between By Example and Annotated Concept: By Example when the course is a sequence of
mechanisms, each with an input and an observable result a reader can run; Annotated Concept when the course
is mostly reasoning (frameworks, judgement, comparison) and roughly half of its ideas read better as annotated
tables and diagrams than as programs. The two security courses are the closest calls, because incident
response and zero trust sound like process. They stay By Example because each process step becomes a runnable
check on the synthetic telemetry (a tabletop is a state machine that refuses an out-of-order step; a zero-trust
tenet is a policy function that denies a request) and because both courses already ship with 78 or 80 examples
and a code lab.

| Pos | Course                                    | Mode       | Reason (short; the full reason is in the course brief)                                                                |
| --- | ----------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | `build-your-own-git`                      | by-example | Each object, ref, and index rule is a program whose id real Git must confirm                                          |
| 2   | `compilers-parsers-and-transpilers`       | by-example | Each compiler stage is a function from input to output that a reader can run and extend                               |
| 3   | `type-systems`                            | by-example | Each type feature is a program the compiler accepts next to one it rejects, with the diagnostic recorded              |
| 4   | `just-enough-fsharp`                      | primer     | A language primer; the scope is the F# that the compilers course needs, shown at By Example pace                      |
| 5   | `lisp`                                    | by-example | Macros are learned by expanding them; every form is a REPL-sized program                                              |
| 6   | `enterprise-java-and-the-jvm`             | by-example | Each Spring mechanism (wiring, scope, rollback) and JVM behaviour (class loading, collection) is observable in output |
| 7   | `defensive-security`                      | by-example | Each telemetry, detection, and response step is a runnable check over synthetic events                                |
| 8   | `vulnerability-management-and-assessment` | by-example | Each identity, scoring, and triage step is a runnable computation over synthetic findings                             |

Totals: 7 By Example, 1 Primer. The mode of each course is fixed by this plan and matches plan 03's `format`
values. A maker may not switch modes; a course that does not fit its mode after 2 cycles is BLOCKED and the
mode question goes to the user.

## Example Targets

| Target                 | By Example                                                                                | Primer                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Examples               | Floor 75, band 75 to 85, as `### Example N: Title`                                        | The same; 75 is a floor, never a cap                                                          |
| Pages                  | `beginner.md` (1 to 26), `intermediate.md`, `advanced.md` (to the last)                   | The same three level pages                                                                    |
| Code-bearing examples  | All, except the few marked `<!-- harness: illustration -->` per brief                     | All                                                                                           |
| Diagrams               | 30 to 50 Mermaid diagrams (the adapter band); the briefs target 32 to 36                  | At least 30 (this plan's target; the adapter sets no band for primers); the brief marks 32    |
| `learning/overview.md` | `## Examples by Level` with one bullet per example, en-dash ranges, plus the concept list | The same, plus the scope statement naming the dependent topic ([Primer Scope](#primer-scope)) |
| Capstone               | `learning/capstone/overview.md` plus `learning/capstone/code/`                            | A light consolidation program, not a full project                                             |

The counts in the briefs are 78 examples for seven courses and 80 for `vulnerability-management-and-assessment`,
which keeps each course's current count, so readers who know the old outline keep their bearings. All counts
are floors, never caps. A course is never split or merged to hit a number.

### Primer Scope

The primer's `overview.md` states, in its own words, what "just enough" means and which course needs it.
For `just-enough-fsharp` the dependent topic is `compilers-parsers-and-transpilers`. The scope list is in
the course brief; in short it is everything the compilers course uses (bindings, records, unions, matching,
active patterns, `Option`, `Result`, collections, pipelines, recursion, modules, `dotnet fsi`, and the
small part of .NET a lexer touches), and nothing about classes, async, type providers, computation
expressions, or units of measure. An example that serves the stated scope but is not used by the compilers
course is allowed; an example that drifts toward the whole language is scope creep and fails the primer
gate.

## Word Targets

The floors come from the minimum part lengths in the mode rules, not from a wish for long pages. Words are
counted over every Markdown page of the course, code blocks included, frontmatter excluded.

| Part                                     | By Example and Primer |
| ---------------------------------------- | --------------------- |
| One example at minimum length            | about 270 words       |
| — explanation (2 to 3 sentences)         | 40                    |
| — annotated code (density 1.0 or more)   | 150                   |
| — key takeaway (1 to 2 sentences)        | 20                    |
| — "Why It Matters" (50 to 100 words)     | 50                    |
| — heading and output label               | 10                    |
| All examples at the floor                | 75 x 270 = 20,250     |
| Overviews (course, learning)             | about 1,000           |
| Capstone page                            | about 1,500           |
| Drilling page                            | at least 5,000        |
| **Sum, rounded up to the next thousand** | **28,000**            |

For comparison, the By Example exemplar `sql-essentials` measured 51,943 words on 2026-10-09 (80 examples).
The floor sits near half of it. The eight courses measured 2,700 to 12,255 words that day
([001](./001-current-state.md)), so every course grows; the two security courses double, the six templated
courses grow about tenfold. A course that meets every part length passes the floor; the quality gates, not the
word count, judge whether the writing is good. Series decision 40 also needs every course above 1,000 words
(guard rule FG5); the floor above exceeds that by far.

## Drilling Targets

Drilling is the second half of decision 27. All drill sections live in `drilling/overview.md`, as in
`sql-essentials`; katas live in `drilling/code/kata-NN-<slug>/before/` and `.../after/`.

| Drill section (exact H2 heading)                  | Floor | Notes                                                                                                  |
| ------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------ |
| `## Recall Q&A`                                   | 24    | One or more per concept; each answer in a `<details>` block                                            |
| `## Applied problems`                             | 8     | A short scenario, the task, and a worked answer in `<details>`                                         |
| `## Code katas`                                   | 8     | A broken `before/` and a fixed `after/`, each a harness unit; the eight names are in each course brief |
| `## Self-check checklist`                         | 24    | "I can ..." items, one or more per concept                                                             |
| `## Elaborative interrogation & self-explanation` | 6     | Why and why-not prompts: a design choice and a rejected alternative, with a model answer               |
| Drilling words                                    | 5,000 | Counted over `drilling/overview.md`                                                                    |

These are the same floors as plan 06 (each is reached by at least two of the three exemplars `sql-essentials`,
`statistics-for-evaluation`, and `backend-essentials`). The headings are the exemplars' own, so the completion
test can find each section. Today none of the eight has them: six use `Recall Q&A`, `Calculation practice`,
`Scenario judgment`, `Design exercise`, `Automaticity checklist`, `Why / why not prompts`, and the two
security courses use five numbered headings, with 228 to 246 words each.

## Metadata

Each course's `_index.md` frontmatter ends in this shape (plan 03's schema; values per course in the brief):

```yaml
title: "Build Your Own Git"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 190
prerequisites: ["just-enough-python", "version-control-and-git"]
category: tools-and-practices
description: "Rebuild Git's objects, refs, and index in Python to see how it really works."
format: by-example
estimatedHours: 0 # placeholder: replaced by the value the drift test prints
```

- `status: outline` is not present on any of the eight today and is not added.
- `format` is `by-example` for seven courses and `primer` for `just-enough-fsharp`. Plan 03 may already have
  written `format`, `category`, and `description` for all 181 courses; Phase 0 reads them and this plan edits
  a value only where the finished course no longer matches, recording why in the ledger.
- `category`: `tools-and-practices` (git), `programming-languages` (fsharp, lisp), `computer-science`
  (compilers, type-systems), `application-development` (java), `security` (defensive, vulnerability).
- `description` keeps plan 03's value unless the course brief's objectives no longer fit it. Plan 03's text is
  restated in each brief.
- `estimatedHours` is never estimated by hand. The eight courses are not outlines, so the drift test checks
  them today against their thin text. After a course passes C5, run the drift test; it prints
  `Expected estimatedHours for every non-outline course:` and one line per course; copy the course's number
  into the same commit as the course. The formula (plan 03) is
  `max(1, round((proseWords / 200 + max(inlineCodeLines, codeFileLines) / 10) / 60))`.
- `prerequisites` change as listed in [001](./001-current-state.md#prerequisite-changes). The three planned
  additions are checked in Phase 0 against the merged tree.
- `weight` and `date` stay as they are. Titles stay too: 73 courses carry a numeric prefix such as
  "60 · Defensive Security" in their title, which is a series matter, not this plan's.

## File Layout per Course

```text
content/en/learn/courses/<slug>/
├── _index.md                       generated body, hand-edited frontmatter
├── overview.md                     150 to 400 words, what the course is, who it is for, prerequisites, scope
├── learning/
│   ├── _index.md                   generated
│   ├── overview.md                 Concepts, Examples by Level, how to run the code
│   ├── beginner.md                 examples 1 to 26
│   ├── intermediate.md             examples 27 to 52
│   ├── advanced.md                 examples 53 to the last
│   ├── capstone/
│   │   ├── _index.md               generated
│   │   ├── overview.md             the capstone brief, steps, and expected output
│   │   └── code/                   one harness unit with run.yaml
│   └── code/
│       ├── ex-NN-<slug>/           one harness unit per example (illustrations excepted)
│       └── <shared files>          fixtures and lock files, readable from units as ../<name>
└── drilling/
    ├── _index.md                   generated
    ├── overview.md                 every drill section
    └── code/
        └── kata-NN-<slug>/{before,after}/
```

Three things in today's trees do not fit this layout and are replaced. The six templated courses each have a
flat `README.md` under `learning/code/` (it only lists the units). The two security courses keep their code
flat under `learning/code/` (one script, no `ex-NN-*` units) and, for vulnerability management, six capstone
modules sit beside the capstone page instead of under `capstone/code/`. The `ir-report.md` and `verify.md`
side pages are folded into `capstone/overview.md`, because the harness allows only the layout above. `NN` is
the two-digit example number; a course past 99 examples is not expected (the band ends at 85).

## Course-Specific Obligations

C11 is one obligation per course, checked as shown.

| Course                                    | Obligation                                                                                                                                                                                                                                                                    | Checked by                                                                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `build-your-own-git`                      | Every object id the course prints equals the id real Git computes; no `.py` file contains the literal two-character `\\0` header terminator ([004](./004-code-harness-and-determinism.md#the-known-bug-and-its-regression-test))                                              | The oracle shell unit through the harness; a static scenario in `filler-course-completion.feature`                                  |
| `compilers-parsers-and-transpilers`       | The pipeline stages are the ones `type-systems` and `just-enough-fsharp` prepare for: it re-teaches no F# and no typing rule, and uses no package outside the SDK                                                                                                             | The Content Quality Gate's prerequisite check; `examples check` (offline)                                                           |
| `type-systems`                            | Every "the compiler rejects this" claim is a recorded compiler diagnostic from the pinned compiler, not prose                                                                                                                                                                 | Expected stdout or stderr files, read by the maker; the harness                                                                     |
| `just-enough-fsharp`                      | The overview states the scope and names `compilers-parsers-and-transpilers`; the capstone is a light consolidation program                                                                                                                                                    | The Primer Quality Gate (scope, capstone) in place of the By Example gate                                                           |
| `lisp`                                    | Every macro example shows its expansion; hygiene claims are demonstrated by a capture that the Scheme macro avoids and the Clojure macro needs `gensym` for                                                                                                                   | Expected output files; the Content Quality Gate                                                                                     |
| `enterprise-java-and-the-jvm`             | Versions are the ones in force on the execution date (Spring Boot, Java), jars come from the hash-locked recipe, and JVM output never depends on the CPU count or on timing                                                                                                   | `jars.lock`, the pom-and-lock unit, the double-run check                                                                            |
| `defensive-security`                      | The lab boundary of the security rules (SEC1) holds, and the course still teaches a detection rule, a log source, a severity rating, and a finding at definition level, because three capstones rely on them ([005](./005-security-content-and-accuracy.md#capstone-handoff)) | The completion test's safe-lab scenario; the capstone `relies-on` re-read in [006](./006-execution-model.md#checkpoints-per-course) |
| `vulnerability-management-and-assessment` | The same SEC1 boundary and the same capstone handoff; no example calls a scanner, feed, or host                                                                                                                                                                               | The same                                                                                                                            |

## Gate Settings

| Gate                             | Agent pair                                                  | Inputs                                                        |
| -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| Tutorial By Example Quality Gate | `tutorial-by-example-checker` / `tutorial-by-example-fixer` | `subject`: the course folder; `mode: normal`; `max-cycles: 2` |
| Tutorial Primer Quality Gate     | The primer gate's checker and fixer                         | The same inputs, for `just-enough-fsharp`                     |
| Content Quality Gate             | `content-checker` / `content-fixer`                         | The same inputs                                               |

`normal` blocks on CRITICAL and HIGH findings. `max-cycles: 2` is the user's cap from 2026-10-09 ("semua jadi
2 aja"): every gate and every maker-checker loop in this plan stops after its second cycle. A gate's verdict
never stops the batch; the executor reads the verdict and applies the BLOCKED rule.
