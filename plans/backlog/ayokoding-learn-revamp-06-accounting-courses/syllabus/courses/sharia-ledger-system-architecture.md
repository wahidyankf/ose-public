# Sharia Ledger System Architecture (By Example)

**Course ID**: `sharia-ledger-system-architecture` · **Format**: By Example.

**Scope note**: Extends the general-ledger service from `general-ledger-system-architecture` into a
Sharia-aware ledger with PostgreSQL and Python: contract-aware events and evidence, database guards
that refuse interest postings and sales without ownership evidence, investment pools and profit
allocation, risk reserves, separate charity and zakah funds, dated framework policy (AAOIFI, PSAK
Syariah, IFRS-based), board-decision records, Islamic window segregation, and a Sharia audit trail.
It excludes takaful systems, sukuk trading, and the product rules themselves, which earlier courses
teach. It never issues Sharia rulings.

**Short summary**: A Sharia-aware ledger is a general ledger that knows which contract every entry came
from, refuses entries the policy forbids, keeps charity and zakah money apart, and can show a Sharia
board the evidence for any number. You build it on the ledger from the previous path phase.

## Why this exists · the big idea

- **The problem before the solution**: bolting Sharia checks onto a conventional ledger leaves gaps:
  postings that bypass the checks, pools whose profit allocation cannot be reproduced, and charity
  income mixed into earnings.
- **Keep-this-if-you-forget-everything**: put the Sharia constraints in the same place as the balance
  constraint, in the database, keyed to board-approved policy, and keep the evidence next to the
  entries it supports.

## Learning objectives

- Extend a ledger schema with contract, evidence, policy, and board-decision tables.
- Enforce Sharia constraints in PostgreSQL (no interest accounts, evidence before sale, charity
  segregation) as well as in application code.
- Allocate investment-pool profit with reserves reproducibly and auditably.
- Report under more than one framework from one primary book with dated policy.
- Produce a Sharia audit trail and evidence pack for any balance.

## Prerequisites

- **Prior courses**: `islamic-contract-modeling-for-systems` (contract states and postings),
  `zakah-computation-and-reporting-for-systems` (the zakah engine wired in here),
  `general-ledger-system-architecture` (the ledger service extended here), `sql-essentials`,
  `just-enough-python`.
- **Assumed knowledge**: the general-ledger capstone design.

## Mode and targets

- **Mode**: By Example. **Reason**: like the general-ledger course, the claims (the database refuses an
  interest posting, allocation is reproducible, funds stay separate) are only convincing when run.
