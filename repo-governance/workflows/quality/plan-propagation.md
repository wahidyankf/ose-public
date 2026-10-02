---
name: plan-propagation
description: >-
  Repairs the rows of a frozen plan-quality ledger inside one plan folder, without changing the plan's outcome or
  inventing a decision; the plan family's sole writer.
when_to_use: >-
  Use when the Plan Quality Gate hands over a frozen ledger, or when someone explicitly names rows of one to repair.
---

# Plan Propagation

## Contract

This is the `plan` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The six documents of the one plan folder the gate froze, and any evidence or companion file inside that folder, per
[Plans](../../conventions/structure/plans.md). Nothing outside the folder: not the code the plan describes, nor another
plan.

## Executor

`plan-fixer`, loading the `plan-creating-project-plans` skill, and the `plan-writing-gherkin-criteria` skill when a row
concerns acceptance criteria. `plan-maker` authors plans; `plan-fixer` only repairs ledger rows.

## Row Verification

A row closes when rereading the plan answers the row's question, such as a criterion now testable or a delivery item now
executable in dependency order, and the repository's plan structural validator exits 0 over the folder. Each ledger row
ends `resolved`, `not-resolved`, `not-applicable`, or `needs-decision`, with evidence.

## Family Rules

### Entry

The [Plan Quality Gate](plan-quality-gate.md) hands over a frozen ledger, or an explicit request names its rows.

- `plan` (`directory`, required): the plan folder the ledger was frozen against.
- `findings` (`file`, required): the frozen ledger.

### Sequence

1. **Confirm the plan is the one audited.** A plan folder changed since the ledger froze ends the run `input-changed`,
   with nothing edited.
2. **Repair within the plan's own decisions.** Rewrite an untestable criterion as a testable one, reorder or split a
   delivery item, or copy a decision the plan already records into the document that needs it. A repair never changes
   the plan's stated outcome, scope, or acceptance.
3. **Leave policy to the owner.** A row whose repair needs a decision the plan does not record, such as a new scope
   boundary, a choice between designs, or a missing root cause, is `needs-decision`. The owner settles it through the
   `grill-me` skill after the verdict, never inside a cycle.
4. **Verify each row** as Row Verification states.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status
and evidence. Partial outcome: some rows resolved, others `needs-decision` or `not-resolved`, each named. The caller
commits the repairs. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run plan-propagation on plans/in-progress/billing-retry with the ledger the plan quality gate froze.
```

## Related Workflows

- [Plan Quality Gate](plan-quality-gate.md) judges the plan and hands its blocking rows here.
- [Planning](../plan/plan-planning.md) authors the plan this workflow repairs.
