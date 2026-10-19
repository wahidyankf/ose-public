# Technical Design — Legacy Unique Migration

Reader-led technical form for this plan (the single required form, per the plan authoring contract). Read
in order; each file is self-contained enough to review alone, and each links back to the business and
product requirements it satisfies.

| File                                                                                                                 | What it covers                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [001-current-state-and-inventory-method.md](./001-current-state-and-inventory-method.md)                             | The two trees' measured sizes; the exact inventory and classification method and its consistency rule; how completeness against all 1,150 files was verified.                                                                                                                                                                                                        |
| [002-course-modes-and-definition-of-done.md](./002-course-modes-and-definition-of-done.md)                           | Mode assignment (41 By Example, 7 Annotated-Concept) with targets restated; the definition of done; the `in-the-field` format defined for a future plan but not used here.                                                                                                                                                                                           |
| [003-code-harness-determinism-and-toolchain-additions.md](./003-code-harness-determinism-and-toolchain-additions.md) | Runtime design per course group; the real-vs-static rules applied; the one new toolchain (WebAssembly), the extension of plan 09's `clojure` entry (and of `kotlin`) with the shared hash-locked jar recipe, the jar libraries each JVM-hosted course pins, and the full-run trigger these changes cause.                                                            |
| [004-catalog-metadata-and-path-membership.md](./004-catalog-metadata-and-path-membership.md)                         | Metadata schema restated; the category-count table (182 → 230); why no new course joins a path manifest.                                                                                                                                                                                                                                                             |
| [005-fast-changing-tool-sourcing-policy.md](./005-fast-changing-tool-sourcing-policy.md)                             | The source-and-date policy for the four AI coding-agent courses: re-verify at writing time, date every claim, never depend on live behaviour.                                                                                                                                                                                                                        |
| [006-execution-model-waves-and-ledger.md](./006-execution-model-waves-and-ledger.md)                                 | The per-course maker → gate → gate → harness pipeline; the 16-wave/N=3 schedule; BLOCKED handling and the execution ledger.                                                                                                                                                                                                                                          |
| [007-mapping-format-and-plan-14-consumption.md](./007-mapping-format-and-plan-14-consumption.md)                     | Why the mapping table has its six-column format; the algorithm plan 14 runs against it; what this plan's own gate checks versus what plan 14 still has to do.                                                                                                                                                                                                        |
| [008-testing-strategy.md](./008-testing-strategy.md)                                                                 | The scenario-to-test map; quick vs full suite; what is explicitly left to plans 11 to 13 to re-test.                                                                                                                                                                                                                                                                 |
| [009-decision-records.md](./009-decision-records.md)                                                                 | Eight material decisions (CliftonStrengths obsolete, the consistent per-language rule, the architecture corpus, the merge policy, the Datomic reference implementation, the React Native static examples, no path assignment, one shared jar recipe for Java, Kotlin, and Clojure), each with its rejected alternatives, evidence, trade-offs, and revisit triggers. |
| [010-file-impact.md](./010-file-impact.md)                                                                           | The file-impact tree; exactly what this plan's commits touch and never touch.                                                                                                                                                                                                                                                                                        |
| [011-rule-and-docs-impact.md](./011-rule-and-docs-impact.md)                                                         | Repository rule impact (none edited) and `docs/` impact (none edited; the 94-file repoint is plan 14's job, using this plan's table).                                                                                                                                                                                                                                |

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-09, authoring session):** the authoring agent had no Vercel MCP tools
  available, so the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the `prod-ayokoding-www` branch.
  After merge, the workflow `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` (scheduled, or
  dispatched) moves `main` to that branch; the plan dispatches it and checks the live site with Playwright. No
  step needs billing, usage, firewall, domain, or project settings.
- **Phase 0 re-probe (three outcomes):** the executor re-checks Vercel MCP availability and records one of
  `present-and-used` (a Vercel tool is available and a step needs it; not expected, since this plan adds no
  `app` deploy surface), `present-unused` (a Vercel tool is available but no step needs it, so the plan uses
  none), or `absent` (no Vercel MCP tool is listed in the session). The expected record is `present-unused`
  or `absent`, matching [delivery.md](../delivery.md)'s Phase 0 step. No Vercel identifiers are recorded.

## Corpus Disposition

`archive-with-plan`. The `syllabus/` corpus (48 course briefs, the legacy-to-course mapping table, and a short
paths index) moves to `plans/done/` with this plan. The durable products are the course pages under
`apps/ayokoding-www/content/en/learn/courses/`, the toolchain catalog changes under
`apps/ayokoding-cli/toolchains/`, the step extensions under `apps/ayokoding-www/tests/unit/be-steps/`, and the
features under `specs/apps/ayokoding/www/behaviours/`; no checker, Nx target, build step, or shipped content
reads the syllabus files. The course makers read them during execution only, as a plan input. Plan 14 consumes
the archived mapping folder directly as its redirect-rule and `docs/`-repoint input (see
[007-mapping-format-and-plan-14-consumption.md](./007-mapping-format-and-plan-14-consumption.md)).

## Related

- [Plan overview](../README.md)
- [Business requirements](../brd.md)
- [Product requirements](../prd.md)
- [Syllabus corpus](../syllabus/README.md)
- [Delivery checklist](../delivery.md)
