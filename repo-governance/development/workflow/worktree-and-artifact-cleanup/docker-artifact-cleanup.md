---
description: Scope and exclusions for bringing down the Docker artifacts a session created, how to remove leaked test containers, and why a dev stack is shared machine state.
when_to_use: Use when deciding which containers, images, and volumes to remove, and which to leave running, during post-merge cleanup.
---

# Docker-Artifact Cleanup

Bring down only the Docker artifacts **this session started or built**: the Compose stacks it
brought up, the containers, networks, and anonymous volumes those projects created, and the images
it built locally for them. Inventory before removal, the same as every other class.

Run this **before** the worktree is removed. `infra/dev/ose-app` and `infra/dev/organiclever-app`
bind-mount worktree paths read-write, so a running stack holds the directory the next step deletes.

## A Dev Stack Is Shared Machine State

A Compose project name derives from its `infra/dev/{app}` directory, and every dev stack binds fixed
host ports. Both are identical in every worktree of every checkout on the machine, so a dev stack is
identified machine-wide and **not** per worktree. `docker compose down` run from here brings down
whatever session actually started that stack.

Tear down only a stack this session started. Ownership needs positive evidence — the command in this
session's own history, or a container whose start time falls inside it. When ownership cannot be
proven, leave the stack running and say so. This is the
[self-created-only rule](./hard-safety-rules.md) applied to containers; the reasoning that protects
a shared cache protects a shared stack for the same reason.

## What Is Retained

Retain pulled base images — `postgres:17-alpine`, language runtimes, anything another worktree or a
local CI run would have to re-pull. Retain named volumes carrying dev data: `docker compose down`
without `-v` is the default, and `-v` requires that the volume hold disposable data this plan
created and that no other session shares the stack. Retain every project this session did not start,
and retain the artifacts of an active, `partial`, or `fail` run for resumption or diagnosis.

## Leaked Test Containers

A **leaked test container** is a container, volume, or network that a task's test or dev run created and that outlives
the run. A run killed before its own teardown, such as one shed by HIPPO, leaks one. Leaked containers hold memory in
the container VM, and HIPPO then defers unrelated work with `memory-warning` or exit 124.

Detect them read-only. `$ROOT` is the task's checkout or worktree; a repository may also declare a name prefix:

```bash
for n in $(docker ps -a --format '{{.Names}}'); do
  w=$(docker inspect "$n" --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}')
  case "$w" in "$ROOT"|"$ROOT"/*) echo "$n";; esac
done
```

Remove only those names, then re-run the listing and expect zero. `<project>` is the container's
`com.docker.compose.project` label:

```bash
docker rm -f -v <name>
docker volume rm $(docker volume ls -q --filter label=com.docker.compose.project=<project>)
docker network rm $(docker network ls -q --filter label=com.docker.compose.project=<project>)
```

Never remove a container another actor is running. When no container is left running and the engine runs in a desktop
VM, stop its app (`docker desktop stop`); the VM keeps its memory until it stops.

## What This Gate Never Runs

No `docker system prune`, no `docker image prune -a`, no `docker volume prune`, and no alias that removes every container. These are
machine-wide and cannot distinguish this session's artifacts from a concurrent one's — the same
objection that keeps `git gc` out of the gate. Reclaiming disk across the machine is human-triggered
maintenance, not a step an agent takes at teardown. The
[Build-Artifact Sweeper](../../infra/build-artifact-sweeper.md) does not cover Docker either; its
removable classes are build output, tool caches, and the shared cargo `target/`.
