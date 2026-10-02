---
name: docs-software-engineering-separation-quality-gate
description: >-
  Judges whether the platform style guides under docs/explanation/software-engineering/ and the AyoKoding learning paths
  they name stay separate, in at most three bounded cycles, and returns one advisory verdict.
when_to_use: >-
  Use when someone explicitly asks for a separation review, after adding or changing a prerequisite relationship, or
  after editing a style guide or the AyoKoding learning path it names.
---

# Docs Software Engineering Separation Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker,
a frozen ledger, one separate writer, at most three cycles, and an advisory verdict. This file states only what is
specific to keeping the style guides and the AyoKoding teaching content apart, per the
[Programming Language Documentation Separation Convention](../../conventions/structure/programming-language-docs-separation.md).

## Entry

The gate starts only on an explicit request that names it. No workflow calls it.

## Inputs

| Input        | Type    | Values                                                                     | Default  |
| ------------ | ------- | -------------------------------------------------------------------------- | -------- |
| `subject`    | string  | Style-guide paths under `docs/explanation/software-engineering/`, or `all` | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`                                           | `normal` |
| `max-cycles` | integer | 1, 2, or 3                                                                 | 3        |

Any other `max-cycles` value, or a missing subject, refuses to start. Only relationships listed in the "Specific
Prerequisites" table of the
[Software Design Reference](../../../docs/explanation/software-engineering/software-design-reference.md) are in scope; a
style guide the table does not name is skipped, never reported.

## Deterministic Boundary

The checker reports none of these properties. The entry and exit checks run their owners instead.

| Property                          | Owned by                 | This repository runs            |
| --------------------------------- | ------------------------ | ------------------------------- |
| Markdown formatting and lint      | the formatter and linter | `format-staged`, `markdownlint` |
| Style-guide front matter          | the metadata validator   | `md-frontmatter`                |
| Heading hierarchy in style guides | the heading validator    | `md-heading-hierarchy`          |
| File names                        | the file-name validator  | `md-naming`                     |

No declared gate runs the internal-link validator here, so whether a cross-reference resolves is judgeable.

## Cycle

Each cycle is one full audit by `docs-software-engineering-separation-checker` and one repair by
[Docs Software Engineering Separation Propagation](docs-software-engineering-separation-propagation.md), run by
`docs-software-engineering-separation-fixer`, per
[Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md). For each
relationship in the table, the audit asks whether:

1. both the style-guide path and the AyoKoding path the row names exist;
2. the style guide's `README.md` carries a Prerequisite Knowledge section that names the row's AyoKoding path and says
   the style guide is not a tutorial;
3. the style guide teaches no language syntax, holds no by-example annotated code, and states no generic pattern
   without this repository's context;
4. the AyoKoding path holds the learning path the convention requires, its `by-example/` and `in-the-field/` tracks
   included; and
5. every cross-reference between the two resolves and its link text names the destination.

The checklist and its examples live in the `docs-validating-software-engineering-separation` skill. Wording preference
is not a finding.

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

No verdict stops the caller.

## Ledger

`local-tmp/quality/docs-software-engineering-separation/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and
closing verdict block in
[the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger). It is
never committed.

## Example Usage

```text
Run docs-software-engineering-separation-quality-gate on
docs/explanation/software-engineering/programming-languages/java/ with mode normal.
```

## Related Workflows

- [Docs Quality Gate](docs-quality-gate.md) judges the repository's documents for currency and readability.
- [Content Quality Gate](content-quality-gate.md) judges the AyoKoding pages themselves.
