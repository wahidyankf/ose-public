# Journal Entries and Posting Mechanics (By Example)

**Course ID**: `journal-entries-and-posting-mechanics` · **Format**: By Example.

**Scope note**: Builds a posting engine in Python: journal entries, validation, periods, posting
states, reversals, posting rules, idempotency, and approvals. It excludes the chart design
(`chart-of-accounts-and-data-modeling`), statements and close (`financial-statements-and-close-cycle`),
and the production service architecture with a database (`general-ledger-system-architecture`).

**Short summary**: A journal entry is a small, strict transaction. You build the engine that accepts
or refuses it — balanced, in an open period, on valid accounts, posted exactly once — and you correct
mistakes by adding entries, never by editing them.

## Why this exists · the big idea

- **The problem before the solution**: a finance feature that updates balances directly, edits posted
  rows, or posts twice on a network retry produces books that cannot be audited or reconciled.
- **Keep-this-if-you-forget-everything**: posted entries are immutable facts; every correction is a
  new entry that points to the old one.

## Learning objectives

- Model journal headers and lines and enforce the balancing invariant.
- Validate an entry against the chart, its dimensions, and the period calendar, and report every
  error at once.
- Drive entries through draft, approved, posted, and reversed states and refuse illegal transitions.
- Correct posted entries with reversals and rebooks while keeping a full trail.
- Make posting idempotent so a retried request never posts twice.
- Generate entries from business events with versioned posting rules.

## Prerequisites

- **Prior courses**: `accounting-foundations` (double entry), `chart-of-accounts-and-data-modeling`
  (accounts, dimensions, status), `just-enough-python` (the engine is Python).
- **Assumed knowledge**: Python dataclasses, exceptions, and `unittest`.

## Mode and targets

- **Mode**: By Example (`format: by-example`). **Reason**: the course is a sequence of engine rules,
  each best taught by a runnable example that shows the rule accepting good input and refusing bad
  input.
- **Examples**: floor 75, band 75–85 (Beginner 1–25, Intermediate 26–50, Advanced 51–75).
- **Words**: at least 28,000. **Diagrams**: 30–50.
- **Drilling**: the standard drill set with the 8 katas below.
- **Layout**: the By Example layout (see the chart-of-accounts course file).
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Write and post journal entries
  with the right accounts, dates, and evidence."); `estimatedHours` from the drift test.

## Accuracy notes

- Journal structure, posting states, reversal entries, and period control: stable domain facts.
- Idempotency keys for retried requests: stable engineering practice; the course cites one public
  API design reference with its access date at authoring time.

## Concepts

- **co-01 · journal-header** — entity, entry number, dates, description, source reference, and state.
- **co-02 · journal-line** — account, dimensions, signed amount, and currency.
- **co-03 · balancing-invariant** — the lines of an entry sum to zero in each currency.
- **co-04 · entry-dates** — document date, posting date, and entry time; the posting date picks the
  period.
- **co-05 · period-control** — open, soft-closed, and closed periods.
- **co-06 · posting-state** — draft, approved, posted, and reversed, with allowed transitions.
- **co-07 · immutability** — a posted entry never changes.
- **co-08 · reversal-and-rebook** — corrections by reversal, rebook, and auto-reversing accruals.
- **co-09 · posting-rules** — versioned templates that turn business events into entries.
- **co-10 · subledger-summary** — subledger detail posted to control accounts.
- **co-11 · idempotency** — one business event, one entry, however many retries.
- **co-12 · validation** — chart, dimension, period, and balance checks returning every error.
- **co-13 · numbering** — entry number series per period, and explaining gaps.
- **co-14 · recurring-and-allocation** — templates and allocations with a rounding remainder rule.
- **co-15 · maker-checker** — manual entries need a second person to approve.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · entry-dataclasses** — model header and lines as dataclasses — verify the printed entry.
  (co-01, co-02)
- **ex-02 · signed-amounts** — convert debit and credit columns to signed amounts — verify both
  directions. (co-02)
- **ex-03 · balance-check** — refuse an entry whose lines do not sum to zero — verify the error names
  the difference. (co-03)
- **ex-04 · at-least-two-lines** — refuse a one-line entry — verify the error. (co-03)
- **ex-05 · no-zero-lines** — refuse zero-amount lines — verify the error. (co-12)
- **ex-06 · quantize-to-currency** — round amounts to the currency's minor unit with an explicit
  rounding mode — verify `Decimal` results. (co-02)
- **ex-07 · unknown-account** — validate accounts against a chart — verify an unknown account is
  refused. (co-12)
