# ose-id-web-e2e

This project tests `ose-id-web` through a real Chromium browser. Playwright-BDD executes the same
behaviour examples that describe the shell, including keyboard-only navigation, a 320-pixel viewport,
non-color-only status conveyance, and what the shell reports when its backend is ready, unready, or
unreachable.

It also owns the outer local-stack lifecycle. Because the shell reports what its backend tells it,
each scenario needs a shell standing beside a backend in a named situation, so the suite establishes
three environments before the first test runs and stops them all afterwards:

| Environment             | Port   | How it is established                                                                      |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Ready stack             | `3500` | `ose-id-be-e2e`'s local-stack runner: PostgreSQL, migrations, backend, and this shell      |
| Backend unreachable     | `3501` | The prebuilt shell pointed at a loopback origin with no listener                           |
| Backend reports unready | `3502` | A second local-stack run on its own ports whose PostgreSQL is stopped after full readiness |

Running `test:e2e` therefore requires Docker and the .NET SDK, exactly as `ose-id-be-e2e` does.

## Run locally

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm install
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-id-web-e2e:install
./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ose-id-web-e2e:test:e2e
```

`test:e2e` starts and stops every environment above itself; no separate terminal is required. It
never reuses an already-running listener on those ports — a collision fails the run rather than
quietly changing what the scenarios observed — so stop any local stack of your own first.

## Target a running environment

The default base URL is `http://127.0.0.1:3500`. Set `WEB_BASE_URL` to point the suite at an
already-running instance instead of letting it manage any lifecycle itself; in that mode also set
`WEB_UNREADY_BASE_URL` and `WEB_UNREACHABLE_BASE_URL` to instances already in those situations, since
nothing will be started for you. Never commit credentials or real access values.

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