- **Examples**: floor 75. **Words**: at least 28,000. **Diagrams**: 30–50.
- **Metadata**: `format: by-example`; `description` kept from plan 03 ("Design a ledger system that
  records Sharia contract events with full evidence."); `estimatedHours` from the drift test.

## Sharia content rules

This course follows [tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md): the
disclaimer sentence in `overview.md`, the board-decision callout, attributed positions, and the AAOIFI
URL register.

**Board decision points this course must flag** (each with the callout):

1. The list of income types treated as non-compliant and routed to the charity fund.
2. Pool profit allocation rules: sharing ratios, the manager's share, and reserve policies.
3. Which framework and which standard versions the ledger reports under.
4. Whether an Islamic window shares any infrastructure or funds with the conventional entity, and how
   segregation is evidenced.
5. Who may approve overrides of a Sharia guard, if anyone.

**Differences the course must show** (attributed, not ruled on):

| Point                      | Positions to present                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Investment account holders | Quasi-equity under AAOIFI FAS 45 (from 1 January 2026) versus IFRS-based classification                            |
| Risk reserves              | AAOIFI FAS 35 risk reserves versus jurisdictions that restrict or regulate such reserves (maker cites each)        |
| Islamic windows            | AAOIFI FAS 40 (from 1 January 2024) versus Bank Negara Malaysia's Islamic Banking Window policy (11 November 2024) |

## Accuracy notes

All facts below were checked on 2026-10-09; sources and excerpts are in
[tech-docs/004](../../tech-docs/004-sharia-content-policy-and-sources.md#source-register).

- AAOIFI FAS 45 Quasi-Equity (including Investment Accounts), FAS 46 Off-Balance-Sheet Assets Under
  Management, and FAS 47 Transfer of Assets Between Investment Pools apply from 1 January 2026.
  FAS 35 Risk Reserves applies from 1 January 2021. FAS 40 Financial Reporting for Islamic Finance
  Windows applies from 1 January 2024 and supersedes FAS 18.
- Indonesia: PSAK 459 (Sharia banking, the old PSAK 59) and PSAK 401–412 since the 1 January 2024
  renumbering; a new PSAK 401 on presentation and disclosure applies from 1 January 2027.
- Bank Negara Malaysia's Islamic Banking Window policy document is dated 11 November 2024 on
  `https://www.bnm.gov.my/banking-islamic-banking`.
- PostgreSQL 18 facts as in `general-ledger-system-architecture`.

## Concepts

- **co-01 · sharia-ledger-boundaries** — what the Sharia ledger adds to the general ledger.
- **co-02 · contract-aware-entries** — every entry linked to a contract and an event.
- **co-03 · evidence-store** — documents and hashes linked to events.
- **co-04 · db-sharia-guards** — triggers and constraints for forbidden postings and missing evidence.
- **co-05 · policy-tables** — framework, version, and options with effective dates.
- **co-06 · board-decisions** — decision records referenced by policy and guards.
- **co-07 · investment-pools** — pools, weights, and profit allocation.
- **co-08 · reserves** — profit equalisation and investment risk reserves.
- **co-09 · charity-fund** — segregated non-compliant income and its use.
- **co-10 · zakah-fund** — zakah payable and, for collecting institutions, the zakah fund.
- **co-11 · multi-framework-reporting** — AAOIFI, PSAK, and IFRS-based reports from one book.
- **co-12 · window-segregation** — an Islamic window inside a conventional entity.
- **co-13 · sharia-audit-trail** — evidence packs for reviewers and the Sharia board.
- **co-14 · sharia-ledger-testing** — invariants for guards, pools, and funds.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · boundaries-diagram** — draw the Sharia ledger around the general ledger (Mermaid) — verify.
  (co-01)
- **ex-02 · contracts-table** — add contracts with type and status — verify. (co-02)
- **ex-03 · events-table** — add contract events — verify the link to entries. (co-02)
- **ex-04 · entry-contract-link** — require a contract event on Sharia entries — verify a free entry
  is refused. (co-02, co-04)
- **ex-05 · evidence-table** — store evidence with hashes — verify. (co-03)
- **ex-06 · evidence-before-sale** — refuse a murabaha sale event without ownership evidence — verify.
  (co-04)
- **ex-07 · account-flags** — flag accounts as interest-bearing — verify. (co-04)
- **ex-08 · no-interest-guard** — refuse postings to interest accounts in Sharia books — verify. (co-04)
- **ex-09 · charity-accounts** — create charity fund accounts — verify. (co-09)
- **ex-10 · charity-segregation-guard** — refuse moving charity money to income — verify. (co-09)
- **ex-11 · policy-table** — store framework and version by date — verify. (co-05)
- **ex-12 · decision-table** — store board decisions — verify required fields. (co-06)
- **ex-13 · policy-needs-decision** — refuse a policy row without a decision reference — verify. (co-06)
- **ex-14 · posting-murabaha-events** — post a murabaha through the ledger — verify. (co-02)
- **ex-15 · posting-ijarah-events** — post an ijarah — verify. (co-02)
- **ex-16 · deferred-profit-account** — keep deferred profit per contract — verify. (co-02)
- **ex-17 · late-payment-to-charity** — post late-payment amounts to charity — verify. (co-09)
- **ex-18 · zakah-payable** — post zakah from the zakah engine — verify. (co-10)
- **ex-19 · schema-diagram** — draw the extended schema (Mermaid) — verify. (co-01)
- **ex-20 · python-service-layer** — call the guarded schema from Python — verify errors surface
  clearly. (co-04)
- **ex-21 · guard-error-messages** — map guard failures to clear messages — verify. (co-04)
- **ex-22 · seed-policy** — load a fixture policy and decisions — verify. (co-05)
- **ex-23 · contract-balance-view** — view balances per contract — verify. (co-02)
- **ex-24 · charity-statement-view** — produce the charity fund statement — verify. (co-09)
- **ex-25 · beginner-sharia-ledger** — run a month — verify the trial balance and guards. (co-01–co-10)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · pools-table** — create investment pools — verify. (co-07)
- **ex-27 · pool-assets** — assign financing contracts to pools — verify. (co-07)
- **ex-28 · pool-funding** — record investment account funding — verify. (co-07)
- **ex-29 · daily-weights** — compute daily product weights — verify. (co-07)
- **ex-30 · pool-income** — collect pool income from contract postings — verify. (co-07)
- **ex-31 · manager-share** — take the bank's share as manager (callout on ratios) — verify. (co-07)
- **ex-32 · profit-allocation** — allocate to account holders by weights — verify the sum equals the
  pool. (co-07)
- **ex-33 · allocation-rounding** — distribute rounding remainders by a stated rule — verify. (co-07)
- **ex-34 · per-reserve** — appropriate a profit equalisation reserve — verify. (co-08)
- **ex-35 · irr-reserve** — appropriate an investment risk reserve — verify. (co-08)
- **ex-36 · reserve-release** — release reserves per policy — verify. (co-08)
- **ex-37 · allocation-reproducibility** — rerun an allocation from stored inputs — verify identical
  results. (co-07)
- **ex-38 · pool-transfer** — transfer assets between pools under FAS 47 — verify the record. (co-07)
- **ex-39 · quasi-equity-presentation** — present investment accounts as quasi-equity — verify. (co-11)
- **ex-40 · off-balance-sheet-funds** — keep restricted funds off the balance sheet — verify. (co-11)
- **ex-41 · framework-adjustments** — post IFRS-based adjustments in a separate ledger — verify both
  reports. (co-11)
- **ex-42 · psak-tagging** — tag entries with PSAK references — verify. (co-11)
- **ex-43 · policy-switch-2027** — switch mudarabah and salam policy on 1 January 2027 — verify
  postings before and after. (co-05)
- **ex-44 · guard-override-control** — allow an override only with a decision reference and a second
  approver (callout) — verify. (co-06)
- **ex-45 · evidence-pack** — produce an evidence pack for one contract — verify hashes. (co-13)
- **ex-46 · board-report-data** — compute board report views — verify. (co-13)
- **ex-47 · charity-use** — record charity disbursements — verify the fund balance. (co-09)
- **ex-48 · zakah-run-integration** — run the zakah engine from ledger data — verify. (co-10)
- **ex-49 · outbox-for-sharia-events** — publish Sharia events through the outbox — verify. (co-02)
- **ex-50 · intermediate-sharia-ledger** — run a quarter with pools — verify all invariants.
  (co-01–co-13)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · window-entity** — model an Islamic window inside a conventional entity — verify separate
  books. (co-12)
- **ex-52 · window-segregation-guards** — refuse cross-postings between window and conventional books
  — verify. (co-12)
- **ex-53 · window-reporting** — report the window under FAS 40 — verify. (co-12)
- **ex-54 · shared-services-allocation** — allocate shared costs to the window (callout) — verify.
  (co-12)
- **ex-55 · invariant-suite** — check all Sharia invariants in SQL — verify. (co-14)
- **ex-56 · seeded-scenarios** — run seeded scenarios — verify invariants hold. (co-14)
- **ex-57 · concurrent-allocation** — prevent races during allocation — verify with a two-session
  scenario. (co-07, co-14)
- **ex-58 · allocation-idempotency** — retry an allocation run — verify no double allocation. (co-07)
- **ex-59 · historical-replay** — replay a past period under its policy version — verify. (co-05)
- **ex-60 · audit-queries** — answer reviewer questions with queries — verify. (co-13)
- **ex-61 · non-compliance-correction** — reclassify income later found non-compliant (callout) —
  verify the charity transfer and the audit trail. (co-09, co-13)
- **ex-62 · evidence-retention** — keep evidence for the retention period — verify the purge guard.
  (co-03)
- **ex-63 · access-roles** — separate Sharia reviewer and poster roles — verify. (co-13)
- **ex-64 · multi-entity-sharia** — run two entities with different frameworks — verify. (co-05, co-11)
- **ex-65 · migration-from-conventional** — migrate a conventional book into the Sharia ledger with a
  cut-over report — verify. (co-01)
- **ex-66 · report-tie-out** — tie all framework reports to the primary book — verify. (co-11)
- **ex-67 · board-pack** — produce the Sharia board pack — verify every decision is referenced. (co-06,
  co-13)
- **ex-68 · observability** — record guard refusals as metrics — verify. (co-04)
- **ex-69 · disaster-recovery-check** — restore and recompute pools and funds — verify. (co-14)
- **ex-70 · architecture-diagram** — draw the final design (Mermaid) — verify. (co-01–co-13)
- **ex-71 · design-trade-offs** — compare guards in the database and in the application — verify the
  table. (co-04)
- **ex-72 · decision-spotting** — find board decisions in a system design — verify. (co-06)
- **ex-73 · review-checklist** — review a Sharia ledger design — verify. (co-01–co-14)
- **ex-74 · end-to-end-year** — run a year with all features — verify reports. (co-01–co-14)
- **ex-75 · capstone-preview** — run the capstone — verify. (co-01–co-14)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-interest-posting-allowed`, `kata-02-sale-without-evidence`,
  `kata-03-charity-to-income`, `kata-04-allocation-not-summing`, `kata-05-policy-without-decision`,
  `kata-06-window-cross-posting`, `kata-07-allocation-double-run`, `kata-08-reserve-released-twice`.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6.
- **Sharia board decision spotting**: at least 6 scenarios.

## Capstone spec

**A Sharia-aware ledger service.** The general-ledger capstone extended with contracts, evidence,
Sharia guards, policy and decision tables, investment pools with reserves, charity and zakah funds,
multi-framework reporting, an Islamic window, and an invariant suite. The `run.yaml` loads the schema
into the PostgreSQL 18 service, runs a scripted year across 1 January 2027, and compares the reports,
board pack, and invariant results.

## Code and harness

- Database units follow the same rules as `general-ledger-system-architecture`: the `psql` toolchain
  for SQL, the `python` toolchain plus the course lockfile pinning `pg8000` for Python that calls the
  database, and the `postgres` service for both. See
  [tech-docs/003](../../tech-docs/003-code-harness-and-determinism.md#database-units).
- Two-session scenarios use `dblink` if the `psql` toolchain phase (delivery Phase 1) confirms it, otherwise two `pg8000` connections
  stepped so that no statement waits; never a sleep. See
  [tech-docs/003](../../tech-docs/003-code-harness-and-determinism.md#two-sessions-in-one-run).

## Read more

- **AAOIFI FAS 45, 46, 47, 35, and 40** — listing on `https://cis.aaoifi.com/ar/?p=381` (human check
  before linking).
- **PostgreSQL 18 documentation** — triggers and row-level security.

## Lineage

- Replaces the 281-word outline measured on 2026-10-09.

## In which paths

- `skills/sharia-accounting` — Phase 7 (Sharia accounting for systems), position 24 (last).
