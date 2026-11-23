# ose-www-fe-e2e

Dedicated Playwright adapter for the OSE website's public browser boundary.

## BDD and Testing

This project consumes `specs/apps/ose/www/behaviours/`; it owns no independent corpus. `test:e2e`
runs the browser adapter, while `test:behaviour:coverage` validates it statically. Unit and Integration targets are omitted because those
layers belong to the owner application and a dedicated E2E project owns neither in-process
decision logic nor a non-networked local-resource boundary.

Run `npm exec nx -- run ose-www-fe-e2e:test:quick` for static checks or
`npm exec nx -- run ose-www-fe-e2e:test:e2e` for the complete runtime suite.
