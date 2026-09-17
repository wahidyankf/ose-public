# OSE Application web

The web client for OSE Application, a pre-alpha Governance, Risk, and Compliance (GRC) product.
It is being shaped for compliance officers and risk teams who need to compare regulator-published
requirements with their organisation's internal policies.

## What the product is intended to do

OSE Application is designed to help teams:

- bring regulatory documents and internal policies into one place;
- use AI-assisted analysis to identify gaps between them; and
- track each finding as a traceable GapItem that connects a regulatory clause to a missing policy
  area.

The current interface is a bootstrap scaffold, not a complete product workflow. Expect the
experience and architecture to evolve as the application moves beyond pre-alpha.

## Run it locally

From the repository root, install the workspace dependencies and start the web client:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev ose-app-web
```

Then open <http://localhost:3300>. The app currently has no application-defined environment
variables, so no local configuration is required to run this screen.

To run the web client alongside the OSE API and its development database, use the local stack:

```bash
./hippo run --class service --resource-tier standard --disk-path . -- \
  docker compose -f infra/dev/ose-app/docker-compose.yml up --build
```

Keep that terminal open so HIPPO owns the stack for its full lifetime. Stop it with
<kbd>Ctrl</kbd>+<kbd>C</kbd>, then remove the stopped containers and network with
`./hippo run --class transactional --resource-tier standard --disk-path . -- docker compose -f infra/dev/ose-app/docker-compose.yml down`.

## Useful commands

Run these from the repository root.

| Command                                                                                                              | When to use it                                                             |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `./hippo run --class service --resource-tier standard --disk-path . -- npm exec -- nx run ose-app-web:dev`           | Start the local development server on port 3300.                           |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec -- nx run ose-app-web:build`       | Produce a production build.                                                |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec -- nx run ose-app-web:test:quick`  | Run type, lint, Unit, static coverage, and specification checks.           |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec -- nx run ose-app-web:test:unit`   | Run Unit tests with the 99% line-coverage hard gate.                       |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec -- nx run ose-app-web:lint`        | Run accessibility-aware Oxlint and ESLint checks.                          |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec -- nx run ose-app-web:codegen` | Regenerate TypeScript API types from the OSE Application OpenAPI contract. |
| `./hippo run --class service --resource-tier standard --disk-path . -- npm exec -- nx run ose-app-web:storybook`     | Explore components locally with Storybook on port 6006.                    |

## How the pieces fit together

- This app is a Next.js 16 and TypeScript frontend. Its routes and shared UI live in
  [`src/`](./src/).
- [`@open-sharia-enterprise/web-ui`](../../libs/web-ui/) provides the shared UI components and
  design tokens used by the app.
- [`ose-be`](../ose-be/) is the OSE Application backend.
- The [OpenAPI contract](../../specs/apps/ose/be/contracts/) is the source of truth for
  the API shared by the frontend and backend. The `codegen` target keeps generated TypeScript
  types in sync with that contract.
- [Product, architecture, and behaviour specifications](../../specs/apps/ose/) explain the
  intended user outcomes and acceptance scenarios.

## Next places to look

- [Frontend acceptance scenarios](../../specs/apps/ose/app-web/behaviours/) describe the
  observable browser behaviour.
- [Browser end-to-end tests](../ose-app-web-e2e/) exercise those scenarios with Playwright.
- [Development environment setup](../../docs/how-to/setup-development-environment.md) covers the
  tools used across the repository.

## BDD and Testing

The canonical corpus is `specs/apps/ose/app-web/behaviours/`. This project owns the Unit adapter
through `test:unit`; `ose-app-web-e2e:test:e2e` owns the public browser runtime. Matching
`test:coverage:*` targets validate both adapters statically. Integration and owner-local E2E
runtime are omitted because the client owns no non-networked local-resource boundary and the
dedicated project owns browser execution.

The app-local composition-root Unit suite separately verifies that `next.config.ts` invokes the
shared `ts-env-loader` port. Tier selection, precedence, and dotenv resource behaviour belong to
the library corpus at `specs/libs/ts-env-loader/behaviours/`, so the app does not duplicate those
scenarios.
