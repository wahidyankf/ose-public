# P3 manual container proof

Annotated index of the Phase 3 manual proof records for the Docker-to-Podman migration. Each record is a file in this
folder. The browser screenshots they cite are in [captures/](./captures/).

## Purpose

These records prove two things at the container level, against the rootless Podman services only:

- **Supported public-site stacks** (`ose-www`, `organiclever-www`, `ayokoding-www`): the container builds, starts, and
  reports healthy, serves real routes over HTTP, and passes browser readiness checks.
- **Backend dependency stacks** (`ose-be`, `organiclever-be`): the Postgres and NATS containers accept the real backend's
  wire traffic, the existing backend e2e target passes, and each backend answers one existing read-only API request.

These records are **separate from native fixture-server BDD targets**. OSE's default `ose-www-fe-e2e` and
`ose-www-be-e2e` targets use a native fixture server on port 3190 and never reach the `ose-www` container. No Nx e2e
target was run for the two public sites in this folder. The backend records do run their existing e2e targets, which
start the backends natively, and they cite those results only as the existing wire assertions.

## Records

| Record                                       | Status                                | What it proves                                                                                                                                                           | Ports                                                                                         | Locales              | Browsers                          | Annotation                                                                                                                                                       |
| -------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ose-www.md](./ose-www.md)                   | PASS                                  | Container reports `healthy`; `/` and `/api/trpc/health.check` return HTTP 200; home, navigation, and search readiness; one read-only tRPC request.                       | 3100                                                                                          | en (context `en-US`) | Chromium, Firefox, WebKit         | Container-level proof only. The native fixture BDD target on port 3190 is separate and was not run here.                                                         |
| [organiclever-www.md](./organiclever-www.md) | PASS                                  | Container reports `healthy`; `/` returns HTTP 200; home and navigation readiness. The site has no search and no backend API, so those checks do not apply.               | 3200                                                                                          | en (context `en-US`) | Chromium, Firefox, WebKit         | "Open the app" leads to `/app/home`, which returns 404 here because that path belongs to a different deployable. Recorded as an observation, not a failure.      |
| [ayokoding-www.md](./ayokoding-www.md)       | BLOCKED by host capacity (not run)    | Nothing yet. The image build stopped at `STEP 5/13` of the builder stage on the HIPPO disk floor, so no container, image, or browser result exists.                      | Planned 3111 (task-owned compose copy). The native Ayo server holds 3101 and was not touched. | Planned `en`, `id`   | Planned Chromium, Firefox, WebKit | Build never completed. The record gives the exact HIPPO error, the root cause, and the decisions still open.                                                     |
| [backends.md](./backends.md)                 | PASS (`ose-be` and `organiclever-be`) | Compose config valid; existing e2e target passes (`ose-be` 5 of 5, `organiclever-be` 12 of 12); direct Postgres and NATS wire; one read-only health request per backend. | Postgres 5435 and 5436, NATS 4225 and 4226, backend 8302 and 8202                             | Not applicable       | Not applicable                    | Dependency stacks only, not site proof. The backends run as native `dotnet` processes. One Postgres anonymous volume per run is left by `down` (see Open items). |

## Captures

Nine JPEG captures (quality 55, viewport only, 1000x700) are in [captures/](./captures/). Sizes are in bytes.

| File                                                   | Bytes  | Record                                       |
| ------------------------------------------------------ | ------ | -------------------------------------------- |
| `captures/organiclever-www-en-chromium-home.jpg`       | 37,033 | [organiclever-www.md](./organiclever-www.md) |
| `captures/organiclever-www-en-chromium-navigation.jpg` | 33,816 | [organiclever-www.md](./organiclever-www.md) |
| `captures/organiclever-www-en-firefox-home.jpg`        | 40,668 | [organiclever-www.md](./organiclever-www.md) |
| `captures/organiclever-www-en-webkit-home.jpg`         | 50,253 | [organiclever-www.md](./organiclever-www.md) |
| `captures/ose-www-en-chromium-home.jpg`                | 36,854 | [ose-www.md](./ose-www.md)                   |
| `captures/ose-www-en-chromium-navigation.jpg`          | 43,554 | [ose-www.md](./ose-www.md)                   |
| `captures/ose-www-en-chromium-search.jpg`              | 34,549 | [ose-www.md](./ose-www.md)                   |
| `captures/ose-www-en-firefox-home.jpg`                 | 41,282 | [ose-www.md](./ose-www.md)                   |
| `captures/ose-www-en-webkit-home.jpg`                  | 49,485 | [ose-www.md](./ose-www.md)                   |

No capture exists for `ayokoding-www` (the build never ran) or for the backends (they have no browser surface).

## Serving revision

- Branch `docker-to-podman-base`, HEAD `24a4c54d4`.
- The site images and the backend runs were built or run from a **dirty working tree**, with uncommitted changes
  included. Each record gives its own count at build time (22 or 23 `git status --short` entries) and states whether
  any dirty file is an input to that image. The served revision is therefore recorded as HEAD plus the working-tree
  changes, not as a clean commit.
- Image and container ids live in each record: the Revision section of [ose-www.md](./ose-www.md),
  [organiclever-www.md](./organiclever-www.md), and [backends.md](./backends.md). [ayokoding-www.md](./ayokoding-www.md)
  has no image or container id because none was created.

## Open items

1. **Ayo container build blocked by disk.** The build stopped at `STEP 5/13: COPY apps/ayokoding-www/ ./apps/ayokoding-www/`
   with `hippo: [hippo.limit.storage-blocked] the disk floor stopped this work; free space before retrying` and
   `hippo-exit=124`. The record's root cause: the root `.dockerignore` has no `.next` entry, and the app-level
   `apps/ayokoding-www/.dockerignore` (which lists `.next/`) is not applied to a repository-root build context. The
   caller's native build output (about 18 GB of `.next`) is therefore copied into the image. This is a repository defect
   that also affects Docker. No fix was made in this task. Open decisions: free disk or move the storage roots and
   rerun, or accept another proof for the Ayo row; and decide whether to fix the `.next` leak as a separate slice.
2. **Anonymous Postgres volume left by backend `down`.** Neither backend compose file mounts a named volume, and `down`
   without `-v` keeps the anonymous data volume each run creates. The four volumes this phase created were removed by
   id, with the ownership proof described in [backends.md](./backends.md). The eight older anonymous volumes on the host
   have no determined origin. Open decision: add a named or `tmpfs` Postgres data mount to the e2e compose files, or
   have the scripts remove their own project's volumes.
3. **Dockerfile `HEALTHCHECK` ignored in OCI format.** Podman ignores the image-level healthcheck of `ose-www` and
   `organiclever-www` (OCI image format). Both containers were healthy only because their compose files define a
   healthcheck. A standalone `podman run` of either image has no health status. Open decision: keep the image-level
   healthcheck and build with the docker format, or drop it, before any image is published.
4. **Clean-commit rerun.** All records were built or run from a dirty working tree. Open question: does the plan need a
   revision-exact record? If it does, rerun the `ose-www`, `organiclever-www`, `ayokoding-www` (once unblocked), and
   backend records on a clean commit.

The retained proof from the PostgreSQL rehearsal (two volumes and one dump file) awaits a disposal decision. The
ledger in [../recovery.md](../recovery.md) lists the exact names and commands.
