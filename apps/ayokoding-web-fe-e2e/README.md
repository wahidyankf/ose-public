# ayokoding-web-fe-e2e

Dedicated Playwright adapter for the Go rewrite's public browser boundary. It proves the corpus's browser scenarios through a
real browser against the real Go server. The HTTP-only scenarios are bound by `ayokoding-web-be-e2e`.

## Targets

| Target                    | What it runs                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typecheck`               | `npx tsc --noEmit`                                                                                                                                                                                    |
| `lint`                    | `npx oxlint .`                                                                                                                                                                                        |
| `test:quick`              | `typecheck`, `lint`, `test:behaviour:coverage`. It starts no server and no browser.                                                                                                                   |
| `test:e2e`                | `bddgen` and `playwright test` on `playwright.real-corpus.config.ts`, for Chromium, Firefox, and WebKit, on port 3191. `dependsOn` the `build` target of `ayokoding-web`. The command builds nothing. |
| `test:behaviour:coverage` | `./rhino behaviour coverage validate`                                                                                                                                                                 |
| `test:e2e:ui`             | The real-corpus config in Playwright UI mode                                                                                                                                                          |
| `test:e2e:report`         | The Playwright HTML report                                                                                                                                                                            |
| `deps:audit`              | `npm audit`                                                                                                                                                                                           |

Layers this home omits, and why:

- **Unit and Integration.** The `ayokoding-web` Go module owns both layers.
- **Design-parity harness.** The harness is test-support code, as `P6-Harness` states; it is not a target of this home.

## Corpus and config

The home consumes `specs/apps/ayokoding/web/behaviours/` and owns no corpus. `playwright.real-corpus.config.ts` binds every
feature file except the nine HTTP-only files, which `ayokoding-web-be-e2e` binds. Its tags select no data mode.

The config has one `bdd-<browser>` project and one `specs-<browser>` project per browser. The `specs-<browser>` projects run
`tests/e2e/browser-progress.spec.ts`, `tests/e2e/htmx-fragments.spec.ts`, and `tests/e2e/playwright-owned-server.spec.ts`.

Until `P3-Corpus` removes the switch, the config sets `AYOKODING_WEB_FIXTURE=parity`. Its label is "real-corpus (fixture
until P3-Corpus)". The `htmx-fragments` spec stays in this home for the same reason as the browser scenarios; `P3-Corpus` decides its fixture-or-corpus data.
fixture config.

## Server and settings

- Playwright starts the built Go binary on port 3191 with `reuseExistingServer: false`. This home has no `BASE_URL` mode,
  and always starts its own server.
- `retries: 0`, `trace: "retain-on-failure"`, one worker, no `test.skip`.
- Timeouts: the test timeout is 15 s and the server-start timeout is 10 s. The measured basis is in
  [server-start-measure.txt](../../plans/in-progress/ayokoding-app-web/evidence/P3-E2E/server-start-measure.txt).
- The browsers must be installed on the host (`npx playwright install`). The repository's CI action runs the same command.

## Layout

- `tests/e2e/steps/*.steps.ts`: one step file per browser domain.
- `tests/e2e/support/*.ts`: per-test state, storage records, network recording, and owned-server helpers. No
  `Given`/`When`/`Then` calls live there.
- `tests/e2e/*.spec.ts`: the three ordinary specs above.
- `tests/e2e/fixtures/`: suite-owned storage-record fixtures.
