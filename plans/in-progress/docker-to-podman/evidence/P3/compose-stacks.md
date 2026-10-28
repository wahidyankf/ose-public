# P3 Compose stack proof (AC-03)

## Result and scope

The OSE and OrganicLever public stacks build, start, and report healthy on native rootless Podman
5.7.0 with `podman-compose` 1.6.0 as the explicit provider. **The AyoKoding stack is not proven
yet** (see the last section). Each stack ran the packet's exact `up --build --detach --wait` command
under HIPPO admission (service class, standard tier) with a Docker shim first on the PATH. The shim
logged **0 calls** for every run. Stacks were stopped with `down`, never `down -v`.

| Stack            | Port | `config` | `up --wait` | Container state           | `GET /` |
| ---------------- | ---- | -------- | ----------- | ------------------------- | ------- |
| ose-www          | 3100 | `0`      | `0`         | running, health `healthy` | `200`   |
| organiclever-www | 3200 | `0`      | `0`         | running, health `healthy` | `200`   |

The ose-www health route `GET /api/trpc/health.check` also returned `200` from inside the
container. Container lookup used the Compose labels, as the CI workflow now does.

## Defects this proof found and fixed

Running the real stacks found four defects that parsing and unit tests could not. Each has a
registered regression test and is committed on this branch.

1. **IPv6 loopback in health probes.** Podman containers resolve `localhost` to `::1` first, while
   the Next servers listen on IPv4 only and BusyBox `wget` does not fall back. The probe log read
   `Connecting to localhost:3100 ([::1]:3100) ... Connection refused`, so the container stayed
   `unhealthy` while `GET /` returned `200`. Docker containers have no IPv6 loopback, so the old
   form worked there. The six probe sites (three Compose files, three Dockerfiles) now use
   `127.0.0.1`.
2. **Wrong ose-www probe route.** The Compose probe named `/api/trpc/meta.health`, which only
   AyoKoding defines. It returned `404` on ose-www on `main` too. It now uses
   `/api/trpc/health.check`, and a test checks that the app registers that procedure.
3. **OrganicLever image could not build.** The Dockerfile stripped two workspace dependencies but not
   `@open-sharia-enterprise/ts-env-loader`, so `npm install` returned `404` from the public
   registry. This predates the migration. The Dockerfile now strips it, copies the library in, and
   installs its pinned `dotenv`.
4. **AyoKoding production type-check covered tests.** A unit test added earlier on this branch
   imports a sibling app that the image does not copy, so `next build` failed. A build-only
   tsconfig now excludes `tests/`; `typecheck` and lint still cover them.

## What `up --wait` does and does not prove

`podman-compose` 1.6.0 returned exit `0` from `up --wait` while the container's own health state
was `unhealthy`. The exit status therefore does not prove health. The proof reads the container's
health state with `podman inspect` and requests a real route, as above.

## AyoKoding stack: not proven locally

The AyoKoding image build passes the production type-check after the fix above and then fails only
for disk. Three attempts, from 32 GB, 44 GB and 44 GB free, each reached the end of `next build` and
were stopped by the HIPPO disk floor (`hippo.limit.storage-blocked`, exit `124`) during the image
export, with the host at about 3.5 GB free. The last attempt used `--layers=false` to halve the
layer cost and still ran out. The export alone stages about 16 GB in the build temp root, on top of
the layers. The host has one data disk, and the full image build needs roughly 40 GB or more of
headroom above the floor.

The manifest handoff (`podman cp`), the stack health, and the browser and API checks for port 3101
therefore have **no result yet**. This row stays open. It may be closed by freeing local disk and
rerunning `scripts` packet steps for the Ayo stack, or by a decision to accept another proof; no
workflow with a deploy job was dispatched to get one.
