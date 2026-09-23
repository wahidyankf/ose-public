---
description: The principles and companion conventions the TDD requirement implements and respects.
when_to_use: Use when tracing why TDD is required here back to the principles and conventions it respects.
---

# Principles and Conventions Implemented

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**: Writing
  a failing test first forces you to state the desired behaviour explicitly before implementing it.
  Tests are a form of specification — they crystallize what "done" means before you start.
- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: Tests written
  after the fact often conform to the implementation rather than the requirement. Writing tests
  first ensures you verify the right behaviour, not just that the current code runs without crashing.
- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**:
  TDD produces a growing automated test suite that replaces manual re-verification on every change.
- **[Reproducibility First](../../../principles/software-engineering/reproducibility.md)**: A
  test-first suite provides deterministic, reproducible verification of behaviour for every future
  contributor and CI run.
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  Test scenarios make expected behaviour explicit and machine-checkable rather than understood only
  by the original author.

## Conventions Implemented/Respected

- **[Behaviour-Driven Development](../../behaviour-driven-development.md)**: TDD always starts with
  Unit proof and adds Integration/E2E proof where the changed behaviour owns those real
  boundaries. Each test is written at the boundary it actually exercises.
- **[Acceptance Criteria Convention](../../infra/acceptance-criteria.md)**: Gherkin acceptance
  criteria in plans are the natural starting material for the first failing tests in a feature.
  The chain is: Gherkin scenario → failing step implementation → passing implementation.
- **[Implementation Workflow Convention](../implementation.md)**: TDD is the mechanism that makes
  Stage 1 ("Make it work") verifiable. A failing test defines what "work" means; a passing test
  confirms it. Refactor only happens once tests are green, which maps directly to Stage 2 ("Make
  it right").
