---
description: "Principles and conventions this convention implements."
when_to_use: "Use when tracing this convention to the principles/conventions behind it."
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Documentation First](../../../principles/content/documentation-first.md)**: Specs are living documentation of system behaviour and architecture. Allowing them to drift from reality turns them into misleading artifacts rather than authoritative sources of truth. Keeping them current is an instance of treating documentation as a first-class deliverable, not an afterthought.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: The system's architecture and behaviour should be fully legible from the repository. When C4 diagrams or Gherkin feature files diverge from the actual implementation, the system's behaviour becomes implicit — knowable only by reading source code. Synchronization keeps behaviour explicit.

- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: Stale specs are a symptom of treating spec updates as optional. This convention addresses the root cause by making synchronization a mandatory part of every relevant change, not a periodic cleanup task.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Where synchronization can be enforced automatically—such as Nx cache inputs that include Gherkin specs and project-local static `test:behaviour:coverage` target—automation is preferred. Manual checking is reserved for semantic and architectural judgments that deterministic validation cannot make.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Behaviour-Driven Development](../../behaviour-driven-development.md)**: Unit and every boundary-applicable Integration/E2E adapter consume Gherkin feature files from `specs/`. If feature files do not reflect current API behaviour, their adapters validate the wrong contract.

- **[Behaviour-Driven Development](../../behaviour-driven-development.md)**: Mandatory exact-one
  scenario bindings require specs and production behaviour to evolve together. Adding behaviour
  without a scenario, or retaining a scenario after its production behaviour is removed, violates
  this mapping even when all step definitions compile.
