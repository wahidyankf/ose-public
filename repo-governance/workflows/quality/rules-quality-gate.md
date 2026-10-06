---
name: rules-quality-gate
description: >-
  Judges one proposed or effective rule state for soundness, uniqueness, and discoverability in at most three cycles,
  with Rules Propagation as its writer, and returns one advisory verdict.
when_to_use: >-
  Use when someone explicitly asks for a semantic review of a rule, before or after propagation writes it.
---

# Rules Quality Gate

This gate follows the [Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker,
a frozen ledger, one separate writer, at most three cycles, and an advisory verdict. This file states only what is
specific to rules.

## Entry

The gate starts only on an explicit request that names it, or from [Rules Grooming](../maintenance/rules-grooming.md) on
the state a grooming run produced. A rule change, review request, or propagation run never starts it alone.

## Inputs

| Input        | Type    | Values                                                 | Default  |
| ------------ | ------- | ------------------------------------------------------ | -------- |
| `subject`    | string  | A rule outcome with its reason, `proposal`/`effective` | required |
| `mode`       | enum    | `lax`, `normal`, `strict`, `all`                       | `normal` |
| `max-cycles` | integer | 1, 2, or 3                                             | 3        |

A `proposal` subject compares a requested outcome with the current rules before any edit; an `effective` subject judges
the repository after propagation wrote. Any other `max-cycles` value, or a missing subject, refuses to start.

## Deterministic Boundary

The checker reports none of these properties. The entry and exit checks run their owners instead.

| Property                                    | Owned by                   | This repository runs            |
| ------------------------------------------- | -------------------------- | ------------------------------- |
| Markdown formatting and lint                | the formatter and linter   | `format-staged`, `markdownlint` |
| Front matter                                | the metadata validator     | `md-frontmatter`                |
| Adapters match their canonical definitions  | the adapter validator      | `harness-adapters`              |
| Vendor names in governance                  | the vendor-term validator  | `governance-vendor`             |
| Heading hierarchy                           | the heading validator      | `md-heading-hierarchy`          |
| Internal link targets                       | the link validator         | `md-internal-link`              |
| README index entries for every direct child | the README-index validator | `md-readme-index`               |

A property no tool of its own owns leaves the table and becomes judgeable. No declared gate validates link anchors or
word budgets, so anchors and word budgets are judgeable.

## Cycle

Each cycle is one full audit by `rules-checker` and one repair by [Rules Propagation](rules-propagation.md), run by
`rules-fixer`, per
[Sequence and Termination](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md). The frozen
subject records intended strength, scope, consumers, any move or deletion, canonical sources, and the enforcement route.
The audit covers the affected rule, its uses, the authority above it, and overlapping guidance; for grooming, that run's
manifest. It asks whether:

1. the need, outcome, and reason are concrete enough to judge;
2. the wording's strength matches the intended strength, per
   [Rule Definition](../../conventions/writing/conventions.md);
3. scope, trigger, action, boundaries, and necessary exceptions are explicit;
4. the rule sits at the right level, and nothing lower contradicts a higher rule;
5. one canonical source owns the meaning, and links keep it findable without copies;
6. every enforcement claim names a truthful route, with evidence where automation cannot decide;
7. the rule survives compaction and handover at every entry point;
8. a reasonable reader can act without inventing policy; and
9. a move or deletion keeps unique intent and updates its consumers.

Only a rule violation, or a gap leaving the outcome unsafe, contradictory, undiscoverable, or materially ambiguous, is a
finding. Wording preference, speculative cases, and unneeded automation are not, per
[Minimal Sufficiency](../../principles/general/simplicity-over-complexity.md). After the first repair, a `proposal`
subject is audited
as written.

## Termination

The contract's
[termination table](../../development/workflow/quality-gate-contract/002-sequence-and-termination.md#termination)
applies unchanged. This gate adds no row.

## Verdict

| Verdict              | The caller                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| `PASS`               | records the verdict and continues; for a proposal, current rules already suffice    |
| `PASS_WITH_FINDINGS` | records the verdict and the open non-blocking rows, and continues                   |
| `FAIL`               | gives each open blocking row an owner (idea brief, plan item, or issue), continues  |
| `BLOCKED`            | records the cause (tooling, input-changed, or unavailable), then acts as for `FAIL` |

No verdict stops the caller, and none authorizes a commit or a push.

## Ledger

`local-tmp/quality/rules/<outcome-slug>__<YYYYMMDDTHHMMZ>.md`, with the columns and closing verdict block in
[the contract](../../development/workflow/quality-gate-contract/003-verdicts-ledger-and-relations.md#ledger). It is
never committed.

## Example Usage

```text
Run rules-quality-gate on proposal "Require a dry run for every script that deletes files."
```

## Related Workflows

- [Rules Propagation](rules-propagation.md) repairs every blocking row.
- [Rules Grooming](../maintenance/rules-grooming.md) may request a verdict after its reductions.
