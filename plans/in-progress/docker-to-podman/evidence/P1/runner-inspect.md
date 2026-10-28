# P1 runner inspect evidence (rootless Podman)

This file closes the **Remaining** note on the Phase 1 item "Run real `ayokoding-cli:test:integration` and
`ayokoding-cli:test:e2e`" in `delivery.md`: container and network inspect data from a real rootless Podman run.
`evidence/P1/runner.md` records image IDs and the argv comparison only. This file records what Podman reports for
the containers and networks the runner creates.

The data is sanitized. It holds no environment values (only variable names where noted), no host paths, and no
secrets. The run identifier (a timestamp and a process id) is shown as `<run>`. Raw inspect JSON stays in untracked
scratch under `local-tmp/claude/d2p-inspect/` and is not copied here.

Date: 2026-10-29. Branch `docker-to-podman-base`, head `60a35faf1`.

## Environment

| Item                   | Value                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `podman --version`     | `podman version 5.7.0`                                                                                               |
| Mode                   | Rootless (`Host.Security.Rootless` true), netavark network backend, `runc` OCI runtime                               |
| Compose provider       | `podman-compose` 1.6.0, passed as `PODMAN_COMPOSE_PROVIDER`                                                          |
| User namespace (host)  | `podman unshare cat /proc/self/uid_map` and `gid_map`: `0 <host-uid> 1` and `1 <subuid-start> <subuid-count>`        |
| `podman info` mappings | uidmap and gidmap: container 0 to the host user (size 1), container 1 to the subuid range start (<subuid-count> ids) |

## Commands, exit codes, outcomes

All compute ran through HIPPO at the standard tier with `TMPDIR=<short-tmp>`. HIPPO admitted every run on the
first try (no 124 or 125). A background poller (`local-tmp/claude/d2p-inspect/poll.sh`) listed containers and
networks carrying the runner label `ayokoding.run` every 0.4 seconds. It ran `podman inspect` and
`podman network inspect` once for each new name, while the resource still existed.

