# OrganicLever API Specs

Gherkin acceptance specifications for the OrganicLever REST API.

## What This Covers

These specs define the behavior of the OrganicLever REST API from the perspective of its consumers
— what endpoints accept, what they return, and what business rules they enforce. The same Gherkin
feature files are consumed by step-definition runners in each language implementation.

## Implementations

| Implementation  | Language | Integration runner     | E2E runner                              |
| --------------- | -------- | ---------------------- | --------------------------------------- |
| organiclever-be | Java     | Cucumber JVM (MockMvc) | playwright-bdd (`organiclever-be-e2e/`) |

Each new language implementation adds its own step definitions. The feature files here are the
single source of truth and must not contain language-specific concepts (framework names, library
paths, runtime-specific error formats).

**See**: [BDD Standards](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
for required framework setup and coverage rules.

## Feature File Organization

Organize feature files by domain capability (bounded context):

```
specs/apps/organiclever-be/
├── auth/
│   ├── register.feature
│   ├── login.feature
│   └── jwt-protection.feature
├── hello/
│   └── hello-endpoint.feature
└── health/
    └── health-check.feature
```

**File naming**: `[domain-capability].feature` (kebab-case)

## Running Specs

```bash
# E2E runner (real service, TypeScript/playwright-bdd)
nx run organiclever-be-e2e:test:e2e

# Integration runner (in-process, Java/Cucumber JVM)
cd apps/organiclever-be && mvn test -Pintegration
```

## Adding a Feature File

1. Identify the bounded context (e.g., `hello`, `task-management`)
2. Create the folder if it does not exist: `specs/apps/organiclever-be/[context]/`
3. Create the `.feature` file: `[domain-capability].feature`
4. Write scenarios following
   [Gherkin Standards](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/ex-soen-de-bedrdebd__gherkin-standards.md)
5. Implement step definitions in each runner for this repository:
   - TypeScript: `apps/organiclever-be-e2e/tests/steps/` (E2E / playwright-bdd)
   - Java: `apps/organiclever-be/src/test/java/.../integration/steps/` (MockMvc / Cucumber JVM)

## Related

- **App**: [apps/organiclever-be/](../../../apps/organiclever-be/README.md) — Spring Boot implementation
- **E2E Test Suite**: [apps/organiclever-be-e2e/](../../../apps/organiclever-be-e2e/README.md) — playwright-bdd test runner
- **BDD Standards**: [behavior-driven-development-bdd/](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
- **playwright-bdd Integration**: [Playwright BDD Integration](../../../docs/explanation/software-engineering/automation-testing/tools/playwright/ex-soen-aute-to-pl__bdd.md)
