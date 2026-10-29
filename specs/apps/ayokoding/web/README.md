# AyoKoding Go Web — Specification Corpus

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: These specifications describe the Go rewrite of the
> bilingual AyoKoding learning site. They preserve the existing learner experience while allowing
> the new site and the current site to run independently during local development.

## Status

**Implemented and bound to tests.** The implementation lives in
`apps/ayokoding-web`: a Go standard-library server with `html/template` pages and htmx fragment
endpoints. The existing Next.js implementation remains in
[`apps/ayokoding-www`](../../../../apps/ayokoding-www/README.md).

The [rewrite plan](../../../../plans/in-progress/ayokoding-app-web/README.md) owns the proposed
architecture, implementation checklist, complete source-scenario inventory, and parity evidence.
These features state durable acceptance contracts; they do not claim that the future application,
its test bindings, or a successful runtime check already exists.

## Contents

- [Architecture](./architecture.md) — current implementation status and the evidence required to
  replace this status record with the implemented architecture.
- [Behaviours](./behaviours/README.md) — learner and local-development contracts grouped by domain.

## Relationship to the current site

The [`www` corpus](../www/README.md) remains authoritative for the current implementation. Every
existing user-facing behavior remains a rewrite parity obligation, including behavior not repeated
in this initial corpus. The plan must map every source scenario to a retained, adapted, or explicitly
superseded rewrite scenario before accepting the relevant implementation slice. Framework-specific
Next.js artifacts do not become Go requirements; their observable purpose does.

The rewrite reads the same Markdown, course manifests, and public assets in place. Existing content
plans may continue independently. Course counts, available legacy pages, and transitional manifest
fields follow the shared corpus already merged into `main`; they are not frozen by this document.

## Proof ownership

| Layer       | Proof                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Plain `go test` over `internal/...` with in-memory fakes for Go decisions; TypeScript unit tests for browser-only state and hook helpers |
| Integration | Real isolated content/manifests, filesystem adapters, and Go request handling over owned test listeners                                  |
| E2E         | Playwright with `playwright-bdd`, exercising the owned Go server on port 3191 with real browser and HTTP requests                        |

Unit proof is mandatory for every scenario. Browser-only state scenarios use the TypeScript unit
adapter rather than a second Go model of browser storage. Integration exemptions name their
alternative proof in the feature file. godog and Playwright consume this one canonical corpus;
their test adapters do not create separate feature copies. Consumer acceptance suites configure
zero retries and do not use retry tags.

## Local boundary

The current site keeps port **3101**. Go development defaults to **3102**, with
`AYOKODING_WEB_PORT` as its prefixed override; its Playwright server uses **3191**. Different
ports are separate browser origins, so they do not automatically share saved progress or settings.
The explicit launcher port flag takes precedence over the prefixed variable, which takes
precedence over the default. The generic `PORT` variable does not retarget this application.
There is no deployment, production cutover, account system, or database requirement here.

## Related

- [AyoKoding product specifications](../README.md) — current and planned logical owners.
- [Spec-to-test mapping](../../../../repo-governance/development/infra/bdd-spec-test-mapping.md) —
  repository requirements for layer ownership and static binding checks.
