---
description: "Worked examples of feature changes and their required companion artifacts."
when_to_use: "Use when you need a concrete example of what a feature change must update."
---

# Examples

## PASS: Complete feature addition

A developer adds a `GET /api/products/:id` endpoint to `organiclever-be`.

They update, in the same commit or PR:

1. `specs/apps/organiclever/be/contracts/` -- add path and response schema
2. `specs/apps/organiclever/be/behaviours/products/get-product.feature` -- add scenarios
3. Unit tests -- test service function with mocked repository
4. Integration tests -- test persistence with a real isolated embedded database file, no external network
5. E2E tests -- test the full public HTTP flow with synthetic isolated data
6. `specs/apps/organiclever/be/architecture.md` -- update the component view if new component

## FAIL: Code without specs

A developer adds the endpoint but does not add Gherkin scenarios or update the OpenAPI contract. `test:behaviour:coverage` fails. `codegen` produces stale types. The change is incomplete.

## FAIL: Code and specs without tests

A developer adds the endpoint and updates specs and contracts but does not write tests. Unit line
coverage drops below the 99% hard minimum and static behaviour coverage finds the missing binding.
`test:quick` fails. The change is incomplete.

## PASS: Complete feature deletion

A developer removes the `DELETE /api/products/:id` endpoint.

They update, in the same commit or PR:

1. `specs/apps/organiclever/be/contracts/` -- remove path definition
2. `specs/apps/organiclever/be/behaviours/products/delete-product.feature` -- remove scenarios
3. Remove related unit, integration, and E2E tests
4. Update any documentation that referenced the endpoint

## PASS: Bug fix with no spec change

A developer fixes a null pointer in the product service. The existing Gherkin scenario already described the correct behaviour. The fix restores compliance with the spec.

They add a regression unit test but do not change specs, contracts, or documentation. The spec was already correct.
