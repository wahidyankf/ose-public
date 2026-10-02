---
description: States the core problem execution modes solve — workflow file changes must persist to the actual filesystem — and the two solutions.
when_to_use: Use when explaining why workflows need a defined execution mode at all.
---

# The Core Challenge

Workflows orchestrate multiple agents (checker → fixer → checker loops, etc.) to achieve quality outcomes. File changes must persist to the actual filesystem for workflow outcomes to be durable.

**Two solutions exist**:

- **Agent Delegation** (preferred): Use the Agent tool with `subagent_type` to invoke specialized agents. Agent tool delegated agents persist file changes to the actual filesystem.
- **Manual Orchestration** (fallback): Execute workflow logic directly in the main context using Read/Write/Edit tools when agents are not available as defined delegated agent types.
