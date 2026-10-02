---
description: The approval gate that separates mechanical reductions from obligation removal, and the batched hand-off that makes rules-propagation write every approved item.
when_to_use: Use when approving a grooming manifest, or handing approved items to rules-propagation.
---

# Steps 5-6 — Checkpoint and Hand-Off

## Step 5: Human Checkpoint (Sequential)

**Procedure**: Present the ranked manifest with its census baseline and projected metrics delta.
Approval is per class, and the classes are not equivalent:

- **Fragmentation and duplication** — approved as a batch. These change representation only, and
  Step 7's preservation diff is a sufficient check on that claim.
- **Scaffolding** — approved as a batch, but **only against the verbatim text to be deleted**,
  enumerated sentence by sentence in the checkpoint. Unlike the two above, this class makes text
  disappear rather than move, so a reviewer who cannot see the exact sentences is approving a count
  rather than a deletion. Its yield is small enough that enumerating costs nothing.
- **Retirement** — approved **per item**, each with its own evidence and an explicit retirement
  rationale. A batch approval of retirements is not accepted. This is the only class that removes
  an obligation, and a reviewer scanning a list of thirty is not meaningfully approving any of
  them.

**Entry-point authorization cuts across all four.** If an item would delete or hollow a `<name>.md`
naming a workflow, principle, or convention, it needs its own authorization **naming that
document** — whatever class proposed it, and regardless of that class's granularity above. A batch
approval never carries one. Check the candidate set for entry points before presenting it — the
classes are defined by what they reduce, not what they touch, so nothing else here catches it. See
[Refused Reductions](./013-refused-reductions.md).

Record each item as approved, rejected, or deferred, with a reason for every non-approval. A
deferred item stays in the manifest so the next run does not rediscover it as though it were new.

- **Condition**: Skipped entirely when `dry-run` is true — the run ends after Step 4 with the
  manifest as its deliverable.
- **On failure**: No response is not approval. An unanswered checkpoint ends the run at `partial`
  with nothing handed off.

## Step 6: Hand-Off to Propagation (Sequential)

**Workflow**: [rules-propagation](../../quality/rules-propagation.md)

**Procedure**: For each approved subject group, in ranked order, invoke propagation once with the
group's items normalized into its Step 0 intake form: the reduction stated as a falsifiable rule
change, the affected surfaces, the canonical home, and the evidence.

Batching is by subject because propagation tidies by subject. Handing it one item at a time would
make it re-scan the same subject repeatedly; handing it everything at once would produce a delivery
too large to review, which is how a semantic loss slips through a diff.

**Grooming does not write.** It does not stage, commit, push, or open a PR for a rule edit.
Propagation owns the write, the conflict scan, the enforcement disposition, and the delivery.

Propagation's own limits bind every item, and grooming has no authority to relax them:

- It may halt on a higher-layer conflict grooming did not anticipate. Record the halt against the
  item and continue with the next group; do not re-plan the reduction to route around the conflict.
- It may refuse an item as unfalsifiable. Record the refusal; do not restate the item more loosely
  to get it accepted.
- It will not raise a word budget to land a merge. A fragmentation candidate whose merge no longer
  fits is recorded as rejected, and the shard stays split.

A reabsorption item is not "concatenate these files". It carries the six mechanical steps in
[Reabsorption Mechanics](./006-reabsorption-mechanics.md), each of which has broken a run that omitted
it.

- **Args**: Approved manifest items, grouped by subject; the pre-run inventory for reference.
- **Depends on**: Step 5.
- **Output**: Per-group propagation terminal status and PR URL, recorded against each manifest item.
- **Success criteria**: Every approved item carries a propagation terminal status. None is left
  unaccounted for.
- **On failure**: A group that halts does not stop the run. Record it and continue; the run ends at
  `partial`.
