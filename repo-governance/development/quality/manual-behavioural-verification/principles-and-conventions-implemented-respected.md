---
description: "Principles/conventions this convention implements."
when_to_use: "Use when tracing this convention's rationale."
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**: Manual verification forces the implementer to observe the actual behaviour of the system, not just trust that tests passed. This deliberate observation step catches integration issues, visual regressions, and behavioural mismatches that automated tests may not cover.

- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: Bugs that reach production often stem from skipping manual verification. The root cause is not inadequate tests -- it is the absence of a human or agent observing the actual behaviour before declaring the work complete. This convention addresses that root cause directly.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: The verification step is an explicit, required action in the implementation workflow. It is not assumed to have happened because tests passed. The evidence of verification (screenshots, console output, API responses) makes the check visible and auditable.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Behaviour-Driven Development](../../behaviour-driven-development.md)**: Manual verification supplements mandatory Unit proof and every boundary-applicable Integration/E2E adapter. It never replaces required automated proof or justifies an exemption.

- **[Code Quality Convention](.././code.md)**: Automated quality gates (typecheck, lint, test:quick) catch code-level issues. Manual verification catches behavioural issues that survive those gates. Together they form a complete quality boundary.

- **[Evidence Capture Convention](.././evidence-capture.md)**: Manual verification leaves a committed
  record: screenshots for UI and independently attributable HTTP curl or non-HTTP native-client wire
  results for APIs. "Verified manually" without a record is incomplete.
