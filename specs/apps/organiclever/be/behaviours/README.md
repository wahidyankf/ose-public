# OrganicLever Backend Gherkin Specs

Gherkin feature files for the OrganicLever backend service. 6 files, 20 scenarios across 4
domains.

## Feature Files

| Domain    | File                                    | Scenarios |
| --------- | --------------------------------------- | --------- |
| health    | `health/health-check.feature`           | 2         |
| journal   | `journal/journal-crud.feature`          | 11        |
| db        | `db/migrations.feature`                 | 3         |
| messaging | `messaging/nats-config.feature`         | 1         |
| messaging | `messaging/live/nats-connect.feature`   | 2         |
| messaging | `messaging/live/jetstream-demo.feature` | 1         |

## Conventions

- **File naming**: `[domain-capability].feature` (kebab-case)
- **First Background step**: `Given the API is running`
- **Step language**: HTTP-semantic only — no framework or library names
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Related

- **Parent**: [components/be/ specs](../architecture.md)
- **BDD Standards**: [behaviour-driven-development-bdd/](../../../../../docs/explanation/software-engineering/development/behaviour-driven-development-bdd/README.md)

- [db](./db/README.md) — organiclever-be Gherkin Domain
- [health](./health/README.md) — organiclever-be Gherkin Domain
- [journal](./journal/README.md) — organiclever-be Gherkin Domain
- [messaging](./messaging/README.md) — organiclever-be Gherkin Domain
