# roots-be-e2e

End-to-end tests for [`roots-be`](../roots-be/README.md), driven through its public HTTP
boundary. Playwright-BDD executes the same behaviour examples that describe the service — no
browser involved. 🧪

## Run locally

```bash
# Install test dependencies once on this machine
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run roots-be-e2e:install

# Build the service and run the scenarios against a real process
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run roots-be-e2e:test:e2e
```

`test:e2e` runs [`apps/roots-be/scripts/run-e2e.sh`](../roots-be/scripts/run-e2e.sh), which
builds the binary through Nx — so `codegen` runs first and the binary matches the current contract —
and then hands process lifecycle to the harness. There is no `docker-compose` stack: the service
owns no database, broker, or disk, so there is nothing to stand up.

Use `roots-be-e2e:test:e2e:ui` for Playwright's UI and `roots-be-e2e:test:e2e:report` for the
most recent report.

## The suite starts the process it observes

`steps/backend-process.ts` spawns the compiled binary on port 8402 and stops it afterwards. It
reuses a process **only** if this harness started it and it is still alive; anything else already
listening on 8402 is a hard error rather than a silent reuse.

That rule is not defensive styling. While this suite was being written, a stale binary left over
from an earlier `nx run roots-be:dev` held the port, and a deliberately broken health handler
still reported three green scenarios — the suite never executed the code under test. Reusing
whatever answers on a port makes a green run meaningless, so this project refuses to do it. See
[`plans/done/2026-09-09__islamic-be-init/evidence/phase-4-e2e.txt`](../../plans/done/2026-09-09__islamic-be-init/evidence/phase-4-e2e.txt)
for both runs.

Set `API_BASE_URL` to point Playwright's `request` fixture at a different environment. Never commit
credentials or real access values.

## Retries are off

`retries: 0`, in CI and out. A scenario that only passes on a second attempt is a defect to fix at
its root cause, and a retry would hide it. This diverges deliberately from `apps/ose-be-e2e`, which
retries twice in CI.

## Scope

| Layer       | Owner      | Status                                                       |
| ----------- | ---------- | ------------------------------------------------------------ |
| Unit        | `roots-be` | **Omitted here.** In-process proof belongs to the service    |
| Integration | —          | **Omitted here.** `roots-be` owns no local-resource boundary |
| E2E         | `steps/`   | The three health scenarios, over real HTTP                   |

This project owns no independent corpus. The behaviour source of truth is
[the roots-be Gherkin suite](../../specs/apps/roots/be/behaviours/README.md).

The five `config/` scenarios carry `@e2e-exempt` with a written reason: which source supplied the
port is not observable through the public HTTP boundary, only that the service listens. That one tag
is read by both `playwright.config.ts`'s filter and `scripts/behaviour-coverage.mjs`, so the
exemption is declared once. There is no `e2e-coverage-baseline.json` — no exemption needs one, and
deleting a single tag makes `test:coverage:e2e` fail with `undefined E2E binding`.

## Checks

```bash
npm exec nx -- run roots-be-e2e:test:quick    # typecheck, lint, specs, coverage validators
npm exec nx -- run roots-be-e2e:test:coverage # static binding coverage for both adapters
```
