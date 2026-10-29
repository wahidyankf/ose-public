# P3 failure recovery rehearsal

Two runs are recorded. Run 2 (this section first) used the `d2p-` prefix on the data from the
[run 2 PostgreSQL rehearsal](./postgres-rehearsal.md). Run 1 is the earlier committed record, kept
below unchanged except that its headings sit one level lower.

## Run 2 (d2p- prefix)

> A final cleanup ledger section is appended later by the orchestrator's last task, after the site and
> backend stacks finish. See the heading at the end of this section.

### Result and scope

The failure recovery rehearsal passed on 2026-10-28 (run id `20261028144624-19714`) on native rootless
Podman 5.7.0 under HIPPO admission (`ephemeral` class, `standard` tier). It ran on the retained source
volume and dump of the [run 2 PostgreSQL rehearsal](./postgres-rehearsal.md) (id `20261028144529-3821`).
The server, `pg_dump`, and `pg_restore` were all PostgreSQL 17.11 from `postgres:17-alpine`. Every
resource carried the label `owner=docker-to-podman-rehearsal` and a `d2p-` name; the network published no
ports; no Docker command ran and no image was pulled.

### Expected versus observed

| Step                                                    | Expected                                   | Observed                                                                                                                                               |
| ------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backup SHA-256 before                                   | recorded                                   | `1ff1feaccfa3fc7864d3908a4335e53a2cf85b435c14ace2dcd94a001504ebda`, 1682 bytes                                                                         |
| (1) Fresh container on the retained source volume       | `3:60`, clean stop                         | `3:60`; `podman stop` exit code 0                                                                                                                      |
| (2) Failure A: dump truncated to 300 bytes, new target  | restore exits non-zero, no `records` table | `pg_restore` exit 1 (`pg_restore: error: could not read from input file: end of file`); `to_regclass('public.records')` was absent                     |
| (3) Failure B: good dump restored, write smoke, SIGKILL | `4:100` after restart                      | `4:100` before kill; container exit 137; restarted, healthy; `4:100` after recovery                                                                    |
| (3) Crash recovery proof in server log                  | recovery ran                               | log shows `database system was not properly shut down; automatic recovery in progress`, `redo starts`, `redo done`, then `ready to accept connections` |
| (4) Retained source after all failures                  | `3:60`                                     | `3:60`; clean stop, exit code 0                                                                                                                        |
| (4) Backup SHA-256 after                                | unchanged                                  | `1ff1feaccfa3fc7864d3908a4335e53a2cf85b435c14ace2dcd94a001504ebda` (identical)                                                                         |
| Script exit status                                      | `0`                                        | `0` (every check is an assertion that aborts on mismatch)                                                                                              |

Failure B shows that a write acknowledged to the client survives a SIGKILL of the database container:
PostgreSQL replayed its write-ahead log on restart. Failure A shows that a corrupt or short backup stops
the restore with a clear non-zero error and leaves nothing half-restored in the new target; the source
volume was never mounted by either failure container.

### Resource classification and disposition

| Resource                                                 | Name                                                            | Class                | Disposition                                      |
| -------------------------------------------------------- | --------------------------------------------------------------- | -------------------- | ------------------------------------------------ |
| Container (pre-check and final compare on source)        | `d2p-pg-recover-src-20261028144624-19714`                       | Removable disposable | Removed                                          |
| Container (failure A target)                             | `d2p-pg-recover-failA-20261028144624-19714`                     | Removable disposable | Removed                                          |
| Container (failure B target)                             | `d2p-pg-recover-failB-20261028144624-19714`                     | Removable disposable | Removed                                          |
| Network (failure run, no published ports)                | `d2p-pg-recnet-20261028144624-19714`                            | Removable disposable | Removed                                          |
| Volume (failure A target)                                | `d2p-pg-recover-failA-vol-20261028144624-19714`                 | Removable disposable | Removed                                          |
| Volume (failure B target)                                | `d2p-pg-recover-failB-vol-20261028144624-19714`                 | Removable disposable | Removed                                          |
| File (truncated dump copy)                               | `<tmp>/d2p-pg.20261028144529-3821.iRWe4J/truncated-300.dump`    | Removable disposable | Removed                                          |
| File (truncated restore error output)                    | `<tmp>/d2p-pg.20261028144529-3821.iRWe4J/truncated-restore.err` | Removable disposable | Removed                                          |
| Scratch scripts and logs                                 | `local-tmp/claude/d2p/` (ignored)                               | Removable disposable | Left in ignored scratch, not committed           |
| Volume (PostgreSQL rehearsal source)                     | `d2p-pg-source-20261028144529-3821`                             | Retained proof       | Retained                                         |
| Volume (PostgreSQL rehearsal target, holds `4:100`)      | `d2p-pg-target-20261028144529-3821`                             | Retained proof       | Retained                                         |
| File (good dump)                                         | `<tmp>/d2p-pg.20261028144529-3821.iRWe4J/backup.dump`           | Retained proof       | Retained                                         |
| Pulled images                                            | none                                                            | Not applicable       | Nothing pulled; `postgres:17-alpine` pre-existed |
| Pre-existing anonymous volumes, images, `podman` network | not created by this run                                         | Durable or shared    | Untouched                                        |

