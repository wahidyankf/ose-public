# ERP Posting Rules and Account Determination (By Example)

**Course ID**: `erp-posting-rules-and-account-determination` · **Format**: By Example.

**Scope note**: Designs deterministic account selection from business facts, with explanation. It excludes the ledger engine and reconciliation (erp-subledger-to-gl-architecture).

**Short summary**: Posting policy must be inspectable from its input facts and the rule it chose.

## Why this exists · the big idea

- **The problem before the solution**: Manual account choices make identical events post differently, and nobody can later say why an amount landed where it did.
- **Keep-this-if-you-forget-everything**: Store why an account was determined, not just the account.

## Learning objectives

After this course you can:

1. select accounts from item group, document type, and movement type with a rule table.
2. resolve rule conflicts with explicit precedence and fallbacks.
3. apply the policy version active on the event date.
4. derive dimensions, tax lines, and currency amounts into a balanced entry.
5. allocate rounding differences so entries still balance, and route unmatched events to an exception queue.

## Prerequisites

- **Prior courses**: `erp-document-lifecycle-and-state-machines`, `just-enough-python`.
- **Assumed knowledge**: Debit and credit basics from the accounting courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14, so `just-enough-python` is listed as a prerequisite. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **See also (links, not prerequisites)**: `journal-entries-and-posting-mechanics`, `chart-of-accounts-and-data-modeling`.
- **Outside this plan (must already be filled)**: `just-enough-python`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Fowler, Analysis Patterns (Addison-Wesley, 1997), the accounting patterns chapters, for posting rules and accounting events.
- Python decimal module documentation for rounding modes and exact amounts.
- Stable domain facts about double-entry; account names are original labels, not a vendor chart.

## Concepts

- **co-01 · posting-event** — an approved transition that needs an accounting effect.
- **co-02 · determination-key** — the facts that select a rule.
- **co-03 · rule-precedence** — explicit tie-breaking among matching rules.
- **co-04 · account-role** — a named role, such as inventory or goods-received-not-invoiced, mapped to accounts.
- **co-05 · account-mapping** — a controlled mapping from facts to an account.
- **co-06 · effective-policy** — the rule version active on the event date.
- **co-07 · exception-queue** — an accountable route for events with no matching rule.
- **co-08 · balanced-entry** — equal debits and credits produced by a rule.
- **co-09 · explanation-trace** — evidence of input, rule, and output.
- **co-10 · dimension-derivation** — cost center, project, or segment taken from the event.
- **co-11 · tax-line-derivation** — tax accounts taken from a tax code.
- **co-12 · currency-handling** — transaction and functional amounts inside one entry.
- **co-13 · rounding-allocation** — spreading cents so the entry still balances.
- **co-14 · simulation-mode** — a dry-run posting that changes nothing.
- **co-15 · rule-versioning** — changing a rule without rewriting history.
- **co-16 · rule-testing** — golden cases that pin a rule table's behaviour.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Every idea is a small rule case with a checkable posting result (input facts in, entry out), which is what By Example teaches best: many short, fully runnable cases that build from a lookup to a versioned rule engine.

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

Anchor runtimes: Python 3.14, standard library only (no lockfile) in 9 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Lookup by item group** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · item-group-rule** (Python 3.14) — determine a stock account from an item group, then verify the selected rule id is reported.
- **Cluster: Entries from events** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · goods-receipt-entry** (Python 3.14) — turn a goods receipt into a debit and credit pair, then verify debits equal credits.
- **Cluster: Balanced entries** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · balance-check-guard** (Python 3.14) — reject an entry whose debits and credits differ, then verify nothing is posted.

### Intermediate (28 examples)

- **Cluster: Precedence and fallback** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · specific-beats-general** (Python 3.14) — match a specific rule before a general one, then verify the trace names the winner and the runner-up.
- **Cluster: Effective dating** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · effective-date-rule** (Python 3.14) — apply the policy active on the posting date, then verify a superseded policy is not used.
- **Cluster: Dimensions, tax, and currency** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · tax-and-currency-lines** (Python 3.14) — add tax lines and a functional-currency amount to an entry, then verify each line balances in both currencies.

### Advanced (25 examples)

- **Cluster: Rounding and allocation** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · largest-remainder-allocation** (Python 3.14) — allocate a total across lines by weight, then verify the lines sum exactly to the total.
- **Cluster: Exceptions and dry run** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · unmatched-event-queue** (Python 3.14) — route an event with missing facts to an exception queue, then verify no guessed account posts.
- **Cluster: Versioning and golden tests** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · rule-version-golden-set** (Python 3.14) — pin a rule table with golden cases, then verify a rule change that alters a golden case fails the suite.

## Capstone spec

Build a posting engine for purchase, sale, and stock events with a rule table, precedence, effective dates, explanation traces, rounding allocation, and an exception queue, pinned by a golden-case suite. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: choose the determination keys for a new event; resolve two rules that both match; plan a rule change with effective dating.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: add a rule without breaking precedence; allocate cents by largest remainder; explain a posting from its trace.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- Money uses Decimal with an explicit rounding mode, never float.
- Account names and codes are invented, not copied from a vendor chart.

## Lineage

- The archived syllabus file [erp-posting-rules-and-account-determination](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-posting-rules-and-account-determination.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 2 of 5 (Documents, posting, and period close) · position 5 of 27.
- `skills/sharia-erp` — Phase 2 of 6 (Documents, posting, and period close) · position 5 of 30.
