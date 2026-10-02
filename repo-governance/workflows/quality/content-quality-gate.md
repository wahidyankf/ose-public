---
name: content-quality-gate
description: >-
  Judges published content for clear writing, accessible structure, true facts, working links, and its adapter's product
  rules, in at most three bounded cycles, and returns one advisory verdict.
when_to_use: >-
  Use when someone explicitly asks for a review of published content, such as a site's articles or learning pages,
  before publishing a batch of it, or to sweep a content tree.
---

# Content Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker,
a frozen ledger, one separate writer, at most three cycles, and an advisory verdict. This file states only what is
specific to published content.

## Entry

The gate starts only on an explicit request that names it. No workflow calls it.

## Inputs

| Input        | Type    | Values                                      | Default  |
| ------------ | ------- | ------------------------------------------- | -------- |
| `subject`    | string  | The published content paths, listed by name | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`            | `normal` |
| `max-cycles` | integer | 1, 2, or 3                                  | 3        |

Any other `max-cycles` value, or a missing subject, refuses to start.

Product rules come from the adopting repository's adapter at
`repo-governance/development/quality/gate-adapters/<product>.md`. An adapter names the content paths it covers and holds
what only that product decides: front matter, tree layout, language policy, link form, and each generic rule below it
overrides, by name. A path no adapter covers gets the generic rules alone; the checker never infers a product rule.

## Deterministic Boundary

The checker reports none of these properties. The entry and exit checks run their owners instead.

| Property                                     | Owned by                 | This repository runs                  |
| -------------------------------------------- | ------------------------ | ------------------------------------- |
| Markdown formatting and lint                 | the formatter and linter | `format-staged`, `markdownlint`       |
| File names                                   | the file-name validator  | `md-naming`                           |
| Diagram rendering, label length, and palette | the diagram validator    | `md-mermaid`, `md-mermaid-repository` |

Internal links, anchors, front matter, and heading hierarchy in the content trees are reached by no declared tool here,
so they are judgeable, as the adapters record.

## Cycle

Each cycle is one full audit by `content-checker` and one repair by [Content Propagation](content-propagation.md), run
by `content-fixer`, per
[Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md). The audit
asks of each page whether:

1. its prose is active, plain, and concise, explaining every term a reader may not know, per
   [Voice and Clarity](../../conventions/writing/quality.md);
2. its headings nest without skipping a level and name their sections, per
   [Headings and Structure](../../conventions/writing/quality.md);
3. every informative image has alt text, link text names its destination, and colour is never the only cue, per
   [Accessible Content](../../conventions/writing/quality.md);
4. every code block names its language, per [Formatting](../../conventions/writing/quality.md),
   and any time estimate is labelled as one;
5. every factual claim (commands, versions, code, external references) holds against an authoritative source, and steps
   work in their stated order, per [Factual Validation](../../conventions/writing/factual-validation.md) and the
   `docs-validating-factual-accuracy` skill;
6. internal links, image links, and anchors resolve, and external links are reachable, ignoring links in code,
   quotations, and comments, per [Internal Links](../../conventions/formatting/linking.md) and the
   `docs-validating-links` skill; and
7. it meets every product rule its adapter states.

Wording preference is not a finding. A claim no authoritative source settles is reported as unverified, never as wrong.

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

`local-tmp/quality/content/<subject-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and closing verdict block in
[the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger). Each fact
row keeps its source and retrieval date. It is never committed.

## Example Usage

```text
Run content-quality-gate on the pages under content/en/learn/databases with mode normal.
```

## Related Workflows

- [Docs Quality Gate](docs-quality-gate.md) judges the repository's own documents rather than published content.
- [Tutorial By Example Quality Gate](tutorial-by-example-quality-gate.md) and its sibling tutorial gates judge a
  tutorial's kind.
