---
name: tutorial-annotated-concept-propagation
description: >-
  Repairs the mechanical rows of a frozen annotated-concept tutorial ledger, removing code from a no-code tutorial only
  as its owner decides and leaving medium and clustering choices to the author; the family's sole writer.
when_to_use: >-
  Use when the Tutorial Annotated Concept Quality Gate hands over a frozen ledger, or when someone explicitly names rows
  of one to repair.
---

# Tutorial Annotated Concept Propagation

## Contract

This is the `tutorial-annotated-concept` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The pages, capstone, and any runnable code of the one tutorial the gate froze. Its prose, facts, and links belong to
[Content Propagation](content-propagation.md).

## Executor

`tutorial-annotated-concept-fixer`. The catalog publishes no skill for this kind, so the fixer works from the gate's
rules and the adopting repository's adapter at `repo-governance/development/quality/gate-adapters/<product>.md`, cited
by name. The fixer holds no threshold of its own, so the gate and its writer can never disagree on one.

## Row Verification

A row closes when rereading the worked example shows the row's target state, an edited code-bearing example still runs
as printed, and a density row's recount falls within the adapter's band. Each ledger row ends `resolved`,
`not-resolved`, `not-applicable`, or `needs-decision`, with evidence.

## Family Rules

### Entry

The [Tutorial Annotated Concept Quality Gate](tutorial-annotated-concept-quality-gate.md) hands over a frozen ledger, or
an explicit request names its rows.

- `findings` (`file`, required): the frozen ledger, with the tutorial mode the gate read.

### Sequence

1. **Repair what the example itself settles:** a missing import in a code-bearing example, annotations added or trimmed
   to bring its density within the band, or a missing part its own content fully determines.
2. **Leave mode, medium, and structure to the author.** Code in a no-code tutorial is `needs-decision`: whether it
   becomes prose, a diagram, or a decision artifact, or the tutorial changes mode, is the author's call. So are the
   choice of medium, clustering, progression, a decision artifact's reasoning, and adding worked examples to reach the
   floor.
3. **Run each edited code-bearing example** through the repository's declared entry point, then verify each row.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status
and evidence. A person reviews the `needs-decision` rows after the verdict, never inside a cycle. The caller commits the
repairs. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run tutorial-annotated-concept-propagation with the ledger the gate froze for learn/team-leadership.
```

## Related Workflows

- [Tutorial Annotated Concept Quality Gate](tutorial-annotated-concept-quality-gate.md) judges the tutorial and hands
  its blocking rows here.
