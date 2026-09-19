---
description: Mandates TDD (Red→Green→Refactor) as the required practice for all code changes across the repository
when_to_use: Use when writing any delivery checklist step that ships code, or when starting implementation of a code change.
---

# Test-Driven Development Convention

**Write the failing test first, then make it pass, then refactor** — Test-Driven Development
(TDD) is the required practice for all code changes in this repository. Red → Green → Refactor.

## Contents

- [Principles and Conventions Implemented](./test-driven-development/principles-and-conventions-implemented.md) — Why TDD is required here.
- [Scope: Which Tests TDD Covers](./test-driven-development/scope-which-tests-tdd-covers.md) — The ten verification levels TDD applies to.
- [Manual verification is part of TDD](./test-driven-development/manual-verification-is-part-of-tdd.md) — Treating a manual script like an automated test.
- [Picking the right level](./test-driven-development/picking-the-right-level.md) — Choosing the cheapest test that exercises the behaviour.
- [The Red-Green-Refactor Cycle](./test-driven-development/the-red-green-refactor-cycle.md) — The three-step loop every code change follows.
- [Flaky tests are defects](./test-driven-development/flaky-tests-are-defects.md) — Fixing every intermittent failure at its root cause.
- [Mini-TDD Passes](./test-driven-development/mini-tdd-passes.md) — Splitting a feature into small Red→Green→Refactor cycles.
- [Applying TDD to Plans](./test-driven-development/applying-tdd-to-plans.md) — Plan creation and plan execution requirements.
- [TDD Shape for Delivery Checklists](./test-driven-development/tdd-shape-for-delivery-checklists.md) — granular RED/GREEN/REFACTOR evidence inside cohesive outcome sections.
- [Gherkin-Tagged Delivery Steps](./test-driven-development/gherkin-tagged-delivery-steps.md) — Canonical scenario references, outcome-cohesion splitting, tag format, and exceptions.
- [Enforcement and Exceptions](./test-driven-development/enforcement-and-exceptions.md) — How TDD is enforced, and what it does not apply to.
- [Examples](./test-driven-development/examples.md) — TypeScript, Go, and Gherkin-to-test worked examples.

## Related Documentation

- [Implementation Workflow Convention](../workflow/implementation.md) - Three-stage workflow that TDD operates inside
- [Behaviour-Driven Development](../behaviour-driven-development.md) - Canonical scenario, adapter, boundary, exemption, and coverage contract
- [Acceptance Criteria Convention](../infra/acceptance-criteria.md) - Gherkin criteria as the source of first failing tests
- [plan-writing-gherkin-criteria skill](../../../.agents/skills/plan-writing-gherkin-criteria/SKILL.md) - Writing Gherkin scenarios that map to first failing tests
- [Gherkin Implementation Review](../../workflows/gherkin-implementation-review.md) - Semantic proof beyond static binding coverage
- [Code Quality Convention](../quality/code.md) - Pre-push hooks that run the test suite TDD produces
- [User-Facing Delivery Hardening Convention](../quality/user-facing-delivery-hardening.md) - Rules on UI-calculation test assertions

## Relationship to Implementation Workflow

TDD and the
[Implementation Workflow Convention](./implementation.md) are complementary, not competing:

| Implementation Stage    | TDD Role                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| Make it work (Stage 1)  | Red→Green: write failing test, then minimum passing code                 |
| Make it right (Stage 2) | Refactor with tests green; add tests for edge cases found during cleanup |
| Make it fast (Stage 3)  | Optimize with tests green; add performance assertions if needed          |

TDD does not add a fourth stage. It is the mechanism that makes each stage of the Implementation
Workflow verifiable and safe.
