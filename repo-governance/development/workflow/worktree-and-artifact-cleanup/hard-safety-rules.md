---
description: The rules bounding every action the cleanup gate takes — self-created only, verify before deleting, never touch shared caches.
when_to_use: Use when deciding whether a specific cleanup action is in-scope for a plan to perform.
---

# Hard Safety Rules

These bound every action the gate takes.

- **Every merged PR triggers it, not only plan deliveries.** Whatever produced the branch — a plan
  phase, a rules propagation, a hotfix, a one-off — cleanup runs in the session that merged it,
  before that session ends. Deferring is what accumulates the branch backlog this convention exists
  to prevent, and "it was not a plan" is not an exemption.
- **Self-created only.** Delete only what this plan created. Anything else requires positive evidence
  it is idle — not merely the absence of evidence that it is busy.
- **Bounded cache exception.** An exact ignored, nonshared cache such as `.fvm-cache/` may be scratch even when
  another task created it, but only after recorded regeneration, non-use, and secret-free evidence. This never makes
  a shared cache removable.
- **Verify not in use before deleting.** Check, then delete. When in doubt, leave it. An artifact left
  behind costs disk; an artifact wrongly deleted costs someone else's work.
- **Never delete a shared cache.** In particular, the **shared cargo `target/` directory** — the
  symlinked shared build output introduced by the
  [`rust-cargo-target-dir-sharing`](../../../../plans/done/2026-07-19__rust-cargo-target-dir-sharing/)
  plan — is depended on by concurrent builds in every other worktree. Removing it breaks them. The
  same reasoning applies to any shared cache: if another session can be relying on it, it is out of
  scope for a plan-scoped cleanup. This binds **agents**, and it is not contradicted by the ambient
  sweeper described in the [Build-Artifact Sweeper Convention](../../infra/build-artifact-sweeper.md),
  which may remove the same shared cache on its own schedule. A cache you must not delete can still
  disappear; that is the environment, not a rule violation by another actor.
- **A dev container stack is shared state.** A Compose project name derives from its
  `infra/dev/{app}` directory and every dev stack binds fixed host ports, so one stack is identified
  machine-wide rather than per worktree — `docker compose down` reaches whatever session actually
  started it. Bring down only a stack this session started, on positive evidence, and leave it
  running when ownership cannot be proven. Machine-wide reclaim — `docker system prune`,
  `image prune -a`, `volume prune` — stays out of the gate for the same reason `git gc` does. See
  [Docker-Artifact Cleanup](./docker-artifact-cleanup.md).
- **Preserve diagnostic evidence.** Logs, traces, crash dumps, coverage output used to explain a
  failure, and any other non-regenerable evidence stay in place or move to an explicitly recorded
  evidence location before cleanup. An active, `partial`, or `fail` run retains its artifacts; a
  desire to reclaim disk never outranks diagnosis or resumption.
- **In the primary checkout, only build output is removable.** Every other removal targets a worktree the plan provisioned or a branch it created. The primary checkout holds the
  repository's only copies of gitignored `.env*` files and local infrastructure state — a worktree
  provisioned from `origin/main` carries none of them — so a deletion there is unrecoverable. Regenerable build output is the one exception: it is gitignored and rebuildable by a
  documented command, and the ambient sweeper already removes it there. The exception excludes the shared
  cargo `target/` and every other shared cache, and the default branch is never deleted.
- **Never delete a secret-bearing file or directory.** `.env`, `.env.local`, every other `.env*` file, and any
  local credential or infrastructure-state file sit outside every artifact class this gate removes.
  They are gitignored and unregenerable — nothing in the repository reconstructs one — so deleting
  one is permanent loss of the operator's own configuration, not a reclaimed artifact. This holds
  for a file inside a worktree the gate is removing, which is part of why removal is non-force:
  `git worktree remove` refuses while untracked files remain, and that refusal is a retain signal,
  never something to override.
- **Cleanup is itself non-destructive to others.** The gate may not use any operation that a
  concurrent actor could be harmed by. It removes; it never force-removes, rewrites, or prunes shared
  state.
