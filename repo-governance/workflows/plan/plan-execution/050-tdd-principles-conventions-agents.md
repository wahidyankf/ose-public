---
description: States the TDD requirement for delivery items that ship code, and lists the principles, conventions, and agents this workflow implements.
when_to_use: Use when confirming TDD is required for a code-shipping checklist item, or checking which principles/conventions this workflow follows.
---

# Test-Driven Development

When implementing delivery checklist items that ship code, the orchestrator and every delegated
`swe-code-maker` follow TDD: write a failing test first, confirm it fails for the right reason,
write the minimum code to pass, then refactor. Mini-TDD passes are encouraged — split a feature
into multiple small Red→Green→Refactor cycles rather than one large test up front. Gherkin
acceptance criteria in `prd.md` are the natural source of the first failing tests.

**See**: [Test-Driven Development Convention](../../../development/workflow/test-driven-development.md) — in particular, the
[TDD Shape for Delivery Checklists](../../../development/workflow/test-driven-development/tdd-shape-for-delivery-checklists.md#tdd-shape-for-delivery-checklists)
section for required separate, detailed RED/GREEN/REFACTOR checkboxes inside one outcome section.

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit**: All steps, conditions, termination criteria, and agent selection rules clearly defined
- PASS: **Automation Over Manual**: Fully automated execution, validation, and archival with specialized agent delegation
- PASS: **Simplicity Over Complexity**: Clear linear flow with loop control, bounded iterations, and domain-specific agents
- PASS: **Accessibility First**: Generates human-readable validation reports for transparency
- PASS: **Progressive Disclosure**: Configurable iterations and plan paths for different use cases
- PASS: **No Time Estimates**: Focus on quality outcomes and completion criteria, not duration

## Conventions Implemented/Respected

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Workflow file follows plain name convention for workflows
- **[Linking Convention](../../../conventions/formatting/linking.md)**: All cross-references use GitHub-compatible markdown with `.md` extensions
- **[Content Quality Principles](../../../conventions/writing/quality.md)**: Active voice, proper heading hierarchy, single H1
- **[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md)**:
  Pre-execution grill MUST present 2-4 concrete options per question; open-ended questions
  without options are FORBIDDEN

## Agents

- [plan-execution-checker](../../../../.agents/agents/plan-execution-checker.md) — validates plan execution completeness and quality
