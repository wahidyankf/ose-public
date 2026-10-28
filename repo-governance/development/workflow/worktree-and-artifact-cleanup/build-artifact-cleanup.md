---
description: Scope and exclusions for purging build output produced inside a plan's own worktrees.
when_to_use: Use when deciding what build output to purge, and what to leave alone, during post-merge cleanup.
---

# Build-Artifact Cleanup

Purge only **regenerable** build output — `target/`, `dist/`, `.next/`, and plan-local build caches
— after successful delivery and verified non-use. This covers output produced inside this plan's own
worktrees and the same regenerable output in the primary checkout, which is gitignored and
rebuildable by a documented command. It never covers a `.env*` file or any other local secret: those
are not build output, exist nowhere else in the repository, and are out of scope in every location.
Inventory it before removal. Retain logs, traces, crash dumps, coverage evidence needed for a
failure investigation, and any other non-regenerable diagnostic evidence; record where preserved
evidence lives. Active, `partial`, and `fail` runs retain their build output for resumption or
diagnosis unless a separately verified copy preserves the evidence and the remaining output is
provably regenerable.

Explicitly **skip** the shared cargo `target/` and every other shared cache, and run **no** `git gc`
or `git prune` on the object store. If build output is already gone when this gate runs, that is the
ambient sweeper, not a missed step — record it as swept and move on rather than rebuilding output
solely to delete it. History maintenance is a serialization point on a shared machine
and stays out of the cleanup gate entirely. Container images and volumes are not build output
and are not purged here — they are their own class, scoped by
[Podman-Artifact Cleanup](./docker-artifact-cleanup.md).
