---
name: specs-quality-gate
description: >-
  Judges explicitly listed specification folders for structure, consistency, and alignment with their implementation in
  at most three bounded cycles, and returns one advisory verdict.
when_to_use: >-
  Use after creating, restructuring, or bulk-editing specification folders, before a specification migration, or to
  confirm that related specification areas agree.
---

# Specs Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker,
a frozen ledger, one separate writer, at most three cycles, and an advisory verdict. This file states only what is
specific to specifications.

## Entry

The gate starts only on an explicit request that names it. No workflow calls it.

## Inputs

| Input        | Type    | Values                                             | Default  |
| ------------ | ------- | -------------------------------------------------- | -------- |
| `subject`    | string  | The specification folders to judge, listed by name | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`                   | `normal` |
| `max-cycles` | integer | 1, 2, or 3                                         | 3        |

Each listed folder is judged with its subfolders, and nothing else; the gate never discovers or scans a whole
specification tree. Any other `max-cycles` value, or a missing subject, refuses to start.

## Deterministic Boundary

The checker reports none of these properties. The entry and exit checks run their owners instead.

| Property                                  | Owned by                   | This repository runs                         |
| ----------------------------------------- | -------------------------- | -------------------------------------------- |
| Scenarios pass against the implementation | the test suites            | `test:quick`, `test:integration`, `test:e2e` |
| Markdown formatting and lint              | the formatter and linter   | `format-staged`, `markdownlint`              |
| Heading hierarchy                         | the heading validator      | `md-heading-hierarchy`                       |
| Internal link targets                     | the link validator         | `md-internal-link`                           |
| Each declared spec root's README index    | the README-index validator | `md-readme-index`                            |

A property no tool of its own owns leaves the table and becomes judgeable, per [Deterministic and Judgement
Validation](../../conventions/structure/deterministic-vs-ai-validation-split.md). No declared gate runs a specification
validator or Gherkin linter here, so indexes below the declared roots, counts, syntax, and link anchors are judgeable.

## Cycle

Each cycle is one full audit by `specs-checker` and one repair by [Specs Propagation](specs-propagation.md), run by
`specs-fixer`, per
[Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md). The writer
edits only within the listed folders. The audit reads every listed folder for:

- **structure**: indexes that describe their folder, and a tree shaped per
  [Specification Tree](../../conventions/structure/specs-directory-structure.md);
- **scenario quality**: feature headers, user stories, shared setup, and naming per
  [Behaviour-Driven Development](../../development/behaviour-driven-development.md);
- **consistency**: shared domains, terms, and diagrams agreeing across the listed folders, judged only when two or more
  are listed;
- **references**: each link pointing at what its text claims it points at; and
- **implementation alignment**: every implementation a specification names exists.

A repair that would change what a specification requires is a judgement the ledger does not settle, so its row is
`needs-decision`.

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

No verdict stops the caller, and none authorizes a commit or a push.

## Ledger

`local-tmp/quality/specs/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and closing verdict block in
[the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger). It is
never committed.

## Example Usage

```text
Run specs-quality-gate on the folders billing/api and billing/web with mode strict.
```

## Related Workflows

- [Gherkin Implementation Review](gherkin-implementation-review.md) checks that the code honours these scenarios.
- [Docs Propagation](docs-propagation.md) keeps the documents that cite these specifications true to them.

## Why Listed Folders Only

A gate that discovers its own scope reports a different count each time the tree grows, so its progress measure resets
and its result cannot be compared with the last run. Naming the folders freezes the subject and makes cross-folder
consistency a deliberate choice. This workflow implements
[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md).
