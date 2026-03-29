# OrganicLever C4 Diagrams

C4 architecture diagrams for the OrganicLever fullstack application (frontend + backend).

## Diagrams

| Level     | File              | What It Shows                                                                     |
| --------- | ----------------- | --------------------------------------------------------------------------------- |
| Context   | `context.md`      | The system and its two external actors                                            |
| Container | `container.md`    | Runtime containers: Next.js frontend, F#/Giraffe backend, PostgreSQL database     |
| Component | `component-be.md` | F#/Giraffe REST API internals: handlers, middleware, services, repositories       |
| Component | `component-fe.md` | Next.js frontend internals: pages, API route handlers, Effect TS services, layers |

## C4 Level Summary

- **Context** — answers: who uses the system and how?
- **Container** — answers: what processes run and what data stores exist?
- **Component (BE)** — answers: what are the logical building blocks inside the REST API?
- **Component (FE)** — answers: what are the logical building blocks inside the Next.js app?

## Gherkin Specifications

All implementations consume shared Gherkin feature files. Backend and frontend
have separate spec trees with different domain coverage.

### Backend Gherkin

**Location**: [`specs/apps/organiclever/be/gherkin/`](../be/gherkin/README.md)

| Domain         | Feature                               | Scenarios |
| -------------- | ------------------------------------- | --------- |
| health         | `health/health-check.feature`         | 2         |
| authentication | `authentication/google-login.feature` | 6         |
| authentication | `authentication/me.feature`           | 3         |

### Frontend Gherkin

**Location**: [`specs/apps/organiclever/fe/gherkin/`](../fe/gherkin/README.md)

| Domain         | Feature                                   | Scenarios |
| -------------- | ----------------------------------------- | --------- |
| authentication | `authentication/google-login.feature`     | 2         |
| authentication | `authentication/profile.feature`          | 2         |
| authentication | `authentication/route-protection.feature` | 4         |
| layout         | `layout/accessibility.feature`            | 5         |

## Related

- **Parent**: [organiclever specs](../README.md)
- **Backend gherkin specs**: [be/gherkin/](../be/gherkin/README.md)
- **Frontend gherkin specs**: [fe/gherkin/](../fe/gherkin/README.md)
