# ayokoding-web-e2e

Dedicated Playwright adapter for the Go rewrite's public browser boundary. It
proves the same canonical corpus the godog drivers bind, through a real
browser against the real Go server.

## BDD and testing

This project consumes `specs/apps/ayokoding/web/behaviours/` and owns no
independent corpus. `test:e2e` builds the Go server, generates the
canonical-corpus specs with `bddgen`, and runs the whole runtime suite
(generated specs plus the focused ordinary specs in `tests/e2e/*.spec.ts`).
`test:coverage:e2e`, `test:coverage:behaviour`, and aggregate `test:coverage`
validate the bindings statically. Unit and Integration targets are omitted:
those layers belong to the `ayokoding-web` Go module, and a dedicated E2E
project owns neither in-process decision logic nor a non-networked
local-resource boundary.

Run `npm exec nx -- run ayokoding-web-e2e:test:quick` for static checks or
`npm exec nx -- run ayokoding-web-e2e:test:e2e` for the complete runtime suite.

## Server and fixtures

Playwright starts the built Go server on port 3191 with
`AYOKODING_WEB_FIXTURE=parity`, the same canned corpus the godog unit and
integration drivers bind. `reuseExistingServer` is `false` and retries are
`0`; Chromium, Firefox, and WebKit all run. `tests/e2e/fixtures/` holds
suite-owned inputs (progress records for storage scenarios); the server's
content comes from the parity fixture, not from a developer's working tree.
Scenarios that name the old origin on port 3101 use a suite-owned stub
responder with the same body the godog integration driver stubs — the suite
never starts or depends on the old application.

## Layout

- `tests/e2e/steps/*.steps.ts` — one step file per behaviour domain.
- `tests/e2e/support/*.ts` — per-test state, storage records, network
  recording, and owned-server helpers. No `Given`/`When`/`Then` calls live
  here, so support files contribute no bindings.
- `tests/e2e/*.spec.ts` — focused ordinary specs (`browser-progress`,
  `htmx-fragments`) that run under `playwright.focused.config.ts` after the
  generated corpus specs.
- `fixtures/` — suite-owned storage-record fixtures.
