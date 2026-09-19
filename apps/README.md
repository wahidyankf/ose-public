# Applications

`apps/` contains the products, services, command-line tools, and end-to-end test projects that can be built and run from this workspace. Start with the product or capability you need; each app README has its local requirements and commands.

## Product map

| If you are working on                        | Start here                                                                                                  | Purpose                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| OSE's public presence                        | [ose-www](./ose-www/README.md)                                                                              | Public website for Open Sharia Enterprise and its updates.               |
| OSE governance, risk, and compliance product | [ose-app-web](./ose-app-web/README.md) and [ose-be](./ose-be/README.md)                                     | The product web client and its REST API backend.                         |
| OSE learning management                      | [ose-lms-be](./ose-lms-be/README.md)                                                                        | REST API backend for the OSE LMS.                                        |
| OSE identity platform                        | [ose-id-web](./ose-id-web/README.md) and [ose-id-be](./ose-id-be/README.md)                                 | The OSE ID status shell and its identity backend.                        |
| AyoKoding                                    | [ayokoding-www](./ayokoding-www/README.md)                                                                  | Educational content platform.                                            |
| OrganicLever's public presence               | [organiclever-www](./organiclever-www/README.md)                                                            | Marketing website for the OrganicLever productivity platform.            |
| OrganicLever's life journal                  | [organiclever-app-web](./organiclever-app-web/README.md) and [organiclever-be](./organiclever-be/README.md) | Local-first journal and productivity tracker, with its REST API backend. |
| Roots                                        | [roots-be](./roots-be/README.md)                                                                            | REST API backend for the Roots Islamic-tooling surface.                  |

## Tools

| Tool                               | Purpose                                         |
| ---------------------------------- | ----------------------------------------------- |
| [rhino-cli](./rhino-cli/README.md) | Repository hygiene, validation, and automation. |
| [crane-cli](./crane-cli/README.md) | Deterministic PDF-to-Markdown processing.       |

## End-to-end tests

End-to-end projects keep browser and API behaviour separate from the application they exercise. Use the app README for prerequisites, then run the matching project's `test:e2e` target.

| Product or service          | Browser tests                                                    | API tests                                               |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| OSE public website          | [ose-www-fe-e2e](./ose-www-fe-e2e/)                              | [ose-www-be-e2e](./ose-www-be-e2e/)                     |
| OSE product                 | [ose-app-web-e2e](./ose-app-web-e2e/README.md)                   | [ose-be-e2e](./ose-be-e2e/README.md)                    |
| OSE learning management     | Not applicable; the service has no browser surface               | [ose-lms-be-e2e](./ose-lms-be-e2e/README.md)            |
| OSE identity platform       | [ose-id-web-e2e](./ose-id-web-e2e/README.md)                     | [ose-id-be-e2e](./ose-id-be-e2e/README.md)              |
| AyoKoding                   | [ayokoding-www-fe-e2e](./ayokoding-www-fe-e2e/)                  | [ayokoding-www-be-e2e](./ayokoding-www-be-e2e/)         |
| OrganicLever public website | [organiclever-www-fe-e2e](./organiclever-www-fe-e2e/README.md)   | Not applicable; the site has no backend public boundary |
| OrganicLever product        | [organiclever-app-web-e2e](./organiclever-app-web-e2e/README.md) | [organiclever-be-e2e](./organiclever-be-e2e/README.md)  |
| Roots                       | Not applicable; the service has no browser surface               | [roots-be-e2e](./roots-be-e2e/README.md)                |

## Work with an app

Run Nx targets from the workspace root. Replace `ose-www` with the project you chose above:

```bash
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev ose-www
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ose-www:test:quick
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- build ose-www
```

Each project declares its available targets in `project.json`. Use
`./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- show project <project-name>` to
inspect them, and follow the app README for app-specific setup.

## Structure and boundaries

Apps are independently runnable projects. They can use shared code from [`libs/`](../libs/README.md), but they do not import one another. App names make their role clear:

- `[domain]-www` is a public website.
- `[domain]-app-web` is a product web client.
- `[domain]-app` is an approved future-multiplatform product client (none in this workspace today).
- `[domain]-be` is a product backend.
- `*-e2e` is an end-to-end test project for a named surface.

For the workspace-wide structure and standard targets, see the [monorepo structure reference](../docs/reference/monorepo-structure.md) and [Nx targets reference](../repo-governance/development/infra/nx-targets.md). To create a new app, follow [Add a new app](../docs/how-to/add-new-app.md).
