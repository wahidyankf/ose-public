# Demo Fullstack Specs

Behavioral specifications for the demo-scale fullstack application
(`apps/a-demo-fs-{lang}-{framework}`). Fullstack apps combine backend and frontend in a single
deployable unit and consume **both** the backend and frontend Gherkin spec sets.

## Structure

```
specs/apps/a-demo/fs/
├── README.md    # This file
└── gherkin/     # Fullstack-specific Gherkin scenarios (see gherkin/README)
```

## Spec Inheritance

Fullstack apps reuse the shared BE and FE specs in addition to any fullstack-specific scenarios:

| Spec Set                | Location                                    |
| ----------------------- | ------------------------------------------- |
| Backend (HTTP-semantic) | [`../be/gherkin/`](../be/gherkin/README.md) |
| Frontend (UI-semantic)  | [`../fe/gherkin/`](../fe/gherkin/README.md) |
| Fullstack-specific      | [`gherkin/`](./gherkin/README.md)           |

## Related

- **Parent**: [a-demo specs](../README.md)
- **BE specs**: [be/](../be/README.md)
- **FE specs**: [fe/](../fe/README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