Removal used exact names only, through HIPPO admission: `podman rm --force` on the three containers,
`podman network rm` on the network, `podman volume rm` on the two failure volumes, and `rm -f` on the two
files. The pre-cleanup labelled inventory matched the table above (three containers, one network, four
volumes, three files); the post-cleanup inventory holds only the retained items.

Cleanup commands for the retained items, to run only after the evidence review authorizes disposal:

```bash
podman volume rm d2p-pg-target-20261028144529-3821 d2p-pg-source-20261028144529-3821
rm -f -- <tmp>/d2p-pg.20261028144529-3821.iRWe4J/backup.dump
rmdir <tmp>/d2p-pg.20261028144529-3821.iRWe4J
```

No `prune` command ran.

### Podman state diff against the pre-snapshot

The snapshot of `podman ps -a`, `podman volume ls`, `podman network ls`, and `podman images` taken
before the PostgreSQL rehearsal was compared with the state after all removals. The only difference is two
added volumes, both mine and both retained:

```text
> local       d2p-pg-source-20261028144529-3821
> local       d2p-pg-target-20261028144529-3821
```

There is no container, network, or image difference, and the eight pre-existing anonymous volumes and the
images (`localhost/ayokoding-env/python`, `localhost/organiclever-www_organiclever-www`,
`localhost/ose-www_ose-www`, and the `docker.io/library` nats, node, postgres, python, and alpine images)
are unchanged.

## Final cleanup ledger

Scope: the whole Phase 3 manual run. It covers the PostgreSQL rehearsal and the recovery run above (Run 2), the
`ose-www` and `organiclever-www` stacks, the `ayokoding-www` build attempt, and the `ose-be` and `organiclever-be`
backend stacks. The state below was verified after all work: no container exists; the only network is the default
`podman` network; images are unchanged from the start; the volumes are the eight pre-existing anonymous volumes and the
two retained proof volumes; the retained dump file is in the host temp root; the native Ayo server on
`127.0.0.1:3101` still listens and was not touched. No global prune ran, and no Docker command ran anywhere.

### (a) Resources by slice

