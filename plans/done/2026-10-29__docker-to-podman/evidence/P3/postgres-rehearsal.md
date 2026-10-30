# P3 PostgreSQL restore rehearsal, run 2 (AC-08)

## Result and scope

AC-08 passed on 2026-10-28 on native rootless Podman, run 2 with `d2p-` names. An earlier committed run
with the same packet is recorded in [data-rehearsal.md](./data-rehearsal.md); this record does not replace
it. The failure-recovery rehearsal on the volumes kept here is in [recovery.md](./recovery.md).

The packet is the heredoc in tech-docs "Disposable PostgreSQL rehearsal packet". It was extracted by
`awk` from the plan file (lines 456 to 548), not retyped, and run under HIPPO admission. It used
synthetic rows only, no lesson image, and no existing volume.

## Environment

| Item                                 | Value                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Podman                               | `podman version 5.7.0`                                                                                      |
| Rootless (`.Host.Security.Rootless`) | `true`                                                                                                      |
| Image                                | `docker.io/library/postgres:17-alpine`                                                                      |
| Image ID                             | `ab20e934b27ba3ff927c1b4c9ff8cf6c32f315f743efe68dd3441182a87fb085`                                          |
| Server, `pg_dump`, `pg_restore`      | all PostgreSQL 17.11 (read inside the image)                                                                |
| Compose image tag check              | `apps/ose-be/docker-compose.e2e.yml` line 3: `docker.io/library/postgres:17-alpine`                         |
| `PG_IMAGE` in the packet             | `postgres:17-alpine`, the same repository and tag (the compose file only adds the registry host), unchanged |
| HIPPO command                        | `./hippo run --class ephemeral --resource-tier standard --disk-path . -- bash -euo pipefail <packet>`       |
| Shell environment                    | `TMPDIR=<tmp>` (short path), `PODMAN_COMPOSE_PROVIDER=podman-compose`                                       |

## Deviations from the written packet

Only these three, nothing else changed (checked with `diff` of the extracted and run scripts):

1. Every `podman-plan-pg` prefix became `d2p-pg` (network, both volumes, both containers, work directory).
2. HIPPO class `ephemeral` (caller instruction) instead of `service`; tier stays `standard`.
3. The packet's own final steps ran unchanged. They remove only the two containers and the network and keep
   both volumes and the dump, which the recovery rehearsal then used.

## Outcome

Run id `20261028144529-3821`. The packet asserts each value with `test` under `bash -e`, so exit status 0
proves every row below; the source value was also read back independently by the recovery run (see
[recovery.md](./recovery.md)).

| Check                                              | Expected                           | Observed                                                                                                                                             |
| -------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Packet exit status                                 | `0`                                | `0`                                                                                                                                                  |
| Source count and sum before backup                 | `3:60`                             | `3:60` (assertion passed; independent read-back `3:60`)                                                                                              |
| Restored target after `pg_restore --exit-on-error` | `3:60`                             | `3:60` (assertion passed)                                                                                                                            |
| Target after the application-level write smoke     | `4:100`                            | `4:100` (assertion passed)                                                                                                                           |
| Source after the target write (rollback target)    | `3:60`                             | `3:60` (assertion passed)                                                                                                                            |
| Backup file                                        | nonempty                           | nonempty, 1682 bytes                                                                                                                                 |
| Backup SHA-256                                     | recorded                           | `1ff1feaccfa3fc7864d3908a4335e53a2cf85b435c14ace2dcd94a001504ebda`                                                                                   |
| Distinct source and target volume names            | distinct                           | `d2p-pg-source-20261028144529-3821` and `d2p-pg-target-20261028144529-3821`                                                                          |
| Volume driver and ownership labels                 | labelled                           | both `local`, both `map[owner:docker-to-podman-rehearsal]`                                                                                           |
| Container IDs recorded                             | recorded                           | source `a85c3abcae97346711332962c7f3ead7fa412b39a91b404b9a97b9bee55c616d`, target `43d55cf63690a7dc7b0717e541b1df928181a4c16548e04cc8a9ad647dd92cb1` |
| Network recorded                                   | recorded                           | `d2p-pg-20261028144529-3821`, ID `71d2a2eee8449dbf8deb6856c37840f575544f1fb8f06a2616e00f688adc3e74`                                                  |
| Packet teardown                                    | two containers and network removed | both containers and the network removed, volumes and dump kept                                                                                       |

The packet used `pg_dump --format=custom` and `pg_restore` from the same image as the compose file,
never a copy of the data directory. The containers were trust-authenticated on their own network and
published no ports. The backup SHA-256 differs from run 1 because a custom-format dump embeds a
timestamp; the value above is the one for this run's dump.

## Inventory statement

- **Real durable data:** none in scope. `podman volume ls` before the run listed eight anonymous
  (hash-named) volumes that already existed; none was read, mounted, or changed (the before and after
  listings differ only by the two new `d2p-pg-` volumes). No owned stack was switched.
- **Other persistent services:** the NATS service in `apps/ose-be/docker-compose.e2e.yml` and
  `apps/organiclever-be/docker-compose.e2e.yml` declares only `image`, `command`, and `ports`; neither
  file contains a `volumes:` key, so NATS mounts no volume and holds no durable state to export.
- **Docker stores:** no Docker command ran and no Docker volume, container, or image was touched.

## Retained proof (kept for the caller's decision)

| Resource | Name                                                  | Class          | Disposition |
| -------- | ----------------------------------------------------- | -------------- | ----------- |
| Volume   | `d2p-pg-source-20261028144529-3821`                   | Retained proof | Retained    |
| Volume   | `d2p-pg-target-20261028144529-3821`                   | Retained proof | Retained    |
| File     | `<tmp>/d2p-pg.20261028144529-3821.iRWe4J/backup.dump` | Retained proof | Retained    |

Cleanup commands, to run only after the evidence review authorizes disposal (exact names, no `prune`):

```bash
podman volume rm d2p-pg-target-20261028144529-3821 d2p-pg-source-20261028144529-3821
rm -f -- <tmp>/d2p-pg.20261028144529-3821.iRWe4J/backup.dump
rmdir <tmp>/d2p-pg.20261028144529-3821.iRWe4J
```
