# Manifest — `skills/sharia-erp`

**Path title**: Sharia ERP · **Arc**: `immediately-effective` · **File**: `apps/ayokoding-www/src/features/course-paths/manifests/skills/sharia-erp.json` · **Courses before and after**: 30

This file holds the exact manifest body this plan writes, the page copy that goes with it, and the closure derivation that makes the `assumes` list exact. Phase 3 of the delivery applies it after every course in the path is filled. Plan 02's drafted version is the starting point; this version differs from it only by adding `just-enough-python` to `assumes` (rubric rule L1: every finished ERP example is written in Python 3.14). Apply this version unless Phase 0 finds that a merged prerequisite changed (see [Recompute rule](#recompute-rule)).

## What Changes

| Field                  | Before this plan                    | After this plan                                                                                                       |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `restructurePendingIn` | `"plan-07"`                         | removed (the field no longer exists)                                                                                  |
| `description`          | the pre-restructure sentence        | "For software engineers building Sharia-compliant ERP systems: the full ERP foundation, then Sharia-specific design." |
| `assumes`              | `[]`                                | 14 outside prerequisites (below)                                                                                      |
| `phases`               | one `all-courses` phase, no outcome | 6 core phases, each with an outcome; no extension phase                                                               |
| Course membership      | 30 courses                          | the same 30 courses, in the same order                                                                                |

## Final JSON

```json
{
  "pathId": "skills/sharia-erp",
  "arc": "immediately-effective",
  "title": "Sharia ERP",
  "description": "For software engineers building Sharia-compliant ERP systems: the full ERP foundation, then Sharia-specific design.",
  "assumes": [
    "api-design",
    "audit-controls-and-compliance",
    "backend-essentials",
    "consolidation-and-multi-entity-accounting",
    "domain-driven-design",
    "event-driven-architecture",
    "financial-statements-and-close-cycle",
    "inventory-and-cogs-accounting",
    "islamic-contract-modeling-for-systems",
    "just-enough-python",
    "networking-essentials",
    "payroll-and-tax-accounting-essentials",
    "sharia-accounting-and-aaoifi-standards",
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
        "can": "extend and integrate the ERP, add HR, run several companies and currencies, secure it, and report on it",
        "cannotYet": "design Sharia-compliant transaction flows"
      },
      "courses": [
        "erp-extension-and-customization",
        "erp-integration-patterns",
        "human-capital-management-and-hire-to-retire",
        "multi-company-and-multi-currency-erp",
        "erp-security-and-controls",
        "erp-analytics-and-reporting"
      ]
    },
    {
      "id": "sharia-erp-design",
      "title": "Sharia ERP design",
      "kind": "core",
      "outcome": {
        "can": "design Sharia-compliant ERP flows based on Islamic contracts and add zakat and compliance modules",
        "cannotYet": "issue Sharia rulings; that needs a qualified Sharia board"
      },
      "courses": [
        "sharia-compliant-erp-design",
        "islamic-contract-based-transaction-flows",
        "zakat-and-sharia-compliance-modules"
      ]
    }
  ]
}
```

## Phase Table

