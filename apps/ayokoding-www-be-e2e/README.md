# ayokoding-www-be-e2e

Dedicated Playwright adapter for AyoKoding behaviours observed through the deployed public server
boundary.

## BDD and Testing

This project consumes the backend portion of `specs/apps/ayokoding/www/behaviours/` plus the shared
learn-navigation scenario; it owns no independent corpus. `test:e2e` runs the public-boundary
adapter, while `test:behaviour:coverage` validates it statically. Unit and Integration targets are omitted because those layers belong to the
owner application and a dedicated E2E project owns neither in-process decision logic nor a
non-networked local-resource boundary.

Run `npm exec nx -- run ayokoding-www-be-e2e:test:quick` for static checks or
`npm exec nx -- run ayokoding-www-be-e2e:test:e2e` for the complete runtime suite.
