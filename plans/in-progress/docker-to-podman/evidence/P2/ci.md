# docker-to-podman P2 CI Evidence

## Test-only proof job recipe

Status: recipe prepared; no run has executed. All results are pending the first dispatch of the branch.

The temporary job `docker-to-podman-ayo-proof` sits at the end of `.github/workflows/non-product-full-quality.yml`,
bracketed by `# TEMPORARY docker-to-podman proof job` and `# END TEMPORARY`. It runs only on manual dispatch with the
branch ref and the existing `evidence_nonce`. It has no secrets, no deploy, no push, and does not call the reusable
workflow. Nx cache is disabled with `NX_SKIP_NX_CACHE=true`. The row 26 and row 33 steps set `E2E_FULL_MATRIX` to
`"1"`, an explicit opt-in knob that the two Playwright configs read. `CI` stays `true` in both steps, so the job does
not spoof CI state. With the knob, the BE config runs with zero retries and no worker cap, and the FE config keeps all
three frontend browser projects (chromium, firefox, webkit) with zero retries and no worker cap. Without the knob, CI
selects Chromium only with two retries. The browsers come from the Playwright default install set, which covers
chromium, firefox and webkit.

The knob is the SWE-settled configuration that the delivery plan calls for: all three browsers, zero retries, and
the original timeouts and assertions, without spoofing CI state. The two configs it touches,
`apps/ayokoding-www-fe-e2e/playwright.config.ts` and `apps/ayokoding-www-be-e2e/playwright.config.ts`, are temporary
edits. They are restored with the workflow before merge, per the delivery plan.

| Step                                                                      | What it does                                                                                                            | Delivery row proved               |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Checkout, setup-node, setup-podman, setup-playwright                      | Installs the pinned toolchain                                                                                           | Prerequisite only; credits no row |
| Record proof provenance                                                   | Writes the commit, runner tuple, Podman and compose versions, rootless state, CPUs, and free memory to the step summary | Provenance only; credits no row   |
| Build the Ayo www app                                                     | `npx nx run ayokoding-www:build`                                                                                        | Row 14                            |
| Run the Ayo www integration suite                                         | `npx nx run ayokoding-www:test:integration`                                                                             | Row 20                            |
| Start the stack, wait for health, verify healthy, copy prerender manifest | Mirrors the reusable workflow's `e2e` job for ayokoding-www                                                             | Prerequisite for rows 26 and 33   |
| Run the Ayo BE E2E suite                                                  | `npx nx run ayokoding-www-be-e2e:test:e2e` with `E2E_FULL_MATRIX: "1"`                                                  | Row 26                            |
| Stop Ayo containers before FE E2E                                         | `podman compose ... down` without `-v`                                                                                  | Prerequisite for row 33           |
| Run the Ayo FE E2E suite                                                  | `npx nx run ayokoding-www-fe-e2e:test:e2e` with `E2E_FULL_MATRIX: "1"`                                                  | Row 33                            |
| Stop Ayo containers (always)                                              | `podman compose ... down` with `if: always()`                                                                           | Cleanup only                      |
| Run the web-UI full E2E extra                                             | `npx nx run web-ui:test:e2e`                                                                                            | Web-UI E2E extra                  |

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
- `setup-podman` accepts only the `ubuntu/resolute/amd64` tuple. The first run must prove that `ubuntu-latest` matches it.

Pending: executed SHA, dispatch receipt, actual runner tuple, and pass or fail for rows 14, 20, 26, 33, and the web-UI
E2E extra.
