# docker-to-podman P2 CI Evidence

## Status

As built (2026-10-29): the temporary proof job was dispatched three times (runs 40667489060, 40671958744 and
40693498144, see the run sections below). The last run, 40693498144 on head `24a4c54d4`, concluded `success` for the
proof job. The overlay was removed in commit `60a35faf1`: `.github/workflows/non-product-full-quality.yml` and the two
Ayo Playwright configs (`apps/ayokoding-www-fe-e2e/playwright.config.ts`, `apps/ayokoding-www-be-e2e/playwright.config.ts`)
are byte-identical to commit `ab27ddab2`, the `E2E_FULL_MATRIX` knob appears nowhere under `apps/`, `.github/` or
`scripts/`, and `scripts/e2e-playwright-config.test.mjs` is deleted. Only manual dispatch runs exist so far. No
pull-request CI run is recorded in this file. The provisional runner row, the four capacity-blocked Ayo rows and the
web-UI extra still need their closing CI proof on the final head (Phase 4, Post-Push Verification).

## Test-only proof job recipe (historical; removed in `60a35faf1`)

This section describes the recipe as it ran in run 40693498144. The job no longer exists in the tree.

The temporary job `docker-to-podman-ayo-proof` sits at the end of `.github/workflows/non-product-full-quality.yml`,
bracketed by `# TEMPORARY docker-to-podman proof job` and `# END TEMPORARY`. It runs only on manual dispatch with the
branch ref and the existing `evidence_nonce`. It has no secrets, no deploy, no push, and does not call the reusable
workflow. Nx cache is disabled with `NX_SKIP_NX_CACHE=true`. The row 26 and row 33 steps set `E2E_FULL_MATRIX` to
`"1"`, an explicit opt-in knob that the two Playwright configs read. `CI` stays `true` in both steps, so the job does
not spoof CI state. With the knob, the BE config runs with zero retries and no worker cap, and the FE config keeps all
three frontend browser projects (chromium, firefox, webkit) with zero retries and no worker cap. Without the knob, CI
selects Chromium only with two retries. The browsers come from the Playwright default install set, which covers
chromium, firefox and webkit.

Rows 14 and 20 are not in this job. They passed in run 40667489060 and are not re-run here. Their nx build and
integration output would sit in the workspace before the image build, and the image build then ran out of runner disk
in that run. The build context must not contain prior build output. No disk-clearing step is added: the reusable
`e2e` job in `_reusable-www-test-local-deploy.yml` has none, so this job runs under the same conditions.

The knob was the SWE-settled configuration that the delivery plan called for: all three browsers, zero retries, and
the original timeouts and assertions, without spoofing CI state. The two configs it touched,
`apps/ayokoding-www-fe-e2e/playwright.config.ts` and `apps/ayokoding-www-be-e2e/playwright.config.ts`, were temporary
edits. Commit `60a35faf1` restored them with the workflow, per the delivery plan.

| Step                                                 | What it does                                                                                                            | Delivery row proved               |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Checkout, setup-node, setup-podman, setup-playwright | Installs the pinned toolchain                                                                                           | Prerequisite only; credits no row |
| Record proof provenance                              | Writes the commit, runner tuple, Podman and compose versions, rootless state, CPUs, and free memory to the step summary | Provenance only; credits no row   |
| Measure runner disk before the stack start           | `df -h /`                                                                                                               | Diagnostic only; credits no row   |
| Start the Ayo Compose stack                          | `podman compose -f infra/dev/ayokoding-www/docker-compose.yml up --build --detach --wait --wait-timeout 150`            | Prerequisite for rows 26 and 33   |
| Wait for Ayo health                                  | Polls `http://localhost:3101/api/trpc/meta.health` within the 150 second budget                                         | Prerequisite for rows 26 and 33   |
| Verify the Podman service is running and healthy     | `podman inspect` must report `running healthy`                                                                          | Prerequisite for rows 26 and 33   |
| Measure runner disk after the stack is healthy       | `df -h /`                                                                                                               | Diagnostic only; credits no row   |
| Copy prerender manifest for E2E                      | `podman cp` of `prerender-manifest.json` into the FE E2E artifacts                                                      | Prerequisite for rows 26 and 33   |
| Run the Ayo BE E2E suite                             | `npx nx run ayokoding-www-be-e2e:test:e2e` with `E2E_FULL_MATRIX: "1"`                                                  | Row 26                            |
| Stop Ayo containers before FE E2E                    | `podman compose ... down` without `-v`                                                                                  | Prerequisite for row 33           |
| Run the Ayo FE E2E suite                             | `npx nx run ayokoding-www-fe-e2e:test:e2e` with `E2E_FULL_MATRIX: "1"`                                                  | Row 33                            |
| Stop Ayo containers (always)                         | `podman compose ... down` with `if: always()`                                                                           | Cleanup only                      |
| Run the web-UI full E2E extra                        | `npx nx run web-ui:test:e2e`                                                                                            | Web-UI E2E extra                  |

