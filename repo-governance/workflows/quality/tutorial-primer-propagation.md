---
name: tutorial-primer-propagation
description: >-
  Repairs the mechanical rows of a frozen primer ledger, leaving every scope call, the scope statement, and the
  capstone's scale to the author; the tutorial-primer family's sole writer.
when_to_use: >-
  Use when the Tutorial Primer Quality Gate hands over a frozen ledger, or when someone explicitly names rows of one to
  repair.
---

# Tutorial Primer Propagation

## Contract

This is the `tutorial-primer` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The pages, capstone, and example code of the one primer the gate froze. Its prose, facts, and links belong to
[Content Propagation](content-propagation.md).

## Executor

`tutorial-primer-fixer`, loading the `docs-creating-by-example-tutorials` skill, since a primer's examples follow the By
Example rules. Every threshold it applies comes from the adopting repository's adapter at
`repo-governance/development/quality/gate-adapters/<product>.md`, cited by name; the fixer holds no threshold of its
own, so the gate and its writer can never disagree on one.

## Row Verification

A row closes when rereading the primer shows the row's target state, an edited example still runs as printed and shows
the output it produced, and a density row's recount falls within the adapter's band. Each ledger row ends `resolved`,
`not-resolved`, `not-applicable`, or `needs-decision`, with evidence.

## Family Rules

### Entry

The [Tutorial Primer Quality Gate](tutorial-primer-quality-gate.md) hands over a frozen ledger, or an explicit request
names its rows.

- `findings` (`file`, required): the frozen ledger, each row naming its page or example.

### Sequence

1. **Repair example rows as By Example does,** per
   [Tutorial By Example Propagation](tutorial-by-example-propagation.md#sequence), within the primer's stated scope.
2. **Leave scope to the author.** The scope statement itself, whether an example is scope creep or serves a dependent
   topic, the capstone's scale, and adding examples to reach the floor are decisions about what the primer promises, so
   each is `needs-decision`. The writer never removes an example to narrow the scope.
3. **Run each edited example** through the repository's declared entry point, then verify each row.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status
and evidence. A person reviews the `needs-decision` rows after the verdict, never inside a cycle. The caller commits the
repairs. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run tutorial-primer-propagation with the ledger the gate froze for learn/just-enough-sql.
```

## Related Workflows

- [Tutorial Primer Quality Gate](tutorial-primer-quality-gate.md) judges the primer and hands its blocking rows here.
