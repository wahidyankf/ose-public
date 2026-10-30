# P2 rediscovery: Podman dependency of the normal CLI Integration and E2E CI path

## Result

The normal (non-dispatch) workflow `.github/workflows/non-product-full-quality.yml` needed one change. Its `e2e` job
runs `ayokoding-cli:test:e2e`, whose real-engine adapter requires `podman-compose` on the `PATH`, and the hosted runner
does not ship it. The job had no `setup-podman` step, so it would fail at the first Compose-provider scenario. The
`integration` job does not depend on Podman and stays unchanged. The fix is a single added line in the `e2e` job, built
test-first (diff below). It has no CI proof yet: the `e2e` job is skipped whenever the baseline `ferret-cli`
Integration failure occurs, as on `main`.

## Facts from the code

- `apps/ayokoding-cli/project.json`: `test:integration` is `AYOKODING_BDD_ADAPTER=integration go test -count=1
./tests/bdd ./tests/integration/...`; `test:e2e` runs `apps/ayokoding-cli/scripts/test-e2e.sh`, which builds the
  binary and runs `AYOKODING_BDD_ADAPTER=e2e go test -count=1 ./tests/bdd`.
- `tests/bdd/podman_steps_test.go`: `nativePodman()` is true only for the `e2e` adapter. For any other adapter the
  steps build a fake `podman` and fake `podman-compose` in a temporary directory (`buildFakeContainer`), so Integration
  needs no engine. The Integration Go tests (`tests/integration/containers_test.go`) also compile and use the fake
  container CLI.
- For `e2e` the steps use the real engine: `exec.LookPath("podman")`, the real `scripts/container-runtime-check
--compose`, `exec.LookPath("podman-compose")` and a check that `podman compose version` prints
  `podman-compose version 1.6.0`, real builds with `--pull=never --network=none`, and real runs.
- The workflow is byte-identical to `main` (`git diff origin/main -- .github/workflows/non-product-full-quality.yml`
  was empty before the edit below).

## Facts from the CI logs (run 40693498144, head `24a4c54d4`)

Logs read with `gh api --allow-escape-sequences repos/<org>/<repo>/actions/jobs/<id>/logs`, escape sequences stripped.

| Job (id)                                                    | Observation                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Complete local-resource Integration suites` (122839484434) | Image `ubuntu-26.04`, version `20261012.163.1`, Ubuntu 26.04.1. No `setup-podman` step. `nx run ayokoding-cli:test:integration` passed: `tests/bdd 184.251s`, `tests/integration 15.111s`. The job failed only on `ferret-cli:test:integration` (6 failed, 500 passed), the baseline failure.                                                                                                                                             |
| Same job, postinstall doctor                                | `[toolchain-validate] podman-compose: unavailable` (so the runner as it comes lacks the provider)                                                                                                                                                                                                                                                                                                                                         |
| `docker-to-podman-ayo-proof` (122834067430)                 | `setup-podman` ran: `Runner tuple ubuntu/resolute/amd64 selects podman=5.7.0+ds2-3build1`; apt reported `podman is already the newest version (5.7.0+ds2-3build1)` (the runner image already ships that Podman); then `pipx install podman-compose==1.6.0`; the assertions `podman info ... .host.security.rootless == true` and `podman-compose version 1.6.0` passed; `podman version` printed `Version: 5.7.0`, `Build Origin: Ubuntu` |
| `Complete public-boundary E2E suites` (122843057801)        | Skipped, because it `needs: integration`                                                                                                                                                                                                                                                                                                                                                                                                  |

So the runner provides Podman 5.7.0 (rootless, asserted by the setup action in the proof job) and no `podman-compose`.
Rootless state was not probed in the `integration` job, which has no setup step; it is the same image and the
non-root runner account.

## Local reproduction of "the runner as it comes"

A separate rootless storage directory (`CONTAINERS_STORAGE_CONF` pointing into `<short-tmp>`, so no image was cached)
and a `PATH` of the Go toolchain plus system directories without `podman-compose`, then
`sh apps/ayokoding-cli/scripts/test-e2e.sh` under HIPPO (`ephemeral`, `heavy`):

| Run | `podman-compose` on PATH          | Exit | Scenarios       | Failures                                                                                                                                                                                                                                                            |
| --- | --------------------------------- | ---- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | no                                | 1    | 68 of 70 passed | "An installed Docker Compose cannot override the selected provider": `locate native provider: exec: "podman-compose": executable file not found in $PATH`; and "An example with a service reaches it by name": status 124, `service postgres not ready within 1m0s` |
| 2   | yes (symlink to the pinned 1.6.0) | 1    | 69 of 70 passed | only the postgres service scenario (status 124)                                                                                                                                                                                                                     |

Run 1 shows the deterministic dependency: without `podman-compose` the e2e adapter fails. Run 2 shows that supplying
it clears that failure.

Unsettled: the postgres service scenario timed out at 60 seconds in both emulated cold-store runs, while a run on the
normal (warm) local store passed, exit 0 (`ayokoding-cli` e2e adapter with a docker shim, see
`evidence/P3/ac-trace.md`; also `evidence/P1/runner-inspect.md`). A follow-up manual start of the same service
container in the emulated store failed in rootless networking setup (`pasta` could not open the store's own network
namespace path: permission denied), so the emulated store is not a trustworthy model of a fresh runner and the cause of
the 124 is not established. Only a real cold runner can settle it. The pull happens before the readiness timer in
`internal/application/run_execute.go` (`startService` pulls first, then `waitServices` polls for the catalog
`readyTimeout` of 60 s), so image download time is not part of the 60 s. The emulation store was removed afterwards
where possible; the user's default Podman store was not touched (9 images and 0 containers before and after).

## Change made (test-first)

`.github/workflows/non-product-full-quality.yml`, `e2e` job: one line, `- uses: ./.github/actions/setup-podman`,
directly after `- uses: ./.github/actions/setup-python` and before the first step that runs `nx run-many -t test:e2e`.
Nothing else in the workflow changed (triggers, permissions, concurrency and the other jobs are as before).

`scripts/setup-podman-contract.test.mjs`: one new test and a small `jobLines` helper (35 added lines). The test asserts
that the `e2e` job contains the setup step exactly once, that it comes before the line that runs
`nx run-many -t test:e2e`, and that the `integration` job does not contain it.

- RED: `node --test scripts/setup-podman-contract.test.mjs` exit 1, 16 tests, 15 pass, 1 fail:
  `the e2e job must install Podman through the setup action exactly once, so the ayokoding-cli adapter finds
podman-compose` (`0 !== 1`).
- GREEN: same command exit 0, 16 of 16. `npm run test:validators` exit 0, 198 of 198 (was 197). The repo `actionlint`
  gate (`./scripts/lint-workflows`) exit 0. Prettier check on both edited files exit 0.

Why not the `integration` job: its adapter uses fake containers and passed in CI with no setup, so a step there would
cost time and install packages for no behaviour. Add it there only if a maintainer wants symmetry.

Cost and risk: the `e2e` job now installs pipx and `podman-compose` (a few seconds in the proof job: 13:08:30 to
13:08:38) inside its 40-minute timeout. The setup action accepts only the `ubuntu/resolute/amd64` tuple, which is what
`ubuntu-latest` resolved to in run 40693498144; a runner image change makes the job fail fast at the tuple check.

## Still open

- No CI run has exercised the new `e2e` step. It needs a green `integration` job first (baseline `ferret-cli`
  failure) or a dispatch that does not depend on it; both belong to Phase 4 post-push verification.
- The service-readiness scenario on a cold runner (above).
