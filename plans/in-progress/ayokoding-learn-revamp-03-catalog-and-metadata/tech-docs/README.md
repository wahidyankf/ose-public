# Technical Design — Catalog and Metadata

This directory is the plan's single technical form. Read the companions in order. Each one is
self-contained enough for a junior engineer to build its part.

| File                                                                                         | What it covers                                                                                                  |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [001-architecture-and-data-flow.md](./001-architecture-and-data-flow.md)                     | Where frontmatter, the content index, tRPC, and the three screens sit; data flow before and after               |
| [002-metadata-schema-and-migration.md](./002-metadata-schema-and-migration.md)               | Data model (ERD), field guide, schemas, expand → migrate → verify → contract, rollback, reconciliation          |
| [003-category-taxonomy-and-course-mapping.md](./003-category-taxonomy-and-course-mapping.md) | The 14 categories, the format rule, the description rubric, and the 181-row mapping table                       |
| [004-estimated-hours-and-start-target.md](./004-estimated-hours-and-start-target.md)         | The `estimatedHours` formula, the corpus scan, the drift test, and the Start-target rule                        |
| [005-ui-components-and-copy.md](./005-ui-components-and-copy.md)                             | Component contracts (catalog, card, header, sidebar groups), plan 04 slots, translation keys                    |
| [006-testing-strategy.md](./006-testing-strategy.md)                                         | Test layers, the Gherkin-to-test binding map, fixtures, and existing tests that change                          |
| [007-decision-records.md](./007-decision-records.md)                                         | Material decisions with alternatives, prior art, trade-offs, consequences, and revisit triggers                 |
| [008-file-impact.md](./008-file-impact.md)                                                   | Root-relative file-impact tree with `[E]`/`[N]`/`[D]`/`[G]` markers                                             |
| [009-rule-and-docs-impact.md](./009-rule-and-docs-impact.md)                                 | Rule changes, enforcement dispositions, generated harness routes, docs and specs propagation, C4 reconciliation |

## Summary

1. **Schema.** `frontmatterSchema` gains three loose optional fields (`category`, `format`,
   `estimatedHours`); `description` already exists. A strict `courseMetadataSchema` in
   `src/features/content/core/course-metadata.ts` checks them in tests. Runtime parsing stays
   tolerant, so a typo never hides a page.
2. **Backfill.** All 181 course `_index.md` files get `category` and `description`. The 119 courses
   that are not outlines also get `format` and `estimatedHours`. Values come from
   [003](./003-category-taxonomy-and-course-mapping.md) and the drift test's printed table.
3. **Estimate.** `estimateCourseHours` (pure, in the core) turns word and code-line counts into whole
   hours. `scanCourseEffort` (shell, reads files) collects the counts. A unit test over the real
   corpus fails on any drift and prints the expected values.
4. **Catalog.** `page.tsx` dispatches the slug `learn/courses` to a new `CourseCatalog` server
   component built from `buildCourseCatalog` (pure). The index generator writes frontmatter only for
   that section.
5. **Sidebar.** `SidebarTree` renders the children of `learn/courses` through a new
   `CourseCategoryGroups` disclosure list. `content.getTree` carries an optional `category` per node.
6. **Header.** Course root pages render `CourseHeader` (description, meta row, Start button,
   prerequisites, paths) above a "Course contents" heading and the generated list. Plan 04 fills its
   `primaryAction` and `progress` slots later.

## File-Impact Analysis

The annotated, root-relative file tree is owned by
[008-file-impact.md](./008-file-impact.md#file-impact-analysis).

## Dependencies

- **No new npm dependency.** Zod, gray-matter, React, Next.js, `@open-sharia-enterprise/web-ui`, and
  `lucide-react` are already used by `apps/ayokoding-www`.
- **Plan 01** (merged first): stripped course titles; `content/en/learn/courses/_index.md` weight 102. This plan keeps that weight.
- **Plan 02** (merged first, decision [D1](./007-decision-records.md#d1--order-against-plan-02)):
  `frontmatterSchema.status` (`z.enum(["outline"]).optional()`), `ContentMeta.status`,
  `course-paths/shell/outline-badge.tsx` (`OutlineBadge`), translation key `pathsOutlineBadge`, and
  manifests whose derived `courseOrder` still feeds `derivePathBadges`.

## Surfaces and Quality Gates

- **UI-bearing:** yes (three screens). The delivery runs the
  [UI Web Quality Gate](../../../../repo-governance/workflows/quality/ui-web-quality-gate.md) and the
  [UX review triad](../../../../repo-governance/workflows/quality/ux-review-fix-planning.md) (rule 15),
  across `/en/` and `/id/`.
- **API-bearing:** yes, narrowly. `content.getTree` adds an optional `category` field to tree nodes.
  The delivery runs the
  [API HTTP Quality Gate](../../../../repo-governance/workflows/quality/api-http-quality-gate.md) on
  `content.getTree` and `content.getBySlug`.
- **Rule-bearing:** yes. See [009](./009-rule-and-docs-impact.md).
- Every quality gate runs at most 2 cycles.

## Learning-Content Exemption

This plan edits course **frontmatter metadata only** (`category`, `description`, `format`,
`estimatedHours`) in the 181 course `_index.md` files, plus the frontmatter `description` of
`content/en/learn/courses/_index.md` and its generated body. It does not change any course body,
example, exercise, or code file. Therefore the tutorial quality gates (by-example, primer,
annotated-concept, in-the-field) and the Content Quality Gate over course bodies do not apply to
this plan. The descriptions are user-facing copy: they are checked by the schema test (length,
one sentence, no `·`) and reviewed in the PR. Plans 06–13 own every course-body change and run those
gates.

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-09, authoring session):** the authoring agent had no Vercel MCP
  tools available, so the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the
  `prod-ayokoding-www` branch (the `vercel.json` `ignoreCommand`). After merge, the existing GitHub
  workflow `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` moves `main` to that branch
  (scheduled, or dispatched). The plan dispatches it and checks the live site with Playwright, which
  needs no Vercel access. No step needs billing, usage, firewall, domain, or project settings.
- **Phase 0 re-probe:** the executor re-checks Vercel MCP availability and records the result. If the
  server is present, the plan still uses no Vercel tool. No Vercel identifiers are recorded.

## Feature Flag

None. The catalog, sidebar groups, header, and metadata ship together in one PR, and no step leaves
incomplete behaviour reachable on `main`: the Gherkin and failing tests land in the same PR as the
code that makes them pass. Rollback is a revert of the PR (see
[002](./002-metadata-schema-and-migration.md#rollback)).

## Out-of-Scope Follow-Up

An `ayokoding-cli courses estimate` subcommand that prints `estimateCourseHours` for maintainers
could follow. It is owned by plan 05 (`code-harness`), which revives `apps/ayokoding-cli`. This plan
does not create it and does not depend on it.
