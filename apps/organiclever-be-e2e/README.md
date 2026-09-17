# organiclever-be-e2e

This project checks the OrganicLever backend through its HTTP API. It uses Playwright’s request
client rather than a browser, so the scenarios stay focused on product behaviour at the API boundary.
🔬

## Run the API suite

```bash
# Install test dependencies once on this machine
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be-e2e:install

# Start the backend at http://localhost:8202
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be:dev

# In another terminal, run the scenarios
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be-e2e:test:e2e
```

`./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be-e2e:test:e2e:ui`
opens Playwright’s UI, and
`./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-be-e2e:test:e2e:report`
opens the latest HTML report.

## Target a different environment

The default API address is `http://localhost:8202`. Set `API_BASE_URL` to test another running
environment. Do not put credentials or access tokens in this README or any tracked configuration.

## Keep it healthy

```bash
npm exec nx -- run organiclever-be-e2e:test:quick
npm exec nx -- run organiclever-be-e2e:test:coverage
npm exec nx -- run organiclever-be-e2e:test:e2e
```

The expected behaviour is described in
[the OrganicLever backend Gherkin specs](../../specs/apps/organiclever/be/behaviours/README.md).

This dedicated E2E project owns no independent corpus. Its `test:e2e` adapter observes the backend
through public HTTP and messaging boundaries; `test:coverage:e2e`, `test:coverage:behaviour`, and
aggregate `test:coverage` validate it statically. Unit and Integration are omitted because their
in-process and local-resource boundaries belong to `organiclever-be`.
