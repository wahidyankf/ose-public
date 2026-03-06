# organiclever-be Specs

Gherkin acceptance specifications for the
[OrganicLever backend API](../../apps/organiclever-be/README.md).

## What This Covers

These specs define the behavior of the OrganicLever REST API from the perspective of its consumers
— what endpoints accept, what they return, and what business rules they enforce. The same Gherkin
feature files are executed by two runners at different test tiers.

## BDD Framework

| Tier                  | Language   | Framework         | Step definitions location                                   |
| --------------------- | ---------- | ----------------- | ----------------------------------------------------------- |
| E2E (real service)    | TypeScript | playwright-bdd 8+ | `apps/organiclever-be-e2e/tests/steps/`                     |
| Integration (MockMvc) | Java       | Cucumber JVM 7+   | `apps/organiclever-be/src/test/java/.../integration/steps/` |

**See**: [BDD Standards](../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
for required framework setup and coverage rules.

## Feature File Organization

Organize feature files by domain capability (bounded context):

```
specs/apps/organiclever-be/
├── hello/
│   └── hello-endpoint.feature
└── [future-context]/
    └── [domain-capability].feature
```

**File naming**: `[domain-capability].feature` (kebab-case)

## Running Specs

```bash
# Generate spec files from feature files, then run
nx run organiclever-be-e2e:test:e2e

# Directly (from apps/organiclever-be-e2e/)
npx bddgen && npx playwright test
```

## Adding a Feature File

1. Identify the bounded context (e.g., `hello`, `task-management`)
2. Create the folder if it does not exist: `specs/apps/organiclever-be/[context]/`
3. Create the `.feature` file: `[domain-capability].feature`
4. Write scenarios following
   [Gherkin Standards](../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/ex-soen-de-bedrdebd__gherkin-standards.md)
5. Implement step definitions in both runners:
   - TypeScript: `apps/organiclever-be-e2e/tests/steps/` (E2E / playwright-bdd)
   - Java: `apps/organiclever-be/src/test/java/.../integration/steps/` (MockMvc / Cucumber JVM)

## Related

- **App**: [apps/organiclever-be/](../../apps/organiclever-be/README.md) — Spring Boot implementation
- **E2E Test Suite**: [apps/organiclever-be-e2e/](../../apps/organiclever-be-e2e/README.md) — playwright-bdd test runner
- **BDD Standards**: [behavior-driven-development-bdd/](../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
- **playwright-bdd Integration**: [Playwright BDD Integration](../../docs/explanation/software-engineering/automation-testing/tools/playwright/ex-soen-aute-to-pl__bdd.md)