| Resource                                                                                                                                                                                                                                                                                                                                        | Class                | Disposition                                                                | Where recorded                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| PostgreSQL rehearsal network `d2p-pg-20261028144529-3821` (ID `71d2a2eee844`)                                                                                                                                                                                                                                                                   | removable disposable | removed (packet teardown)                                                  | [postgres-rehearsal.md](./postgres-rehearsal.md), Outcome                          |
| PostgreSQL rehearsal source and target containers (IDs `a85c3abcae97`, `43d55cf63690`)                                                                                                                                                                                                                                                          | removable disposable | removed (packet teardown)                                                  | postgres-rehearsal.md, Outcome                                                     |
| PostgreSQL rehearsal volumes `d2p-pg-source-20261028144529-3821` and `d2p-pg-target-20261028144529-3821`                                                                                                                                                                                                                                        | retained proof       | retained                                                                   | postgres-rehearsal.md, Retained proof; this file, Run 2                            |
| Backup dump `<tmp>/d2p-pg.20261028144529-3821.iRWe4J/backup.dump` and its directory                                                                                                                                                                                                                                                             | retained proof       | retained                                                                   | postgres-rehearsal.md, Retained proof                                              |
| Recovery run containers `d2p-pg-recover-src-20261028144624-19714`, `d2p-pg-recover-failA-20261028144624-19714`, `d2p-pg-recover-failB-20261028144624-19714`                                                                                                                                                                                     | removable disposable | removed (`podman rm --force`)                                              | this file, Run 2, resource table                                                   |
| Recovery run network `d2p-pg-recnet-20261028144624-19714`                                                                                                                                                                                                                                                                                       | removable disposable | removed                                                                    | this file, Run 2                                                                   |
| Recovery run volumes `d2p-pg-recover-failA-vol-20261028144624-19714` and `d2p-pg-recover-failB-vol-20261028144624-19714`                                                                                                                                                                                                                        | removable disposable | removed (`podman volume rm`)                                               | this file, Run 2                                                                   |
| Truncated dump copy and truncated restore error file in the rehearsal temp directory                                                                                                                                                                                                                                                            | removable disposable | removed (`rm -f`)                                                          | this file, Run 2                                                                   |
| `ose-www` container `d2p-ose-www_ose-www_1` and network `d2p-ose-www_default`                                                                                                                                                                                                                                                                   | removable disposable | removed (`compose down`, no `-v`)                                          | [ose-www.md](./manual/ose-www.md), Resources created and cleanup                   |
| `ose-www` image `localhost/d2p-ose-www_ose-www:latest` (ID `4625a0771161`) and dangling stage images `80bcd20aa6f5` (deps) and `25f078a2d54b` (builder)                                                                                                                                                                                         | removable disposable | removed (`podman rmi`)                                                     | ose-www.md, Resources created and cleanup                                          |
| `organiclever-www` container `d2p-organiclever-www_organiclever-www_1` and network `d2p-organiclever-www_default`                                                                                                                                                                                                                               | removable disposable | removed (`compose down`, no `-v`)                                          | [organiclever-www.md](./manual/organiclever-www.md), Resources created and cleanup |
| `organiclever-www` image `localhost/d2p-organiclever-www_organiclever-www:latest` (ID `b1a3a824fd18`) and dangling stage image `39221f3b466c`                                                                                                                                                                                                   | removable disposable | removed (`podman rmi`, which also removed the build's non-dangling layers) | organiclever-www.md, Resources created and cleanup                                 |
| `ayokoding-www` build attempt: 12 buildah working containers                                                                                                                                                                                                                                                                                    | removable disposable | removed (`podman rm --force` by explicit ID)                               | [ayokoding-www.md](./manual/ayokoding-www.md), Cleanup                             |
| `ayokoding-www` build attempt: 9 untagged build-stage images                                                                                                                                                                                                                                                                                    | removable disposable | removed (`podman rmi`)                                                     | ayokoding-www.md, Cleanup                                                          |
| `ayokoding-www` build attempt: temp directories `buildah902601601` (8.8 GB) and `container_images_storage675759839` in the temp root                                                                                                                                                                                                            | removable disposable | removed (by exact name)                                                    | ayokoding-www.md, Cleanup                                                          |
| Backend containers `ose-be-e2e_postgres_1`, `ose-be-e2e_nats_1`, `organiclever-be-e2e_postgres_1`, `organiclever-be-e2e_nats_1` (each created by the script run and again by the manual `up`)                                                                                                                                                   | removable disposable | removed (`compose down`, no `-v`)                                          | [backends.md](./manual/backends.md), Resources                                     |
| Backend compose networks of the two projects                                                                                                                                                                                                                                                                                                    | removable disposable | removed (`compose down`)                                                   | backends.md, Resources                                                             |
| Backend anonymous Postgres volumes `660820c7ac48`, `a4bc59b2baa4`, `8523fa2b3c3f`, `1c53e8690e6d` (short IDs)                                                                                                                                                                                                                                   | removable disposable | removed (`podman volume rm` by full ID)                                    | backends.md, Resources                                                             |
| Scratch and logs under `local-tmp/claude/d2p/` (all `d2p-` named, gitignored)                                                                                                                                                                                                                                                                   | removable disposable | retained in place, not committed (see (d))                                 | each record's Resources section                                                    |
| Eight pre-existing anonymous volumes (origin not determined)                                                                                                                                                                                                                                                                                    | durable-shared       | retained (untouched)                                                       | postgres-rehearsal.md, Inventory statement; this file, Run 2                       |
| Images `localhost/ayokoding-env/python`, `localhost/organiclever-www_organiclever-www`, `localhost/ose-www_ose-www`, `docker.io/library/nats:latest`, `docker.io/library/node:24-alpine`, `docker.io/library/postgres:17-alpine`, `docker.io/library/alpine:3.20`, and the untagged `docker.io/library/python` and `docker.io/library/postgres` | durable-shared       | retained (untouched)                                                       | ose-www.md, Resources created and cleanup; backends.md, Remaining                  |
| Default network `podman`                                                                                                                                                                                                                                                                                                                        | durable-shared       | retained (untouched)                                                       | backends.md, Remaining; ayokoding-www.md, Verification                             |

Backend anonymous volumes have no labels in Podman, so their ownership is shown another way: each appeared only after
its stage (snapshot diff), had a creation time inside the run window, and had no container referencing it. These four
removals cover every volume the phase created.

### (b) Removed

1. PostgreSQL rehearsal: the packet teardown removed the two containers and the network. The volumes and the dump were kept.
2. Recovery run (Run 2): three containers, one network, two failure volumes, and two temp files were removed by exact name.
3. `ose-www`: `compose down` (no `-v`) removed the container and the network. `podman rmi` removed the image and the two dangling stage images with their layers.
4. `organiclever-www`: `compose down` (no `-v`) removed the container and the network. `podman rmi` removed the image and the dangling stage image.
5. `ayokoding-www` build attempt: 12 buildah working containers, 9 untagged build-stage images, and 2 temp directories, all created inside the build window. No Compose container, network, image, or volume from that attempt exists.
6. Backends: four containers and the compose networks of both projects were removed by `down` (no `-v`). Four anonymous volumes were removed by full ID.
7. Backend `dotnet run` processes were stopped by recorded PID. None remains.

### (c) Remains

- Volume `d2p-pg-source-20261028144529-3821` (retained proof, PostgreSQL rehearsal source, reads `3:60`).
- Volume `d2p-pg-target-20261028144529-3821` (retained proof, PostgreSQL rehearsal target, holds `4:100`).
- Dump file `<tmp>/d2p-pg.20261028144529-3821.iRWe4J/backup.dump` (1682 bytes; SHA-256 in postgres-rehearsal.md) and its directory `<tmp>/d2p-pg.20261028144529-3821.iRWe4J` (retained proof).
- Untouched: the eight pre-existing anonymous volumes, the images and the default `podman` network listed in (a), and the native Ayo server on `127.0.0.1:3101`.

Disposal of the retained proof awaits an explicit decision. Do not run these commands until that decision is made. They
are the ones the rehearsal record gives, with exact names and no `prune`:

```bash
podman volume rm d2p-pg-target-20261028144529-3821 d2p-pg-source-20261028144529-3821
rm -f -- <tmp>/d2p-pg.20261028144529-3821.iRWe4J/backup.dump
rmdir <tmp>/d2p-pg.20261028144529-3821.iRWe4J
```

### (d) Gitignored build output left in place

- Backend build output: `apps/ose-be/src/OseBe/bin` and `obj`, and `apps/organiclever-be/src/OrganicleverBe/bin` and `obj`.
- Playwright output directories (`.features-gen`, `test-results`, `playwright-report`) under the two backend `*-e2e` apps.
- Scratch under `local-tmp/claude/d2p/`: the `ayokoding-www` compose copy, the browser script (written, never run), helper scripts, logs, and the pre-run and post-run snapshots. All are gitignored and uncommitted.

### (e) Retained source check

The comparison of the retained source against the pre-rehearsal checks is in the Run 2 section above: the source reads
`3:60`, and the backup SHA-256 is unchanged.

## Run 1 (earlier committed run, unprefixed names)

### Result and scope

The failure recovery rehearsal passed on 2026-10-28. It ran on the retained disposable data from the
[PostgreSQL rehearsal](./data-rehearsal.md), on native rootless Podman 5.7.0 under HIPPO admission
(service class, standard tier). It shows that a failed restore leaves the source untouched and that
no owned service routes to the failed target.

### Steps and observations

1. **Pre-check.** A fresh container read the retained source volume and reported `3:60`, the same
   value as before the rehearsal.
2. **Induced failure.** A copy of the backup was truncated to 300 bytes. A new disposable target (its
   own volume, container, and network) tried `pg_restore --exit-on-error` with it. The restore
   exited non-zero, as expected, and the target held no `records` table afterward.
3. **Compare.** The retained source read `3:60` again, equal to the pre-check. The failed target had
   no effect on it.
4. **Classify.** The rehearsal then removed only what this run created.

### Resource classification

| Resource                                                      | Class                   | Disposition                                 |
| ------------------------------------------------------------- | ----------------------- | ------------------------------------------- |
| Failure-run containers, network, and the failed target volume | Removable disposable    | Removed by exact name                       |
| Truncated dump copy and its error file                        | Removable disposable    | Removed                                     |
| Source and target volumes of the PostgreSQL rehearsal         | Retained proof          | Held for the evidence, then removed by name |
| Backup dump of the rehearsal                                  | Retained proof          | Held for the evidence, then removed         |
| Existing images, volumes, and the default network             | Durable or shared state | Untouched                                   |

Every created resource carried the owner label `owner=docker-to-podman-rehearsal`. After the
failure run, no labelled container or network remained, and the only labelled volumes were the two
retained ones. No global `prune` command ran, and no Docker call was possible or made.
