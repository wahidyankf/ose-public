# OrganicLever Backend API Specs

Platform-agnostic Gherkin acceptance specifications for the OrganicLever backend service covering
service health and Google OAuth authentication with JWT token management.

## What This Covers

| Domain         | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| health         | Service liveness check                                        |
| authentication | Google OAuth login, refresh token rotation, protected profile |

## Three-Level Spec Consumption

Every backend consumes these Gherkin scenarios at **three test levels**. The feature files are
the shared contract — only the step implementations differ per level.

| Level           | Nx Target          | What Happens                                                     | Dependencies             |
| --------------- | ------------------ | ---------------------------------------------------------------- | ------------------------ |
| **Unit**        | `test:unit`        | Steps call service/repository functions with mocked dependencies | All mocked               |
| **Integration** | `test:integration` | Steps call service/repository functions with real PostgreSQL     | Real PostgreSQL (Docker) |
| **E2E**         | `test:e2e`         | Playwright makes HTTP requests to running backend                | Full running server      |

### Unit Level

- Steps instantiate services directly with mocked/in-memory repositories
- No framework context (no HTTP server)
- Coverage is measured here (>=90% line coverage via `rhino-cli test-coverage validate`)

### Integration Level

- Each backend has `docker-compose.integration.yml` (PostgreSQL + test runner) and
  `Dockerfile.integration` (language runtime)
- Steps call the same service/repository functions but with real PostgreSQL connections
- Migrations run against a fresh database each time
- No HTTP layer — tests call application code directly
- Coverage is NOT measured at this level

### E2E Level

- Tests make real HTTP requests to a running backend
- Runs against the full stack including the frontend

## Implementations

| Implementation  | Language | Unit Test Framework | Integration Framework | E2E runner |
| --------------- | -------- | ------------------- | --------------------- | ---------- |
| organiclever-be | F#       | TickSpec + mocks    | TickSpec + Npgsql/PG  | Playwright |

## Spec Artifacts

This spec is organized into two subdirectories:

- **[gherkin/](./gherkin/README.md)** — Gherkin feature files covering all domains
- **[c4/](../c4/README.md)** — C4 architecture diagrams for the OrganicLever application

## Feature File Organization

```
specs/apps/organiclever/be/
├── README.md
└── gherkin/
    ├── README.md
    ├── health/
    │   └── health-check.feature          (2 scenarios)
    └── authentication/
        ├── google-login.feature          (6 scenarios)
        └── me.feature                    (3 scenarios)
```

**File naming**: `[domain-capability].feature` (kebab-case)

## Running Specs

```bash
# Unit tests (mocked dependencies, coverage measured here)
nx run organiclever-be:test:unit

# Integration tests (real PostgreSQL via docker-compose)
nx run organiclever-be:test:integration

# Fast quality gate (unit + coverage check)
nx run organiclever-be:test:quick
```

## Nx Cache Inputs

Gherkin spec paths are explicit Nx cache inputs for `test:unit` and `test:quick`.
This ensures that modifying any `.feature` file triggers a cache miss and re-runs
the affected test targets automatically.

The canonical input pattern used in `project.json`:

```
"{workspaceRoot}/specs/apps/organiclever/be/gherkin/**/*.feature"
```

`test:integration` has `cache: false` and does not need explicit spec inputs.

## Adding a Feature File

1. Identify the bounded context (e.g., `authentication`, `health`)
2. Create the folder if it does not exist: `specs/apps/organiclever/be/gherkin/[context]/`
3. Create the `.feature` file: `[domain-capability].feature`
4. Open with `Feature:` then a user story block (`As a … / I want … / So that …`)
5. Use `Given the API is running` as the first Background step
6. Use only HTTP-semantic steps — no framework or library names

## Related

- **Parent**: [organiclever specs](../README.md)
- **Frontend counterpart**: [fe/](../fe/README.md) — UI-semantic frontend specs
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
