# organiclever-be Specs

Gherkin acceptance specifications for the
[OrganicLever backend API](../../apps/organiclever-be/README.md).

## What This Covers

These specs define the behavior of the OrganicLever REST API from the perspective of its consumers
— what endpoints accept, what they return, and what business rules they enforce. Step definitions
live in `apps/organiclever-be/src/test/java/`.

## BDD Framework

| Concern                   | Choice                                |
| ------------------------- | ------------------------------------- |
| Language                  | Java 25                               |
| BDD framework             | Cucumber JVM 7+                       |
| Test runner               | JUnit 5                               |
| Step definitions location | `apps/organiclever-be/src/test/java/` |

**See**: [BDD Standards](../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
for required framework setup and coverage rules.

## Feature File Organization

Organize feature files by domain capability (bounded context):

```
specs/organiclever-be/
├── hello/
│   └── hello-endpoint.feature
└── [future-context]/
    └── [domain-capability].feature
```

**File naming**: `[domain-capability].feature` (kebab-case)

## Running Specs

Once Cucumber JVM is configured in `apps/organiclever-be/`:

```bash
# From repository root (via Nx)
nx run organiclever-be:test:acceptance

# Directly via Maven
cd apps/organiclever-be
mvn test -Dcucumber.filter.tags="@acceptance"
```

## Adding a Feature File

1. Identify the bounded context (e.g., `hello`, `task-management`)
2. Create the folder if it does not exist: `specs/organiclever-be/[context]/`
3. Create the `.feature` file: `[domain-capability].feature`
4. Write scenarios following
   [Gherkin Standards](../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/ex-soen-de-bedrdebd__gherkin-standards.md)
5. Implement step definitions in `apps/organiclever-be/src/test/java/`

## Related

- **App**: [apps/organiclever-be/](../../apps/organiclever-be/README.md) — Spring Boot implementation
- **BDD Standards**: [behavior-driven-development-bdd/](../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
- **E2E Tests**: [apps/organiclever-be-e2e/](../../apps/organiclever-be-e2e/README.md) — Playwright
  API tests
