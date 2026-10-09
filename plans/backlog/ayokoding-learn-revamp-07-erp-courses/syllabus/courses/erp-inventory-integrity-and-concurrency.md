# ERP Inventory Integrity and Concurrency (By Example)

**Course ID**: `erp-inventory-integrity-and-concurrency` · **Format**: By Example.

**Scope note**: Shows how stock stays correct when several users and jobs change it at once: locks, isolation, constraints, idempotent movements, and deterministic testing of interleavings. It excludes distributed-systems theory.

**Short summary**: Concurrent inventory work must keep an auditable, never-negative position.

## Why this exists · the big idea

- **The problem before the solution**: Two users issue the last unit at the same time and both succeed, and the error only shows up in a count weeks later.
- **Keep-this-if-you-forget-everything**: Make the database refuse the wrong state, and make every movement safe to repeat.

## Learning objectives

After this course you can:

1. reproduce a lost update and fix it with an atomic statement or a version check.
2. use constraints so the database rejects negative stock.
3. choose between pessimistic locks, optimistic versions, and SKIP LOCKED queues.
4. show a write-skew anomaly and prevent it with serializable isolation and a bounded retry.
5. explore interleavings with a seeded simulation, print failing seeds, and replay one.

## Prerequisites

- **Prior courses**: `inventory-and-warehouse-management`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Transactions and SQL from the database courses; the stock ledger from the previous course.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 70 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- PostgreSQL 18 documentation: explicit locking, transaction isolation, and SELECT ... FOR UPDATE with NOWAIT and SKIP LOCKED.
- Gray and Reuter, Transaction Processing: Concepts and Techniques (Morgan Kaufmann, 1993).
- Kleppmann, Designing Data-Intensive Applications (O'Reilly, 2017), the chapter on transactions.

## Concepts

- **co-01 · race-condition** — an outcome that depends on the order of concurrent steps.
- **co-02 · lost-update** — a write that silently overwrites another.
- **co-03 · pessimistic-lock** — taking a row lock before changing it.
- **co-04 · optimistic-version** — rejecting a write if the version changed.
- **co-05 · isolation-level** — how much of other transactions a transaction can see.
- **co-06 · serialization-failure-retry** — a bounded retry after a serialization error.
- **co-07 · idempotency-key** — a key that makes a repeated movement harmless.
- **co-08 · constraint-as-guard** — a check constraint that refuses an invalid balance.
- **co-09 · deadlock-and-lock-ordering** — a lock cycle and the ordering rule that prevents it.
- **co-10 · skip-locked-queue** — workers taking different rows without waiting.
- **co-11 · atomic-update** — changing and checking a value in one statement.
- **co-12 · inventory-invariant** — on-hand never below zero and equal to the sum of movements.
- **co-13 · oversell** — promising more than exists.
- **co-14 · deterministic-interleaving** — a scripted order of steps across sessions.
- **co-15 · simulation-seeds** — a fixed seed set that explores schedules and can be replayed.
- **co-16 · crash-consistency** — transaction boundaries that survive a crash mid-flow.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each hazard (lost update, oversell, write skew, deadlock) is a small scripted scenario with a deterministic outcome, which By Example teaches best. The course uses scripted two-session schedules and a seeded explorer instead of timing.

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

Anchor runtimes: PostgreSQL 18 service container, driven by a `psql` SQL unit or from Python 3.14 through the hash-locked pure-Python pg8000 driver in 8 of 9 anchors; Python 3.14 seeded simulation with a virtual clock (`simulation: true`) in 1 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Lost update** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · lost-update-demo** (PostgreSQL 18) — run two scripted sessions that read then write the same balance, then verify one update is lost.
- **Cluster: Atomic updates** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · atomic-decrement-guard** (PostgreSQL 18) — decrement stock in one statement with a condition, then verify an over-issue changes zero rows.
- **Cluster: Constraints as guards** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · check-nonnegative** (PostgreSQL 18) — add a check constraint on on-hand, then verify the database rejects an issue that would go negative.

### Intermediate (28 examples)

- **Cluster: Pessimistic locking** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · for-update-nowait** (PostgreSQL 18) — lock a stock row in session one, then verify session two fails immediately with the lock error.
- **Cluster: Optimistic versioning** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · version-check-reject** (PostgreSQL 18) — update with a version predicate from two sessions, then verify exactly one commits.
- **Cluster: Idempotency keys** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · replay-safe-issue** (PostgreSQL 18) — post the same issue movement twice with one key, then verify the balance falls once.

### Advanced (25 examples)

- **Cluster: Isolation anomalies** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · write-skew-reservation** (PostgreSQL 18) — run a write-skew schedule under repeatable read and under serializable, then verify serializable raises a serialization failure for one session.
- **Cluster: Deadlocks** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · lock-order-fix** (PostgreSQL 18) — lock two rows in opposite orders from two sessions to show a deadlock, then verify a fixed lock order removes it.
- **Cluster: Seeded schedules** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · interleaving-explorer** (Python 3.14 simulation) — explore issue schedules over a fixed seed set with no sleeps, then verify no seed oversells and a failing seed would print with a one-seed replay.

## Capstone spec

Build a stock-issue service with idempotent movements, a bounded serialization retry, and a seeded interleaving explorer that checks the never-negative invariant across a fixed seed set. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: choose a locking strategy for a hot item; judge whether an optimistic retry can oversell; read a deadlock report.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: fix a lost update atomically; reject negative stock with a constraint; replay one failing seed.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Two sessions in one run follow the dblink pattern or a fixed step order in which no statement waits: a step that would wait uses NOWAIT, SKIP LOCKED, or a serialization failure (SQLSTATE 40001), and the few real waits (a row lock, a deadlock) send the blocking statement through dblink and poll pg_stat_activity for the lock wait, never a fixed sleep.
- The seeded explorer follows the plan 05 simulation convention: `simulation: true`, a fixed seed set of at least 32 seeds, one `failing seed: <n> (<invariant>)` line per failure, one final `seeds: <passed> passed, <failed> failed (of <total>)` line, and a one-seed replay with `AYOKODING_SEED=<n>`.

## Lineage

- The archived syllabus file [erp-inventory-integrity-and-concurrency](../../../../done/2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/syllabus/courses/erp-inventory-integrity-and-concurrency.md) is history only and is not edited. It was a thin outline of about 700 bytes with generic concept bullets. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 4 of 5 (Inventory and manufacturing) · position 16 of 27.
- `skills/sharia-erp` — Phase 4 of 6 (Inventory and manufacturing) · position 16 of 30.
