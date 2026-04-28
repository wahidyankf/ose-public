# OrganicLever Frontend Gherkin Specs

Gherkin feature files for the OrganicLever frontend application. v0 covers the marketing
landing page, the system-status diagnostic page (polls BE health endpoint), accessibility
compliance, and `/login` + `/profile` 404 guards.

## Feature Files

| Domain  | File                              |
| ------- | --------------------------------- |
| landing | `landing/landing.feature`         |
| system  | `system/system-status-be.feature` |
| layout  | `layout/accessibility.feature`    |
| routing | `routing/disabled-routes.feature` |
| events  | `events/events-mechanism.feature` |

## Conventions

- **File naming**: `[domain-capability].feature` (kebab-case)
- **First Background step**: `Given the app is running`
- **Step language**: UI-semantic only — clicks, types, sees, navigates (no HTTP verbs or status codes)
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Relationship to organiclever-be

These specs are the **frontend counterpart** to
[be/gherkin/](../../be/gherkin/README.md). The two trees cover different domains in v0:

- **be**: HTTP-semantic (GET, POST, status codes, response bodies)
- **fe**: UI-semantic (clicks, types, sees, navigates, form submissions)

`apps/organiclever-web` consumes these specs, just as `apps/organiclever-be` consumes
`specs/apps/organiclever/be/gherkin/`. The system-status page is the only FE feature that
talks to the backend (it polls `/api/v1/health`).

## Related

- **Backend counterpart**: [be gherkin specs](../../be/gherkin/README.md)
- **Parent**: [fe specs](../README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
