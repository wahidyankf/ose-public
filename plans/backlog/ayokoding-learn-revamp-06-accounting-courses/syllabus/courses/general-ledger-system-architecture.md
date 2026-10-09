# General Ledger System Architecture (By Example)

**Course ID**: `general-ledger-system-architecture` · **Format**: By Example.

**Scope note**: Designs and builds a general-ledger service with PostgreSQL and Python: the schema,
database-enforced balance, an append-only journal, balances and snapshots, idempotent posting,
concurrency, posting rules, periods, sub-ledger integration, the outbox, and testing. It excludes
distributed ledgers across several databases, blockchain ledgers, and Sharia-specific design
(`sharia-ledger-system-architecture`).

**Short summary**: The general ledger is the one place every financial number must agree. You build a
ledger service whose database refuses unbalanced entries, whose history cannot be edited, whose posts
are safe to retry, and whose balances stay right under concurrent load.

## Why this exists · the big idea

- **The problem before the solution**: ledgers built as ordinary CRUD tables drift out of balance, lose
  history to updates, double-post on retries, and corrupt balances when two requests race.
- **Keep-this-if-you-forget-everything**: the ledger is an append-only log of balanced entries;
  correctness lives in the database constraints and in idempotent, serialized posting, not in the
  callers' good behaviour.

## Learning objectives

- Design a ledger schema in PostgreSQL that enforces balance, immutability, and period locks.
- Implement idempotent posting with keys and safe retries.
- Keep balances correct under concurrency with locks, isolation levels, and retry loops.
- Integrate sub-ledgers through posting rules and the outbox pattern.
- Test a ledger with invariants, property-style seeds, and deterministic concurrency scenarios.

## Prerequisites

- **Prior courses**: `chart-of-accounts-and-data-modeling` (the account schema),
  `journal-entries-and-posting-mechanics` (the posting engine in Python),
  `financial-statements-and-close-cycle` (periods and close), `multi-currency-accounting-and-fx-translation`
  (amounts with currencies), `audit-controls-and-compliance` (audit trail and controls),
  `sql-essentials`, `backend-essentials` (services, APIs, retries), `just-enough-python`.
- **Assumed knowledge**: transactions and isolation at the level of `sql-essentials`.

## Mode and targets

- **Mode**: By Example. **Reason**: architecture claims about a ledger (refuses unbalanced entries,
  survives retries, stays correct under races) are only convincing when the reader runs them and sees
  the database refuse or the test catch the bug.
- **Examples**: floor 75. **Words**: at least 28,000. **Diagrams**: 30–50.
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Design a general ledger system
  that stays balanced, auditable, and safe to retry."); `estimatedHours` from the drift test.

## Accuracy notes

- PostgreSQL 18 behaviour (deferred constraint triggers, `SERIALIZABLE` isolation and serialization
  failures with SQLSTATE `40001`, `SELECT ... FOR UPDATE`, declarative partitioning) is cited from the
  PostgreSQL 18 documentation with its access date; PostgreSQL 18.6 was the current minor release on
  2026-10-09 (`https://www.postgresql.org/support/versioning/`).
- "Accounting for Computer Scientists", Martin Kleppmann, 7 March 2011,
  `https://martin.kleppmann.com/2011/03/07/accounting-for-computer-scientists.html`, accessed
  2026-10-09, is cited for the graph view of entries.
- Claims about specific companies' ledgers are allowed only with a public primary source (an
  engineering blog post with URL and date); otherwise they are removed.

## Concepts

- **co-01 · ledger-boundaries** — what the GL service owns and what sub-ledgers own.
- **co-02 · ledger-schema** — accounts, entries, lines, periods, and currencies.
- **co-03 · db-enforced-balance** — a deferred constraint trigger that rejects unbalanced entries.
- **co-04 · append-only** — no updates or deletes; corrections are reversals.
- **co-05 · balances** — computed from lines, cached per account and period, and checked.
- **co-06 · snapshots** — period-end balance snapshots for fast reads.
- **co-07 · idempotency** — client keys, unique constraints, and replayed responses.
- **co-08 · concurrency** — row locks, isolation levels, and retry on serialization failure.
- **co-09 · posting-rules** — business events turned into entries by versioned rules.
- **co-10 · periods** — open, closed, and locked periods enforced by the database.
- **co-11 · outbox** — publishing ledger events reliably in the same transaction.
- **co-12 · sub-ledger-integration** — control accounts and reconciliation with sub-ledgers.
- **co-13 · audit-trail** — who posted what, when, from which request, with a hash chain.
- **co-14 · scale** — partitioning by period and archival.
- **co-15 · ledger-testing** — invariants, seeded scenarios, and deterministic race tests.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · service-boundary-diagram** — draw the GL and its sub-ledgers (Mermaid) — verify. (co-01)
- **ex-02 · accounts-table** — create the accounts table with constraints — verify. (co-02)
- **ex-03 · entries-and-lines** — create entry and line tables — verify foreign keys. (co-02)
- **ex-04 · amount-type** — store amounts as `numeric(19,4)` with a currency — verify float is
  refused. (co-02)
