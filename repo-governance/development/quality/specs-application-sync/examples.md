---
description: "PASS/FAIL examples of endpoint, app-removal, bug-fix, and refactor changes against sync obligations."
when_to_use: "Use when you need a concrete example of a change that does or does not require a spec update."
---

# Examples

## PASS: Adding an endpoint with synchronized specs

A developer adds a `GET /api/products/:id` endpoint to `organiclever-be`.

They:

1. Update `specs/apps/organiclever/be/contracts/` (OpenAPI spec) with the new endpoint definition
2. Run `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-contracts:codegen` and related codegen targets
3. Add a Gherkin scenario to `specs/apps/organiclever/be/behaviours/products/get-product.feature`
4. Update `specs/apps/organiclever/be/architecture.md` if the endpoint belongs to a new component
5. Implement the endpoint in `apps/organiclever-be/`

All changes are in a single commit or PR.

## FAIL: Adding an endpoint without updating specs

A developer adds `GET /api/products/:id` to `apps/organiclever-be/` but does not update the OpenAPI contract, Gherkin feature files, or C4 diagrams.

The `codegen` target dependency fails at `typecheck` because the generated types are stale. Even if `codegen` is run, the missing Gherkin scenario means the behaviour is unspecified, and the C4 diagram no longer reflects what the system does.

This is a violation of the sync convention.

## PASS: Removing an app with synchronized cleanup

An app is removed from the monorepo.

The developer also:

1. Removes any app-specific references from the relevant `specs/apps/<app-name>/README.md`
2. Updates the root `specs/README.md` if it listed the app explicitly
3. Verifies no Gherkin scenarios reference app-specific step definitions

The C4 diagram is updated to remove the container if it was represented separately.

## FAIL: Renaming an app without updating specs

The team renames `apps/organiclever-app-web` to `apps/organiclever-landing`. The `specs/apps/organiclever-app-web/` folder is not renamed.

CI now has a mismatch: the app path and the spec path use different names. Reviewers and new contributors cannot determine whether `specs/apps/organiclever-app-web/` refers to the current `organiclever-landing` app or a removed app. This is a violation.

## PASS: Bug fix with no spec change

A developer fixes a null pointer dereference in a Go repository function. The bug caused a 500 response where a 200 was expected. The existing Gherkin scenario for that endpoint already described the expected 200 behaviour — the bug caused a deviation from the spec, and the fix restores compliance.

No spec changes are needed: the spec was correct and the code was wrong.

## PASS: Internal refactor with no spec change

A developer extracts a large tRPC router into two smaller routers for maintainability. The API surface (procedure names, input shapes, output shapes) is unchanged. No new procedures are added.

No Gherkin or C4 changes are needed: external behaviour and container/component boundaries are unchanged.
