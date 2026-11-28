# ayokoding-web-be-e2e

Playwright `playwright-bdd` home for the HTTP boundary of the Go web app. It runs the nine HTTP-only feature files of the
corpus in `specs/apps/ayokoding/web/behaviours/` through `request` only. It has no browser project.

## Targets

| Target                    | What it runs                                                                                                                                                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typecheck`               | `npx tsc --noEmit`                                                                                                                                                                                                                      |
| `lint`                    | `npx oxlint .`                                                                                                                                                                                                                          |
| `test:quick`              | `typecheck`, `lint`, `test:behaviour:coverage`. It starts no server and no browser.                                                                                                                                                     |
| `test:e2e`                | The fixture config, then the real-corpus config, one after another, on port 3191. With `BASE_URL` set, only the real-corpus config runs, against that address, and no server starts. `dependsOn` the `build` target of `ayokoding-web`. |
| `test:behaviour:coverage` | `./rhino behaviour coverage validate`                                                                                                                                                                                                   |
| `test:e2e:ui`             | The real-corpus config in Playwright UI mode                                                                                                                                                                                            |
| `test:e2e:report`         | The Playwright HTML report                                                                                                                                                                                                              |
| `deps:audit`              | `npm audit`                                                                                                                                                                                                                             |

Layers this home omits, and why:

- **Unit and Integration.** The `ayokoding-web` Go module owns both layers. This home owns neither in-process decision
  logic nor a local-resource boundary, so it has no `test:unit` or `test:integration` target.
- **Browser.** The HTTP boundary is proved with `request` only. Browser behaviour belongs to
  `ayokoding-web-fe-e2e`.

## Corpus and configs

The home consumes `specs/apps/ayokoding/web/behaviours/`. It owns no corpus.

- `playwright.real-corpus.config.ts` binds the nine HTTP-only files, `not @fixture`.
- `playwright.fixture.config.ts` binds the same nine files, `@fixture and not @fixture-unavailable`. It runs the parity
  fixture.

The nine files are `content/content-rendering-http.feature`, `navigation/routes-and-navigation-http.feature`,
`search/search-http.feature`, `local-development/local-development-http.feature`, `discovery/discovery-documents.feature`,
and the later-unit files `content/content-tree-routes.feature`, `navigation/url-compatibility.feature`,
`navigation/entry-pages-http.feature`, `discovery/http-caching.feature`. A file that a later unit creates matches nothing
until it exists.

Until `P3-Corpus` removes the switch, the real-corpus config still sets `AYOKODING_WEB_FIXTURE=parity`. Its label is
"real-corpus (fixture until P3-Corpus)".

## Server and settings

- Playwright starts the built Go binary on port 3191 with `reuseExistingServer: false`, except in the read-only
  `BASE_URL` mode, where it starts none.
- `retries: 0`, `trace: "retain-on-failure"`, one worker, no `test.skip`.
- Timeouts: the test timeout is 15 s and the server-start timeout is 10 s in each config. The measured basis is in
  [server-start-measure.txt](../../plans/in-progress/ayokoding-app-web/evidence/P3-E2E/server-start-measure.txt).
- One scenario starts a second server (draft viewing on) on a free loopback port. The start is a single attempt: a port
  collision fails the scenario and is not retried.

## Read-only `BASE_URL` mode

With `BASE_URL` set, `test:e2e` runs only the real-corpus config, against that address. It starts no server and runs the
fixture config not at all. The steps issue GET requests only.

## Layout

- `tests/e2e/steps/*.steps.ts`: one step file per destination feature, plus `common` and `lifecycle`.
- `tests/e2e/support/`: scenario state keyed by the request context, the HTTP helpers, and the owned-server helper.
  No `Given`/`When`/`Then` calls live there.
