# ERP Conceptual Data Model (Annotated-Concept)

**Course ID**: `erp-conceptual-data-model` · **Format**: Annotated-Concept.

**Scope note**: Models enterprise identities, documents, lines, events, and time at the conceptual level. It excludes module-specific posting policy (erp-posting-rules-and-account-determination) and any vendor's physical schema.

**Short summary**: A durable conceptual model makes facts from different modules linkable and auditable.

## Why this exists · the big idea

- **The problem before the solution**: Modules cannot agree without stable identities and relationships, and a schema built from one module's view breaks at the first second currency or merged company.
- **Keep-this-if-you-forget-everything**: Model a business fact once, then reference it.

## Learning objectives

After this course you can:

1. draw a conceptual model of parties, items, documents, lines, and events for an order-to-cash flow.
2. choose business keys and surrogate keys and explain what each protects.
3. model party roles so one party can be customer and supplier without duplication.
4. record effective-dated facts and tell valid time from record time.
5. express model invariants as runnable checks that survive a physical-schema change.

## Prerequisites

- **Prior courses**: `erp-foundations-and-history`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Entities and relationships; basic SQL helps but is not required.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 6 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Fowler, Analysis Patterns: Reusable Object Models (Addison-Wesley, 1997) for party, accountability, and time patterns.
- Snodgrass, Developing Time-Oriented Database Applications in SQL (Morgan Kaufmann, 1999) for valid time and transaction time.
- PostgreSQL 18 documentation on range types and exclusion constraints, for the effective-dating example.

## Concepts

- **co-01 · business-identity** — a durable key for a party, item, document, or event.
- **co-02 · surrogate-vs-business-key** — an internal id versus a human-meaningful number, and why both exist.
- **co-03 · party-and-role** — one party playing customer, supplier, or employee roles.
- **co-04 · item-and-variant** — the thing traded and its variants and units.
- **co-05 · document-header** — shared context for a business document: parties, dates, currency, status.
- **co-06 · document-line** — a measurable, attributable detail of that document.
- **co-07 · master-reference** — a controlled link to reusable master data.
- **co-08 · event-linkage** — traceability from intent to execution to posting.
- **co-09 · effective-date** — a fact that is valid from one date to another.
- **co-10 · valid-time-vs-record-time** — when a fact was true versus when the system learned it.
- **co-11 · ownership-boundary** — the module accountable for a field's lifecycle.
- **co-12 · reference-vs-copy** — what a document snapshots and what it only links.
- **co-13 · hierarchy-and-structure** — organization units, locations, and categories as trees.
- **co-14 · conceptual-invariant** — a rule that survives physical-schema changes.
- **co-15 · extensibility-attributes** — controlled custom fields without forking the schema.
- **co-16 · identity-merge** — merging duplicate parties without losing history.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: The model has many interlocking concepts (keys, roles, time, snapshots) that each need a diagram, a rule, and a small runnable check. Annotated-concept lets each theme mix diagrams, config, and code.

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

Anchor runtimes: PostgreSQL 18 service container, driven by a `psql` SQL unit or from Python 3.14 through the hash-locked pure-Python pg8000 driver in 1 of 9 anchors; Python 3.14, standard library only (no lockfile) in 8 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Identities and keys** (page `learning/theme-a-identities-and-keys.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · business-vs-surrogate-key** (Python 3.14) — give items an internal id and a business number, then verify a renumbering never breaks a document link.
- **Theme B: Parties and roles** (page `learning/theme-b-parties-and-roles.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · one-party-two-roles** (Python 3.14) — model one company as customer and supplier, then verify a single party record serves both roles.
- **Theme C: Items and units** (page `learning/theme-c-items-and-units.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · item-variants** (Python 3.14) — model an item with size variants and a base unit, then verify variant lookup by attribute.

### Themes 4 to 6 (18 examples)

- **Theme D: Headers and lines** (page `learning/theme-d-headers-and-lines.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · header-line-totals** (Python 3.14) — validate that a document total equals the sum of its lines, then verify a tampered line is rejected.
- **Theme E: Links and events** (page `learning/theme-e-links-and-events.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · intent-to-posting-trace** (Python 3.14) — link an order, a shipment, and an invoice by event, then verify a trace query walks the full chain.
- **Theme F: Time** (page `learning/theme-f-time.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · effective-dated-price** (PostgreSQL 18) — store prices with valid-from and valid-to and query by date, then verify overlapping ranges are rejected by a constraint.

### Themes 7 to 9 (15 examples)

- **Theme G: Snapshot or reference** (page `learning/theme-g-snapshot-or-reference.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · snapshot-address** (Python 3.14) — snapshot the ship-to address on a document, then verify a later master change does not alter the old document.
- **Theme H: Merge and history** (page `learning/theme-h-merge-and-history.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · party-merge** (Python 3.14) — merge two duplicate customers into one survivor, then verify every document keeps a resolvable link and the merge is logged.
- **Theme I: Invariants and extension** (page `learning/theme-i-invariants-and-extension.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · invariant-suite** (Python 3.14) — run a suite of model invariants against sample data, then verify each failing fixture names its broken rule.

## Capstone spec

Build the conceptual model of a small trading company as code and data: parties, items, documents, events, effective dating, and an invariant suite that runs against sample data and prints a model report. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide snapshot versus reference for ten fields; model a party with three roles; find the missing invariant in a sketch.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: detect an overlapping effective date; merge two parties; reject a header-line total mismatch.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- The overlapping-range example uses a documented PostgreSQL 18 feature; its behaviour is checked in the pinned image, not assumed.

## Lineage

- The archived syllabus file [erp-conceptual-data-model](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-conceptual-data-model.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 1 of 5 (ERP model and architecture) · position 2 of 27.
- `skills/sharia-erp` — Phase 1 of 6 (ERP model and architecture) · position 2 of 30.
