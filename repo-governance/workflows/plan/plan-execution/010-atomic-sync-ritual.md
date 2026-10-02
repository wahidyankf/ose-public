---
description: Defines the mandatory three-step tick-notes-TaskUpdate sequence that must land together for every completed checklist item.
when_to_use: Use when ticking a delivery.md checkbox, to confirm the tick, notes, and TaskUpdate all land correctly and in order.
---

# Atomic Sync Ritual

For each checklist item, the following three steps happen together, in this order, without interleaving other items' work:

1. **Tick the checkbox**: `Edit` delivery.md to change `- [ ]` → `- [x]` for THIS one item (context-unique `old_string`, never `replace_all` on the whole file). **The tick MUST be its own `Edit`, and its `old_string` MUST include the literal `- [ ]` marker.**
2. **Persist implementation notes** under the ticked checkbox in a separate, immediately-following `Edit` call — Date, Status, Files Changed, brief notes on what was done.
3. **`TaskUpdate completed`** the matching task. The live list now matches disk truth.

If any step fails, roll back the other two: untick the checkbox, remove the notes, leave the task in `in_progress`. The item is treated as incomplete.

**Why step 1 must be a separate Edit anchored on `- [ ]` (HARD)**: when the tick and the notes are written as ONE `Edit` whose `old_string` is the tail of a multi-line checkbox (typically the acceptance clause), the anchor sits **below** the `- [ ]` marker, so the marker is never inside the replaced span. The edit succeeds, the notes appear, the task closes — and disk still says `- [ ]`. **Nothing errors.** This failure is invisible to every signal the executor watches: the Edit tool reports success, the task list looks correct, and the notes are genuinely on disk. Observed accumulating silently across 18 consecutive items before a gate check happened to run `grep -n "^- \[ \]"`. Anchoring the tick on the literal `- [ ]` makes a mis-anchored edit **fail loudly** instead of silently no-op'ing.

**Per-gate assertion**: at every phase gate — not only at plan end — assert `count('- [x]') == count(completed tasks)`. An independent count is the only instrument that detects this class.

**Repairing a silent-tick backlog**: never bulk-tick from memory. Verify each candidate item carries a `**Date**` evidence block bounded by the next checkbox, flip exactly those lines, then diff to confirm the change was purely `[ ]` → `[x]` with no prose touched. Ticking without the evidence check asserts completion from recall rather than from the record.
