# P3 manual container proof: organiclever-www (supported public site)

Date: 2026-10-28. Delivery bullet: Phase 3, "Manually open each supported public-site container in a real browser...".

## Result and scope

Result: PASS. The `organiclever-www` Podman container built, started, reported healthy, served `/`
with HTTP 200, and passed the home and navigation readiness checks in headless Chromium, Firefox,
and WebKit. This site has **no search and no backend API**, so those two checks do not apply (sources
below); nothing was invented to fill them.

Scope boundary. This is **container-level health, browser, and wire proof** against the Podman
service on host port 3200 only. It is **not** native fixture-server BDD proof: the
`organiclever-www-fe-e2e` target reuses whatever serves port 3200 and runs its own Playwright-BDD
scenarios. No Nx e2e target was run here. The checks below are readiness assertions taken from the
specs, run directly against the container.

Locales. `organiclever-www` is English-only: `apps/organiclever-www/src/app/layout.tsx` sets
`<html lang="en">`, and `apps/organiclever-www/src` has no locale, i18n, or hreflang code and no
locale routes (the only routes are `/`, from `src/app/page.tsx`). The specs under
`specs/apps/organiclever/www/` define no locale dimension. The one "Multilingual" mention on the page
is a principle card describing the separate OrganicLever app ("Full UI in English and Bahasa
Indonesia. Toggle in Settings."), not a locale of this site. The matrix therefore has one locale,
`en` (browser context locale `en-US`), and the page reported `lang="en"` in every browser.

Readiness paths are derived from these repository sources, not invented:

- Home: `specs/apps/organiclever/www/behaviours/frontend/home/home.feature` with
  `apps/organiclever-www-fe-e2e/src/steps/home.steps.ts`. All 9 scenarios were asserted: hero text,
  "Open the app" button, "Open app →", "Pre-Alpha" and the alpha banner, the five event types, the
  custom event card, "Last 7 days", and the six principles (19 distinct texts, each visible).
- Navigation: there is no navigation feature file. The site's only navigation is the landing nav,
  footer, and external links in `src/features/app-shell/components/` and
  `src/features/home/components/landing-hero.tsx`, plus the "Open the app" action
  (`window.location.href = "/app/home"` in `landing-page.tsx`). The labelled-landmark and
  single-`h1` checks come from `accessibility.feature` (structural only; no axe scan was run).
- Search: none. No search component, route, or dependency exists in `apps/organiclever-www/src`, and
  `specs/apps/organiclever/www/` has no search scenario.
- Backend API: none. `specs/apps/organiclever/www/behaviours/backend/README.md` states the site
  "owns no tRPC route handlers, REST endpoints, or other backend public boundary".
- Health: the compose healthcheck probes `http://127.0.0.1:3200` (the home page).

## Environment and versions

| Item                 | Value                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Podman               | 5.7.0 (`podman --version`)                                                                                                                                       |
| podman-compose       | 1.6.0 (`podman-compose --version`), explicit provider via env                                                                                                    |
| Rootless             | true (`podman info`), OCI runtime runc, amd64                                                                                                                    |
| Compose project      | `d2p-organiclever-www` (distinct, so no pre-existing resource was reused)                                                                                        |
| Compose file         | `infra/dev/organiclever-www/docker-compose.yml`                                                                                                                  |
| Base image           | `docker.io/library/node:24-alpine`                                                                                                                               |
| App runtime in image | Next.js 16.4.3 (from container log)                                                                                                                              |
| Playwright library   | from repo `node_modules` (same install as the ose-www record, 1.61.0)                                                                                            |
| Browser engines      | Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 (headless)                                                                                                    |
| Compute wrapper      | every command ran through `rtk ./hippo run --class ephemeral`; the image build used `--resource-tier heavy`, everything else `standard`; all exited 0, none shed |

`PODMAN_COMPOSE_PROVIDER` was set to the `podman-compose` on `PATH` and `TMPDIR` to a scratch
directory for the whole run. No Docker command was used.

## Revision

| Item                          | Value                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch                        | `docker-to-podman-base`                                                                                                                               |
| HEAD                          | `24a4c54d4`                                                                                                                                           |
| Working tree before the build | **dirty: 23 `git status --short` entries** (the image is built from the working tree, uncommitted changes included)                                   |
| Built image                   | `localhost/d2p-organiclever-www_organiclever-www:latest`, id `b1a3a824fd18482653cde2baadb17ddc0699c2b2ba27912dab2a0ce5a71c7a6b`, created 15:00:59 UTC |
| Container                     | `d2p-organiclever-www_organiclever-www_1`, id `17a012bfd99306ee562d783058926c56dd8024b9b7498032f54437b924ff5d6c`                                      |
| Network                       | `d2p-organiclever-www_default` (id `7e49952d1a1d`)                                                                                                    |

None of the 23 dirty entries is under `apps/organiclever-www/` or the other Dockerfile inputs
(`libs/web-ui`, `libs/web-ui-token`, `libs/ts-env-loader`, `scripts/next-with-port.mjs`). The root
`package.json` is dirty, but this Dockerfile copies only `apps/organiclever-www/package.json`, so it
is not an input here. The image content is therefore equal to HEAD `24a4c54d4`; it is still
recorded as a dirty-tree build rather than a clean-commit build.

## Stack commands and results

| Step | Command (run through `rtk ./hippo run`)                                                                                                 | Result                                                                                                                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `podman compose -p d2p-organiclever-www -f infra/dev/organiclever-www/docker-compose.yml config`                                        | exit 0. One service `organiclever-www`, build context `<repo>`, port `3200:3200`, env `PORT=3200`, `HOSTNAME=0.0.0.0`, healthcheck `wget --spider http://127.0.0.1:3200`, interval 10s, timeout 5s, retries 5, start_period 30s.                                                  |
| 2    | `podman compose -p d2p-organiclever-www -f infra/dev/organiclever-www/docker-compose.yml up --build --detach --wait --wait-timeout 120` | exit 0 (the provider, not a health proof, see below). Two-stage image build succeeded (`npx next build` included; build took about two minutes from 14:59:09 UTC) and tagged `localhost/d2p-organiclever-www_organiclever-www:latest`; network and container created and started. |
| 3    | `podman inspect --format '{{.State.Health.Status}}'` on the container                                                                   | `healthy`, `FailingStreak` 0, state `running`; health log entries exit 0 ("remote file exists"). Re-read after the browser run: still `healthy`.                                                                                                                                  |
| 4    | `podman ps`, `podman port`                                                                                                              | `Up ... (healthy)`, `0.0.0.0:3200->3200/tcp`.                                                                                                                                                                                                                                     |
| 5    | Container log                                                                                                                           | `Next.js 16.4.3`, `Local: http://localhost:3200`, `Network: http://0.0.0.0:3200`, `Ready in 173ms`. One Node `MODULE_TYPELESS_PACKAGE_JSON` warning (see observations). No errors.                                                                                                |

Because podman-compose 1.6.0 `up --wait` can exit 0 when a container is unhealthy (see
`evidence/P0/compose-provider-status.md`), the exit code was not treated as proof. The health
state was read natively (step 3) and real routes were requested (HTTP table). There was no failed
startup and nothing was repeated.

## HTTP health table

Commands used `rtk curl -sS -o /dev/null -w '%{http_code} %{content_type}'` against
`http://127.0.0.1:3200`.

| Path                                         | Expected | Observed | Content type               |
| -------------------------------------------- | -------- | -------- | -------------------------- |
| `/`                                          | 200      | 200      | `text/html; charset=utf-8` |
| `http://127.0.0.1:3200` (compose-health URL) | 200      | 200      | `text/html; charset=utf-8` |
| `/api/trpc/health.check` (negative probe)    | 404      | 404      | `text/html; charset=utf-8` |
| `/api/health` (negative probe)               | 404      | 404      | n/a                        |

The two negative probes only confirm the spec statement that the site has no API surface; they are
not endpoints of this site. Container health: `healthy` (compose-defined healthcheck on `/`).
Published ports: `0.0.0.0:3200->3200/tcp`.

## Browser matrix

All cells: headless, viewport 1000x700, context locale `en-US`, base `http://127.0.0.1:3200`,
no uncaught page errors in any browser. "Home" asserts `home.feature`; "Navigation" asserts the
landing nav, footer, external links, and the "Open the app" action. There is no Search row because
the site has no search.

| Locale | Browser  | Step       | URL                      | HTTP                                       | Title          | Asserted text and values (observed)                                                                                                                                                                                                                                                                                                            | Result |
| ------ | -------- | ---------- | ------------------------ | ------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| en     | Chromium | Home       | `http://127.0.0.1:3200/` | 200                                        | `OrganicLever` | `lang="en"`; exactly one h1 "Your life, tracked. Analyzed."; "Open the app" button visible; all 19 spec texts visible (hero, "Open app →", "Pre-Alpha", alpha banner, five event types, "Plus your own.", "Last 7 days", six principles)                                                                                                       | pass   |
| en     | Chromium | Navigation | `http://127.0.0.1:3200/` | `/app/home` 404 after "Open the app" click | `OrganicLever` | "Primary navigation" landmark labelled; brand button "OrganicLever"; badge "Pre-Alpha" (renders uppercase); footer "© 2026 OrganicLever · Pre-Alpha" and "Open app →"; "Open source" -> the external GitHub repository link and "Fork & make it yours" -> its fork link (host and account omitted), both `target=_blank`, `rel` has `noopener` | pass   |
| en     | Firefox  | Home       | `http://127.0.0.1:3200/` | 200                                        | `OrganicLever` | same values as Chromium Home                                                                                                                                                                                                                                                                                                                   | pass   |
| en     | Firefox  | Navigation | `http://127.0.0.1:3200/` | `/app/home` 404 after "Open the app" click | `OrganicLever` | same values as Chromium Navigation                                                                                                                                                                                                                                                                                                             | pass   |
| en     | WebKit   | Home       | `http://127.0.0.1:3200/` | 200                                        | `OrganicLever` | same values as Chromium Home                                                                                                                                                                                                                                                                                                                   | pass   |
| en     | WebKit   | Navigation | `http://127.0.0.1:3200/` | `/app/home` 404 after "Open the app" click | `OrganicLever` | same values as Chromium Navigation                                                                                                                                                                                                                                                                                                             | pass   |

Expected versus observed: every asserted element was visible and matched the spec text in all three
engines. `home.feature` expects the hero, button, footer link, badge, banner, five event cards, the
custom card, the weekly-rhythm demo, and six principles; all were found. The "Open the app" /
"Open app →" actions navigate to `/app/home`. That path belongs to the separate
`organiclever-app-web` deployable and is not served by this container, so the 404 is expected here
and is recorded as an observation, not a failure. The page renders identically in structure across
engines (see the captures); no visual comparison against a design was in scope.

Captures (jpeg, quality 55, viewport only, 1000x700), in `captures/`:

| File                                          | Bytes  |
| --------------------------------------------- | ------ |
| `organiclever-www-en-chromium-home.jpg`       | 37,033 |
| `organiclever-www-en-chromium-navigation.jpg` | 33,816 |
| `organiclever-www-en-firefox-home.jpg`        | 40,668 |
| `organiclever-www-en-webkit-home.jpg`         | 50,253 |

The navigation capture shows the footer view (principles list, "© 2026 OrganicLever · Pre-Alpha",
"Open app →").

## API request

None exists for this site. `specs/apps/organiclever/www/behaviours/backend/README.md` says
`organiclever-www` "owns no tRPC route handlers, REST endpoints, or other backend public boundary"
and that no `organiclever-www-be-e2e` project exists, and the app source has no route handlers
(`src/app/` holds only `layout.tsx`, `page.tsx`, `metadata.ts`, `globals.css`). No endpoint was
invented. The read-only wire request for this site is the HTTP `GET /` above (200, HTML). The
`organiclever-be` read-only API request and the DB/broker wire assertions belong to that backend's
own record. `organiclever-www` has no database or message broker.

## Defects and observations

No defect found. Observations, none blocking:

1. **Dockerfile `HEALTHCHECK` is ignored under Podman.** `podman build` warned twice:
   `HEALTHCHECK is not supported for OCI image format and will be ignored. Must use docker format`.
   The container was healthy only because the compose file defines its own healthcheck, and the
   container config confirms it. A standalone `podman run` of this image has no health status
   unless built with the docker image format or given a runtime health flag. Same decision for the
   plan owner as in the ose-www record.
2. **Compose environment names do not match what the image reads.** The compose file sets `PORT`;
   the image starts through `ORGANICLEVER_WWW_PORT` (default 3200). The site still served port
   3200 because the defaults match. This predates the migration and is unrelated to Podman.
3. **Node `MODULE_TYPELESS_PACKAGE_JSON` warning at startup.** `scripts/next-with-port.mjs` imports
   `libs/ts-env-loader/src/port-resolver.ts`, which Node reparses as an ES module because no
   `"type": "module"` is in scope. It costs a little startup time and has no functional effect.
4. **"Open the app" targets `/app/home`, which is a 404 on this container** (see above). Expected,
   since the app is a different deployable; a human may want to know the container alone does not
   complete that user journey.
5. **Provider status printed `-1` after the container id line** at the end of `up`, while the exit
   code was 0 and the container was healthy. This matches the P0 finding that the provider's
   status output is not reliable health proof.
6. **Build is not reproducible from a lockfile.** The Dockerfile runs `npm install` from the app
   `package.json` plus unpinned `radix-ui@^1.0.0`, `class-variance-authority@^0.7.0`, and others, so
   a later build can pull newer versions. The build also needs network access (npm and
   `next/font/google`). It succeeded here.
7. **Dirty working tree.** The build included uncommitted files (23 entries, none an input of this
   image). Re-run on a clean commit for a final revision-exact record if the plan requires that.

## Resources created and cleanup

Created by this run (all prefixed `d2p-` or built by the `d2p-organiclever-www` project):

- Container `d2p-organiclever-www_organiclever-www_1`
- Network `d2p-organiclever-www_default`
- Image `localhost/d2p-organiclever-www_organiclever-www:latest` (id `b1a3a824fd18`)
- One dangling build-stage image (the `build` stage, id `39221f3b466c`, created 15:00:28 UTC, last
  layer `npx next build`). It was absent from the pre-run snapshot, was created inside this build
  window, and had no container using it, so it was proven mine before removal. The build's
  non-dangling intermediate layers were removed with the two `rmi` calls below.
- Scratch scripts and logs under `local-tmp/claude/d2p/` (all `d2p-ol-` named; not committed).

Removed, in order:

1. `podman compose -p d2p-organiclever-www -f infra/dev/organiclever-www/docker-compose.yml down`
   (no `-v`): removed the container and the `d2p-organiclever-www_default` network, exit 0. No
   volumes were created or removed.
2. `podman rmi localhost/d2p-organiclever-www_organiclever-www`: untagged and deleted image
   `b1a3a824fd18` and its private layers.
3. `podman rmi 39221f3b466c`: removed the dangling `build`-stage image and its layers.

Verification: the post-cleanup snapshot of `podman ps -a`, `volume ls`, `network ls`, and `images`
is byte-identical to the pre-run snapshot (`diff` reported no difference), and `podman images -a`
shows nothing created after 14:59 UTC. Nothing created by this run remains. The shared
`docker.io/library/node:24-alpine` base image was already present and was not touched.
Pre-existing resources were not touched: `localhost/ose-www_ose-www`,
`localhost/organiclever-www_organiclever-www`, `localhost/ayokoding-env/python`, the retained
`d2p-pg-source-*` and `d2p-pg-target-*` volumes, the eight anonymous volumes, and the other
images. The native Ayo server on port 3101 was untouched and still listening; port 3200 is free
again.
