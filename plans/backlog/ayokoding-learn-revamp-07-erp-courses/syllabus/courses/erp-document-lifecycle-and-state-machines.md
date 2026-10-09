# ERP Document Lifecycle and State Machines (Annotated-Concept)

**Course ID**: `erp-document-lifecycle-and-state-machines` · **Format**: Annotated-Concept.

**Scope note**: Defines document states, transitions, guards, and effects, including reversal. It excludes how a posting is calculated (erp-posting-rules-and-account-determination).

**Short summary**: A document is safe when every transition is permitted, attributable, and reversible where needed.

## Why this exists · the big idea

- **The problem before the solution**: Free-form status fields hide invalid business transitions, so a shipped order can be edited and a posted invoice can be deleted.
- **Keep-this-if-you-forget-everything**: State transitions are business rules with evidence.

## Learning objectives

After this course you can:

1. model a document lifecycle as a declared transition table instead of scattered if statements.
2. add guards, effects, and authorization checks to a transition.
3. make commands idempotent and reject stale updates.
4. reverse a posted document with a correcting document and keep history intact.
5. validate a state machine for unreachable states and missing exits.

## Prerequisites

- **Prior courses**: `erp-module-map-and-architecture`, `domain-driven-design`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Bounded contexts and aggregates from the domain-driven design course.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 6 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `domain-driven-design`, `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Evans, Domain-Driven Design (Addison-Wesley, 2003) for aggregates and invariants.
- PostgreSQL 18 documentation on UPDATE and row counts for the optimistic-version example.
- Stable domain facts about document lifecycles; states are original, not any vendor's status codes.

## Concepts

- **co-01 · lifecycle-state** — a named, meaningful stage of a document.
- **co-02 · transition** — a permitted move between two states.
- **co-03 · transition-guard** — a condition required before a state change.
- **co-04 · transition-effect** — a controlled consequence, such as a stock move or a posting request.
- **co-05 · command** — a requested change that carries an actor and an intent.
- **co-06 · idempotency** — a repeated request causes no duplicate effect.
- **co-07 · reversal** — an accountable correcting document, not an erased one.
- **co-08 · authorization-point** — a policy check at a transition.
- **co-09 · state-audit** — a trace of prior state, actor, time, and reason.
- **co-10 · immutable-after-post** — what can no longer change once a document is posted.
- **co-11 · optimistic-concurrency** — a version check that rejects stale updates.
- **co-12 · partial-completion** — documents that complete in steps, such as partial receipts.
- **co-13 · cancellation-vs-reversal** — withdrawing before effect versus correcting after effect.
- **co-14 · document-chain** — the link from quote to order to delivery to invoice.
- **co-15 · state-machine-as-data** — transitions declared in a table and validated.
- **co-16 · compensating-transition** — a transition that undoes the effects of an earlier one.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: State machines are taught best as a mix of tables, diagrams, and runnable engines, with each concept shown in a different medium. Annotated-concept fits better than a strict one-snippet-per-idea format.

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

- **Theme A: States and transitions** (page `learning/theme-a-states-and-transitions.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · order-state-table** (Python 3.14) — declare an order lifecycle as a transition table, then verify an undeclared move is rejected.
- **Theme B: Guards** (page `learning/theme-b-guards.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · guard-before-confirm** (Python 3.14) — block order confirmation while a required field is missing, then verify the failure names the guard.
- **Theme C: Commands and actors** (page `learning/theme-c-commands-and-actors.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · command-with-actor** (Python 3.14) — apply a confirm command that carries actor and reason, then verify an audit entry is written.

### Themes 4 to 6 (18 examples)

- **Theme D: Idempotency** (page `learning/theme-d-idempotency.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · duplicate-command** (Python 3.14) — send the same confirm command twice, then verify only one effect occurs.
- **Theme E: Concurrency** (page `learning/theme-e-concurrency.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · stale-version-reject** (PostgreSQL 18) — update a document with a version check in SQL, then verify a stale update changes zero rows.
- **Theme F: Document chains** (page `learning/theme-f-document-chains.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · quote-to-invoice-chain** (Python 3.14) — link quote, order, delivery, and invoice documents, then verify the chain query returns them in order.

### Themes 7 to 9 (15 examples)

- **Theme G: Reversal and compensation** (page `learning/theme-g-reversal-and-compensation.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · reverse-posted-document** (Python 3.14) — reverse a posted invoice with a credit document, then verify the original stays visible and the net effect is zero.
- **Theme H: Partial completion** (page `learning/theme-h-partial-completion.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · partial-receipt-states** (Python 3.14) — receive an order in three partial receipts, then verify the state moves from open to partly received to complete.
- **Theme I: Declared machines** (page `learning/theme-i-declared-machines.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · table-driven-machine-validator** (Python 3.14) — analyze a transition table for unreachable and dead-end states, then verify the report lists them.

## Capstone spec

Build a table-driven document engine used by purchase order, sales order, and invoice documents, with guards, idempotent commands, audit rows, and reversal. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: redesign a status field as a transition table; decide cancel or reverse; spot a missing guard.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: find unreachable states; make a command idempotent; reverse a posted document.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Money amounts use Decimal in Python and numeric in SQL, never float.

## Lineage

- The archived syllabus file [erp-document-lifecycle-and-state-machines](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-document-lifecycle-and-state-machines.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 2 of 5 (Documents, posting, and period close) · position 4 of 27.
- `skills/sharia-erp` — Phase 2 of 6 (Documents, posting, and period close) · position 4 of 30.