Known gaps and caveats:

- `E2E_FULL_MATRIX` was a new opt-in read by two Playwright configs, so this recipe edited them. The knob only changed
  the selection when set to exactly `1`. The delivery plan required the reviewed bytes to be restored and the knob
  removed before merge. `scripts/e2e-playwright-config.test.mjs` proved the selection in both directions while the
  knob existed; it was deleted with the knob in `60a35faf1`, and it never proved the CI run.
- The browser install step is the shared `setup-playwright` action, unchanged. It runs `npx playwright install
--with-deps`, unless a cache entry matches the Playwright version, in which case it restores cached browsers. A
  branch can restore only caches saved from `main` or from its own branch, so the first run may install fresh.
- The reusable workflow's guard that skips row 26 when the project is missing is dropped, so a missing project fails.
- Steps keep default gating, so a failed earlier step skips the later steps. A dispatch also runs the workflow's
  existing jobs.
- The knob is step-level and only this temporary job sets it. No lint rule or validator in the repo blocks it.
- `setup-podman` accepts only the `ubuntu/resolute/amd64` tuple. Run 40667489060 selected the pinned row on
  `ubuntu-latest` (see below).

The restructured job (stack first) was dispatched in runs 40671958744 and 40693498144. Their executed SHAs, results for
rows 26 and 33 and the web-UI E2E extra, and the two disk measurements are in the run sections below.

## Run 40667489060 (head 88a20850c)

Observed facts only:

- Temporary job: setup-node, setup-podman, and setup-playwright passed.
- Temporary job runner tuple line: `ubuntu/resolute/amd64 selects podman=5.7.0+ds2-3build1`.
- Temporary job row 14 (`npx nx run ayokoding-www:build`) passed: `Successfully ran target build for project ayokoding-www and 2 tasks it depends on`.
- Temporary job row 20 (`ayokoding-www:test:integration`) passed: 13 test files, 192 tests.
- Temporary job `podman compose ... up --build --detach --wait` failed. The runner ran out of disk: `Free space left: 0 MB`, and `no space left on device` while committing the layer for `COPY apps/ayokoding-www/ ./apps/ayokoding-www/`, writing under `apps/ayokoding-www/.next/`.
- Web-UI E2E extra passed (148 passed).
- Integration job `Complete local-resource Integration suites` failed only on `ferret-cli:test:integration` (6 tests in `tests/integration/test_hook_registrations.py`, `KeyError 'SessionStart'` etc.). The same failure appears in main's scheduled runs 40643742153 and 40560502045, so it is a pre-existing baseline failure unrelated to this migration.

## Run 40671958744 (head 916ce0f36, nonce d2p-ayo-1793183106)

Observed facts only:

- Stack-first order: `df -h /` showed 81G available before the stack build and 51G after it. The Ayo stack started, the
  health wait passed, and `podman cp` copied the prerender manifest.
- Row 26 (`ayokoding-www-be-e2e:test:e2e`, `E2E_FULL_MATRIX=1`): 37 passed.
- Row 33 (`ayokoding-www-fe-e2e:test:e2e`, `E2E_FULL_MATRIX=1`): 1,236 tests on 2 workers, 1,231 passed, 4 skipped, 1
  failed (28.0m).
- The failed case was `[firefox] Learning progress accessibility > Progress screens pass automated accessibility
checks`. It hit the 150 s test timeout in `page.waitForURL` at `tests/e2e/steps/support/complete-course.ts:78`,
  called from `progress-store.steps.ts:535`. The same scenario took 14.6 s on chromium and 23.5 s on webkit in this run.
- Web-UI E2E extra: 148 passed (2.2m).

### Row 33 failure investigation (run 40671958744)

Observed facts only:

- Row 33 ran after the Ayo containers were stopped, against the Playwright-owned native Node server, so no container or
  Podman network path was involved in that failure.
- The log line `waiting for navigation until "load"` shows the URL had not changed when `waitForURL` started and no
  matching navigation fired in 150 s. Another worker completed other cases normally in the same window.
- Local reproduction, firefox only, zero retries: 1 of 1 and 16 of 16 passed in isolation; a later three-browser slice
  run failed once with the same signature (firefox, `waitForURL` timeout from `markCompleteAndContinue`).
- Local traces of two stalled cases (6 workers, 45 s test timeout) show the click completed, the app's click handler ran
  (the toggle read "Completed" and the link read "Continue"), the next page's RSC fetches returned 200, and the URL never
  changed. Other failures in that run were plain overload timeouts and are not counted as this signature.
- A readiness guard on the completion toggle was tried and reverted: the toggle was already enabled when the click
  stalled, so the hydration-race hypothesis is refuted.
