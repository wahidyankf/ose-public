---
name: tutorial-by-example-propagation
description: >-
  Repairs the mechanical rows of a frozen By Example tutorial ledger, leaving new content and teaching choices to the
  author, with every threshold read from the adapter; the tutorial-by-example family's sole writer.
when_to_use: >-
  Use when the Tutorial By Example Quality Gate hands over a frozen ledger, or when someone explicitly names rows of one
  to repair.
---

# Tutorial By Example Propagation

## Contract

This is the `tutorial-by-example` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The pages and example code of the one tutorial the gate froze. Its prose, facts, and links belong to
[Content Propagation](content-propagation.md).

## Executor

`tutorial-by-example-fixer`, loading the `docs-creating-by-example-tutorials` skill. Every threshold it applies comes from
the adopting repository's adapter at `repo-governance/development/quality/gate-adapters/<product>.md`, cited by name;
the fixer holds no threshold of its own, so the gate and its writer can never disagree on one.

## Row Verification

A row closes when rereading the example shows the row's target state, an edited example still runs as printed and shows
the output it produced, and a density row's recount falls within the adapter's band. Each ledger row ends `resolved`,
`not-resolved`, `not-applicable`, or `needs-decision`, with evidence.

## Family Rules

### Entry

The [Tutorial By Example Quality Gate](tutorial-by-example-quality-gate.md) hands over a frozen ledger, or an explicit
request names its rows.

- `findings` (`file`, required): the frozen ledger, each row naming its example.

### Sequence

1. **Repair what the example itself settles:** a missing import or helper, output or an intermediate value missing
   beside its line, annotations added or trimmed to bring density within the band, two approaches split into separate
   blocks, examples renumbered in sequence, and a missing part the example's own content fully determines.
2. **Leave authoring and pedagogy to the author.** A row that needs new content, such as more examples or diagrams to
   reach a band, a rewritten example to make it self-contained, or a new key takeaway, is `needs-decision`. So is a
   judgement about grouping, progression, or annotation quality, which may be deliberate teaching.
3. **Run each edited example** through the repository's declared entry point, then verify each row.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status
and evidence. A person reviews the `needs-decision` rows after the verdict, never inside a cycle. The caller commits the
repairs. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run tutorial-by-example-propagation with the ledger the gate froze for learn/golang/by-example.
```

## Related Workflows

- [Tutorial By Example Quality Gate](tutorial-by-example-quality-gate.md) judges the tutorial and hands its blocking
  rows here.
