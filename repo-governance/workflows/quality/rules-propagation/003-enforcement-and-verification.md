---
name: 003-enforcement-and-verification
description: >-
  Gives every propagated rule one enforcement disposition proven in both directions, verifies a propagation run before
  delivery, routing each failure back to the step that owns it, records obligations beyond the repository, and records
  how entry becomes automatic.
when_to_use: >-
  Use during Rules Propagation when deciding how a rule is enforced, or when verifying a run before it is delivered.
---

# Enforcement and Verification

## Three Dispositions

A rule nobody checks reads like governance and binds nothing, so each rule leaves with exactly one disposition, never
silence:

- **Covered.** A named existing check fails on the rule's violating observation. Show it failing on a violating input
  and passing on a conforming one; a check that merely reads the same files is not coverage.
- **Gated.** A new check is declared for the rule where the repository declares its checks, per
  [Automated Quality Gates](../../../development/quality/repository-validation.md). When the check needs
  behaviour not yet built, the declaration records the intent and the implementation is filed as its own work.
- **Unenforced by decision.** A judgement no mechanical check can settle, recorded on the rule with its reason. It is
  rare: when most rules in a run take it, the falsifiability test was applied too gently.

## Verification

1. **Regenerate** every derived surface the edits affect, in the same change as its source.
2. **Run the deterministic gates** over the changed surfaces. Judge each by its exit code, never by a missing failure
   message, and never through a pipe that reports only the last stage's code. A failure present before the run is shown
   to predate it, not assumed to.
3. **Read for closure** once, resolving only conflicts the repair caused, per
   [Minimal Sufficiency](../../../principles/general/simplicity-over-complexity.md). A wider concern found here becomes new input for a
   later run, not this run's blocker.
4. **Reconcile the record** with the repository's reported changes. A changed path the record lacks, often a neighbour a
   formatter touched, is investigated before delivery, never quietly included.

| Failure                   | Returns to              |
| ------------------------- | ----------------------- |
| budget exceeded           | placement               |
| contradiction             | conflict resolution     |
| duplication               | writing and tidying     |
| invalid check declaration | enforcement disposition |

## Never End a Run By

- softening an unfalsifiable rule into guidance so it can be written;
- recording an unclear or blank disposition;
- raising a ceiling, or adding an exemption, so a placement fits;
- dropping or loosening any obligation, audience, scope, exception, or condition to satisfy a word count;
- calling a finding pre-existing, or this run's, without evidence of when it began.

## Beyond This Repository

A rule portable across a declared parity boundary records its sibling obligation per
[Related Repositories](../../../conventions/structure/related-repositories.md), or records none with why. A repository
adopting from a shared catalog proposes a rule that holds beyond itself to that catalog, through the catalog's own
delivery, published only after the catalog's outbound-safety screen passes.

## Adopter Decision: How Entry Becomes Automatic

- **Root instruction file:** a route before any rule edit; it needs no tooling but relies on being read.
- **Commit-time notice:** names this workflow whenever a staged path carries rules, reaching every editor; it reports
  without blocking, since a hook cannot judge semantic decisions.
- **Editor pre-edit trigger:** the same notice earlier, in one harness; a convenience that can be switched off.

Record the routes taken and the delivery route. Every trigger reads one recorded list of rule-bearing paths.
