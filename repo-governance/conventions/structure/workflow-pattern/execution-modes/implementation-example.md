---
description: Shows the "Execution Mode" section every workflow document should include, with a worked template.
when_to_use: Use when authoring a new workflow document and needing a template for its Execution Mode section.
---

# Implementation Example

## Workflow Document Structure

Every workflow should include an "Execution Mode" section:

````markdown
# My Workflow Name

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `{checker-agent}` and `{fixer-agent}` via the
Agent tool with `subagent_type` when these agents exist as defined delegated agent types.

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.

**How to Execute**:

```
User: "Run my-workflow for [scope]"
```

The AI will invoke specialized agents via the Agent tool. If agents are unavailable as
delegated agent types, it will fall back to executing the workflow steps directly.

## Steps

[Workflow steps as usual...]
````
