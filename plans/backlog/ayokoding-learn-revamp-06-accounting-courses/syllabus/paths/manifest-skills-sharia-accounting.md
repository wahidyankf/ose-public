# Manifest — `skills/sharia-accounting`

**Path title**: Sharia Accounting · **Arc**: kept as on `main` (`immediately-effective` on
2026-10-09) · **File**: `apps/ayokoding-www/src/features/course-paths/manifests/skills/sharia-accounting.json`
· **Courses**: 24, all core.

## Summary

- **Description** (manifest and page frontmatter, identical): "For software engineers building
  accounting systems that follow Sharia standards such as AAOIFI: the shared accounting foundation,
  then Sharia-specific modelling."
- **Goals**: none (skills paths are all core, series decision 17).
- **Assumes**: `backend-essentials`, `just-enough-python`, `sql-essentials`.
- **Marker**: `restructurePendingIn` removed.

## Phases

Positions 1–19 equal [the conventional path](./manifest-skills-conventional-accounting.md#phases)
exactly, with the same phase IDs and titles.

| Pos   | Phase ID                        | Title                             | Courses in order                                                                                                                                                                                                      |
| ----- | ------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–4   | `ledger-fundamentals`           | Ledger fundamentals               | `accounting-foundations`, `chart-of-accounts-and-data-modeling`, `journal-entries-and-posting-mechanics`, `financial-statements-and-close-cycle`                                                                      |
| 5–7   | `transaction-cycles`            | Transaction cycles                | `accrual-accounting-and-revenue-recognition`, `accounts-payable-and-procure-to-pay`, `accounts-receivable-and-order-to-cash`                                                                                          |
| 8–11  | `assets-costs-inventory`        | Assets, costs, and inventory      | `managerial-and-cost-accounting`, `fixed-assets-and-depreciation`, `inventory-and-cogs-accounting`, `lease-and-intangible-asset-accounting`                                                                           |
| 12–14 | `groups-currencies-standards`   | Groups, currencies, and standards | `multi-currency-accounting-and-fx-translation`, `consolidation-and-multi-entity-accounting`, `financial-reporting-standards-ifrs-vs-gaap`                                                                             |
| 15–17 | `controls-payroll-treasury`     | Controls, payroll, and treasury   | `audit-controls-and-compliance`, `payroll-and-tax-accounting-essentials`, `treasury-and-cash-management`                                                                                                              |
| 18–19 | `reporting-and-ledger-systems`  | Reporting and ledger systems      | `financial-reporting-and-xbrl`, `general-ledger-system-architecture`                                                                                                                                                  |
| 20–24 | `sharia-accounting-for-systems` | Sharia accounting for systems     | `sharia-accounting-and-aaoifi-standards`, `islamic-contract-modeling-for-systems`, `zakah-computation-and-reporting-for-systems`, `sukuk-and-islamic-capital-markets-accounting`, `sharia-ledger-system-architecture` |

## Outcomes

Phases 1–5 use the conventional outcomes word for word. Phases 6 and 7:

| Phase                           | After this phase you can …                                                                                                                        | You cannot yet …                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `reporting-and-ledger-systems`  | tag financial statements in XBRL and design a general-ledger service that stays balanced, auditable, and safe to retry                            | model Islamic contracts or compute zakah                  |
| `sharia-accounting-for-systems` | compare AAOIFI and local Sharia accounting standards, model Islamic contracts, compute zakah, account for sukuk, and design a Sharia-aware ledger | issue Sharia rulings; that needs a qualified Sharia board |

The last `cannotYet` is deliberate: it tells the reader, in the path itself, that the path never makes
them a source of Sharia rulings (series decision 19).

## Exact JSON

`arc` keeps the value on `main` when execution starts (Phase 0 records it).

```json
{
  "pathId": "skills/sharia-accounting",
  "arc": "immediately-effective",
  "title": "Sharia Accounting",
  "description": "For software engineers building accounting systems that follow Sharia standards such as AAOIFI: the shared accounting foundation, then Sharia-specific modelling.",
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
        "can": "tag financial statements in XBRL and design a general-ledger service that stays balanced, auditable, and safe to retry",
        "cannotYet": "model Islamic contracts or compute zakah"
      },
      "courses": ["financial-reporting-and-xbrl", "general-ledger-system-architecture"]
    },
    {
      "id": "sharia-accounting-for-systems",
      "title": "Sharia accounting for systems",
      "kind": "core",
      "outcome": {
        "can": "compare AAOIFI and local Sharia accounting standards, model Islamic contracts, compute zakah, account for sukuk, and design a Sharia-aware ledger",
        "cannotYet": "issue Sharia rulings; that needs a qualified Sharia board"
      },
      "courses": [
        "sharia-accounting-and-aaoifi-standards",
        "islamic-contract-modeling-for-systems",
        "zakah-computation-and-reporting-for-systems",
        "sukuk-and-islamic-capital-markets-accounting",
        "sharia-ledger-system-architecture"
      ]
    }
  ]
}
```

## Path Page Copy

File: `apps/ayokoding-www/content/en/learn/paths/skills/sharia-accounting/_index.md`. Only
`description` changes in the frontmatter; the body below replaces the whole current body.

- `description`: "For software engineers building accounting systems that follow Sharia standards such as
  AAOIFI: the shared accounting foundation, then Sharia-specific modelling."
- Body (copied as is; the links are site links, so they resolve on the site, not in this plan):

```markdown
This path is for software engineers who build accounting systems that must follow Sharia standards
such as AAOIFI. It shares the Conventional Accounting foundation, then adds a Sharia phase: Sharia
accounting standards, Islamic contracts, zakah, sukuk, and a Sharia-aware ledger.

The courses explain standards and design choices and show where scholars and jurisdictions differ.
They do not issue Sharia rulings; where a choice needs a ruling, the course marks it as a decision
for your institution's Sharia board.

Every course teaches with runnable Python examples, and three courses also use PostgreSQL. The path
assumes [Just Enough Python](/en/learn/courses/just-enough-python),
[SQL Essentials](/en/learn/courses/sql-essentials), and
[Backend Essentials](/en/learn/courses/backend-essentials).

Choose [Conventional Accounting](/en/learn/paths/skills/conventional-accounting) when you need only
the general route.

Course pages you open from this path keep the path context, so Previous and Next follow this path.
```

**Removed from today's page** (measured 2026-10-09): "This immediately-effective path is complete at
twenty-four courses", the "**Dangerous 1**/**2**/**3**" paragraph including "settle OI-2's doctrinal
basis", and "No further course will be appended to this path." The widened path-copy test forbids
"Dangerous", "OI-2", "append", "manifest", and "from scratch" on this page.
