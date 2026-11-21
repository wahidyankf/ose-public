---
description: "Principles and conventions this convention implements."
when_to_use: "Use when tracing this convention to the principles/conventions behind it."
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Documentation First](../../../principles/content/documentation-first.md)**: Documentation is a first-class deliverable, not an afterthought. When a feature changes, its documentation must change in the same unit of work. Stale documentation is worse than no documentation because it misleads.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: The system's behaviour should be fully legible from the repository at all times. When specs, contracts, and tests diverge from code, the actual behaviour becomes implicit -- knowable only by reading source code. Keeping all artifacts synchronized preserves explicitness.

- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: Stale specs, outdated contracts, and missing tests are symptoms of treating artifact updates as separate, deferrable tasks. The root cause is a workflow that permits code changes without companion artifact updates. This convention addresses the root cause by making completeness a requirement, not a suggestion.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Where completeness can be enforced automatically -- Nx cache inputs that include Gherkin specs, codegen targets that fail on stale contracts, test:behaviour:coverage validation for CLI apps -- automation is preferred. Manual checking is reserved for documentation and architectural changes that require human judgment.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Specs-Application Sync Convention](.././specs-application-sync.md)**: This convention mandates bidirectional synchronization between specs/ and application code. Feature Change Completeness extends that mandate to also include contracts, tests, and documentation.

- **[Behaviour-Driven Development](../../behaviour-driven-development.md)**: Every changed scenario updates its mandatory Unit proof and every boundary-applicable Integration/E2E adapter or independently valid exemption.

- **[Code Quality Convention](.././code.md)**: Quality gates (typecheck, lint, and `test:quick`,
  including Unit runtime and the static `test:behaviour:coverage` check) catch many forms
  of incompleteness automatically. This convention defines the complete set of artifacts that
  constitute a "done" change.
