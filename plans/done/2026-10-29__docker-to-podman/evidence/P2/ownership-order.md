# P2 site and backend ownership order

## Result and scope

Recorded on 2026-10-29 on native rootless Podman 5.7.0 with `podman-compose` 1.6.0 as the explicit provider
(`PODMAN_COMPOSE_PROVIDER`), HEAD `e88a30b05`. It closes the two residuals of the ownership-order item: the
OrganicLever frontend E2E reusing the Podman server on port 3200, and the syntax-only `config` runs for the two legacy
scaffolds. It also restates, with its sources, the Ayo and backend parts that were already proven.

## OrganicLever frontend E2E reuses the Podman-served site on 3200 (new run)

Configuration read: `apps/organiclever-www-fe-e2e/playwright.config.ts` sets `baseURL` to
`http://localhost:3200`, and `webServer` to `npx nx run organiclever-www:start` with `url: http://localhost:3200` and
`reuseExistingServer: true`. The Nx target `organiclever-www-fe-e2e:test:e2e` builds the app, then runs
`npx bddgen && npx playwright test` from the project directory.

Commands, in order, under HIPPO (`ephemeral`, `heavy` tier), from the repository root:

| Step | Command                                                                                                 | Observed                                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `scripts/container-runtime-check --compose`                                                             | exit 0, silent                                                                                                                         |
| 2    | `podman compose -f infra/dev/organiclever-www/docker-compose.yml config`                                | exit 0                                                                                                                                 |
| 3    | `podman compose -f infra/dev/organiclever-www/docker-compose.yml up --detach --wait --wait-timeout 120` | exit 0; one container, image `localhost/organiclever-www_organiclever-www:latest`, `Up 11 seconds (healthy)`, `0.0.0.0:3200->3200/tcp` |
| 4    | `curl http://localhost:3200/`                                                                           | `200`                                                                                                                                  |
| 5    | `ss -ltnp` for port 3200                                                                                | one listener, process `rootlessport` (Podman's port forwarder), not a Node server                                                      |
| 6    | `pgrep -af 'organiclever-www:start'` before the target                                                  | no native start process                                                                                                                |
| 7    | `DEBUG=pw:webserver npm exec nx -- run organiclever-www-fe-e2e:test:e2e`                                | exit 0; `39 passed (1.0m)`; Nx `Successfully ran target test:e2e`                                                                      |
| 8    | `podman compose -f infra/dev/organiclever-www/docker-compose.yml down` (no `-v`)                        | exit 0; 0 project containers left; `GET /` then returned no response (code `000`)                                                      |

The Playwright web-server log during step 7 reads, in order:
`HTTP GET: http://localhost:3200/`, `HTTP Status: 200`, `WebServer is already available`, `Waiting for availability...`,
`HTTP Status: 200`, `WebServer available`. "Already available" is Playwright's `reuseExistingServer` path: it found
the Podman container answering and did not run the configured start command. A sampler polled every 2 seconds
through the whole target (37 samples) for processes matching `organiclever-www:start` or `next start`: none appeared
other than the shell wrapper that launched the script. The stack was brought down only by step 8, after the target.

This is the same target and count as matrix row 64 (39 passed), now with the attach recorded. The Playwright log line
`Terminating the WebServer` at the end of the run is the generic teardown message; the container kept serving until step 8.

Not covered here: under `CI` the existing config selects Chromium only with two retries; this run was local with the config's local projects.

## Backend E2E targets own their stack (sources and an ordering check)

- `apps/ose-be-e2e/project.json` and `apps/organiclever-be-e2e/project.json` define `test:e2e` as exactly one command,
  `apps/<be>/scripts/run-e2e.sh`. There is no `dependsOn`, no Compose pre-step and no `-v` in the target.
- `apps/ose-be/scripts/run-e2e.sh` (the organiclever one is the same shape) runs, in order: the unconditional-skip
  guard, `export PODMAN_COMPOSE_PROVIDER=podman-compose`, `"${ROOT}/scripts/container-runtime-check" --compose`,
  `trap cleanup EXIT`, `podman compose -p <project> -f <file> down`, `podman compose ... up --detach --wait
--wait-timeout 60`, the backend build, then `npx bddgen && npx playwright test`. The trap runs
  `podman compose ... down` without `-v`.
- `scripts/caller-runtime-contract.test.mjs` proves that order with fake commands: preflight once and before the first
  Compose call, provider exported, `down` after the E2E command on success, failure, SIGTERM and SIGINT, no destructive
  flag, no compose call after a refused preflight. It passes 19 of 19 (RED capture in `callers-red.md`).
- Real runs: matrix row 76 (`ose-be-e2e:test:e2e`, 5 cases) and row 88 (`organiclever-be-e2e:test:e2e`, 12 cases)
  passed with no pre-started stack. Before each run `podman ps -a` was empty and no project resource existed, and after
  cleanup the snapshot was identical (`evidence/P3/manual/backends.md`). At the start of the commands above `podman ps
-a` also listed 0 containers. The two backend E2E targets were not re-run for this record.

## Ayo order

`evidence/P2/ci.md`, run 40693498144 on head `24a4c54d4`: stack `up --wait` (healthy), `podman cp` of the prerender
manifest, `ayokoding-www-be-e2e` (37 passed) against the Podman server on 3101 (`reuseExistingServer: true`), stop of
the stack, then `ayokoding-www-fe-e2e` (1,232 passed, 4 skipped, 0 failed) on the Playwright-owned native server
(`reuseExistingServer: false` in `apps/ayokoding-www-fe-e2e/playwright.config.ts`). OSE: `apps/ose-www-fe-e2e` and
`apps/ose-www-be-e2e` set `localBaseUrl` to `http://localhost:3190` with `PORT: "3190"`; they stay native fixture proof
and are not claimed to hit the Podman service on 3100.

## Legacy scaffolds: syntax-only `config` (new run)

Under HIPPO (`ephemeral`, `standard`), from the repository root, with the explicit provider. `podman ps -a` listed 0
containers before and after. No stack was started.

| Scaffold                     | Command                                                                                                                      | Exit | Result                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------- |
| `infra/dev/ose-app`          | `podman compose -f infra/dev/ose-app/docker-compose.yml -f infra/dev/ose-app/docker-compose.ci.yml config`                   | 0    | 63 lines of merged YAML, 3 services (`ose-app-be`, `ose-app-web`, `postgres` with `docker.io/library/postgres:17-alpine`) |
| `infra/dev/organiclever-app` | `podman compose -f infra/dev/organiclever-app/docker-compose.yml -f infra/dev/organiclever-app/docker-compose.ci.yml config` | 0    | 37 lines of merged YAML, 2 services                                                                                       |

These are syntax and caller checks only. The scaffolds stay unsupported and this is not supported-stack runtime
evidence.
