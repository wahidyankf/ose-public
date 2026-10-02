---
description: States the preferred Agent Delegation execution mode, the Manual Orchestration fallback, and the orchestrator's eight-step outline.
when_to_use: Use when starting this workflow, to confirm which execution mode applies and what the orchestrator does step by step.
---

# Execution Mode

**Preferred Mode**: Agent Delegation — invoke `plan-maker` for authoring each plan (Step 6) and
delegate `plan-quality-gate` for each gated plan (Step 7) via the Agent tool with `subagent_type`.
`plan-maker` and `plan-checker` run as delegated agents; file changes persist to the
actual filesystem. See [Workflow Execution Modes Convention](../../../conventions/structure/workflow-pattern/execution-modes.md).

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using Read/Write/Edit
tools in the main context when Agent Delegation is unavailable. Manually follow the plan-quality-gate
steps for each plan.

**How to Execute**:

```
User: "Run plan-parity-planning for objective: standardize markdown gates"
```

The orchestrator:

1. Surveys each target repo's current state relative to the objective
2. Builds and presents the deviation matrix
3. Grills the invoker until every matrix cell has a recorded decision; establishes the
   research-needed flag
4. Delegates external research to `web-researcher` (conditional on research-needed flag)
5. Grills the invoker again with research findings to validate and close any new decision branches
6. Delegates plan authoring to `plan-maker` per repo
7. Runs `plan-quality-gate` once per plan and requires a `PASS` verdict
8. Delivers per the selected mode and reports outcomes
