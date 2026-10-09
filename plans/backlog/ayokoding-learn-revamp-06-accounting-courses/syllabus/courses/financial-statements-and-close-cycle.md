# Financial Statements and Close Cycle (Annotated-Concept)

**Course ID**: `financial-statements-and-close-cycle` · **Format**: Annotated-Concept.

**Scope note**: Turns posted balances into the four primary statements and runs a period close:
adjusting entries, closing entries, reconciliations, cut-off, and period locks. It excludes revenue
recognition rules in depth (`accrual-accounting-and-revenue-recognition`), consolidation
(`consolidation-and-multi-entity-accounting`), and framework comparisons
(`financial-reporting-standards-ifrs-vs-gaap`).

**Short summary**: Statements are views over the ledger, and the close is the process that makes
those views trustworthy. You generate a balance sheet, income statement, equity statement, and cash
flow statement in Python, and you run a month-end close as a dependency graph of checked tasks.

## Why this exists · the big idea

- **The problem before the solution**: a system that prints statements straight from raw balances,
  with no adjustments, cut-off, or reconciliations, produces numbers nobody can sign.
- **Keep-this-if-you-forget-everything**: the statements are only as good as the close behind them —
  adjust, reconcile, lock, then report.

## Learning objectives

- Map a trial balance to a balance sheet, an income statement, a statement of changes in equity, and
  a cash flow statement, and prove they tie together.
- Record adjusting entries for accruals, deferrals, depreciation, and estimates.
- Close revenue and expense into retained earnings and roll equity forward.
- Build an indirect-method cash flow statement from two balance sheets and an income statement.
- Run a close checklist with owners, dependencies, reconciliations, and a period lock.
- State which presentation rules apply when: IAS 1 until IFRS 18 takes effect on 1 January 2027.

## Prerequisites

- **Prior courses**: `chart-of-accounts-and-data-modeling` (report mappings),
  `journal-entries-and-posting-mechanics` (adjusting and closing entries go through the engine),
  `just-enough-python`.
- **Assumed knowledge**: none beyond the prior courses.

## Mode and targets

- **Mode**: Annotated-Concept, standard (`format: annotated-concept`). **Reason**: statement layouts
  and the close process are best shown as annotated statements, tables, and process diagrams, with
  Python where a statement is generated or a check is automated.
- **Worked examples**: floor 45 in five themes; at least 27 code-bearing.
- **Words**: at least 22,000. **Diagrams**: at least 10.
- **Metadata**: `format: annotated-concept`; `description` kept from plan 03 ("Close a period and
  prepare financial statements you can explain."); `estimatedHours` from the drift test.

## Accuracy notes

- IFRS 18 "Presentation and Disclosure in Financial Statements" was issued in April 2024, replaces
  IAS 1, and is effective 1 January 2027 with early application permitted:
  `https://www.ifrs.org/issued-standards/list-of-standards/ifrs-18-presentation-and-disclosure-in-financial-statements/`,
  accessed 2026-10-09. The course teaches both and labels each example with the rule set it follows.
- Statement structure, adjusting entries, closing entries, and indirect-method cash flows: stable
  domain facts.
- Example 34 depends on IFRS 18's consequential amendment to IAS 7 (the starting point of the
  indirect method). The authoring session did not read that amendment text. The maker cites it with
  URL and access date before writing the example; if it cannot be confirmed, the example is replaced
  by another cash-flow example and the change is recorded.

## Concepts

- **co-01 · tb-to-statements** — statements are mappings and subtotals over trial-balance lines.
- **co-02 · balance-sheet** — assets, liabilities, and equity, split into current and non-current.
- **co-03 · income-statement** — revenue and expenses; IFRS 18 adds operating, investing, and
  financing categories and required subtotals from 2027.
- **co-04 · changes-in-equity** — opening equity, profit, distributions, and closing equity.
- **co-05 · cash-flow-statement** — operating, investing, and financing cash flows by the direct or
  indirect method.
