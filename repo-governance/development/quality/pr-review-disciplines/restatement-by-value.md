---
description: "The single largest defect class measured in this loop — one fact written in more than one place and edited in one of them — and why deleting the duplicate is the fix and syncing it is not."
when_to_use: "Use when a finding reports two documents disagreeing, or when a fix would update the same fact in more than one file."
---

# Restatement by Value

One fact stated in more than one place, edited in one of them. It produced 38% of all findings
measured on PR #249 — a larger share than defects in the change itself.

It survives review of a single diff, because every file that changed was changed correctly. It
fails later, when something reads the copy that did not change.

## Recognising It

The finding reads "document A says X, document B says not-X", and both were true when written.
Recurring shapes:

- a count in prose beside the list whose length is the fact
- an index annotation summarising a shard that has since been rewritten
- a rule restated in a skill and in the workflow that skill implements
- a routing rule restated on the sending agent and the receiving one

## Reduce the Count, Do Not Sync It

A fix updating both copies leaves two copies, and the next edit re-diverges them. That has happened
twice on this pipeline to the same pair of files.

In order of preference:

1. **Delete the restatement.** A count beside the thing counted is never needed. A rule restated for
   convenience is replaced by a link to the document that owns it.
2. **Derive it**, so the copy cannot drift from its source.
3. **If it must be restated, say which copy governs**, so a reader meeting a disagreement knows
   which side is wrong.

Syncing without reducing is a `fix` that produces the next cycle's finding.

## When the Duplicate Is Mandated

A convention sometimes requires the second copy.
[governance-readme-completeness.md](../../../conventions/structure/governance-readme-completeness.md)
keeps a `<dir-name>.md` parent "audited as a second index over the same contents" its `README.md`
indexes — two annotated indexes over one set, by design. Option 1 is unavailable there and option 2
usually is too.

Option 3 then applies, and it has to be written rather than assumed: name which copy governs, **in
both copies**, so the next editor knows where to edit and a reader meeting a disagreement knows
which side is wrong. A mandated duplicate is not exempt from this class. It is the shape of it that
recurs most, precisely because nobody is allowed to delete it.

## Naming It

A reviewer who finds two documents disagreeing reports the restatement, not only the disagreement,
and names every site of the fact — so the fixer decides which copies to delete rather than which
one to edit.

## Enforcement

None automated. A violation is visible as two surfaces stating one fact, where editing either
leaves the other true-looking and wrong.
