---
name: tutorial-by-example-quality-gate
description: >-
  Judges one By Example tutorial's examples, annotations, and progression, with product thresholds from an adapter, in
  at most three bounded cycles, and returns one advisory verdict.
when_to_use: >-
  Use when someone explicitly asks for a review of a By Example tutorial, after writing or restructuring one, or before
  publishing it.
---

# Tutorial By Example Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker,
a frozen ledger, one separate writer, at most three cycles, and an advisory verdict. This file states only what is
specific to By Example tutorials, as [Tutorial Types](../../conventions/tutorials/naming.md) defines them.

## Entry

The gate starts only on an explicit request that names it. No workflow calls it. No cycle waits for a person: editorial
review sits before cycle 1 or after the verdict, per
[Human Review](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#human-review).

## Inputs

| Input        | Type    | Values                                       | Default  |
| ------------ | ------- | -------------------------------------------- | -------- |
| `subject`    | string  | One tutorial's folder, with its example code | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`             | `normal` |
| `max-cycles` | integer | 1, 2, or 3                                   | 3        |

Any other `max-cycles` value, or a missing subject, refuses to start.

Product thresholds come from the adopting repository's adapter at
`repo-governance/development/quality/gate-adapters/<product>.md`. For this kind it holds the example count band, the
annotation density band, the diagram count band, the length of each example part, any part it adds, the annotation
notation, the file layout, and the front matter. Each threshold lives only there. Without an adapter, only the generic
rules apply.

## Deterministic Boundary

The checker reports none of these properties. The entry and exit checks run their owners instead.

| Property                                     | Owned by                 | This repository runs                  |
| -------------------------------------------- | ------------------------ | ------------------------------------- |
| Markdown formatting and lint                 | the formatter and linter | `format-staged`, `markdownlint`       |
| File names                                   | the file-name validator  | `md-naming`                           |
| Diagram rendering, label length, and palette | the diagram validator    | `md-mermaid`, `md-mermaid-repository` |

A property no tool of its own owns leaves the table and becomes judgeable. No declared gate compiles or runs tutorial
code here, so whether an example runs is judgeable, as are links and front matter in the content trees.

## Cycle

Each cycle is one full audit by `tutorial-by-example-checker`, loading the `docs-creating-by-example-tutorials` skill, and
one repair by [Tutorial By Example Propagation](tutorial-by-example-propagation.md), run by `tutorial-by-example-fixer`,
per [Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md). The
audit asks of each example whether:

- it carries the parts
  [Cookbook and By Example](../../conventions/tutorials/swe-by-example.md) fixes, plus any
  the adapter adds; a missing part is a finding;
- it teaches one concept and is self-contained: with every other example removed, it still runs as printed, with every
  import and helper present;
- its annotations sit on the code lines, show values, intermediate states, and output, and say what a reader needs;
- its annotation density, comment lines divided by code lines, measured per example and never across the tutorial, falls
  within the adapter's band;
- built-in features come before any dependency, and a dependency states what the built-in approach could not do; and
- its key takeaway states the lesson rather than summarizing the code, and a comparison gives each approach its own
  block.

Across the tutorial, it asks whether examples are numbered in sequence, grouped coherently with core features first in
each level, rising soundly in complexity, and within the adapter's example and diagram count bands.

Prose, facts, and links belong to the [Content Quality Gate](content-quality-gate.md). Grouping, progression, and
annotation quality are judgement rows.

## Termination

The contract's
[termination table](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md#termination)
applies unchanged. This gate adds no row.

## Verdict

| Verdict              | The caller                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| `PASS`               | records the verdict and continues                                                   |
| `PASS_WITH_FINDINGS` | records the verdict and the open non-blocking rows, and continues                   |
| `FAIL`               | gives each open blocking row an owner (idea brief, plan item, or issue), continues  |
| `BLOCKED`            | records the cause (tooling, input-changed, or unavailable), then acts as for `FAIL` |

No verdict stops the caller or authorizes publishing.

## Ledger

`local-tmp/quality/tutorial-by-example/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and closing verdict block
in [the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger). Each
row names its example. It is never committed.

## Example Usage

```text
Run tutorial-by-example-quality-gate on the tutorial folder learn/golang/by-example.
```

## Related Workflows

- [Tutorial Primer Quality Gate](tutorial-primer-quality-gate.md) reuses these per-example rules in a scoped primer.
