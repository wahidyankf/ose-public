---
description: "Carries one change into every human-facing document it affects in one bounded pass: stale facts corrected, obsolete documents removed, each fact kept in its one home, and the result readable by a newcomer."
when_to_use: "Use automatically before committing a change that alters what a document describes, when adding, moving, or deleting a document, or when the Docs Quality Gate hands over findings."
---

# Docs Propagation

**Purpose**: Keep every human-facing document true to the repository by carrying each change into
the documents it affects, in the same commit as the change.

This is the one bounded writer for documentation. The
[Docs Quality Gate](./docs-quality-gate.md) finds; only propagation writes, so every document edit
is made in one place.

## Entry

A change about to be committed alters what a document's reader relies on, a document is added,
moved, or deleted, or the [Docs Quality Gate](./docs-quality-gate.md) hands over findings. Entry is
automatic: whoever makes the change starts here as part of the work, without a separate request. It
is how the documentation part of
[Feature Change Completeness](../../development/quality/feature-change-completeness.md) is done.
Edits made inside one run start no second one.

## Document Set

Every human-facing document: every README, the `docs/` and `specs/` trees, documents inside
`apps/` and `libs/` projects, the standard root files per
[OSS Documentation](../../conventions/writing/oss-documentation.md), and a plan's documents where
they describe the repository. Governance and agent instructions stay with
[Rules Propagation](../rules/rules-propagation.md). Formatting, links, indexes, and word budgets stay
with the checks the repository already runs; this workflow runs them and adds none.

## Goal and Termination

**Goal**: Every document the change affects is true, reachable, in its one home, and readable by a newcomer

**Termination**: One pass ends `no-change`, `landed`, `partial`, or `input-changed`; it never loops or restarts

## Inputs

- **`change`** (string, required) — The revision range or working-tree change being carried
- **`findings`** (file, optional) — A ledger handed over by the Docs Quality Gate

## Outputs

- **`status`** (enum: no-change, landed, partial, input-changed) — Terminal state of the run
- **`updated-docs`** (file-list) — Documents corrected or added
- **`removed`** (file-list) — Obsolete documents deleted, with the links and index entries that pointed at them
- **`not-run`** (string) — Each command left unexecuted and why

## Contents

- [Sequence and Exit](./docs-propagation/sequence-and-exit.md) — the ten steps, the partial
  outcome, and the rerun guarantee.

## Example Usage

```text
Run docs-propagation for the change on the current branch.
```

## Related Workflows

- [Docs Quality Gate](./docs-quality-gate.md) audits documents, hands its findings here, and audits
  the repaired state again.
- [Plan Establishment](../plan/plan-planning.md) adds this workflow to each delivery unit that
  changes what a document describes.
- [Rules Propagation](../rules/rules-propagation.md) owns governance and agent instructions.

## Principles Implemented

- [Documentation First](../../principles/content/documentation-first.md) — a change is not done
  until its documents say so.
- [Progressive Disclosure](../../principles/content/progressive-disclosure.md) — summaries link one
  level down to their detail.
- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) — one writer,
  one pass, only what is stale.
