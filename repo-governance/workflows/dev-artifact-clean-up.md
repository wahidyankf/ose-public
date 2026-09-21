---
description: "The ordered teardown pass for one repository — pre-removal checks, dev containers, worktree, branches, build output, then the local main reconcile"
when_to_use: "Use when a plan or task has finished with a repository's worktree and the development artifacts it created must come down."
---

# Dev Artifact Clean-Up

Teardown, in order, for one repository. Every rule this workflow applies is stated elsewhere; this
is the sequence, and the point at which it stops.

## Goal and Termination

**Goal**: Remove exactly the development artifacts this work created — Git artifacts and local
container artifacts alike — and leave the primary checkout's `main` level with `origin/main`.

**Termination**: PASS when the dev stacks this session started are down, the worktree and both
copies of every branch are gone, the plan's regenerable output is gone, and the divergence count
reads `0 0`. RETAIN when any required proof is missing — retention is a valid terminal state, not a
failure to finish.

## Scope

The worktree this plan provisioned, the branches it opened, the regenerable build output it
produced, the Docker artifacts it created, the `local-tmp/` scratch it wrote, and the primary
checkout's `main` ref. Nothing else. Scratch means what this work itself wrote — notes, logs,
one-off scripts, intermediate data — never a plan's declared evidence and never another actor's
files. An
artifact another actor created stays out of scope even when it looks abandoned — see
[Hard Safety Rules](../development/workflow/worktree-and-artifact-cleanup/hard-safety-rules.md).

**Never in scope, anywhere:** a `.env*` file or any other local secret. The primary checkout holds
the only copies, and nothing there is removable except regenerable build output.

## Steps

1. **Confirm the terminal gate.** Every delivery unit that used the worktree is delivered, or the
   work is deliberately abandoned. Not between units: one worktree is reused for all of them under
   the [Worktree Cap](../conventions/structure/plans/worktree-cap.md).
2. **Run the pre-removal checks** — all six, before any removal:
   [Mandatory Pre-Removal Checks](../development/workflow/worktree-and-artifact-cleanup/mandatory-pre-removal-checks.md).
3. **Bring down the dev containers this session started**, before touching the worktree:
   [Docker-Artifact Cleanup](../development/workflow/worktree-and-artifact-cleanup/docker-artifact-cleanup.md).
4. **Remove the worktree**, then `git worktree prune`.
5. **Delete the branches**, local and remote, under the proof gate:
   [Branch Cleanup](../development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md), or
   [Patch-Equivalent Branch Cleanup](../development/workflow/worktree-and-artifact-cleanup/patch-equivalent-branch-cleanup.md)
   where the branch carries no change `main` lacks.
6. **Purge regenerable build output**, in the worktree and the primary checkout, preserving
   diagnostics and shared caches:
   [Build-Artifact Cleanup](../development/workflow/worktree-and-artifact-cleanup/build-artifact-cleanup.md).
7. **Remove this work's own scratch** under `local-tmp/`, by the classification above; anything
   unrecognized stays.
8. **Reconcile local `main`.** Choose the command by repository topology —
   [Terminal Reconcile](../development/workflow/bare-repo-landing-method/terminal-reconcile.md) —
   then prove `git rev-list --left-right --count HEAD...origin/main` reads `0 0`.

## Why the Containers Come Down First

Two dev stacks bind-mount the worktree read-write — `infra/dev/ose-app` and
`infra/dev/organiclever-app`. A stack left running holds the directory the next step removes, which
is exactly the idleness condition the pre-removal checks test for. The other order leaves a
container writing into a path that no longer exists.

## Why the Reconcile Is Last

It is documented as step 8 of the
[bare-repo landing method](../development/workflow/bare-repo-landing-method.md), keyed to that
method rather than to teardown. Cleanup is where it is actually reached, and the step most often
missed: it runs in a checkout the merge never touched, so Git reports no error and that checkout is
simply behind until somebody notices. Naming it here does not move the rule — the command and its
topology reasoning stay canonical there.

## Verification

`docker compose ls` no longer lists a project this session started, and `docker ps` shows no
container from it; `git worktree list` no longer names the path; `git branch -a` no longer lists the
branch either locally or on `origin`; this work's scratch is gone from `local-tmp/`; the divergence
count reads `0 0`.

## Retain Rather Than Delete

An artifact belonging to an active, `partial`, or `fail` run is retained and escalated, and the
reason is stated rather than left implied. A missing proof retains the artifact; it never authorizes
a forced deletion. A dev stack whose ownership cannot be proven is left running.

## Related

- [Worktree and Artifact Cleanup](../development/workflow/worktree-and-artifact-cleanup.md) — the convention this workflow sequences.
- [Worktree Toolchain Initialization](../development/workflow/worktree-setup.md) — the provisioning half of the same lifecycle.
- [No Destructive Git Operations](../development/workflow/no-destructive-git-operations.md) — the forbidden-operation set this stays within.
