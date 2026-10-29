# P2 callers RED: the contract tests against the pre-migration bytes

## Result and scope

Genuine RED captured on 2026-10-29. The five contract tests were first committed together with the migrated code
(`24a4c54d4`), so no earlier failing run existed. This record runs the unmodified tests against the baseline tree
of commit `71bb3aa5` (the plan-promotion commit, before any migration change). Every test file failed or partly failed
there, with exit code 1. The same five files pass on the migrated tree (see "GREEN" below).

## Method

1. A scratch tree was built with `git archive 71bb3aa5 apps infra libs scripts .github package.json`, extracted to
   `<short-tmp>/d2p-red/`. Those are the baseline bytes of every path a test reads (`git show` and `git archive` return
   the same blobs).
2. The five tests were copied from `HEAD` into `<short-tmp>/d2p-red/scripts/` with `git show HEAD:scripts/<test>`. Each
   copy is byte-identical to the working-tree file (`cmp` exited 0 for all five). No test was edited.
3. The tests find the repository from their own location (`resolve(import.meta.dirname, "..")`), so a test placed in
   `<scratch>/scripts/` reads only baseline files. No path was rewritten and no environment override was used.
4. Each test ran from the scratch root as
   `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- node --test scripts/<test>` with
   `TMPDIR=<short-tmp>`. HIPPO admitted every run (no 124 or 125).

## Outcomes

| Test file                            | Exit | Tests | Pass | Fail | What failed on the baseline                                                         |
| ------------------------------------ | ---- | ----: | ---: | ---: | ----------------------------------------------------------------------------------- |
| `caller-runtime-contract.test.mjs`   | 1    |    19 |    0 |   19 | Both backend runners and all five `package.json` entry points invoke `docker`       |
| `container-runtime-check.test.mjs`   | 1    |     9 |    1 |    8 | `scripts/container-runtime-check` does not exist at the baseline                    |
| `container-image-qualified.test.mjs` | 1    |     4 |    2 |    2 | 9 unqualified Compose images and 16 unqualified Dockerfile `FROM` lines             |
| `no-docker-binary-calls.test.mjs`    | 1    |     4 |    3 |    1 | 36 executed Docker call sites in `.github/`, `apps/`, `package.json` and `scripts/` |

## caller-runtime-contract.test.mjs (19 of 19 failed)

The test copies each backend `run-e2e.sh` into a temporary root. It puts fake `podman`, `podman-compose`, `npx`,
`dotnet` and a `docker` tripwire (logs the call and exits 99) first on the PATH. It runs each `package.json` stack
command the same way.

On the baseline every one of the 14 runner tests and the 5 `package.json` tests failed at its first status assertion:

- `ose-be` and `organiclever-be`, provider export, preflight order, teardown on success: `99 !== 0`. The baseline
  runner reached `docker compose ...` and hit the tripwire.
- Exit status preserved on E2E failure: `99 !== 7`.
- No compose or E2E command after a refused preflight: `99 !== 125`. The baseline runner has no preflight at all: a
  search of the baseline `run-e2e.sh` for `container-runtime-check` or `PODMAN_COMPOSE_PROVIDER` finds 0 matches.
- SIGTERM and SIGINT teardown (4 tests): `Error: timed out waiting for .../held`. The runner died on its first
  `docker` call and never reached the held E2E command, so no interrupt could land.
- `package.json` `dev:ayokoding-www`, `dev:ose-www`, `dev:organiclever`, `organiclever:dev`,
  `organiclever:dev:reset`: `99 !== 0`. Baseline lines 26, 28, 29, 30 and 33 start with `docker compose`.

Baseline Docker call sites in the callers: `apps/ose-be/scripts/run-e2e.sh` lines 23 and 28
(`docker compose -p ... down -v`), the same two lines in `apps/organiclever-be/scripts/run-e2e.sh`, and
`package.json` lines 26, 28, 29, 30 and 33 (also listed by the no-docker-binary run below).

Limit of this RED: the tripwire ends each run at the first Docker call, so the first assertion of each test
(exit status) fails and the later assertions (provider export, preflight order, owned teardown) are not reached on
the baseline. The failure is the Docker-only invocation itself, which is what the plan item asks to capture. The
individual assertions are exercised by the GREEN run. Nothing in this RED is a search assertion.

## container-runtime-check.test.mjs (8 of 9 failed)

The baseline has no `scripts/container-runtime-check`, so the executable-under-test spawned no process
(`null !== 0`: spawn status null). Eight tests failed this way. One test passed on the baseline because it drives only
its own fakes ("fake probes reject workload and incorrect provider arguments"). The earlier RED history of this test
(4 failed, 1 passed against a stub; later 3 further assertion failures) is in `evidence/P1/preflight.md`.

## container-image-qualified.test.mjs (2 of 4 failed)

- Compose images without a registry: `apps/organiclever-be/docker-compose.e2e.yml` (`postgres:17-alpine`,
  `nats:latest`), `apps/organiclever-be/docker-compose.integration.yml` (`postgres:17.10-alpine3.22`, `nats:latest`),
  `apps/ose-be/docker-compose.e2e.yml` (two), `apps/ose-be/docker-compose.integration.yml` (two) and
  `infra/dev/ose-app/docker-compose.yml` (`postgres:17-alpine`): 9 in total.
- Dockerfile `FROM` lines without a registry: `node:24-alpine` and `rust:1.95-slim` in 16 places across the
  `ayokoding-www`, `organiclever-www`, `ose-www`, `organiclever-app-web`, `ose-app-web` Dockerfiles and the four
  `infra/dev/*-app/Dockerfile.*.dev` files.

## no-docker-binary-calls.test.mjs (1 of 4 failed)

The scan test failed with 36 offenders: five lines in `_reusable-app-test-local-deploy-stag.yml`, three in
`_reusable-be-build-deploy.yml`, five in `_reusable-www-test-local-deploy.yml`, six in `publish-images.yml`
(`docker build` and `docker push`), three lines in `apps/ayokoding-cli` Go tests (two `exec` calls and one comment), two `backend-process.ts` spawns
of `docker`, six lines in the two backend runners, five in `package.json`, and one comment in
`scripts/next-with-port.mjs` that the detector flags. The three other tests (scan reach, allowlist, detector self-test)
passed.

## GREEN (migrated tree)

The same five files on the working tree (HEAD `e88a30b05` plus the uncommitted edit recorded in
`evidence/P2/cli-ci-rediscovery.md`), run with the same command shape: `caller-runtime-contract` 19 of 19,
`setup-podman-contract` 16 of 16 (15 of 15 before that edit), `container-image-qualified` 4 of 4,
`no-docker-binary-calls` 4 of 4, `container-runtime-check` 9 of 9, each exit 0. The full validator suite passes
(`evidence/P2/local-gates.md`: 197 of 197 on `60a35faf1`; 198 of 198 after the edit).
