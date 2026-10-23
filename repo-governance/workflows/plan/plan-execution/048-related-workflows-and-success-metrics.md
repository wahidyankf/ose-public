---
description: Lists workflows this one composes with and the recommended workflow sequence, plus the success metrics tracked across executions.
when_to_use: Use when composing plan execution with other workflows, or when tracking success metrics across plan executions.
---

# Related Workflows

This workflow can be composed with:

- **plan-quality-gate** (`repo-governance/workflows/quality/plan-quality-gate.md`): judges the **draft**
  only. It is an optional, manually invoked step **outside** this workflow. Execution never runs it;
  a recorded verdict is advisory history, and a missing verdict is
  `plan-quality-gate: not run (manual-only)`, never a stop.
- Content creation workflows: Execute content-focused plans
- Release workflows: Execute release plans with deployment
- **plan-execution-check** (`repo-governance/workflows/plan/plan-execution-check.md`): judges the
  **delivered work**. This workflow runs it at the end of every cycle through the
  `plan-execution-checker` agent; only its permitting verdict allows archival.
- **rules-quality-gate**: Validate repository consistency after plan execution, when the plan changed rules.

**Workflow Sequence**:

```
0. (optional, manual, outside execution) plan-quality-gate → judge the draft
1. plan-execution    → execute (starts with or without a verdict)
2. plan-execution-check via plan-execution-checker → judge delivered work; archive only on permit
3. rules-quality-gate → only when rule work landed
```

## Success Metrics

Track across executions:

- **Average cycles to completion**: How many cycles typically needed for different plan types
- **Success rate**: Percentage of plans clearing every blocking finding and moving to done/
- **Common finding categories**: What issues appear most often during execution
- **Execution success rate**: Percentage of requirements implemented without errors
- **Archival rate**: Percentage of plans successfully moved to done/
- **Agent delegation accuracy**: How often the correct specialized agent was selected per task type
