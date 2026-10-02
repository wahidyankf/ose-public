---
description: Defines Manual Orchestration mode — executing workflow logic directly with Read/Write/Edit/Bash tools when agents aren't available as delegated agent types.
when_to_use: Use when workflow agents are not available as defined delegated agent types, or when step-by-step visibility and manual iteration control are wanted.
---

# Manual Orchestration Mode (Fallback)

## Description

User or AI assistant follows workflow steps directly using tools in main context when agents are not available as defined delegated agent types.

**Characteristics**:

- AI assistant executes workflow logic directly
- Direct tool usage (Read, Write, Edit, Bash) in main context
- Manual iteration control (user decides when to continue)
- Step-by-step execution with visibility at each stage
- File changes persist to actual filesystem

## When to Use Manual Orchestration

- Workflow agents are not available as defined delegated agent types
- You want step-by-step visibility and granular control
- You want to review changes between each step
- Agent delegation is unavailable or fails

## Example Usage

```
User: "Run plan quality gate workflow for plans/backlog/my-plan/ in manual mode"
AI: [Executes workflow steps directly]
1. Reads plan files (Read tool)
2. Validates content (checker logic)
3. Writes audit report (Write tool to local-tmp/plan/)
4. Applies fixes (Edit tool on plan files)
5. Writes fix report (Write tool to local-tmp/plan/)
6. Re-validates (checker logic again)
7. Stops after at most three cycles and records the verdict
```

## Use Task Tool (Isolated) When

- Agent only reads and analyzes (no file modifications needed)
- Exploratory research and recommendations
- Information gathering without side effects
- Analysis that doesn't require persisting results

**Examples**:

- Code exploration and understanding
- Research tasks (web search + analysis)
- Answering questions about codebase
- Planning without implementation
