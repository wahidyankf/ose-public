---
name: content-propagation
description: >-
  Repairs the rows of a frozen content-quality ledger in the listed published pages, correcting facts only from an
  authoritative source and links only to a verified target; the content family's sole writer.
when_to_use: >-
  Use when the Content Quality Gate hands over a frozen ledger, or when someone explicitly names rows of one to repair.
---

# Content Propagation

## Contract

This is the `content` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The published pages the gate's subject lists, plus any companion file the product's adapter at
`repo-governance/development/quality/gate-adapters/<product>.md` names for a repair, such as a redirect list a renamed
page must update. Another language version of a page is in scope only when the adapter requires versions to agree.

## Executor

`content-fixer`, loading the `docs-applying-content-quality`, `docs-validating-factual-accuracy`, and `docs-validating-links` skills.

## Row Verification

A row closes when rereading the page shows the row's target state: a fact row cites the authoritative source and the
date it was read, a link row resolves on a fresh check, and a product row meets the adapter's rule as stated. The
repository's checks over the edited pages exit 0. Each ledger row ends `resolved`, `not-resolved`, `not-applicable`, or
`needs-decision`, with evidence.

## Family Rules

### Entry

The [Content Quality Gate](content-quality-gate.md) hands over a frozen ledger, or an explicit request names its rows.

- `findings` (`file`, required): the frozen ledger, each fact row with its source.

### Sequence

1. **Correct facts only from a source.** A claim is changed only to what an authoritative source states, per
   [Factual Validation](../../conventions/writing/factual-validation.md). A claim the writer cannot verify either way is
   `needs-decision`, never rewritten from memory.
2. **Repair links to verified targets.** A link whose target is missing is repaired when the resource's current address
   is confirmed, and is otherwise `needs-decision`. A redirect is `needs-decision` unless its target is plainly the same
   resource.
3. **Repair writing and structure without restyling.** A row about voice, headings, alt text, or a code block's language
   changes only the span it names. Accurate prose is never rewritten for preference.
4. **Apply product rules as the adapter states them,** citing the adapter. A rule the adapter does not state is never
   applied.
5. **Keep language versions in step** where the adapter requires it: a factual repair lands in every version that must
   agree. Then verify each row.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status
and evidence. The caller commits the repairs. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run content-propagation with the ledger the content quality gate froze for content/en/learn/databases.
```

## Related Workflows

- [Content Quality Gate](content-quality-gate.md) judges the published pages and hands its blocking rows here.
- [Docs Propagation](docs-propagation.md) is the writer for the repository's own documents.
