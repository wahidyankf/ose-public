---
title: "Test Coverage Reference"
description: "Runtime code-coverage ownership and static Gherkin coverage targets"
category: reference
tags: [coverage, testing, quality, gherkin]
created: 2026-03-22
updated: 2026-09-05
---

# Test Coverage Reference

OSE separates runtime code coverage from static test-contract coverage.

## Runtime Code Coverage

`test:unit`, `test:integration`, and `test:e2e` execute tests. If a layer records line, branch, or
function coverage, its native runner produces and enforces that measurement during the same runtime
target. A project documents its native tool, threshold, exclusions, and output artifact in its
README.

Every behaviour owner must collect and enforce at least 99% line coverage in `test:unit`. Dedicated
E2E projects do not own Unit, but never waive the source owner's threshold. A boundary-based
exclusion is valid only when another numeric runtime slice still measures the excluded retained
production code; exclusions cannot manufacture the percentage by leaving code unmeasured.

Do not create a second test invocation named `test:coverage`. Do not let a later static target rely
on a report from an earlier invocation: an Nx cache hit, changed execution order, or clean checkout
would make that dependency ambiguous.

## Static Test Coverage

| Target                      | Static proof                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `test:coverage:unit`        | Every active expanded scenario has exactly one Unit implementation                            |
| `test:coverage:integration` | Every applicable scenario has exactly one Integration implementation or valid exemption       |
| `test:coverage:e2e`         | Every applicable scenario has exactly one E2E implementation or valid exemption               |
| `test:coverage:behaviour`   | Exact recursive corpus, valid scenarios, bindings, adapter completeness, and exemption syntax |
| `test:coverage`             | Aggregate of every applicable static validator                                                |

These targets inspect source, tests, Gherkin, and configuration without executing tests directly or
transitively. Every applicable validator is mandatory in `test:quick`. Static success proves
coverage shape, not semantic implementation; material Gherkin or adapter changes also require the
[Gherkin implementation review](../../repo-governance/workflows/quality/gherkin-implementation-review.md).

## Failure Interpretation

- Missing Unit proof is always a failure; no Unit exemption exists.
- Missing applicable Integration/E2E proof requires implementation or a valid boundary-mismatch
  exemption.
- A runtime target failure is a test failure, not a static coverage failure.
- A stale report, hardcoded count, no-op target, or excluded production path is not proof.

See the [BDD standard](../../repo-governance/development/behaviour-driven-development.md) and
[Nx target standard](../../repo-governance/development/infra/nx-targets.md).
