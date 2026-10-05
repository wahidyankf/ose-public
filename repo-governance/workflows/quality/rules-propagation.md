---
name: rules-propagation
description: >-
  Writes a rule being added, changed, moved, or removed as one bounded transaction: a falsifiable statement, a conflict
  scan, one canonical home, an enforcement disposition, and verification; the sole writer for the rules family.
when_to_use: >-
  Use automatically before any rule is added, changed, moved, or removed, or when rules grooming or a rules quality gate
  hands over findings.
---

# Rules Propagation

## Contract

This is the `rules` family's sole writer, under
[Sole-Writer Propagation](../../development/workflow/sole-writer-propagation.md).

## Scope

Every rule-bearing location that [Rule Definition](../../conventions/writing/conventions.md) names, plus the derived
surfaces regenerated from them. A handed-over ledger narrows the scope to what its rows require.

## Executor

`rules-fixer`, loading the `repo-propagating-rules` skill.

## Row Verification

A row closes when its rule sits in one canonical home, its conflicts are resolved by level, it carries one enforcement
disposition, and the deterministic gates over the changed surfaces exit 0, per
[Enforcement and Verification](rules-propagation/003-enforcement-and-verification.md). Each ledger row ends `resolved`,
`not-resolved`, `not-applicable`, or `needs-decision`, with evidence.

## Family Rules

### Entry

A rule, as [Rule Definition](../../conventions/writing/conventions.md) defines one, is about to be added, changed,
moved, or removed, or [Rules Grooming](../maintenance/rules-grooming.md) or the
[Rules Quality Gate](rules-quality-gate.md) hands over findings. Entry is automatic: whoever proposes or detects the
change starts here, without a separate request. Edits made inside one run start no second one.

- `rules` (`string`, required): each rule as stated, with its reason.
- `findings` (`file`, optional): a handed-over, frozen ledger.
- `dry-run` (`boolean`, optional, default `false`): record placements without writing.

### Sequence

1. **Freeze the inputs:** each rule with its reason, strength, scope, and enforcement, plus the revision and uncommitted
   paths, kept through compaction. A material change ends the run blocked.
2. **Make each rule falsifiable,** one obligation per statement with the observations that show it followed and
   violated, per [Statement and Conflict](rules-propagation/001-statement-and-conflict.md). A rule that stays
   unfalsifiable halts alone, and the rest of the batch continues.
3. **Stop where the rules already suffice.** When existing rules carry the meaning in full, record their source and end
   that rule with no change.
4. **Resolve conflict by level,** per [Governance Layers](../../repository-governance-architecture.md): a lower
   rule is amended to agree, a same-level or unclear contradiction goes to the owner, and a new rule contradicting a
   higher one halts. Record every supersession.
5. **Place each rule on the narrowest surface that reaches its audience,** per
   [Placement](rules-propagation/002-placement.md). No ceiling rises for a placement; a full surface relocates its
   weakest entry in the same change.
6. **Write and tidy the subject.** Keep one canonical statement, merge unique meaning into it, and replace copies with
   links. A budget may move a rule but never generalize or drop its obligation, audience, scope, exception, or
   condition. A wrong rule is corrected here, never worked around, and an adapted rule records what changed and why.
   Under `dry-run`, steps 6 to 9 record without writing.
7. **Give each rule one enforcement disposition,** covered, gated, or unenforced by decision, per
   [Enforcement and Verification](rules-propagation/003-enforcement-and-verification.md).
8. **Verify** by exit codes rather than output, returning a failure to the step that owns it, and repair findings the
   run caused only while their count strictly decreases, per
   Bounded Convergence.
9. **Hand delivery to the caller.** The run never commits; the work in hand delivers through the repository's own
   route, stating each rule's home, disposition, and relocations. It records no obligation for another repository;
   shared-catalog proposals follow
   [Enforcement and Verification](rules-propagation/003-enforcement-and-verification.md#beyond-this-repository).

### Exit

Every rule ends with no change, landed, recorded under `dry-run`, or halted, and nothing is written but unaccounted for.

Outputs: a placement record (`file`, in the repository's scratch location) and `status` (`enum`: `no-change`, `landed`,
`recorded`, `partial`, `halted`, `blocked`). Partial outcome: some rules landed while others halted, each named with its
blocker. A rerun on unchanged inputs changes nothing.

## Example Usage

```text
Run rules-propagation with rules "Every script that deletes files offers a dry run, because deletion cannot be undone."
```

## Related Workflows

- [Rules Grooming](../maintenance/rules-grooming.md) hands over reductions.
- [Rules Quality Gate](rules-quality-gate.md) hands over findings.

## Modules

1. [Statement and Conflict](rules-propagation/001-statement-and-conflict.md)
2. [Placement](rules-propagation/002-placement.md)
3. [Enforcement and Verification](rules-propagation/003-enforcement-and-verification.md)
