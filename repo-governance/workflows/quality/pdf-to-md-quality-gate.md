---
name: pdf-to-md-quality-gate
description: >-
  Judges a Markdown conversion, or one section of a large one, for fidelity to its source PDF in at most three bounded
  cycles, and returns one advisory verdict.
when_to_use: >-
  Use when someone explicitly asks for a fidelity review of a converted PDF, after a conversion is written or edited, or
  before the Markdown is relied on in place of its source.
---

# PDF to Markdown Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker,
a frozen ledger, one separate writer, at most three cycles, and an advisory verdict. This file states only what is
specific to PDF conversions, where the PDF is the truth and the Markdown its copy.

## Entry

The gate starts only on an explicit request that names it. No workflow calls it. The conversion already exists:
`pdf-to-md-maker` makes it beforehand, and the gate never converts.

## Inputs

| Input        | Type    | Values                                                             | Default  |
| ------------ | ------- | ------------------------------------------------------------------ | -------- |
| `subject`    | string  | A source PDF and its Markdown, optionally narrowed to a page range | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`                                   | `normal` |
| `max-cycles` | integer | 1, 2, or 3                                                         | 3        |

A page range covers that range and the Markdown span it produced, so a large conversion is judged section by section.
Any other `max-cycles` value, or a missing subject, refuses to start.

Tool commands come from the adopting repository's adapter at
`repo-governance/development/quality/gate-adapters/pdf-to-md.md`. It holds the commands for extraction, character
recognition, per-dimension comparison, and diagram parsing; the recognized-page marker; any numeric recognition
error-rate thresholds; the repair count above which a repair is uncertain; and the fallback for a source too large to
compare exhaustively. Without one, the `docs-converting-pdf-to-markdown` skill's judgement applies.

## Deterministic Boundary

The checker reports none of these properties. The entry and exit checks run their owners instead.

| Property                                     | Owned by                 | This repository runs            |
| -------------------------------------------- | ------------------------ | ------------------------------- |
| Markdown formatting and lint                 | the formatter and linter | `format-staged`, `markdownlint` |
| File names                                   | the file-name validator  | `md-naming`                     |
| Diagram accessibility, palette, label length | the diagram validator    | `md-mermaid`                    |

Fidelity is never delegated, because no generic check reads the PDF. Whether a diagram parses is judged unless the
declared gate parses diagrams. The large NIST conversion is excluded from `markdownlint`, so its Markdown mechanics are
judgeable.

## Cycle

Each cycle is one full audit by `pdf-to-md-checker`, loading the `docs-converting-pdf-to-markdown` skill, and one repair by
[PDF to Markdown Propagation](pdf-to-md-propagation.md), run by `pdf-to-md-fixer`, per
[Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md).

The checker extracts the source afresh, never reusing the conversion's intermediate output, and judges each of the
skill's seven dimensions on its own: text completeness, text accuracy, heading levels, nesting depth, structure (reading
order and tables), figure coverage, and technical validity (diagrams and recognized pages). It rates each gap with the
skill's conversion table, where a missing section, page, or table is `CRITICAL`.

Verbatim permits only whitespace normalization. Heading depth follows section numbering before font size. An ambiguous
figure stays a placeholder, never a guessed diagram. Every recognized page is marked. A page that could not be extracted
is reported as not checked, never as matching.

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

No verdict stops the caller, and a verdict covers only what was compared.

## Ledger

`local-tmp/quality/pdf-to-md/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and closing verdict block in
[the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger). Each row
names its source page, Markdown location, and dimension. The verdict block also records page coverage, the counts of
tables, figures, and diagrams, and each dimension checked by sampling rather than exhaustively, with the pages sampled.
It is never committed.

## Example Usage

```text
Run pdf-to-md-quality-gate on standards/framework.pdf and its Markdown, pages 120 to 180, with mode strict.
```

## Related Workflows

- [Docs Quality Gate](docs-quality-gate.md) judges documents written for readers, not copies of a source.
