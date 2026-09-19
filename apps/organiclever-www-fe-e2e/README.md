# organiclever-www-fe-e2e

This project makes sure OrganicLever’s public site remains understandable, usable, and accessible
in a real browser. It checks the marketing home page and its WCAG-focused behaviour from a visitor’s
point of view. 🌱

## Run the suite

```bash
# Install Chromium once on this machine
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www-fe-e2e:install

# Run all browser scenarios; the test target starts the site it needs
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www-fe-e2e:test:e2e
```

For an interactive investigation, use
`./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www-fe-e2e:test:e2e:ui`.
To open the last report, use
`./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www-fe-e2e:test:e2e:report`.

## Checks and specs

```bash
npm exec nx -- run organiclever-www-fe-e2e:test:quick
npm exec nx -- run organiclever-www-fe-e2e:test:coverage
npm exec nx -- run organiclever-www-fe-e2e:test:e2e
```

The default target is `http://localhost:3200`. Set `BASE_URL` only to check another running
environment. The scenarios live in
[the OrganicLever public-site Gherkin specs](../../specs/apps/organiclever/www/behaviours/frontend/README.md).

This dedicated E2E project owns no independent corpus. Its `test:e2e` adapter observes the owner
site's public browser boundary; `test:coverage:e2e`, `test:coverage:behaviour`, and aggregate
`test:coverage` validate it statically. Unit and Integration are omitted because their in-process
and local-resource boundaries belong to the owner application.
