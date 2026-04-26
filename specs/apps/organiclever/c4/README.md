# OrganicLever C4 Diagrams

C4 architecture diagrams for the OrganicLever fullstack application (frontend + backend).

## Diagrams

| Level     | File              | What It Shows                                             |
| --------- | ----------------- | --------------------------------------------------------- |
| Context   | `context.md`      | The system and its two external actors                    |
| Container | `container.md`    | Runtime containers: Next.js frontend, F#/Giraffe backend  |
| Component | `component-be.md` | F#/Giraffe REST API internals: health handler             |
| Component | `component-fe.md` | Next.js frontend internals: landing + system-status pages |

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

| Domain | Feature                       | Scenarios |
| ------ | ----------------------------- | --------- |
| health | `health/health-check.feature` | 2         |

### Frontend Gherkin

**Location**: [`specs/apps/organiclever/fe/gherkin/`](../fe/gherkin/README.md)

| Domain  | Feature                           | Scenarios |
| ------- | --------------------------------- | --------- |
| landing | `landing/landing.feature`         | varies    |
| system  | `system/system-status-be.feature` | varies    |
| layout  | `layout/accessibility.feature`    | varies    |
| routing | `routing/disabled-routes.feature` | varies    |

## Related

- **Parent**: [organiclever specs](../README.md)
- **Backend gherkin specs**: [be/gherkin/](../be/gherkin/README.md)
- **Frontend gherkin specs**: [fe/gherkin/](../fe/gherkin/README.md)
