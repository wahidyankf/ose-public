# Plan: Demo Frontend Apps

Six new frontend applications consuming the demo-be REST API, mirroring the multi-implementation
pattern established by the 11 `demo-be-*` backends. Five frontend frameworks + one centralized E2E
test suite.

**Status**: In Progress

## Goals

- Provide five functionally equivalent frontend implementations using Next.js, TanStack Start, React Router (Remix), Flutter Web, and Phoenix LiveView
- Consume the shared `specs/apps/demo/fe/gherkin/` Gherkin feature files (92 scenarios across
  15 feature files) for BDD unit tests
- Create a centralized Playwright E2E suite (`demo-fe-e2e`) mirroring the `demo-be-e2e` pattern
- Integrate all six apps into the Nx monorepo with standard target surfaces
- TypeScript frontends use React Query (TanStack Query v5) for server state management
- Flutter frontend uses Riverpod for state management and dio for HTTP
- LiveView frontend uses server-side state (socket assigns) and Req for HTTP
- Add dedicated GitHub Actions workflows and Docker Compose infra

## Apps

| App                        | Framework                   | Description                                    |
| -------------------------- | --------------------------- | ---------------------------------------------- |
| `demo-fe-ts-nextjs`        | Next.js 16 (App Router)     | React frontend with SSR, Turbopack             |
| `demo-fe-ts-tanstackstart` | TanStack Start (v1 RC)      | React frontend with type-safe routing, Vite    |
| `demo-fe-ts-remix`         | React Router v7 (framework) | React frontend with loaders/actions, Vite      |
| `demo-fe-dart-flutter`     | Flutter Web (Dart)          | Flutter frontend (web-first), Riverpod + dio   |
| `demo-fe-e2e`              | Playwright + playwright-bdd | Centralized E2E test suite for all FE variants |

## Naming

- `tsnx` = **T**ype**S**cript + **N**e**X**t.js
- `tsts` = **T**ype**S**cript + **T**anStack **S**tart
- `tsrm` = **T**ype**S**cript + **R**e**M**ix (React Router v7 framework mode)
- `dafl` = **Da**rt + **Fl**utter
- `exph` = **E**li**x**ir + **Ph**oenix (matching existing `demo-be-elixir-phoenix`)
- Matching the suffix pattern of `-jasb` (Java Spring Boot), `-tsex` (TypeScript Effect), etc.

## Testing Strategy (Two-Level)

| Level    | Nx Target   | Where                   | What                                        | Dependencies         |
| -------- | ----------- | ----------------------- | ------------------------------------------- | -------------------- |
| **Unit** | `test:unit` | Each `demo-fe-*` app    | Steps test component logic with mocked APIs | All mocked           |
| **E2E**  | `test:e2e`  | `demo-fe-e2e` (central) | Playwright drives real browser + real API   | Running FE + BE + DB |

**No integration level** — unit tests consume Gherkin specs directly; E2E covers real browser
interactions. Coverage is measured at the unit level (>=90% line coverage).

**E2E database strategy**: `demo-fe-e2e` does NOT access the backend database directly. Instead,
it uses test-only API endpoints (`POST /api/v1/test/reset-db`, `POST /api/v1/test/promote-admin`)
gated behind `ENABLE_TEST_API=true`. All other setup uses public APIs (register, login, etc.).

## Tech Stack — TypeScript Frontends (Next.js, TanStack Start, React Router)

| Concern          | Choice                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Language         | TypeScript (strict)                                                   |
| Runtime          | Node.js (managed by Volta, same version as workspace)                 |
| State management | React Query (TanStack Query v5)                                       |
| UI testing       | Vitest + @testing-library/react + @testing-library/user-event + jsdom |
| BDD (unit tests) | @amiceli/vitest-cucumber + React Testing Library step definitions     |
| Linting          | oxlint                                                                |
| Type checking    | `tsc --noEmit`                                                        |
| Formatting       | Prettier (already in workspace)                                       |
| Coverage         | Vitest with v8 coverage -> LCOV -> `rhino-cli test-coverage validate` |
| Package manager  | npm (workspace uses npm)                                              |

## Tech Stack — Flutter Frontend

| Concern          | Choice                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Language         | Dart 3.11.x                                                           |
| Framework        | Flutter 3.41.x (web-first, CanvasKit/Skwasm renderer)                 |
| State management | Riverpod 3.0                                                          |
| HTTP client      | dio                                                                   |
| UI testing       | flutter_test (widget tests)                                           |
| BDD (unit tests) | bdd_widget_test consuming `specs/apps/demo/fe/gherkin/`               |
| Linting          | dart analyze (analysis_options.yaml)                                  |
| Formatting       | dart format                                                           |
| Coverage         | flutter test --coverage -> LCOV -> `rhino-cli test-coverage validate` |
| Package manager  | pub (pubspec.yaml)                                                    |

## Tech Stack — Phoenix LiveView Frontend

