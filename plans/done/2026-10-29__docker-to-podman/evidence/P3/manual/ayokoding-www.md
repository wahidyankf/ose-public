# P3 manual container proof: ayokoding-www (supported public site)

Date: 2026-10-28. Delivery bullet: Phase 3, "Manually open each supported public-site container in a real browser...".

## Result and scope

Result: **BLOCKED by host capacity, not run.** The `ayokoding-www` image build, done once through
`rtk ./hippo run --class ephemeral --resource-tier heavy`, was stopped by the HIPPO disk floor
(`hippo.limit.storage-blocked`, exit 124) at `STEP 5/13` of the `builder` stage, before the runner
stage and before any container existed. Consequently **no container, health, HTTP, manifest-handoff,
browser, capture, or API result exists** for this site. Nothing below the "Build attempt" section is
a pass; the proof items are listed as not run in "Items and status". No workaround that bypasses or
loosens HIPPO was tried, and HIPPO config was not touched.

This is the fourth failed build of this image for the same reason (see
`evidence/P3/compose-stacks.md`, three earlier attempts). It differs from those in where it stopped
and in a newly found cause that makes the build cost larger than the earlier note assumed (see
"Root cause").

Scope boundary that would have applied. Container-level health, browser, and wire proof against the
Podman service only. Not native fixture-server BDD proof: a native Ayo server owned by the caller
holds host port 3101 and stays a different artifact. No Nx e2e target was run and none of the native
server's data was used.

## Items and status

| Item                                                       | Status  | Note                                                                      |
| ---------------------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| 1. Stack up, HTTP codes, container health, ports           | not run | Image never built; no container created.                                  |
| 2. Manifest handoff (`podman cp` of prerender manifest)    | not run | No container to copy from. No file was written to the scratch path.       |
| 3. Real-browser matrix (en, id; Chromium, Firefox, WebKit) | not run | Script is prepared (see below) but was never executed; no captures taken. |
| 4. One read-only API request (`meta.health`)               | not run | Nothing serving on the task port.                                         |
| 5. Serving revision, image id, container id                | partial | Source revision recorded; no image or container ids exist.                |
| 6. Container-level versus native separation                | stated  | See scope above.                                                          |
| 7. This record                                             | done    |                                                                           |
| 8. Cleanup of what was created                             | done    | Snapshot diff is empty; see "Cleanup".                                    |

## Environment and versions

| Item            | Value                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Podman          | 5.7.0 (`podman --version`)                                                                                                                                                            |
| podman-compose  | 1.6.0, explicit provider via `PODMAN_COMPOSE_PROVIDER="$(command -v podman-compose)"`                                                                                                 |
| Rootless        | true (`podman info`)                                                                                                                                                                  |
| Compose project | `d2p-ayokoding-www` (distinct name, so no pre-existing resource could be reused)                                                                                                      |
| Compose file    | task-owned copy `<repo>/local-tmp/claude/d2p/d2p-ayokoding-www.compose.yml` (diff below)                                                                                              |
| Base image      | `docker.io/library/node:24-alpine` (already present, not touched)                                                                                                                     |
| Compute         | `config` through `rtk ./hippo run --class ephemeral --resource-tier standard`, exit 0; `up --build` through `--resource-tier heavy`, **exit 124**; cleanup through `standard`, exit 0 |
| Build temp      | `TMPDIR=<tmp>` (a directory on the same disk, `mkdir -p` was a no-op because it existed)                                                                                              |
| Docker          | no Docker command was used                                                                                                                                                            |

## Port deviation and compose copy

The only deviation from the command packet. `infra/dev/ayokoding-www/docker-compose.yml` publishes
host port 3101, which the caller's native Ayo server already holds and must not be stopped. A
task-owned copy maps the host side to 3111 instead (`3111:3101`). The container port, environment,
and healthcheck (which probes `127.0.0.1:3101` inside the container) are unchanged, so container
behaviour would have been identical; the host URL would have been `http://127.0.0.1:3111`. The
copy's build context is the absolute repo root because the original uses the relative `../../../`.

Diff of the original against the copy (the absolute path is shown as `<repo>`):

```diff
4c4
<       context: ../../../
---
>       context: <repo>
7c7
<       - "3101:3101"
---
>       - "3111:3101"
```

