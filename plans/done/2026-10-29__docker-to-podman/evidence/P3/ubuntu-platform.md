# P3 Ubuntu platform proof

## Result and scope

The Ubuntu half of the Phase 3 platform proof passed on 2026-10-28. It covers AC-02 to AC-06 on a
native rootless Podman host with Docker made unavailable to the tested processes, plus the AC-01
doctor run. The Compose stack health checks (AC-03) and the macOS half are not covered here and are
still pending, so the Phase 3 gate stays open.

## Doctor (AC-01)

`npm run doctor` ran under HIPPO admission with the Docker shim first on the PATH. It exited `0` and
reported `checked 25 declared toolchains, no findings`. The output named no missing Docker
prerequisite, and the shim log held 0 calls.

## Engine and provider

| Item                     | Observed value                |
| ------------------------ | ----------------------------- |
| Podman                   | 5.7.0                         |
| `host.security.rootless` | `true`                        |
| Architecture             | linux/amd64, 4 CPUs, 7.9 GB   |
| Cgroup                   | v2, systemd manager           |
| Compose provider         | `podman-compose` 1.6.0 (pipx) |

## Docker made unavailable

A task-owned `docker` shim sat first on the PATH of the tested processes only. It appended each call
to a log and exited `99`. The log held **0 calls** after the full run, so no tested process invoked
Docker. No Docker package was removed and no Docker service was stopped.

## Runner contract (AC-02 to AC-06)

The real-engine adapter ran `AYOKODING_BDD_ADAPTER=e2e go test ./tests/bdd` against the built binary
under HIPPO admission (ephemeral class, standard tier).

| Run                       | Scenarios       | Steps      | Outcome                                                       |
| ------------------------- | --------------- | ---------- | ------------------------------------------------------------- |
| First, default temp dir   | 66 of 70 passed | 267 of 283 | 4 failed: helper build could not copy its binary (disk quota) |
| Second, temp dir on tmpfs | 70 of 70 passed | 283 of 283 | Pass, no skipped steps                                        |

All four first-run failures were the same environmental fault: the host account's disk quota refused
a copy into the default temp directory (`build fakecontainer`). No assertion failed. The second run
changed only `TMPDIR` and `GOTMPDIR`, so it is the same code, specs, and tests. The scenarios that
had failed are the rootful rejection, environment image from the same store, interrupt (130),
unavailable runtime (125), and readiness deadline (124).

## Resource, mount, and DNS probes

Every probe resource carried the owner label `plan=docker-to-podman-p3`.

- **Limits:** a container started with `--memory 64m --cpus 0.5` read `memory.max` as 67108864 and
  `cpu.max` as `50000 100000`.
- **Mount mapping:** with `--userns=keep-id`, the container user, the seeded file, and a file created
  by the container all showed the host account's UID and GID.
- **Internal DNS:** a second container on a task-created network resolved the first by container
  name.

## Owned teardown

After the probes, owned containers and the owned network were both zero. The only image pulled for
the probes (`alpine:3.20`) was absent beforehand and was removed. Existing images, networks, volumes,
and the default network were not touched, and no global prune ran.
