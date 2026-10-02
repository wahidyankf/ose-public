---
description: "Defines execution-loop steps 5-8: performing the item, verifying the result, capturing learnings, and the atomic sync ritual."
when_to_use: Use when verifying a delegated agent's work, capturing a learning, or running the atomic sync ritual for one checklist item.
---

# Initial Execution — Verify, Capture, and Atomic Sync

**Continues** [Initial Execution — Execution Loop](./021-initial-execution-loop.md).

1. **Verify the work succeeded** — read the produced file, run the command, check the agent's output. The verification MUST match the acceptance criterion stated in the checkbox (Execution-Grade Clarity rule from the plans convention).
2. **Knowledge Capture — running log (as-you-go)**: append a sanitized entry to `learnings.md`
   whenever this item surfaces a generalizable learning.
   - A workaround invented, a wrong assumption corrected, a tool/CLI quirk discovered, or any
     insight passing the "would the system catch this next time?" litmus qualifies; skip silently
     when no such learning surfaces from this item.
   - Create `learnings.md` (sibling of `delivery.md`) on first use if it does not yet exist; a
     [Bug-Fix Plan](../../../conventions/structure/plans/bug-fix-plan.md) logs in its Learnings section.
   - A defect or peculiarity in a pinned upstream tool is also handled at once under
     [Upstream Tool Defects](../../../development/workflow/upstream-tool-defects.md).
   - See the [Knowledge Capture Convention](../../../development/quality/knowledge-capture.md) for
     entry shape and the secret/sensitivity sanitization rule.
3. **Atomic Sync Ritual** — all three steps before any next-item work:
   a. `Edit` delivery.md to change `- [ ]` → `- [x]` for THIS one item (context-unique `old_string`; never `replace_all`; never tick multiple items in one Edit call).
   b. `Edit` delivery.md to add the implementation-notes block (Date, Status, Files Changed, brief notes) under the ticked checkbox. Notes MUST themselves be repo-grounded — only state files actually modified, only quote commands actually run.
   c. `TaskUpdate completed` on the matching task.
4. Proceed IMMEDIATELY to the next item — no pausing, no waiting for approval, no deferring notes.

Nested sub-checkboxes iterate the same loop. A parent `- [ ]` can only be ticked after all its sub-`- [ ]` items have each completed steps 1–6 of the loop.
