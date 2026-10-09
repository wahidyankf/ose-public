# Technical Design — Legacy Removal

Reader-led technical form for this plan (the single required form, per the plan authoring contract). Read in
order; each file is self-contained enough to review alone, and each links back to the business and product
requirements it satisfies. Every figure was measured on 2026-10-09 and 2026-10-10 at `origin/main`
`bb7f90137`; Phase 0 of [../delivery.md](../delivery.md#phase-0-groundwork-and-readiness) re-measures all of
them, because plans 01 to 13 change `main` before this plan runs.

| File                                                                                         | What it covers                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [001-current-state-and-evidence.md](./001-current-state-and-evidence.md)                     | What exists today: the 1,150-file legacy tree, the mapping this plan consumes and its three known defects, how redirects work here, and the measured list of every code, test, spec, content, `docs/`, and rule reference to the tree. Includes a before and after diagram.                          |
| [002-redirect-mechanism-and-url-inventory.md](./002-redirect-mechanism-and-url-inventory.md) | The redirect contract, the typed table and its builder, the rule count (418 new, 12 removed, about 493 in total), rule order, the hop budget, how inbound links, sitemap, feed, search data, and crawlers behave, the frozen 1,150-line inventory, and the `curl` and crawl checks on a real server. |
| [003-docs-repoint-and-link-validation.md](./003-docs-repoint-and-link-validation.md)         | The 94 `docs/` files in 16 groups: the per-link repoint rule, how link text and the carrying sentence change, how the software-engineering separation convention stays satisfied, three file-disjoint batches, the verify test, the destination census, and the link-validator negative control.     |
| [004-code-spec-and-test-migration.md](./004-code-spec-and-test-migration.md)                 | Every application, specification, test, and content change with an id (A, S, T, N, C), the rendering fixture that keeps renderer coverage, the two censuses that found hidden dependencies, the simulator fix, and what the deletion commit contains.                                                |
| [005-rules-and-docs-impact.md](./005-rules-and-docs-impact.md)                               | The six rule changes RC1 to RC6 with exact before and after text, rule candidates not created, the nine rules-propagation steps and the Rules Quality Gate, docs propagation, the C4 reconciliation, and the report-only stale paths.                                                                |
| [006-series-completion-gate.md](./006-series-completion-gate.md)                             | The terminal gate of series decision 40: 17 checks (SC-01 to SC-17) with exact commands, thresholds, and expected observations, the run order, the verdicts, the failure policy (no archival on failure), and the evidence file.                                                                     |
| [007-decision-records.md](./007-decision-records.md)                                         | Fifteen material decisions (D1 to D15), each with context, choice, rejected alternatives, evidence, cost, and a revisit trigger.                                                                                                                                                                     |
| [008-testing-strategy.md](./008-testing-strategy.md)                                         | The behaviour contract applied: which project runs which feature, the scenario-to-test maps for both new features, non-Gherkin and temporary tests, RED, GREEN, and REFACTOR by phase, shared step phrases, quick versus full runs, what is not tested, and the manual list.                         |
| [009-file-impact.md](./009-file-impact.md)                                                   | The annotated file-impact tree and the totals table (16 new, 137 edited, 1,161 deleted, 3 or more regenerated), plus the files this plan reads and never changes.                                                                                                                                    |
| [010-pr-size-rollback-and-series-closure.md](./010-pr-size-rollback-and-series-closure.md)   | The PR-size strategy and planned commit list, what the deletion commit removes, the rollback (revert restores content and removes the redirects) with a proof table, and the series closure that follows the merge, the deploy, and the live check.                                                  |

## Notes for the executor

- **Vercel.** This plan records no Vercel identifier and uses no Vercel MCP tool. Phase 0 re-probes whether
  any Vercel MCP tool is listed in the session and records `present` or `absent`; either way the plan
  deploys through the repository's deploy workflow.
- **No API boundary.** No tRPC procedure or payload shape changes, so the API quality gate and the rule-16
  retest are recorded as not applicable in Phase 0.
- **Plans 12 and 13 may differ from their authored form.** When this plan was written, plans 12 and 13 had
  only a syllabus and technical notes. Phase 0 reads each as-merged name (test files, registries, hooks) and
  records it; a renamed file changes a command, never a threshold.
- **Plan 10's mapping defects.** Three are known (a header that promises seven columns while the table has
  six, mixed-case dispositions, and the word "308" used as a count). [002](./002-redirect-mechanism-and-url-inventory.md#tolerating-the-known-mapping-defects)
  says how each is tolerated and when execution stops instead.

## Glossary

| Term                   | Meaning                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy tree            | `apps/ayokoding-www/content/en/learn/legacy/`, 1,150 Markdown files that the site calls "kept for reference while the course library fills".              |
| Pre-IA address         | The older `/en/learn/<domain>/...` address of a legacy page (six domains). It redirects to the legacy bucket today.                                       |
| Mapping                | Plan 10's `syllabus/legacy-to-course-mapping.md`: 105 rows, each a topic with a disposition and target course; the only input for redirects and repoints. |
| Disposition            | `Covered` (an existing course teaches it), `New course` (plan 10 wrote one), or `Obsolete` (no course, with a stated reason).                             |
| Course root            | `/en/learn/courses/<slug>`, the landing page of one course.                                                                                               |
| Catalog                | `/en/learn/courses`, the page that lists every course; the fallback destination.                                                                          |
| Hop                    | One redirect response. A chain of two redirects is two hops.                                                                                              |
| Inventory              | `legacy-url-inventory.tsv`: 1,150 lines of legacy URL, destination, and row key, frozen before the tree is deleted.                                       |
| Series-completion gate | The 17-check terminal gate (SC-01 to SC-17) that measures the end state of the whole series and blocks archival on failure.                               |

## Related

- [Plan overview](../README.md)
- [Business requirements](../brd.md)
- [Product requirements](../prd.md)
- [Delivery checklist](../delivery.md)
