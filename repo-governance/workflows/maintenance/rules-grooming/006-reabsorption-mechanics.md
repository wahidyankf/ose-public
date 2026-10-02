---
description: The packing limits that decide which shards may be reabsorbed, and the six mechanical steps a reabsorption must carry to avoid breaking its parent.
when_to_use: Use when admitting a reabsorption candidate at Step 3a, or executing one at Step 6.
---

# Reabsorption Mechanics

Shared by [Step 3a](./004-steps-3-4-candidate-discovery-and-ranking.md) (which admits a candidate) and
[Step 6](./005-steps-5-6-checkpoint-and-handoff.md) (which hands it to propagation).

## The Two Packing Limits

Both are load-bearing, and a run that drops either produces a worse corpus than it started with.

**Pack per parent, not per shard.** Test the whole sibling set against one budget, smallest shard
first. Testing each shard against the parent alone counts the same headroom repeatedly: on the
2026-09-07 census 811 shards fit individually while only 226 fit once packed — a 3.6×
overstatement.

**Pack to 80% of the parent's budget, not to the ceiling.** The
[word-budget convention](../../../conventions/structure/governance-word-budget.md) makes thresholds
capacity ceilings, "not desired lengths or permission to fill the available space". Filling a
parent to its ceiling satisfies the letter of the budget while destroying the headroom the budget
exists to protect, and the next rule that belongs in that parent then has nowhere to go. On the same
census, packing to the ceiling would have left 52 parents above 90% of budget; packing to 80%
merged 99 shards and left none.

The second limit costs yield deliberately — 99 shards rather than 226. A reduction that consumes
every parent's growing room is not a reduction worth making.

## What a Reabsorption Must Carry

A merge is not a file concatenation. Each of these has broken a run that omitted it:

1. **Demote every heading** in the moved body by one level, skipping fenced code.
2. **Re-express every relative link** from shard-relative to parent-relative.
3. **Repair what the move surfaces.** A link already broken stays broken under that rewrite;
   inlining merely makes it visible to the index gate. Repair it — do not revert the merge, and do
   not treat a newly-visible defect as one the merge caused. One run surfaced six such links that
   had sat latent inside shards, invisible because the gate inspects index references rather than
   shard bodies.
4. **Remove the index entry from both surfaces** — the parent's `Contents` and the folder
   `README.md` — in **both bullet and ordered-list form**. Matching only `- [` leaves a live link
   to a deleted file.
5. **Renumber any ordered list** the removal disturbed.
6. **Delete the shard only after** Step 7's preservation check passes on the merged text.

## Related

- [Steps 3-4](./004-steps-3-4-candidate-discovery-and-ranking.md) — the admission rules these serve.
- [Steps 5-6](./005-steps-5-6-checkpoint-and-handoff.md) — the hand-off that carries them.
- [Step 7](./008-step-7-preservation-verification.md) — the proof they worked.
