---
title: "How to Fix Bugs with Regression Tests and Demand Systematic Live-Site Coverage"
description: Two companion practices every contributor must follow -- pin every bug fix with a reproducing test, and demand enumerate-not-sample coverage when testing live sites
category: how-to
tags:
  - bugs
  - regression
  - testing
  - live-testing
  - quality
created: 2026-06-22
---

# How to Fix Bugs with Regression Tests and Demand Systematic Live-Site Coverage

## When you find and fix a bug

**Rule**: Every fix lands with a test that would have failed before the fix and passes after it,
in the **same commit or PR**. No exceptions -- not for trivial fixes, not for cosmetic defects,
not for hotfixes.

Choose the test form that matches the defect:

- **Behavioural / functional bug** -- add a Gherkin scenario in `specs/**` plus the unit,
  integration, or E2E test that consumes it.
- **Visual / UI regression** -- add a DOM assertion, computed-style assertion, or Playwright
  snapshot assertion.
- **Content / copy / i18n bug** -- add a test asserting the corrected string or translation.
- **API regression** -- add an integration or E2E test asserting the correct response.

A fix without a pinning test is incomplete. The bug is free to return silently.

**Authoritative rule**:
[Regression Test Mandate](../../repo-governance/development/quality/regression-test-mandate.md)

## When testing a live site

Dimension-based or charter-driven testing samples; it reliably misses cross-surface
inconsistencies and invariant violations. Apply these six forcing-functions on every live-site
test run -- whether you are running one of the three live-site tester agents or doing manual
exploratory testing:

1. **Shared-control x surface matrix** -- exercise every shared control on every surface it
   appears on and assert consistent behaviour across all of them.
2. **Per-control URL round-trip** -- change every interactive control, verify the URL updates,
   reload, and verify the state restores.
3. **Declared-invariant conformance** -- extract invariants from `specs/**`, source comments,
   and `prd.md`; verify each holds for every applicable element, not just a sample.
4. **Raw/unstyled native-element audit** -- enumerate every interactive element and assert no
   raw native controls coexist with styled design-system components on the same surface.
5. **Usability probes** -- scan every label for jargon, probe hidden controls for
   discoverability, identify cross-view redundancy, and verify input units and currency
   symbols are consistent.
6. **Recurrence + diff memory + completeness critic** -- re-check prior defect classes, re-
   verify surfaces adjacent to recent changes, and end with "what did we NOT enumerate?"

**Authoritative practice**:
[Live-Tester Systematic Coverage](../../repo-governance/development/quality/live-tester-systematic-coverage.md)

## Related

- [Regression Test Mandate](../../repo-governance/development/quality/regression-test-mandate.md) --
  the full blocking rule with enforcement details and examples
- [Live-Tester Systematic Coverage](../../repo-governance/development/quality/live-tester-systematic-coverage.md) --
  the SSOT practice the three tester agents and the `ux-review-fix-planning` workflow implement
- [Feature Change Completeness Convention](../../repo-governance/development/quality/feature-change-completeness.md) --
  the feature-change companion to the regression test mandate
- [Behaviour-Driven Development](../../repo-governance/development/behaviour-driven-development.md) --
  which test level to use for each defect type
