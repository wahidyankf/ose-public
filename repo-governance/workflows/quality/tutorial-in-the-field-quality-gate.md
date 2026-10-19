---
name: tutorial-in-the-field-quality-gate
description: >-
  Judges one in-the-field guide against its scenario, built-in-first, and production-code rules, with adapter product
  thresholds, in ≤3 bounded cycles, returning one advisory verdict.
when_to_use: >-
  Use when explicitly asked to review an in-the-field guide: after writing or restructuring one, or before
  publishing it.
---

# Tutorial In the Field Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): read-only checker,
frozen ledger, one separate writer, at most three cycles, advisory verdict. This file states only the in-the-field specifics: production practice in one working scenario.

## Entry

The gate starts only on an explicit request that names it. No workflow calls it. Editorial
review sits before cycle 1 or after the verdict, per
[Human Review](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#human-review).

## Inputs

| Input        | Type    | Values                                         | Default  |
| ------------ | ------- | ---------------------------------------------- | -------- |
| `subject`    | string  | One guide set's folder, or listed guides in it | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`               | `normal` |
| `max-cycles` | integer | 1, 2, or 3                                     | 3        |

Any other `max-cycles` value, or a missing subject, refuses to start.

Product thresholds live only in the adopting repository's adapter at
`repo-governance/development/quality/gate-adapters/<product>.md`. For this kind: the guide count band, the
annotation density band, the diagram count band, the file layout, and the front matter.
Without an adapter, only the generic rules apply.

## Deterministic Boundary

The checker reports none of these properties; the entry and exit checks run their owners.

| Property                                     | Owned by                                                      | This repository runs                       |
| -------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| Markdown formatting and lint                 | the formatter and linter                                      | `format-staged`, `markdownlint`            |
| File names                                   | the file-name validator                                       | `md-naming`                                |
| Diagram rendering, label length, and palette | the diagram validator                                         | `md-mermaid`, `md-mermaid-repository`      |
| Example execution and lesson-to-file match   | the product's example harness, where its adapter declares one | `ayokoding-www:examples:check` (AyoKoding) |

A property no tool owns leaves the table and becomes judgeable. Where the product's gate adapter declares an example harness, that harness owns whether an opted-in example runs and whether its lesson block matches its file, and the checker reports neither; for any other page, whether an example runs is judgeable. Links and front matter in the content trees stay judgeable.

## Cycle

Each cycle is one full audit by `tutorial-in-the-field-checker`, loading the `docs-creating-in-the-field-tutorials` skill,
and one repair by [Tutorial In the Field Propagation](tutorial-in-the-field-propagation.md), run by
`tutorial-in-the-field-fixer`, per
[Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md). The audit
asks of each guide whether:

- it declares one type from [Tutorial Types](../../conventions/tutorials/naming.md) and keeps one recognizable
  scenario throughout, each step giving the exact action and the output it produced, with checkpoints and recovery notes
  where the scenario fails;
- the built-in approach comes first: a framework or library shown before the language's or platform's own approach is a
  `CRITICAL` finding;
- every framework is justified by the built-in approach's limits, shown before it arrives, and a trade-off section says
  when the simpler approach still suffices;
- its code is production-complete: errors handled, resources released on every path, configuration from the environment,
  never hardcoded, and no credential anywhere;
- the production pattern it teaches fits the scenario's context;
- each diagram helps follow the scenario; and
- its annotation density, comment lines divided by code lines per code block, falls within the adapter's band.

Of the set, it asks whether the guide and diagram counts fall within the adapter's bands.

Prose, facts, and links belong to the [Content Quality Gate](content-quality-gate.md). Trade-off depth, justification
quality, pattern fit, and diagram usefulness are judgement rows.

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

`local-tmp/quality/tutorial-in-the-field/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and closing verdict
block in [the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger).
It is never committed.

## Example Usage

```text
Run tutorial-in-the-field-quality-gate on the guide folder learn/golang/in-the-field with mode strict.
```

## Related Workflows

- [Tutorial By Example Quality Gate](tutorial-by-example-quality-gate.md) judges the example-first kind.
