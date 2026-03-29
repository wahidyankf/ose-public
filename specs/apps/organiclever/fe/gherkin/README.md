# OrganicLever Frontend Gherkin Specs

Gherkin feature files for the OrganicLever frontend application. 4 files, 13 scenarios across 2
domains.

## Feature Files

| Domain         | File                                      | Scenarios |
| -------------- | ----------------------------------------- | --------- |
| authentication | `authentication/google-login.feature`     | 2         |
| authentication | `authentication/profile.feature`          | 2         |
| authentication | `authentication/route-protection.feature` | 4         |
| layout         | `layout/accessibility.feature`            | 5         |

## Conventions

- **File naming**: `[domain-capability].feature` (kebab-case)
- **First Background step**: `Given the app is running`
- **Step language**: UI-semantic only — clicks, types, sees, navigates (no HTTP verbs or status codes)
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Relationship to organiclever-be

These specs are the **frontend counterpart** to
[be/gherkin/](../../be/gherkin/README.md). Both cover the same shared domains (FE adds `layout/`),
but:

- **be**: HTTP-semantic (GET, POST, status codes, response bodies)
- **fe**: UI-semantic (clicks, types, sees, navigates, form submissions)

`apps/organiclever-fe` consumes these specs, just as `apps/organiclever-be` consumes
`specs/apps/organiclever/be/gherkin/`. Step definitions translate UI actions into component
renders and API call verifications.

## Related

- **Backend counterpart**: [be gherkin specs](../../be/gherkin/README.md)
- **Parent**: [fe specs](../README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
