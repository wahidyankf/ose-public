---
description: Defines how execution rebuilds the action-level Task list from delivery.md on every entry or re-entry, including a first invocation after work already began.
when_to_use: Use whenever plan execution starts or resumes, including mid-run invocation, handoff, compaction, or Task-list/checkbox disagreement.
---

# Resume Reconciliation (disk is truth)

Whenever execution begins or re-begins—including the first invocation after checklist work already
happened—disk state wins. Reconciliation is a mandatory entry gate:

1. Re-read canonical instructions, restore every active user-established repository-rule decision
   from durable continuation state, and reconcile statement, scope, source, and status. Stop on any
   unresolved conflict. Then read delivery.md top-to-bottom.
2. Parse every action checkbox; Input/Outcome/Proof and other section prose are context. Treat
   separate RED, GREEN, and REFACTOR checkboxes as separate actions.
3. For every `- [x]`, count it as done and require one matching completed task when the harness
   retains completed history. Never re-execute it merely to recreate a task.
4. For every `- [ ]`, `TaskCreate` exactly one open task in reading order.
5. Audit the full bijection: no action without a task, no task without an action, no duplicate
   mapping, and task status agrees with checkbox state. At minimum, remaining-checkbox count equals
   plan-mapped open-task count.
6. If stale tasks from a prior run disagree with disk, discard the stale mapping and rebuild from
   current `delivery.md` before any implementation tool call.
7. Flag any `- [x]` lacking implementation notes — possible silent batch-tick; the user may want to audit before continuing.
8. **Resolve the plan path against the worktree, not the primary checkout.** For any plan whose delivery mode provisions a dedicated worktree (`worktree-to-pr`, `worktree-to-origin-main`), the worktree's copy of the plan folder is the ONLY authoritative on-disk location — it is the copy on the branch that becomes the PR. A same-named plan folder may still exist under the primary checkout's `plans/in-progress/` (e.g., left over from before the worktree was provisioned); reading or editing that copy instead is a silent-divergence trap — edits there never reach the branch, since the primary checkout isn't what gets pushed. If the same plan folder exists with uncommitted changes in BOTH the primary checkout and the worktree, treat it as a hard anomaly: stop, reconcile which content is accurate (verify independently against commit history / PR state, don't assume either copy), merge the genuinely-verified content into the worktree's copy, and flag the primary checkout's stray copy to the user for cleanup.

9. **Rebuild the file-touch ledger before touching anything.** Disk-is-truth settles _what is done_; it does not settle _who did it_. A resumed run sees a dirty tree that may mix your prior work with a concurrent actor's, and the delivery checklist cannot distinguish them. Recover your ledger from the plan's implementation-notes `Files Changed` blocks and your session transcript. Until it is rebuilt, treat every modified and untracked path as foreign — no staging, no reverting, no cleanup. See [File-Touch Discipline](../../../development/practice/file-touch-discipline.md).

## Divergence handling

If statuses disagree, a checkbox/task lacks its counterpart, or more than one task maps to one
action, state is inconsistent. Stop, rebuild from disk, prove the bijection, then resume.