| Concern          | Choice                                                           |
| ---------------- | ---------------------------------------------------------------- |
| Language         | Elixir 1.19+ / OTP 27                                            |
| Framework        | Phoenix 1.8.x + LiveView 1.1.x                                   |
| State management | Server-side socket assigns (LiveView processes)                  |
| HTTP client      | Req (calls demo-be API from server)                              |
| UI testing       | Phoenix.LiveViewTest (built-in)                                  |
| BDD (unit tests) | Cabbage consuming `specs/apps/demo/fe/gherkin/`                  |
| Linting          | mix credo                                                        |
| Formatting       | mix format                                                       |
| Coverage         | excoveralls --lcov -> LCOV -> `rhino-cli test-coverage validate` |
| Package manager  | mix (hex dependencies)                                           |

## E2E Tech Stack

| Concern | Choice                                                                 |
| ------- | ---------------------------------------------------------------------- |
| E2E     | Playwright + playwright-bdd v8 consuming `specs/apps/demo/fe/gherkin/` |

## FE Ports

| App                        | Dev Port |
| -------------------------- | -------- |
| `demo-fe-ts-nextjs`        | 3301     |
| `demo-fe-ts-tanstackstart` | 3301     |
| `demo-fe-ts-remix`         | 3301     |
| `demo-fe-dart-flutter`     | 3301     |

All five frontend apps use port 3301. They are mutually exclusive — only one runs at a time. This
is intentional: the E2E suite targets `http://localhost:3301` regardless of which implementation
is under test. All connect to `demo-be-java-springboot` running on port 8201.

## Gherkin Scenario Count

| Feature file               | Scenarios |
| -------------------------- | --------- |
| health-status.feature      | 2         |
| login.feature              | 5         |
| session.feature            | 7         |
| registration.feature       | 6         |
| user-profile.feature       | 6         |
| security.feature           | 5         |
| tokens.feature             | 6         |
| admin-panel.feature        | 6         |
| expense-management.feature | 7         |
| currency-handling.feature  | 6         |
| unit-handling.feature      | 4         |
| reporting.feature          | 6         |
| attachments.feature        | 10        |
| responsive.feature         | 10        |
| accessibility.feature      | 6         |
| **Total**                  | **92**    |

## Related Files

- `specs/apps/demo/fe/` — shared Gherkin specs (consumed, not modified)
- `specs/apps/demo/c4/` — shared C4 architecture diagrams
- `apps/demo-be-e2e/` — backend E2E reference pattern (mirrored by `demo-fe-e2e`)
- `apps/organiclever-web/` — existing Next.js reference in monorepo
- `apps/demo-be-elixir-phoenix/` — existing Elixir/Phoenix reference in monorepo
- `.github/workflows/main-ci.yml` — coverage upload steps

## Files to Create

| File/Directory                                             | Description                              |
| ---------------------------------------------------------- | ---------------------------------------- |
| `apps/demo-fe-ts-nextjs/`                                  | Next.js 16 App Router frontend           |
| `apps/demo-fe-ts-tanstackstart/`                           | TanStack Start frontend                  |
| `apps/demo-fe-ts-remix/`                                   | React Router v7 frontend (Remix)         |
| `apps/demo-fe-dart-flutter/`                               | Flutter Web frontend (Dart)              |
| `apps/demo-fe-e2e/`                                        | Centralized Playwright E2E suite         |
| `specs/apps/demo/be/gherkin/test-support/test-api.feature` | Gherkin spec for test-only API endpoints |
| `infra/dev/demo-fe-ts-nextjs/`                             | Docker Compose dev infra (FE + BE + DB)  |
| `infra/dev/demo-fe-ts-tanstackstart/`                      | Docker Compose dev infra (FE + BE + DB)  |
| `infra/dev/demo-fe-ts-remix/`                              | Docker Compose dev infra (FE + BE + DB)  |
| `infra/dev/demo-fe-dart-flutter/`                          | Docker Compose dev infra (FE + BE + DB)  |
| `.github/workflows/e2e-demo-fe-ts-nextjs.yml`              | E2E CI workflow                          |
| `.github/workflows/e2e-demo-fe-ts-tanstackstart.yml`       | E2E CI workflow                          |
| `.github/workflows/e2e-demo-fe-ts-remix.yml`               | E2E CI workflow                          |
| `.github/workflows/e2e-demo-fe-dart-flutter.yml`           | E2E CI workflow                          |

## Files to Update

| File                                                             | Change                                                                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                      | Add demo-fe apps to Current Apps list, add coverage notes                                           |
| `README.md`                                                      | Add demo-fe apps to project listing and Demo Apps badge table                                       |
| `specs/apps/demo/fe/README.md`                                   | Add all five implementation rows to Implementations table                                           |
| `specs/apps/demo/be/README.md`                                   | Document test-support domain in feature list                                                        |
| `apps/demo-be-java-springboot/`                                  | Add test-only API controller (reset-db, promote-admin) gated behind `ENABLE_TEST_API`               |
| `.github/workflows/main-ci.yml`                                  | Add coverage upload steps for all five frontends                                                    |
| `governance/development/quality/three-level-testing-standard.md` | Add "Demo-fe frontend" row to Applicability table: unit + E2E only (no integration), >=90% coverage |
| `governance/development/infra/nx-targets.md`                     | Add demo-fe target definitions (no `test:integration` target)                                       |

## Git Workflow

Trunk Based Development — all work on `main` branch. No feature branch needed.

## See Also

- [requirements.md](./requirements.md) — acceptance criteria
- [tech-docs.md](./tech-docs.md) — technical design
- [delivery.md](./delivery.md) — delivery checklist
