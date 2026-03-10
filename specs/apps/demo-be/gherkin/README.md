# Demo IAM Gherkin Specs

Gherkin feature files for the demo-scale IAM service. 10 files, ~55 scenarios across 7 domains.

## Feature Files

| Domain           | File                                     | Scenarios |
| ---------------- | ---------------------------------------- | --------- |
| health           | `health/health-check.feature`            | 2         |
| authentication   | `authentication/password-login.feature`  | 5         |
| authentication   | `authentication/token-lifecycle.feature` | 7         |
| user-lifecycle   | `user-lifecycle/registration.feature`    | 6         |
| user-lifecycle   | `user-lifecycle/user-account.feature`    | 6         |
| authorization    | `authorization/roles.feature`            | 6         |
| authorization    | `authorization/permissions.feature`      | 5         |
| security         | `security/security.feature`              | 5         |
| token-management | `token-management/tokens.feature`        | 6         |
| admin            | `admin/admin.feature`                    | 7         |

## Conventions

- **File naming**: `[domain-capability].feature` (kebab-case)
- **First Background step**: `Given the IAM API is running`
- **Step language**: HTTP-semantic only — no framework or library names
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Related

- **Parent**: [demo-be specs](../README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
