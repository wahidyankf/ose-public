# oseplatform-cli Gherkin Specs

Gherkin feature files for [oseplatform-cli](../../../../apps/oseplatform-cli/README.md) — the
CLI tool for oseplatform-web Hugo site maintenance. 1 file, 4 scenarios.

## Feature Files

| File                  | Command(s)    | Scenarios |
| --------------------- | ------------- | --------- |
| `links-check.feature` | `links check` | 4         |

## Conventions

- **File naming**: `[domain]-[action].feature` (kebab-case, domain-prefixed)
- **Step language**: CLI-semantic only — no framework or library names
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Related

- **Parent**: [oseplatform-cli specs](../../README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
