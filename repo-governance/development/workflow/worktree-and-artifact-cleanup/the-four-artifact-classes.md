---
description: The four eligible artifact classes cleanup covers while retaining diagnostics and shared state.
when_to_use: Use when checking that a cleanup covers all four artifact classes, not just the first.
---

# The Four Artifact Classes

A complete cleanup covers all four. Stopping after the first is the common failure.

1. **Worktrees** — the working directories this plan created.
2. **Branches** — plan-created local and remote branches with delivery and no-unpushed proof. See
   [Branch Cleanup](./branch-cleanup.md#branch-cleanup).
3. **Regenerable build output** — `target/`, `dist/`, `.next/`, and plan-local build caches, in this
   plan's own worktrees and in the primary checkout, excluding diagnostics, shared caches, and every
   `.env*` file or other local secret.
4. **Docker artifacts** — the Compose stacks this session started and the images it built locally,
   excluding pulled base images, named data volumes, and any stack another session owns. See
   [Docker-Artifact Cleanup](./docker-artifact-cleanup.md).

Alongside them, remove the scratch this plan wrote under `local-tmp/`, never another actor's; see
[`local-tmp/`](../../infra/temporary-files/local-tmp-directory.md).

Class 4 comes down **first** in execution order, because a running dev stack bind-mounts the
worktree that class 1 removes.
