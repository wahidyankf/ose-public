# ERP Subledger to GL Architecture (By Example)

**Course ID**: `erp-subledger-to-gl-architecture` · **Format**: By Example.

**Scope note**: Connects operational subledgers to accountable general-ledger postings, with reconciliation and correction. It excludes close-cycle policy (erp-fiscal-calendar-and-period-close).

**Short summary**: Subledger detail and GL control totals must tell the same economic story.

## Why this exists · the big idea

- **The problem before the solution**: Independent operational and ledger records drift silently, and finance finds out at month end.
- **Keep-this-if-you-forget-everything**: Reconcile each control total to traceable source events.

## Learning objectives

After this course you can:

1. roll subledger lines into control accounts and reconcile them to the ledger.
2. group postings into traceable batches with immutable links back to source events.
3. make posting idempotent and track its status through failure and retry.
4. summarize lines without losing drill-down.
5. correct a bad posting by reversal and replay while history stays intact.

## Prerequisites

- **Prior courses**: `erp-posting-rules-and-account-determination`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Control accounts and trial balance from the accounting courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 16 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `general-ledger-system-architecture`.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- PostgreSQL 18 documentation on transactions and SELECT ... FOR UPDATE SKIP LOCKED for the relay example.
- Kleppmann, Designing Data-Intensive Applications (O'Reilly, 2017), the sections on idempotence and the outbox pattern.
- Stable domain facts about control accounts and reconciliation.

## Concepts

- **co-01 · subledger-event** — a detailed operational financial event.
- **co-02 · control-account** — a GL balance that summarizes a subledger class.
- **co-03 · posting-batch** — an attributable group of generated entries.
- **co-04 · source-link** — an immutable path back to operational evidence.
- **co-05 · reconciliation** — comparison of detail and control totals.
- **co-06 · posting-status** — the lifecycle of a generated accounting effect.
- **co-07 · correction-path** — reversal or adjustment that preserves history.
- **co-08 · period-boundary** — a cutoff preventing late mutation of closed facts.
- **co-09 · trial-balance** — the list of account balances proving debits equal credits.
- **co-10 · sync-vs-async-posting** — posting inside the source transaction versus through a queue.
- **co-11 · outbox-posting** — a reliable handoff from committed state to the posting step.
- **co-12 · idempotent-posting-key** — a key that makes a repeated post harmless.
- **co-13 · summarization** — aggregating many lines into one GL line without losing the link.
- **co-14 · drill-down** — walking from a GL line back to documents.
- **co-15 · reconciliation-break** — a detected mismatch with an owner.
- **co-16 · subledger-types** — receivables, payables, inventory, fixed assets, and payroll as distinct subledgers.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each idea is a small, checkable story of detail rolling up to a total, with a reconciliation result to verify. By Example builds from one control account to async posting with an outbox.

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

- **Cluster: Subledger and control account** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · receivable-control** (Python 3.14) — aggregate customer balances into a control account, then verify detail equals the control total.
- **Cluster: Batches and links** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · batch-trace** (Python 3.14) — trace a GL line to its source event through a batch, then verify the identifiers are immutable.
- **Cluster: Trial balance** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · trial-balance-from-lines** (PostgreSQL 18) — compute a trial balance in SQL from ledger lines, then verify total debits equal total credits.

### Intermediate (28 examples)

- **Cluster: Posting status machine** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · pending-posted-failed** (Python 3.14) — move a posting through pending, posted, and failed, then verify a failed post can be retried once fixed.
- **Cluster: Idempotent posting** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · repost-same-key** (Python 3.14) — post the same source event twice, then verify one entry exists.
- **Cluster: Summarization and drill-down** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · summarize-then-drill** (Python 3.14) — summarize many lines into one GL line, then verify drill-down returns every source line.

### Advanced (25 examples)

- **Cluster: Reconciliation breaks** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · detect-and-classify-break** (Python 3.14) — inject a missing posting, then verify the break is detected, classified, and assigned an owner.
- **Cluster: Corrections** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · correction-replay** (Python 3.14) — reverse a posting and issue a corrected batch, then verify history remains intact and the net balance is right.
- **Cluster: Async posting with an outbox** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · outbox-and-relay** (PostgreSQL 18) — write an outbox row in the source transaction and relay it to the ledger, then verify a relay restart does not double post.

## Capstone spec

Build subledgers for receivables, payables, and inventory that post into a general ledger with batches, links, reconciliation, replay, and an outbox relay. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: locate the source of a break; choose sync or async posting; design a correction for a posted batch.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: reconcile detail to a control total; make a relay restart safe; drill down from a summary line.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- The relay example uses scripted two-session interleaving, not sleeps.

## Lineage

- The archived syllabus file [erp-subledger-to-gl-architecture](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-subledger-to-gl-architecture.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 2 of 5 (Documents, posting, and period close) · position 6 of 27.
- `skills/sharia-erp` — Phase 2 of 6 (Documents, posting, and period close) · position 6 of 30.
