---
description: Explains that the calling context, not a dedicated plan-executor agent, directly orchestrates plan execution.
when_to_use: Use when orienting to who runs plan execution and why there is no dedicated plan-executor agent.
---

# Execution Mode

**Direct Orchestration** — the calling context (the top-level assistant session that received the "Execute plan …" request) is the orchestrator. It reads this workflow, parses the plan's delivery checklist, manages the live Task list via `TaskCreate` / `TaskUpdate`, performs the Atomic Sync Ritual against `delivery.md`, and delegates each checklist item to the appropriate specialized agent via the Agent tool (see Agent Selection below).

The calling context invokes `plan-execution-checker` as a delegated agent for independent validation (Step 3 and Step 6 below). Validation must run in an isolated context so the checker's judgment is not biased by the orchestrator's execution memory.

There is no dedicated `plan-executor` delegated agent. Executor logic lives in this workflow document; the calling context follows it directly. This keeps the live Task list visible to the user in real time (a delegated agent's tasks are isolated to its own context) and eliminates a redundant router hop.
