---
description: Defines the executor's enter/sync/cleanup lifecycle for a plan's worktree and shows a worked `## Worktree` block.
when_to_use: Use when implementing or auditing worktree entry, sync, and cleanup behaviour.
---

# Worktree Specification — Executor Lifecycle and Example

Continues [Worktree Specification](./worktree-specification.md).

**Worktree-mode executor lifecycle** (enforced by the plan-execution workflow; main modes skip
provisioning and use the synced primary checkout):

1. **Enter or provision**: for a worktree mode, execution happens inside the declared worktree. Enter
   it if present, or provision it from fresh `origin/main`. Reuse that same worktree for every unit;
   never provision a second one for the repo and plan. A main mode instead stays in the primary
   checkout and provisions none.
2. **Freshness sync**: before any implementation, the worktree is synced with the latest `origin/main` (ff-merge, or rebase when the worktree carries local commits). Dirty state or rebase conflicts stop execution for an explicit user decision. Starting a new delivery unit inside an already-provisioned worktree runs this same sync before branching off it.
3. **Immediate cleanup**: when every delivery unit this plan places in a repo is confirmed delivered,
   resolve its declared repository-relative route against the selected repository root, reconcile
   the resulting runtime path with `git worktree list --porcelain`, then use the Delivery Branch
   Inventory and canonical mandatory pre-removal checks.
   Each PR-mode branch needs the canonical merged-PR/head proof plus either a matching live
   `origin/<branch>` tip or a verified GitHub automatic-deletion event when that repository enables
   it; any other missing/mismatched proof retains the worktree and escalates. Only then remove that
   self-created worktree without another prompt. Purge only plan-local regenerable build output and
   preserve diagnostics/shared caches; in a bare repository, clean verified live remote branches
   from inside the worktree before removal when hooks require a working tree. Then use non-force
   `git worktree remove`, complete canonical branch cleanup, and `git worktree prune`. If any check
   fails, retain it with evidence and escalate. Never remove on `partial`/`fail`. For a multi-unit
   plan, the shared worktree is removed once, after every delivery unit that used it has landed.

**Every new formal plan declares the mode-resolved work location regardless of size** — pure-docs
plans included.

For the narrow authoring-worktree exception, replace the provisioning sentence with the pending
status, active authoring worktree, user constraint, and Step 0 blocking obligation. Do not include
placeholder identity or inventory values as though provisioning already happened.

See [Worktree Path Convention](../worktree-path.md) for the full routing and directory structure specification.

**Example `## Worktree` block** (delivery.md or README.md):

````markdown
## Worktree

Worktree path: `worktrees/auth-rewrite/`

Provisioned before this plan was written (run from repo root):

```bash
claude --worktree auth-rewrite
```

The plan-execution Step 0 gate enters this worktree by default: it auto-provisions from the latest
`origin/main` when missing, records its repository-relative identity, syncs with `origin/main` before
implementing, and removes the runtime path resolved from that route immediately after delivery when
its mandatory safety checks pass.
````
