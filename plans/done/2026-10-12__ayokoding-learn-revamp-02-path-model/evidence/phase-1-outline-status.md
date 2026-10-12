# Phase 1 Evidence — Outline Course Status

Plan 03 check: `estimatedHours` is absent from `apps/ayokoding-www/src/features/content/core/schemas.ts`
(plan 03 not landed), so the schema uses the simple `status: z.enum(["outline"]).optional()` form.

## Gherkin first (RED)

Created `specs/apps/ayokoding/www/behaviours/frontend/course-paths/outline-course-status.feature`
with the feature header and the three scenarios from prd.md (badge scenario deferred to Phase 4),
each with both exemption comments and both tags.

`BEHAVIOUR` failed as required, naming exactly the three new scenarios as missing unit bindings:

```text
outline-course-status.feature: A course under one thousand words is marked as an outline / ...: undefined Unit binding.
outline-course-status.feature: Course status accepts only the outline value / ...: undefined Unit binding.
outline-course-status.feature: Every course frontmatter parses so no course page is silently dropped / ...: undefined Unit binding.
NX   Running target test:coverage:behaviour for project ayokoding-www failed
```

## AC-1.1 — Frontmatter schema accepts only `outline`

RED (`UNIT-FE tests/unit/features/content/core/schemas.test.ts`): 2 failed, 3 passed.
The `"outline"` case failed because the key is stripped today (`expected undefined to deeply
equal 'outline'`); the `"draft"` case failed because any value is accepted today
(`expected [Function] to throw an error`).

GREEN: added `status: z.enum(["outline"]).optional()` to `frontmatterSchema`. Rerun: 5 passed.

REFACTOR: one-line comment naming the guard test (`course-frontmatter.unit.test.ts`) that keeps
the marker honest.

## AC-1.2 — `ContentMeta` carries `status`

RED (`UNIT-NODE tests/unit/features/content/shell/repository-fs.unit.test.ts`): 1 failed, 3 passed.
Slug-existence assertions passed; the status assertion failed
(`expected undefined to deeply equal 'outline'`), proving the failure is the missing mapping,
not the fixture slugs.

GREEN: added `status?: "outline"` to `ContentMeta` (doc comment matches the `prerequisites`
style) and mapped `frontmatter.status` next to `prerequisites` in `repository-fs.ts`. Rerun:
4 passed.

REFACTOR: doc comment already matches the `prerequisites` style (additive-only wording); no
further change.

## AC-1.3 — Every course parses, and every skeleton course is marked

RED (`UNIT-NODE tests/unit/features/content/course-frontmatter.unit.test.ts`): 1 failed, 1 passed.
The parse test passed; the guard failed listing exactly the 62 slugs from
`syllabus/courses/README.md` section 1 (verified by set-equality against the README's backticked
slugs: 62 guard slugs, 62 README slugs, zero missing, zero extra).

The 62-course list printed by the guard before GREEN (19 + 5 + 27 + 3 + 8 = 62):

