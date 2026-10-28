# P3 manual container proof: ose-www (supported public site)

Date: 2026-10-28. Delivery bullet: Phase 3, "Manually open each supported public-site container in a real browser...".

## Result and scope

Result: PASS. The `ose-www` Podman container built, started, reported healthy, served `/` and
`/api/trpc/health.check` with HTTP 200, and passed the home, navigation, and search readiness
checks in headless Chromium, Firefox, and WebKit. The one existing read-only API request
(`health.check`) returned `status: "ok"`.

Scope boundary. This is **container-level health, browser, and wire proof** against the Podman
service on host port 3100 only. It is **not** native fixture-server BDD proof. OSE's default
`ose-www-fe-e2e` and `ose-www-be-e2e` targets use a native fixture server on port 3190 and never
reach this container; neither Nx e2e target was run here. The container serves the real
`apps/ose-www/content` tree (12 update files), not the e2e fixture content, so the checks below are
readiness assertions taken from the specs, not the fixture scenarios themselves.

Locales. `ose-www` is English-only: `apps/ose-www/src/app/layout.tsx` sets `<html lang="en">`, and
`apps/ose-www/src` has no locale, i18n, or hreflang code. The specs under `specs/apps/ose/www/`
define no locale dimension. The matrix therefore has one locale, `en` (browser context locale
`en-US`), and the page reported `lang="en"` in every browser.

Readiness paths are derived from these repository sources, not invented:

- Home: `specs/apps/ose/www/behaviours/frontend/landing/landing-page.feature` with
  `apps/ose-www-fe-e2e/src/steps/landing-page.steps.ts`.
- Navigation: `specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature` with
  `apps/ose-www-fe-e2e/src/steps/navigation.steps.ts`.
- Search: the header Search button and command dialog
  (`apps/ose-www/src/features/search/shell/search-dialog.tsx`), which calls the in-process tRPC
  `search.query` procedure also exercised by `specs/.../backend/search/search.feature`. There is no
  frontend search feature file, so the browser path is taken from the component.
- Health and API: `specs/apps/ose/www/behaviours/backend/health/health.feature`, the
  `health.check` procedure, and `apps/ose-www-be-e2e/src/steps/helpers.ts` (`buildTrpcUrl`).

## Environment and versions

| Item                 | Value                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Podman               | 5.7.0 (`podman --version`)                                                                                                                                       |
| podman-compose       | 1.6.0 (`podman-compose --version`), explicit provider via env                                                                                                    |
| Rootless             | true (`podman info`), OCI runtime runc, amd64                                                                                                                    |
| Compose project      | `d2p-ose-www` (distinct, so no pre-existing resource was reused)                                                                                                 |
| Compose file         | `infra/dev/ose-www/docker-compose.yml`                                                                                                                           |
| Base image           | `docker.io/library/node:24-alpine`                                                                                                                               |
| App runtime in image | Next.js 16.4.3 (from container log)                                                                                                                              |
| Playwright library   | 1.61.0 from repo `node_modules`                                                                                                                                  |
| Browser engines      | Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 (headless)                                                                                                    |
| Compute wrapper      | every command ran through `rtk ./hippo run --class ephemeral`; the image build used `--resource-tier heavy`, everything else `standard`; all exited 0, none shed |

`PODMAN_COMPOSE_PROVIDER` was set to the `podman-compose` on `PATH` and `TMPDIR` to a scratch
directory for the whole run. No Docker command was used.

## Revision

| Item                          | Value                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch                        | `docker-to-podman-base`                                                                                                                        |
| HEAD                          | `24a4c54d4`                                                                                                                                    |
| Working tree before the build | **dirty: 22 `git status --short` entries** (the image is built from the working tree, uncommitted changes included)                            |
| Built image                   | `localhost/d2p-ose-www_ose-www:latest`, id `4625a07711615ac5fb828225ad8065b325bea3679af21e4242618aa5f0e6c31f`, created 2026-10-28 14:54:10 UTC |
| Container                     | `d2p-ose-www_ose-www_1`, id `4f243ad0f3d7db64d0a9d9780369b3eb7bb93fcbeadccba043f7013e09ead99c`                                                 |
| Network                       | `d2p-ose-www_default` (id `8af2538a648d`)                                                                                                      |

None of the 22 dirty entries is under `apps/ose-www/` or `libs/ts-env-loader`, `libs/web-ui`, or
`libs/web-ui-token`. The root `package.json` and `package-lock.json` are Dockerfile inputs for
`npm ci`; `package.json` is among the dirty entries (the others are Ayo app, spec, plan-evidence,
and workflow files). The serving revision is therefore "HEAD `24a4c54d4` plus the working-tree
`package.json` change", and it is recorded as dirty rather than as a clean commit.

## Stack commands and results

