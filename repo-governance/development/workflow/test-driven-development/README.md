---
description: "Mandates TDD (Red→Green→Refactor) as the required practice for all code changes across the repository"
when_to_use: "Read this index to find the right Test-Driven Development Convention child document."
---

# Test-Driven Development Convention

- [Principles and Conventions Implemented](./principles-and-conventions-implemented.md) — The principles and companion conventions the TDD requirement implements and respects. Use when tracing why TDD is required here back to the principles and conventions it respects.
- [Scope: Which Tests TDD Covers](./scope-which-tests-tdd-covers.md) — The ten verification levels TDD applies to, from unit tests through security testing, and the rule for each. Use when deciding which test level (unit, integration, E2E, contract, etc.) a behaviour's first failing test belongs at.
- [Manual verification is part of TDD](./manual-verification-is-part-of-tdd.md) — The five-step Red/Run/Green/Refactor/Promote cycle for treating a manual verification script like an automated test. Use when a behaviour cannot or should not be automated and needs a written, repeatable manual verification script instead.
- [Picking the right level](./picking-the-right-level.md) — How to pick the cheapest test level that meaningfully exercises a behaviour, and why coverage should not duplicate across levels. Use when unsure which test level a bug or behaviour belongs at.
- [The Red-Green-Refactor Cycle](./the-red-green-refactor-cycle.md) — The three-step Red/Green/Refactor loop every code change follows under TDD. Use as the canonical definition of the Red-Green-Refactor loop before implementing any code change.
- [Flaky tests are defects](./flaky-tests-are-defects.md) — Why an intermittent failure is a defect in the test or the code under test, the three-step root-cause response, the forbidden masking remedies, and when the flake is really a production race. Use the moment a test passes and fails on the same code.
- [Mini-TDD Passes](./mini-tdd-passes.md) — Splitting a feature or bug fix into multiple small Red-Green-Refactor cycles instead of one large test. Use when a delivery checklist item like "implement email validation" needs breaking into a sequence of small TDD cycles.
- [Applying TDD to Plans](./applying-tdd-to-plans.md) — How plan-maker must express code-shipping delivery items as TDD-shaped steps, and how plan-executor and swe-code-makers follow TDD during execution. Use when authoring a plan's delivery.md checklist, or when executing a delivery item that ships code.
- [TDD Shape for Delivery Checklists](./tdd-shape-for-delivery-checklists.md) — Separate, detailed RED/GREEN/REFACTOR checkboxes inside one code outcome section. Use when writing delivery steps that ship code.
- [Gherkin-Tagged Delivery Steps](./gherkin-tagged-delivery-steps.md) — How delivery packets reference canonical Gherkin without copying full scenarios. Use when a code packet binds companion Gherkin specs.
- [Enforcement and Exceptions](./enforcement-and-exceptions.md) — How the pre-push hook and plan-checker enforce TDD, and the five kinds of change TDD does not apply to. Use when checking whether TDD's enforcement mechanism would catch a given gap, or whether a change qualifies for an exception.
- [Examples](./examples.md) — A TypeScript (Vitest) and Go (Godog) Red-Green-Refactor worked example, and the Gherkin-to-test chain for BDD. Use as a concrete reference for what a Red-Green-Refactor cycle looks like in TypeScript, Go, or from a Gherkin scenario.
