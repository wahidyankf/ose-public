---
name: pdf-to-md-propagation
description: >-
  Restores the fidelity gaps of a frozen pdf-to-md-quality ledger in the converted Markdown from a fresh extraction of
  the source page, never from memory and never by reconverting; the pdf-to-md family's sole writer.
when_to_use: >-
  Use when the PDF to Markdown Quality Gate hands over a frozen ledger, or when someone explicitly names rows of one to
  repair.
---

# PDF to Markdown Propagation

## Contract

This is the `pdf-to-md` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The span of the converted Markdown each row names, inside the subject the gate froze. The source PDF is never edited,
and no section is reconverted to repair one line: a reconversion discards spans the audit already cleared.

## Executor

`pdf-to-md-fixer`, loading the `docs-converting-pdf-to-markdown` skill. Its extraction, recognition, and diagram-parsing
commands come from the adopting repository's adapter at
`repo-governance/development/quality/gate-adapters/pdf-to-md.md`.

## Row Verification

A row closes when the named source page, extracted again, matches the repaired span on the row's dimension, and any
diagram in the span parses with the adapter's parsing command. Each ledger row ends `resolved`, `not-resolved`,
`not-applicable`, or `needs-decision`, with evidence, and the evidence names the sections changed.

## Family Rules

### Entry

The [PDF to Markdown Quality Gate](pdf-to-md-quality-gate.md) hands over a frozen ledger, or an explicit request names
its rows.

- `findings` (`file`, required): the frozen ledger, each row with its source page, Markdown location, and dimension.

### Sequence

1. **Re-extract before editing.** Extract the named source page again and reread the Markdown at the named location,
   since either reading may have been wrong.
2. **Treat spreading repairs as uncertain.** A repair is `needs-decision` when it would change one pattern in many
   places, beyond the adapter's count where it sets one; reach outside the row's location; or overlap another row's
   repair. So is a dispute over recognized text.
3. **Restore from the source.** Restore missing text from the re-extracted page, correct a cell, move a heading or list
   to its source depth, fix a diagram's syntax without redesigning it, or add a numbered placeholder for an
   unrepresented figure. A figure whose kind is ambiguous gets a placeholder, never a guessed diagram.
4. **Verify each row** as Row Verification states.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status,
evidence, and changed sections. The caller commits the repairs. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run pdf-to-md-propagation with the ledger the pdf-to-md quality gate froze for pages 120 to 180.
```

## Related Workflows

- [PDF to Markdown Quality Gate](pdf-to-md-quality-gate.md) judges fidelity and hands its blocking rows here.
