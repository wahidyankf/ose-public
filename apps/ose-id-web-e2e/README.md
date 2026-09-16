# ose-id-web-e2e

This project tests `ose-id-web` through a real Chromium browser. Playwright-BDD executes the same
behaviour examples that describe the shell, including keyboard-only navigation, a 320-pixel viewport,
and non-color-only status conveyance.

## Run locally

```bash
./hippo run --class ephemeral --disk-path . -- npm install
./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-id-web-e2e:install
./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-id-web-e2e:test:e2e
```

`test:e2e` starts `ose-id-web:dev` itself (`OSE_RUNTIME_MODE=Test`, port `3500`) and reuses it if one
is already running outside CI; no separate terminal is required.

## Target a running environment

The default base URL is `http://127.0.0.1:3500`. Set `WEB_BASE_URL` to point the suite at a different
already-running instance instead of letting it manage the server lifecycle itself; never commit
credentials or real access values.

## Checks and specs

```bash
npm exec nx -- run ose-id-web-e2e:typecheck
npm exec nx -- run ose-id-web-e2e:lint
npm exec nx -- run ose-id-web-e2e:test:e2e
npm exec nx -- run ose-id-web-e2e:test:quick
```

The behaviour source of truth is
[the OSE ID web Gherkin suite](../../specs/apps/ose/id-web/behaviours/README.md).

This dedicated E2E project owns no independent corpus. Its `test:e2e` adapter observes `ose-id-web`
through a real browser; `test:coverage:e2e`, `test:coverage:behaviour`, and aggregate `test:coverage`
validate it statically. Unit and Integration are omitted because their in-process boundaries belong to
`ose-id-web` itself.