- **ex-08 · header-account-refused** — refuse lines on non-postable accounts — verify. (co-12)
- **ex-09 · blocked-account-refused** — refuse lines on blocked accounts — verify. (co-12)
- **ex-10 · period-from-posting-date** — derive the period key from the posting date — verify
  `2026-10`. (co-04)
- **ex-11 · closed-period-refused** — refuse posting into a closed period — verify. (co-05)
- **ex-12 · three-dates** — store document, posting, and entry dates — verify which one picks the
  period. (co-04)
- **ex-13 · draft-to-posted** — move an entry from draft to posted — verify the state. (co-06)
- **ex-14 · illegal-transition** — refuse posted back to draft — verify the error. (co-06)
- **ex-15 · frozen-posted-entry** — make posted entries immutable — verify an edit raises. (co-07)
- **ex-16 · posting-updates-balances** — update account balances on posting — verify balances. (co-03)
- **ex-17 · period-journal-report** — print the journal for one period — verify the report. (co-04)
- **ex-18 · description-required** — refuse an empty description — verify. (co-12)
- **ex-19 · source-reference-required** — require a document reference on manual entries — verify.
  (co-01, co-12)
- **ex-20 · numbering-series** — number entries per series and period — verify the sequence. (co-13)
- **ex-21 · sale-with-tax-line** — record a sale with a tax line — verify the entry balances. (co-03)
- **ex-22 · compound-entry** — record a payroll-style entry with six lines — verify. (co-03)
- **ex-23 · state-diagram** — draw the posting states (Mermaid) — verify the diagram matches the
  transition table in code. (co-06)
- **ex-24 · all-errors-at-once** — collect every validation error — verify three errors on one bad
  entry. (co-12)
- **ex-25 · beginner-engine** — assemble a small engine — verify a scripted run. (co-01–co-12)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · reversal-entry** — reverse an entry by mirroring its lines — verify the net effect is zero.
  (co-08)
- **ex-27 · reverse-and-rebook** — fix a wrong account by reversal plus a new entry — verify both
  balances. (co-08)
- **ex-28 · reversal-date** — reverse in the same or the next period — verify each period's totals.
  (co-04, co-08)
- **ex-29 · auto-reversing-accrual** — flag an accrual to reverse on the first day of the next period
  — verify the generated reversal. (co-08)
- **ex-30 · no-double-reversal** — refuse reversing an entry twice — verify. (co-06, co-08)
- **ex-31 · correction-trail** — link original, reversal, and rebook — verify the trail report.
  (co-07, co-08)
- **ex-32 · posting-rules-table** — map event types to entry templates — verify a sale event becomes
  an entry. (co-09)
- **ex-33 · dimensions-from-event** — copy dimensions from the event into lines — verify. (co-09)
- **ex-34 · missing-rule** — fail loudly on an unknown event type — verify. (co-09)
- **ex-35 · rule-versions** — date posting rules — verify the rule in force on a date is used. (co-09)
- **ex-36 · subledger-to-control** — post invoice detail to a receivables control account — verify the
  tie-out. (co-10)
- **ex-37 · summarized-vs-detailed** — post detail lines or one summary — verify equal totals and
  compare traceability. (co-10)
- **ex-38 · idempotency-key** — return the same entry for the same key — verify one posting. (co-11)
- **ex-39 · idempotency-conflict** — refuse the same key with a different payload — verify. (co-11)
- **ex-40 · retry-after-failure** — simulate a failure after posting and a client retry — verify one
  entry. (co-11)
- **ex-41 · recurring-template** — generate monthly rent entries — verify 12 entries. (co-14)
- **ex-42 · allocation-remainder** — allocate a shared cost by drivers — verify the remainder cent
  goes to the largest share. (co-14)
- **ex-43 · rounding-difference-account** — book a rounding difference to a named account — verify.
  (co-03, co-14)
- **ex-44 · functional-amount-preview** — carry transaction and functional amounts — verify the entry
  balances in the functional currency. (co-02, co-03)
- **ex-45 · maker-checker** — refuse self-approval — verify. (co-15)
- **ex-46 · approval-thresholds** — route by amount to approval levels — verify the routes. (co-15)
- **ex-47 · atomic-batch** — post a batch all-or-nothing — verify a bad entry rolls back the batch.
  (co-12)
- **ex-48 · sqlite-journal** — persist the journal with `sqlite3` transactions — verify a reload.
  (co-07)
- **ex-49 · soft-and-hard-close** — allow adjustments in a soft-closed period by role — verify. (co-05)
- **ex-50 · intermediate-engine** — assemble the engine — verify a scripted month. (co-01–co-15)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · journal-as-event-log** — treat the journal as the source and balances as a projection —
  verify a rebuild equals the running balances. (co-07)
