---
description: Why this convention assumes concurrent actors share the same machine, and the principles and conventions it implements.
when_to_use: Use when deciding whether a git operation is dangerous on a shared machine, or when tracing this convention back to what it implements.
---

# The Same-Machine Assumption, Principles, and Conventions

## The Same-Machine Assumption

Assume the repository is **very active** and that other AI agents, software engineers, and background
processes are working **simultaneously on the same physical machine** — sharing its disk, its git
object database, its refs, its worktrees, and its self-hosted CI runners.

That assumption is what makes these operations dangerous rather than merely blunt. A hard reset in a
solo checkout costs you your own uncommitted work. The same command on a shared machine can discard
work that belongs to someone who never consented to the operation and has no way to recover it — git
keeps no undo history for changes that were never committed.

## Principles Implemented/Respected

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**: Every
  operation listed below is irreversible or rewrites state others depend on. The convention prefers
  reversible moves and requires a deliberate, per-instance decision before an irreversible one.

- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: Reaching for a
  hard reset, a force delete, or a recursive clean is nearly always a symptom — a diverged branch, a
  failing gate, a confused working tree. The convention redirects to the cause instead of normalizing
  the destructive shortcut.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  "Nobody else is working right now" is an implicit assumption an agent cannot verify. The convention
  replaces it with explicit scoping: operate on paths and worktrees you can positively account for.

## Conventions Implemented/Respected

- **[Git Push Safety Convention](../git-push-safety.md)**: The remote-side companion. Its
  [authorized task sync](./001-authorized-task-branch-sync.md) governs routine owned-branch publication.
  Other force-push and hook-bypass operations retain that convention's approval requirements and
  standing exceptions; this convention applies the same protection to local destruction.

- **[Worktree Toolchain Initialization](../worktree-setup.md)**: Establishes the worktree as the unit
  of isolation. This convention states what must never be done to a worktree that is not your own.

- **[Bare-Repo Base-Worktree Landing Method](../bare-repo-landing-method.md)**: The procedure whose
  safety guarantees this convention supplies — every step of that method (worktree removal, the
  terminal reconcile, the refusal to force a ref update) uses the non-destructive equivalent this
  convention prescribes.
