# ERP Fiscal Calendar and Period Close (Annotated-Concept)

**Course ID**: `erp-fiscal-calendar-and-period-close` · **Format**: Annotated-Concept.

**Scope note**: Defines fiscal calendars, posting periods, close controls, accruals, and reopening governance as system behaviour. It excludes reporting-standard measurement (financial-statements-and-close-cycle).

**Short summary**: Period close turns changing operating facts into governed reporting evidence.

## Why this exists · the big idea

- **The problem before the solution**: Unrestricted backdating rewrites reported history, and nobody can say which numbers were final.
- **Keep-this-if-you-forget-everything**: A closed period needs a governed correction path, not silent edits.

## Learning objectives

After this course you can:

1. generate fiscal calendars, including 4-4-5 week patterns, from a rule.
2. assign any event to a period with a cutoff rule.
3. run module-level and ledger-level close as separate steps.
4. create auto-reversing accruals and run a year-end rollover.
5. reopen a closed period only with authority, a reason, and an audit trail.

## Prerequisites

- **Prior courses**: `erp-subledger-to-gl-architecture`, `just-enough-python`.
- **Assumed knowledge**: Accounting periods and the close cycle from the accounting courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `financial-statements-and-close-cycle`.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Stable domain facts about fiscal calendars and period close; the 4-4-5 pattern is described generally, not tied to one retail calendar.
- Python datetime documentation; examples use a virtual clock and fixed dates, never the wall clock.

## Concepts

- **co-01 · fiscal-calendar** — an approved sequence of reporting periods.
- **co-02 · posting-period** — the interval in which operational effects are allowed.
- **co-03 · close-status** — the governed permission state for period mutation.
- **co-04 · cutoff** — the rule that assigns an event to a reporting period.
- **co-05 · close-checklist** — an accountable verification set before closure.
- **co-06 · reopen-authorization** — exceptional permission with reason and owner.
- **co-07 · adjustment-entry** — a controlled late correction.
- **co-08 · close-audit** — evidence of who closed what and when.
- **co-09 · fiscal-year-variant** — calendar-month, 4-4-5, and 52 or 53 week years.
- **co-10 · period-per-ledger** — different calendars for different ledgers or companies.
- **co-11 · soft-vs-hard-close** — a module-level close versus the final ledger lock.
- **co-12 · accrual-and-reversal** — an accrual that reverses itself in the next period.
- **co-13 · year-end-rollover** — carrying balances forward and closing income accounts.
- **co-14 · back-dated-posting-policy** — how far back a posting date may reach.
- **co-15 · subledger-first-close** — closing subledgers before the general ledger.
- **co-16 · close-dependencies** — close tasks as a graph with owners.

## Mode, targets, and runtime

- **Mode**: Annotated-Concept (`format: annotated-concept`).
- **Why this mode**: Close is a set of cooperating rules (calendar, status, cutoff, checklist, reopen) that need diagrams, state tables, and small engines together. Annotated-concept fits that mix.

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

- **Theme A: Calendars** (page `learning/theme-a-calendars.md`; ex-01 to ex-05, 5 examples). Anchor **ex-01 · calendar-from-rule** (Python 3.14) — generate periods for a calendar-month year and a 4-4-5 year, then verify period boundaries have no gaps or overlaps.
- **Theme B: Which period?** (page `learning/theme-b-which-period.md`; ex-06 to ex-10, 5 examples). Anchor **ex-06 · cutoff-assignment** (Python 3.14) — assign events near a boundary to periods, then verify the cutoff rule is applied the same way every run.
- **Theme C: Open and closed** (page `learning/theme-c-open-and-closed.md`; ex-11 to ex-15, 5 examples). Anchor **ex-11 · closed-period-rejects-post** (Python 3.14) — post into an open and a closed period, then verify the closed period rejects the posting with a clear reason.

### Themes 4 to 6 (18 examples)

- **Theme D: Soft and hard close** (page `learning/theme-d-soft-and-hard-close.md`; ex-16 to ex-21, 6 examples). Anchor **ex-16 · module-close-then-ledger-close** (Python 3.14) — close the subledgers before the ledger, then verify the ledger cannot close while a subledger is open.
- **Theme E: Accruals** (page `learning/theme-e-accruals.md`; ex-22 to ex-27, 6 examples). Anchor **ex-22 · auto-reversing-accrual** (Python 3.14) — post an accrual that reverses on the first day of the next period, then verify both periods carry the right effect.
- **Theme F: Close checklist** (page `learning/theme-f-close-checklist.md`; ex-28 to ex-33, 6 examples). Anchor **ex-28 · checklist-dag** (Python 3.14) — order close tasks by dependency, then verify a task cannot start before its predecessors finish.

### Themes 7 to 9 (15 examples)

- **Theme G: Reopen with authority** (page `learning/theme-g-reopen-with-authority.md`; ex-34 to ex-38, 5 examples). Anchor **ex-34 · reopen-with-reason** (Python 3.14) — reopen a closed period with an approver and reason, then verify the audit trail and the re-close.
- **Theme H: Year-end** (page `learning/theme-h-year-end.md`; ex-39 to ex-43, 5 examples). Anchor **ex-39 · year-end-rollover** (Python 3.14) — close income accounts to retained earnings and carry forward balances, then verify the opening balances equal prior closing balances.
- **Theme I: Multiple ledgers** (page `learning/theme-i-multiple-ledgers.md`; ex-44 to ex-48, 5 examples). Anchor **ex-44 · two-calendars-one-event** (Python 3.14) — post one event into two ledgers with different calendars, then verify each lands in its own period.

## Capstone spec

Build a period service with calendars, a status machine, checklists, accruals, controlled reopening, and an audit trail, driven by a virtual clock. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: decide where a late invoice belongs; design a reopen policy; order a close checklist.
3. **`## Code katas`**: at least 5 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: build a 4-4-5 calendar; block a post into a closed period; order close tasks by dependency.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- No wall clock: all dates are fixed inputs or a virtual clock.

## Lineage

- The archived syllabus file [erp-fiscal-calendar-and-period-close](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-fiscal-calendar-and-period-close.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 48 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 2 of 5 (Documents, posting, and period close) · position 7 of 27.
- `skills/sharia-erp` — Phase 2 of 6 (Documents, posting, and period close) · position 7 of 30.
