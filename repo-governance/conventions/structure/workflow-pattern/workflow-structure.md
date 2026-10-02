---
description: The Markdown template every workflow document follows — the two-key frontmatter, the body sections carrying the goal, termination, inputs, and outputs contract, and the step skeleton.
when_to_use: Use when authoring a new workflow file and needing the canonical frontmatter and section skeleton to copy.
---

# Workflow Structure

Frontmatter carries **exactly two keys**, as it does for every file under `repo-governance/` —
see [Governance Frontmatter](../governance-frontmatter.md). A
workflow's contract — goal, termination, inputs, outputs — lives in the body, where it is readable
without a YAML parser and countable against the word budget like any other prose.

```markdown
---
description: One sentence on what this workflow does.
when_to_use: The specific scenarios where this workflow applies.
---

# Workflow Name

**Purpose**: One-sentence description of what this workflow does.

## Goal and Termination

**Goal**: What this workflow achieves.

**Termination**: Success/failure criteria.

## Inputs

- **`input-name`** (type, required | optional, default `value`) — What this input is for.
- **`mode`** (enum: first, second, optional, default `first`) — Enum values are listed inline.
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the
  N in the N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent
  work, machine capacity, and budget headroom all allow; lower under budget, runner, or disk
  pressure. Never self-promoted beyond the declared value.

## Outputs

- **`output-name`** (type, pattern `file-pattern`) — What this output contains.

## Steps

### 1. Step Name (Execution Mode)

Execution modes: Sequential | Parallel | Conditional

Description of what this step does.

**Agent**: `agent-name` _(use for agent steps)_
**Workflow**: `category/workflow-name` _(use for nested workflow steps)_
**Procedure**: description of manual/scripted step _(use for procedure steps)_

- **Args**: Key-value pairs or references to inputs/previous outputs
- **Output**: What this step produces
- **Depends on**: Previous step(s) that must complete first (if sequential)
- **Condition**: When this step runs (if conditional)

**Success criteria**: What defines success for this step.
**On failure**: What happens if this step fails.

## Termination Criteria

- PASS: **Success**: Conditions for successful completion
- **Partial**: Conditions for partial success
- FAIL: **Failure**: Conditions for failure

## Example Usage

Concrete examples of how to invoke this workflow.

## Related Workflows

Links to workflows that compose with this one.

## Notes

Additional context, limitations, or important considerations.
```

**Types** are unchanged: `string`, `number`, `boolean`, `file`, `file-list`, `enum`. An input states
whether it is `required` or `optional` and gives its `default` when optional; a `file` or
`file-list` output states its `pattern`. The workflow's identifier is its filename stem — it is not
restated in frontmatter.