| Phase ID                      | Title                                | Positions | Courses                                                                                                                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erp-model-and-architecture`  | ERP model and architecture           | 1–3       | `erp-foundations-and-history`, `erp-conceptual-data-model`, `erp-module-map-and-architecture`                                                                                                                                                                                               |
| `documents-posting-close`     | Documents, posting, and period close | 4–9       | `erp-document-lifecycle-and-state-machines`, `erp-posting-rules-and-account-determination`, `erp-subledger-to-gl-architecture`, `erp-fiscal-calendar-and-period-close`, `erp-numbering-sequences-and-uom-conversion`, `erp-audit-trail-and-change-tracking`                                 |
| `business-process-cycles`     | Business process cycles              | 10–13     | `procure-to-pay-systems`, `order-to-cash-systems`, `erp-procurement-and-fulfillment-exceptions`, `record-to-report-systems`                                                                                                                                                                 |
| `inventory-and-manufacturing` | Inventory and manufacturing          | 14–21     | `inventory-and-warehouse-management`, `erp-inventory-costing-methods`, `erp-inventory-integrity-and-concurrency`, `erp-bom-and-routing-architecture`, `production-planning-and-mrp`, `demand-and-supply-planning`, `erp-availability-and-reservations`, `quality-management-and-inspection` |
| `extend-and-operate`          | Extending and operating the ERP      | 22–27     | `erp-extension-and-customization`, `erp-integration-patterns`, `human-capital-management-and-hire-to-retire`, `multi-company-and-multi-currency-erp`, `erp-security-and-controls`, `erp-analytics-and-reporting`                                                                            |
| `sharia-erp-design`           | Sharia ERP design                    | 28–30     | `sharia-compliant-erp-design`, `islamic-contract-based-transaction-flows`, `zakat-and-sharia-compliance-modules`                                                                                                                                                                            |

## Closure Derivation

Rule R4 (closure) lets a core course declare a prerequisite only if it is earlier in the path or listed in `assumes`. Rule R7 (exact `assumes`) requires `assumes` to hold exactly the outside prerequisites of the core courses. The table lists each assumed course and the core course that needs it, taken from the course frontmatter measured on 2026-10-09.

| Assumed course                              | Needed by                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api-design`                                | `erp-integration-patterns`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `audit-controls-and-compliance`             | `erp-security-and-controls`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `backend-essentials`                        | `erp-integration-patterns`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `consolidation-and-multi-entity-accounting` | `multi-company-and-multi-currency-erp`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `domain-driven-design`                      | `erp-document-lifecycle-and-state-machines`                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `event-driven-architecture`                 | `erp-integration-patterns`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `financial-statements-and-close-cycle`      | `record-to-report-systems`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `inventory-and-cogs-accounting`             | `inventory-and-warehouse-management`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `islamic-contract-modeling-for-systems`     | `sharia-compliant-erp-design`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `just-enough-python`                        | every course in the path (30 courses)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `networking-essentials`                     | `erp-integration-patterns`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `payroll-and-tax-accounting-essentials`     | `human-capital-management-and-hire-to-retire`                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `sharia-accounting-and-aaoifi-standards`    | `sharia-compliant-erp-design`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `sql-essentials`                            | `erp-conceptual-data-model`, `erp-document-lifecycle-and-state-machines`, `erp-subledger-to-gl-architecture`, `erp-numbering-sequences-and-uom-conversion`, `erp-audit-trail-and-change-tracking`, `record-to-report-systems`, `inventory-and-warehouse-management`, `erp-inventory-costing-methods`, `erp-inventory-integrity-and-concurrency`, `erp-bom-and-routing-architecture`, `erp-availability-and-reservations`, `erp-extension-and-customization`, `erp-integration-patterns`, `erp-analytics-and-reporting` |

Every in-path prerequisite of every course appears earlier in the order, so R4 and R10 (ordering) hold without further changes. Count check: `14` assumed courses.

## Recompute Rule

1. Phase 0 re-reads each course's merged `prerequisites` and compares them with the `Prerequisites` section of the matching file in [courses/](../courses/README.md).
2. If a prerequisite changed (plan 02 or plan 06 revised it), edit the course syllabus file and the `assumes` list together, then run the path-model integrity unit test over the real manifests. The test prints the expected values when `assumes` or the core drifts. No ad-hoc script computes them.
3. If a phase no longer fits the finished courses, change the phase boundaries and outcomes and record the reason in the Phase 3 evidence file. Keep course order unless the prerequisite ordering rule (R10) forces a move.

## Page Copy

The path page `apps/ayokoding-www/content/en/learn/paths/skills/sharia-erp/_index.md` keeps its `date` and `weight` and gets the frontmatter and body below. The body states the audience, the route, and why the path starts where it does. It contains none of the words "Dangerous", "OI-2", "append", "manifest", or "from scratch", which the path-copy test forbids.

```markdown
---
title: "Sharia ERP"
description: "For software engineers building Sharia-compliant ERP systems: the full ERP foundation, then Sharia-specific design."
---

This path is for software engineers who build Sharia-compliant ERP systems. It teaches the full ERP route first, the same 27 courses as the Conventional ERP path, and then adds three Sharia-specific courses: configurable Sharia ERP design, contract-based transaction flows, and zakat and compliance modules. You do not need to take the Conventional ERP path first.

It starts with the ERP data model and module map because every later course reads and writes those shared records. The courses show how software records contract terms, evidence, and decisions. They do not issue Sharia rulings; a qualified Sharia board decides what is permissible.

Work through the phases in order. Each phase lists what you can do after it. The courses it assumes you have already taken are listed before the first phase.
```

The frontmatter `description` repeats the manifest `description` so the card, the page, and the search result agree. The page keeps its existing `date`, `draft: false`, and `weight`.
