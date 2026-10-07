---
description: Mandatory post-merge gate requiring safe removal of self-created worktrees, eligible branches, plan-local regenerable build output, and session-started Docker artifacts while preserving diagnostics and shared state.
when_to_use: Use when a plan that created worktrees, branches, build output, or dev containers is finishing and needs to tear them down.
---

# Worktree and Artifact Cleanup Convention

A plan that creates worktrees, branches, plan-local regenerable build output, and dev container
stacks must remove them when it finishes. This is the **teardown** half of the worktree lifecycle; provisioning and
toolchain initialization are covered separately. Diagnostic evidence, shared caches, ambiguous
state, and artifacts still needed by an active, `partial`, or `fail` run are retained and escalated.

Cleanup is a **mandatory gate**, not a courtesy. It is also the one gate most likely to cause harm if
executed carelessly, because every action it takes is a deletion. The whole convention exists to make
that combination safe: delete thoroughly, delete only what is yours, and verify before each removal.

**Cleanup is immediate after the terminal gate, not deferred.** A plan is done using a repository's
four eligible artifact classes only when every delivery unit is confirmed delivered, replacement
exact-head proof exists where applicable, the workflow-owned terminal audit is recorded as passing
in `{final-report}`, final status is `pass`, and the identity, clean/idle, no-unpushed, and
artifact-safety checks pass. Clean right then, not in an unrelated later batch. A terminal-audit gap
retains the artifacts and reopens execution. Under the
[Worktree Cap](../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule),
a single-repo plan's "done using it" coincides with plan-end; a multi-repo plan's does not — each
repo reaches this terminal gate independently of whether the plan's other repos are still in flight.

**No confirmation prompt is required for an exact, self-created plan worktree.** Once all mandatory
pre-removal checks pass, the AI executor removes the runtime path resolved from the plan's declared
repository-relative route immediately. This authority never extends to a repository root, wildcard,
worktree absent from the plan's Provisioned Worktree Identity, or worktree created by another actor;
those remain out of scope. The resolved host path is runtime evidence, never committed plan content.

## Contents

- [Principles and Conventions Implemented](./worktree-and-artifact-cleanup/principles-and-conventions-implemented.md) — Why this gate exists.
- [Why This Is a Gate](./worktree-and-artifact-cleanup/why-this-is-a-gate.md) — Disk, ref namespace, and stale-state risk on a shared machine.
- [The Four Artifact Classes](./worktree-and-artifact-cleanup/the-four-artifact-classes.md) — Worktrees, branches, build output, Docker artifacts.
- [Hard Safety Rules](./worktree-and-artifact-cleanup/hard-safety-rules.md) — Self-created only, verify before deleting, never touch shared caches.
- [Mandatory Pre-Removal Checks](./worktree-and-artifact-cleanup/mandatory-pre-removal-checks.md) — The six checks before any `git worktree remove`.
- [Branch Cleanup](./worktree-and-artifact-cleanup/branch-cleanup.md) — Deleting merged local and remote branches safely.
- [Patch-Equivalent Branch Cleanup](./worktree-and-artifact-cleanup/patch-equivalent-branch-cleanup.md) — Deleting a branch that carries no change `main` lacks, or a stale task branch after preserving its tip.
- [Build-Artifact Cleanup](./worktree-and-artifact-cleanup/build-artifact-cleanup.md) — Purging plan-local regenerable output while preserving diagnostics and shared caches.
- [Docker-Artifact Cleanup](./worktree-and-artifact-cleanup/docker-artifact-cleanup.md) — Bringing down session-started dev stacks and locally built images, before the worktree goes.

**Enforcement.** `plan-execution-checker` verifies that successful delivery evidence covers all
four artifact classes and that diagnostic/shared-state protections held. Live worktree identity,
branch delivery, forge events, idleness, and artifact ownership remain AI-verifier coverage because
a deterministic repository-local check cannot authenticate that operational state.

## Related Documentation

- [Worktree Toolchain Initialization](../workflow/worktree-setup.md) — the setup half of the same lifecycle.
- [Temporary Files Convention](../infra/temporary-files.md) — the build-artifact and temporary-file taxonomy.
- [No Destructive Git Operations Convention](../workflow/no-destructive-git-operations.md) — the forbidden-op set this gate stays within.
- [File-Touch Discipline](../practice/file-touch-discipline.md) — distinguishes a plan's own artifacts from another actor's.
- [Git Push Safety Convention](../workflow/git-push-safety.md) — the remote-side companion; branch deletion is gated here, not there.
- [Build-Artifact Sweeper Convention](../infra/build-artifact-sweeper.md) — the environment-side counterpart that runs on its own schedule.
- [Agent Workflow Orchestration Convention](../agents/agent-workflow-orchestration.md) — cleanup is the DAG's terminal node.
