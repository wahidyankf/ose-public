# 002 — Course Catalog and Modes

The 30 courses in path order, the teaching mode chosen for each with its reason, and the boundary with the
accounting courses. Each row links to the course specification in the plan's `syllabus/` corpus. The tables
below are produced from the same data as those specifications; if they disagree, the specification wins and
this file is corrected.

## Totals

- 30 courses: positions 1 to 27 are the conventional ERP path, and positions 1 to 30 are the Sharia ERP path.
- 18 By Example and 12 Annotated-Concept. No primer, in-the-field, or no-code course
  ([D3](./009-decision-records.md#d3--no-primer-in-the-field-or-no-code-course)).
- 1,980 planned worked examples: 18 × 78 plus 12 × 48
  ([D14](./009-decision-records.md#d14--targets-are-plan-defined-estimates)).
- Planned runtime mix (cluster level, confirmed at slice S0): 1,677 Python-only examples, 285 PostgreSQL
  examples in 14 courses, and 18 simulation examples in 2 courses.

## The Catalog

| Pos | Course                                                                                                              | Mode              | Phase                                | Wave | Examples | Runtime (examples)  |
| --- | ------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------ | ---- | -------- | ------------------- |
| 1   | [`erp-foundations-and-history`](../syllabus/courses/erp-foundations-and-history.md)                                 | Annotated-Concept | ERP model and architecture           | 1    | 48       | py 48               |
| 2   | [`erp-conceptual-data-model`](../syllabus/courses/erp-conceptual-data-model.md)                                     | Annotated-Concept | ERP model and architecture           | 2    | 48       | pg 6, py 42         |
| 3   | [`erp-module-map-and-architecture`](../syllabus/courses/erp-module-map-and-architecture.md)                         | Annotated-Concept | ERP model and architecture           | 3    | 48       | py 48               |
| 4   | [`erp-document-lifecycle-and-state-machines`](../syllabus/courses/erp-document-lifecycle-and-state-machines.md)     | Annotated-Concept | Documents, posting, and period close | 4    | 48       | pg 6, py 42         |
| 5   | [`erp-posting-rules-and-account-determination`](../syllabus/courses/erp-posting-rules-and-account-determination.md) | By Example        | Documents, posting, and period close | 5    | 78       | py 78               |
| 6   | [`erp-subledger-to-gl-architecture`](../syllabus/courses/erp-subledger-to-gl-architecture.md)                       | By Example        | Documents, posting, and period close | 6    | 78       | pg 16, py 62        |
| 7   | [`erp-fiscal-calendar-and-period-close`](../syllabus/courses/erp-fiscal-calendar-and-period-close.md)               | Annotated-Concept | Documents, posting, and period close | 7    | 48       | py 48               |
| 8   | [`erp-numbering-sequences-and-uom-conversion`](../syllabus/courses/erp-numbering-sequences-and-uom-conversion.md)   | Annotated-Concept | Documents, posting, and period close | 4    | 48       | pg 16, py 32        |
| 9   | [`erp-audit-trail-and-change-tracking`](../syllabus/courses/erp-audit-trail-and-change-tracking.md)                 | Annotated-Concept | Documents, posting, and period close | 6    | 48       | pg 17, py 31        |
| 10  | [`procure-to-pay-systems`](../syllabus/courses/procure-to-pay-systems.md)                                           | By Example        | Business process cycles              | 7    | 78       | py 78               |
| 11  | [`order-to-cash-systems`](../syllabus/courses/order-to-cash-systems.md)                                             | By Example        | Business process cycles              | 7    | 78       | py 78               |
| 12  | [`erp-procurement-and-fulfillment-exceptions`](../syllabus/courses/erp-procurement-and-fulfillment-exceptions.md)   | By Example        | Business process cycles              | 8    | 78       | py 78               |
| 13  | [`record-to-report-systems`](../syllabus/courses/record-to-report-systems.md)                                       | By Example        | Business process cycles              | 8    | 78       | pg 8, py 70         |
| 14  | [`inventory-and-warehouse-management`](../syllabus/courses/inventory-and-warehouse-management.md)                   | By Example        | Inventory and manufacturing          | 8    | 78       | pg 8, py 70         |
| 15  | [`erp-inventory-costing-methods`](../syllabus/courses/erp-inventory-costing-methods.md)                             | By Example        | Inventory and manufacturing          | 9    | 78       | pg 9, py 69         |
| 16  | [`erp-inventory-integrity-and-concurrency`](../syllabus/courses/erp-inventory-integrity-and-concurrency.md)         | By Example        | Inventory and manufacturing          | 9    | 78       | pg 70, sim 8        |
| 17  | [`erp-bom-and-routing-architecture`](../syllabus/courses/erp-bom-and-routing-architecture.md)                       | By Example        | Inventory and manufacturing          | 3    | 78       | pg 17, py 61        |
| 18  | [`production-planning-and-mrp`](../syllabus/courses/production-planning-and-mrp.md)                                 | By Example        | Inventory and manufacturing          | 9    | 78       | py 78               |
| 19  | [`demand-and-supply-planning`](../syllabus/courses/demand-and-supply-planning.md)                                   | Annotated-Concept | Inventory and manufacturing          | 10   | 48       | py 48               |
| 20  | [`erp-availability-and-reservations`](../syllabus/courses/erp-availability-and-reservations.md)                     | By Example        | Inventory and manufacturing          | 10   | 78       | pg 8, py 70         |
| 21  | [`quality-management-and-inspection`](../syllabus/courses/quality-management-and-inspection.md)                     | By Example        | Inventory and manufacturing          | 10   | 78       | py 78               |
| 22  | [`erp-extension-and-customization`](../syllabus/courses/erp-extension-and-customization.md)                         | By Example        | Extending and operating the ERP      | 4    | 78       | pg 17, py 61        |
| 23  | [`erp-integration-patterns`](../syllabus/courses/erp-integration-patterns.md)                                       | By Example        | Extending and operating the ERP      | 6    | 78       | pg 9, py 59, sim 10 |
| 24  | [`human-capital-management-and-hire-to-retire`](../syllabus/courses/human-capital-management-and-hire-to-retire.md) | Annotated-Concept | Extending and operating the ERP      | 5    | 48       | py 48               |
| 25  | [`multi-company-and-multi-currency-erp`](../syllabus/courses/multi-company-and-multi-currency-erp.md)               | By Example        | Extending and operating the ERP      | 11   | 78       | py 78               |
| 26  | [`erp-security-and-controls`](../syllabus/courses/erp-security-and-controls.md)                                     | Annotated-Concept | Extending and operating the ERP      | 5    | 48       | py 48               |
| 27  | [`erp-analytics-and-reporting`](../syllabus/courses/erp-analytics-and-reporting.md)                                 | By Example        | Extending and operating the ERP      | 11   | 78       | pg 78               |
| 28  | [`sharia-compliant-erp-design`](../syllabus/courses/sharia-compliant-erp-design.md)                                 | Annotated-Concept | Sharia ERP design                    | 12   | 48       | py 48               |
| 29  | [`islamic-contract-based-transaction-flows`](../syllabus/courses/islamic-contract-based-transaction-flows.md)       | By Example        | Sharia ERP design                    | 13   | 78       | py 78               |
| 30  | [`zakat-and-sharia-compliance-modules`](../syllabus/courses/zakat-and-sharia-compliance-modules.md)                 | Annotated-Concept | Sharia ERP design                    | 13   | 48       | py 48               |

Runtime key: `py` is Python 3.14 using only the standard library; `pg` is a PostgreSQL 18 service container
driven by a `psql` SQL unit or from Python through the hash-locked `pg8000` driver; `sim` is a seeded Python
simulation with a virtual clock.

## Phases and Order

| Phase | Title                                | Positions | Courses |
| ----- | ------------------------------------ | --------- | ------- |
| 1     | ERP model and architecture           | 1 to 3    | 3       |
| 2     | Documents, posting, and period close | 4 to 9    | 6       |
| 3     | Business process cycles              | 10 to 13  | 4       |
| 4     | Inventory and manufacturing          | 14 to 21  | 8       |
| 5     | Extending and operating the ERP      | 22 to 27  | 6       |
| 6     | Sharia ERP design (Sharia path only) | 28 to 30  | 3       |

The order is exactly the order in the two manifests on `origin/main`, so this plan changes no course
membership or position (the membership tests of plan 02 keep passing). The phase boundaries and outcome
wording are plan 02's drafts, kept because the finished courses match them
([006](./006-path-restructure-and-pending-removal.md#the-final-manifests)).

## Why Each Mode

Two heuristics chose the mode. The heuristics are a judgement; the reasons below are the evidence.

- **By Example** fits a course whose subject is a set of small, independent scenarios with a deterministic
  result that a reader can run: post a document, value a layer, replay a movement, schedule a demand. Each
  example carries the five parts the By Example gate requires (explanation, diagram when useful, annotated
  code, takeaway, "Why It Matters").
- **Annotated-Concept** fits a course whose subject is a set of linked concepts that read best as models,
  tables, formulas, and diagrams next to code: the data model, the module map, document lifecycles, the
  close calendar, security, planning, and the Sharia design concepts.

| Pos | Course                                        | Why this mode                                                                                                                                                                                                                               |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `erp-foundations-and-history`                 | The ideas are framing concepts (records, ownership, lineage, trade-offs) that need several angles each. Annotated-concept gives per-theme clusters and mixed media, where one runnable snippet per idea would be thin.                      |
| 2   | `erp-conceptual-data-model`                   | The model has many interlocking concepts (keys, roles, time, snapshots) that each need a diagram, a rule, and a small runnable check. Annotated-concept lets each theme mix diagrams, config, and code.                                     |
| 3   | `erp-module-map-and-architecture`             | Architecture ideas (ownership, direction, seams, decisions) are best shown with diagrams, small configs, and executable boundary checks side by side. Annotated-concept fits that mix.                                                      |
| 4   | `erp-document-lifecycle-and-state-machines`   | State machines are taught best as a mix of tables, diagrams, and runnable engines, with each concept shown in a different medium. Annotated-concept fits better than a strict one-snippet-per-idea format.                                  |
| 5   | `erp-posting-rules-and-account-determination` | Every idea is a small rule case with a checkable posting result (input facts in, entry out), which is what By Example teaches best: many short, fully runnable cases that build from a lookup to a versioned rule engine.                   |
| 6   | `erp-subledger-to-gl-architecture`            | Each idea is a small, checkable story of detail rolling up to a total, with a reconciliation result to verify. By Example builds from one control account to async posting with an outbox.                                                  |
| 7   | `erp-fiscal-calendar-and-period-close`        | Close is a set of cooperating rules (calendar, status, cutoff, checklist, reopen) that need diagrams, state tables, and small engines together. Annotated-concept fits that mix.                                                            |
| 8   | `erp-numbering-sequences-and-uom-conversion`  | The concepts split into identifiers (uniqueness, gaps, concurrency) and quantities (units, factors, rounding), each shown best with SQL, code, and tables together. Annotated-concept fits.                                                 |
| 9   | `erp-audit-trail-and-change-tracking`         | Audit design combines schema, triggers, application capture, hashing, and policy, and each theme is clearest in its own medium. Annotated-concept fits.                                                                                     |
| 10  | `procure-to-pay-systems`                      | The cycle is a chain of small, verifiable steps and checks (approve, order, receive, match, pay), which By Example teaches as many short runnable cases that build into a full engine.                                                      |
| 11  | `order-to-cash-systems`                       | The cycle is a chain of small, verifiable steps (order, allocate, ship, invoice, collect), which By Example teaches as many short runnable cases that build into a full engine.                                                             |
| 12  | `erp-procurement-and-fulfillment-exceptions`  | Each exception is a small scenario with a clear before and after, which By Example teaches as many short runnable cases over the two flows.                                                                                                 |
| 13  | `record-to-report-systems`                    | The cycle is a chain of controlled steps (journal, accrue, allocate, reconcile, close, report), each shown as short runnable cases that build into a close workbench. By Example fits.                                                      |
| 14  | `inventory-and-warehouse-management`          | Stock behaviour is a catalogue of small movement scenarios (receive, move, pick, count, hold) that each have a checkable balance. By Example fits well, with SQL doing much of the work.                                                    |
| 15  | `erp-inventory-costing-methods`               | Each method and each edge case (backdating, negative stock, method change) is a small numeric scenario with a checkable value, which By Example teaches as many short runs over the same movement history.                                  |
| 16  | `erp-inventory-integrity-and-concurrency`     | Each hazard (lost update, oversell, write skew, deadlock) is a small scripted scenario with a deterministic outcome, which By Example teaches best. The course uses scripted two-session schedules and a seeded explorer instead of timing. |
| 17  | `erp-bom-and-routing-architecture`            | Structures and routes are taught through many small data-and-query cases (explode, implode, version, substitute) that each have a checkable result. By Example fits.                                                                        |
| 18  | `production-planning-and-mrp`                 | Netting, offsetting, lot sizing, and pegging are numeric procedures best learned by running many small, hand-checkable cases that grow to a full multi-level run. By Example fits.                                                          |
| 19  | `demand-and-supply-planning`                  | Planning mixes statistics, process, and policy; each concept is clearer with a formula, a table, a diagram, or a small run. Annotated-concept fits better than one snippet per idea.                                                        |
| 20  | `erp-availability-and-reservations`           | Each availability rule and reservation behaviour is a small numeric or state scenario with a checkable result, which By Example teaches as many short cases that end in concurrent allocation.                                              |
| 21  | `quality-management-and-inspection`           | Quality flows are chains of small state-and-decision cases with checkable stock effects, which By Example teaches as many short runs that end in a recall trace.                                                                            |
| 22  | `erp-extension-and-customization`             | Each extension technique is a small before-and-after case with a checkable compatibility result, which By Example teaches as many short runs ranging from a parameter to an upgrade check.                                                  |
| 23  | `erp-integration-patterns`                    | Each pattern is a small scenario with a deterministic outcome (publish, duplicate, fail, retry, verify), which By Example teaches best. Faults are injected with a seeded simulation and a virtual clock.                                   |
| 24  | `human-capital-management-and-hire-to-retire` | The topic mixes data models, rules, process, and privacy policy, and each concept is clearer in its own medium (model, table, run, checklist). Annotated-concept fits.                                                                      |
| 25  | `multi-company-and-multi-currency-erp`        | Entity scoping, currency roles, and revaluation are numeric and structural cases with checkable results, which By Example teaches as many short runs that end in eliminations.                                                              |
| 26  | `erp-security-and-controls`                   | Control design mixes models, matrices, rules, and process, and each concept needs its own medium plus a runnable evaluator. Annotated-concept fits; the topic is code-demonstrable, so it is not a no-code course.                          |
| 27  | `erp-analytics-and-reporting`                 | Reporting rules (grain, snapshot, aging, filters) are SQL-and-numbers cases with checkable totals, which By Example teaches as many short queries that tie to control totals.                                                               |
| 28  | `sharia-compliant-erp-design`                 | The design is made of cooperating configuration, policy, and audit concepts that read best as models, tables, and small validators side by side. Annotated-concept fits; the course is code-demonstrable, so it is not a no-code course.    |
| 29  | `islamic-contract-based-transaction-flows`    | Each contract flow and each policy difference is a short scenario with a checkable schedule, sequence, or posting, which By Example teaches as many runs over a shared engine.                                                              |
| 30  | `zakat-and-sharia-compliance-modules`         | The module is a set of policy, parameter, and audit concepts that read best as tables, formulas, models, and runnable calculators together. Annotated-concept fits; the topic is code-demonstrable, so it is not a no-code course.          |

### Why Not the Other Modes

- **Primer ("Just Enough X").** A primer is a language or tool on-ramp. No ERP course teaches a language or
  a tool; they teach a domain. The language skills they need come from `just-enough-python` and
  `sql-essentials`, which the paths assume.
- **In the Field.** The In the Field kind is 20 to 40 production guides per language, laid out under
  `<language>/in-the-field/`. It fits language and framework production practice, not a domain
  architecture course.
- **No-code Annotated-Concept.** The no-code sub-mode is for leadership and governance topics with zero
  code. Every ERP topic here is demonstrable in code, including the Sharia design courses: they show how a
  system stores contract terms, evidence, and decisions, which is exactly what must stay free of rulings. A
  no-code mode would invite prose that reads as a ruling, which decision 19 forbids.

## Accounting Boundary

The ERP courses teach how a system records, enforces, and reports accounting facts. The accounting courses
(plan 06) teach the accounting itself. An ERP course states an accounting rule in one sentence at most,
links to the accounting course for the full treatment, and never re-teaches it ("link, don't walk"). The
accounting courses an ERP path assumes are listed in `assumes`; the others are links.

| Pos | ERP course                                    | Accounting course it links to (see also, not a prerequisite)                   | Outside prerequisites it needs filled first                                                                                      |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `erp-foundations-and-history`                 | none                                                                           | `just-enough-python`                                                                                                             |
| 2   | `erp-conceptual-data-model`                   | none                                                                           | `just-enough-python`, `sql-essentials`                                                                                           |
| 3   | `erp-module-map-and-architecture`             | none                                                                           | `just-enough-python`                                                                                                             |
| 4   | `erp-document-lifecycle-and-state-machines`   | none                                                                           | `domain-driven-design`, `just-enough-python`, `sql-essentials`                                                                   |
| 5   | `erp-posting-rules-and-account-determination` | `journal-entries-and-posting-mechanics`, `chart-of-accounts-and-data-modeling` | `just-enough-python`                                                                                                             |
| 6   | `erp-subledger-to-gl-architecture`            | `general-ledger-system-architecture`                                           | `just-enough-python`, `sql-essentials`                                                                                           |
| 7   | `erp-fiscal-calendar-and-period-close`        | `financial-statements-and-close-cycle`                                         | `just-enough-python`                                                                                                             |
| 8   | `erp-numbering-sequences-and-uom-conversion`  | none                                                                           | `just-enough-python`, `sql-essentials`                                                                                           |
| 9   | `erp-audit-trail-and-change-tracking`         | none                                                                           | `just-enough-python`, `sql-essentials`                                                                                           |
| 10  | `procure-to-pay-systems`                      | `accounts-payable-and-procure-to-pay`                                          | `just-enough-python`                                                                                                             |
| 11  | `order-to-cash-systems`                       | `accounts-receivable-and-order-to-cash`                                        | `just-enough-python`                                                                                                             |
| 12  | `erp-procurement-and-fulfillment-exceptions`  | none                                                                           | `just-enough-python`                                                                                                             |
| 13  | `record-to-report-systems`                    | `general-ledger-system-architecture`                                           | `financial-statements-and-close-cycle`, `just-enough-python`, `sql-essentials`                                                   |
| 14  | `inventory-and-warehouse-management`          | none                                                                           | `inventory-and-cogs-accounting`, `just-enough-python`, `sql-essentials`                                                          |
| 15  | `erp-inventory-costing-methods`               | `inventory-and-cogs-accounting`                                                | `just-enough-python`, `sql-essentials`                                                                                           |
| 16  | `erp-inventory-integrity-and-concurrency`     | none                                                                           | `just-enough-python`, `sql-essentials`                                                                                           |
| 17  | `erp-bom-and-routing-architecture`            | none                                                                           | `just-enough-python`, `sql-essentials`                                                                                           |
| 18  | `production-planning-and-mrp`                 | none                                                                           | `just-enough-python`                                                                                                             |
| 19  | `demand-and-supply-planning`                  | none                                                                           | `just-enough-python`                                                                                                             |
| 20  | `erp-availability-and-reservations`           | none                                                                           | `just-enough-python`, `sql-essentials`                                                                                           |
| 21  | `quality-management-and-inspection`           | none                                                                           | `just-enough-python`                                                                                                             |
| 22  | `erp-extension-and-customization`             | none                                                                           | `sql-essentials`, `just-enough-python`                                                                                           |
| 23  | `erp-integration-patterns`                    | none                                                                           | `event-driven-architecture`, `networking-essentials`, `backend-essentials`, `api-design`, `just-enough-python`, `sql-essentials` |
| 24  | `human-capital-management-and-hire-to-retire` | none                                                                           | `payroll-and-tax-accounting-essentials`, `just-enough-python`                                                                    |
| 25  | `multi-company-and-multi-currency-erp`        | `multi-currency-accounting-and-fx-translation`                                 | `consolidation-and-multi-entity-accounting`, `just-enough-python`                                                                |
| 26  | `erp-security-and-controls`                   | none                                                                           | `audit-controls-and-compliance`, `just-enough-python`                                                                            |
| 27  | `erp-analytics-and-reporting`                 | none                                                                           | `just-enough-python`, `sql-essentials`                                                                                           |
| 28  | `sharia-compliant-erp-design`                 | `sharia-ledger-system-architecture`                                            | `islamic-contract-modeling-for-systems`, `sharia-accounting-and-aaoifi-standards`, `just-enough-python`                          |
| 29  | `islamic-contract-based-transaction-flows`    | `sukuk-and-islamic-capital-markets-accounting`                                 | `just-enough-python`                                                                                                             |
| 30  | `zakat-and-sharia-compliance-modules`         | `zakah-computation-and-reporting-for-systems`                                  | `just-enough-python`                                                                                                             |

Phase 0 verifies these slugs against what plan 06 merged. A renamed or removed accounting course changes
the link, the prerequisite, and the `assumes` list together
([006](./006-path-restructure-and-pending-removal.md#recompute-rule)).
