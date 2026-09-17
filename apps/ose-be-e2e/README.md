# ose-be-e2e

This project tests OSE’s backend through its HTTP API. Playwright-BDD executes the same behaviour
examples that describe the service, without needing a browser. 🧪

## Run locally

```bash
# Install test dependencies once on this machine
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-be-e2e:install

# Start the API at http://localhost:8302
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-be:dev

# In another terminal, run the API scenarios
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-be-e2e:test:e2e
```

Use `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-be-e2e:test:e2e:ui` for
Playwright’s UI or
`./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-be-e2e:test:e2e:report` for the
most recent report.

## Target a running environment

The default API address is `http://localhost:8302`. Set `API_BASE_URL` to point the suite at a
different running environment; never commit credentials or real access values.

## Checks and specs

```bash
npm exec nx -- run ose-be-e2e:test:quick
npm exec nx -- run ose-be-e2e:test:coverage
npm exec nx -- run ose-be-e2e:test:e2e
```

The behaviour source of truth is
[the OSE backend Gherkin suite](../../specs/apps/ose/be/behaviours/README.md).

This dedicated E2E project owns no independent corpus. Its `test:e2e` adapter observes the backend
through public HTTP and messaging boundaries; `test:coverage:e2e`, `test:coverage:behaviour`, and
aggregate `test:coverage` validate it statically. Unit and Integration are omitted because their
in-process and local-resource boundaries belong to `ose-be`.