| Step | Command (run through `rtk ./hippo run`)                                                                               | Result                                                                                                                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `podman compose -p d2p-ose-www -f infra/dev/ose-www/docker-compose.yml config`                                        | exit 0. One service `ose-www`, build context `<repo>`, port `3100:3100`, healthcheck `wget --spider http://127.0.0.1:3100/api/trpc/health.check`, interval 10s, timeout 5s, retries 5, start_period 30s. |
| 2    | `podman compose -p d2p-ose-www -f infra/dev/ose-www/docker-compose.yml up --build --detach --wait --wait-timeout 120` | exit 0 (the provider, not a health proof, see below). Three-stage image build succeeded and tagged `localhost/d2p-ose-www_ose-www:latest`; network and container created and started.                    |
| 3    | `podman inspect --format '{{.State.Health.Status}}'` on the container                                                 | `healthy`, `FailingStreak` 0, state `running`; health log entries exit 0 ("remote file exists"). Re-read after the browser run: still `healthy`.                                                         |
| 4    | `podman ps`, `podman port`                                                                                            | `Up ... (healthy)`, `0.0.0.0:3100->3100/tcp`.                                                                                                                                                            |
| 5    | Container log                                                                                                         | `Next.js 16.4.3`, `Local: http://localhost:3100`, `Network: http://0.0.0.0:3100`, `Ready in 0ms`. No errors.                                                                                             |

Because podman-compose 1.6.0 `up --wait` can exit 0 when a container is unhealthy (see
`evidence/P0/compose-provider-status.md`), the exit code was not treated as proof. The health
state was read natively (step 3) and real routes were requested (HTTP table). There was no failed
startup and nothing was repeated.

## HTTP health table

Commands used `rtk curl -sS -o /dev/null -w '%{http_code} %{content_type}'` against
`http://127.0.0.1:3100`.

| Path                     | Expected | Observed | Content type               |
| ------------------------ | -------- | -------- | -------------------------- |
| `/`                      | 200      | 200      | `text/html; charset=utf-8` |
| `/api/trpc/health.check` | 200      | 200      | `application/json`         |

Container health: `healthy` (compose-defined healthcheck, which probes `/api/trpc/health.check`).
Published ports: `0.0.0.0:3100->3100/tcp`.

## Browser matrix

All cells: headless, viewport 1000x700, context locale `en-US`, base `http://127.0.0.1:3100`,
no uncaught page errors in any browser. "Home" asserts the landing-page scenario; "Navigation"
asserts the header, footer, and About breadcrumb scenarios; "Search" opens the dialog and queries.

| Locale | Browser  | Step       | URL                           | HTTP                    | Title                                | Asserted text and values (observed)                                                                                                                                                                                                                                    | Result |
| ------ | -------- | ---------- | ----------------------------- | ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| en     | Chromium | Home       | `http://127.0.0.1:3100/`      | 200                     | `OSE Platform`                       | h1 "Open Sharia Enterprise Platform"; mission text "Open-source (MIT) platform for Sharia-compliant enterprise solutions..."; Learn More -> `/about`; GitHub -> the external GitHub repository link (host and account omitted); RSS -> `/feed.xml`                     | pass   |
| en     | Chromium | Navigation | `http://127.0.0.1:3100/about` | n/a (client navigation) | `About OSE Platform \| OSE Platform` | header Updates -> `/updates`, About -> `/about`, Documentation and GitHub external `https://` with `target=_blank` and `rel` containing `noopener`; footer link to the external AyoKoding site host (omitted); About h1 "About OSE Platform"; breadcrumb "Home" -> `/` | pass   |
| en     | Chromium | Search     | `http://127.0.0.1:3100/`      | `search.query` 200      | `OSE Platform`                       | dialog hint "Type to search..."; query "phase" returned 9 options, first "Phase 0 Week 4: Initial Commit"                                                                                                                                                              | pass   |
| en     | Firefox  | Home       | `http://127.0.0.1:3100/`      | 200                     | `OSE Platform`                       | same values as Chromium Home                                                                                                                                                                                                                                           | pass   |
| en     | Firefox  | Navigation | `http://127.0.0.1:3100/about` | n/a (client navigation) | `About OSE Platform \| OSE Platform` | same values as Chromium Navigation                                                                                                                                                                                                                                     | pass   |
| en     | Firefox  | Search     | `http://127.0.0.1:3100/`      | `search.query` 200      | `OSE Platform`                       | same hint; "phase" returned 9 options, same first result                                                                                                                                                                                                               | pass   |
| en     | WebKit   | Home       | `http://127.0.0.1:3100/`      | 200                     | `OSE Platform`                       | same values as Chromium Home                                                                                                                                                                                                                                           | pass   |
| en     | WebKit   | Navigation | `http://127.0.0.1:3100/about` | n/a (client navigation) | `About OSE Platform \| OSE Platform` | same values as Chromium Navigation                                                                                                                                                                                                                                     | pass   |
| en     | WebKit   | Search     | `http://127.0.0.1:3100/`      | `search.query` 200      | `OSE Platform`                       | same hint; "phase" returned 9 options, same first result                                                                                                                                                                                                               | pass   |

Expected versus observed: every asserted element was visible and matched the spec text. The
landing scenario expects a hero title, mission description, "Learn More" link to `/about/`, a
"GitHub" link, a GitHub icon link, and an RSS icon link. The navigation scenarios expect the
header, footer, and breadcrumb values listed. Observed values match in all three engines. The
home page, About page, and search dialog render identically in structure across engines (see the
captures); no visual comparison against a design was in scope.