`podman compose -p d2p-ayokoding-www -f <copy> config` exited 0 (through HIPPO, standard tier) and
resolved one service `ayokoding-www`: build context `<repo>`, dockerfile
`apps/ayokoding-www/Dockerfile`, port `3111:3101`, env `AYOKODING_WEB_CONTENT_DIR`,
`AYOKODING_WEB_MANIFESTS_DIR=/app/apps/ayokoding-www-fe-e2e/fixtures/manifests`,
`AYOKODING_WEB_SHOW_DRAFTS=true`, `HOSTNAME=0.0.0.0`, `PORT=3101`, healthcheck
`wget --no-verbose --tries=1 --spider http://127.0.0.1:3101/api/trpc/meta.health`, interval 10s,
timeout 5s, retries 5, start_period 30s.

## Revision

| Item                   | Value                                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch                 | `docker-to-podman-base`                                                                                                                                   |
| HEAD                   | `24a4c54d4`                                                                                                                                               |
| Working tree           | **dirty: 23 `git status --short` entries** at build time; the image is built from the working tree, uncommitted included                                  |
| Dirty image inputs     | 7 entries under `apps/ayokoding-www/` (`src/features/content/shell/mermaid.tsx` and 6 unit-test files) and root `package.json` (the Dockerfile copies it) |
| Image id, container id | none: no image was committed and no container was created                                                                                                 |

## Build attempt (the only one)

Command, run once through `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . --`:
`podman compose -p d2p-ayokoding-www -f <copy> up --build --detach --wait --wait-timeout 150`,
started 15:05:55 UTC.

Exact HIPPO output at the stop:

```text
[2/3] STEP 5/13: COPY apps/ayokoding-www/ ./apps/ayokoding-www/
HIPPO shedding selected ephemeral child after disk-warning.
hippo: [hippo.limit.storage-blocked] the disk floor stopped this work; free space before retrying
hippo-exit=124
```

The deps stage (`npm ci --ignore-scripts`) completed; the builder stage reached `COPY apps/ayokoding-www/`
and was killed there. No `next build` ran, so unlike the earlier attempts this one never got to the
production type-check.

Free disk on the single data disk (`df`, the only disk the build writes to):

| Point                                    | Free                                                       |
| ---------------------------------------- | ---------------------------------------------------------- |
| Before the build (15:05 UTC)             | 36.1 GiB (38,748,250,112 bytes), 79% used                  |
| About 3 minutes in (deps stage finished) | 34 G                                                       |
| 15:11:58 UTC, builder `COPY` in progress | 16 G                                                       |
| 15:13 to 15:14 UTC, last trace samples   | 14 G, 13 G, 12 G, 9.9 G, 8.7 G, 8.0 G, 7.2 G, 6.5 G, 4.7 G |
| At the HIPPO stop (build killed)         | 3.4 G (3,650,371,584 bytes), 98% used                      |
| After cleanup                            | 36.1 GiB (38,745,989,120 bytes), 79% used                  |

So one attempt consumed about 35 GB before it stopped, of which about 8.8 GB sat in the build temp
root and the rest in the container storage layers.

Memory was not the limit: about 5 GB was available throughout (7.6 GB total, swap in use).

## Root cause (read-only investigation, nothing edited)

1. **The native Ayo build output is copied into the image build context.** The caller's native
   build left `apps/ayokoding-www/.next` at about **18 GB** in the working tree (`.next/standalone`
   about 9.0 GB, `.next/server` about 8.9 GB, almost all of it `server/app/en/learn` prerendered
   output, 23,036 files under `server/app`). The builder stage runs `COPY apps/ayokoding-www/
./apps/ayokoding-www/`, which therefore wrote that 18 GB into a layer before `next build` even
   started. `.next` is gitignored, so a clean CI checkout does not have it; a developer machine
   that has built natively does.
2. **The app-level ignore file does not apply to this build.** `apps/ayokoding-www/.dockerignore`
   lists `.next/`, but the build context is the repo root, and the container tools read only the
   `.dockerignore` at the context root (or a Dockerfile-named ignore file next to the Dockerfile,
   which does not exist). The root `.dockerignore` has no `.next` entry. This is an existing defect
   in the repository, independent of Podman: it would also copy `.next` under Docker with the same
   context.
3. **Even without the stale `.next`, the earlier three attempts show the image is itself large.**
   The in-container `next build` produces the same roughly 18 GB `.next`, the standalone copy adds
   about 9 GB to the runner image, and the image export stages about 16 GB in the build temp root
   (`evidence/P3/compose-stacks.md`). So removing cause 1 would roughly halve this attempt's cost
   but would not by itself prove the build fits in the 36 GB that was free before it, above the
   HIPPO floor of about 3.5 GB.

