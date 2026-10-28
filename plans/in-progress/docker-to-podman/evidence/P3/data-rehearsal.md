# P3 PostgreSQL restore rehearsal (AC-08)

## Result and scope

The disposable PostgreSQL rehearsal passed on 2026-10-28 on native rootless Podman 5.7.0. It ran the
tech-docs "Disposable PostgreSQL rehearsal packet" exactly as written, extracted from that file
rather than retyped, under HIPPO admission (service class, standard tier). The only change was the
temporary directory, which pointed at tmpfs because the host account's disk quota refused writes
elsewhere. It used synthetic rows only, no lesson image, and no existing volume of any kind.

## Outcome

| Check                                              | Expected | Observed                                                           |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| Script exit status (`set -e` over every assertion) | `0`      | `0`                                                                |
| Source count and sum before backup                 | `3:60`   | `3:60`                                                             |
| Restored target after `pg_restore --exit-on-error` | `3:60`   | `3:60`                                                             |
| Target after the application-level write smoke     | `4:100`  | `4:100`                                                            |
| Source after the target write (rollback target)    | `3:60`   | `3:60`                                                             |
| Backup file                                        | nonempty | nonempty                                                           |
| Backup SHA-256                                     | recorded | `aaa6e949cb7a99b563aaad233cb527b5ebe619290c08cc89363f81c855805479` |

The packet used `pg_dump --format=custom` and `pg_restore` from the same PostgreSQL 17 Alpine image
tag as the existing compose file, never a copy of the data directory. The source and target lived in
two distinct Podman volumes, each labelled `owner=docker-to-podman-rehearsal`, on a network that
published no ports. Container IDs, volume names, and the network ID were recorded by the packet and
are kept in ignored local scratch, not here.

## Scope disposition

- **Real durable data:** none was in scope, so no owned stack was switched. The packet's own wording
  covers this case: with no durable volumes in active scope, rehearse with seeded disposable data.
- **Other persistent services:** the NATS broker in both backend end-to-end compose files mounts no
  named or bind volume, so it holds no durable state to export or restore. The legacy app scaffolds
  that do mount volumes are unsupported and were not run.
- **Docker stores:** no Docker volume, container, or image was read or changed.

## Teardown and disposal

The packet removed its two containers and its network. It kept both volumes and the dump until the
evidence was written, as the packet requires. After this record and the recovery record
([recovery.md](./recovery.md)) were saved, the maintainer's cleanup instruction authorized disposal,
so the two exact volume names and the dump file were removed by name. No `prune` command ran.
