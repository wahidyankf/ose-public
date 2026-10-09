# Chart of Accounts and Data Modeling (By Example)

**Course ID**: `chart-of-accounts-and-data-modeling` · **Format**: By Example.

**Scope note**: Designs and stores a chart of accounts as data: account types, codes, hierarchies,
dimensions, combination rules, and mappings to report lines, in PostgreSQL with a Python loader. It
excludes posting entries (`journal-entries-and-posting-mechanics`), statement preparation
(`financial-statements-and-close-cycle`), and group consolidation (`consolidation-and-multi-entity-accounting`).

**Short summary**: A chart of accounts is the schema of the books. You build one in PostgreSQL with
constraints that refuse bad data, add dimensions instead of exploding the account list, and map every
account to the report lines it feeds.

## Why this exists · the big idea

- **The problem before the solution**: a chart that grows by copy-paste ends with hundreds of
  near-duplicate accounts, unmapped accounts that vanish from reports, and "Miscellaneous" accounts
  that hide errors.
- **Keep-this-if-you-forget-everything**: accounts say _what_ an amount is; dimensions say _where_ or
  _for whom_; mappings say _which report line_ it feeds — and the database enforces all three.

## Learning objectives

- Model accounts, types, normal balances, and hierarchies as constrained PostgreSQL tables.
- Choose between a new account and a dimension, and enforce required dimensions per account.
- Map every postable account to exactly one line per reporting framework, with effective dates.
- Change a chart safely: rename, merge, split, block, and close accounts without losing history.
- Validate a chart automatically and explain each failing rule.

## Prerequisites

- **Prior courses**: `accounting-foundations` (account types, normal balances), `sql-essentials`
  (tables, constraints, joins, recursive queries), `just-enough-python` (the loader and reports).
- **Assumed knowledge**: running `psql` and a Python script.

## Mode and targets

- **Mode**: By Example (`format: by-example`). **Reason**: every concept here is a concrete schema
  rule or query that a reader can run and break, which is exactly what the five-part By Example
  structure teaches best.
- **Examples**: floor 75, band 75–85, as `### Example N: Title` across `learning/beginner.md`
  (1–25), `learning/intermediate.md` (26–50), and `learning/advanced.md` (51–75).
- **Words**: at least 28,000 words across the course's markdown pages.
- **Diagrams**: 30–50 Mermaid diagrams (about 35%–60% of examples), per the By Example band.
- **Drilling**: the standard drill set with the 8 katas below.
- **Layout**: `learning/overview.md` with `## Examples by Level`, the three level pages,
  `learning/capstone/`, `learning/code/ex-NN-<slug>/`, `drilling/overview.md`,
  `drilling/code/kata-NN-<slug>/`.
- **Metadata**: `category: accounting`; `format: by-example`; `description` kept from plan 03
  ("Design a chart of accounts that supports reporting, decisions, and controls."); and
  `estimatedHours` from the drift test.

## Accuracy notes

- Account types, normal balances, control accounts, and dimensions: stable domain facts.
- IFRS 18 replaces IAS 1 and is effective for annual periods beginning on or after 1 January 2027:
  `https://www.ifrs.org/issued-standards/list-of-standards/ifrs-18-presentation-and-disclosure-in-financial-statements/`,
  accessed 2026-10-09. Example 36 tags income-statement accounts with IFRS 18 categories and states
  the date.
- PostgreSQL 18 is the current major version (18.6 on 2026-10-09):
  `https://www.postgresql.org/support/versioning/`, accessed 2026-10-09.

## Concepts

- **co-01 · account-record** — code, name, type, normal balance, and status.
- **co-02 · code-scheme** — a numbering scheme that encodes type ranges and leaves gaps for growth.
- **co-03 · hierarchy** — parent and child accounts; only leaf accounts are postable.
- **co-04 · account-status** — active, blocked (no new postings), and closed (zero balance, hidden).
- **co-05 · control-account** — an account whose detail lives in a subledger and that refuses manual
  postings.
- **co-06 · dimension** — an attribute such as cost center, project, or partner entity that classifies
  an amount without a new account.
- **co-07 · combination-rule** — which account and dimension combinations are allowed or required.
- **co-08 · report-mapping** — the link from each postable account to one line per reporting
  framework.
