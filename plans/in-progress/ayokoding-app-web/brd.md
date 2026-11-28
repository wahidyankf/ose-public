# Business Requirements

## Problem and purpose

The maintainer wants AyoKoding's existing learning experience implemented in Go with
server-rendered HTML and htmx. The current Next.js application is the working product and remains
useful throughout the rewrite. The original goal was a locally usable alternative implementation
without losing lessons, tools, learning progress behavior, or the ability to continue unrelated
course work.

**Amended 2026-11-28.** This plan sets the bar the Go app must meet: full parity with the old site on the
real content corpus, including its visual design, with no indexed or bookmarked URL lost. Deployment, DNS
cutover, hosting and retiring the old app are outside this plan's scope.

This is a requested technology change. No performance improvement, operating-cost reduction, or
delivery-speed improvement has been measured, and this plan makes none of those promises.

## People affected

- **Learners** need familiar English and Indonesian navigation, readable lessons, working tools,
  accessible controls, and private browser-stored progress, and every link they saved or found in a
  search engine must keep working in the new app.
- **The maintainer** needs a reproducible local development loop and evidence that the replacement
  behaves like the current application.
- **Content authors** need existing Markdown, manifest, and example-harness workflows to keep
  working while both applications consume the same source material.

## Required business outcomes

| Requirement                                      | Observable success                                                                                                                                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BR-01 — Preserve the learning product            | Every current scenario is mapped to retained behavior, a Go-specific replacement, or an evidenced out-of-scope implementation assertion; no user-facing feature silently disappears.                                                 |
| BR-02 — Keep current work moving                 | Existing AyoKoding plans retain their sequencing and ownership; the rewrite starts and finishes without waiting for them to finish.                                                                                                  |
| BR-03 — Keep the current site usable             | Both applications run simultaneously, and shared-data extraction leaves existing tool results and reference documentation unchanged.                                                                                                 |
| BR-04 — Make correctness reviewable              | Gherkin, Go unit tests, Integration tests, Playwright E2E, and manual browser/wire evidence agree on the delivered behavior.                                                                                                         |
| BR-05 — Preserve attribution and learner privacy | Learner progress never becomes a server-side record; no vendored third-party engine is copied without its license/provenance chain.                                                                                                  |
| BR-06 — Serve the real site                      | The default start serves the full content corpus, English and Indonesian, not a sample; a fixture is served only when a test asks for it.                                                                                            |
| BR-07 — Lose no URL                              | Every URL in the old sitemap, every redirect source, and every route the old app serves answers 200 at the same path or through a permanent 308 on the new app; none answers 404.                                                    |
| BR-08 — Look like the same site                  | Each page class matches the old site's visual design in both locales, at three breakpoints and both themes, within a tolerance measured from the old site itself, or the owner accepts the recorded difference.                      |
| BR-09 — Be ready to run in production            | Discovery documents use a configurable origin and cover every route, responses carry a defined cache policy, and the HTTP suite can run read-only against a configurable `BASE_URL`; the browser suite always starts its own server. |

The evidence is pass/fail behavior and traceability. Route counts, content counts, synthetic speed
targets, and planned code-size estimates are not business success metrics.

## Business non-goals

- Launching, deploying, hosting, changing domains, or choosing production infrastructure.
- Retiring the existing website or moving its content corpus. This plan creates the replacement suites
  under their final names and leaves every old `ayokoding-www-*` file byte-identical.
- Redesigning the website, rewriting courses, refreshing financial/tool datasets, or adding new tools.
  Visual parity reproduces the old design; it never invents a new one.
- Adding accounts, tracking, synchronization, learner data collection, or monetization.
- Making other AyoKoding plans depend on the new app or coordinating simultaneous merges.

## Risks and responses

| Risk                                         | Response                                                                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A broad rewrite misses less visible behavior | Inventory the recursive current Gherkin corpus; keep an exact scenario disposition ledger and representative rendering fixtures.                         |
| Shared content changes while work proceeds   | Reconcile already-merged changes at delivery boundaries; use isolated synthetic fixtures for stable tests and a separate current-corpus acceptance pass. |
| Two dataset copies drift                     | Extract one neutral JSON source, preserve old TypeScript exports, and run both runtimes against shared result vectors.                                   |
| Browser state leaks into server requests     | Keep progress computation and persistence in browser scripts; assert that network traffic contains no stored progress.                                   |
| Technology work expands into deployment      | Accept local development and local test evidence only.                                                                                                   |
| An old URL is not served by the new app      | Generate an inventory from the old app, crawl it against the new app on every suite run, and rerun it against a local `BASE_URL`.                        |
| The new site looks different                 | Compare both sites side by side from the same corpus per page class; fix every difference above the measured noise or record the owner's acceptance.     |
| Splitting the e2e rename breaks the old site | Create the new homes under their final names and leave the old ones byte-identical.                                                                      |

The [product requirements](./prd.md) turn these outcomes into acceptance criteria; the
[technical design](./tech-docs/README.md) explains the chosen implementation and trade-offs.
