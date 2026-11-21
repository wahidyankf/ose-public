---
description: "Principles/conventions implemented."
when_to_use: "Use to trace this convention's rationale."
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: This convention is a direct expression of the Root Cause Orientation principle. Preexisting CI failures are not "someone else's problem" -- they are the repository's problem. Every contributor who encounters a blocker has a responsibility to investigate the root cause and fix it, not route around it.

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**: Bypassing CI is the opposite of deliberate problem-solving. It substitutes a quick escape for a thoughtful investigation. This convention requires the implementer to understand the failure before acting, choose the correct fix, and verify the fix resolves the root cause.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: CI automation exists to catch problems early. Bypassing it destroys the value of that automation. This convention protects the integrity of the automated quality boundary by making bypass a forbidden action rather than a tolerated workaround.

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: A clean, passing CI pipeline is simpler than a pipeline with known failures that everyone works around. Fixing preexisting issues reduces the complexity of the development environment for every contributor.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Code Quality Convention](.././code.md)**: The quality gates (including `test:quick`, which
  owns Unit runtime plus the static `test:behaviour:coverage` check) are the CI boundary
  this convention protects. Bypassing those gates with `--no-verify` or test skipping is the
  specific action this convention forbids.

- **[Git Push Safety Convention](../../workflow/git-push-safety.md)**: Both conventions share the stance that `--no-verify` is not a routine shortcut. This convention extends the principle to the broader case of any CI bypass mechanism.

- **[Trunk Based Development Convention](../../workflow/trunk-based-development.md)**: TBD requires that `main` is always in a releasable state. Preexisting CI failures on `main` violate that requirement. This convention mandates fixing them rather than tolerating them.