- **ex-05 · debit-credit-sign** — store a signed amount with a check — verify. (co-02)
- **ex-06 · post-balanced-entry** — insert a balanced entry in one transaction — verify. (co-02)
- **ex-07 · balance-trigger** — add a deferred constraint trigger — verify an unbalanced entry fails at
  commit. (co-03)
- **ex-08 · single-currency-per-entry** — check each entry balances per currency — verify. (co-03)
- **ex-09 · no-update-trigger** — refuse updates to posted lines — verify. (co-04)
- **ex-10 · no-delete-trigger** — refuse deletes — verify. (co-04)
- **ex-11 · reversal-entry** — correct with a reversal — verify history. (co-04)
- **ex-12 · account-balance-query** — compute a balance from lines — verify. (co-05)
- **ex-13 · trial-balance-query** — compute a trial balance — verify it sums to zero. (co-05)
- **ex-14 · periods-table** — add periods with states — verify. (co-10)
- **ex-15 · closed-period-guard** — refuse posting into a closed period — verify. (co-10)
- **ex-16 · posting-api-in-python** — call the database from a Python function — verify. (co-02)
- **ex-17 · validation-before-insert** — validate in Python and in the database — verify both layers.
  (co-03)
- **ex-18 · idempotency-key** — add a unique key per request — verify a duplicate is refused. (co-07)
- **ex-19 · replayed-response** — return the original entry on a retry — verify. (co-07)
- **ex-20 · audit-columns** — store who, when, and request ID — verify. (co-13)
- **ex-21 · entry-sequence** — number entries without gaps per period — verify. (co-02)
- **ex-22 · account-status** — block posting to inactive accounts — verify. (co-02)
- **ex-23 · ledger-er-diagram** — draw the schema (Mermaid) — verify. (co-02)
- **ex-24 · seed-data-script** — load a fixture chart and opening balances — verify. (co-02)
- **ex-25 · beginner-ledger** — post a day of entries — verify the trial balance. (co-01–co-07)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · balance-cache-table** — maintain balances in a table — verify against lines. (co-05)
- **ex-27 · balance-drift-check** — detect a cache that drifts — verify. (co-05)
- **ex-28 · lost-update-race** — show two sessions updating one balance — verify the lost update.
  (co-08)
- **ex-29 · select-for-update** — fix the race with row locks — verify. (co-08)
- **ex-30 · serializable-isolation** — use `SERIALIZABLE` — verify a `40001` failure appears. (co-08)
- **ex-31 · retry-loop** — retry on serialization failure in Python — verify the final balance.
  (co-08)
- **ex-32 · lock-ordering** — lock accounts in a fixed order — verify no deadlock. (co-08)
- **ex-33 · posting-rules-table** — store rules as data — verify. (co-09)
- **ex-34 · rule-versioning** — version rules by effective date — verify. (co-09)
- **ex-35 · event-to-entry** — turn an invoice event into an entry — verify. (co-09)
- **ex-36 · unknown-event** — park events without a rule — verify the suspense queue. (co-09)
- **ex-37 · control-accounts** — block direct posting to control accounts — verify. (co-12)
- **ex-38 · subledger-reconciliation** — reconcile AR sub-ledger to GL — verify. (co-12)
- **ex-39 · outbox-table** — write events to an outbox in the same transaction — verify. (co-11)
- **ex-40 · outbox-relay** — relay outbox events once — verify. (co-11)
- **ex-41 · period-close** — close a period in the database — verify. (co-10)
- **ex-42 · period-snapshot** — snapshot balances at close — verify. (co-06)
- **ex-43 · reopen-with-approval** — reopen with an approval record — verify. (co-10, co-13)
- **ex-44 · hash-chain-audit** — chain entry hashes — verify tamper detection. (co-13)
- **ex-45 · multi-currency-lines** — store transaction and functional amounts — verify both balance.
  (co-03)
