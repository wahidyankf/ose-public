---
description: Defines the finding-remediation execution loop that delegates each validation finding to the correct specialized agent.
when_to_use: Use when a validation report returns findings that must be fixed before re-validation.
---

# 5. Continue Execution (Sequential, Conditional)

Address findings and continue implementation by delegating to appropriate specialized agents.

**Orchestrator**: calling context (top-level assistant session)

- **Inputs**: `{plan: {input.plan-path}, focus: {findings-from-latest-report}}`
- **Output**: `{additional-work-completed}` — More checklist items completed, findings addressed
- **Condition**: Findings exist from step 4 or step 7
- **Depends on**: Step 4 completion (first iteration) or Step 7 completion (subsequent iterations)

**Execution loop** (same rules as Step 2):

For each finding from the latest validation report:

1. Analyze the finding to determine the correct specialized agent
2. Delegate the remediation to that agent via the Agent tool
3. Verify the agent resolved the finding successfully
4. **Atomic sync**: If the finding corresponds to an unchecked item, tick BOTH the delivery
   checklist (`- [x]`) and the task (`completed`) in the same step
5. Proceed immediately to the next finding

**Success criteria**: The orchestrator addresses all findings without stopping between them.

**On failure**: Log errors, proceed to step 6 for verification.

**Notes**:

- Orchestrator focuses on addressing specific findings while continuing overall plan execution
- Updates delivery checklist with resolved items
- May delegate to new requirements or fix quality issues
- Continues from previous work, does not restart from scratch