- **ex-52 · rebuild-projections** — drop and rebuild balances — verify equality. (co-07)
- **ex-53 · balance-as-of-date** — compute a balance as of a date — verify. (co-04)
- **ex-54 · late-entries-after-close** — route late entries to the next open period with a reason —
  verify. (co-05)
- **ex-55 · backdating-policy** — allow backdating only within open periods — verify. (co-04, co-05)
- **ex-56 · numbering-gaps** — compare gapless and unique numbering — verify the gap report explains
  every gap. (co-13)
- **ex-57 · hash-chain** — chain entry hashes — verify the chain head. (co-07)
- **ex-58 · tamper-detection** — change a stored entry — verify the chain check fails at that entry.
  (co-07)
- **ex-59 · deterministic-ids** — derive entry IDs from the idempotency key — verify reproducible IDs.
  (co-11)
- **ex-60 · bulk-import** — import 1,000 seeded entries — verify the error summary. (co-12)
- **ex-61 · incremental-vs-full** — compare incremental and full balance computation — verify equal
  results. (co-07)
- **ex-62 · lost-update-simulation** — simulate two posters on one balance with a deterministic
  scheduler — verify the naive version loses an update. (co-11)
- **ex-63 · version-check-fix** — add a version check — verify no lost update on every seed. (co-11)
- **ex-64 · out-of-order-events** — post events that arrive out of order — verify balances by posting
  date. (co-04)
- **ex-65 · intercompany-pair-preview** — post mirrored entries in two entities with a shared key —
  verify the pair report. (co-09)
- **ex-66 · statistical-entries** — keep non-money quantities apart from the ledger — verify they never
  reach the trial balance. (co-02)
- **ex-67 · error-codes** — map validation errors to stable codes — verify the codes. (co-12)
- **ex-68 · posting-api-shape** — validate a JSON posting request and response — verify. (co-12)
- **ex-69 · entry-lifecycle-trace** — trace who created, approved, posted, and reversed an entry —
  verify. (co-15)
- **ex-70 · contract-reference-required** — require a contract ID on entries from contract events —
  verify (used later in the Sharia courses). (co-09, co-12)
- **ex-71 · test-builder** — a builder for readable test entries — verify the tests. (co-02)
- **ex-72 · balance-property** — generate random entries from 200 fixed seeds — verify every posted
  entry balances. (co-03)
- **ex-73 · reversal-property** — post and reverse random entries — verify the net is zero for every
  seed. (co-08)
- **ex-74 · engine-review-checklist** — review an engine against the course rules — verify each rule.
  (co-01–co-15)
- **ex-75 · capstone-preview** — run the capstone engine on a sample month — verify the trial balance.
  (co-01–co-15)

## Drilling

- **Recall Q&A**: at least 24, with `<details>` answers. **Applied problems**: at least 8.
- **Code katas**: `kata-01-float-amounts`, `kata-02-posting-to-closed-period`,
  `kata-03-edit-posted-entry`, `kata-04-double-reversal`, `kata-05-retry-posts-twice`,
  `kata-06-allocation-loses-a-cent`, `kata-07-period-from-entry-date`,
  `kata-08-batch-partially-posted`.
- **Self-check checklist**: at least 24 items. **Why and why-not prompts**: at least 6.

## Capstone spec

**A posting engine.** A small Python package (standard library and `sqlite3`) with versioned posting
rules, validation that returns every error, a period calendar, maker-checker approval, idempotent
posting, reversal and rebook, a hash chain, and a trial-balance report. The capstone's `run.yaml` runs
a scripted month of 60 events, then the package's `unittest` suite, and compares the report with the
expected output.

## Code and harness

- Python standard library only; `sqlite3` for persistence examples (in-memory or a temporary file).
- Concurrency examples use a deterministic scheduler driven by a seed; seeds are fixed in `run.yaml`
  and any failing seed is printed.

## Read more

- **Accounting for Computer Scientists** — Martin Kleppmann (2011); the graph view of posting.

## Lineage

- Replaces the 264-word outline measured on 2026-10-09; moves from position 4 to position 3 (see
  [tech-docs/008](../../tech-docs/008-decision-records.md)).

## In which paths

- `skills/conventional-accounting` — Phase 1 (Ledger fundamentals), position 3 · the engine every
  transaction cycle posts through.
- `skills/sharia-accounting` — Phase 1 (Ledger fundamentals), position 3 · the same engine, later fed
  by Islamic contract events.
