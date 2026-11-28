# E2E Suites

This companion explains how the owner's e2e decision (2026-11-28, decision 3) partitions the scenarios between the two
homes and their Playwright configs. Read [006](./006-parity-program-design.md) first for the URL-compatibility contract
the suites enforce.

## Terms

- **E2E home** — an Nx project under `apps/*-e2e` that runs Gherkin scenarios from the owner's corpus
  against a running server. The repository names them `<app>-be-e2e` (HTTP boundary) and
  `<app>-fe-e2e` (browser boundary).
- **Reusable workflow** — `.github/workflows/_reusable-www-test-local-deploy.yml`. Given an `app-name`
  input it runs `<app-name>:lint`, `:test:quick`, `:test:behaviour:coverage`, then
  `<app-name>-be-e2e:test:behaviour:coverage` when that project exists, and always
  `<app-name>-fe-e2e:test:behaviour:coverage` and `<app-name>-fe-e2e:test:e2e`. The names are derived,
  not configured, so the new suites take `ayokoding-web-*` names.

## Current state

| Home                   | Server and corpus                                                                             | Defects against repository rules                                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ayokoding-www-be-e2e` | Old Next.js server on 3101, `reuseExistingServer: true`, `BASE_URL` honoured                  | `retries: process.env.CI ? 2 : 0`; `trace: "on-first-retry"`; reuses a running server. Scenarios are tRPC envelopes (`backend/*`) and are Next-specific.                                   |
| `ayokoding-www-fe-e2e` | Old Next.js standalone server on 3101, manifests fixture, drafts shown                        | `retries: process.env.CI ? 2 : 0`; `timeout: 150000` justified by retries; `support/resilient-request.ts` (`getResilient`, one retry inside the call, used 30 times); Chromium only in CI. |
| `ayokoding-web-e2e`    | Go binary on 3191, fixture corpus, three browsers, `retries: 0`, `reuseExistingServer: false` | Fixture only: nothing proves the app against the real corpus. One home owns both HTTP and browser scenarios.                                                                               |

The repository rule is [Flaky Tests Are Defects](../../../../repo-governance/development/workflow/test-driven-development/flaky-tests-are-defects.md):
no retry, sleep, widened timeout, loosening, skip, or quarantine. The two old homes break it, so the
rebuilt homes must not inherit their configuration or helper.

## Target state

| Home                                                                          | Boundary | Owns                                                                                                                                                                                                      | Server                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ayokoding-web-be-e2e` (new)                                                  | HTTP     | The nine HTTP-only feature files listed in [008](./008-bdd-delta-map.md#http-only-feature-files): status codes, redirects, 404s, sitemap, feed, robots, caching headers, htmx fragments, the parity crawl | Two Playwright configs from `P3-E2E`, each on port 3191 and each serial: `playwright.fixture.config.ts` (`@fixture and not @fixture-unavailable`, `AYOKODING_WEB_FIXTURE=parity`) and `playwright.real-corpus.config.ts` (`not @fixture`; its switch is removed in `P3-Corpus`). A third, `playwright.unavailable-catalog.config.ts` (`@fixture-unavailable`, `--fixture unavailable-catalog`), is created in `P5-Cache`.                                                                         |
| `ayokoding-web-fe-e2e` (the existing `ayokoding-web-e2e`, moved and extended) | Browser  | Every other feature file under `behaviours/` (all browser scenarios, and the design-parity target)                                                                                                        | One real-corpus config, `playwright.real-corpus.config.ts`, which binds its files by glob, with a `bdd-<browser>` and a `specs-<browser>` project per browser (per-project `testDir`). Its `AYOKODING_WEB_FIXTURE=parity` switch is removed in `P3-Corpus`, after its steps are rewritten to real-corpus witnesses. From `P3-Corpus` until `P5-Surfaces`, `playwright.fixture.config.ts` runs the htmx spec on the fixture. It always starts the built binary on 3191; it has no `BASE_URL` mode. |

Both homes bind the corpus at `specs/apps/ayokoding/web/behaviours/`; neither owns a corpus. The partition is by feature file: the be home binds nine HTTP-only files, and the fe home binds every other file. Each new or split file gets a `@scenario <path>: *` reference line in both godog suites and in the home's step files, which rule C13 reads by path, and the unit that creates the file adds it:

| Tag                    | Meaning                                                                                                                                                                                                | Selected by                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `@real-corpus`         | Meaningful only on the real corpus (the crawl, sitemap completeness, search over real content, the real feed). Informational.                                                                          | Nothing; no config selects by it                                                                                                           |
| `@fixture`             | Data mode: the scenario needs deterministic fixture data that the real corpus cannot supply (for example a draft lesson). Each one is listed with its reason in `evidence/P3-E2E/fixture-scenarios.md` | The fixture config of `ayokoding-web-be-e2e` (`@fixture and not @fixture-unavailable`); real-corpus configs exclude it with `not @fixture` |
| `@fixture-unavailable` | Data mode: the scenario needs the unavailable-catalog fixture. It also carries `@fixture`.                                                                                                             | `playwright.unavailable-catalog.config.ts` only, created in `P5-Cache`                                                                     |

Selection is by file for the homes, and by data mode inside the be home. A feature file is wholly one home: the
be home binds the nine HTTP-only files listed in [008](./008-bdd-delta-map.md#http-only-feature-files), and the fe home
binds every other file under `behaviours/`. Inside the be home, the tags `@fixture` and `@fixture-unavailable` pick the
fixture each config runs; they select data mode, not a layer, so they are not positive layer-selection tags. Real-corpus
configs run `not @fixture`; the fixture config runs `@fixture and not @fixture-unavailable`; the unavailable-catalog config
runs `@fixture-unavailable`. Until `P5-Cache` the be home has no unavailable-catalog config and no `@fixture-unavailable` scenario. `ayokoding-web-fe-e2e` has one fixture config, `playwright.fixture.config.ts`, from `P3-Corpus` until `P5-Surfaces`; it runs only the htmx spec, because that spec asserts fixture-only content. No browser feature file needs fixture data.

The HTTP-only files and the scenarios moved into them are listed in [008](./008-bdd-delta-map.md#existing-scenarios-that-move-to-the-http-home).
Rule C13 of the [test and gate contract](../../../../repo-governance/development/quality/checks/test-and-gate-contract/005-behaviour-corpus.md)
reads only the exemption tags, so moving scenarios between files and adding `@real-corpus`, `@fixture`, or `@fixture-unavailable` is expected not to change coverage
accounting; the RED step of `P3-E2E` proves it with `test:behaviour:coverage` before and after.

### Rules both homes follow

1. `retries: 0`, `trace: "retain-on-failure"`, `reuseExistingServer: false` when Playwright starts the
   server, and no helper that retries a request. A timeout is justified by one measured step, recorded
   next to the setting, never by contention headroom.
2. `BASE_URL` is the only switch between "start my own server" and "test that server". With `BASE_URL`
   set, the be home's `test:e2e` runs only its real-corpus config, and that config starts no server. Its fixture and unavailable-catalog configs are not run. The read-only mode covers the be home only; the fe home has no `BASE_URL` mode and always starts its own server. Nothing is skipped with `test.skip`; the selection is by config, file, and data-mode tag, so a
   counted scenario always executes.
3. The crawl is sequential per URL with a bounded number of concurrent requests (eight), one attempt
   per URL. A failed request is a failure; rerunning the suite is a new run, not a retry.
4. Port 3191 is shared by the two homes and the Go BDD e2e adapter, exactly as `ose-www-fe-e2e` and
   `ose-www-be-e2e` share 3190. The be home's `test:e2e` runs its fixture config and then its real-corpus config, one after another; from `P5-Cache` it runs the unavailable-catalog config between them, so the order is fixture, unavailable-catalog, real-corpus; the fe home's `test:e2e` runs its real-corpus config and, from `P3-Corpus` until `P5-Surfaces`, its fixture config for the htmx spec. Neither home runs in parallel with the other, so the configs and the two homes never start servers together. `docs/reference/web-sites.md` lists both
   project names against the one port.

### Mapping the old suites

The mapping already exists in part: [evidence/P0/disposition-ledger.csv](../evidence/P0/disposition-ledger.csv)
holds one row per old scenario (509) with `disposition` (444 `retain`, 40 `adapt`, 25
`implementation-only`) and `destination_feature`. `P7-FE` extends it into
`evidence/P7-FE/e2e-scenario-mapping.csv` with three added columns: `final_home`
(`ayokoding-web-be-e2e`, `ayokoding-web-fe-e2e`, or `dropped`), `final_scenario_title`, and
`drop_reason`. A row may be `dropped` only when it is Next- or tRPC-only: the two `backend/health`
tRPC checks, the 23 `build-tools` scenarios (they test the old generator and Next worker budgeting and
stay with the old app), the tRPC JSON envelopes of `backend/*`, and the Next
prerender-manifest checks of `frontend/content/static-delivery.feature`. Every `dropped` row names the
replacement proof (for example "readiness is proved by the real `/en` HTML route") or states that no
product outcome is removed. A user-facing scenario may never be `dropped`.

### Old homes stay untouched

Why not rename the old projects in place? The rebuilt suites test a different server, so renaming
`ayokoding-www-fe-e2e` in place and rebuilding it would change a suite that the old app still runs. This plan
creates the final-name homes and changes no `ayokoding-www-*` file. The owner's "rename" therefore becomes
"create under the final name"; `git mv` is used only for `ayokoding-web-e2e`, whose sole consumer is the new app.

## Recovery

Each home is created by its own pull request. Reverting `P3-E2E` restores `ayokoding-web-e2e` by
reverting the `git mv` and deleting `ayokoding-web-be-e2e`; the old www homes were never touched. A
suite that fails against the real corpus is a product defect found, not a reason to widen a timeout,
retry, or drop a scenario from E2E. Every scenario is bound at E2E through a real boundary, as 008 states.
