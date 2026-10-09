# Datomic and Datalog Essentials (Annotated-Concept)

**Course ID**: `datomic-and-datalog-essentials` · **Format**: Annotated-Concept.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/data/databases/datomic` (9 files, 50,090 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches the immutable-database and Datalog-query model (facts as datoms, time as a first-class axis, declarative query) using a deterministic reference implementation. It excludes running the real, licensed Datomic server.

**Short summary**: A database that never overwrites a fact, only adds a newer one, changes how you think about time; this course builds a small one to show how.

## Why this exists · the big idea

- **The problem before the solution**: `nosql-databases` and `graph-databases` teach document, key-value, column, and graph models; nobody teaches the immutable-fact, time-aware, Datalog-query model that Datomic popularized, and no course touches Datalog at all.
- **Keep-this-if-you-forget-everything**: Nothing is ever deleted; a retraction is itself a new fact.

## Learning objectives

After this course you can:

1. model data as immutable datoms (entity, attribute, value, transaction) instead of mutable rows.
2. write Datalog queries that join and filter over a fact database declaratively.
3. query the database as of a past point in time without special-casing history in the schema.
4. explain the trade-offs of an immutable, append-only fact log against a row-mutating database.
5. build a minimal, deterministic reference engine that stores datoms and answers simple Datalog queries.

## Prerequisites

- **Prior courses**: `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Basic set theory and SQL joins.
- **Language medium (prerequisite rubric rule L1)**: every example is Python 3.14, standard library only, building and querying a small reference engine, so `just-enough-python` and `sql-essentials` (for the query-concept bridge) are listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Datomic's public documentation and the original Datalog literature, read and dated at writing time, for the concepts this course teaches; this course does not require or teach the licensed Datomic server, and says so explicitly.
- Every claim about the real Datomic product's current licensing or feature set is re-verified at writing time and dated, since vendor terms change.

## Concepts

- **co-01 · datom** — a single immutable fact: entity, attribute, value, transaction.
- **co-02 · entity** — an identity that datoms describe over time.
- **co-03 · attribute-schema** — a declared, typed slot a datom can fill.
- **co-04 · transaction** — an atomic, timestamped batch of asserted or retracted datoms.
- **co-05 · retraction** — marking a fact no longer true without deleting its history.
- **co-06 · as-of-query** — reading the database as it stood at a past transaction.
- **co-07 · datalog-query** — a declarative query of pattern clauses over the fact set.
- **co-08 · unification** — binding query variables consistently across clauses.
- **co-09 · rule** — a reusable, named Datalog clause pattern.
- **co-10 · index** — a sorted structure that makes a query pattern fast.
- **co-11 · cardinality** — whether an attribute holds one value or many per entity.
- **co-12 · reference-attribute** — an attribute whose value is another entity.
- **co-13 · append-only-log** — storage that only ever grows, never overwrites.
- **co-14 · read-scalability** — reading from an immutable log without locking writers.
- **co-15 · schema-evolution** — adding a new attribute without migrating old data.
- **co-16 · trade-off-vs-mutable-db** — where this model costs more and where it costs less than a row-mutating database.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Each idea (datoms, transactions, Datalog, time-travel queries) deserves its own themed walkthrough with diagrams of the underlying log and index structures, which Annotated-Concept supports and a flat example list would not.

| Target                         | Value                                                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worked examples                | 48 in 9 themes (5 / 5 / 5, 6 / 6 / 6, 5 / 5 / 5; floor 45, band 45 to 60)                                                                                                         |
| Pages                          | `learning/overview.md` and nine theme pages `theme-a-<slug>.md` to `theme-i-<slug>.md`; `### Worked Example N: Title` headings                                                    |
| Code-bearing runnable examples | at least 32 of 48, each with a `run.yaml`; at most 16 may be diagram- or table-only                                                                                               |
| Diagrams                       | at least 10, at least one per theme (the adapter sets no band for this mode)                                                                                                      |
| Annotation density             | 1.0 to 2.25 on code-bearing examples                                                                                                                                              |
| Course words                   | at least 22,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                   |
| Capstone                       | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                            |
| Metadata                       | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: data-and-databases`, no `status: outline` |

Anchor runtimes: Python 3.14, standard library only, implementing the reference datom store and Datalog evaluator in-process, no external database, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Datoms and entities** (page `learning/theme-a-datoms-and-entities.md`; ex-01 to ex-05, 5 examples).
- **Theme B: Schema and attributes** (page `learning/theme-b-schema-and-attributes.md`; ex-06 to ex-10, 5 examples).
- **Theme C: Transactions and retraction** (page `learning/theme-c-transactions-and-retraction.md`; ex-11 to ex-15, 5 examples).

### Themes 4 to 6 (18 examples)

- **Theme D: Basic Datalog queries** (page `learning/theme-d-basic-datalog-queries.md`; ex-16 to ex-21, 6 examples).
- **Theme E: Unification and rules** (page `learning/theme-e-unification-and-rules.md`; ex-22 to ex-27, 6 examples).
- **Theme F: As-of and history queries** (page `learning/theme-f-as-of-and-history-queries.md`; ex-28 to ex-33, 6 examples).

### Themes 7 to 9 (15 examples)

- **Theme G: Indexes** (page `learning/theme-g-indexes.md`; ex-34 to ex-38, 5 examples).
- **Theme H: Cardinality and references** (page `learning/theme-h-cardinality-and-references.md`; ex-39 to ex-43, 5 examples).
- **Theme I: Trade-offs and when to use this model** (page `learning/theme-i-trade-offs-and-when-to-use-this-model.md`; ex-44 to ex-48, 5 examples).

## Capstone spec

Build a small reference fact-database engine supporting assert, retract, as-of queries, and a handful of Datalog rules, then model a toy order-and-shipment domain on it and answer five queries including one as-of a past transaction. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: model a many-valued attribute correctly; write a Datalog rule that avoids repeating a join; design an as-of query for an audit question.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: add a retraction and query before and after it; write a Datalog join across three entities; add an index and show the query it speeds up.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

The course states plainly, in its overview and its `## References`, that it does not require or run the licensed Datomic server; the reference engine's behaviour is only claimed to model the concepts, not to replicate every real Datomic feature.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
