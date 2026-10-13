# ayokoding-www-fe-e2e

Dedicated Playwright adapter for AyoKoding's public browser boundary.

## BDD and Testing

This project consumes `specs/apps/ayokoding/www/behaviours/` and the shared resizable-panel
behaviour; it owns no independent corpus. `test:e2e` runs the browser adapter, while
`test:coverage:e2e`, `test:coverage:behaviour`, and aggregate `test:coverage` validate it
statically. Unit and Integration targets are omitted because those layers belong to the owner
application and a dedicated E2E project owns neither in-process decision logic nor a non-networked
local-resource boundary.

Run `npm exec nx -- run ayokoding-www-fe-e2e:test:quick` for static checks or
`npm exec nx -- run ayokoding-www-fe-e2e:test:e2e` for the complete runtime suite.

Rebuild the app with `--skip-nx-cache` under the fixture env before the runtime suite:
statically generated pages bake manifest and content data at build time, and the Nx
build cache key does not see environment variables, so a cached build from a
non-fixture run serves real data to fixture expectations.
