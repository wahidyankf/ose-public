---
description: "The remaining four Gherkin scenarios (of eight) proving merge-mode ID continuation, grilled material decisions, unreachable-target abort, and enforced systematic coverage."
when_to_use: "Use when verifying merge-mode behaviour, grill enforcement, unreachable-target handling, or the systematic-coverage completeness critic's success criteria."
---

# Gherkin Success Criteria — Part 2

**Continued from** [Gherkin Success Criteria — Part 1](./gherkin-success-criteria-plan-output-and-integration.md).

```gherkin
Scenario: Merge mode extends an existing findings plan
  Given an existing plan folder under plans/in-progress/
  When the workflow runs in plan-mode=merge against that folder
  Then prior findings keep their original IDs and gain a re-verification result
  And new findings are appended by ID continuation
  And tech-docs.md and delivery.md are extended to cover the new findings

Scenario: Material decisions are grilled with options
  Given more than one valid fix approach exists for a finding
  When the plan is being solidified
  Then the workflow grills the user with a multiple-choice AskUserQuestion
  And the question offers a blank-state option and a "let's chat about this" option
  And no material decision is made without the user's answer

Scenario: Unreachable target aborts before testing
  Given a target URL that does not return HTTP 200
  When the workflow starts
  Then it aborts in pre-flight with a message to start the server
  And no plan is authored

Scenario: Systematic coverage matrices and recurrence are enforced
  Given a target that has prior findings plans and source changed since the last run
  When the workflow runs
  Then pre-flight compiles a prior-finding-class re-check list and a changed-surface list
  And each tester receives them as mandatory coverage and records its enumerated coverage matrices
  And the Phase 3.5 cross-tester completeness critic confirms no matrix cell, recurrence class, or changed surface was silently skipped
  And the consolidated README coverage map carries the matrices
```
