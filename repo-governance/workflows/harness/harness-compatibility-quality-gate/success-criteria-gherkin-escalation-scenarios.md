---
description: The remaining four Gherkin scenarios — spec updates, generator-logic escalation, out-of-scope escalation, and double-zero confirmation with bounded iteration.
when_to_use: Use when verifying or testing this workflow's escalation and iteration-budget behaviour against its acceptance criteria.
---

# Success Criteria (Gherkin) — Part 2

**Continued from** [Success Criteria (Gherkin) — Part 1](./success-criteria-gherkin.md).

```gherkin
Scenario: Fixer updates rhino specs when a harness change alters documented CLI behaviour
  Given the audit contains a HIGH-confidence finding that a harness changed a convention Rhino emits
  And the upstream Rhino specification corpus documents the old behaviour in a Gherkin scenario
  When harness-compatibility-fixer applies the catalog and binding updates
  Then it edits the affected the upstream Rhino specification corpus files to match the new behaviour
  And it preserves the Given-When-Then scenario structure
  And it records each touched spec file in the fix report

Scenario: Rhino generator-logic change is surfaced for human resolution
  Given the audit contains a finding that requires changing a binding translation rule
  When harness-compatibility-fixer encounters it
  Then it flags the change as out-of-scope authorship of the pinned Rhino product
  And the workflow surfaces it for human resolution

Scenario: Out-of-scope findings escalate to human without looping
  Given the audit contains a finding that a harness introduced a new higher-precedence filename
  When harness-compatibility-fixer encounters this finding
  Then it flags it as out-of-scope with a human-action annotation
  And the workflow terminates with status "partial" rather than looping further
  And the user-visible output surfaces the finding with full context

Scenario: Double-zero confirmation prevents premature success
  Given the first validation pass returns zero drift findings
  When the workflow reaches iteration control
  Then it increments consecutive_zero_count to 1 and loops to re-validate
  And only after a second consecutive zero-finding validation does it terminate with "pass"

Scenario: Scheduled execution stays within bounded iteration budget
  Given max-iterations is set to 7 (default)
  When drift findings persist through all 7 iterations
  Then the workflow terminates with status "partial"
  And the final audit report lists all remaining drift findings
  And an escalation warning was emitted at iteration 5
```
