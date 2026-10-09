# Accounting Foundations (Annotated-Concept)

**Course ID**: `accounting-foundations` · **Format**: Annotated-Concept.

**Scope note**: Teaches the accounting equation, double entry, account types, evidence, and the
path from journal to trial balance for one business. It excludes designing a chart of accounts
(`chart-of-accounts-and-data-modeling`), building a posting engine
(`journal-entries-and-posting-mechanics`), and preparing statements
(`financial-statements-and-close-cycle`).

**Short summary**: Accounting is a small, strict data model. You learn why every business event
touches at least two accounts, why the totals must always balance, and why a balanced entry without
evidence is still wrong — and you prove each idea with a tiny Python ledger.

## Why this exists · the big idea

- **The problem before the solution**: engineers who build finance features without the accounting
  model store "transactions" that cannot be traced, reversed, or reconciled, and nobody notices until
  an audit.
- **Keep-this-if-you-forget-everything**: every entry changes the equation
  `assets = liabilities + equity` in a balanced way, and every entry points to evidence of a real
  event.

## Learning objectives

- Explain the accounting equation and show that a set of balanced entries keeps it true.
- Classify any account into one of five types and state its normal balance.
- Record a business event as a balanced journal entry with a date, a description, and evidence.
- Build a trial balance from posted entries and explain what it can and cannot prove.
- Represent money exactly in code and explain why binary floating point is wrong for it.

## Prerequisites

- **Prior courses**: `just-enough-python` (every code-bearing worked example is Python).
- **Assumed knowledge**: arithmetic with negative numbers; reading and running a short Python
  script. No accounting knowledge.

## Mode and targets

- **Mode**: Annotated-Concept, standard sub-mode (`format: annotated-concept`). **Reason**: the
  course builds vocabulary and mental models. Several ideas are clearest as T-account tables or
  diagrams rather than code, and the mode allows that mix while keeping runnable Python where code
  proves the point.
- **Worked examples**: floor 45, band 45–60, in five themes. At least 27 of the 45 (60%) carry
  runnable Python under `learning/code/`.