- **ex-46 · revaluation-batch** — post revaluation entries as a batch — verify. (co-09)
- **ex-47 · ledger-api-shapes** — design request and response shapes — verify validation. (co-07)
- **ex-48 · error-model** — map database errors to API errors — verify. (co-03, co-08)
- **ex-49 · reporting-views** — create views for statements — verify. (co-05)
- **ex-50 · intermediate-ledger** — run a month with races and retries — verify invariants. (co-01–co-13)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · partition-by-period** — partition lines by period — verify queries. (co-14)
- **ex-52 · archive-closed-years** — move closed years to archive partitions — verify reads. (co-14)
- **ex-53 · snapshot-plus-delta** — read balances from snapshot plus delta — verify equality. (co-06)
- **ex-54 · bulk-posting** — post a large batch in one transaction — verify all-or-nothing. (co-02)
- **ex-55 · batch-idempotency** — retry a half-sent batch — verify no duplicates. (co-07)
- **ex-56 · ordering-guarantees** — explain ordering of entries and events — verify. (co-11)
- **ex-57 · multi-entity-ledger** — add a company dimension — verify per-company balance. (co-02)
- **ex-58 · intercompany-pair** — post both sides of an intercompany entry atomically — verify. (co-03)
- **ex-59 · invariant-suite** — check all invariants in SQL — verify. (co-15)
- **ex-60 · seeded-scenarios** — run seeded random posting scenarios — verify invariants hold. (co-15)
- **ex-61 · deterministic-race-test** — reproduce a race with a seeded scheduler — verify the fix.
  (co-08, co-15)
- **ex-62 · two-session-race-in-sql** — run two database sessions in a fixed order — verify the lock
  wait and result. (co-08)
- **ex-63 · migration-safety** — add a column without breaking posting — verify. (co-14)
- **ex-64 · backfill** — backfill a new dimension with an audit record — verify. (co-13)
- **ex-65 · read-replica-lag** — show why balance checks must read the primary — verify. (co-05)
- **ex-66 · observability** — record posting metrics and an error log — verify. (co-13)
- **ex-67 · access-control** — limit posting to a database role — verify. (co-13)
- **ex-68 · sod-in-ledger** — prevent self-approval of manual entries — verify. (co-13)
- **ex-69 · disaster-recovery-check** — verify a restore by recomputing the trial balance — verify.
  (co-15)
- **ex-70 · event-sourcing-comparison** — compare the ledger with an event-sourced design — verify the
  trade-off table. (co-01)
- **ex-71 · ledger-as-a-service-api** — expose posting and balance endpoints with the standard library
  `http.server` — verify. (co-07)
- **ex-72 · load-check** — post many entries and check invariants — verify (no timing assertions).
  (co-14, co-15)
- **ex-73 · architecture-diagram** — draw the final design (Mermaid) — verify. (co-01–co-14)
- **ex-74 · design-review-checklist** — review a ledger design — verify. (co-01–co-15)
- **ex-75 · capstone-preview** — run the capstone — verify. (co-01–co-15)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-unbalanced-entry-commits`, `kata-02-posted-line-updated`,
  `kata-03-retry-double-posts`, `kata-04-lost-update`, `kata-05-deadlock-from-lock-order`,
  `kata-06-closed-period-posting`, `kata-07-outbox-outside-transaction`,
  `kata-08-balance-cache-drift`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.

## Capstone spec

**A general-ledger service.** A PostgreSQL schema with balance, immutability, and period triggers;
idempotent posting with retries; locked balance updates; versioned posting rules; an outbox; a hash-chained
audit trail; snapshots; and an invariant suite with seeded and two-session race scenarios. The
`run.yaml` loads the schema into the PostgreSQL 18 service, runs a scripted quarter, and compares the
trial balance, invariant report, and race-test results.

## Code and harness

- SQL units use the `psql` toolchain with the `postgres` service (`psql -X -v ON_ERROR_STOP=1 -f
<file>.sql`); Python units that call the database use the `python` toolchain, the `postgres`
  service, and the course lockfile pinning `pg8000` through its DB-API 2.0 interface, so the code
  transfers to other DB-API drivers. See
  [tech-docs/003](../../tech-docs/003-code-harness-and-determinism.md#database-units).
- Two-session races (examples 28–32 and 62) drive the second session through the `dblink` extension
  from one `psql` script, if the `psql` toolchain phase (delivery Phase 1) confirms the pinned image ships it; the script moves on only
  after `pg_stat_activity` shows the other session waiting on the lock. Otherwise a Python unit steps
  two `pg8000` connections in an order where no statement waits (conflicting writes after the other
  commit, lock conflicts with `NOWAIT`). Never a sleep. The full rules are in
  [tech-docs/003](../../tech-docs/003-code-harness-and-determinism.md#two-sessions-in-one-run).
- No wall-clock values in output; timestamps are passed in.

## Read more

- **PostgreSQL 18 documentation** — transaction isolation, explicit locking, and constraint triggers.
- **Accounting for Computer Scientists** — Martin Kleppmann (2011).

## Lineage

- Replaces the 210-word outline measured on 2026-10-09.

## In which paths

- `skills/conventional-accounting` — Phase 6 (Reporting and ledger systems), position 19 (last).
- `skills/sharia-accounting` — Phase 6 (Reporting and ledger systems), position 19 · the base that
  `sharia-ledger-system-architecture` extends.