| #   | Command                                                                                                                                                                                        | Exit | Outcome                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------ |
| 1   | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- go -C apps/ayokoding-cli build -trimpath -o local-tmp/claude/d2p-inspect/ayokoding-cli ./cmd/ayokoding-cli`       | 0    | Built the runner binary for the driver                                                                 |
| 2   | `rtk ./hippo run ... -- local-tmp/claude/d2p-inspect/ayokoding-cli --content local-tmp/claude/d2p-inspect/content examples run --course inspect-course` (the driver)                           | 0    | Printed `learning/code/ex-01-default main: passed` and `learning/code/ex-02-limits main: passed`. 34 s |
| 3   | `NX_SKIP_NX_CACHE=true PODMAN_COMPOSE_PROVIDER=<podman-compose> rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-cli:test:integration` | 0    | `ok .../tests/bdd 189.816s`, `ok .../tests/integration 16.720s`. Nx: "Successfully ran target"         |
| 4   | Same wrapper, `npm exec nx -- run ayokoding-cli:test:e2e`                                                                                                                                      | 0    | `ok .../tests/bdd 231.888s`. Nx: "Successfully ran target"                                             |

Go prints package results, not test or scenario counts, and the logs hold none, so no count is recorded. The poller
ran during rows 3 and 4 as well.

Driver: the integration and e2e targets use the real engine only for some scenarios (the rest use
`tests/support/fakecontainer`). They also leave no time to inspect a specific resource. So row 2 is a throwaway
driver: the real runner binary run against a two-unit fixture course kept under `local-tmp/` (not committed). Each
unit declares `services: [postgres]` and runs `python3 probe.py`, which connects to `postgres:5432` through the
network alias and then sleeps 4 s. Unit `ex-01-default` uses default resources. Unit `ex-02-limits` declares
`resources: memory 512m, cpus 1`. Each unit runs twice (the determinism double run), so four run containers exist.
The driver used the embedded catalog (python and postgres 18 images already in the local store, pulled by digest).
Both units reached the service by alias, which proves DNS aliases work on the internal network.

## Findings from the driver (row 2)

### Run containers (name `ayokoding-<run>-N`, one per execution)

`podman inspect` reported, per execution:

| Container               | Unit            | `HostConfig.Memory` / `MemorySwap` | `NanoCpus` | `CpuQuota` / `CpuPeriod` | `PidsLimit` |
| ----------------------- | --------------- | ---------------------------------- | ---------- | ------------------------ | ----------- |
| `-0` (first execution)  | `ex-01-default` | 1073741824 / 1073741824 (1 GiB)    | 2000000000 | 200000 / 100000          | 256         |
| `-1` (second execution) | `ex-01-default` | 1073741824 / 1073741824            | 1000000000 | 100000 / 100000          | 256         |
| `-2` (first execution)  | `ex-02-limits`  | 536870912 / 536870912 (512 MiB)    | 1000000000 | 100000 / 100000          | 256         |
| `-3` (second execution) | `ex-02-limits`  | 536870912 / 536870912              | 500000000  | 50000 / 100000           | 256         |

The second execution halves the CPU quota, as `cpuQuota` plans. Memory and swap are equal, so swap is off.

The following held for all four run containers:

- **Labels:** `ayokoding.run=<run>` (the only `ayokoding*` label; the value is the run identity).
- **Network:** the unit's internal network, `ayokoding-<run>-<8 hex of the unit path hash>`. The alias list holds only
  the container's short id, and `DNSNames` is empty.
- **User and namespace:** `Config.User` `<host-uid>:<host-uid>` and `HostConfig.UsernsMode` `private`.
  `HostConfig.IDMappings` reported `UidMap` and `GidMap` of `0:1:<host-uid>`, `<host-uid>:0:1`, `<host-uid+1>:<host-uid+1>:<remaining>`. That is the
  `--userns=keep-id` mapping: container uid `<host-uid>` maps to namespace id 0, which is the host user, and ids below `<host-uid>`
  map into the subuid range. The recorded `CreateCommand` carried `--userns=keep-id` and `--user <host-uid>:<host-uid>`.
- **Restart policy:** `no`. `AutoRemove` true (`--rm`).
- **Hardening:** `ReadonlyRootfs` true, `SecurityOpt` `no-new-privileges`, `Privileged` false, `CapAdd` empty,
  `CapDrop` the 11 capabilities Podman grants by default (`--cap-drop ALL`): `CAP_CHOWN`, `CAP_DAC_OVERRIDE`,
  `CAP_FOWNER`, `CAP_FSETID`, `CAP_KILL`, `CAP_NET_BIND_SERVICE`, `CAP_SETFCAP`, `CAP_SETGID`, `CAP_SETPCAP`,
  `CAP_SETUID`, `CAP_SYS_CHROOT`.
- **Mounts:** one bind mount at `/work` (source path not recorded) and `Tmpfs` `/tmp` with options
  `rw,nosuid,size=512m,rprivate,nodev,tmpcopyup`.
- **Environment:** names only, no values: `AYOKODING_UNIT`, `HOME`, `HOSTNAME`, `LANG`, `PATH`, `PGDATABASE`,
  `PGHOST`, `PGUSER`, `PYTHONDONTWRITEBYTECODE`, `PYTHONHASHSEED`, `PYTHON_SHA256`, `PYTHON_VERSION`,
  `SOURCE_DATE_EPOCH`, `TZ`, `container`.

### Service container (`ayokoding-<run>-postgres`)

| Field                | Value                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Image                | `docker.io/library/postgres@sha256:74935e72241653ca55e0414067e6d8763aceb8a810eb51b452253ec3dcfc4336` |
| Labels               | `ayokoding.run=<run>`                                                                                |
| Network and aliases  | The unit's internal network. Aliases: `postgres` and the short container id                          |
| Memory, swap, CPU    | `Memory` 0, `MemorySwap` 0, `NanoCpus` 0, `CpuQuota` 0: no limit                                     |
| `PidsLimit`          | 2048 (the Podman default; the runner passes no `--pids-limit`)                                       |
| User and namespace   | `Config.User` empty, `UsernsMode` empty, `IDMappings` null: default rootless namespace, no keep-id   |
| Hardening            | `CapDrop` empty, `SecurityOpt` empty, `ReadonlyRootfs` false                                         |
| Restart, auto-remove | `no`, `AutoRemove` false (removed by the runner's `rm -f` teardown)                                  |
| Tmpfs                | `/var/lib/postgresql` with `rw,nosuid,rprivate,nodev,tmpcopyup`                                      |

The runner plans the service start as `run -d --name --label --network --network-alias --tmpfs --env <image>`
(`internal/domain/containerplan/services.go`, `ServiceStart`). It sets no memory, CPU, pids, capability, or user
flags. The same is true at the pre-migration baseline `71bb3aa5`. `tech-docs.md` lists "CPU/memory/pid limits,
dropped capabilities, and no-new-privileges" among behaviour to preserve. Inspect shows these hold for run
containers only, as before the migration. This is a fact, not a regression; see the human decision below.

### Networks (`ayokoding-<run>-<8 hex>`, one per unit)

`podman network inspect` reported for both unit networks:

| Field          | Value                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `driver`       | `bridge`                                                                                                                                                                 |
| `internal`     | `true`                                                                                                                                                                   |
| `dns_enabled`  | `true`                                                                                                                                                                   |
| `labels`       | `ayokoding.run=<run>`                                                                                                                                                    |
| `ipv6_enabled` | `false`                                                                                                                                                                  |
| Subnet         | One private /24 per network (the two networks were not live together)                                                                                                    |
| Attached       | The `ayokoding-<run>-postgres` container appeared in the second network's `containers` map. The first was inspected at creation, before attachment, so its map was empty |

A unit with `services: [postgres]` gets its own network. Without services the run container had `--network none`
(see the integration and e2e results below).

### Timeline (`ps -a` snapshots, driver)

For unit 1: network appeared (00:22:26), postgres `Up Less than a second` (00:22:28), execution `-0` up at 00:22:33
and `-1` at 00:22:38 (`Created`, then up). The network and service were gone by 00:22:42, and unit 2's network
appeared in the same snapshot. Unit 2 followed the same order. The last snapshot (00:22:54) showed no containers and
no networks. Execution containers were removed on exit (`--rm`).

## Findings from the real targets (rows 3 and 4)

The poller captured 158 distinct list changes during rows 3 and 4. The inspected resources, grouped by
configuration (counts are inspected containers):

| Count | Kind    | Image                            | Memory / swap | NanoCpus   | Pids | Userns / user           | Network      |
| ----- | ------- | -------------------------------- | ------------- | ---------- | ---- | ----------------------- | ------------ |
| 22    | run     | `docker.io/library/python`       | 1 GiB / 1 GiB | 2000000000 | 256  | `private`, `<host-uid>` | `none`       |
| 11    | run     | `docker.io/library/python`       | 1 GiB / 1 GiB | 1000000000 | 256  | `private`, `<host-uid>` | `none`       |
| 2     | run     | `localhost/ayokoding-env/python` | 1 GiB / 1 GiB | 2000000000 | 256  | `private`, `<host-uid>` | unit network |
| 1     | run     | `localhost/ayokoding-env/python` | 1 GiB / 1 GiB | 1000000000 | 256  | `private`, `<host-uid>` | unit network |
| 2     | service | `docker.io/library/postgres`     | no limit      | 0          | 2048 | default, empty          | unit network |

All run containers shared the driver's hardening values: read-only root, `no-new-privileges`, the 11 default
capabilities dropped, restart policy `no`, one `/tmp` tmpfs, the `ayokoding.run` label, and the keep-id
`IDMappings` above. The two service-backed networks were `bridge`, `internal` true, `dns_enabled` true, and carried
the `ayokoding.run` label. They come from the real-engine scenarios inside the `tests/bdd` package (not from
`tests/integration`, which uses the fake CLI). Some containers were gone before the poller could inspect them: the
scratch directory holds failed-inspect placeholders for them. Those appear in the list timeline only and are not
counted in the table. Every container that was inspected matched the planned argv.

## Cleanup

After all four commands (and the poller was stopped):

- `podman ps -a`: empty. `podman ps -a --filter label=ayokoding.run -q`: 0 containers.
- `podman network ls`: only the default `podman` bridge, same as before.
- `podman volume ls`: the same 10 volumes as before (8 anonymous plus `d2p-pg-source-...` and `d2p-pg-target-...`).
  They were listed before the first command and were not created or touched in this work. Nothing was removed.
- `podman images`: the same 9 images as before. Nothing was built, pulled, or removed.
- The runner removed its own containers and networks on every path. No prune and no manual removal was used.

## Answer to the Remaining note

| Assertion                        | Shown by inspect                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Resource limits (run containers) | Memory, swap, CPU and pids match the plan (default and `resources:` override, halved CPU on execution 2) |
| Ownership labels                 | Every container and network carries `ayokoding.run=<run>`                                                |
| Internal-only service network    | `internal` true, `bridge`, labelled; the service answered by the `postgres` alias                        |
| No-network runs                  | Run containers without services had `--network none`                                                     |
| User and namespace               | `--userns=keep-id` mapping and `--user <host-uid>:<host-uid>` in `IDMappings` and `Config.User`          |
| Service container limits         | None reported. The runner sets none (also at baseline `71bb3aa5`)                                        |