Captures (jpeg, quality 55, viewport only, 1000x700), in `captures/`:

| File                                 | Bytes  |
| ------------------------------------ | ------ |
| `ose-www-en-chromium-home.jpg`       | 36,854 |
| `ose-www-en-chromium-navigation.jpg` | 43,554 |
| `ose-www-en-chromium-search.jpg`     | 34,549 |
| `ose-www-en-firefox-home.jpg`        | 41,282 |
| `ose-www-en-webkit-home.jpg`         | 49,485 |

## API request

One existing read-only request, the tRPC `health.check` procedure that `health.feature` and the
compose healthcheck use, in the batch form that `buildTrpcUrl("health.check", undefined)` produces:

```text
rtk curl -sS "http://127.0.0.1:3100/api/trpc/health.check?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D"
[{"result":{"data":{"json":{"status":"ok"}}}}]
http=200
```

Expected: HTTP 200 and `status: "ok"` (health.feature: "the response contains status ok").
Observed: HTTP 200, `[{"result":{"data":{"json":{"status":"ok"}}}}]`. The unbatched compose
healthcheck URL returned `{"result":{"data":{"json":{"status":"ok"}}}}` with HTTP 200.

Search was also exercised as a read-only wire call by the browser dialog, not by `curl`: each
browser sent one `search.query` request and received HTTP 200. `ose-www` has no database and no
message broker, so there is no DB or broker wire assertion for this site.

## Defects and observations

No defect found. Observations, none blocking:

1. **Dockerfile `HEALTHCHECK` is ignored under Podman.** `podman build` warned twice:
   `HEALTHCHECK is not supported for OCI image format and will be ignored. Must use docker format`.
   The container was healthy only because the compose file defines its own healthcheck, and the
   container config confirms it. A standalone `podman run` of this image (for example one pulled
   from GHCR) has no health status unless built with the docker image format or given a runtime
   health flag. Decision for the plan owner: whether the Phase 3 image-publishing work should keep
   the image-level healthcheck or build with the docker format.
2. **Compose environment names do not match what the app reads.** The compose file sets
   `CONTENT_DIR` and `PORT`; the app reads `OSE_WEB_CONTENT_DIR` (`src/env.ts`) and the image
   starts through `OSE_WWW_PORT`. The site still served the baked content and port 3100 because
   defaults match, so behaviour is correct. This predates the migration and is unrelated to Podman.
3. **Header About link is `/about`, scenario text says `/about/`.** The step definition accepts
   both forms, so this is not a failure.
4. **Provider status printed `-1` after the container id line** at the end of `up`, while the exit
   code was 0 and the container was healthy. This matches the P0 finding that the provider's
   status output is not reliable health proof.
5. **Dirty working tree.** The build included uncommitted files (22 entries, all outside the
   `ose-www` inputs except the root `package.json`). Re-run on a clean commit for a final
   revision-exact record if the plan requires that.

The working-tree dirty count was 22 at this record's build and 23 in later records; the tree changed between runs.

## Resources created and cleanup

Created by this run (all prefixed `d2p-` or built by the `d2p-ose-www` project):

- Container `d2p-ose-www_ose-www_1`
- Network `d2p-ose-www_default`
- Image `localhost/d2p-ose-www_ose-www:latest` (id `4625a0771161`)
- Two dangling build-stage images (the `deps` stage, id `80bcd20aa6f5`, created 14:51:04 UTC, last
  layer `npm ci --ignore-scripts`; the `builder` stage, id `25f078a2d54b`, created 14:54:01 UTC,
  layers `npm run build`, `generate-search-data.ts`, `WORKDIR /workspace/apps/ose-www`). Both were
  absent from the pre-run snapshot, were created inside this build window, had no container using
  them, and carried the ose-www stage layers, so they were proven mine before removal.
- Scratch scripts and logs under `local-tmp/claude/d2p/` (all `d2p-` named; not committed).

Removed, in order:

1. `podman compose -p d2p-ose-www -f infra/dev/ose-www/docker-compose.yml down` (no `-v`): removed
   the container and the `d2p-ose-www_default` network, exit 0. No volumes were created or removed.
2. `podman rmi localhost/d2p-ose-www_ose-www`: untagged and deleted image `4625a0771161` and its
   private layers.
3. `podman rmi 25f078a2d54b 80bcd20aa6f5`: removed the two dangling stage images and their layers.

Verification: the post-cleanup snapshot of `podman ps -a`, `volume ls`, `network ls`, and `images`
is byte-identical to the pre-run snapshot (`diff` reported no difference). Nothing created by this
run remains. The shared `docker.io/library/node:24-alpine` base image was already present and was
not touched. Pre-existing resources were not touched: `localhost/ose-www_ose-www`,
`localhost/organiclever-www_organiclever-www`, `localhost/ayokoding-env/python`, the retained
`d2p-pg-source-*` and `d2p-pg-target-*` volumes, the eight anonymous volumes, and the other
images. The native Ayo server on port 3101 was untouched and still listening; port 3100 is free
again.
