# AyoKoding Cost-of-Living Calculator — Test-Fixing Plan

## Context

A fresh three-tester re-validation (exploratory `EWT`, usability `UWT`, design `DWT`) was run
against the AyoKoding cost-of-living calculator at `/[locale]/tools/cost-of-living-calculator`.
This plan consolidates the **still-valid** findings into one execution-ready, TDD-shaped delivery
plan. Stale findings (those the re-validation marked resolved, or those resting on incorrect
assumptions) are explicitly excluded and called out in `tech-docs.md §Assumptions`.

The calculator lives at `apps/ayokoding-www/src/features/cost-of-living-calculator/` and follows
the repo's functional core / imperative shell layout (`core/` for pure logic, `shell/` for React).
It is bilingual (`en` primary, `id`) with translations in
`apps/ayokoding-www/src/features/i18n/core/translations.ts`. [Repo-grounded]

## Scope

**In scope** — fix the following still-valid findings (grouped into themed phases):

- **Correctness**: EWT-001 (min-role zero-target divider not rendered).
- **Breadcrumb design**: DWT-B-003 + DWT-B-004 (bespoke breadcrumb with literal `/` separators →
  consolidate onto the shared `Breadcrumb` primitive with `ChevronRight`), and UWT-013 (final
  crumb must equal the page H1 in both locales).
- **Touch targets & responsive**: UWT-016 / DWT-005 (geo-filter selects 29 px tall; need
  `min-h-[44px]`), UWT-008 (horizontal overflow at 320 px).
- **Tab a11y & descriptions**: UWT-011 (`#tab-desc-cost` missing), UWT-003 (tab descriptions are
  `sr-only`; make them visible), UWT-012 (verify/secure OOP `<abbr>`).
- **Currency & empty-states**: UWT-004 (Savings tab hardcodes "USD" in the gross label; surface a
  currency selector / active currency), UWT-006 (min-role tab shows full table with no guidance
  when the savings target is blank; add an empty-state).
- **Region / URL behaviour**: UWT-007 (verify intended region set / grouping), UWT-014 (region
  auto-change advisory), UWT-015 (city deep-link back-link behaviour), UWT-009 (tools-index link
  needs a description).
- **Spec coverage**: add/extend Gherkin scenarios in the calculator `.feature` (and a tools-index
  `.feature` if needed) to protect every fixed behaviour and the still-relevant proposals.

**Out of scope** — findings the re-validation marked resolved; any new calculator feature not
listed above; visual redesign beyond what the listed findings require; backend/API changes (the
calculator is client-only over an in-repo dataset).

## Approach Summary

Phase 0 establishes a clean baseline (via `repo-setup-manager`). Themed phases follow, each
expressed as Red→Green→Refactor TDD cycles touching real file paths with verbatim `nx` commands
and concrete acceptance criteria. Every behaviour change ships companion `specs/**` Gherkin in the
same phase (this repo's two-path rule). `ayokoding-www` is a `-www` site: **unit + e2e only, no
integration tier**; unit tests consume all Gherkin mocked. [Repo-grounded]

Each phase ends with a `### Phase N Gate` running
`nx run ayokoding-www:typecheck lint test:unit specs:coverage` (plus the e2e suite where a finding
demands runtime proof), followed by a Pause Safety note.

## Navigation

- [brd.md](./brd.md) — business rationale (why fix these findings now)
- [prd.md](./prd.md) — personas, user stories, Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — architecture, design decisions, **Assumptions** (stale-finding
  exclusions documented here)
- [delivery.md](./delivery.md) — phased TDD checklist + `## Worktree` section

## Quality Gates

- Local: `nx run ayokoding-www:typecheck`, `:lint`, `:test:unit`, `:specs:coverage`; e2e via
  `ayokoding-www-fe-e2e` for runtime-proof findings.
- CI: all GitHub Actions triggered by the push must pass before archival.

## Verification

The plan is done when every listed finding is fixed (or explicitly deferred with rationale), all
local + CI gates are green, manual Playwright verification across **both** locales (`en`, `id`) at
320/375/768/1280 px is captured with committed evidence, and the rule-15 three-tester retest is
clean or its findings are triaged.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
