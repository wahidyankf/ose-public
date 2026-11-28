# AyoKoding Web — Go + htmx Rewrite

> **Status:** In Progress. Phases 0 to 2 are merged: baseline, harness, and shared data in
> [#763](https://github.com/wahidyankf/ose-public/pull/763), and the complete local app, the tools
> codec migration, and the first manual-findings repair in
> [#766](https://github.com/wahidyankf/ose-public/pull/766). The repository owner amended the plan on
> 2026-11-28: the new app must reach full content and design parity with `apps/ayokoding-www`, and every
> old sitemap URL must answer 200 or 308, so Phases 3 to 7 are new parity work and the earlier hardening and knowledge-capture
> phases are now Phases 8 and 9 and keep the work already done. Nothing in Phases 3 to 7 has started.

Depends-on: []

Rebuild the existing AyoKoding learning website in Go with server-rendered HTML and htmx at
`apps/ayokoding-web`. Keep `apps/ayokoding-www` working while the new app reaches full feature, URL,
locale, accessibility, and visual-design parity on the real content corpus. The Go development
server uses port **3102**, its Playwright server uses **3191**, and the existing site keeps **3101**.

## Scope and approach

- Preserve both supported locales, `en` and `id`, including their existing differences in content.
- Reproduce content rendering, navigation, search, course catalogs and paths, browser-only learning
  progress, AI benchmark, cost-of-living calculator, and discovery documents.
- Use Go's standard library (`net/http`, `html/template`) for pages and htmx for interactive
  partial updates, plus small vanilla browser scripts. The new app does not reproduce the old app's
  internal tRPC transport.
- Read the existing Markdown, manifests, and assets in place. Share tool datasets through neutral
  JSON without changing their values, source dates, or provenance.
- Prove behavior through Go unit tests, godog Gherkin bindings (reusing the `ayokoding-cli`
  pattern), Integration tests with `httptest`, and Playwright E2E tests. No vendored BDD engine
  is copied into `libs/`; godog is a regular Go module dependency.
- Serve the **real corpus** by default; the small fixture corpus is a test-only switch.
- Serve every URL the old site serves, at the same path or through a permanent 308, and prove it with
  a parity crawler.
- Match the old site's visual design page by page, proved by a side-by-side harness.
- Rebuild the end-to-end suites as `ayokoding-web-be-e2e` (HTTP boundary, read-only against a configurable `BASE_URL`) and `ayokoding-web-fe-e2e`
  (browser, real corpus too, always starting its own server).
- Complete this plan after the Podman migration. It consumes the Learn Revamp plans' merged content
  read-only, only after its declared predecessor work completes, and never takes ownership of their
  course content.

Deployment, DNS cutover, hosting and retiring the old app are outside this plan's scope. Infrastructure,
accounts, server-side learner records, and database adoption are also outside this plan's scope.

## Amendment 2026-11-28: parity first

The repository owner authorized amending this plan (decision recorded 2026-11-28, "Amend
ayokoding-app-web") so the parity work lives here and the plan moves to `plans/done/` only when parity
is proven. Three decisions bind it:

1. **Parity bar.** Before this plan completes, the new app has full parity
   with `apps/ayokoding-www`, including page-by-page visual design. The design parity that the earlier hardening
   phase deferred (item D1) is now in scope and required.
2. **URL compatibility.** Every URL in the old sitemap and every route the old app serves answers 200
   at the same path, or through a permanent 308 to its new path, on `apps/ayokoding-web`. None may
   answer 404. A parity crawler enforces it.
3. **E2E suites.** `ayokoding-www-be-e2e` becomes `ayokoding-web-be-e2e`, rebuilt as HTTP-boundary
   tests, read-only against a configurable `BASE_URL`; `ayokoding-www-fe-e2e` becomes `ayokoding-web-fe-e2e`,
   absorbing the existing `ayokoding-web-e2e` and running against the real corpus. Next- and tRPC-only
   scenarios are dropped with a recorded mapping, and the suites follow the no-retry rule.

The audit that found the gaps, and the design that closes them, are in
[006](./tech-docs/006-parity-program-design.md). The delivery units, in order, are:

| Phase | Unit           | Outcome                                                                                       |
| ----- | -------------- | --------------------------------------------------------------------------------------------- |
| 3     | `P3-E2E`       | The two e2e homes exist under their final names; retries and server reuse are gone            |
| 3     | `P3-Corpus`    | The real corpus is the default; the fixture is an explicit test switch; bad corpus fails fast |
| 3     | `P3-Inventory` | The old site's URL inventory is generated, committed, and reported against the new app        |
| 4     | `P4-Tree`      | Every authored page, section, nested lesson, and Indonesian tree is served                    |
| 4     | `P4-Redirects` | The redirect table is the real one, drift-checked, with the three temporary rules permanent   |
| 4     | `P4-Search`    | Search is built from the content tree                                                         |
| 5     | `P5-Surfaces`  | Landing, browse, and tools index pages are real                                               |
| 5     | `P5-Discovery` | The origin is configurable; sitemap, feed, and robots cover every route                       |
| 5     | `P5-Cache`     | Production caching is defined and tested                                                      |
| 6     | `P6-Harness`   | The design-parity harness, page-class inventory, and measured tolerance                       |
| 6     | `P6-Shell`     | Shell, tokens, typography, and article styling match                                          |
| 6     | `P6-Content`   | Lesson, section, and plain-page family, sidebar, TOC, and search dialog match                 |
| 6     | `P6-Learn`     | Learn home, catalog, course, and path pages match                                             |
| 6     | `P6-Pages`     | Tools, landing, browse, and 404 pages match                                                   |
| 7     | `P7-Crawl`     | The parity crawler gates every inventory URL, locally and against `BASE_URL`                  |
| 7     | `P7-FE`        | The browser suite runs the real corpus; old scenarios are mapped or dropped with a reason     |
| 8     | `P8-Hardening` | Final evidence, three testers, local gates, and archival preparation                          |

The e2e homes are created under their final names, and every `ayokoding-www-*` file, including the old
e2e homes, stays byte-identical. Archival to `plans/done/` is this plan's exit condition.

**Stale draft pull request.** The draft pull request
[#741](https://github.com/wahidyankf/ose-public/pull/741) ("WIP: preserve ayokoding baseline repairs
and paused execution", branch `ayokoding-app-web-base`) belongs to the Phoenix-era plan and must not
merge. The operator closes it; Phase 8 carries the `[HUMAN]` step.

## Read the plan

- [Business requirements](./brd.md) — why the rewrite exists and what success means.
- [Product requirements](./prd.md) — user journeys, parity boundaries, and acceptance criteria.
- [Technical design](./tech-docs/README.md) — baseline, architecture, BDD, interfaces, decisions,
  file impact, and recovery.
- [Delivery checklist](./delivery.md) — dependency graph, ordered TDD actions, local commands,
  evidence, and completion gates.
- [Learnings](./learnings.md) — transient execution observations and their eventual disposition.
- Amendment companions: [parity design](./tech-docs/006-parity-program-design.md),
  [e2e suites](./tech-docs/007-e2e-suites.md), and the
  [BDD delta map](./tech-docs/008-bdd-delta-map.md).

## Specifications

- [Go website corpus](../../../specs/apps/ayokoding/web/README.md) — observable behavior of the
  Go app, bound at Unit, Integration, and E2E level; its architecture document records the as-built
  boundary. The parity units add scenarios and tags to it, listed in the
  [BDD delta map](./tech-docs/008-bdd-delta-map.md).
- [Existing website corpus](../../../specs/apps/ayokoding/www/README.md) — the parity source; its
  framework-specific assertions receive explicit dispositions rather than blind copying.

## Execution order and related plans

The Podman migration, now archived, was this plan's predecessor. Respect the [plan-order DAG](../../README.md#plan-order). Execution has resumed
and Phases 0 to 2 are merged; before each delivery boundary the executor re-reads changes already
merged into `main` and updates the new app to the resulting current corpus. It does not read another
worktree's uncommitted output.

| Existing plans                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Shared surface                                                                             | Coordination                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| [06 accounting](../../backlog/ayokoding-learn-revamp-06-accounting-courses/README.md), [07 ERP](../../backlog/ayokoding-learn-revamp-07-erp-courses/README.md), [08 capstones](../../backlog/ayokoding-learn-revamp-08-capstone-courses/README.md)                                                                                                                                                                                                                   | Course metadata, phase manifests, outline state, path composition                          | Accept the schema and content present on the recorded merged revision; refresh fixtures when those changes land.                      |
| [09 filler](../../backlog/ayokoding-learn-revamp-09-filler-rewrites/README.md), [10 migration](../ayokoding-learn-revamp-10-legacy-unique-migration/README.md), [11 language audit](../../backlog/ayokoding-learn-revamp-11-audit-languages-and-tooling/README.md), [12 systems audit](../../backlog/ayokoding-learn-revamp-12-audit-cs-systems-and-data/README.md), [13 product audit](../../backlog/ayokoding-learn-revamp-13-audit-product-security-ai/README.md) | Course bodies, prerequisites, catalog metadata, example-harness contracts                  | Read the shared corpus; keep content creation, example execution, and content-quality ownership with those plans and `ayokoding-cli`. |
| [14 legacy removal](../../backlog/ayokoding-learn-revamp-14-legacy-removal/README.md)                                                                                                                                                                                                                                                                                                                                                                                | Legacy content, redirects, Learn buckets, search, sitemap, and surviving renderer fixtures | Plan 14 runs after this rewrite and its other declared predecessors; reconcile its merged state at the next delivery boundary.        |

The shared JSON extraction touches the tools' data modules, not the course/manifests owned by those
plans. The technical design lists the bounded overlap and the required current-main reconciliation.

## Decisions and completion

The user resolved the material branches before the first authoring: full parity, coexistence, in-place
content, native Go server rendering with htmx partials, a Go Markdown pipeline, and shared JSON
datasets. Later requirements fixed sequential execution, the godog BDD pattern reused from
`ayokoding-cli`, all three test layers, populated specs, reciprocal plan awareness, and separate ports.
The stdlib-versus-framework branch was resolved for the standard library (`net/http` plus
`html/template`). The 2026-11-28 amendment adds the three owner decisions above; their solution
records are D11 to D23 in [005](./tech-docs/005-decisions-and-file-impact.md#decision-record). Two
numeric policies are recorded as defaults the owner may override without reopening the design: the
design-parity tolerance equals the old site's own capture-to-capture noise (D18), and a redirect chain
may take at most five hops (D14).

The plan is complete only after the [delivery gates](./delivery.md) prove, at a recorded revision of
`main`: both apps run together; every parity scenario has a disposition and executable proof; the parity
crawl passes for every inventory URL against the real corpus; the design-parity report has no
unaccepted difference; the be home passes its fixture, unavailable-catalog, and real-corpus configs, and the fe home passes its real-corpus config; and current merged
source changes are reconciled. Unfinished related plans do not block it. Archival is this plan's exit condition.
