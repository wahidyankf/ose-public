# P3 manual container wire proof: ose-be and organiclever-be (backend dependency stacks)

Date: 2026-10-28. Delivery bullet: Phase 3, "...run one existing read-only backend API request per
backend and the existing DB/broker E2E wire assertions."

## Result and scope

Result: PASS for both backends, every item (A to F). Nothing failed and nothing was retried.

| Backend         | Compose config | Nx E2E target                          | Scenarios                   | Direct dependency wire | One read-only API request                       | Cleanup                      |
| --------------- | -------------- | -------------------------------------- | --------------------------- | ---------------------- | ----------------------------------------------- | ---------------------------- |
| ose-be          | exit 0         | exit 0, `ose-be-e2e:test:e2e`          | 5 passed, 0 failed, 0 skip  | PASS (Postgres, NATS)  | `GET /api/v1/health` 200 `{"status":"healthy"}` | complete, snapshot identical |
| organiclever-be | exit 0         | exit 0, `organiclever-be-e2e:test:e2e` | 12 passed, 0 failed, 0 skip | PASS (Postgres, NATS)  | `GET /health` 200 `{"status":"ok"}`             | complete, snapshot identical |

Scope boundary (item F). This is **container-level DB and broker wire proof for the two backend
dependency stacks** (rootless Podman Compose running `postgres:17-alpine` and `nats:latest`), plus
the real backend processes talking to them. It is **not site proof**: no public-site container,
browser, or locale was involved. The backends themselves run as native `dotnet` processes (as the
existing `run-e2e.sh` scripts do), not as containers; the backend container images are a separate
Phase 3 item. No Docker command was used.

Specs read to derive every expectation:
`specs/apps/ose/be/behaviours/{health,db,messaging}` and
`specs/apps/organiclever/be/behaviours/{health,db,messaging,journal}`. No endpoint was invented.

## Environment and versions

| Item            | Value                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Podman          | 5.7.0 (`podman --version`)                                                                                                                                                          |
| podman-compose  | 1.6.0 (`podman-compose --version`), selected through `PODMAN_COMPOSE_PROVIDER` (path of `podman-compose` on `PATH`)                                                                 |
| Rootless        | `true` (`podman info`); the scripts' own `scripts/container-runtime-check --compose` preflight passed in both runs                                                                  |
| .NET SDK        | 10.0.402                                                                                                                                                                            |
| Postgres server | 17.11 (container `postgres:17-alpine`)                                                                                                                                              |
| NATS server     | 2.15.2, JetStream enabled (INFO banner `"jetstream":true`)                                                                                                                          |
| Compute wrapper | every command ran through `rtk ./hippo run --class ephemeral`; `heavy` for the `nx` E2E runs and the dotnet build and backend start, `standard` for compose and inspect; all exit 0 |
| Scratch         | `TMPDIR` pointed at a scratch directory; helper script and logs under `local-tmp/claude/d2p/` (uncommitted)                                                                         |

Ownership model. The existing entry points own their Compose project names (`ose-be-e2e`,
`organiclever-be-e2e`), which are not `d2p-` prefixed; that is the existing contract. Ownership is
proved by snapshot diff instead: before the run no container, network, or project resource with
those names existed (`podman ps -a` empty, only the default `podman` network), and after cleanup
they exist nowhere. Ports 5435, 4225, 8302, 5436, 4226, and 8202 were all free before each stack
and free after.

## Revision (item D)

