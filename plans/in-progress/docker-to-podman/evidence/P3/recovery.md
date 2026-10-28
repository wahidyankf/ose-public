# P3 failure recovery rehearsal

## Result and scope

The failure recovery rehearsal passed on 2026-10-28. It ran on the retained disposable data from the
[PostgreSQL rehearsal](./data-rehearsal.md), on native rootless Podman 5.7.0 under HIPPO admission
(service class, standard tier). It shows that a failed restore leaves the source untouched and that
no owned service routes to the failed target.

## Steps and observations

1. **Pre-check.** A fresh container read the retained source volume and reported `3:60`, the same
   value as before the rehearsal.
2. **Induced failure.** A copy of the backup was truncated to 300 bytes. A new disposable target (its
   own volume, container, and network) tried `pg_restore --exit-on-error` with it. The restore
   exited non-zero, as expected, and the target held no `records` table afterward.
3. **Compare.** The retained source read `3:60` again, equal to the pre-check. The failed target had
   no effect on it.
4. **Classify.** The rehearsal then removed only what this run created.

## Resource classification

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
