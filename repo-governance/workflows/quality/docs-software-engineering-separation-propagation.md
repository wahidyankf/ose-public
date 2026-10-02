---
name: docs-software-engineering-separation-propagation
description: >-
  Repairs the rows of a frozen separation ledger in the style guides, their Prerequisite Knowledge sections, the Software
  Design Reference table, and their cross-references; the separation family's sole writer.
when_to_use: >-
  Use when the Docs Software Engineering Separation Quality Gate hands over a frozen ledger, or when someone explicitly
  names rows of one to repair.
---

# Docs Software Engineering Separation Propagation

## Contract

This is the `docs-software-engineering-separation` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The style guides under `docs/explanation/software-engineering/` that the gate's subject lists, their `README.md`
Prerequisite Knowledge sections, the "Specific Prerequisites" table in the
[Software Design Reference](../../../docs/explanation/software-engineering/software-design-reference.md), and the
cross-reference links between a style guide and its AyoKoding path. AyoKoding pages are outside this scope.

## Executor

`docs-software-engineering-separation-fixer`, loading the `docs-validating-software-engineering-separation` skill.

## Row Verification

A row closes when rereading the edited file shows the row's target state: the section exists and names the table's
path, the duplicated teaching text is gone and the style guide's own convention remains, or the link resolves on a fresh
check. The repository's checks over the edited files exit 0. Each ledger row ends `resolved`, `not-resolved`,
`not-applicable`, or `needs-decision`, with evidence.

## Family Rules

### Entry

The [Docs Software Engineering Separation Quality Gate](docs-software-engineering-separation-quality-gate.md) hands
over a frozen ledger, or an explicit request names its rows.

- `findings` (`file`, required): the frozen ledger.

### Sequence

1. **Add or correct the Prerequisite Knowledge section** from the skill's template, naming the table's AyoKoding path.
2. **Remove duplicated teaching** from a style guide only where the row names the passage, and replace it with a link to
   the AyoKoding page that teaches it. A passage that may be intentional repository context is `needs-decision`.
3. **Correct the table or a link** only to a path that exists. Adding a new relationship to the table is
   `needs-decision`, because it widens the gate's scope.
4. **Never create AyoKoding content.** A missing learning-path file or track is `needs-decision` and is handed to the
   content's own maker; this writer does not author teaching content. Then verify each row.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status
and evidence. The caller commits the repairs. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run docs-software-engineering-separation-propagation with the ledger the separation gate froze for the Java style
guide.
```

## Related Workflows

- [Docs Software Engineering Separation Quality Gate](docs-software-engineering-separation-quality-gate.md) judges the
  separation and hands its blocking rows here.
- [Docs Propagation](docs-propagation.md) is the writer for the repository's other documents.
