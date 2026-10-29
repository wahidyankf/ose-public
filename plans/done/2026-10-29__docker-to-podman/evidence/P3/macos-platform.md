# P3 macOS platform proof

## Result and scope

The macOS runner and platform proof passed on 2026-10-28 on one Mac host. It covers AC-02 to AC-06
against a rootless Podman Machine with Docker made
unavailable to the tested processes, and the shared container preflight for the container-tool part
of AC-01. The full repository doctor did not pass on this Mac for reasons unrelated to containers
(see below). The Compose stack health checks (AC-03) and the data rehearsal are not covered here.

## Engine and provider

| Item                     | Observed value                                              |
| ------------------------ | ----------------------------------------------------------- |
| Host                     | macOS 26.3, arm64                                           |
| Podman client            | 6.1.4 (official package)                                    |
| Machine                  | libkrun, 4 CPUs, 4 GiB, selected connection is the rootless |
| `host.security.rootless` | `true` (guest linux/arm64, cgroup v2, systemd)              |
| Compose provider         | `podman-compose` 1.6.0 in an isolated venv                  |

The root connection exists but is not the default, and the proof used the rootless one. `pipx` was
not installed on this Mac, so the pinned provider went into an isolated task-owned venv instead
(same package and version, outside every shell profile). The explicit provider path was set through
`PODMAN_COMPOSE_PROVIDER`.

The Machine did not start from the agent's SSH session: two start attempts stalled before the guest
sent its ready notice, and the maintainer started it from a local terminal. After a memory change
from 2 GiB to 4 GiB it stayed up for the whole proof.

## Docker made unavailable

A task-owned `docker` shim sat first on the PATH of the tested processes only. It logged each call
and exited `99`. The log held **0 calls** after every run below. No Docker package was removed or
stopped.

## Runner contract (AC-02 to AC-06)

The real-engine adapter ran `AYOKODING_BDD_ADAPTER=e2e go test ./tests/bdd` against the built
binary under HIPPO admission (ephemeral class, standard tier).

| Run    | Scenarios       | Steps      | Outcome                                                       |
| ------ | --------------- | ---------- | ------------------------------------------------------------- |
| First  | 69 of 70 passed | 280 of 283 | 1 failed, 2 skipped: the provider was not on the test PATH    |
| Second | 70 of 70 passed | 283 of 283 | Pass, no skipped steps; same code, specs, and tests as before |

The one first-run failure was `locate native provider`: the test step finds `podman-compose` with a
PATH lookup, and only the explicit variable had been set. The second run added the venv directory to
the PATH and changed nothing else.

## Preflight and doctor (AC-01)

- `scripts/container-runtime-check --compose` exited `0` with the explicit provider, and exited
  `127` when the provider path was set to a missing file.
- `npm run doctor` exited `1` with three findings: `fantomas`, `csharpier`, and `mix` unavailable.
  These are .NET and Elixir toolchains this Mac does not have. It reported no finding about Podman,
  `podman-compose`, or Docker. AC-01 therefore holds for the container tools only; a full doctor
  pass on macOS needs those other toolchains installed.

## Resource, mount, and DNS probes

Every probe resource carried the owner label `plan=docker-to-podman-p3`.

- **Limits:** a container started with `--memory 64m --cpus 0.5` read `memory.max` as 67108864 and
  `cpu.max` as `50000 100000`.
- **Mount mapping:** the container saw the bind mount as user `0:0` (rootless root), and the file it
  created appeared on the host owned by the host account's UID and GID. The runner's `keep-id`
  mapping applies on Linux only, so this Machine path relies on the Machine's own mapping.
- **Internal DNS:** a second container on a task-created network resolved the first by container
  name.

## Owned teardown

After the probes, owned containers and the owned network were both zero, and no Docker call was
recorded. Images that were already in the Machine before the proof were not touched. The one image
pulled for the probes was removed.
