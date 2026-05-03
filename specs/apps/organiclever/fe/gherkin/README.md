# OrganicLever Frontend Gherkin Specs

Gherkin feature files for the OrganicLever frontend application, organized by bounded
context. Each folder maps to one bounded context from the
[bounded-context map](../../../../../apps/organiclever-web/docs/explanation/bounded-context-map.md).

## Structure

```
specs/apps/organiclever/fe/gherkin/
├── app-shell/             # Navigation, accessibility, cross-cutting loggers
│   ├── accessibility.feature
│   ├── entry-loggers.feature
│   └── navigation.feature
├── health/                # Backend health diagnostic page
│   └── system-status-be.feature
├── journal/               # Journal events — today's entries, filtering
│   ├── home-screen.feature
│   └── journal-mechanism.feature
├── landing/               # Marketing landing page
│   └── landing.feature
├── routine/               # Workout routine management
│   └── routine-management.feature
├── routing/               # App routing and 404 guards
│   ├── app-routes.feature
│   └── disabled-routes.feature
├── settings/              # User preferences (dark mode, language)
│   ├── dark-mode.feature
│   ├── language.feature
│   └── settings-screen.feature
├── stats/                 # History and progress projections over journal events
│   ├── history-screen.feature
│   └── progress-screen.feature
└── workout-session/       # Active workout session FSM
    └── workout-session.feature
```

## Ubiquitous Language

Every domain term used in step text is defined in
[../../ubiquitous-language/](../../ubiquitous-language/README.md). Gherkin steps use only
glossary terms; code identifiers match the `Code identifier(s)` column verbatim.

## Conventions

- **File naming**: `[domain-capability].feature` (kebab-case)
- **Step language**: UI-semantic only — clicks, types, sees, navigates (no HTTP verbs or
  status codes)
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`
- **Term discipline**: Step text uses glossary terms only — not implementation identifiers
  or route segments

## Relationship to organiclever-be

These specs are the **frontend counterpart** to
[be/gherkin/](../../be/gherkin/README.md). The two trees cover different domains:

- **be**: HTTP-semantic (GET, POST, status codes, response bodies)
- **fe**: UI-semantic (clicks, types, sees, navigates, form submissions)

`apps/organiclever-web` consumes these specs via `@amiceli/vitest-cucumber` step
definitions in `apps/organiclever-web/test/unit/steps/`.

## Related

- **Ubiquitous language**: [ubiquitous-language/](../../ubiquitous-language/README.md)
- **Bounded-context map**: [bounded-context-map.md](../../../../../apps/organiclever-web/docs/explanation/bounded-context-map.md)
- **Backend counterpart**: [be gherkin specs](../../be/gherkin/README.md)
- **Parent**: [fe specs](../README.md)