```text
accounting-foundations, accounts-payable-and-procure-to-pay, accounts-receivable-and-order-to-cash,
accrual-accounting-and-revenue-recognition, audit-controls-and-compliance, capstone-build-your-own-coding-agent,
capstone-build-your-own-pentest-engine, capstone-concurrency-and-systems, capstone-concurrency-showdown,
capstone-data-pipeline, capstone-lead-at-altitude, capstone-real-world-delivery, capstone-secure-service,
chart-of-accounts-and-data-modeling, consolidation-and-multi-entity-accounting, demand-and-supply-planning,
erp-analytics-and-reporting, erp-audit-trail-and-change-tracking, erp-availability-and-reservations,
erp-bom-and-routing-architecture, erp-conceptual-data-model, erp-document-lifecycle-and-state-machines,
erp-extension-and-customization, erp-fiscal-calendar-and-period-close, erp-foundations-and-history,
erp-integration-patterns, erp-inventory-costing-methods, erp-inventory-integrity-and-concurrency,
erp-module-map-and-architecture, erp-numbering-sequences-and-uom-conversion, erp-posting-rules-and-account-determination,
erp-procurement-and-fulfillment-exceptions, erp-security-and-controls, erp-subledger-to-gl-architecture,
financial-reporting-and-xbrl, financial-reporting-standards-ifrs-vs-gaap, financial-statements-and-close-cycle,
fixed-assets-and-depreciation, general-ledger-system-architecture, human-capital-management-and-hire-to-retire,
inventory-and-cogs-accounting, inventory-and-warehouse-management, islamic-contract-based-transaction-flows,
islamic-contract-modeling-for-systems, journal-entries-and-posting-mechanics, lease-and-intangible-asset-accounting,
managerial-and-cost-accounting, multi-company-and-multi-currency-erp, multi-currency-accounting-and-fx-translation,
order-to-cash-systems, payroll-and-tax-accounting-essentials, procure-to-pay-systems, production-planning-and-mrp,
quality-management-and-inspection, record-to-report-systems, sharia-accounting-and-aaoifi-standards,
sharia-compliant-erp-design, sharia-ledger-system-architecture, sukuk-and-islamic-capital-markets-accounting,
treasury-and-cash-management, zakah-computation-and-reporting-for-systems, zakat-and-sharia-compliance-modules
```

GREEN: added the line `status: outline` directly after `prerequisites` in each of the 62
`_index.md` files, changing nothing else.
`git diff --stat -- apps/ayokoding-www/content/en/learn/courses`: 62 files changed, 62 insertions.
The full courses diff is 62 added `+status: outline` lines and zero removals. Rerun: 2 passed.

REFACTOR: extracted `countCourseWords` with a comment stating it is test code, not a product
feature. Rerun: 2 passed.

## Bind the scenarios (GREEN)

Created `tests/unit/fe-steps/outline-course-status.steps.tsx` with `describeFeature`/`loadFeature`
like `course-path-manifest.steps.ts`, binding the three scenarios to the same assertions.
`UNIT-FE tests/unit/fe-steps/outline-course-status.steps.tsx`: 11 passed.
`BEHAVIOUR`: exit 0 — `ayokoding-www: 49 features, 397 expanded scenarios, adapters: unit,
integration, e2e.`

## Phase 1 gate

- `QUICK`: exit 0 (direct run; see substitution note below).
- `BEHAVIOUR`: exit 0 (hippo wrapper).
- `VALIDATE-INDEXES`: exit 0, no drift, no regeneration needed.
- `git status --short`: only the feature file, `schemas.ts`, `types.ts`, `repository-fs.ts`,
  the three test files (`schemas.test.ts`, `repository-fs.unit.test.ts`,
  `course-frontmatter.unit.test.ts`), the steps file (`outline-course-status.steps.tsx`),
  the 62 `_index.md` files, and `<plan>/` (this file). No regenerated index files.

## Notes

- Hippo substitution: hippo ephemeral sandboxes shed twice under memory pressure
  (`pressure-shed`, once mid-QUICK, once after QUICK's payload ran) with no failing assertion.
  The same underlying commands were rerun directly without the hippo wrapper
  (`npx nx run ayokoding-www:test:quick` from the worktree root;
  `npx vitest run --project unit|unit-fe <file>` from `apps/ayokoding-www`): exit 0.
  `BEHAVIOUR` and `VALIDATE-INDEXES` ran green under the hippo wrapper.
- Intermediate `QUICK` runs (after the feature file, before the steps file) fail only on the
  static unit-coverage validator reporting `undefined Unit binding` for the three new scenarios;
  all 3308 runtime unit tests pass. This is the expected Gherkin-first RED state (the unit adapter
  has no exemption path), resolved by the final bind step. Delivery.md's per-AC `QUICK exit 0`
  acceptances therefore hold only from the bind step onward.
- One test-authoring repair: the first draft of the AC-1.2 case replaced a `describe` opener and
  orphaned the preexisting block; repaired before any GREEN run (structure verified by read-back).
  No product code was affected.
- No tests were loosened, skipped, or deleted. No preexisting failures encountered.
