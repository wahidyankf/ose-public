---
description: Defines literal authorization for plans/ artifacts and the prospective applicability of the mature-plan contract.
when_to_use: Use before creating a plans/ artifact or deciding whether an existing plan must adopt the current contract.
---

# Plan-Artifact Authorization and Transition

## Purpose

Repository plans are durable, reviewed records. They are distinct from Plan Mode, a harness task
list, discovery notes, and temporary tester findings.

## Standards

- Create a new artifact under `plans/` only when the user literally requests a plan artifact,
  invokes a plan-authoring workflow or agent, or explicitly selects `output-mode: plan`.
- The one standing request is the adopted
  [Upstream Tool Defects](../../../development/workflow/upstream-tool-defects.md) standard: it
  authorizes a defect's two-pager and a blocking defect's [Bug-Fix Plan](./bug-fix-plan.md) at the
  tool's owner, and a consumer's FERRET brief or bug-fix plan here, without a further request. Each
  such bug-fix plan's authorization includes its quality gate and execution.
- Plan Mode, internal task planning, discovery, an omitted tester output mode, and a useful learning
  do not authorize a `plans/` write. Testers default to `local-tmp`; Knowledge Capture reports an
  unapproved follow-up instead of filing it.
- A request to edit or execute a named existing plan authorizes only the required changes to that
  plan; it does not authorize unrelated plan creation.
- Route simple work to the harness task list. Create an early `plans/ideas/` brief only when the
  user literally requests that artifact or the standing request above covers it.
- Apply the mature-plan structure and content contract only to plans created after this rule lands.
  Keep `plans/done/` immutable. The Rhino plan already in progress may complete under the contract
  recorded in its own files; do not report migration findings against either set.

## Examples

- “Test the site” writes findings to `local-tmp/` unless the user selects another authorized mode.
- “Create a backlog plan from these findings” authorizes a new formal plan.
- “Execute the Rhino plan” authorizes normal lifecycle updates to Rhino, not a rewrite to the new
  document shape.

## Validation

Semantic review verifies the literal request, destination, and applicability date. No deterministic
gate infers user intent.
