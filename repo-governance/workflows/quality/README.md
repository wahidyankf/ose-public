---
description: >-
  Indexes the bounded, advisory quality gates with the one propagation that writes for each family, and the single-pass
  reviews that judge finished work.
when_to_use: >-
  Use when a review is due and you need the procedure that governs it, or when a quality gate or its propagation
  applies.
---

# Quality Workflows

A review compares what exists against what was specified. These workflows make that comparison the same way each time,
so its result is a verdict rather than an impression.

Every `<family>-quality-gate` follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md),
and its `<family>-propagation` sits beside it as the family's sole writer, per
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md). Product rules for content, tutorial,
and PDF conversion gates live in the
[gate adapters](../../development/quality/gate-adapters/README.md), and this repository's adoption record is the
[Quality Gate Adapter](../../development/workflow/quality-gate-adapter.md).

## Directory Map

- [API HTTP Propagation](api-http-propagation.md) — repairs a running HTTP API's frozen ledger rows.
- [API HTTP Quality Gate](api-http-quality-gate.md) — judges a running HTTP API against its contract.
- [CI Propagation](ci-propagation.md) — repairs pipeline and hook wiring rows.
- [CI Quality Gate](ci-quality-gate.md) — judges whether pipelines and hooks run the right checks.
- [Content Propagation](content-propagation.md) — repairs published content rows.
- [Content Quality Gate](content-quality-gate.md) — judges published content and its adapter's product rules.
- [Docs Propagation](docs-propagation.md) — carries a change into every document it affects.
- [Docs Quality Gate](docs-quality-gate.md) — judges documents for currency, reachability, and readability.
- [Docs Software Engineering Separation Propagation](docs-software-engineering-separation-propagation.md) — repairs
  style-guide separation rows.
- [Docs Software Engineering Separation Quality Gate](docs-software-engineering-separation-quality-gate.md) — judges
  whether style guides and AyoKoding teaching content stay separate.
- [Gherkin Implementation Review](gherkin-implementation-review.md) — a single-pass semantic review of scenario
  adapters.
- [Harness Propagation](harness-propagation.md) — repairs harness binding rows at their canonical source.
- [Harness Quality Gate](harness-quality-gate.md) — judges harness bindings against upstream conventions.
- [PDF to Markdown Propagation](pdf-to-md-propagation.md) — repairs conversion rows against the PDF.
- [PDF to Markdown Quality Gate](pdf-to-md-quality-gate.md) — judges a Markdown conversion's fidelity to its PDF.
- [Plan Propagation](plan-propagation.md) — repairs a plan's frozen ledger rows.
- [Plan Quality Gate](plan-quality-gate.md) — judges whether a plan is complete, clear, and executable.
- [PR Leak Review](pr-leak-review.md) — the mandatory leak review before each push and merge.
- [PR Leak Review Modules](pr-leak-review/README.md) — its ordered modules.
- [PR Review](pr-review.md) — one explicitly requested semantic review pass.
- [PR Review Modules](pr-review/README.md) — its ordered modules.
- [PR Review Propagation](pr-review-propagation.md) — answers a review ledger's rows on the change's own branch.
- [PR Review Quality Gate](pr-review-quality-gate.md) — judges a pull request in bounded review passes.
- [PR Review Quality Gate Modules](pr-review-quality-gate/README.md) — its ordered modules.
- [Rules Propagation](rules-propagation.md) — carries a decided rule into every surface it binds.
- [Rules Propagation Modules](rules-propagation/README.md) — its ordered modules.
- [Rules Quality Gate](rules-quality-gate.md) — judges the effective rule state.
- [Specs Propagation](specs-propagation.md) — repairs specification rows.
- [Specs Quality Gate](specs-quality-gate.md) — judges specification coherence with the implementation.
- [Tutorial Annotated Concept Propagation](tutorial-annotated-concept-propagation.md) — repairs annotated-concept rows.
- [Tutorial Annotated Concept Quality Gate](tutorial-annotated-concept-quality-gate.md) — judges annotated-concept
  tutorials.
- [Tutorial By Example Propagation](tutorial-by-example-propagation.md) — repairs by-example rows.
- [Tutorial By Example Quality Gate](tutorial-by-example-quality-gate.md) — judges by-example tutorials.
- [Tutorial In the Field Propagation](tutorial-in-the-field-propagation.md) — repairs in-the-field rows.
- [Tutorial In the Field Quality Gate](tutorial-in-the-field-quality-gate.md) — judges in-the-field guides.
- [Tutorial Primer Propagation](tutorial-primer-propagation.md) — repairs primer rows.
- [Tutorial Primer Quality Gate](tutorial-primer-quality-gate.md) — judges primers against their scope.
- [UI Web Propagation](ui-web-propagation.md) — repairs a running web UI's rows.
- [UI Web Quality Gate](ui-web-quality-gate.md) — judges a running web UI.
- [UX Review Fix Planning](ux-review-fix-planning.md) — runs the live-site testers and authors one fix plan.
- [UX Review Fix Planning Modules](ux-review-fix-planning/README.md) — its ordered modules.
