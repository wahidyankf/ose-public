# Demand and Supply Planning (Annotated-Concept)

**Course ID**: `demand-and-supply-planning` · **Format**: Annotated-Concept.

**Scope note**: Covers forecasts, forecast error, consensus demand, constrained supply plans, safety stock by service level, and the sales and operations planning cycle. It excludes MRP netting (production-planning-and-mrp) and stock allocation (erp-availability-and-reservations).

**Short summary**: Planning is a controlled forecast-and-commitment conversation, not one demand number.

## Why this exists · the big idea

- **The problem before the solution**: A single forecast number hides its error, its owner, and the capacity that limits supply.
- **Keep-this-if-you-forget-everything**: A consensus forecast is not an executable supply plan until it meets capacity.

## Learning objectives

After this course you can:

1. build moving-average, exponential-smoothing, and seasonal forecasts.
2. measure forecast error with MAPE and bias.
3. record consensus overrides with reason and owner.
4. set safety stock from a service level and variability.
5. produce a capacity-constrained supply plan and a gap report.

## Prerequisites

- **Prior courses**: `production-planning-and-mrp`, `just-enough-python`.
- **Assumed knowledge**: MRP netting from the previous course; basic statistics words (mean, deviation).
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Hyndman and Athanasopoulos, Forecasting: Principles and Practice (OTexts), for error measures and smoothing.
- Python statistics documentation: NormalDist for the safety-stock example.
- Vollmann et al., Manufacturing Planning and Control for Supply Chain Management (McGraw-Hill).

## Concepts

- **co-01 · forecast-baseline** — a statistical starting point for demand.
- **co-02 · forecast-error** — the gap between forecast and actual, measured by MAD, MAPE, and bias.
- **co-03 · moving-average-and-smoothing** — simple averaging and exponential smoothing.
- **co-04 · seasonality** — a repeating pattern within the year.
- **co-05 · consensus-demand** — the agreed demand after review.
- **co-06 · override-with-reason** — a manual change with an owner and justification.
- **co-07 · supply-plan** — the production and purchase plan that serves demand.
- **co-08 · capacity-constraint** — the limit on what can be produced in a period.
- **co-09 · safety-stock-policy** — buffer sizing from variability and lead time.
- **co-10 · service-level** — the target probability of not stocking out.
- **co-11 · sales-and-operations-planning** — the periodic cross-function planning cycle.
- **co-12 · aggregation-level** — planning by family versus by item.
- **co-13 · freeze-horizon** — the near period in which the plan does not change.
- **co-14 · plan-versioning** — keeping each approved plan for comparison.
- **co-15 · plan-vs-actual** — comparing the plan with what happened.
- **co-16 · bullwhip-effect** — variability growing as it moves up the supply chain.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Planning mixes statistics, process, and policy; each concept is clearer with a formula, a table, a diagram, or a small run. Annotated-concept fits better than one snippet per idea.

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

Anchor runtimes: Python 3.14, standard library only (no lockfile) in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Baseline forecasts** (page `learning/theme-a-baseline-forecasts.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · moving-average-forecast** (Python 3.14) — forecast the next period with a moving average, then verify the forecast equals the mean of the window.
- **Theme B: Measuring error** (page `learning/theme-b-measuring-error.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · mape-and-bias** (Python 3.14) — compute MAPE and bias on a fixed history, then verify a biased forecast shows a signed bias.
- **Theme C: Seasonality** (page `learning/theme-c-seasonality.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · seasonal-index** (Python 3.14) — compute seasonal indexes from two years of data, then verify the indexes average one.

### Themes 4 to 6 (18 examples)

- **Theme D: Smoothing** (page `learning/theme-d-smoothing.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · exponential-smoothing** (Python 3.14) — forecast with exponential smoothing at two alpha values, then verify a higher alpha reacts faster to a step change.
- **Theme E: Consensus and overrides** (page `learning/theme-e-consensus-and-overrides.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · override-audit** (Python 3.14) — apply a sales override with reason and owner, then verify the audit shows statistical, override, and consensus values.
- **Theme F: Safety stock and service** (page `learning/theme-f-safety-stock-and-service.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · service-level-safety-stock** (Python 3.14) — compute safety stock from a service level using the standard normal, then verify a higher service level needs more stock.

### Themes 7 to 9 (15 examples)

- **Theme G: Constrained supply** (page `learning/theme-g-constrained-supply.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · capacity-capped-plan** (Python 3.14) — cap the supply plan at capacity, then verify unmet demand appears as a visible gap.
- **Theme H: Plan versions** (page `learning/theme-h-plan-versions.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · plan-version-diff** (Python 3.14) — compare two plan versions, then verify the diff lists changed quantities by item and period.
- **Theme I: The planning cycle** (page `learning/theme-i-the-planning-cycle.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · sop-gap-report** (Python 3.14) — produce a demand-supply gap report for the review meeting, then verify gaps sum to the unmet demand.

## Capstone spec

Build a planning workbench with forecasts, error metrics, audited consensus, safety stock by service level, a capacity-constrained supply plan, version comparison, and a gap report. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: explain why a consensus forecast is not an executable plan; choose an aggregation level; review a forecast override.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: compute MAPE and bias; size safety stock; diff two plan versions.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Forecast data is a fixed synthetic series; no random data without a fixed seed.

## Lineage

- The archived syllabus file [demand-and-supply-planning](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/demand-and-supply-planning.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 4 of 5 (Inventory and manufacturing) · position 19 of 27.
- `skills/sharia-erp` — Phase 4 of 6 (Inventory and manufacturing) · position 19 of 30.
