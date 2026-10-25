# AyoKoding Web — Phoenix LiveView Rewrite

> **Status:** Backlog. This change authors a plan and specifications; it does not implement the rewrite.

Depends-on: []

Rebuild the existing AyoKoding learning website in Elixir and Phoenix LiveView at
`apps/ayokoding-web`. Keep `apps/ayokoding-www` working while the new app reaches full local
feature, URL, locale, accessibility, and appearance parity. The Phoenix development server uses
port **3102**, its Playwright server uses **3191**, and the existing site keeps **3101**.

## Scope and approach

- Preserve both supported locales, `en` and `id`, including their existing differences in content.
- Reproduce content rendering, navigation, search, course catalogs and paths, browser-only learning
  progress, AI benchmark, cost-of-living calculator, and discovery documents.
- Use native Elixir contexts and LiveView interfaces, an Elixir Markdown pipeline, and small browser
  hooks. The new app does not reproduce the old app's internal tRPC transport.
- Read the existing Markdown, manifests, and assets in place. Share tool datasets through neutral
  JSON without changing their values, source dates, or provenance.
- Import BeaverNest's `ex-bdd` into `libs/ex-bdd` during execution, preserving the full ownership and
  licensing chain. Prove behavior through Unit, Integration, and Playwright E2E tests and Gherkin BDD.
- Complete this plan independently of the ongoing AyoKoding content plans. No course plan must finish
  first, and this plan never takes ownership of their content work.

Deployment, production cutover, hosting, infrastructure, accounts, server-side learner records,
database adoption, and removal of the Next.js app are outside scope.

## Read the plan

- [Business requirements](./brd.md) — why the rewrite exists and what success means.
- [Product requirements](./prd.md) — user journeys, parity boundaries, and acceptance criteria.
- [Technical design](./tech-docs/README.md) — baseline, architecture, BDD, interfaces, decisions,
  file impact, and recovery.
- [Delivery checklist](./delivery.md) — dependency graph, ordered TDD actions, local commands,
  evidence, and completion gates.
- [Learnings](./learnings.md) — transient execution observations and their eventual disposition.

## Specifications

- [Phoenix website corpus](../../../specs/apps/ayokoding/web/README.md) — planned observable behavior;
  its architecture document explicitly distinguishes planned work from an existing implementation.
- [ExBdd corpus](../../../specs/libs/ex-bdd/README.md) — the planned imported library's contracts.
- [Existing website corpus](../../../specs/apps/ayokoding/www/README.md) — the parity source; its
  framework-specific assertions receive explicit dispositions rather than blind copying.

## Parallel execution and related plans

This is an independent node in the [plan-order DAG](../../README.md#plan-order). Shared-source
coordination is a reconciliation obligation, not a dependency or an approval handoff. The executor
re-reads only changes already merged into `main` before each delivery boundary and updates the new
app to the resulting current corpus. It does not read another worktree's uncommitted output.

| Existing plans                                                                                                                                                                                                                                                                                                                                                                                                                          | Shared surface                                                                             | Coordination                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [06 accounting](../ayokoding-learn-revamp-06-accounting-courses/README.md), [07 ERP](../ayokoding-learn-revamp-07-erp-courses/README.md), [08 capstones](../ayokoding-learn-revamp-08-capstone-courses/README.md)                                                                                                                                                                                                                       | Course metadata, phase manifests, outline state, path composition                          | Accept the schema and content present on the recorded merged revision; refresh fixtures when those changes land.                          |
| [09 filler](../ayokoding-learn-revamp-09-filler-rewrites/README.md), [10 migration](../../in-progress/ayokoding-learn-revamp-10-legacy-unique-migration/README.md), [11 language audit](../ayokoding-learn-revamp-11-audit-languages-and-tooling/README.md), [12 systems audit](../ayokoding-learn-revamp-12-audit-cs-systems-and-data/README.md), [13 product audit](../ayokoding-learn-revamp-13-audit-product-security-ai/README.md) | Course bodies, prerequisites, catalog metadata, example-harness contracts                  | Read the shared corpus; keep content creation, example execution, and content-quality ownership with those plans and `ayokoding-cli`.     |
| [14 legacy removal](../ayokoding-learn-revamp-14-legacy-removal/README.md)                                                                                                                                                                                                                                                                                                                                                              | Legacy content, redirects, Learn buckets, search, sitemap, and surviving renderer fixtures | The rewrite executor reconciles its merged state whenever it lands. Neither plan waits for the other or coordinates a simultaneous merge. |

The shared JSON extraction touches the tools' data modules, not the course/manifests owned by those
plans. The technical design lists the bounded overlap and the required current-main reconciliation.

## Decisions and completion

The user resolved the material branches before authoring: full parity, coexistence, in-place content,
native LiveView interfaces, Elixir rendering, and shared JSON datasets. Later requirements fixed
parallel execution, the copied BDD library with provenance, all three test layers, populated specs,
reciprocal plan awareness, and separate ports. No material decision remains open.

The authoring package is complete when its documents and specs are coherent and validated. Future
implementation is complete only after the [delivery gates](./delivery.md) prove both apps can run
together, every parity scenario has a disposition and executable proof, all required tests pass,
and current merged source changes have been reconciled. Unfinished related plans do not block it.
