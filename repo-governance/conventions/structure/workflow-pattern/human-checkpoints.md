---
description: How workflows pause for human approval using the AskUserQuestion tool, with an example checkpoint block.
when_to_use: Use when a workflow step requires human approval before proceeding.
---

# Human Checkpoints

Workflows can pause for human approval:

```markdown
### 3. User Review (Human Checkpoint)

**Prompt**: "Review audit reports. Approve fixes?"

**Options**:

- Approve all → Proceed to step 4
- Approve selective → Proceed to step 4 with selections
- Reject → Terminate (status: fail)

**Timeout**: None (workflow waits indefinitely)
```

Human checkpoints use the `AskUserQuestion` tool when executed.
