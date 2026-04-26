# OrganicLever Backend Gherkin Specs

Gherkin feature files for the OrganicLever backend service. 1 file, 2 scenarios across 1
domain.

## Feature Files

| Domain | File                          | Scenarios |
| ------ | ----------------------------- | --------- |
| health | `health/health-check.feature` | 2         |

## Conventions

- **File naming**: `[domain-capability].feature` (kebab-case)
- **First Background step**: `Given the API is running`
- **Step language**: HTTP-semantic only — no framework or library names
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Related

- **Parent**: [organiclever-be specs](../README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