- **co-06 · adjusting-entries** — accruals, deferrals, depreciation, and estimates at period end.
- **co-07 · closing-entries** — moving revenue and expense into retained earnings, or a "virtual
  close" in reports.
- **co-08 · close-checklist** — tasks, owners, dependencies, and deadlines.
- **co-09 · reconciliations** — explaining each balance-sheet account against evidence or a subledger.
- **co-10 · cut-off** — recording each event in the period it belongs to.
- **co-11 · period-lock** — soft close, hard close, and reopening only with approval.
- **co-12 · comparatives** — prior-period figures shown beside the current ones.
- **co-13 · tie-out-checks** — the balance sheet balances, profit ties to equity, cash ties to the
  balance sheet.
- **co-14 · close-automation** — close tasks as a dependency graph of idempotent jobs.

## Worked examples

### Theme A — From trial balance to statements (`learning/theme-a-from-trial-balance-to-statements.md`)

- **ex-01 · tb-fixture** — load a 30-account trial balance — verify it balances. (co-01)
- **ex-02 · map-to-balance-sheet** — map balances to balance-sheet lines — verify assets equal
  liabilities plus equity. (co-01, co-02)
- **ex-03 · current-vs-non-current** — split by the 12-month rule — verify the subtotals. (co-02)
- **ex-04 · income-statement-ias1** — build an income statement by nature of expense — verify profit.
  (co-03)
- **ex-05 · income-statement-ifrs18** — rebuild it with IFRS 18 categories and the operating-profit
  subtotal — verify the same profit with new subtotals. (co-03)
- **ex-06 · presentation-signs** — show credit-normal lines as positive — verify the printed layout.
  (co-01)
- **ex-07 · statement-diagram** — draw ledger → trial balance → statements (Mermaid) — verify each
  arrow names the mapping. (co-01)
- **ex-08 · comparatives** — print current and prior period side by side — verify the columns. (co-12)
- **ex-09 · unmapped-line-guard** — fail when a balance has no statement line — verify. (co-01, co-13)

### Theme B — Adjusting entries (`learning/theme-b-adjusting-entries.md`)

- **ex-10 · accrued-expense** — accrue an unbilled utility cost — verify expense and liability.
  (co-06)
- **ex-11 · accrued-revenue** — accrue earned but unbilled revenue — verify. (co-06)
- **ex-12 · prepaid-expense** — release one month of prepaid insurance — verify. (co-06)
- **ex-13 · deferred-revenue** — release one month of a prepaid subscription — verify. (co-06)
- **ex-14 · depreciation-adjustment** — post a month of straight-line depreciation — verify. (co-06)
- **ex-15 · estimate-adjustment** — book an allowance estimate — verify the balance-sheet effect.
  (co-06)
- **ex-16 · adjusted-trial-balance** — compare unadjusted and adjusted trial balances — verify the
  differences equal the adjustments. (co-06)
- **ex-17 · cut-off-test** — find invoices dated in the wrong period — verify the exceptions. (co-10)
- **ex-18 · adjustment-register** — keep a register of adjustments with evidence — verify every
  adjustment has a reason. (co-06, co-09)

### Theme C — Closing and the equity roll-forward (`learning/theme-c-closing-and-equity.md`)

- **ex-19 · closing-entries** — close revenue and expense to retained earnings — verify they are zero
  afterward. (co-07)
- **ex-20 · virtual-close** — compute retained earnings in the report without posting closing entries
  — verify the same equity. (co-07)
- **ex-21 · year-end-vs-month-end** — close only at year end — verify monthly reports still balance.
  (co-07)
- **ex-22 · changes-in-equity** — build the statement of changes in equity — verify the closing equity
  ties to the balance sheet. (co-04, co-13)
- **ex-23 · dividends** — record a dividend declaration and payment — verify equity and cash. (co-04)
- **ex-24 · opening-balances** — carry closing balances into the new year — verify the opening trial
  balance. (co-07)