| Item                 | Value                                                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch and HEAD      | `docker-to-podman-base` at `24a4c54d4`                                                                                                                                                                                 |
| Working tree         | **dirty: 23 `git status --short` entries** at the time of both backend runs; none under `apps/ose-be*` or `apps/organiclever-be*` (the entries are Ayo app, spec, plan-evidence, workflow, and `package.json` changes) |
| Postgres image       | `docker.io/library/postgres:17-alpine`, id `ab20e934b27b...`, a pre-existing pulled image (not pulled or removed by this run)                                                                                          |
| NATS image           | `docker.io/library/nats:latest`, id `38de3ef4102d...`, a pre-existing pulled image (not pulled or removed by this run)                                                                                                 |
| Backend build        | `dotnet build ... --configuration Release --nologo -v quiet`: exit 0, "Build succeeded", 0 warnings, 0 errors, for both backends (the script's own build in the E2E run, and a second build in the manual API step)    |
| Backend build output | `apps/ose-be/src/OseBe/bin` and `obj`, and `apps/organiclever-be/src/OrganicleverBe/bin` and `obj`, exist and are gitignored; they were not deleted (they predate this run or are rebuilt in place)                    |

The backends run from the working tree, so the serving revision is "HEAD `24a4c54d4` plus the
dirty tree", recorded as dirty rather than as a clean commit. The 23 entries do not touch backend
inputs, so a clean-commit re-run would exercise identical backend code.

## ose-be

Compose file `apps/ose-be/docker-compose.e2e.yml`, project `ose-be-e2e`. Services: `postgres`
(`postgres:17-alpine`, database `ose_app`, host port 5435, native healthcheck `pg_isready`,
interval 5s, timeout 5s, retries 5) and `nats` (`nats:latest`, command `-js`, host port 4225, no
healthcheck defined). Credentials in the file are throwaway local values and are not recorded here.

### A. Compose config

| Command                                                                     | Result                                                                                        |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `podman compose -p ose-be-e2e -f apps/ose-be/docker-compose.e2e.yml config` | exit 0; two services, ports `5435:5432` and `4225:4222`, the healthcheck above, `-js` command |

### B. Existing wire assertions

Command: `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ose-be-e2e:test:e2e`
(runs `apps/ose-be/scripts/run-e2e.sh`). Exit code **0**. Nx: "Successfully ran target test:e2e".
Playwright: **5 passed, 0 failed, 0 skipped** (9.8s, 1 worker). The script's own startup used
`up --detach --wait --wait-timeout 60` (both containers created and started; the provider printed
`-1` twice after the container names, see Observation 2), then `dotnet build` (succeeded), then the
suite.

| #   | Scenario (spec file)                                                                                      | Result | Wire exercised                                                                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Backend applies pending migrations on startup (`db/migrations.feature`)                                   | pass   | **Postgres**: step drops and recreates the `public` schema through `podman compose exec ... psql`, starts the backend, then `GET /api/v1/system/status/database` equals `{"migration_state":"applied"}` and health is 200 |
| 2   | Health endpoint returns 200 (`health/health.feature`)                                                     | pass   | HTTP health: `GET /api/v1/health` is 200 with `status` equal to `healthy`                                                                                                                                                 |
| 3   | ose-be publishes and durably consumes its demo subject with ack (`messaging/live/jetstream-demo.feature`) | pass   | **NATS**: TCP reachability of port 4225, backend start, `GET /api/v1/system/status/messaging` reports `jetstream_demo` = `delivered_and_acked`                                                                            |
| 4   | ose-be connects to its NATS server at startup (`messaging/live/nats-connect.feature`)                     | pass   | **NATS**: port 4225 reachable, backend connects at start, `delivered_and_acked`, health 200                                                                                                                               |
| 5   | ose-be fails fast when its NATS URL is missing (`messaging/nats-config.feature`)                          | pass   | Configuration only: backend started with an empty `OSE_BE_NATS_URL` exits non-zero and names the variable; no live broker connection                                                                                      |

Teardown. The script's `cleanup` trap ran `down` (no `-v`). Verification straight after exit 0:
`podman ps -a` empty, `podman network ls` shows only the default `podman` network, ports 5435,
4225, and 8302 free, and no `OseBe` process. The one leftover is the Postgres anonymous data
volume, see Observation 1 and "Resources".

### C. One existing read-only API request and direct dependency wire

Steps, in order (this is the manual pass; the E2E harness stops its backend, so the stack was
brought up again with the same file):

1. `rtk ./hippo run ... -- podman compose -p ose-be-e2e -f apps/ose-be/docker-compose.e2e.yml up --detach --wait --wait-timeout 60`: exit 0.
2. Native container health read (because podman-compose 1.6.0 can exit 0 while unhealthy):

   | Container               | State   | Native health                               | Published ports          |
   | ----------------------- | ------- | ------------------------------------------- | ------------------------ |
   | `ose-be-e2e_postgres_1` | running | `healthy`, FailingStreak 0                  | `0.0.0.0:5435->5432/tcp` |
   | `ose-be-e2e_nats_1`     | running | none defined (the image has no healthcheck) | `0.0.0.0:4225->4222/tcp` |

3. Direct dependency wire from the host:

   | Check                                                                 | Result                                                                       |
   | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
   | `podman exec ose-be-e2e_postgres_1 pg_isready -U postgres -d ose_app` | exit 0, "accepting connections"                                              |
   | `podman exec ... psql -U postgres -d ose_app -tAc 'SELECT 1'`         | exit 0, output `1` (server 17.11)                                            |
   | TCP connect to `127.0.0.1:5435` (Postgres published port)             | open                                                                         |
   | TCP connect to `127.0.0.1:4225` and read the first line               | NATS `INFO` banner, server 2.15.2, `"jetstream":true`, `max_payload` 1048576 |

   NATS monitoring port 8222 is not published and the server is not started with monitoring, so
   the INFO banner is the available wire check; no monitoring endpoint was invented.

4. Backend started as `run-e2e.sh` starts it: the same exports were taken from the script
   (`DATABASE_URL`, `OSE_BE_PORT`=8302, `OSE_BE_CORS_ORIGINS`, `OSE_BE_NATS_URL` pointing at
   `localhost:4225`, and the three OpenRouter variables) plus `APP_ENV=test` (what the Playwright
   config sets for its child), then `dotnet build ... --configuration Release` (exit 0) and
   `dotnet run --project apps/ose-be/src/OseBe/OseBe.fsproj --no-build --configuration Release`.
   Recorded PID: the `dotnet run` parent, with one child process that owned the listener on
   `127.0.0.1:8302` and `[::1]:8302`.
5. The request, defined by `health/health.feature` ("When I send GET /api/v1/health"):

   ```text
   rtk curl -sS -i http://127.0.0.1:8302/api/v1/health
   HTTP/1.1 200 OK
   Content-Length: 20
   Content-Type: application/json; charset=utf-8
   Server: Kestrel

   {"status":"healthy"}
   ```

   Expected (spec): status 200 and a `status` field equal to `healthy`. Observed: identical.

6. Supplementary read-only requests, the same two status surfaces the E2E steps assert, to show
   the backend reached both dependencies in this manual run:

   | Request                               | HTTP | Body                                       |
   | ------------------------------------- | ---- | ------------------------------------------ |
   | `GET /api/v1/system/status/database`  | 200  | `{"migration_state":"applied"}`            |
   | `GET /api/v1/system/status/messaging` | 200  | `{"jetstream_demo":"delivered_and_acked"}` |

   `psql` count of tables in schema `public` after the migrations: 4.

7. Stopped by recorded PID: the helper sent SIGTERM to the `dotnet run` parent; it and its child
   both exited (the stop log shows `children=<one pid>` and `done`, no forced kill). Port 8302
   free afterwards.
8. `podman compose -p ose-be-e2e -f apps/ose-be/docker-compose.e2e.yml down` (no `-v`): exit 0.
   Ports 5435 and 4225 free afterwards.

### Expected versus observed (ose-be)

| Item                                   | Source                          | Expected                                         | Observed                                        |
| -------------------------------------- | ------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Compose config valid                   | tech-docs stack packet          | exit 0                                           | exit 0                                          |
| E2E target                             | tech-docs stack packet          | exit 0, script owns start, backend, cleanup      | exit 0, 5 of 5 passed                           |
| Migrations applied on boot             | `db/migrations.feature`         | health reachable after migrations                | `migration_state` `applied`, health 200         |
| Health                                 | `health/health.feature`         | 200, `status` = `healthy`                        | 200, `{"status":"healthy"}`                     |
| NATS connect and JetStream durable ack | `messaging/live/*.feature`      | connection established, demo delivered and acked | `delivered_and_acked`, health 200               |
| Missing NATS URL fails fast            | `messaging/nats-config.feature` | non-zero exit naming `OSE_BE_NATS_URL`           | as expected                                     |
| Script cleanup removes project         | tech-docs stack packet          | no leftover containers or networks               | none; only a leftover anonymous volume (Obs. 1) |

## organiclever-be

Compose file `apps/organiclever-be/docker-compose.e2e.yml`, project `organiclever-be-e2e`.
Services: `postgres` (`postgres:17-alpine`, database `organiclever`, host port 5436, same native
healthcheck) and `nats` (`nats:latest`, `-js`, host port 4226, no healthcheck). Throwaway
credentials not recorded.

### A. Compose config

| Command                                                                                       | Result                                                                        |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `podman compose -p organiclever-be-e2e -f apps/organiclever-be/docker-compose.e2e.yml config` | exit 0; two services, ports `5436:5432` and `4226:4222`, healthcheck as above |

### B. Existing wire assertions

Command: `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run organiclever-be-e2e:test:e2e`
(runs `apps/organiclever-be/scripts/run-e2e.sh`). Exit code **0**. Playwright: **12 passed, 0
failed, 0 skipped** (13.4s, 1 worker). Build succeeded (0 warnings, 0 errors).

| #      | Scenario (spec file)                                                                                               | Result   | Wire exercised                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| 1      | Backend applies pending migrations on startup (`db/migrations.feature`)                                            | pass     | **Postgres**: schema reset through compose `exec`, backend start, `migration_state` `applied`, health 200 |
| 2      | Health endpoint reports the service as UP (`health/health-check.feature`)                                          | pass     | HTTP health 200, status `ok`                                                                              |
| 3      | Anonymous health check does not expose component details (`health/health-check.feature`)                           | pass     | HTTP health 200, status `ok`, no component detail                                                         |
| 4 to 9 | Create, reject blank name, list, fetch missing, update, delete a journal entry (`journal/journal-crud.feature`)    | pass (6) | **Postgres**: real create, read, update, delete rows through the backend against the throwaway database   |
| 10     | organiclever-be publishes and durably consumes its demo subject with ack (`messaging/live/jetstream-demo.feature`) | pass     | **NATS**: port 4226 reachable, `delivered_and_acked`                                                      |
| 11     | organiclever-be connects to its NATS server at startup (`messaging/live/nats-connect.feature`)                     | pass     | **NATS**: connection established at start, health 200                                                     |
| 12     | organiclever-be fails fast when its NATS URL is missing (`messaging/nats-config.feature`)                          | pass     | Configuration only; no live broker connection                                                             |

The journal scenarios change state, but only inside the throwaway E2E database that the existing
suite owns; no write was made by hand.

Teardown. Script `down` ran (no `-v`). Verification straight after: `podman ps -a` empty, only the
default `podman` network, ports 5436, 4226, 8202 free. Leftover: one Postgres anonymous volume
(Observation 1).

### C. One existing read-only API request and direct dependency wire

Same procedure as ose-be with the organiclever-be project, file, ports, and script exports
(`DATABASE_URL`, `ORGANICLEVER_BE_PORT`=8202, `ORGANICLEVER_BE_CORS_ORIGINS`,
`ORGANICLEVER_BE_NATS_URL` pointing at `localhost:4226`, plus `APP_ENV=test`).

| Step                                                      | Result                                                                                                                                                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `up --detach --wait --wait-timeout 60`                    | exit 0                                                                                                                                                                                   |
| Native container health                                   | `organiclever-be-e2e_postgres_1`: running, `healthy`, FailingStreak 0, `0.0.0.0:5436->5432/tcp`; `organiclever-be-e2e_nats_1`: running, no healthcheck defined, `0.0.0.0:4226->4222/tcp` |
| `pg_isready -U postgres -d organiclever` in the container | exit 0, "accepting connections"                                                                                                                                                          |
| `psql ... -tAc 'SELECT 1'`                                | exit 0, output `1`                                                                                                                                                                       |
| TCP `127.0.0.1:5436`                                      | open                                                                                                                                                                                     |
| TCP `127.0.0.1:4226`, first line                          | NATS `INFO` banner with `"jetstream":true`                                                                                                                                               |
| Build and start                                           | `dotnet build` Release exit 0; `dotnet run --no-build --configuration Release`; one parent PID recorded, one child owning `127.0.0.1:8202` and `[::1]:8202`                              |

The request, defined by `health/health-check.feature` ("sends GET /health"):

```text
rtk curl -sS -i http://127.0.0.1:8202/health
HTTP/1.1 200 OK
Content-Length: 15
Content-Type: application/json; charset=utf-8
Server: Kestrel

{"status":"ok"}
```

Expected (spec): status 200 and health status `ok`, with no component detail. Observed: identical;
the body holds only `status`. Supplementary reads, matching the E2E steps:

| Request                               | HTTP | Body                                       |
| ------------------------------------- | ---- | ------------------------------------------ |
| `GET /api/v1/health`                  | 200  | `{"status":"ok"}`                          |
| `GET /api/v1/system/status/database`  | 200  | `{"migration_state":"applied"}`            |
| `GET /api/v1/system/status/messaging` | 200  | `{"jetstream_demo":"delivered_and_acked"}` |

Tables in schema `public` after migrations: 4. Backend stopped by recorded PID (SIGTERM to the
parent; parent and child exited, no forced kill), port 8202 free. Then `podman compose -p
organiclever-be-e2e -f apps/organiclever-be/docker-compose.e2e.yml down` (no `-v`): exit 0, ports
5436 and 4226 free.

### Expected versus observed (organiclever-be)

| Item                                   | Source                          | Expected                           | Observed                                        |
| -------------------------------------- | ------------------------------- | ---------------------------------- | ----------------------------------------------- |
| Compose config valid                   | tech-docs stack packet          | exit 0                             | exit 0                                          |
| E2E target                             | tech-docs stack packet          | exit 0                             | exit 0, 12 of 12 passed                         |
| Migrations applied on boot             | `db/migrations.feature`         | health reachable after migrations  | `applied`, health 200                           |
| Health, anonymous, no component detail | `health/health-check.feature`   | 200, status `ok`, no detail        | 200, `{"status":"ok"}`                          |
| Journal CRUD on Postgres               | `journal/journal-crud.feature`  | six scenarios pass                 | six pass                                        |
| NATS connect and JetStream durable ack | `messaging/live/*.feature`      | established, delivered and acked   | `delivered_and_acked`                           |
| Missing NATS URL fails fast            | `messaging/nats-config.feature` | non-zero exit naming the variable  | as expected                                     |
| Script cleanup removes project         | tech-docs stack packet          | no leftover containers or networks | none; only a leftover anonymous volume (Obs. 1) |

## Defects and observations

No product defect found. Observations, ordered by weight; none blocks the proof.

1. **`down` without `-v` leaves one Postgres anonymous data volume per run (rated Moderate,
   resource leak, repo defect to decide).** The `postgres:17-alpine` image declares
   `VOLUME /var/lib/postgresql/data` (image config `Volumes`). Neither compose file
   mounts a named volume, so every `up` creates an anonymous volume and the scripts' `down` (and
   the tech-docs rule "no `down -v`") never removes it. This run produced exactly one new
   anonymous volume per backend E2E script run and one per manual stack, and the host already held
   eight older anonymous volumes (origin not determined here, possibly the same cause). Evidence: the post-run snapshot diff after each
   stage shows one extra `local <64-hex>` volume, `anon=true`, no labels, created inside the run
   window, referenced by no container. This is a Docker-era behaviour that Podman reproduces; it is
   not caused by the migration, but the `down` contract in tech-docs ("script's cleanup is the only
   stop") means repeated E2E runs accumulate volumes. Decision for the plan owner: add a named or
   `tmpfs` Postgres data mount in the E2E compose files, or have the script remove its project's
   volumes. Out of scope here (no code edits), and removal here followed the ownership rule below.
2. **Provider status `-1`.** `up --detach --wait` printed `-1 -1` after the container names in
   every run and still exited 0 with a healthy Postgres, matching the P0 finding that the
   provider's output is not health proof. Native `podman inspect` was therefore read for Postgres
   (healthy). NATS has no healthcheck, so for it "running" plus an INFO banner over the published
   port is the only evidence available.
3. **Spec path and step path differ for organiclever-be health.** `health-check.feature` says
   "sends GET /health" while the step definition and readiness probe use `GET /api/v1/health`. Both
   serve HTTP 200 `{"status":"ok"}` on this build, so nothing fails; the scenario text just does
   not name the path the suite actually hits. This is a specification gap (propose aligning the
   scenario wording or adding `/health` explicitly), not a defect, and it is unrelated to Podman.
4. **Dirty working tree.** See Revision: a clean-commit re-run is only needed if
   the plan wants a revision-exact record.
5. **Compute ownership.** The E2E scripts use fixed host ports (5435, 4225, 5436, 4226) and fixed
   project names, so the two backends cannot run at the same time. They were run strictly one at
   a time as planned.

## Resources: created, removed, remaining

Created by this run:

| Resource                                                                                | Created by                 | Disposition                                         |
| --------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------- |
| Containers `ose-be-e2e_postgres_1`, `ose-be-e2e_nats_1`                                 | script run, then manual up | removed by `down` (twice)                           |
| Containers `organiclever-be-e2e_postgres_1`, `organiclever-be-e2e_nats_1`               | script run, then manual up | removed by `down` (twice)                           |
| Compose networks of both projects                                                       | compose                    | removed by `down`                                   |
| Anonymous volumes (4 in total: one per script run and one per manual `up`, per backend) | Postgres image `VOLUME`    | removed by exact id, see below                      |
| Processes: the two manually started `dotnet run` backends                               | helper script              | stopped by recorded PID (parents and children gone) |
| Helper script and logs under `local-tmp/claude/d2p/`                                    | this run                   | left in place (uncommitted scratch)                 |

Anonymous volumes. Each of the following appeared only after the stage that created it (snapshot
diff), had `anon=true`, an empty label set, a creation time inside this run's window, and no
container referencing it (`podman ps -a --filter volume=<id>` empty). Strict ownership by project
label was impossible because Podman gives anonymous volumes no label; the snapshot diff plus the
creation timestamp is the stronger proof available. Each was removed with `podman volume rm <id>`
(no `-v` flag on compose, no prune):

| Stage                                  | Volume id (full)                                                   |
| -------------------------------------- | ------------------------------------------------------------------ |
| ose-be E2E script run                  | `660820c7ac482b1cd764d819c3c07754dfc1e0b31707c0004987c905c65553ab` |
| ose-be manual `up` and `down`          | `a4bc59b2baa4de55459ca9375b7572170fd10c6fad98d8d932581e3029ebde8c` |
| organiclever-be E2E script run         | `8523fa2b3c3f0acfb7baf650e2a8986c324179c573b2da79e69871e3b29d057e` |
| organiclever-be manual `up` and `down` | `1c53e8690e6dfc9ff48774e485058f95e0ce0989da6050f75e615352310c64d0` |

Those four removals cover every volume this run created: the E2E script stage and the manual
stage for each backend. Because the removal was done after proof of creation and non-use, the data
(a throwaway test database) was not source data, and the tech-docs "preserve the source data" rule
applies to the real durable data of the rehearsal, which is untouched.

Remaining and untouched, verified by a final `podman ps -a`, `volume ls`, `network ls`, and `images`
snapshot that is identical to the pre-run snapshot except for image "age" strings:

- Images: `docker.io/library/postgres:17-alpine`, `docker.io/library/nats:latest`,
  `docker.io/library/node:24-alpine`, `localhost/ose-www_ose-www`,
  `localhost/organiclever-www_organiclever-www`, `localhost/ayokoding-env/python`, the untagged
  `docker.io/library/python` and `docker.io/library/postgres` images, and
  `docker.io/library/alpine:3.20`. None was pulled, removed, or retagged.
- Volumes: `d2p-pg-source-20261028144529-3821`, `d2p-pg-target-20261028144529-3821`, and the eight
  pre-existing anonymous volumes. Untouched.
- Native Ayo server on `127.0.0.1:3101`: untouched and still listening. `apps/ayokoding-www`
  and the peer worktrees were not touched.
- Build output: `apps/ose-be/src/OseBe/{bin,obj}`, `apps/organiclever-be/src/OrganicleverBe/{bin,obj}`,
  and the Playwright `.features-gen`, `test-results`, and `playwright-report` directories under
  the two `*-e2e` apps are gitignored build output; they exist and were not deleted.

## Decision needed from a human

Whether to treat Observation 1 (the per-run Postgres anonymous volume left by `down`) as a plan
change: it conflicts with the plan's "single `down`, no `-v`" cleanup contract for these two
stacks, because that contract cannot remove those volumes. Everything else needs no decision.
