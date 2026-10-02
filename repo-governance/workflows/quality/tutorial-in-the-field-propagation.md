---
name: tutorial-in-the-field-propagation
description: >-
  Repairs the mechanical rows of a frozen in-the-field guide ledger, making code production-complete and leaving
  architectural and teaching choices to the author; the tutorial-in-the-field family's sole writer.
when_to_use: >-
  Use when the Tutorial In the Field Quality Gate hands over a frozen ledger, or when someone explicitly names rows of
  one to repair.
---

# Tutorial In the Field Propagation

## Contract

This is the `tutorial-in-the-field` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

The guides and guide code the gate froze. Their prose, facts, and links belong to
[Content Propagation](content-propagation.md).

## Executor

`tutorial-in-the-field-fixer`, loading the `docs-creating-in-the-field-tutorials` skill. Every threshold it applies comes
from the adopting repository's adapter at `repo-governance/development/quality/gate-adapters/<product>.md`, cited by
name; the fixer holds no threshold of its own, so the gate and its writer can never disagree on one.

## Row Verification

A row closes when rereading the guide shows the row's target state, each edited step still runs as written and shows the
output it produced, and a density row's recount falls within the adapter's band. Each ledger row ends `resolved`,
`not-resolved`, `not-applicable`, or `needs-decision`, with evidence.

## Family Rules

### Entry

The [Tutorial In the Field Quality Gate](tutorial-in-the-field-quality-gate.md) hands over a frozen ledger, or an
explicit request names its rows.

- `findings` (`file`, required): the frozen ledger, each row naming its guide and step.

### Sequence

1. **Make code production-complete** where the row names the gap: handle an ignored error, release a resource on every
   path, move a hardcoded value into configuration, or replace a credential with a placeholder, per
   [No Secrets in Tracked Files](../../conventions/security/no-secrets-in-committed-files.md).
2. **Repair what the step itself settles:** a missing output, an unexplained command or flag, or annotations added or
   trimmed to bring density within the band.
3. **Leave architecture and pedagogy to the author.** Reordering a guide so the built-in approach comes first, writing a
   missing limitations or trade-off section, choosing another production pattern, and adding guides or diagrams to reach
   a band need new content or an architectural decision, so each is `needs-decision`.
4. **Run each edited step** in an environment matching the scenario, then verify each row.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`) and the ledger, each row with its status
and evidence. A person reviews the `needs-decision` rows after the verdict, never inside a cycle. The caller commits the
repairs. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run tutorial-in-the-field-propagation with the ledger the gate froze for learn/golang/in-the-field.
```

## Related Workflows

- [Tutorial In the Field Quality Gate](tutorial-in-the-field-quality-gate.md) judges the guides and hands its blocking
  rows here.
