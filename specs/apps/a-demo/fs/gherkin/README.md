# Demo Fullstack Gherkin Specs

Gherkin feature files for the demo-scale fullstack application (`a-demo-fs-{lang}-{framework}`).
Fullstack apps combine backend and frontend in a single deployable unit and consume **both** the
[backend specs](../../be/gherkin/README.md) and [frontend specs](../../fe/gherkin/README.md).

## Feature Files

No fullstack-specific feature files yet. Fullstack apps consume the shared BE and FE spec sets
directly — see the table below.

## Spec Consumption

| Spec Set            | Path                   | Purpose                               |
| ------------------- | ---------------------- | ------------------------------------- |
| Backend (BE) specs  | `../../../be/gherkin/` | HTTP-semantic API scenarios           |
| Frontend (FE) specs | `../../../fe/gherkin/` | UI-semantic browser interaction specs |

Fullstack-specific scenarios (e.g., server-side rendering behavior, route handler edge cases) can
be added here when they cannot be expressed through the shared BE or FE specs.

## Conventions

- **File naming**: `[domain]-[capability].feature` (kebab-case)
- **Background step**: `Given the app is running`
- **Step language**: HTTP-semantic or UI-semantic depending on the layer under test
- **User story block**: Every `Feature:` block opens with `As a … / I want … / So that …`

## Related

- **Parent**: [a-demo fs specs](../README.md)
- **BE Gherkin**: [be/gherkin/](../../be/gherkin/README.md)
- **FE Gherkin**: [fe/gherkin/](../../fe/gherkin/README.md)
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
