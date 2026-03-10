# Demo Backend C4 Diagrams

C4 architecture diagrams for the demo backend service.

## Diagrams

| Level     | File           | What It Shows                                                                    |
| --------- | -------------- | -------------------------------------------------------------------------------- |
| Context   | `context.md`   | The system and its four external actors                                          |
| Container | `container.md` | Runtime containers: REST API, Database, File Storage                             |
| Component | `component.md` | Internal structure of the REST API: handlers, services, repositories, middleware |

## C4 Level Summary

- **Context** — answers: who uses the system and how?
- **Container** — answers: what processes run and what data stores exist?
- **Component** — answers: what are the logical building blocks inside the REST API?

## Related

- **Parent**: [demo-be specs](../README.md)
- **Gherkin specs**: [gherkin/](../gherkin/README.md)