- Two direct probes of the same click, 2,678 clicks in total across 8 parallel firefox contexts, produced 0 stalls. The
  cause is not established.
- Temporary diagnostics added to the proof job for the next run: `trace: retain-on-failure` when `E2E_FULL_MATRIX=1`, and
  an `if: failure()` upload of `apps/ayokoding-www-fe-e2e/test-results/`.

## Run 40693498144 (head 24a4c54d4, nonce d2p-ayo-1793192808)

Observed facts only:

- Temporary job `docker-to-podman-ayo-proof` concluded `success`. The runner tuple line again read
  `ubuntu/resolute/amd64 selects podman=5.7.0+ds2-3build1`.
- `df -h /`: 81G available before the Ayo stack build, 51G after it.
- Row 26 (`ayokoding-www-be-e2e:test:e2e`, `E2E_FULL_MATRIX=1`): 37 passed (26.6s).
- Row 33 (`ayokoding-www-fe-e2e:test:e2e`, `E2E_FULL_MATRIX=1`): 1,236 tests on 2 workers, 1,232 passed, 4 skipped, 0
  failed (34.1m). The `if: failure()` results upload was skipped because nothing failed.
- Web-UI E2E extra: 148 passed (1.8m).
- The firefox case that failed in run 40671958744 passed here. The code under test is unchanged, so the earlier failure
  is an intermittent with an unproven cause; it is recorded in the row 33 investigation above and in the final report.
- `Unit and static behaviour coverage` passed. `Complete local-resource Integration suites` failed only on
  `ferret-cli:test:integration` (6 failed, 500 passed), the pre-existing baseline failure also seen on main's scheduled
  runs. `Complete public-boundary E2E suites` was skipped because of that failure.

## Overlay removal and what remains for the final head

Observed facts only:

- Commit `60a35faf1` deleted the `docker-to-podman-ayo-proof` job (92 lines) from `non-product-full-quality.yml`. The
  workflow, both Ayo Playwright configs and the absence of `E2E_FULL_MATRIX` were checked against `ab27ddab2` with
  `git diff --quiet` on 2026-10-29: identical. `git diff origin/main...HEAD` on the workflow is empty, so the
  restored workflow is the `main` workflow.
- The same commit changed Ayo frontend E2E step bindings, `mermaid.tsx`, the Mermaid and sidebar unit tests and three
  feature files after run 40693498144. Rows 14 and 20 passed only in run 40667489060 (head `88a20850c`) in CI; both
  also passed locally on `60a35faf1` (`../P3/target-matrix.md`, Final-head reruns). Rows 26 and 33 and the web-UI extra
  passed in CI at `24a4c54d4`; the local browser matrix for the changed Ayo frontend scenarios passed 45 of 45 on
  `60a35faf1` (`../P3/target-matrix.md`). A CI proof on the final head needs a new overlay dispatch, which the
  delivery plan assigns to Post-Push Verification.
- The restored `non-product-full-quality.yml` has no Podman setup step: its `integration` and `e2e` jobs run
  `ayokoding-cli` Integration and E2E, whose BDD adapter uses the real container engine, on the runner as it comes.
  `main` has the same workflow and no container-runtime line in it. In run 40693498144 the `e2e` job was skipped
  (an upstream `ferret-cli` failure), so this dependency was not exercised. It is an open question for the maintainer
  (see `delivery.md`, Phase 2 AC-07 publishing item). Rediscovered on 2026-10-29: the `e2e` job needs
  `podman-compose`, so it now runs the `setup-podman` action; see `cli-ci-rediscovery.md`.
- No PR quality gate run and no PR CI run is recorded here yet.

## Run 40758214180 (head 42fad78f0, nonce d2p-final-1793217154)

Dispatched on 2026-10-29 from the throwaway branch `docker-to-podman-proof-final`. That branch is the PR head
(`b25004578`, which is `e88a30b05` plus the `df84f0efc` workflow and test commit plus a merge of `origin/main`) with the
temporary proof job and the two Playwright config edits re-applied in one commit (`42fad78f0`). The overlay lives only
on that branch. It never entered the PR branch, so the PR head carries the restored `main` bytes for those three files.
The only files the PR head adds after `b25004578` are plan evidence, so the runtime inputs of the proof equal the PR
head's. The leak review of the overlay range passed with no finding before the push.

Observed facts only:

- Runner tuple line: `ubuntu/resolute/amd64 selects podman=5.7.0+ds2-3build1`. The `setup-podman`, `setup-playwright`
  and Ayo stack health steps passed (`running healthy`).
