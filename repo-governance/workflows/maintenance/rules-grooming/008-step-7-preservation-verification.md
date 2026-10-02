---
description: The obligation diff and line-containment check that together prove a grooming run removed representation without removing any obligation.
when_to_use: Use when verifying that a completed grooming sweep preserved every obligation.
---

# Step 7 — Preservation Verification

This is the step the whole workflow exists to be able to pass. Every other step is a way of
arriving here with a diff that comes out empty.

**Agent**: `rules-checker`

**Procedure**: Re-run the Step 2 obligation inventory against the post-hand-off corpus under
identical extraction rules, and write it to
`local-tmp/rules-grooming/rules-grooming__<slug>__obligations-post.md`. Diff it against the pre-run
snapshot.

The run passes only if:

- **No obligation disappeared** except those on the approved retirement list. Any other
  disappearance is a semantic loss.
- **No obligation changed** in audience, pass condition, violation condition, qualifier, or
  exception. A changed entry means a reduction rewrote meaning, which no class permits.
- **Every surviving obligation is reachable** from at least one surface that binds its audience. An
  obligation that survives in text but became unreachable is lost in the way that matters.
- **Every `See` link written by a duplication reduction resolves**, and its target covers every
  case the removed text covered.

**Navigation is not obligation.** The inventory must exclude index entries — a bullet or ordered
list item whose text is a link followed by an annotation — and `when_to_use` routing clauses. Both
are pointers to content stated in their target, so counting them makes every legitimate index
update read as an obligation loss. A run that skipped this exclusion reported 12 false losses
against 0 real ones. An obligation found _only_ in an annotation and nowhere in its target is a
governance defect in that pair, reported as a finding rather than absorbed into the count.

**For scaffolding, this diff is also the admission test.** Text carrying no obligation cannot change
the inventory, so a scaffolding deletion that alters it by one entry was misclassified and is
rejected at [Step 3d](./007-scaffolding-admission.md) rather than debated here. The class adds no new
verification instrument — it reuses this one at candidate scale, which is the whole reason it can be
admitted without relaxing anything above.

**Two independent proofs, not one.** For a verbatim-move reduction, also check line-level
containment: every non-frontmatter line of each merged shard must be present in its parent, modulo
the heading demotion and link rewriting Step 6 performs. Containment catches a truncated move that
an obligation diff misses when the lost text carried no obligation modal.

- **Depends on**: Step 6.
- **On failure**: Halt, and identify the propagation delivery that introduced the loss. Reverting
  that delivery is itself a rule edit, so it is handed back to propagation — grooming does not
  revert by writing. The run ends `halted` with the offending item recorded, and the loss is
  reported to the maintainer whether or not the revert lands.

A halt here is a finding about the workflow, not only about the item. Record which class produced
the loss; a class that produces one is a candidate for tightening its admission rule.

## Related

- [Step 8](./009-step-8-governance-verdict.md) — the semantic verdict this run must also clear.
