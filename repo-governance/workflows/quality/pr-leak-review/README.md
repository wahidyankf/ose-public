---
name: pr-leak-review
description: >-
  Indexes the three modules that define a leak, review a range privately before it is pushed, and hold the harness's
  refusal of any merge or push without a pass verdict.
when_to_use: >-
  Use to decide whether a value is a leak, to run the leak review before a push, or to see how the delivery harness
  refuses a merge or push that lacks a pass verdict.
---

# PR Leak Review Modules

Read in order. Together these hold the rules the [PR Leak Review](../pr-leak-review.md) entrypoint's sequence applies.

- **001 Leak Classes** holds the three classes, what is not a leak, and why history is the subject.
- **002 Push Review** holds the private review of each outgoing range, and remediation before and after.
- **003 Enforcement** holds the screen, the harness's refusal, the enforcement disposition, and the adopter's decision.

## Directory Map

- [001 Leak Classes](001-scope-and-exclusions.md)
- [002 Push Review](002-push-review.md)
- [003 Enforcement](003-enforcement.md)
