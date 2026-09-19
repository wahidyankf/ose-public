# ose-app-web-e2e

This project checks the OSE product web app through the same browser journeys a user takes. It turns
the app’s Gherkin examples into Playwright-BDD scenarios. 🚦

## Run locally

```bash
# Install Chromium once on this machine
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ose-app-web-e2e:install

# Playwright starts the web app automatically. Start the API only for
# scenarios that require local full-stack behaviour.
npm exec nx -- run ose-be:dev

# Run the browser scenarios
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-app-web-e2e:test:e2e
```

Use `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-app-web-e2e:test:e2e:ui`
to debug interactively, or
`./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ose-app-web-e2e:test:e2e:report`
to open the last report.

## Target a running environment

The default app URL is `http://localhost:3300`; Playwright starts it automatically when
`WEB_BASE_URL` is unset. Set `WEB_BASE_URL` to target a different already-running environment.
Keep credentials and deployment-access tokens in uncommitted local configuration only.

## Checks and specs

```bash
npm exec nx -- run ose-app-web-e2e:test:quick
npm exec nx -- run ose-app-web-e2e:test:coverage
npm exec nx -- run ose-app-web-e2e:test:e2e
```

The product behaviour source of truth is
[the OSE app-web Gherkin suite](../../specs/apps/ose/app-web/behaviours/README.md).

This dedicated E2E project owns no independent corpus. Its `test:e2e` adapter observes the owner
application's public browser boundary; `test:coverage:e2e`, `test:coverage:behaviour`, and
aggregate `test:coverage` validate it statically. Unit and Integration are omitted because their
in-process and local-resource boundaries belong to the owner application.
