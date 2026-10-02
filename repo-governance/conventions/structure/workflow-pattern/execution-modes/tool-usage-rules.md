---
description: What tools the AI assistant uses under Agent Delegation vs. Manual Orchestration.
when_to_use: Use when checking which tool calls are correct for the active execution mode.
---

# Tool Usage Rules

## For AI Assistant Using Agent Delegation

**Agent Invocation**:

- Use the Agent tool with `subagent_type` matching the workflow's named agent
- Pass the relevant scope, report paths, and mode parameters in the prompt
- File operations performed by the delegated agent persist to the actual filesystem
- Collect delegated agent outputs (report paths) to pass to subsequent steps

## For AI Assistant in Manual Mode

**File Operations** (when executing workflow logic directly):

- Use Write tool for creating new files (audit reports, fix reports)
- Use Edit tool for modifying existing files (applying fixes)
- Use Bash tool for UUID generation, timestamps
- All operations persist to actual filesystem
