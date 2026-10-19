# Database Migrations with Clojure and Migratus (By Example)

**Course ID**: `database-migrations-with-clojure-and-migratus` · **Format**: By Example.

**Legacy source** (migrated by this plan; the legacy copy is not deleted — deletion is plan 14):

- `apps/ayokoding-www/content/en/learn/legacy/software-engineering/data/tools/clojure-migratus` (5 files, 31,663 words)
  See the [legacy-to-course mapping](../legacy-to-course-mapping.md) for the exact row(s).

**Scope note**: Teaches Migratus as a dedicated schema-migration tool in Clojure: writing, ordering, running, and rolling back migrations safely against a real database. It excludes the generic ORM and query-builder concepts already in `data-access-orms-and-query-builders`.

**Short summary**: Migratus turns a schema change into a reviewable, orderable, reversible artifact; this course teaches it end to end in Clojure.

## Why this exists · the big idea

- **The problem before the solution**: `data-access-orms-and-query-builders` teaches ORM and query-builder concepts generically; nobody teaches Migratus's own migration-ordering, rollback, and team-workflow model in Clojure at the depth this legacy corpus already reaches.
- **Keep-this-if-you-forget-everything**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

## Learning objectives

After this course you can:

1. write a Migratus migration that creates, alters, and safely rolls back a schema change.
2. order migrations so a team working in parallel does not create a conflicting history.
3. run migrations against a real PostgreSQL database inside the course's harness and verify the resulting schema.
4. use Migratus's own tooling to inspect migration history and diagnose a failed or partially applied migration.
5. decide when a migration needs a data backfill step versus a schema-only change.

## Prerequisites

- **Prior courses**: `clojure-essentials`, `sql-essentials`.
- **Assumed knowledge**: Basic SQL DDL (CREATE/ALTER TABLE).
- **Language medium (prerequisite rubric rule L1)**: every example is written in Clojure driving Migratus against PostgreSQL 18, so `clojure-essentials` and `sql-essentials` are listed. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `clojure-essentials`, `sql-essentials`. These are plan 01 to 09 courses this course assumes; adding this course to a path later lists them under that manifest's `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Migratus's own documentation, read and dated at writing time, for command syntax and version-specific behaviour.
- The pinned PostgreSQL 18 service-container image and the pinned toolchain version are the source of truth for any version-specific SQL or migration-tool behaviour.

## Concepts

- **co-01 · migration-file** — a versioned, ordered description of one schema change.
- **co-02 · up-and-down** — the forward change and its reverse.
- **co-03 · migration-history-table** — the database's own record of what has already run.
- **co-04 · linear-vs-branching-history** — whether migrations form one line or can conflict across branches.
- **co-05 · idempotent-migration** — a migration safe to attempt twice.
- **co-06 · backfill** — a data-only step separate from the schema change.
- **co-07 · zero-downtime-migration** — splitting a breaking change into safe, deployable steps.
- **co-08 · rollback** — reversing an applied migration without losing unrelated data.
- **co-09 · schema-drift** — the database's real schema diverging from the migration history.
- **co-10 · baseline** — marking an existing database as the migration starting point.
- **co-11 · checksum-validation** — Migratus's own protection against an edited, already-applied migration.
- **co-12 · transaction-wrapped-migration** — running a migration inside a transaction where the database supports it.
- **co-13 · environment-promotion** — running the same migrations across dev, test, and production in order.
- **co-14 · conflict-resolution** — merging two developers' migrations without breaking order.
- **co-15 · locking-migration** — a migration that needs an exclusive lock, and how to minimize its blast radius.
- **co-16 · migration-testing** — verifying a migration's effect with an automated check.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Migratus's workflow is a sequence of small, independently runnable migration scenarios (create, alter, rollback, conflict, backfill), which By Example teaches well as short verifiable cases against a real database.

| Target             | Value                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                      |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                 |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                          |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                        |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                     |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate, not a gate rule)                                                                   |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                            |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (one sentence, 20 to 120 chars, ending with a period), `category: data-and-databases`, no `status: outline` |

Anchor runtimes: Clojure 1.12.6 on the `clojure` toolchain entry plan 09 adds, extended by this plan with an `install` recipe (tech-docs/003), with Migratus (`migratus:migratus` 1.6.8, `com.github.seancorfield:next.jdbc` 1.3.1118, `org.postgresql:postgresql` 42.7.14, `org.slf4j:slf4j-simple` 2.0.20) from a hash-locked `learning/code/jars.lock`, driving a PostgreSQL 18 service container, in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: First migrations: create and alter** (ex-01 to ex-08, 8 examples).
- **Cluster: Migration history and ordering** (ex-09 to ex-17, 9 examples).
- **Cluster: Rollback basics** (ex-18 to ex-25, 8 examples).

### Intermediate (28 examples)

- **Cluster: Backfills and data migrations** (ex-26 to ex-34, 9 examples).
- **Cluster: Zero-downtime migration splitting** (ex-35 to ex-44, 10 examples).
- **Cluster: Baselining an existing database** (ex-45 to ex-53, 9 examples).

### Advanced (25 examples)

- **Cluster: Conflict resolution across branches** (ex-54 to ex-61, 8 examples).
- **Cluster: Locking migrations and their blast radius** (ex-62 to ex-70, 9 examples).
- **Cluster: Diagnosing a failed or partial migration** (ex-71 to ex-78, 8 examples).

## Capstone spec

Evolve a small order-management schema through eight realistic Migratus migrations (including one zero-downtime column rename and one backfill), verifying the final schema and data with a golden query output. Lives in `learning/capstone/` with its own `run.yaml`.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so every course in the series feels alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: split a breaking schema change into zero-downtime steps; resolve a migration-order conflict between two branches; diagnose a partially applied migration from the history table.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: write a migration and its rollback; add a backfill step to an existing migration; baseline an existing database without losing data.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

Every migration runs against the real, pinned PostgreSQL 18 service container started by the `run.yaml`, never a mock; the course's double-run-with-half-CPU determinism check applies to the final schema state, not to wall-clock timing.

## Lineage

- Migrated from the legacy paths listed above (series decision 34). The legacy pages are **not edited and not deleted** by this plan; they stay under `learn/legacy/` self-described as "kept for reference while the course library fills" until plan 14 deletes them and adds the 308 redirects this plan's mapping file specifies. The maker may mine the legacy pages as source material and must re-verify every fact against current, authoritative sources rather than copying it as already correct.

## In which paths

- **None.** This course migrates unique legacy content with no equivalent in the current catalog and is not yet a member of any career or skills path manifest (plan 02 rules R1 to R10). It is discoverable from the course catalog by its `category`. Adding it to a path's extension phase is left to a later plan or to a maintainer who owns that path, because assigning it now would touch manifests outside this plan's stated scope (closure rule R4 only binds courses that are already path members).
