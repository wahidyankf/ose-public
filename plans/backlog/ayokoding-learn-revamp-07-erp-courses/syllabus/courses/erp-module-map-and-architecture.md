# ERP Module Map and Architecture (Annotated-Concept)

**Course ID**: `erp-module-map-and-architecture` · **Format**: Annotated-Concept.

**Scope note**: Maps module responsibilities, shared services, and the seams between them. It excludes state machines (erp-document-lifecycle-and-state-machines) and extension design (erp-extension-and-customization).

**Short summary**: Modules organize responsibility; they are not separate truths.

## Why this exists · the big idea

- **The problem before the solution**: Without a module map, two modules both think they own the same fact, and integration turns into copying.
- **Keep-this-if-you-forget-everything**: Define ownership and contracts before integrations.

## Learning objectives

After this course you can:

1. name the responsibilities of finance, sales, purchasing, inventory, manufacturing, and HR modules.
2. assign one source owner to each shared fact and detect violations in a dependency list.
3. choose between a read model and a copy, and between a modular monolith and a service split.
4. keep country rules and company settings out of the core with layered configuration.
5. write architecture decisions as short validated records.

## Prerequisites

- **Prior courses**: `erp-conceptual-data-model`, `just-enough-python`.
- **Assumed knowledge**: The conceptual model from the previous course; basic software architecture vocabulary.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Evans, Domain-Driven Design (Addison-Wesley, 2003) for bounded contexts.
- Fowler, Patterns of Enterprise Application Architecture (Addison-Wesley, 2002) for layering and gateway ideas.
- Stable domain facts about ERP module responsibilities; module names are functional categories, not vendor terms.

## Concepts

- **co-01 · module-responsibility** — bounded accountability for a business capability.
- **co-02 · shared-service** — a cross-module capability behind an explicit contract, such as numbering or currency.
- **co-03 · source-ownership** — the module that writes an authoritative fact.
- **co-04 · read-model** — a derived view owned by its consumer.
- **co-05 · integration-contract** — a stable agreement at a module boundary.
- **co-06 · orchestration** — coordinating a flow without taking over source ownership.
- **co-07 · dependency-direction** — which module may call or read which.
- **co-08 · architecture-decision** — a recorded trade-off with an accountable owner.
- **co-09 · modular-monolith** — modules in one deployable with enforced boundaries.
- **co-10 · service-split** — when a module becomes its own service and what that costs.
- **co-11 · core-vs-periphery** — the finance core versus operational modules.
- **co-12 · cross-cutting-concern** — security, audit, numbering, and localization across modules.
- **co-13 · organization-structure** — company, plant, warehouse, and cost center as shared scaffolding.
- **co-14 · configuration-layers** — product default, industry template, and company setting.
- **co-15 · localization-boundary** — country rules isolated from the core.
- **co-16 · boundary-test** — an automated check that forbids an illegal dependency.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Architecture ideas (ownership, direction, seams, decisions) are best shown with diagrams, small configs, and executable boundary checks side by side. Annotated-concept fits that mix.

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

- **Theme A: Responsibility map** (page `learning/theme-a-responsibility-map.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · module-ownership-table** (Python 3.14) — load a module-to-fact ownership table, then verify every fact has exactly one owner.
- **Theme B: Reading across modules** (page `learning/theme-b-reading-across-modules.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · read-model-vs-copy** (Python 3.14) — build a sales read model from inventory events, then verify it never writes back to the source.
- **Theme C: Shared services** (page `learning/theme-c-shared-services.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · numbering-service-contract** (Python 3.14) — call one numbering service from three modules, then verify no module generates its own numbers.

### Themes 4 to 6 (18 examples)

- **Theme D: Dependency direction** (page `learning/theme-d-dependency-direction.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · dependency-graph-check** (Python 3.14) — parse a module dependency list, then verify a cycle is reported with its path.
- **Theme E: Orchestration** (page `learning/theme-e-orchestration.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · order-confirmation-flow** (Python 3.14) — orchestrate order confirmation across sales, inventory, and finance, then verify each module still owns its own writes.
- **Theme F: Organization scaffolding** (page `learning/theme-f-organization-scaffolding.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · company-plant-warehouse** (Python 3.14) — model company, plant, and warehouse as a tree, then verify a stock record resolves to its company.

### Themes 7 to 9 (15 examples)

- **Theme G: Monolith and services** (page `learning/theme-g-monolith-and-services.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · boundary-enforced-monolith** (Python 3.14) — enforce import rules between module packages, then verify a forbidden import fails the check.
- **Theme H: Configuration and localization** (page `learning/theme-h-configuration-and-localization.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · layered-config-resolve** (Python 3.14) — resolve a setting from product, industry, and company layers, then verify the most specific layer wins and the source layer is reported.
- **Theme I: Decisions** (page `learning/theme-i-decisions.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · decision-record-validator** (Python 3.14) — validate architecture decision records for owner, options, and status, then verify an incomplete record fails.

## Capstone spec

Describe a six-module ERP as data, enforce dependency direction and single ownership in a test, and print an ownership and dependency report. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: redraw a module map to remove a cycle; decide read model or copy; place a country rule in the right layer.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: find a fact with two owners; detect a dependency cycle; resolve layered configuration.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Module names stay functional categories; no vendor module names or table names appear.

## Lineage

- The archived syllabus file [erp-module-map-and-architecture](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-module-map-and-architecture.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 1 of 5 (ERP model and architecture) · position 3 of 27.
- `skills/sharia-erp` — Phase 1 of 6 (ERP model and architecture) · position 3 of 30.
