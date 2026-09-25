---
description: Defines Agent Delegation mode — invoking specialized agents via the Agent tool with subagent_type so file changes persist to the filesystem.
when_to_use: Use when a workflow step references a named agent that exists as a defined delegated agent type and the step requires persistent file changes.
---

# Agent Delegation Mode (Preferred)

## Description

Invoke specialized agents via the Agent tool with `subagent_type` when the workflow references agents that exist as defined delegated agent types.

**Characteristics**:

- Specialized agents execute in dedicated delegated agent contexts
- File changes persist to the actual filesystem
- Agents bring their full specialized knowledge and validation rules
- Agent tool delegated agents are distinct from the Task tool: file changes DO persist
- SHOULD be used when the workflow's checker/fixer agents exist as defined delegated agent types

## When to Use Agent Delegation

- Workflow step references a named agent (e.g., `plan-checker`, `docs-fixer`)
- That agent exists as a defined delegated agent type in the canonical agent directory (`.agents/agents/`)
- The step requires persistent file changes (audit reports, fixes)
- You want the agent's full specialized validation/fixing logic applied

## Example Usage

```
User: "Run plan quality gate workflow for plans/backlog/my-plan/"
AI: [Invokes plan-checker via Agent tool]
1. Agent tool invokes plan-checker subagent
   → plan-checker reads plan files, validates, writes audit report to local-tmp/plan/
   → audit report persists on filesystem
2. Agent tool invokes docs-fixer subagent with audit report path
   → docs-fixer reads audit, applies fixes to doc files, writes fix report
   → fixes and fix report persist on filesystem
3. Repeat until zero findings
4. Show git status with modified files
5. Wait for user commit approval
```

## Agent Delegation Pattern

When a workflow step references an agent, invoke it via the Agent tool:

```
Agent tool invocation:
  subagent_type: plan-checker
  prompt: "Validate plans/backlog/my-plan/ and write audit report"

Agent tool invocation:
  subagent_type: docs-fixer
  prompt: "Apply fixes from local-tmp/plan/plan__abc123__2026-03-24--10-00__audit.md"
```

## Expected Behaviour

- Real audit reports created in `local-tmp/plan/`
- Real fixes applied to target files
- Real fix reports documenting changes
- Changes visible in `git status`
- User can commit changes when satisfied
