---
name: ci-propagation
description: >-
  Repairs the rows of a frozen ci-quality ledger in the pipeline definitions and hook wiring, never weakening a check to
  make it pass; the ci family's sole writer.
when_to_use: >-
  Use when the CI Quality Gate hands over a frozen ledger, or when someone explicitly names rows of one to repair.
---

# CI Propagation

## Contract

This is the `ci` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The hosted pipeline definitions and the local hook wiring in the gate's subject, and the task-runner targets, example
environment files, ignore files, and image metadata those definitions call. Application code and test bodies stay
outside it.

## Executor

`ci-fixer`, loading the `ci-standards` skill.

## Row Verification

A row closes when the edited definition passes the narrowest validation that covers it, such as the platform's
definition check or one run of the edited hook, and rereading shows the row's target state. Each ledger row ends
`resolved`, `not-resolved`, `not-applicable`, or `needs-decision`, with evidence.

## Family Rules

### Entry

The [CI Quality Gate](ci-quality-gate.md) hands over a frozen ledger, or an explicit request names its rows.

- `findings` (`file`, required): the frozen ledger, with each delegated check's evidence.

### Sequence

1. **Skip delegated predicates.** A row whose exact predicate a delegated check owns is neither re-validated nor
   repaired; its evidence is carried unchanged.
2. **Apply only what the cited standard settles,** such as building the real target a placeholder stood in for, moving a
   slow suite out of a hook into the scheduled full run, or adding a missing example environment file.
3. **Never weaken a check.** Lowering a floor, widening an exclusion, skipping a step, letting a step continue on error,
   or adding a stub because a check expects a target is never a repair. Such a row, and one that needs an exemption, a
   rewritten suite, or a choice among valid designs, is `needs-decision`; a deliberate gate change lands in its own
   commit, per [Software Quality Enforcement](../../development/quality/code.md).
4. **Mark delegated evidence `pending`** where a check's scope intersects an edited file, then verify each row.

The writer never pushes to confirm a hosted pipeline; the caller does that when it delivers the repairs.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status
and evidence, and each delegated check marked `verified`, `pending`, or `not-applicable`. A rerun on unchanged inputs
changes nothing.

## Example Usage

```text
Run ci-propagation with the ledger the ci quality gate froze for subject all.
```

## Related Workflows

- [CI Quality Gate](ci-quality-gate.md) judges the pipeline wiring and hands its blocking rows here.
- [Rules Propagation](rules-propagation.md) writes a change to which gates the repository requires.
