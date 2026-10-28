---
description: Scope and exclusions for bringing down the Podman artifacts a session created, how to remove leaked test containers, and why a dev stack is shared machine state.
when_to_use: Use when deciding which Podman containers, images, and volumes to remove, and which to leave running, during post-merge cleanup.
---

# Podman-Artifact Cleanup

Bring down only the Podman artifacts **this session started or built**: the Compose stacks it
brought up, the containers, networks, and anonymous volumes those projects created, and the images
it built locally for them. Inventory before removal, as for every other class.

Run this **before** the worktree is removed. `infra/dev/ose-app` and `infra/dev/organiclever-app`
bind-mount worktree paths read-write, so a running stack holds the directory the next step deletes.

## A Dev Stack Is Shared Machine State

A Compose project name derives from its `infra/dev/{app}` directory, and every dev stack binds fixed
host ports. Both are identical in every worktree of every checkout on the machine, so a dev stack is
identified machine-wide and **not** per worktree. `podman compose down` from here brings down
whatever session started that stack.

Tear down only a stack this session started. Ownership needs positive evidence — the command in this
session's own history, or a container whose start time falls inside it. When ownership cannot be
proven, leave the stack running and say so. This is the
[self-created-only rule](./hard-safety-rules.md) applied to containers, for the same reason as a shared cache.

## What Is Retained

Retain pulled base images — `docker.io/library/postgres:17-alpine`, language runtimes, anything another worktree or a
local CI run would have to re-pull. Retain named volumes carrying dev data: `podman compose down`
without `-v` is the default, and `-v` requires that the volume hold disposable data this plan
created and that no other session shares the stack. Retain every project this session did not start,
and retain the artifacts of an active, `partial`, or `fail` run for resumption or diagnosis.

Session-created anonymous volumes are removed by exact id once unused and proven by a before/after snapshot; otherwise they are reported.

Docker-engine resources are out of scope for this gate. It never stops or removes them, including any
Docker-engine volumes or exports, which stay until a separately authorized cleanup.

## Leaked Test Containers

A **leaked test container** is a container, volume, or network that a task's test or dev run created
and that outlives the run. A run killed before its own teardown, such as one shed by HIPPO, leaks
one. Leaked containers hold memory until they stop; on macOS they hold it in the Podman VM,
and HIPPO then defers unrelated work with `memory-warning` or exit 124.

Detect them read-only. `$ROOT` is the task's checkout or worktree; a repository may also declare a
name prefix:

```bash
for n in $(podman ps -a --format '{{.Names}}'); do
  w=$(podman inspect "$n" --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}')
  case "$w" in "$ROOT"|"$ROOT"/*) echo "$n";; esac
done
```

Confirm these label keys against `podman-compose` 1.6.0 before relying on them (runtime proof pending).

Remove only those names, then re-run the listing and expect zero. `<project>` is the container's
`com.docker.compose.project` label. `podman rm -f -v` drops only the container's own anonymous volumes:

```bash
podman rm -f -v <name>
podman network rm $(podman network ls -q --filter label=com.docker.compose.project=<project>)
```

A named volume is never removed by a project label alone, because the label does not prove the volume
is disposable. Remove a named volume only when this session's own run created it and it holds disposable
test data. Otherwise leave it in place and report it, per [What Is Retained](#what-is-retained).

Never remove a container another actor is running. When no container is left running and the engine
runs in a Podman machine (macOS), stop that machine with `podman machine stop`; the VM keeps its memory
until it stops. Apply the same ownership evidence before stopping it.

## What This Gate Never Runs

No machine-wide prune, reset, or alias that removes every container, for Podman or Docker. That covers
`podman system prune` in any form, `system reset`, `image prune -a`, `volume prune`, `container prune`,
and `network prune`. They cannot separate this session's artifacts from a concurrent one's, the same
objection that keeps `git gc` out of the gate. Reclaiming disk machine-wide is human-triggered
maintenance. The [Build-Artifact Sweeper](../../infra/build-artifact-sweeper.md) does not cover container
engine state either; its removable classes are build output, tool caches, and the shared cargo `target/`.