- Production build in the job (`ayokoding-www:build`, a prerequisite of the FE E2E target): `Successfully ran target
build for project ayokoding-www and 2 tasks it depends on`.
- Row 26 (`ayokoding-www-be-e2e:test:e2e`): 37 passed (24.2 s of test time, 8m21s step).
- Row 33 (`ayokoding-www-fe-e2e:test:e2e`, three browser projects, zero retries): 1,235 passed and 4 skipped, 0 failed
  (37.5 m of test time, 45m17s step). The earlier run had 1,232 passed and 4 skipped; the difference of three is the new
  Mermaid, canonical-fallback and sidebar scenarios. The `if: failure()` upload step was skipped.
- Web-UI E2E extra: 148 passed (1.9 m).
- The proof job concluded `success`. `Unit and static behaviour coverage` passed. `Complete local-resource Integration
suites` failed only on `ferret-cli:test:integration` (6 failed, 500 passed, the `test_hook_registrations` cases), the
  baseline failure also seen on main's scheduled runs; the other four integration projects passed.
  `Complete public-boundary E2E suites` was skipped because of that failure, so the new `setup-podman` line in the `e2e`
  job did not run in this dispatch (it is covered by the contract test, `scripts/setup-podman-contract.test.mjs`).
- The firefox stall seen once in run 40671958744 did not recur (the intermittent from the row 33 investigation).

Closing state for the CI-timing rows: rows 26 and 33 and the web-UI extra now have a passing CI receipt on a head whose
runtime inputs equal the PR head's. Row 14's build also ran in this job; row 20 has the CI receipt from run 40667489060
and the local final-head rerun in `../P3/target-matrix.md`.

## Run 40778630932 (head 6b0829daa, nonce d2p-e2e-1793220984): the `e2e` job with its new `setup-podman` step

Dispatched on 2026-10-29 from the throwaway branch `docker-to-podman-e2e-proof`, which is `main` at `fd95823ac` with one
line deleted: `needs: integration` under the `e2e` job. The deletion lets that job run although the `ferret-cli`
integration baseline fails. Nothing else differs from `main`. The branch was not merged and was deleted after the run.

Observed facts only:

- The `Run ./.github/actions/setup-podman` step of the `e2e` job succeeded. It ran `pipx install` of
  `podman-compose==1.6.0` and passed the checks `podman-compose --version` equals `podman-compose version 1.6.0` and
  `PODMAN_COMPOSE_PROVIDER` equals the installed binary.
- `npx nx run-many -t test:e2e --projects=crane-cli,ts-env-loader,web-ui,ferret-cli-e2e,ayokoding-cli --parallel=1`
  ran. The `ayokoding-cli` real-engine BDD adapter printed `ok .../apps/ayokoding-cli/tests/bdd 184.306s`.
- The only failed task was `ferret-cli-e2e:test:e2e`: three `test_interpreter_guard_steps.py` scenarios about a host
  whose default interpreter is older than FERRET requires. That is a Python interpreter-guard test in a project this
  migration does not touch. It had never run in CI on `main` before, because the `e2e` job is skipped while the
  `ferret-cli` integration baseline fails. It is a second pre-existing `ferret-cli` problem, recorded for the owner.

This closes the open item in `cli-ci-rediscovery.md`: the new `e2e` step runs on the runner and `ayokoding-cli` E2E
passes with it.

## Run 40781987617 (head e47e77b4e, nonce d2p-row20-1793223651): row 20 on the final inputs

Dispatched on 2026-10-29 from the throwaway branch `docker-to-podman-row20-proof`: `main` at `f03747d98` plus one
appended job that runs `setup-podman` and then `npx nx run ayokoding-www:test:integration` with the Nx cache disabled.
The branch was deleted after the run.

- `setup-podman` selected `podman=5.7.0+ds2-3build1` for `ubuntu/resolute/amd64`.
- Row 20: `Test Files 13 passed (13)`, `Tests 192 passed (192)`, then `Successfully ran target test:integration for
project ayokoding-www and 3 tasks it depends on`. The counts equal the earlier receipt from run 40667489060 on
  `88a20850c`. Row 20 now has a CI receipt on the final runtime inputs.

## Run 40783837245 (head dc701041b): the setup-podman capability step on a real runner

Dispatched from the throwaway branch `docker-to-podman-cap-proof` (the branch of #755 plus one appended job that runs
`setup-podman` and prints the engine facts). The PR gate of #755 skipped every container job through its path filter,
so this run is the runner proof for the new step. The branch was deleted after the run.

- `Run ./.github/actions/setup-podman` succeeded, which includes the new step that fails unless cgroup v2 with the cpu,
  memory and pids controllers, the netavark backend with an aardvark-dns path, and the overlay storage driver are present.
- The facts printed afterwards: rootless `true`, `cgroupVersion` `v2`, controllers `cpu`, `memory`, `pids`,
  `networkBackend` `netavark`, `dnsPath` the runner's aardvark-dns binary, `graphDriver` `overlay`.
- The step reached `main` in #755 (`1c07b224f`).
