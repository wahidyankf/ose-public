# ERP Audit Trail and Change Tracking (Annotated-Concept)

**Course ID**: `erp-audit-trail-and-change-tracking` · **Format**: Annotated-Concept.

**Scope note**: Defines attributable history, change evidence, tamper evidence, and retention. It excludes role and permission design (erp-security-and-controls).

**Short summary**: Accountability needs the before value, the after value, the actor, the time, and the reason.

## Why this exists · the big idea

- **The problem before the solution**: A current value cannot explain who changed it or why, so an auditor cannot trust it.
- **Keep-this-if-you-forget-everything**: Accountability requires preserved before, after, actor, time, and reason.

## Learning objectives

After this course you can:

1. capture before and after values with actor, reason, and correlation id.
2. make history append-only at the database level.
3. answer who changed what between two dates with a query.
4. detect tampering with a hash chain.
5. mask sensitive fields, log reads, and apply a retention window.

## Prerequisites

- **Prior courses**: `erp-document-lifecycle-and-state-machines`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Immutable events and basic SQL triggers help but are explained.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 17 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- PostgreSQL 18 documentation on triggers and privileges for the capture and append-only examples.
- Python hashlib documentation for SHA-256.
- Stable domain facts about audit trails; retention periods are policy inputs and are not stated as legal facts.

## Concepts

- **co-01 · audit-event** — an attributable record of a meaningful operation.
- **co-02 · actor** — the principal responsible for a requested change.
- **co-03 · before-after** — a preserved value comparison.
- **co-04 · reason-code** — a classified explanation for a change.
- **co-05 · correlation-id** — a link across one operational flow.
- **co-06 · append-only** — history grows and is never overwritten.
- **co-07 · retention** — the governed period evidence stays available.
- **co-08 · review-signal** — an observable condition that needs investigation.
- **co-09 · trigger-vs-application-audit** — database triggers versus application-level capture.
- **co-10 · field-level-diff** — recording only the fields that changed.
- **co-11 · tamper-evidence** — a hash chain that exposes edits to history.
- **co-12 · sensitive-field-masking** — hiding protected values in audit output.
- **co-13 · read-access-logging** — recording who viewed sensitive data.
- **co-14 · audit-query** — answering who changed X between two dates.
- **co-15 · ordering-without-wall-clock** — ordering events with sequence numbers instead of trusting clocks.
- **co-16 · audit-volume** — partitioning and archiving a fast-growing audit table.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Audit design combines schema, triggers, application capture, hashing, and policy, and each theme is clearest in its own medium. Annotated-concept fits.

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

Anchor runtimes: PostgreSQL 18 service container, driven by a `psql` SQL unit or from Python 3.14 through the hash-locked pure-Python pg8000 driver in 3 of 9 anchors; Python 3.14, standard library only (no lockfile) in 6 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the theme plan below to every `ex-NN` (title, theme, medium, runtime, task, check, and concept refs). Rules: counts per theme as below; every concept is exercised by at least two examples; every example names at least one concept; each theme starts with its anchor; examples rise from simple to real-world within and across themes.

### Themes 1 to 3 (15 examples)

- **Theme A: Capturing events** (page `learning/theme-a-capturing-events.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · audit-row-on-update** (PostgreSQL 18) — write an audit row from a trigger on update, then verify before and after values are stored.
- **Theme B: Actor and reason** (page `learning/theme-b-actor-and-reason.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · actor-reason-required** (Python 3.14) — reject a change that has no actor or reason, then verify the error names the missing field.
- **Theme C: Before and after** (page `learning/theme-c-before-and-after.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · field-diff** (Python 3.14) — compute a field-level diff of two versions, then verify unchanged fields are omitted.

### Themes 4 to 6 (18 examples)

- **Theme D: Append-only** (page `learning/theme-d-append-only.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · no-update-no-delete** (PostgreSQL 18) — revoke update and delete on the audit table, then verify both statements fail.
- **Theme E: Correlation** (page `learning/theme-e-correlation.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · one-flow-many-events** (Python 3.14) — tag every event of one order flow with a correlation id, then verify a query returns the whole flow in order.
- **Theme F: Querying history** (page `learning/theme-f-querying-history.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · who-changed-price** (PostgreSQL 18) — query who changed a price between two dates, then verify the result lists actor, time, and old and new values.

### Themes 7 to 9 (15 examples)

- **Theme G: Tamper evidence** (page `learning/theme-g-tamper-evidence.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · hash-chain-verify** (Python 3.14) — chain audit rows with SHA-256, then verify an edited row breaks verification at the right position.
- **Theme H: Masking and read logs** (page `learning/theme-h-masking-and-read-logs.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · mask-sensitive-fields** (Python 3.14) — mask protected fields in audit output and log a read, then verify the raw value never appears.
- **Theme I: Retention and archival** (page `learning/theme-i-retention-and-archival.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · retention-window** (Python 3.14) — apply a retention window to audit rows, then verify only rows past the window are archived and the archive keeps the chain valid.

## Capstone spec

Build an audit service that captures document changes with actor and reason, enforces append-only history, verifies a hash chain, masks sensitive fields, answers history queries, and applies retention. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide what to audit on a vendor record; design retention for a regulated ledger; investigate a suspicious change.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: compute a field diff; verify a hash chain; write a who-changed query.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- No legal retention period is stated as fact; retention is a configurable policy input.

## Lineage

- The archived syllabus file [erp-audit-trail-and-change-tracking](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-audit-trail-and-change-tracking.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 2 of 5 (Documents, posting, and period close) · position 9 of 27.
- `skills/sharia-erp` — Phase 2 of 6 (Documents, posting, and period close) · position 9 of 30.
