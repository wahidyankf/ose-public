# Manifest — `skills/conventional-accounting`

**Path title**: Conventional Accounting · **Arc**: `immediately-effective` · **File**:
`apps/ayokoding-www/src/features/course-paths/manifests/skills/conventional-accounting.json` · **Courses before and after**: 19

This file holds two things: the exact file body plan 02 writes, and the drafted restructure that
plan 06 receives as input.

> **Input for plan 06, not applied by plan 02.** Decision 39 (the user's answer to `UD-02-01`, 2026-10-09)
> moves this path's restructure to plan 06, in the same PR that writes its courses. Plan 02 writes only the
> mechanical shape in [What Plan 02 Writes](#what-plan-02-writes). The phases, outcomes, `assumes`, and drafted
> description below are a starting point that plan 06 may change once the courses exist.

## What Plan 02 Writes

The mechanical shape from [tech-docs/002](../../tech-docs/002-manifest-schema-and-migration.md#skills-paths-pending-restructure):
today's title, description, and 19 courses in today's order, one `all-courses` phase, no goals, no
outcome, empty `assumes`, and the marker. Readers see no change.

```json
{
  "pathId": "skills/conventional-accounting",
  "arc": "immediately-effective",
  "title": "Conventional Accounting",
  "description": "A practical accounting path from a balancing ledger to controlled reporting.",
  "restructurePendingIn": "plan-06",
  "assumes": [],
  "phases": [
    {
      "id": "all-courses",
      "title": "Conventional Accounting",
      "kind": "core",
      "courses": [
        "accounting-foundations",
        "chart-of-accounts-and-data-modeling",
        "financial-statements-and-close-cycle",
        "journal-entries-and-posting-mechanics",
        "accrual-accounting-and-revenue-recognition",
        "accounts-payable-and-procure-to-pay",
        "accounts-receivable-and-order-to-cash",
        "managerial-and-cost-accounting",
        "fixed-assets-and-depreciation",
        "inventory-and-cogs-accounting",
        "lease-and-intangible-asset-accounting",
        "multi-currency-accounting-and-fx-translation",
        "consolidation-and-multi-entity-accounting",
        "financial-reporting-standards-ifrs-vs-gaap",
        "audit-controls-and-compliance",
        "payroll-and-tax-accounting-essentials",
        "treasury-and-cash-management",
        "financial-reporting-and-xbrl",
        "general-ledger-system-architecture"
      ]
    }
  ]
}
```

## Drafted Phases and Outcomes (Input for Plan 06)

- **Description:** For software engineers building accounting systems: from a balancing ledger to controlled reporting.
- **Goals:** none (see notes)
- **Assumes:** `backend-essentials`, `sql-essentials`
- **Courses:** 19 total; 19 core; 0 extension

| Phase ID                       | Title                             | Kind | Positions | Courses in order                                                                                                                                                                         |
| ------------------------------ | --------------------------------- | ---- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ledger-fundamentals`          | Ledger fundamentals               | core | 1–4       | `accounting-foundations` (outline), `chart-of-accounts-and-data-modeling` (outline), `financial-statements-and-close-cycle` (outline), `journal-entries-and-posting-mechanics` (outline) |
| `transaction-cycles`           | Transaction cycles                | core | 5–7       | `accrual-accounting-and-revenue-recognition` (outline), `accounts-payable-and-procure-to-pay` (outline), `accounts-receivable-and-order-to-cash` (outline)                               |
| `assets-costs-inventory`       | Assets, costs, and inventory      | core | 8–11      | `managerial-and-cost-accounting` (outline), `fixed-assets-and-depreciation` (outline), `inventory-and-cogs-accounting` (outline), `lease-and-intangible-asset-accounting` (outline)      |
| `groups-currencies-standards`  | Groups, currencies, and standards | core | 12–14     | `multi-currency-accounting-and-fx-translation` (outline), `consolidation-and-multi-entity-accounting` (outline), `financial-reporting-standards-ifrs-vs-gaap` (outline)                  |
| `controls-payroll-treasury`    | Controls, payroll, and treasury   | core | 15–17     | `audit-controls-and-compliance` (outline), `payroll-and-tax-accounting-essentials` (outline), `treasury-and-cash-management` (outline)                                                   |
| `reporting-and-ledger-systems` | Reporting and ledger systems      | core | 18–19     | `financial-reporting-and-xbrl` (outline), `general-ledger-system-architecture` (outline)                                                                                                 |

| Core phase                     | After this phase you can …                                                           | You cannot yet …                                               |
| ------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `ledger-fundamentals`          | model accounts, journal entries, and financial statements in a system                | handle accruals, payables, or receivables                      |
| `transaction-cycles`           | model accruals, revenue recognition, and the procure-to-pay and order-to-cash cycles | account for long-lived assets, costs, and inventory            |
| `assets-costs-inventory`       | model cost accounting, depreciation, inventory and cost of goods sold, and leases    | handle several currencies or entities                          |
| `groups-currencies-standards`  | translate currencies, consolidate entities, and map IFRS and GAAP differences        | design controls, payroll, and treasury features                |
| `controls-payroll-treasury`    | build audit controls, payroll and tax postings, and cash management                  | produce regulated digital reports or design the ledger service |
| `reporting-and-ledger-systems` | produce XBRL reports and design a general-ledger architecture                        | —                                                              |

## Drafted JSON (Input for Plan 06)

```json
{
  "pathId": "skills/conventional-accounting",
  "arc": "immediately-effective",
  "title": "Conventional Accounting",
  "description": "For software engineers building accounting systems: from a balancing ledger to controlled reporting.",
  "assumes": ["backend-essentials", "sql-essentials"],
  "phases": [
    {
      "id": "ledger-fundamentals",
      "title": "Ledger fundamentals",
      "kind": "core",
      "outcome": {
        "can": "model accounts, journal entries, and financial statements in a system",
        "cannotYet": "handle accruals, payables, or receivables"
      },
      "courses": [
        "accounting-foundations",
        "chart-of-accounts-and-data-modeling",
        "financial-statements-and-close-cycle",
        "journal-entries-and-posting-mechanics"
      ]
    },
    {
      "id": "transaction-cycles",
      "title": "Transaction cycles",
      "kind": "core",
      "outcome": {
        "can": "model accruals, revenue recognition, and the procure-to-pay and order-to-cash cycles",
        "cannotYet": "account for long-lived assets, costs, and inventory"
      },
      "courses": [
        "accrual-accounting-and-revenue-recognition",
        "accounts-payable-and-procure-to-pay",
        "accounts-receivable-and-order-to-cash"
      ]
    },
    {
      "id": "assets-costs-inventory",
      "title": "Assets, costs, and inventory",
      "kind": "core",
      "outcome": {
        "can": "model cost accounting, depreciation, inventory and cost of goods sold, and leases",
        "cannotYet": "handle several currencies or entities"
      },
      "courses": [
        "managerial-and-cost-accounting",
        "fixed-assets-and-depreciation",
        "inventory-and-cogs-accounting",
        "lease-and-intangible-asset-accounting"
      ]
    },
    {
      "id": "groups-currencies-standards",
      "title": "Groups, currencies, and standards",
      "kind": "core",
      "outcome": {
        "can": "translate currencies, consolidate entities, and map IFRS and GAAP differences",
        "cannotYet": "design controls, payroll, and treasury features"
      },
      "courses": [
        "multi-currency-accounting-and-fx-translation",
        "consolidation-and-multi-entity-accounting",
        "financial-reporting-standards-ifrs-vs-gaap"
      ]
    },
    {
      "id": "controls-payroll-treasury",
      "title": "Controls, payroll, and treasury",
      "kind": "core",
      "outcome": {
        "can": "build audit controls, payroll and tax postings, and cash management",
        "cannotYet": "produce regulated digital reports or design the ledger service"
      },
      "courses": [
        "audit-controls-and-compliance",
        "payroll-and-tax-accounting-essentials",
        "treasury-and-cash-management"
      ]
    },
    {
      "id": "reporting-and-ledger-systems",
      "title": "Reporting and ledger systems",
      "kind": "core",
      "outcome": {
        "can": "produce XBRL reports and design a general-ledger architecture"
      },
      "courses": ["financial-reporting-and-xbrl", "general-ledger-system-architecture"]
    }
  ]
}
```