- **Words**: at least 22,000 words across the course's markdown pages (the derivation is in
  [tech-docs/002](../../tech-docs/002-course-modes-and-definition-of-done.md#word-targets)).
- **Diagrams**: at least one Mermaid diagram per theme; at least 10 in total.
- **Drilling**: the standard drill set from tech-docs/002 with the katas below.
- **Layout**: `learning/overview.md`, `learning/theme-a-…` to `learning/theme-e-…`,
  `learning/capstone/`, `learning/code/ex-NN-<slug>/`, `drilling/overview.md`,
  `drilling/code/kata-NN-<slug>/`.
- **Metadata**: `category: accounting`; `format: annotated-concept`; `description` kept from plan 03
  ("Learn the accounting equation, double entry, and why every entry needs evidence."); and
  `estimatedHours` copied from the drift-test output.

## Accuracy notes

- The accounting equation, double entry, debit and credit sides, and normal balances: stable domain
  facts, taught with original examples.
- Binary floating point cannot represent most decimal fractions exactly: stable computing fact. The
  course cites the Python `decimal` module documentation (`https://docs.python.org/3/library/decimal.html`)
  with its access date at authoring time.
- Martin Kleppmann, "Accounting for Computer Scientists", 7 March 2011,
  `https://martin.kleppmann.com/2011/03/07/accounting-for-computer-scientists.html`, accessed
  2026-10-09 (excerpt: "basic accounting is just graph theory"). Cited as an alternative mental model.

## Concepts

- **co-01 · accounting-entity** — the business is separate from its owners; its books record only its
  own events.
- **co-02 · accounting-equation** — assets equal liabilities plus equity at every moment.
- **co-03 · dual-aspect** — every business event changes at least two accounts.
- **co-04 · account-types** — asset, liability, equity, revenue, and expense, each with a normal
  balance side.
- **co-05 · debit-credit** — debit is the left side and credit the right side; whether a side
  increases a balance depends on the account type.
- **co-06 · expanded-equation** — equity is contributed capital plus retained earnings; revenue and
  expense change retained earnings.
- **co-07 · source-document** — the evidence that an event happened: invoice, receipt, contract, or
  bank statement.
- **co-08 · journal-entry** — a dated, described, balanced set of lines that records one event.
- **co-09 · ledger-account** — the running balance of all lines posted to one account.
- **co-10 · trial-balance** — the list of all account balances; total debits equal total credits.
- **co-11 · timing-preview** — cash basis records events when cash moves, accrual basis when they
  are earned or incurred (owned in depth by `accrual-accounting-and-revenue-recognition`).
- **co-12 · exact-money** — amounts are exact decimals with a currency, never binary floats.
- **co-13 · undetected-errors** — errors a balanced trial balance cannot reveal: omission, wrong
  account, duplicate, and compensating errors.
- **co-14 · audit-trail** — every balance traces back to entries, and every entry to evidence.

## Worked examples

### Theme A — The equation and the entity (`learning/theme-a-the-equation-and-the-entity.md`)

- **ex-01 · three-buckets** — model assets, liabilities, and equity as three totals in Python —
  verify the script prints `assets == liabilities + equity` as `True`. (co-02)
- **ex-02 · owner-invests-cash** — record an owner putting cash into the business — verify assets and
  equity both rise by the same amount. (co-01, co-03)
- **ex-03 · borrow-from-bank** — record a bank loan — verify assets and liabilities rise equally and
  equity is unchanged. (co-02, co-03)
- **ex-04 · buy-equipment-with-cash** — swap cash for equipment — verify total assets do not change.
  (co-03)
- **ex-05 · owner-pays-personal-bill** — decide whether an owner's personal grocery bill belongs in
  the books — verify the script rejects it as outside the entity. (co-01)
- **ex-06 · equation-after-ten-events** — apply ten events in sequence — verify the equation holds
  after every step, not only at the end. (co-02)
- **ex-07 · equation-as-diagram** — draw the equation as a balance with three pans (Mermaid) —
  verify each event moves two pans by equal amounts. (co-02, co-03)
- **ex-08 · break-the-equation** — apply a one-sided change on purpose — verify the check reports
  the exact difference. (co-03)
- **ex-09 · entity-boundary-table** — sort twelve events into "business" and "owner" — verify the
  table against the stated rule. (co-01)

### Theme B — Debits, credits, and account types (`learning/theme-b-debits-credits-and-account-types.md`)

- **ex-10 · five-account-types** — tabulate the five types with examples — verify each example has
  exactly one type. (co-04)
- **ex-11 · normal-balance-lookup** — encode the normal balance side per type in a Python dict —
  verify lookups for all five types. (co-04, co-05)
- **ex-12 · debit-increases-asset** — post a debit to cash — verify the cash balance rises. (co-05)
- **ex-13 · credit-increases-liability** — post a credit to a loan account — verify the loan balance
  rises. (co-05)
- **ex-14 · signed-amount-convention** — store debits as positive and credits as negative — verify
  every balanced entry sums to zero. (co-05, co-12)
- **ex-15 · t-account-table** — show a T-account for cash with five movements — verify the closing
  balance equals the script's balance. (co-05, co-09)
- **ex-16 · revenue-raises-equity** — record a cash sale — verify revenue is a credit and equity
  rises through retained earnings. (co-06)
- **ex-17 · expense-lowers-equity** — record rent paid — verify expense is a debit and equity falls.
  (co-06)
- **ex-18 · contra-account** — introduce a contra-asset (accumulated depreciation) — verify its
  normal balance is a credit. (co-04)
- **ex-19 · wrong-side-detector** — scan balances for accounts sitting on their abnormal side —
  verify the script flags an overdrawn cash account. (co-04, co-05)

### Theme C — Evidence and source documents (`learning/theme-c-evidence-and-source-documents.md`)

- **ex-20 · document-types** — map six document types to the events they prove — verify each event
  has at least one document. (co-07)
- **ex-21 · entry-without-evidence** — try to record an entry with no document reference — verify
  the ledger refuses it. (co-07, co-08)
- **ex-22 · invoice-to-entry** — turn a supplier invoice (JSON) into an entry — verify the document
  number is stored on the entry. (co-07, co-08)
- **ex-23 · receipt-vs-invoice** — compare an invoice (a claim) with a receipt (proof of payment) —
  verify which one supports a cash movement. (co-07)
- **ex-24 · duplicate-document** — record the same invoice twice — verify the duplicate check rejects
  the second one. (co-07, co-13)
- **ex-25 · evidence-chain-diagram** — draw document → entry → ledger → trial balance (Mermaid) —
  verify every arrow names its key. (co-14)
- **ex-26 · description-quality** — compare vague and precise entry descriptions — verify the
  precise one names the counterparty and the document. (co-08)
- **ex-27 · dates-on-an-entry** — distinguish event date, document date, and entry date — verify
  which date drives the period. (co-08)
- **ex-28 · bank-statement-as-evidence** — match a bank statement line to an entry — verify the
  amounts and dates agree. (co-07, co-14)

### Theme D — From journal to trial balance (`learning/theme-d-from-journal-to-trial-balance.md`)

- **ex-29 · journal-as-list** — keep entries in an append-only Python list — verify entries are never
  edited in place. (co-08)
- **ex-30 · balanced-entry-check** — validate that debits equal credits — verify an unbalanced entry
  raises an error. (co-08)
- **ex-31 · compound-entry** — record one event with three lines — verify it still balances. (co-03,
  co-08)
- **ex-32 · post-to-ledger** — build per-account balances from the journal — verify each balance
  equals the sum of its lines. (co-09)
- **ex-33 · trial-balance-report** — print a trial balance sorted by account — verify total debits
  equal total credits. (co-10)
- **ex-34 · equation-from-trial-balance** — derive the equation from the trial balance — verify it
  holds after revenue and expense are folded into equity. (co-02, co-06, co-10)
- **ex-35 · exact-money-decimal** — add 0.10 three times with `float` and with `Decimal` — verify
  only `Decimal` gives exactly 0.30. (co-12)
- **ex-36 · minor-units** — store amounts as integer cents — verify conversions round-trip exactly.
  (co-12)
- **ex-37 · currency-on-every-amount** — attach a currency code to each amount — verify adding two
  currencies raises an error. (co-12)
- **ex-38 · cash-vs-accrual-preview** — record a credit sale under cash basis and accrual basis —
  verify the timing difference. (co-11)

### Theme E — What a trial balance cannot prove (`learning/theme-e-what-a-trial-balance-cannot-prove.md`)

- **ex-39 · omitted-entry** — leave out one invoice — verify the trial balance still balances. (co-13)
- **ex-40 · wrong-account** — post rent to office supplies — verify the trial balance still balances.
  (co-13)
- **ex-41 · compensating-errors** — make two errors that cancel — verify totals still agree. (co-13)
- **ex-42 · duplicate-posting** — post one event twice — verify only the evidence check catches it.
  (co-13, co-14)
- **ex-43 · trace-a-balance** — trace a ledger balance back to its entries and documents — verify the
  trace lists every contributing document. (co-14)
- **ex-44 · reconcile-cash-to-bank** — compare the cash ledger with a bank statement — verify the
  difference is explained by named items. (co-09, co-14)
- **ex-45 · foundations-checklist** — turn the course's rules into a checklist an engineer can apply to
  any finance feature — verify each rule maps to a concept. (co-01–co-14)

## Drilling

- **Recall Q&A**: at least 24 questions, at least one per concept, with `<details>` answers.
- **Applied problems**: at least 8 small scenarios (for example "record these five events and show
  the trial balance"), each with a worked answer.
- **Code katas** (`drilling/code/`): `kata-01-float-money-drift`, `kata-02-unbalanced-entry-accepted`,
  `kata-03-sign-flip-on-liability`, `kata-04-entry-without-evidence`,
  `kata-05-trial-balance-skips-zero-accounts`. Each has a broken version, a fixed version, and a
  `run.yaml` that proves the fix.
- **Self-check checklist**: at least 24 items.
- **Why and why-not prompts**: at least 6, with model answers.

## Capstone spec

**Shoebox to trial balance.** The reader receives 20 source documents as JSON files (owner
investment, a loan, purchases, sales, rent, wages, a duplicate invoice, and one personal expense).
They write a Python program that records each valid document as a balanced entry, rejects the
duplicate and the personal expense with a reason, posts to the ledger, and prints a trial balance and
the equation check. The capstone's `run.yaml` compares the printed report with a stored expected
output.

## Code and harness

- Python standard library only (`decimal`, `dataclasses`, `json`). No database.
- Every code-bearing worked example is `learning/code/ex-NN-<slug>/` with `main.py`, an expected
  output file, and `run.yaml`.

## Read more

- **Accounting for Computer Scientists** — Martin Kleppmann (blog, 2011). A graph view of double
  entry that many engineers find intuitive.
- **Python `decimal` module** — Python Software Foundation documentation. The exact-decimal tool every
  example uses.

## Lineage

- Replaces the 285-word outline measured on 2026-10-09. Mined from the archived syllabus of the
  earlier accounting-foundations plan (2026-08-15), whose "paper exercises, no build" design this plan
  supersedes with runnable code.

## In which paths

- `skills/conventional-accounting` — Phase 1 (Ledger fundamentals), position 1 · the shared
  vocabulary every later course uses.
- `skills/sharia-accounting` — Phase 1 (Ledger fundamentals), position 1 · the same foundation before
  any Sharia-specific modelling.
