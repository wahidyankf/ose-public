# P0 local Ubuntu rootless capability evidence

## Result and review state

The recorded local tuple is Ubuntu 26.04.1 LTS, amd64, with Podman `5.7.0+ds2-3build1` and
rootless mode enabled. This file records successful keep-id ownership, cgroup-v2 resource limits,
no-service network mode, internal-network DNS, and explicit Compose-provider assertions.

The network/Compose operation returned exit 0 and its cleanup inventory is empty. Its raw output
also contains provider cleanup errors after a successful one-shot client run: Podman Compose tried
to remove an already absent client container and reported `rootless netns: kill network process:
permission denied`. Independent diagnosis confirmed the exact AppArmor SIGTERM receive denial
and that the installed provider ignores native teardown statuses. The owner is choosing a route
from the [environment-blocker record](./prerequisite-blockers.md); no policy/helper change has
occurred. Therefore, do not call the provider cleanup warning-free or use this file alone to close
all of P0 action 12.

## Revision, command, and image identity

- Repository worktree revision: `71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`.
- Both workload commands ran from the execution worktree root through its checksum-pinned HIPPO
  consumer, with the approved local host profile, class `service`, tier `standard`.
- The task-specific image was resolved before isolation from the repository's existing
  `postgres:17-alpine` fixture to the actual local reference
  `docker.io/library/postgres@sha256:e4cb93687b062cd25a0e8f672d85a7708235009d70d31f8a7698d9370092a9c4`.
  Its observed config image ID was
  `ab20e934b27ba3ff927c1b4c9ff8cf6c32f315f743efe68dd3441182a87fb085`. The diagnostic and
  network/Compose operations used this recorded digest with `--pull=never` / Compose
  `pull_policy: never`; no moving tag was resolved during those probes.
- The provider command resolved `PODMAN_COMPOSE_PROVIDER` explicitly to `podman-compose`.
  `podman compose version` invoked that external provider, which reported Podman 5.7.0 and
  podman-compose 1.6.0.

The first operation returned exit 1 before starting a container because the probe incorrectly
required Podman's 64-hex `.Id` output to have a `sha256:` prefix. The actual formatter value and
that predicate are preserved in ignored
`local-tmp/plan/docker-to-podman/ubuntu-capabilities/first-attempt-terminal.txt`.
This probe defect was corrected in the ignored script; the failed attempt is not a host capability
failure. The later focused diagnostic passed.

## Keep-id and cgroup-v2 limits

The focused HIPPO run `development-service-1793032252247-1547228` started at
`2026-10-26T16:30:52.249733483Z` and completed at `2026-10-26T16:31:01.321682107Z`. It exited 0.
The rootless container ran the pinned image with explicit host UID:GID, `--userns=keep-id`, a
task-owned `/work` bind mount, `--memory=536870912 --cpus=0.5 --pids-limit=128`, and `/bin/sh` as
its entrypoint.

The observed container UID and GID matched the invoking host account; the created host-side file
had the same effective owner. Inside the container, cgroup v2 exposed:

| Control      |       Requested |                   Observed | Result |
| ------------ | --------------: | -------------------------: | ------ |
| `memory.max` | 536870912 bytes |                  536870912 | pass   |
| `cpu.max`    |         0.5 CPU | `50000 100000` (ratio 0.5) | pass   |
| `pids.max`   |             128 |                        128 | pass   |

The complete stdout, stderr, child exit, and cleanup receipt are in ignored
`local-tmp/plan/docker-to-podman/ubuntu-capabilities/20261027-0017-identity.log`. The container
was removed. The post-run inventory found no task-owned containers, networks, or volumes.

## No-service mode, provider, DNS, and Compose limits

The separate HIPPO run `development-service-1793032384617-1550251` started at
`2026-10-26T16:33:04.618644365Z` and completed at `2026-10-26T16:33:16.655817082Z`. It exited 0.
An exited `--network=none` container was retained until actual `podman inspect` reported
`HostConfig.NetworkMode=none`, then removed by its exact task-owned name.

Using `PODMAN_COMPOSE_PROVIDER=podman-compose`, the selected provider validated and started one
synthetic PostgreSQL service on a unique `internal: true` network. The client resolved the Compose
service name `db` to an IPv4 address and `pg_isready -h db` reported the service accepting
connections. Podman network inspection reported both `internal=true` and `dns_enabled=true`. The
service published no host port (`HostConfig.PortBindings={}`); the exposed container port had no
host binding.

Compose inspection and in-container cgroup files confirmed the same effective 512 MiB, 0.5 CPU,
and 128 PID limits. The only data mount was a named, run-specific task volume at PostgreSQL's data
directory. `podman compose down --volumes --remove-orphans` exited 0; the exact volume was then
confirmed absent. The run's final owner/run-label inventories contained zero containers, networks,
or volumes. The pulled image remains in the normal user-owned Podman cache.

The complete unedited command output and terminal receipt are in ignored
`local-tmp/plan/docker-to-podman/ubuntu-capabilities/20261027-0020-network.log`. That log retains
the cleanup errors described above even though the provider command and overall run returned 0.
