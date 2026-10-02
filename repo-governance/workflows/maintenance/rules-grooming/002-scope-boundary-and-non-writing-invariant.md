---
description: The four admitted candidate classes, the reductions explicitly refused, and why this workflow hands every edit to rules-propagation instead of writing.
when_to_use: Use when checking whether a proposed reduction is in scope, or why this workflow does not write.
---

# Scope Boundary and the Non-Writing Invariant

## The Four Admitted Classes

A candidate is admissible only as one of these. The class determines its semantic risk, and
therefore its ranking and its approval path.

1. **Fragmentation overhead** — representation cost created by splitting, not by content. A shard
   whose parent has budget headroom to reabsorb it; a shard folder holding a single child; an index
   entry longer than the document it points at; frontmatter keys beyond those a consumer actually
   reads. Merging these changes no obligation, so the class carries **zero** semantic risk.
2. **Cross-surface duplication** — one obligation stated on two or more surfaces without a recorded
   keep rationale. The reduction keeps the canonical home and replaces the rest with `See` links.
   Risk is **low but non-zero**: the link target must already cover every case the removed text
   covered, per forbidden anti-fix 4.
3. **Non-normative scaffolding** — prose stating no obligation: meta-narration announcing what a
   document covers, a preamble restating its own heading, a transition adding no condition. The
   class **deletes only**. It never rewrites a sentence, only removes one carrying nothing. Risk is
   **low and mechanically bounded** — text carrying no obligation must leave Step 7's extracted
   inventory byte-identical, so that existing diff is the admission test rather than a second
   judgement. Runs by default, but **measured unproductive**: its one sweep found ~5 safely
   removable lines in 163,867. Expect near-nothing from it.
4. **Retirement** — a rule whose subject no longer exists, that a later rule supersedes in fact but
   not in text, or that no surface reaches. This is the only class that removes an obligation, so
   every candidate is gated per item at Step 5. It discovers by default like any other class;
   nothing it finds is removed without its own approval and recorded rationale.

## Refused Reductions

Six reductions are out of scope permanently, not merely deprioritized — see
[Refused Reductions](./013-refused-reductions.md).

## The Non-Writing Invariant

Propagation is the sole writer of every rule edit, and grooming does not become an exception to
that by having found the edit itself. Grooming produces a manifest; propagation writes.

Three things follow, and each is a reason the split is worth its cost:

- **Conflict scanning stays pre-write.** Propagation scans for contradictions under layer-aware
  precedence before it writes. A grooming merge that would collide with a higher-layer rule is
  caught by the same scan that catches an authored one, rather than by a second mechanism that
  would have to be kept in step with it.
- **Enforcement dispositions stay recorded.** Every rule edit carries one of propagation's three
  dispositions. Reductions are rule edits, so they carry one too.
- **The workflow graph stays acyclic.** Grooming calls propagation; propagation never calls
  grooming. Neither calls the quality gate.

The cost is real — a large sweep becomes many propagation deliveries rather than one — and Step 6
batches by subject to contain it. The invariant is not traded away for that convenience.
