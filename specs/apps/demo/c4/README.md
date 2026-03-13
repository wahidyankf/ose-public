# Demo Application C4 Diagrams

C4 architecture diagrams for the unified demo application (frontend + backend).

## Diagrams

| Level     | File              | What It Shows                                                                 |
| --------- | ----------------- | ----------------------------------------------------------------------------- |
| Context   | `context.md`      | The system and its four external actors                                       |
| Container | `container.md`    | Runtime containers: SPA, Static Server, REST API, Database, File Storage      |
| Component | `component-be.md` | REST API internals: handlers, middleware, services, repositories              |
| Component | `component-fe.md` | SPA internals: pages, shared components, state management, API client, guards |

## C4 Level Summary

- **Context** — answers: who uses the system and how?
- **Container** — answers: what processes run and what data stores exist?
- **Component (BE)** — answers: what are the logical building blocks inside the REST API?
- **Component (FE)** — answers: what are the logical building blocks inside the SPA?

## Related

- **Parent**: [demo specs](../README.md)
- **Backend gherkin specs**: [be/gherkin/](../be/gherkin/README.md)
- **Frontend gherkin specs**: [fe/gherkin/](../fe/gherkin/README.md)