- **co-09 · effective-dating** — mappings, names, and dimension values valid for a date range.
- **co-10 · chart-change** — rename, merge, split, block, and close, with history and approval.
- **co-11 · group-chart** — a shared chart for several entities, with local-to-group mappings.
- **co-12 · chart-as-code** — the chart kept in a versioned file and loaded idempotently.
- **co-13 · validation-suite** — automated checks that prove the chart is complete and consistent.
- **co-14 · anti-patterns** — catch-all accounts, account explosion, and unmapped accounts.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–25)

- **ex-01 · account-table** — create an `account` table — verify an insert and a select round-trip.
  (co-01)
- **ex-02 · account-type-check** — restrict `type` to the five types with a `CHECK` — verify an
  invalid type is rejected. (co-01)
- **ex-03 · normal-balance-generated** — derive the normal balance from the type with a generated
  column — verify all five types. (co-01)
- **ex-04 · unique-code** — add a unique code — verify a duplicate code fails. (co-01)
- **ex-05 · code-ranges-by-type** — enforce 1xxx assets, 2xxx liabilities, and so on — verify an
  out-of-range code fails. (co-02)
- **ex-06 · seed-starter-chart** — load a 20-account starter chart — verify the count per type.
  (co-01, co-02)
- **ex-07 · chart-by-type-report** — list accounts grouped by type in code order — verify the output.
  (co-01)
- **ex-08 · name-rules** — require trimmed, non-empty names — verify a blank name fails. (co-01)
- **ex-09 · postable-flag** — mark header accounts as not postable — verify the posting view excludes
  them. (co-03)
- **ex-10 · parent-child** — add a self-referencing `parent_id` — verify a three-level tree loads.
  (co-03)
- **ex-11 · recursive-descendants** — list all descendants with `WITH RECURSIVE` — verify the list.
  (co-03)
- **ex-12 · child-type-matches-parent** — enforce matching types with a trigger — verify a mismatch
  fails. (co-03)
- **ex-13 · roll-up-totals** — roll leaf balances up to parents — verify parent totals. (co-03)
- **ex-14 · account-status** — add active, blocked, and closed — verify a blocked account refuses a
  new line. (co-04)
- **ex-15 · csv-loader** — load a chart CSV in Python and report bad rows — verify the error report.
  (co-12, co-13)
- **ex-16 · deterministic-sql-emitter** — generate sorted `INSERT` statements from the CSV — verify
  byte-identical output on two runs. (co-12)
- **ex-17 · contra-accounts** — link a contra account to its base — verify its opposite normal
  balance. (co-01)
- **ex-18 · one-retained-earnings** — allow exactly one retained-earnings role per chart with a partial
  unique index — verify a second one fails. (co-01)
- **ex-19 · suspense-account-ageing** — show how a suspense account hides errors — verify an ageing
  query surfaces old items. (co-14)
- **ex-20 · control-account-guard** — mark receivables and payables as control accounts — verify a
  manual line is rejected. (co-05)
- **ex-21 · subledger-link** — map each control account to its subledger type — verify every control
  account is mapped. (co-05)
- **ex-22 · account-help-text** — store usage notes per account — verify the chart report prints
  them. (co-01)
- **ex-23 · chart-tree-diagram** — draw the starter chart as a Mermaid tree — verify it matches the
  recursive query. (co-03)
- **ex-24 · vague-name-lint** — flag names such as "Misc" or "Other" — verify the lint query output.
  (co-14)
- **ex-25 · beginner-validation** — combine the checks so far — verify zero violations on the seed
  chart. (co-13)

### Intermediate (`learning/intermediate.md`, Examples 26–50)

- **ex-26 · dimension-vs-account** — compare 40 cost-center accounts with one account plus a
  dimension — verify the account count drops. (co-06, co-14)
- **ex-27 · dimension-tables** — create cost center, project, and department tables — verify foreign
  keys. (co-06)
- **ex-28 · required-dimensions** — require a cost center on expense accounts — verify a line
  without it fails. (co-06, co-07)
- **ex-29 · dimension-validity-dates** — give dimension values `valid_from` and `valid_to` — verify a
  line dated outside the range fails. (co-06, co-09)
- **ex-30 · combination-rules** — forbid a project dimension on balance-sheet accounts — verify the
  rule. (co-07)
