# docker-to-podman P2 CI Evidence

## Test-only proof job recipe

Status: run 40667489060 executed at head 88a20850c (see the run section below). The job was then restructured so the
stack builds first on a fresh runner. The restructured recipe has not been dispatched.

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

The knob is the SWE-settled configuration that the delivery plan calls for: all three browsers, zero retries, and
the original timeouts and assertions, without spoofing CI state. The two configs it touches,
`apps/ayokoding-www-fe-e2e/playwright.config.ts` and `apps/ayokoding-www-be-e2e/playwright.config.ts`, are temporary
edits. They are restored with the workflow before merge, per the delivery plan.

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

- `E2E_FULL_MATRIX` is a new opt-in read by two Playwright configs, so this recipe edits them. The knob only changes
  the selection when set to exactly `1`. The delivery plan requires the reviewed bytes to be restored and the knob
  removed before merge. `scripts/e2e-playwright-config.test.mjs` proves the selection in both directions and runs in
  `npm run test:validators`; it does not prove the CI run.
- The browser install step is the shared `setup-playwright` action, unchanged. It runs `npx playwright install
--with-deps`, unless a cache entry matches the Playwright version, in which case it restores cached browsers. A
  branch can restore only caches saved from `main` or from its own branch, so the first run may install fresh.
- The reusable workflow's guard that skips row 26 when the project is missing is dropped, so a missing project fails.
- Steps keep default gating, so a failed earlier step skips the later steps. A dispatch also runs the workflow's
  existing jobs.
- The knob is step-level and only this temporary job sets it. No lint rule or validator in the repo blocks it.
- `setup-podman` accepts only the `ubuntu/resolute/amd64` tuple. Run 40667489060 selected the pinned row on
  `ubuntu-latest` (see below).

Pending: the first dispatch of the restructured job, with its executed SHA, dispatch receipt, pass or fail for rows 26,
33, and the web-UI E2E extra, and the two disk measurements.

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
