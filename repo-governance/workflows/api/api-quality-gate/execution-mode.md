---
description: Preferred and fallback execution modes for the API quality gate, and example invocations.
when_to_use: Use when starting the API quality gate, to decide between Agent Delegation and Manual Orchestration.
---

# Execution Mode

**Preferred Mode**: Agent Delegation — invoke `api-exploratory-tester` and the fixing `swe-code-maker`
via the Agent tool with `subagent_type` (see
[Workflow Execution Modes Convention](../../meta/execution-modes.md)).

**Fallback Mode**: Manual Orchestration — drive the API directly with `curl` and apply fixes with
Read/Write/Edit when Agent Delegation is unavailable.

**How to Execute**:

```text
User: "Run API quality gate for http://localhost:8302 against apps/ose-be/openapi.yaml"
User: "Run API quality gate for the organiclever-be GraphQL endpoint"
```

Each invocation is one bounded run. A `partial` or `fail` result requires a separately started run;
the workflow never re-enters itself.
