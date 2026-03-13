# Demo Frontend Gherkin Specs

Gherkin feature files for the demo-scale frontend application. 13 files, 76 scenarios across 7
domains.

## Feature Files

| Domain           | File                                  | Scenarios |
| ---------------- | ------------------------------------- | --------- |
| health           | `health/health-status.feature`        | 2         |
| authentication   | `authentication/login.feature`        | 5         |
| authentication   | `authentication/session.feature`      | 7         |
| user-lifecycle   | `user-lifecycle/registration.feature` | 6         |
| user-lifecycle   | `user-lifecycle/user-profile.feature` | 6         |
| security         | `security/security.feature`           | 5         |
| token-management | `token-management/tokens.feature`     | 6         |
| admin            | `admin/admin-panel.feature`           | 6         |
| expenses         | `expenses/expense-management.feature` | 7         |
| expenses         | `expenses/currency-handling.feature`  | 6         |
| expenses         | `expenses/unit-handling.feature`      | 4         |
| expenses         | `expenses/reporting.feature`          | 6         |
| expenses         | `expenses/attachments.feature`        | 10        |

## Conventions

- **File naming**: `[domain-capability].feature` (kebab-case)
- **First Background step**: `Given the app is running`
- **Step language**: UI-semantic only — clicks, types, sees, navigates (no HTTP verbs or status codes)
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Relationship to demo-be

These specs are the **frontend counterpart** to
[specs/apps/demo-be/gherkin/](../../demo-be/gherkin/README.md). Both cover the same 7 domains with
76 scenarios each, but:

- **demo-be**: HTTP-semantic (GET, POST, status codes, response bodies)
- **demo-fe**: UI-semantic (clicks, types, sees, navigates, form submissions)

Each `apps/demo-fe-{framework}/` (e.g., `demo-fe-react-nextjs`) consumes these specs, just as
`apps/demo-be-{lang}-{framework}/` consumes `specs/apps/demo-be/gherkin/`. Step definitions
translate UI actions into component renders and API call verifications.

## Related

- **Backend counterpart**: [demo-be gherkin specs](../../demo-be/gherkin/README.md)
- **Parent**: [demo-fe specs](../README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