- **ex-31 · combination-key** — build and parse a segment string such as `6100-CC10-PRJ7` — verify the
  round-trip. (co-06, co-07)
- **ex-32 · statement-line-mapping** — map each postable account to one report line — verify every
  account is mapped exactly once. (co-08)
- **ex-33 · unmapped-account-finder** — query accounts without a mapping — verify the finder output.
  (co-08, co-14)
- **ex-34 · range-mapping-overlap** — map by code ranges — verify overlapping ranges are detected.
  (co-08)
- **ex-35 · cash-flow-tags** — tag accounts for the cash-flow statement — verify every cash-affecting
  account has a tag. (co-08)
- **ex-36 · ifrs18-category-tags** — tag income and expense accounts with the IFRS 18 categories
  (operating, investing, financing) effective 1 January 2027 — verify every income-statement account
  is tagged. (co-08, co-09)
- **ex-37 · two-framework-mappings** — keep a local-GAAP and an IFRS mapping set — verify both are
  complete. (co-08)
- **ex-38 · effective-dated-mapping** — version mappings by date — verify which mapping applies on a
  given day. (co-08, co-09)
- **ex-39 · rename-history** — keep the name history of an account — verify a report shows the name
  as of a date. (co-09, co-10)
- **ex-40 · block-vs-close** — compare blocking and closing — verify a closed account cannot be
  reopened silently. (co-04, co-10)
- **ex-41 · close-with-balance-guard** — refuse to close an account with a balance — verify the
  error. (co-04, co-10)
- **ex-42 · merge-accounts** — merge two accounts with reclassification entries, never updates —
  verify both histories survive. (co-10)
- **ex-43 · split-account** — split one account into two going forward — verify old lines keep the old
  account. (co-10)
- **ex-44 · chart-version-diff** — diff two chart files in Python — verify the added, removed, and
  changed lists. (co-10, co-12)
- **ex-45 · change-approval** — store chart changes as requests with an approval state — verify an
  unapproved change is not applied. (co-10)
- **ex-46 · read-only-role** — grant a reporting role read access only — verify it cannot insert.
  (co-10)
- **ex-47 · account-search** — search by code prefix and name — verify the result order. (co-01)
- **ex-48 · default-tax-code** — link a default tax code to sales and purchase accounts — verify the
  lookup. (co-07)
- **ex-49 · intercompany-partner-dimension** — require a partner-entity dimension on intercompany
  accounts — verify a missing partner fails. (co-06, co-07)
- **ex-50 · intermediate-validation** — extend the validation suite — verify zero violations. (co-13)

### Advanced (`learning/advanced.md`, Examples 51–75)

- **ex-51 · shared-group-chart** — share one chart across entities with per-entity activation —
  verify an inactive account refuses a line for that entity. (co-11)
- **ex-52 · local-to-group-mapping** — map local accounts to group accounts — verify the mapping is
  complete and many-to-one. (co-11)
- **ex-53 · mapping-conflict-finder** — detect a local account mapped to two group accounts — verify
  the conflict report. (co-11, co-13)
- **ex-54 · industry-template** — build a chart from a template plus overrides — verify the resolved
  chart. (co-11, co-12)
- **ex-55 · prescribed-accounts** — check that a chart contains every account a (fictional)
  regulator prescribes — verify the missing list. (co-13)
- **ex-56 · alternate-hierarchy** — keep management and statutory hierarchies — verify both roll up to
  the same total. (co-03, co-08)
- **ex-57 · closure-table** — store the hierarchy as a closure table — verify it matches the recursive
  query. (co-03)
- **ex-58 · materialized-path** — store the hierarchy as a materialized path — verify prefix queries
  return each subtree. (co-03)
- **ex-59 · cycle-guard** — prevent hierarchy cycles with a trigger — verify a cycle fails. (co-03,
  co-13)
- **ex-60 · presentation-sign** — flip signs for credit-normal accounts in reports — verify the
  statement shows positive revenue. (co-01, co-08)
- **ex-61 · typed-columns-over-json** — compare typed columns with a JSON attribute bag — verify a
  constraint is only possible on the typed column. (co-14)
- **ex-62 · chart-as-code-load** — load the chart from a versioned file — verify a second load changes
  nothing. (co-12)