- **ex-25 · profit-ties-to-equity** — check that profit equals the change in retained earnings less
  distributions — verify. (co-13)
- **ex-26 · closing-diagram** — draw the year-end close flow (Mermaid) — verify the order of steps.
  (co-07, co-08)

### Theme D — The cash flow statement (`learning/theme-d-the-cash-flow-statement.md`)

- **ex-27 · three-sections** — classify 12 cash movements into operating, investing, and financing —
  verify the table. (co-05)
- **ex-28 · direct-method** — build operating cash flow from cash receipts and payments — verify the
  total. (co-05)
- **ex-29 · indirect-start** — start from profit and add back non-cash items — verify. (co-05)
- **ex-30 · working-capital-changes** — adjust for receivables, inventory, and payables changes —
  verify the signs. (co-05)
- **ex-31 · investing-and-financing** — derive equipment purchases and loan movements — verify. (co-05)
- **ex-32 · cash-ties-out** — check opening cash plus net flow equals closing cash — verify. (co-13)
- **ex-33 · direct-equals-indirect** — compute operating cash both ways — verify equality. (co-05,
  co-13)
- **ex-34 · ifrs18-cash-flow-change** — show the IFRS 18 change to the starting point of the indirect
  method (operating profit) — verify the reconciliation. (co-03, co-05)
- **ex-35 · cash-flow-from-tags** — generate the statement from account cash-flow tags — verify it
  matches example 33. (co-05)

### Theme E — The close as a process (`learning/theme-e-the-close-as-a-process.md`)

- **ex-36 · close-checklist** — model close tasks with owners and deadlines — verify the printed
  checklist. (co-08)
- **ex-37 · task-dependencies** — order tasks topologically — verify the order. (co-08, co-14)
- **ex-38 · cycle-in-close-plan** — detect a dependency cycle — verify the error. (co-14)
- **ex-39 · bank-reconciliation-task** — reconcile cash to the bank statement — verify the
  reconciling items. (co-09)
- **ex-40 · subledger-tie-out** — tie receivables and payables subledgers to control accounts —
  verify zero differences. (co-09)
- **ex-41 · reconciliation-sign-off** — require preparer and reviewer on each reconciliation —
  verify. (co-09)
- **ex-42 · soft-then-hard-close** — soft close, adjust, then hard close — verify postings are refused
  after the hard close. (co-11)
- **ex-43 · reopen-with-approval** — reopen a period only with an approval record — verify. (co-11)
- **ex-44 · idempotent-close-jobs** — rerun a close job — verify it does not post twice. (co-14)
- **ex-45 · close-pack** — produce the close pack: statements, tie-outs, and reconciliations — verify
  every check passes. (co-13)

## Drilling

- **Recall Q&A**: at least 24 with `<details>` answers. **Applied problems**: at least 8 (for
  example "prepare the cash flow statement from these two balance sheets").
- **Code katas**: `kata-01-unmapped-balance`, `kata-02-closing-entry-reversed-sign`,
  `kata-03-cash-flow-sign-error`, `kata-04-cut-off-miss`, `kata-05-close-task-cycle`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**Month-end close.** Starting from the posting engine of the previous course and a month of
transactions, the reader posts adjusting entries, runs reconciliations, locks the period, and
produces the four statements and a close pack whose tie-out checks all pass. The capstone's
`run.yaml` runs the close and compares the close pack with the expected output.

## Code and harness

- Python standard library only. Statements print as fixed-width text with `Decimal` amounts.

## Read more

- **IFRS 18 Presentation and Disclosure in Financial Statements** — IFRS Foundation.

## Lineage

- Replaces the 275-word outline measured on 2026-10-09; moves from position 3 to position 4.

## In which paths

- `skills/conventional-accounting` — Phase 1 (Ledger fundamentals), position 4 · turns the ledger
  into reports.
- `skills/sharia-accounting` — Phase 1 (Ledger fundamentals), position 4 · the same reports before
  AAOIFI presentation is compared.
