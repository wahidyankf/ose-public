---
name: docs-propagation
description: >-
  Carries one change into every human-facing document it affects in one bounded pass, correcting stale facts and
  removing obsolete ones; the docs family's sole writer.
when_to_use: >-
  Use automatically before committing a change that alters what a document describes, when adding, moving, or deleting a
  document, or when the Docs Quality Gate hands over findings.
---

# Docs Propagation

## Contract

This is the `docs` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

Every human-facing document: every README, the documentation and specification trees, documents inside projects, the
[standard files](../../conventions/writing/oss-documentation.md), and a plan's documents where they
describe the repository. Governance and agent instructions stay with [Rules Propagation](rules-propagation.md). A
handed-over ledger narrows the scope to what its rows require.

## Executor

`docs-fixer`, loading the `docs-authoring-standards` skill.

## Row Verification

A row closes when the document no longer holds the state the row names, every command it shows ran or is marked not
exercised, and the repository's checks exit 0. Each ledger row ends `resolved`, `not-resolved`, `not-applicable`, or
`needs-decision`, with evidence.

## Family Rules

### Entry

A change about to be committed alters what a document's reader relies on, a document is added, moved, or deleted, or the
[Docs Quality Gate](docs-quality-gate.md) hands over findings. Entry is automatic: whoever makes the change starts here,
without a separate request. Edits made inside one run start no second one. Formatting, links, indexes, and word budgets
stay with the repository's checks; this workflow runs them and adds none.

- `change` (`string`, required): the revision range or working-tree change.
- `findings` (`file`, optional): a handed-over, frozen ledger.

### Sequence

1. **Freeze the inputs:** the change, any ledger, the revision, and uncommitted paths. A material change ends the run as
   input changed, never restarting it.
2. **Find what went stale.** Search the whole scope for every name, path, command, flag, version, and interface the
   change removed, renamed, or redefined. Each ledger row is an item too.
3. **Remove what is obsolete.** A document describing something the repository no longer has is deleted, with every link
   and index entry pointing at it. Unique meaning that is still true moves to its canonical home first.
4. **Keep each fact in its one home.** The root README orients; a
   [project README](../../conventions/writing/readme-quality.md) and an
   [index](../../conventions/structure/governance-readme-completeness.md) follow their conventions; a page serves one mode per
   [Documentation Architecture](../../conventions/structure/diataxis-framework.md). A summary links one level
   down to its detail, and a fact with a canonical home is linked, never copied.
5. **Write for a newcomer.** Each affected document tells a reader new to the repository what it is and why it matters
   from the opening, shows the next step without assuming the layout, and leaves no undefined term or skipped
   prerequisite, per [README Quality](../../conventions/writing/readme-quality.md) and
   [Content Quality](../../conventions/writing/quality.md), never a readability score.
6. **Run what is safe to run.** Execute every command and example an affected document shows through the repository's
   declared entry point. Never run one that touches a production or shared system, publishes, spends, needs a secret, or
   cannot be undone; the document says plainly that it was not exercised.
7. **Treat specifications as canonical.** Refresh their readability, navigation, and links; when one disagrees with the
   implementation, the partial outcome applies.
8. **Change only what is stale, missing, or obsolete.** Never rewrite accurate prose, invent behaviour, or fold in
   unrelated work.
9. **Verify once.** Run the repository's existing checks. Repair only failures this run caused, and only while their
   count strictly decreases, per Bounded Convergence.
10. **Hand delivery to the caller.** The run never commits; the repairs land with the change they explain, and a
    handed-over ledger's repairs land as their own commit.

### Exit

Outputs: `status` (`enum`: `no-change`, `landed`, `partial`, `input-changed`), `updated-docs` (`file-list`), `removed`
(`file-list`), and `not-run` (`record`, each command left unexecuted and why).

Partial outcome: when the code, a specification, or the audience is ambiguous or they disagree, that document stays
unchanged and its row is `needs-decision`, asked of its owner; the rest lands. A rerun on unchanged inputs changes
nothing.

## Example Usage

```text
Run docs-propagation for the change on the current branch.
```

## Related Workflows

- [Docs Quality Gate](docs-quality-gate.md) audits documents and hands its blocking rows here.
- [Planning](../plan/plan-planning.md) adds this workflow to each delivery unit that changes what a document describes.
