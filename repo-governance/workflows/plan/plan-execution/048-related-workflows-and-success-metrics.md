---
description: Lists workflows this one composes with and the recommended workflow sequence, plus the success metrics tracked across executions.
when_to_use: Use when composing plan execution with other workflows, or when tracking success metrics across plan executions.
---

# Related Workflows

This workflow can be composed with:

- **plan-quality-gate**: Validate plan quality before executing (recommended pre-step)
- Content creation workflows: Execute content-focused plans
- Release workflows: Execute release plans with deployment
- **rules-quality-gate**: Validate repository consistency after plan execution

**Recommended Workflow Sequence**:

```
1. plan-quality-gate → Validate plan completeness and accuracy
2. plan-execution    → Execute validated plan
3. rules-quality-gate → Ensure repository consistency
```

## Success Metrics

Track across executions:

- **Average cycles to completion**: How many cycles typically needed for different plan types
- **Success rate**: Percentage of plans clearing every blocking finding and moving to done/
- **Common finding categories**: What issues appear most often during execution
- **Execution success rate**: Percentage of requirements implemented without errors
- **Archival rate**: Percentage of plans successfully moved to done/
- **Agent delegation accuracy**: How often the correct specialized agent was selected per task type
