# P2 local stack proof (AC-03, AC-07 callers)

This file is the summary that `delivery.md` Phase 2 ("Development and container-backed test entry points") names as
`evidence/P2/local-stacks.md`. It does not repeat raw output. It states which supported local Compose stacks have a
recorded proof under rootless Podman, where each proof lives, and what is not proven locally. Every source file named
below is read-only input to this summary; open it for commands, ids, and ports.

Date: 2026-10-29. Head: `60a35faf1`. Podman 5.7.0 (Ubuntu, rootless), `podman-compose` 1.6.0 passed as
`PODMAN_COMPOSE_PROVIDER`. A task-owned `docker` shim logged 0 calls in the public-site runs. Stacks were stopped with
`down`, never `down -v`.

## Supported stacks

| Stack                                      | Compose file                                    | Port(s)                   | Local result                                                                                                                                                                     | Source                                                                                          |
| ------------------------------------------ | ----------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `ose-www` public site                      | `infra/dev/ose-www/docker-compose.yml`          | 3100                      | `config` exit 0, `up --build --detach --wait` exit 0, container `healthy`, `GET /` 200, `GET /api/trpc/health.check` 200; browser readiness in Chromium, Firefox and WebKit (en) | [compose-stacks](../P3/compose-stacks.md), [ose-www](../P3/manual/ose-www.md)                   |
| `organiclever-www` public site             | `infra/dev/organiclever-www/docker-compose.yml` | 3200                      | Same commands, container `healthy`, `GET /` 200; home and navigation readiness in three browsers (en). The site has no search and no backend API                                 | [compose-stacks](../P3/compose-stacks.md), [organiclever-www](../P3/manual/organiclever-www.md) |
| `ose-be` dependency stack (Postgres, NATS) | `apps/ose-be/docker-compose.e2e.yml`            | 5435, 4225 (backend 8302) | `config` exit 0; `ose-be-e2e:test:e2e` exit 0, 5 of 5 passed, the script owned start, backend and cleanup; direct Postgres and NATS wire pass; `GET /api/v1/health` 200          | [backends](../P3/manual/backends.md), [target matrix](../P3/target-matrix.md) row 76            |
| `organiclever-be` dependency stack         | `apps/organiclever-be/docker-compose.e2e.yml`   | 5436, 4226 (backend 8202) | `config` exit 0; `organiclever-be-e2e:test:e2e` exit 0, 12 of 12 passed; direct wire pass; `GET /health` 200                                                                     | [backends](../P3/manual/backends.md), [target matrix](../P3/target-matrix.md) row 88            |
| `ayokoding-www` public site                | `infra/dev/ayokoding-www/docker-compose.yml`    | 3101                      | **No local result.** See "Ayo row disposition" below                                                                                                                             | [ayokoding-www](../P3/manual/ayokoding-www.md), [ci](./ci.md)                                   |

Notes that bound these results:

- The public-site records are container-level health, browser and wire proof only. OSE's default `ose-www-fe-e2e` and
  `ose-www-be-e2e` targets use a native fixture server on port 3190 and never reach the Podman container on 3100.
- The backend stacks run Postgres and NATS in containers; the backends run as native `dotnet` processes, as the
  existing `run-e2e.sh` scripts start them.
- The two backend scripts call `scripts/container-runtime-check --compose` once, before the first mutation, and arm
  their teardown only after it passes (read in `apps/ose-be/scripts/run-e2e.sh` and the organiclever copy).
- `podman-compose` 1.6.0 returned exit 0 from `up --wait` while a container was `unhealthy`. The proofs therefore read
  the container health state with `podman inspect` and request a real route.
- Four defects found by running the real stacks (IPv6 loopback health probes, a wrong ose-www probe route, an
  OrganicLever image that could not build, an Ayo production type-check that covered tests) were fixed and each has a
  registered regression test; see [compose-stacks](../P3/compose-stacks.md).
- All site and backend records were built or run from a dirty working tree on top of `24a4c54d4`, with the
  uncommitted files outside each image's inputs as each record states. They give the revision as that head plus the
  working-tree changes, not a clean commit.

## Ayo row disposition

The local Ayo container proof (stack health, manifest handoff by `podman cp`, browser and API checks on port 3101) was
attempted five times (three in compose-stacks, two in the manual record) and stopped each time at the HIPPO disk floor (`hippo.limit.storage-blocked`, exit 124). The last
attempt had a clean build context and 54 GB free; it staged about 26 GB and was shed in static-page generation with
4.3 GB free ([ayokoding-www](../P3/manual/ayokoding-www.md), "Run 2"). No container, browser or API result exists
locally for Ayo.

The recorded disposition is:

- The container is proven in CI run 40693498144 (head `24a4c54d4`): the stack built and started on a runner with 81 GB
  free (51 GB after the build), the compose health wait passed, the prerender manifest was copied with `podman cp`, and
  row 26 ran 37 passed against it ([ci](./ci.md)).
- Browser engines and both locales (`en`, `id`) were exercised on a production build of the same tree served natively
  ([ui-gates](../P3/ui-gates/ui-web-quality-gate.md)). That is not container-level browser proof.
- Maintainer acceptance of this substitute proof is still needed; the Phase 3 manual item stays open until then
  (`delivery.md`).

## Unsupported scaffolds

`infra/dev/ose-app/` and `infra/dev/organiclever-app/` remain unsupported legacy scaffolds. Their callers got syntax and
caller migration only. The syntax-only commands from the plan
(`podman compose -f <dir>/docker-compose.yml -f <dir>/docker-compose.ci.yml config`) have no recorded run in this
file or in P3. Their workflow outputs are not supported-stack evidence. Rows 100 and 107 of the target matrix passed
natively on `60a35faf1` and are not stack proof either ([target matrix](../P3/target-matrix.md), notes on rows 100
and 107).

## Not proven here

- OrganicLever frontend E2E (`organiclever-www-fe-e2e:test:e2e`, row 64, 39 passed) reusing the Podman server on 3200:
  the row passed, but no record shows it attached to the container. The public-site record says only that the target
  would reuse whatever serves 3200.
- macOS Compose stack health and prerender copy (the macOS record covers the runner and platform probes only,
  [macos-platform](../P3/macos-platform.md)).
- The leftover Postgres anonymous volume per backend run and the ignored image-level `HEALTHCHECK` under the OCI image
  format are open observations, routed in [knowledge capture](../P5/knowledge-capture.md).
