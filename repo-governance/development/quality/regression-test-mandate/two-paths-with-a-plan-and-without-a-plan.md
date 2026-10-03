---
description: "How the mandate binds a direct fix versus a planned fix."
when_to_use: "Use when a bug fix has a plan doc and needs a tracked test step."
---

# Two Paths: With a Plan and Without a Plan

Like Feature Change Completeness, this mandate binds both paths a fix can take:

1. **Direct fix (no plan doc)**: The reproducing test MUST be added in the same commit or PR
   as the fix. The `swe-reviewer` agent flags a code fix that lacks a companion reproducing
   test. This is the same enforcement path used for missing Gherkin specs under Feature Change
   Completeness.

2. **Planned fix (plan doc)**: Any bug-fix plan MUST include an explicit delivery-checklist step
   that adds the reproducing test. The step must name the test file and describe the scenario it
   pins. `plan-maker` emits this step; `plan-checker` flags its absence. The test is then written
   -- and verified -- when the plan executes.
