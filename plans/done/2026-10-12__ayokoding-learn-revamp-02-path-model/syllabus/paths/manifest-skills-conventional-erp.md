# Manifest — `skills/conventional-erp`

**Path title**: Conventional ERP · **Arc**: `immediately-effective` · **File**:
`apps/ayokoding-www/src/features/course-paths/manifests/skills/conventional-erp.json` · **Courses before and after**: 27

This file holds two things: the exact file body plan 02 writes, and the drafted restructure that
plan 07 receives as input.

> **Input for plan 07, not applied by plan 02.** Decision 39 (the user's answer to `UD-02-01`, 2026-10-09)
> moves this path's restructure to plan 07, in the same PR that writes its courses. Plan 02 writes only the
> mechanical shape in [What Plan 02 Writes](#what-plan-02-writes). The phases, outcomes, `assumes`, and drafted
> description below are a starting point that plan 07 may change once the courses exist.

## What Plan 02 Writes

The mechanical shape from [tech-docs/002](../../tech-docs/002-manifest-schema-and-migration.md#skills-paths-pending-restructure):
today's title, description, and 27 courses in today's order, one `all-courses` phase, no goals, no
outcome, empty `assumes`, and the marker. Readers see no change.

```json
{
  "pathId": "skills/conventional-erp",
  "arc": "immediately-effective",
  "title": "Conventional ERP",
  "description": "A complete conventional-ERP path for accountable enterprise systems.",
  "restructurePendingIn": "plan-07",
  "assumes": [],
  "phases": [
    {
      "id": "all-courses",
      "title": "Conventional ERP",
      "kind": "core",
      "courses": [
        "erp-foundations-and-history",
        "erp-conceptual-data-model",
        "erp-module-map-and-architecture",
        "erp-document-lifecycle-and-state-machines",
        "erp-posting-rules-and-account-determination",
        "erp-subledger-to-gl-architecture",
        "erp-fiscal-calendar-and-period-close",
        "erp-numbering-sequences-and-uom-conversion",
        "erp-audit-trail-and-change-tracking",
        "procure-to-pay-systems",
        "order-to-cash-systems",
        "erp-procurement-and-fulfillment-exceptions",
        "record-to-report-systems",
        "inventory-and-warehouse-management",
        "erp-inventory-costing-methods",
        "erp-inventory-integrity-and-concurrency",
        "erp-bom-and-routing-architecture",
        "production-planning-and-mrp",
        "demand-and-supply-planning",
        "erp-availability-and-reservations",
        "quality-management-and-inspection",
        "erp-extension-and-customization",
        "erp-integration-patterns",
        "human-capital-management-and-hire-to-retire",
        "multi-company-and-multi-currency-erp",
        "erp-security-and-controls",
        "erp-analytics-and-reporting"
      ]
    }
  ]
}
```

## Drafted Phases and Outcomes (Input for Plan 07)

- **Description:** For software engineers building ERP systems: documents, postings, business processes, inventory, and operations.
- **Goals:** none (see notes)
- **Assumes:** `api-design`, `audit-controls-and-compliance`, `backend-essentials`, `consolidation-and-multi-entity-accounting`, `domain-driven-design`, `event-driven-architecture`, `financial-statements-and-close-cycle`, `inventory-and-cogs-accounting`, `networking-essentials`, `payroll-and-tax-accounting-essentials`, `sql-essentials`
- **Courses:** 27 total; 27 core; 0 extension

| Phase ID                      | Title                                | Kind | Positions | Courses in order                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------- | ------------------------------------ | ---- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erp-model-and-architecture`  | ERP model and architecture           | core | 1–3       | `erp-foundations-and-history` (outline), `erp-conceptual-data-model` (outline), `erp-module-map-and-architecture` (outline)                                                                                                                                                                                                                                                 |
| `documents-posting-close`     | Documents, posting, and period close | core | 4–9       | `erp-document-lifecycle-and-state-machines` (outline), `erp-posting-rules-and-account-determination` (outline), `erp-subledger-to-gl-architecture` (outline), `erp-fiscal-calendar-and-period-close` (outline), `erp-numbering-sequences-and-uom-conversion` (outline), `erp-audit-trail-and-change-tracking` (outline)                                                     |
| `business-process-cycles`     | Business process cycles              | core | 10–13     | `procure-to-pay-systems` (outline), `order-to-cash-systems` (outline), `erp-procurement-and-fulfillment-exceptions` (outline), `record-to-report-systems` (outline)                                                                                                                                                                                                         |
| `inventory-and-manufacturing` | Inventory and manufacturing          | core | 14–21     | `inventory-and-warehouse-management` (outline), `erp-inventory-costing-methods` (outline), `erp-inventory-integrity-and-concurrency` (outline), `erp-bom-and-routing-architecture` (outline), `production-planning-and-mrp` (outline), `demand-and-supply-planning` (outline), `erp-availability-and-reservations` (outline), `quality-management-and-inspection` (outline) |
| `extend-and-operate`          | Extending and operating the ERP      | core | 22–27     | `erp-extension-and-customization` (outline), `erp-integration-patterns` (outline), `human-capital-management-and-hire-to-retire` (outline), `multi-company-and-multi-currency-erp` (outline), `erp-security-and-controls` (outline), `erp-analytics-and-reporting` (outline)                                                                                                |

| Core phase                    | After this phase you can …                                                                                     | You cannot yet …                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `erp-model-and-architecture`  | explain the ERP data model and how its modules fit together                                                    | move a business document from draft to posted |
| `documents-posting-close`     | design document lifecycles, posting rules, subledger-to-ledger flow, period close, numbering, and audit trails | build end-to-end business processes           |
| `business-process-cycles`     | build procure-to-pay, order-to-cash, and record-to-report flows, including their exceptions                    | manage stock and manufacturing                |
| `inventory-and-manufacturing` | design inventory, costing, bills of materials, MRP, planning, reservations, and quality checks                 | extend, integrate, and secure the ERP         |
| `extend-and-operate`          | extend and integrate the ERP, add HR, run several companies and currencies, secure it, and report on it        | —                                             |

## Drafted JSON (Input for Plan 07)

```json
{
  "pathId": "skills/conventional-erp",
  "arc": "immediately-effective",
  "title": "Conventional ERP",
  "description": "For software engineers building ERP systems: documents, postings, business processes, inventory, and operations.",
  "assumes": [
    "api-design",
    "audit-controls-and-compliance",
    "backend-essentials",
    "consolidation-and-multi-entity-accounting",
    "domain-driven-design",
    "event-driven-architecture",
    "financial-statements-and-close-cycle",
    "inventory-and-cogs-accounting",
    "networking-essentials",
    "payroll-and-tax-accounting-essentials",
    "sql-essentials"
  ],
  "phases": [
    {
      "id": "erp-model-and-architecture",
      "title": "ERP model and architecture",
      "kind": "core",
      "outcome": {
        "can": "explain the ERP data model and how its modules fit together",
        "cannotYet": "move a business document from draft to posted"
      },
      "courses": ["erp-foundations-and-history", "erp-conceptual-data-model", "erp-module-map-and-architecture"]
    },
    {
      "id": "documents-posting-close",
      "title": "Documents, posting, and period close",
      "kind": "core",
      "outcome": {
        "can": "design document lifecycles, posting rules, subledger-to-ledger flow, period close, numbering, and audit trails",
        "cannotYet": "build end-to-end business processes"
      },
      "courses": [
        "erp-document-lifecycle-and-state-machines",
        "erp-posting-rules-and-account-determination",
        "erp-subledger-to-gl-architecture",
        "erp-fiscal-calendar-and-period-close",
        "erp-numbering-sequences-and-uom-conversion",
        "erp-audit-trail-and-change-tracking"
      ]
    },
    {
      "id": "business-process-cycles",
      "title": "Business process cycles",
      "kind": "core",
      "outcome": {
        "can": "build procure-to-pay, order-to-cash, and record-to-report flows, including their exceptions",
        "cannotYet": "manage stock and manufacturing"
      },
      "courses": [
        "procure-to-pay-systems",
        "order-to-cash-systems",
        "erp-procurement-and-fulfillment-exceptions",
        "record-to-report-systems"
      ]
    },
    {
      "id": "inventory-and-manufacturing",
      "title": "Inventory and manufacturing",
      "kind": "core",
      "outcome": {
        "can": "design inventory, costing, bills of materials, MRP, planning, reservations, and quality checks",
        "cannotYet": "extend, integrate, and secure the ERP"
      },
      "courses": [
        "inventory-and-warehouse-management",
        "erp-inventory-costing-methods",
        "erp-inventory-integrity-and-concurrency",
        "erp-bom-and-routing-architecture",
        "production-planning-and-mrp",
        "demand-and-supply-planning",
        "erp-availability-and-reservations",
        "quality-management-and-inspection"
      ]
    },
    {
      "id": "extend-and-operate",
      "title": "Extending and operating the ERP",
      "kind": "core",
      "outcome": {
        "can": "extend and integrate the ERP, add HR, run several companies and currencies, secure it, and report on it"
      },
      "courses": [
        "erp-extension-and-customization",
        "erp-integration-patterns",
        "human-capital-management-and-hire-to-retire",
        "multi-company-and-multi-currency-erp",
        "erp-security-and-controls",
        "erp-analytics-and-reporting"
      ]
    }
  ]
}
```
