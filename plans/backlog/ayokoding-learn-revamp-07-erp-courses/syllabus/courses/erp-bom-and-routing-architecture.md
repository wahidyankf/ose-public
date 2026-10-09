# ERP BOM and Routing Architecture (By Example)

**Course ID**: `erp-bom-and-routing-architecture` · **Format**: By Example.

**Scope note**: Models product structures (bills of materials) and operation routes with versions, yields, substitutions, and engineering changes. It excludes planning (production-planning-and-mrp) and capacity optimization.

**Short summary**: A manufactured result needs a traceable structure version and route version.

## Why this exists · the big idea

- **The problem before the solution**: Production facts cannot be explained without a versioned structure and sequence, so nobody can say which recipe built a batch.
- **Keep-this-if-you-forget-everything**: A manufactured result needs a traceable structure version and route version.

## Learning objectives

After this course you can:

1. model single-level and multi-level bills of materials with quantities per parent.
2. explode and implode structures, including where-used queries with recursive SQL.
3. model routings, operations, and work centers.
4. version structures and routes by effective date and engineering change.
5. apply yields, scrap, phantoms, and approved substitutions with traceability.

## Prerequisites

- **Prior courses**: `erp-conceptual-data-model`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Items, quantities, and basic SQL; recursive queries are taught in the course.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 17 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- PostgreSQL 18 documentation on WITH RECURSIVE for the explosion and where-used queries.
- Orlicky, Material Requirements Planning (McGraw-Hill, 1975) for bills of materials and low-level coding.

## Concepts

- **co-01 · bill-of-materials** — a versioned component structure for an item.
- **co-02 · component-quantity** — the required quantity of a component per parent unit.
- **co-03 · routing** — an ordered path of operations.
- **co-04 · operation** — one accountable transformation step.
- **co-05 · effective-version** — the structure or route approved at a date.
- **co-06 · substitution** — a governed alternative component.
- **co-07 · yield-and-scrap** — expected output relative to input and planned loss.
- **co-08 · trace-link** — evidence connecting a result to the applied version.
- **co-09 · multi-level-bom** — components that are themselves assemblies.
- **co-10 · explosion** — expanding a parent into all components.
- **co-11 · where-used** — finding every parent of a component.
- **co-12 · phantom-assembly** — a grouping that is not stocked or built separately.
- **co-13 · co-and-by-products** — additional outputs from one process.
- **co-14 · work-center** — where an operation runs.
- **co-15 · alternative-routing** — another valid route for the same item.
- **co-16 · engineering-change** — a controlled change to a structure with an effective date.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Structures and routes are taught through many small data-and-query cases (explode, implode, version, substitute) that each have a checkable result. By Example fits.

| Target             | Value                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                     |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                         |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                       |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                    |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate aligned with plan 06, not a gate rule)                                             |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                           |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (plan 03's sentence unless the objectives no longer fit it), `category: erp-systems`, no `status: outline` |

Anchor runtimes: PostgreSQL 18 service container, driven by a `psql` SQL unit or from Python 3.14 through the hash-locked pure-Python pg8000 driver in 2 of 9 anchors; Python 3.14, standard library only (no lockfile) in 7 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Single-level BOM** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · versioned-bom** (Python 3.14) — select a dated component structure, then verify a retired version is excluded.
- **Cluster: Explosion** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · multi-level-explosion** (Python 3.14) — explode a three-level bill into total component quantities, then verify a shared component is summed once per path.
- **Cluster: Where-used** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · where-used-query** (PostgreSQL 18) — find every parent of a component with a recursive query, then verify the result matches the explosion data.

### Intermediate (28 examples)

- **Cluster: Routing and operations** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · route-sequence** (Python 3.14) — order operations into a route, then verify each transition is explicit.
- **Cluster: Yield and scrap** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · yield-adjusted-quantity** (Python 3.14) — adjust component quantity for yield, then verify the gross requirement exceeds the net.
- **Cluster: Effective dating** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · date-effective-structure** (PostgreSQL 18) — select the structure effective on a date in SQL, then verify two versions never overlap.

### Advanced (25 examples)

- **Cluster: Substitutions** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · approved-substitution** (Python 3.14) — apply a substitute component, then verify authorization and trace remain.
- **Cluster: Engineering changes** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · eco-with-effectivity** (Python 3.14) — apply an engineering change effective on a date, then verify orders before the date use the old structure.
- **Cluster: Phantoms and by-products** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · phantom-flattening** (Python 3.14) — flatten a phantom assembly into its parent, then verify the phantom never appears as a stocked item.

## Capstone spec

Build a BOM and routing service with versioned multi-level structures, explosion and where-used (recursive SQL), engineering-change effectivity, substitutions, and a trace to the applied version. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide phantom or stocked; design an engineering change; trace a build to its structure version.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: explode a three-level bill; write a where-used query; select by effective date.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Part numbers and products are invented.

## Lineage

- The archived syllabus file [erp-bom-and-routing-architecture](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-bom-and-routing-architecture.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 4 of 5 (Inventory and manufacturing) · position 17 of 27.
- `skills/sharia-erp` — Phase 4 of 6 (Inventory and manufacturing) · position 17 of 30.
