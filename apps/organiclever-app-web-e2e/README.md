# organiclever-app-web-e2e

This project checks OrganicLever’s product interface in a real browser. Its Gherkin scenarios cover
the journeys that matter to someone using the app, while Playwright-BDD turns those examples into
repeatable checks. 🌿

## Run the browser suite

```bash
# Install the browser support once on this machine
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web-e2e:install

# Start the app for a local run
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:dev

# In another terminal, run the scenarios
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web-e2e:test:e2e
```

Use
`./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web-e2e:test:e2e:ui`
to investigate a scenario visually, or
`./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web-e2e:test:e2e:report`
to open the last HTML report.

## Target a different environment

The suite uses `http://localhost:3202` by default. Set `WEB_BASE_URL` to test an already-running
environment. Keep credentials and access tokens outside committed files.

## Keep it healthy

```bash
npm exec nx -- run organiclever-app-web-e2e:test:quick
npm exec nx -- run organiclever-app-web-e2e:test:coverage
npm exec nx -- run organiclever-app-web-e2e:test:e2e
```

The behaviour source of truth is in
[the OrganicLever app-web Gherkin specs](../../specs/apps/organiclever/app-web/behaviours/README.md).

This dedicated E2E project owns no independent corpus. Its `test:e2e` adapter observes the owner
application's public browser boundary; `test:coverage:e2e`, `test:coverage:behaviour`, and
aggregate `test:coverage` validate it statically. Unit and Integration are omitted because their
in-process and local-resource boundaries belong to the owner application.
