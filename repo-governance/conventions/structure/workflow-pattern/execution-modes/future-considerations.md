---
description: Notes potential future automation via a workflow runner, and the compatibility constraints it would need to respect.
when_to_use: Use when evaluating or designing a future automated workflow runner.
---

# Future Considerations

## Potential Automation

In the future, a workflow runner could be developed to automate workflow execution:

- Execute workflows with full tool access
- Manage iteration state and termination criteria
- Aggregate reports and provide summaries
- Reduce manual effort for repetitive workflows

**Note**: Manual orchestration mode would remain supported as a fallback mechanism.

## When Developing Workflow Runner

1. Ensure backward compatibility with manual mode
2. Support both `workflow run` and manual mode invocation patterns
3. Maintain file persistence guarantees
4. Provide transparent execution status and progress tracking
