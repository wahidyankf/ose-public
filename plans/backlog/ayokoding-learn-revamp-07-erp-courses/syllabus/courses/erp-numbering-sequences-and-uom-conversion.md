# ERP Numbering Sequences and UoM Conversion (Annotated-Concept)

**Course ID**: `erp-numbering-sequences-and-uom-conversion` · **Format**: Annotated-Concept.

**Scope note**: Controls document identifiers and quantity conversions. It excludes inventory valuation (erp-inventory-costing-methods).

**Short summary**: Identifiers and quantities carry rules, not just formatting.

## Why this exists · the big idea

- **The problem before the solution**: Duplicate identifiers and silent unit conversion corrupt every downstream record.
- **Keep-this-if-you-forget-everything**: Identifiers and quantities carry rules, not formatting.

## Learning objectives

After this course you can:

1. scope identifiers so numbers stay unique per company and document type.
2. choose between database sequences and counter rows, and state what each does about gaps.
3. allocate numbers safely under concurrency.
4. store quantities in a base unit and convert with item-specific factors and an explicit rounding policy.
5. keep audit evidence for every conversion.

## Prerequisites

- **Prior courses**: `erp-module-map-and-architecture`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Units and ratios; basic SQL helps.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 16 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- PostgreSQL 18 documentation on sequence functions: nextval is not rolled back with the transaction, so sequences can leave gaps.
- Some tax regimes ask for continuous or traceable invoice numbering and regimes differ. Verify against the regime's own text before stating a rule, and hedge it.
- Python decimal documentation for rounding modes.

## Concepts

- **co-01 · sequence-scope** — the boundary within which an identifier is unique.
- **co-02 · allocation** — a controlled reservation of a new identifier.
- **co-03 · immutability** — an issued identifier stays traceable.
- **co-04 · gapless-vs-unique** — continuous numbering versus mere uniqueness, and which regimes ask for which.
- **co-05 · concurrency-safe-allocation** — sequence objects versus counter rows with locking.
- **co-06 · number-format** — prefix, year, and check digit.
- **co-07 · unit-of-measure** — a named measurement basis for a quantity.
- **co-08 · conversion-factor** — a governed ratio between units.
- **co-09 · rounding-policy** — explicit treatment of non-exact conversion.
- **co-10 · base-unit** — the canonical unit used for stored quantities.
- **co-11 · conversion-audit** — retained inputs and rule for a converted value.
- **co-12 · item-specific-conversion** — per-item factors, such as pack sizes.
- **co-13 · dimension-conversion** — conversions that need another property, such as density.
- **co-14 · decimal-vs-float** — why quantities and money use exact decimals.
- **co-15 · void-vs-delete** — voided numbers stay on record.
- **co-16 · sequence-reset** — yearly resets and how collisions are prevented.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: The concepts split into identifiers (uniqueness, gaps, concurrency) and quantities (units, factors, rounding), each shown best with SQL, code, and tables together. Annotated-concept fits.

| Target                         | Value                                                                                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worked examples                | 48 in 9 themes (5 / 5 / 5, 6 / 6 / 6, 5 / 5 / 5; floor 45, band 45 to 60)                                                                                                        |
| Pages                          | `learning/overview.md` and nine theme pages `theme-a-<slug>.md` to `theme-i-<slug>.md`; `### Worked Example N: Title` headings                                                   |
| Code-bearing runnable examples | at least 32 of 48, each with a `run.yaml`; at most 16 may be diagram- or table-only                                                                                              |
| Diagrams                       | at least 10, at least one per theme (the adapter sets no band for this mode)                                                                                                     |
| Annotation density             | 1.0 to 2.25 on code-bearing examples                                                                                                                                             |
| Course words                   | at least 22,000 over every Markdown page of the course, code blocks included (a plan estimate aligned with plan 06, not a gate rule)                                             |
| Capstone                       | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                           |
| Metadata                       | `format`, `estimatedHours` from the drift test message, `description` (plan 03's sentence unless the objectives no longer fit it), `category: erp-systems`, no `status: outline` |

Anchor runtimes: PostgreSQL 18 service container, driven by a `psql` SQL unit or from Python 3.14 through the hash-locked pure-Python pg8000 driver in 3 of 9 anchors; Python 3.14, standard library only (no lockfile) in 6 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Unique identifiers** (page `learning/theme-a-unique-identifiers.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · scoped-uniqueness** (PostgreSQL 18) — enforce uniqueness of document numbers per company and type, then verify a duplicate insert fails.
- **Theme B: Allocating numbers** (page `learning/theme-b-allocating-numbers.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · counter-vs-sequence** (PostgreSQL 18) — allocate numbers with a sequence and with a counter row, then verify a rolled-back transaction leaves a gap only in the sequence.
- **Theme C: Units and base units** (page `learning/theme-c-units-and-base-units.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · base-unit-storage** (Python 3.14) — store quantities in a base unit and display them in another, then verify a round trip returns the original.

### Themes 4 to 6 (18 examples)

- **Theme D: Gapless allocation** (page `learning/theme-d-gapless-allocation.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · gapless-with-lock** (PostgreSQL 18) — allocate gapless numbers from two scripted sessions, then verify the second session is told to retry instead of reusing a number.
- **Theme E: Conversion factors** (page `learning/theme-e-conversion-factors.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · pack-size-conversion** (Python 3.14) — convert cases to pieces with an item-specific factor, then verify a missing factor is an error, not a guess.
- **Theme F: Rounding policies** (page `learning/theme-f-rounding-policies.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · round-half-even-vs-up** (Python 3.14) — convert with two rounding policies, then verify totals differ only by the documented rule.

### Themes 7 to 9 (15 examples)

- **Theme G: Voids and resets** (page `learning/theme-g-voids-and-resets.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · void-keeps-number** (Python 3.14) — void a document, then verify its number is never reissued and the void is audited.
- **Theme H: Cross-dimension conversion** (page `learning/theme-h-cross-dimension-conversion.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · density-bound-conversion** (Python 3.14) — convert mass to volume with a density, then verify a conversion without a density is rejected.
- **Theme I: Audit of conversion** (page `learning/theme-i-audit-of-conversion.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · conversion-evidence-record** (Python 3.14) — store inputs, factor, rule, and result for each conversion, then verify the result can be reproduced from the record.

## Capstone spec

Build a number and unit service: scoped sequences with void handling and a conversion engine that stores audit evidence, tested with a scripted two-session allocation. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: choose a numbering scheme for a regulated invoice; find a rounding leak in a conversion chain; handle a year-end reset.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: scope a document number; convert with item-specific factors; reproduce a conversion from its record.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Any statement about a country's invoice-numbering rule is sourced to that regime's text or hedged.

## Lineage

- The archived syllabus file [erp-numbering-sequences-and-uom-conversion](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-numbering-sequences-and-uom-conversion.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 2 of 5 (Documents, posting, and period close) · position 8 of 27.
- `skills/sharia-erp` — Phase 2 of 6 (Documents, posting, and period close) · position 8 of 30.
