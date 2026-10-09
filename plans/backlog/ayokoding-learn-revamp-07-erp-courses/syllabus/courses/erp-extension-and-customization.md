# ERP Extension and Customization (By Example)

**Course ID**: `erp-extension-and-customization` · **Format**: By Example.

**Scope note**: Evaluates configuration, extension points, and customization boundaries, with upgrade safety and decision records. It excludes SQL implementation detail (sql-essentials) and integration design (erp-integration-patterns).

**Short summary**: Prefer explicit extension contracts over changing core behaviour.

## Why this exists · the big idea

- **The problem before the solution**: Local changes become upgrade and control debt when nobody knows where core behaviour ends and local behaviour starts.
- **Keep-this-if-you-forget-everything**: Prefer configuration, then declared extension points, and only then customization with an owner.

## Learning objectives

After this course you can:

1. meet a local need with configuration before code.
2. add behaviour at a declared extension point and keep ownership explicit.
3. register plugins with version checks and run hooks with defined order and failure behaviour.
4. check an extension against a new core version for compatibility.
5. evolve a schema with expand and contract steps and record the decision.

## Prerequisites

- **Prior courses**: `erp-module-map-and-architecture`, `sql-essentials`, `just-enough-python`.
- **Assumed knowledge**: SQL from the database course and the module map from this path.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 17 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `sql-essentials`, `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- PostgreSQL 18 documentation on views and ALTER TABLE for the schema examples.
- Semantic Versioning 2.0.0 (semver.org) for version ranges.

## Concepts

- **co-01 · configuration** — supported parameterized variation.
- **co-02 · extension-point** — a declared seam for additional behaviour.
- **co-03 · customization** — a local change to core behaviour that needs an owner.
- **co-04 · upgrade-risk** — the likelihood a change blocks future upgrades.
- **co-05 · data-ownership** — accountable authority over a stored fact.
- **co-06 · compatibility-contract** — behaviour preserved across versions.
- **co-07 · migration-path** — a controlled transition for changed data.
- **co-08 · decision-record** — a durable rationale for the chosen approach.
- **co-09 · plugin-registry** — a list of extensions with versions and requirements.
- **co-10 · hook-vs-event** — synchronous hooks versus asynchronous events.
- **co-11 · custom-field** — a validated extra attribute on a core record.
- **co-12 · reporting-view** — a read-only view that adds local reporting without changing core tables.
- **co-13 · expand-contract-migration** — adding before removing so old and new code both work.
- **co-14 · feature-flag-for-change** — switching a change on per tenant or per company.
- **co-15 · extension-test-harness** — running extensions against a fake core.
- **co-16 · lock-in-awareness** — naming what a customization ties you to.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each extension technique is a small before-and-after case with a checkable compatibility result, which By Example teaches as many short runs ranging from a parameter to an upgrade check.

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

- **Cluster: Configuration first** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · parameter-not-code** (Python 3.14) — meet a local need with a parameter, then verify the core code path is unchanged.
- **Cluster: Custom fields** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · custom-field-validation** (Python 3.14) — add a validated custom field to a record, then verify an invalid value is rejected with the field name.
- **Cluster: Read-only views** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · reporting-view** (PostgreSQL 18) — add a local reporting view over core tables, then verify core tables are untouched.

### Intermediate (28 examples)

- **Cluster: Extension points** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · extension-contract** (Python 3.14) — add derived behaviour at a declared extension point, then verify ownership of the data stays explicit.
- **Cluster: Hooks and events** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · hook-order-and-failure** (Python 3.14) — run two hooks in a defined order with one failing, then verify the failure policy is applied and reported.
- **Cluster: Registry** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · plugin-registry-version-check** (Python 3.14) — load plugins that declare a core version range, then verify an incompatible plugin is refused.

### Advanced (25 examples)

- **Cluster: Upgrade safety** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · upgrade-compat-check** (Python 3.14) — check an extension against a changed core contract, then verify the report lists each broken dependency.
- **Cluster: Schema evolution** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · expand-contract-migration** (PostgreSQL 18) — rename a column using expand and contract steps, then verify old and new readers both work in between.
- **Cluster: Decision records** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · customization-review** (Python 3.14) — record upgrade and migration risk for a customization, then verify a decision owner exists before approval.

## Capstone spec

Build an extension host with a plugin registry, custom fields, hooks, a reporting view, and an upgrade compatibility checker. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide configuration, extension, or customization for a request; review a customization for upgrade risk; plan a safe schema change.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: add a validated custom field; refuse an incompatible plugin; run an expand-contract rename.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- No vendor extension framework is named or reproduced.

## Lineage

- The archived syllabus file [erp-extension-and-customization](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-extension-and-customization.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 5 of 5 (Extending and operating the ERP) · position 22 of 27.
- `skills/sharia-erp` — Phase 5 of 6 (Extending and operating the ERP) · position 22 of 30.
