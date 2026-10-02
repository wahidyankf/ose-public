---
description: Gherkin scenarios for rules-grooming outcomes.
when_to_use: Use to validate or extend this workflow.
---

# Success Criteria

```gherkin
Feature: Repository rules grooming

  Scenario: A sweep nothing called for does not run
    Given no recurrence trigger condition is met by the census
    When the workflow is invoked
    Then the run records no-op with all three trigger values
    And no candidate discovery sweep runs

  Scenario: The first run is not blocked by having no baseline
    Given no prior grooming run is recorded
    When the census evaluates the recurrence trigger
    Then the elapsed-time condition is satisfied by definition
    And the run proceeds and its census becomes the baseline

  Scenario: A dry run skips the preservation baseline it cannot use
    Given the run is invoked with dry-run true
    When Step 2 is reached
    Then the obligation inventory is skipped and the skip recorded
    And no deterministic extract is labelled a preservation baseline

  Scenario: An unapproved obligation loss halts the run
    Given the post-run inventory is missing an obligation not on the approved retirement list
    When preservation verification runs
    Then the run halts
    And the propagation delivery that introduced the loss is identified
    And the revert is handed to propagation rather than written by this workflow

  Scenario: An obligation that survives but becomes unreachable is treated as lost
    Given a surviving obligation reachable from no surface that binds its audience
    When preservation verification runs
    Then the run halts with that obligation named

  Scenario: Every run is gated, including the zero-risk class
    Given a run whose only class is fragmentation
    And preservation verification passed
    When Step 8 is reached
    Then the rules quality gate is invoked once with an effective subject
    And its verdict is recorded and every open blocking row has an owner before Step 9

  Scenario: The gate is invoked under named authorization, not inferred
    Given the gate refuses authorization inferred from another workflow
    When grooming invokes it at Step 8
    Then the gate's Entry section names grooming as a caller
    And no other workflow inherits that permission

  Scenario: A gate finding outside the run's own edits defers
    Given the gate reports a finding on a surface this run never touched
    When the ledger is bounded
    Then the finding is recorded as next-sweep input rather than repaired
    And the gate is not re-run to confirm any repair

  Scenario: A gate cycle hands its ledger to propagation without asking again
    Given the gate's audit freezes blocking rows
    When the gate hands the ledger over
    Then propagation runs on that frozen ledger with no further user instruction
    And the gate's advisory verdict is recorded as the step's

  Scenario: A run that lost an obligation is never submitted for a verdict
    Given preservation verification found an unapproved loss
    When the run halts at Step 7
    Then the governance verdict is not requested

  Scenario: Grooming never writes a rule surface
    Given a manifest of approved candidates
    When the workflow hands them off
    Then every rule edit is written by rules-propagation
    And this workflow stages, commits, and pushes nothing

  Scenario: A partial run still records what it learned
    Given a run in which one subject group halted at propagation
    When the run ends
    Then the remaining approved groups still land
    And the log entry records the halt, every deferred item, and the metrics delta

  Scenario: A rejected candidate is not re-presented as new
    Given a candidate rejected at a previous run's checkpoint
    When the next sweep rediscovers it
    Then it is recorded as rejected-again with the prior reason attached
```

## Related

- [Success Criteria — Candidate Classes](./012-success-criteria-candidate-classes.md) — the per-class
  admission and refusal scenarios.
- [Termination Criteria](./015-termination-criteria.md) — the prose form.
