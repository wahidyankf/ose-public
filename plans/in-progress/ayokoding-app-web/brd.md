# Business Requirements

## Problem and purpose

The maintainer wants AyoKoding's existing learning experience implemented in Go with
server-rendered HTML and htmx. The current Next.js application is the working product and remains
useful throughout the rewrite. The business goal is a locally usable alternative implementation
without losing lessons, tools, learning progress behavior, or the ability to continue unrelated
course work.

This is a requested technology change. No performance improvement, operating-cost reduction, or
delivery-speed improvement has been measured, and this plan makes none of those promises.

## People affected

- **Learners** need familiar English and Indonesian navigation, readable lessons, working tools,
  accessible controls, and private browser-stored progress.
- **The maintainer** needs a reproducible local development loop and evidence that the replacement
  behaves like the current application.
- **Content authors** need existing Markdown, manifest, and example-harness workflows to keep
  working while both applications consume the same source material.

## Required business outcomes

| Requirement                                      | Observable success                                                                                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BR-01 — Preserve the learning product            | Every current scenario is mapped to retained behavior, a Go-specific replacement, or an evidenced out-of-scope implementation assertion; no user-facing feature silently disappears. |
| BR-02 — Keep current work moving                 | Existing AyoKoding plans retain their sequencing and ownership; the rewrite starts and finishes without waiting for them to finish.                                                  |
| BR-03 — Keep the current site usable             | Both applications run simultaneously, and shared-data extraction leaves existing tool results and reference documentation unchanged.                                                 |
| BR-04 — Make correctness reviewable              | Gherkin, Go unit tests, Integration tests, Playwright E2E, and manual browser/wire evidence agree on the delivered behavior.                                                         |
| BR-05 — Preserve attribution and learner privacy | Learner progress never becomes a server-side record; no vendored third-party engine is copied without its license/provenance chain.                                                  |

The evidence is pass/fail behavior and traceability. Route counts, content counts, synthetic speed
targets, and planned code-size estimates are not business success metrics.

## Business non-goals

- Launching, deploying, hosting, changing domains, or choosing production infrastructure.
- Retiring the existing website or moving its content corpus.
- Redesigning the website, rewriting courses, refreshing financial/tool datasets, or adding new tools.
- Adding accounts, tracking, synchronization, learner data collection, or monetization.
- Making other AyoKoding plans depend on the new app or coordinating simultaneous merges.

## Risks and responses

| Risk                                         | Response                                                                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A broad rewrite misses less visible behavior | Inventory the recursive current Gherkin corpus; keep an exact scenario disposition ledger and representative rendering fixtures.                         |
| Shared content changes while work proceeds   | Reconcile already-merged changes at delivery boundaries; use isolated synthetic fixtures for stable tests and a separate current-corpus acceptance pass. |
| Two dataset copies drift                     | Extract one neutral JSON source, preserve old TypeScript exports, and run both runtimes against shared result vectors.                                   |
| Browser state leaks into server requests     | Keep progress computation and persistence in browser scripts; assert that network traffic contains no stored progress.                                   |
| Technology work expands into deployment      | Accept local development and local test evidence only; leave hosting and cutover to a separately authorized task.                                        |

The [product requirements](./prd.md) turn these outcomes into acceptance criteria; the
[technical design](./tech-docs/README.md) explains the chosen implementation and trade-offs.
