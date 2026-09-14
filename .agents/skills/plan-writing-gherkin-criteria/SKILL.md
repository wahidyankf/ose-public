---
name: plan-writing-gherkin-criteria
description: >-
  Guide for writing Gherkin acceptance criteria in Given-When-Then syntax: scenario structure, background blocks,
  scenario outlines with examples tables, common authentication, CRUD, validation, and error patterns, and testable
  specifications.
when_to_use: >-
  Use when authoring or reviewing the acceptance criteria section of a plan's product requirements.
---

# Gherkin Acceptance Criteria Skill

## Purpose

This Skill provides comprehensive guidance for writing **Gherkin acceptance criteria** using Given-When-Then syntax to create clear, testable specifications for features and user stories.

**When to use this Skill:** writing acceptance criteria for user stories, defining testable
requirements in plans, specifying expected behaviour for features, and documenting edge cases and
error handling.

## Core Concepts

### What is Gherkin?

**Gherkin** is a structured language for writing acceptance criteria using Given-When-Then syntax. It enables:

- **Clear communication**: Non-technical stakeholders understand requirements
- **Testable specifications**: Scenarios map directly to automated tests
- **Complete coverage**: All scenarios and edge cases documented
- **Unambiguous expectations**: No room for interpretation

### Given-When-Then Structure

**Anatomy of a scenario**:

```gherkin
Scenario: [Brief description of scenario]
  Given [Initial context/preconditions]
  When [Action or event occurs]
  Then [Expected outcome/postconditions]
```

**Breakdown**:

- **Given**: Sets up the context (initial state, preconditions, setup)
- **When**: Describes the action or event (user action, system event, trigger)
- **Then**: Specifies expected outcome (assertions, verification, results)

## Journey Coherence

See [Journey Coherence](./reference/step-keyword-cardinality.md) for the full
rule text, conforming/non-conforming examples, and the canonical convention link.

## Basic Scenario Patterns

See [Basic Scenario Patterns](./reference/basic-scenario-patterns.md) for three worked patterns:
simple success path, error handling, and boundary conditions.

## Advanced Gherkin Features

See [Advanced Gherkin Features](./reference/advanced-gherkin-features.md) for Background blocks,
Scenario Outline with Examples tables, and Data Tables.

## Common Domain Patterns

See [Domain Patterns — Auth and CRUD](./reference/domain-patterns-auth-and-crud.md) and
[Domain Patterns — Form Validation and API Responses](./reference/domain-patterns-validation-and-api.md)
for worked full-feature examples across authentication, CRUD, form validation, and API responses.

## Best Practices

See [Writing Clear Scenarios](./reference/writing-clear-scenarios.md) and
[Scenario Independence, UI Coupling, and Style](./reference/independence-coupling-and-style.md)
for the DO/DON'T rules, scenario independence, avoiding UI coupling, and declarative vs
imperative style — each with good/bad examples.

## Common Mistakes

See [Common Mistakes](./reference/common-mistakes.md) for the four most common Gherkin mistakes —
too many steps, asserting internal implementation, ambiguous language, and testing multiple
behaviours — each with a fix.

## Phase Gate Acceptance Checks

See [Phase Gate Acceptance Checks](./reference/phase-gate-acceptance-checks.md) for how phase
gate checklist items in `delivery.md` meet the same testability standard as Gherkin scenarios.

## Integration with Plans

See [Integration with Plans](./reference/integration-with-plans.md) for the plan-level acceptance
criteria format and the user story acceptance criteria format.

## Reference Documentation

**Primary Convention**: [Acceptance Criteria Convention](../../../repo-governance/development/infra/acceptance-criteria.md)

**Directory Structure Convention**: [Specs Directory Structure Convention](../../../repo-governance/conventions/structure/specs-directory-structure.md) — Where to place feature files in the specs/ directory

**Related Conventions**: [Plans Organization](../../../repo-governance/conventions/structure/plans.md), [Maker-Checker-Fixer Pattern](../../../repo-governance/development/pattern/maker-checker-fixer.md)

**Related Skills**: `repo-practicing-trunk-based-development`, `repo-applying-maker-checker-fixer`

**Related Agents**: `plan-maker`, `plan-checker`, `plan-execution-checker`

**External Resources**: [Official Gherkin Reference](https://cucumber.io/docs/gherkin/reference/), [Writing Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)

---

This Skill packages essential Gherkin acceptance criteria knowledge for writing clear, testable specifications. For additional patterns and examples, consult external Gherkin resources.
