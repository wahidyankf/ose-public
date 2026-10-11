---
title: "Overview"
date: 2026-07-15T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough Python](../just-enough-python/learning/overview.md) -- every
  pytest example in this topic is Python, and this topic assumes you can already read and write
  functions, classes, and `list`/`dict` literals the way that primer taught them; [Just Enough TypeScript](../just-enough-typescript/learning/overview.md) -- the small number of TS/Vitest/
  fast-check cross-refs (Example 51 and the capstone's property-test step) assume that primer's
  syntax; [Backend Essentials](../backend-essentials/learning/overview.md) -- the Advanced tier's
  integration/e2e examples and the capstone build a small FastAPI service in the same style that
  topic teaches, as the app the integration tests target.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.x** with **pytest 9.1.1** +
  **Hypothesis 6.156.6** (+ **pytest-bdd 8.1.0**, **behave 1.3.3**, **coverage.py 7.15.1**, and
  **mutmut 3.6.0** for the Advanced/BDD tiers); **Node.js** with **Vitest** (this repo already
  depends on 4.1.0; the TS cross-refs below were verified against 4.1.10) and **fast-check**
  (verified against 4.9.0 -- not a dependency of this repo, so run `npm install fast-check`
  yourself to try the TS cross-refs locally); Docker (for the one testcontainers example); no
  other paid or proprietary tooling is required.
- **Assumed knowledge**: reading/writing basic Python and TypeScript; running a program and a test
  suite from the CLI. No prior testing background is required -- this topic is where that background
  starts.

## Why this exists -- the big idea

**The problem before the solution**: you cannot prove code works by re-reading it, and regressions
creep back in silently as the system grows -- a test is how you make "it works" durable and
repeatable. **The one idea worth keeping if you forget everything else**: a test encodes an
expectation as executable truth, structured as arrange-act-assert so intent is legible; the pyramid
(many fast unit tests, few slow end-to-end ones) trades breadth of confidence against speed of
feedback.

**Cross-cutting big idea, taught here and then reused for the rest of this topic**:
`correctness-vs-pragmatism` -- coverage is a proxy for correctness, not proof of it (Example 55 makes
this concrete: a fully covered function still hides a bug that only a property test catches); the
pyramid-vs-trophy choice (co-10) and mutation testing (co-22) are both judgment calls about how much
verification a given risk actually earns, not a search for some theoretically complete guarantee.

This topic covers testing as a discipline across both stacks -- unit through integration, test
doubles, TDD, property-based testing, and BDD / executable specifications (Gherkin + pytest-bdd/
behave) folded in. Deep CI wiring is deferred to a later, dedicated Software Engineering Practices
topic; this topic's job is the everyday testing skill that topic's CI pipelines assume. This topic
also underpins the Regression Test Mandate this very repository enforces on every bug fix.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 86 runnable, heavily annotated pytest examples (with TS/
  Vitest/fast-check cross-refs where noted) across Beginner (Examples 1-28: discovery, assertions,
  exceptions, fixtures, parametrization, markers, TDD basics), Intermediate (Examples 29-60: the full
  test-double taxonomy, patching, property-based testing with Hypothesis, coverage), Advanced
  (Examples 61-80: the pyramid vs. the testing trophy, integration/contract/e2e testing, mutation
  testing, reading reports, flaky-test diagnosis), and BDD & Executable Specifications (Examples
  81-86: Gherkin, `pytest-bdd`, `behave`, scenario outlines, and BDD-vs-TDD judgment) -- plus a
  capstone that assembles a TDD'd unit, a mocked dependency, a property test, and an integration test
  against a small FastAPI service into one coverage-reported suite.

Every example is a complete, self-contained runnable file colocated under `learning/code/`, actually
executed to capture its documented output -- there is no fabricated output anywhere in this topic.

---

Next: [Learning Overview](./learning/overview.md) →
