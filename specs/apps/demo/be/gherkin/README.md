# Demo Backend Gherkin Specs

Gherkin feature files for the demo-scale backend service. 13 files, 76 scenarios across 7
domains.

## Feature Files

| Domain           | File                                     | Scenarios |
| ---------------- | ---------------------------------------- | --------- |
| health           | `health/health-check.feature`            | 2         |
| authentication   | `authentication/password-login.feature`  | 5         |
| authentication   | `authentication/token-lifecycle.feature` | 7         |
| user-lifecycle   | `user-lifecycle/registration.feature`    | 6         |
| user-lifecycle   | `user-lifecycle/user-account.feature`    | 6         |
| security         | `security/security.feature`              | 5         |
| token-management | `token-management/tokens.feature`        | 6         |
| admin            | `admin/admin.feature`                    | 6         |
| expenses         | `expenses/expense-management.feature`    | 7         |
| expenses         | `expenses/currency-handling.feature`     | 6         |
| expenses         | `expenses/unit-handling.feature`         | 4         |
| expenses         | `expenses/reporting.feature`             | 6         |
| expenses         | `expenses/attachments.feature`           | 10        |

## Conventions

- **File naming**: `[domain-capability].feature` (kebab-case)
- **First Background step**: `Given the API is running`
- **Step language**: HTTP-semantic only — no framework or library names
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Related

- **Parent**: [demo-be specs](../README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
