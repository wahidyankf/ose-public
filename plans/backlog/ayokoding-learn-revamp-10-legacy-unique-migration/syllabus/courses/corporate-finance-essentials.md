# Corporate Finance Essentials (Annotated-Concept)

**Course ID**: `corporate-finance-essentials` · **Format**: Annotated-Concept.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/business/corporate-finance.md` (1 files, 7,154 words)
- `apps/ayokoding-www/content/en/learn/legacy/business/overview.md` (1 files, 229 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches time value of money, financial-statement analysis, ratios, capital budgeting, cost of capital, capital structure, and basic valuation. It excludes bookkeeping mechanics, already in `accounting-foundations`.

**Short summary**: Before a business decision is an accounting entry, it is a time-value and a risk judgement; this course teaches that judgement with runnable arithmetic.

## Why this exists · the big idea

- **The problem before the solution**: `accounting-foundations` and the other accounting courses teach how to record what already happened; nothing in the catalog teaches the forward-looking finance judgements (discounting, ratios, capital budgeting, valuation) a business decision needs.
- **Keep-this-if-you-forget-everything**: A dollar today is worth more than a dollar later, and every finance decision in this course is that one idea applied to a different question.

## Learning objectives

After this course you can:

1. compute present and future value, including annuities, and explain what the discount rate represents.
2. read a set of financial statements and compute profitability, liquidity, leverage, and efficiency ratios.
3. evaluate an investment with net present value and internal rate of return and decide between them when they disagree.
4. compute a weighted average cost of capital and explain how capital structure changes it.
5. produce a basic valuation estimate and state the assumptions it depends on.

## Prerequisites

- **Prior courses**: `accounting-foundations`, `just-enough-python`.
- **Assumed knowledge**: Basic algebra and the three financial statements from accounting-foundations.
- **Language medium (prerequisite rubric rule L1)**: every example computes with Python 3.14's standard library (decimal arithmetic for money), so `just-enough-python` is listed; `accounting-foundations` supplies the statement vocabulary. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `accounting-foundations`, `just-enough-python`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Standard corporate-finance formulas (time value of money, WACC, NPV, IRR) are textbook-stable; the course cites a standard corporate-finance textbook edition and date.
- Every worked company in the examples is fictional and clearly labelled as such.

## Concepts

- **co-01 · present-value** — today's worth of a future amount at a given discount rate.
- **co-02 · future-value** — what an amount grows to under compounding.
- **co-03 · annuity** — a series of equal payments valued as one stream.
- **co-04 · discount-rate** — the rate reflecting time and risk used to discount cash flows.
- **co-05 · profitability-ratio** — margin and return measures from the income statement and balance sheet.
- **co-06 · liquidity-ratio** — a measure of short-term paying ability.
- **co-07 · leverage-ratio** — a measure of debt relative to equity or assets.
- **co-08 · efficiency-ratio** — a measure of how well assets are used.
- **co-09 · working-capital** — current assets minus current liabilities and its cash-cycle effect.
- **co-10 · net-present-value** — the sum of discounted cash flows minus the initial cost.
- **co-11 · internal-rate-of-return** — the discount rate at which NPV equals zero.
- **co-12 · cost-of-capital** — the required return a financing source demands.
- **co-13 · wacc** — the blended, weighted cost of all financing sources.
- **co-14 · capital-structure** — the mix of debt and equity financing a company chooses.
- **co-15 · valuation-multiple** — a simple relative valuation (for example, price to earnings).
- **co-16 · sensitivity-analysis** — testing how a conclusion changes when an assumption changes.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Each finance idea (TVM, ratios, capital budgeting, cost of capital, valuation) is a themed cluster with its own diagrams and a handful of worked calculations, which Annotated-Concept fits better than a single undifferentiated example list.

| Target                         | Value                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worked examples                | 48 in 9 themes (5 / 5 / 5, 6 / 6 / 6, 5 / 5 / 5; floor 45, band 45 to 60)                                                                                                 |
| Pages                          | `learning/overview.md` and nine theme pages `theme-a-<slug>.md` to `theme-i-<slug>.md`; `### Worked Example N: Title` headings                                            |
| Code-bearing runnable examples | at least 32 of 48, each with a `run.yaml`; at most 16 may be diagram- or table-only                                                                                       |
| Diagrams                       | at least 10, at least one per theme (the adapter sets no band for this mode)                                                                                              |
| Annotation density             | 1.0 to 2.25 on code-bearing examples                                                                                                                                      |
| Course words                   | at least 22,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                           |
| Capstone                       | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                    |
| Metadata                       | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: accounting`, no `status: outline` |

Anchor runtimes: Python 3.14, standard library only (decimal arithmetic), no lockfile, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Time value of money** (page `learning/theme-a-time-value-of-money.md`; ex-01 to ex-05, 5 examples).
- **Theme B: Financial statement analysis** (page `learning/theme-b-financial-statement-analysis.md`; ex-06 to ex-10, 5 examples).
- **Theme C: Profitability and liquidity ratios** (page `learning/theme-c-profitability-and-liquidity-ratios.md`; ex-11 to ex-15, 5 examples).

### Themes 4 to 6 (18 examples)

- **Theme D: Leverage and efficiency ratios** (page `learning/theme-d-leverage-and-efficiency-ratios.md`; ex-16 to ex-21, 6 examples).
- **Theme E: Capital budgeting (NPV and IRR)** (page `learning/theme-e-capital-budgeting-(npv-and-irr).md`; ex-22 to ex-27, 6 examples).
- **Theme F: Cost of capital and WACC** (page `learning/theme-f-cost-of-capital-and-wacc.md`; ex-28 to ex-33, 6 examples).

### Themes 7 to 9 (15 examples)

- **Theme G: Capital structure** (page `learning/theme-g-capital-structure.md`; ex-34 to ex-38, 5 examples).
- **Theme H: Valuation basics** (page `learning/theme-h-valuation-basics.md`; ex-39 to ex-43, 5 examples).
- **Theme I: Sensitivity and judgement** (page `learning/theme-i-sensitivity-and-judgement.md`; ex-44 to ex-48, 5 examples).

## Capstone spec

Evaluate a fictional company's expansion decision end to end: build its pro-forma cash flows, discount them, compute NPV and IRR, compute its WACC under two capital-structure scenarios, and write a one-page recommendation with stated assumptions. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide between two projects with conflicting NPV and IRR rankings; diagnose a liquidity ratio that looks healthy but hides a working-capital problem; recompute a valuation under a changed discount rate.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: compute an annuity's present value; compute WACC from a capital structure; compute NPV from a cash-flow schedule.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every monetary amount uses Python's `decimal.Decimal`, never a float, so rounding is reproducible across runs.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