I cannot change cause 1: the `.next` directory belongs to the caller's native server, and deleting
or editing anything under `apps/ayokoding-www` was out of scope for this task.

## Prepared but not run

`<repo>/local-tmp/claude/d2p/d2p-ayo-browser.mjs` (scratch, not committed) was written to run the
matrix against `http://127.0.0.1:3111` in headless Chromium, Firefox, and WebKit at 1000x700 with
JPEG quality 55, viewport only, saving to `captures/ayokoding-www-<locale>-<browser>-<step>.jpg`.
It was never executed, so it has produced no evidence. Its inputs, derived from the repository:

- Locales: `en` and `id`. Source: `apps/ayokoding-www/src/features/i18n/core/config.ts`
  (`SUPPORTED_LOCALES = ["en", "id"]`, default `en`), `content/en` and `content/id`, and
  `specs/apps/ayokoding/www/behaviours/frontend/i18n/i18n.feature` (switcher shows "English",
  switching goes to `/id/...`, Indonesian labels "Belajar" and "Alat").
- Home: hero heading per locale (`heroHeading` in `translations.ts`), intro, two CTAs, primary
  navigation `Learn`/`Belajar` and `Tools`/`Alat`, language switcher text, tools teaser link
  `/<locale>/tools/cost-of-living-calculator`, footer navigation.
- Navigation: `navigation.feature` and `i18n.feature` (primary nav to the Tools page, sidebar tree
  with expandable nodes, breadcrumb and table of contents on
  `/en/learn/courses/just-enough-python/learning/beginner`, root `/` to `/en`, uppercase `/EN/...`
  permanent redirect to lowercase, language switch on `/en/tools/ai-benchmark`).
- Search: `search.feature` (Ctrl/Cmd+K opens the dialog with the combobox focused, debounced
  results each with title, section path and excerpt, Escape closes, a click-through to the AI
  Model Benchmark tool page).
- Read-only API request: `GET /api/trpc/meta.health` (the compose healthcheck route;
  `backend/health/*.feature`, expected body shape `{"status":"ok"}` inside the tRPC batch
  envelope). `meta.languages` is the second existing health-feature procedure. Ayo has no database
  or message broker, so there are no DB or broker wire assertions for this site.
- Manifest handoff: container lookup by labels `io.podman.compose.project=d2p-ayokoding-www` and
  `com.docker.compose.service=ayokoding-www` (project name overridden, so the packet's
  `ayokoding-www` label value does not match), nonempty check, then `podman cp` of
  `/app/apps/ayokoding-www/.next/prerender-manifest.json` to scratch `<repo>/local-tmp/claude/d2p/`,
  not to the `apps/ayokoding-www-fe-e2e/.e2e-artifacts` path the packet uses.

## Cleanup

The failed build left objects in Podman storage that `compose down` does not see because no
Compose container existed. All were proven mine by timestamp and by absence from the pre-run
snapshot.

Created, then removed:

- 12 external Buildah working containers (`node-working-container`, `node-working-container-1`,
  and ten `<image-id>-working-container[-1]` containers), all created 15:06:05 to 15:09:20 UTC inside
  the build window. A plain `podman rm` refused ("container is mounted"); they were removed with
  `podman rm --force` by explicit id, which only touches those 12.
- 9 untagged build-stage images (`92c6157c47e4`, `aebaac6912bb`, `b16a2eda5133`, `7ea263174493`,
  `08ea7e7be282`, `ce14581476ac`, `1c283b79426a`, `e2672b53fc51`, `b0797a8f3fe0`), all absent from the
  pre-run snapshot and created 15:06:05 to 15:09:20 UTC. The first `podman rmi` removed the chain;
  the later calls reported "image not known" because it was already gone.
- Build temp under `<tmp>`: two directories created at the start of the build
  (`buildah902601601`, 8.8 GB, and `container_images_storage675759839`, 4 KB), removed by exact name.
  A third directory there (`d2p-pg.<timestamp>-<n>.<suffix>`) belongs to the Postgres rehearsal
  record, was present before this task, and was left alone.
- Scratch under `<repo>/local-tmp/claude/d2p/` named `d2p-ayo-*` and the pre/post snapshots (not
  committed).

Not created, so nothing to remove: Compose container `d2p-ayokoding-www_ayokoding-www_1`, network
`d2p-ayokoding-www_default`, image `localhost/d2p-ayokoding-www_ayokoding-www`, volumes. No `down -v`,
no prune.

