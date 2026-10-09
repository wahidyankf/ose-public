# Manifest — `skills/conventional-accounting`

**Path title**: Conventional Accounting · **Arc**: kept as on `main` (`immediately-effective` on
2026-10-09) · **File**: `apps/ayokoding-www/src/features/course-paths/manifests/skills/conventional-accounting.json`
· **Courses**: 19, all core.

## Summary

- **Description** (manifest and page frontmatter, identical): "For software engineers building
  accounting systems: from a balancing ledger to controlled reporting."
- **Goals**: none. Goals are a career-path field; a skills path is all core (series decision 17).
- **Assumes**: `backend-essentials`, `just-enough-python`, `sql-essentials`.
- **Marker**: `restructurePendingIn` removed.

## Phases

| Pos   | Phase ID                       | Title                             | Courses in order                                                                                                                                 |
| ----- | ------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1–4   | `ledger-fundamentals`          | Ledger fundamentals               | `accounting-foundations`, `chart-of-accounts-and-data-modeling`, `journal-entries-and-posting-mechanics`, `financial-statements-and-close-cycle` |
| 5–7   | `transaction-cycles`           | Transaction cycles                | `accrual-accounting-and-revenue-recognition`, `accounts-payable-and-procure-to-pay`, `accounts-receivable-and-order-to-cash`                     |
| 8–11  | `assets-costs-inventory`       | Assets, costs, and inventory      | `managerial-and-cost-accounting`, `fixed-assets-and-depreciation`, `inventory-and-cogs-accounting`, `lease-and-intangible-asset-accounting`      |
| 12–14 | `groups-currencies-standards`  | Groups, currencies, and standards | `multi-currency-accounting-and-fx-translation`, `consolidation-and-multi-entity-accounting`, `financial-reporting-standards-ifrs-vs-gaap`        |
| 15–17 | `controls-payroll-treasury`    | Controls, payroll, and treasury   | `audit-controls-and-compliance`, `payroll-and-tax-accounting-essentials`, `treasury-and-cash-management`                                         |
| 18–19 | `reporting-and-ledger-systems` | Reporting and ledger systems      | `financial-reporting-and-xbrl`, `general-ledger-system-architecture`                                                                             |

## Outcomes

Each outcome is checked against the learning objectives of the phase's courses in
[../courses/](../courses/README.md).

| Phase                          | After this phase you can …                                                                                             | You cannot yet …                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ledger-fundamentals`          | model a balanced ledger, post journal entries, and produce financial statements from it                                | record revenue and costs in the right period or run purchasing and sales cycles |
| `transaction-cycles`           | record revenue and costs in the period they are earned and run the procure-to-pay and order-to-cash cycles             | value long-lived assets, inventory, or leases                                   |
| `assets-costs-inventory`       | cost products, depreciate assets, value inventory and cost of goods sold, and account for leases and intangibles       | handle several currencies or combine several companies                          |
| `groups-currencies-standards`  | translate foreign-currency balances, consolidate a group, and explain where IFRS and US GAAP differ                    | design controls, payroll, tax, and treasury features                            |
| `controls-payroll-treasury`    | build reviewable controls, payroll and tax postings, and bank reconciliation and cash forecasting                      | publish machine-readable reports or design a ledger service end to end          |
| `reporting-and-ledger-systems` | tag financial statements in XBRL and design a general-ledger service that stays balanced, auditable, and safe to retry | —                                                                               |

## Exact JSON

`arc` keeps the value on `main` when execution starts (Phase 0 records it); `immediately-effective`
below is the value measured on 2026-10-09.

```json
{
  "pathId": "skills/conventional-accounting",
  "arc": "immediately-effective",
  "title": "Conventional Accounting",
  "description": "For software engineers building accounting systems: from a balancing ledger to controlled reporting.",
  "assumes": ["backend-essentials", "just-enough-python", "sql-essentials"],
  "phases": [
    {
      "id": "ledger-fundamentals",
      "title": "Ledger fundamentals",
      "kind": "core",
      "outcome": {
        "can": "model a balanced ledger, post journal entries, and produce financial statements from it",
        "cannotYet": "record revenue and costs in the right period or run purchasing and sales cycles"
      },
      "courses": [
        "accounting-foundations",
        "chart-of-accounts-and-data-modeling",
        "journal-entries-and-posting-mechanics",
        "financial-statements-and-close-cycle"
      ]
    },
    {
      "id": "transaction-cycles",
      "title": "Transaction cycles",
      "kind": "core",
      "outcome": {
        "can": "record revenue and costs in the period they are earned and run the procure-to-pay and order-to-cash cycles",
        "cannotYet": "value long-lived assets, inventory, or leases"
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
        "can": "cost products, depreciate assets, value inventory and cost of goods sold, and account for leases and intangibles",
        "cannotYet": "handle several currencies or combine several companies"
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
        "can": "translate foreign-currency balances, consolidate a group, and explain where IFRS and US GAAP differ",
        "cannotYet": "design controls, payroll, tax, and treasury features"
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
        "can": "build reviewable controls, payroll and tax postings, and bank reconciliation and cash forecasting",
        "cannotYet": "publish machine-readable reports or design a ledger service end to end"
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
        "can": "tag financial statements in XBRL and design a general-ledger service that stays balanced, auditable, and safe to retry"
      },
      "courses": ["financial-reporting-and-xbrl", "general-ledger-system-architecture"]
    }
  ]
}
```

## Path Page Copy

File: `apps/ayokoding-www/content/en/learn/paths/skills/conventional-accounting/_index.md`. Only
`description` changes in the frontmatter; `title`, `date`, `draft`, and `weight` stay. The body below
replaces the whole current body.

- `description`: "For software engineers building accounting systems: from a balancing ledger to
  controlled reporting."
- Body (copied as is; the links are site links, so they resolve on the site, not in this plan):

```markdown
This path is for software engineers who build accounting systems. Each phase states what you can
build after it, from a balanced ledger to tagged financial reports and a general-ledger service.

Every course teaches with runnable Python examples, and two courses also use PostgreSQL. The path
assumes [Just Enough Python](/en/learn/courses/just-enough-python),
[SQL Essentials](/en/learn/courses/sql-essentials), and
[Backend Essentials](/en/learn/courses/backend-essentials), and links to them instead of repeating
them.

Course pages you open from this path keep the path context, so Previous and Next follow this path.
```

**Removed from today's page** (measured 2026-10-09): "This immediately-effective path is complete at
nineteen courses …", "**Dangerous 2** begins outside this path …", and "no later plan appends courses
to conventional-accounting." The widened path-copy test forbids "Dangerous", "OI-2", "append",
"manifest", and "from scratch" on this page.