- **ex-63 · idempotent-upsert** — sync with `INSERT … ON CONFLICT` — verify repeated syncs are
  stable. (co-12)
- **ex-64 · closed-period-remap-guard** — refuse a mapping change that would alter a closed period's
  report — verify the error. (co-08, co-09)
- **ex-65 · history-trigger** — copy every change to a history table with a supplied change time —
  verify the history rows. (co-10)
- **ex-66 · balance-by-dimension** — trial balance by cost center — verify the totals per cost center.
  (co-06)
- **ex-67 · dimension-pivot** — pivot balances by dimension in Python — verify the pivot table. (co-06)
- **ex-68 · data-quality-report** — combine all checks into one report — verify the report text.
  (co-13)
- **ex-69 · index-design** — add indexes for code-prefix and hierarchy queries — verify
  `EXPLAIN (COSTS OFF)` shows an index scan. (co-03)
- **ex-70 · restricted-account-flags** — flag account kinds an entity's policy forbids (for example
  interest income for an entity whose Sharia board forbids it) — verify the check refuses such an
  account for that entity. (co-07, co-11)
- **ex-71 · taxonomy-mapping-preview** — map report lines to XBRL concept names — verify every
  reportable line is mapped. (co-08)
- **ex-72 · chart-sync-contract** — validate a chart-sync JSON payload from another system — verify
  the validator's errors. (co-12, co-13)
- **ex-73 · chart-review-pack** — generate a markdown review pack from the database — verify the
  output. (co-13)
- **ex-74 · anti-pattern-gallery** — run five bad charts through their detection queries — verify each
  is caught. (co-14)
- **ex-75 · full-validation-suite** — run the complete suite on the capstone chart — verify zero
  violations. (co-13)

## Drilling

- **Recall Q&A**: at least 24 questions, one or more per concept, with `<details>` answers.
- **Applied problems**: at least 8, for example "design dimensions for a 3-branch retailer".
- **Code katas**: `kata-01-duplicate-account-code`, `kata-02-header-account-posted`,
  `kata-03-child-type-mismatch`, `kata-04-unmapped-account`, `kata-05-overlapping-mapping-ranges`,
  `kata-06-required-dimension-missing`, `kata-07-hierarchy-cycle`,
  `kata-08-closed-account-with-balance`.
- **Self-check checklist**: at least 24 items.
- **Why and why-not prompts**: at least 6.

## Capstone spec

**A chart-of-accounts schema for a small group.** Build a PostgreSQL schema with accounts,
hierarchy, status, control accounts, three dimensions, combination rules, effective-dated mappings
for two reporting frameworks, and a local-to-group mapping for two entities. A Python loader reads the
chart from versioned CSV files, applies it idempotently, and prints the validation report. The
capstone's `run.yaml` starts the PostgreSQL 18 service, applies the schema and seed, runs the loader
twice, and compares the report with the expected output.

## Code and harness

- SQL units use the `psql` toolchain this plan adds to the harness catalog (the pinned PostgreSQL 18
  image, which ships `psql`) with the `postgres` service, and run
  `psql -X -v ON_ERROR_STOP=1 -f <file>.sql`. Python units that need the database use the `python`
  toolchain, the `postgres` service, and the course lockfile that pins the pure-Python DB-API driver
  `pg8000` with hashes; every other Python unit uses the standard library only. The rules are in
  [tech-docs/003](../../tech-docs/003-code-harness-and-determinism.md#database-units).
- No wall-clock values in output: history examples pass explicit timestamps.
- Example 69 asserts only that the plan contains an index scan, with sequential scans disabled for the
  session, so the check does not depend on planner statistics.

## Read more

- **PostgreSQL 18 documentation** — constraints, triggers, and recursive queries.
- **IFRS 18 Presentation and Disclosure in Financial Statements** — IFRS Foundation; the income
  statement categories example 36 tags.

## Lineage

- Replaces the 281-word outline measured on 2026-10-09; mined from the archived 2026-08-15 syllabus.

## In which paths

- `skills/conventional-accounting` — Phase 1 (Ledger fundamentals), position 2 · the schema every
  posting and report uses.
- `skills/sharia-accounting` — Phase 1 (Ledger fundamentals), position 2 · the same schema, later
  extended with Sharia-specific account kinds.