Verification:

- Pre-run snapshot `local-tmp/claude/d2p/pre-snapshot-ayokoding-www.txt` (`podman ps -a`, `volume ls`,
  `network ls`, `images`, `images -a`, `df`, temp-root listing) and the post-cleanup snapshot are
  **identical** (`diff` reported nothing, including `df`: 36.1 GiB free both times).
- `podman ps -a --external` is empty; `podman images -a` equals the pre-run list.
- Pre-existing resources were untouched: `localhost/ose-www_ose-www`,
  `localhost/organiclever-www_organiclever-www`, `localhost/ayokoding-env/python`, the
  `docker.io/library/*` images, the retained `d2p-pg-source-*` and `d2p-pg-target-*` volumes, the
  eight anonymous volumes, and the `podman` network.
- The caller's native Ayo server was not touched: it still listens on `0.0.0.0:3101` and answers
  `GET /api/trpc/meta.health` with HTTP 200 after cleanup. Nothing listens on 3111.
- `apps/ayokoding-www/.next` and everything else under `apps/ayokoding-www` was only read.

## Defects and observations

1. **Defect (build, existing):** the root `.dockerignore` does not exclude `.next`, and the
   app-level `apps/ayokoding-www/.dockerignore` that does list it is not applied for a repo-root
   context. A developer tree that has a native build copies about 18 GB of build output into the
   image. A fix belongs to a `swe-*` agent (for example a root-level `.next` exclusion or a
   `Dockerfile.dockerignore` next to the Dockerfile) and needs the usual BDD and gate treatment.
   Not applied here: this task may not edit config.
2. **Capacity (host):** even with defect 1 fixed, the Ayo image is large (about 18 GB `.next` in
   the build, about 9 GB standalone in the runner, about 16 GB staged at export). Earlier attempts
   at 32 to 44 GB free all stopped at the floor. The row stays unproven until the disk has
   considerably more headroom or another proof is accepted.
3. **Packet label value:** the packet's `podman ps` filter uses `io.podman.compose.project=ayokoding-www`.
   With a project name override (`-p d2p-ayokoding-www`) the value must follow the override; this
   task's planned lookup used `d2p-ayokoding-www`. Not observed live because no container started.

## Needs a human decision

- Free disk (or move the Podman storage and temp roots to a larger disk) and rerun, or accept
  another proof for the Ayo row (for example the CI workflow with a deploy job).
- Decide whether to fix the `.next` context leak (defect 1) as a separate delivery slice; it is
  independent of the Podman migration.
- After either, rerun this record on a clean tree if a revision-exact result is required. If the
  caller's native server on 3101 is still running, keep the 3111 mapping of the task-owned copy.

## Run 2: clean build context (second local attempt)

Observed facts only:

- Before this attempt the native `apps/ayokoding-www/.next` and `generated/search-data.json` were deleted, so the build
  context no longer carried the 18 GB build output (defect 1 was not in play).
- Free disk before the build was 54 GB. The `podman compose up --build` run under HIPPO (`ephemeral`, `heavy`) staged
  about 26 GB under the build temp root and reached the Next.js static-page generation step (1,969 of 3,278 pages), then
  HIPPO shed it with `hippo.limit.storage-blocked` after the disk warning. Free disk was 4.3 GB at that point.
- The shed run started no container. No browser, health, or API evidence exists for a local Ayo container.
- Cleanup, all by exact id: 20 buildah working containers and 2 untagged build-stage images created in the build window,
  and the two build temp directories (18 GB and 8.1 GB). Free disk returned to 54 GB, and `podman system df` returned to
  its earlier baseline (41 images, 2.802 GB, 0 containers).

## Disposition for the Ayo container row

The local container browser row is not provable on this host: the Ayo image build alone needs more than the 54 GB that is
free. The accepted proof for the container itself is the CI runner evidence in
[P2/ci.md](../../P2/ci.md), run 40693498144 on head 24a4c54d4:

- `podman compose ... up --build --detach --wait` built and started the Ayo stack on a 145 GB runner (81 GB free before,
  51 GB after) and the compose health wait passed.
- Row 26 (`ayokoding-www-be-e2e:test:e2e`) ran 37 passed against that container.
- The prerender manifest was copied out of the container with `podman cp`.

Browser engines and locales (`en`, `id`) were exercised on a production build of the same tree served natively: see
[ui-gates](../ui-gates/ui-web-quality-gate.md). That is not container-level browser proof, and this record does not claim
it is.
