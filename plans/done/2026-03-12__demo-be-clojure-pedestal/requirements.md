# Requirements: demo-be-clojure-pedestal

## Acceptance Criteria

### Functional Parity

- All 76 Gherkin scenarios from `specs/apps/demo/be/gherkin/` pass via kaocha-cucumber
  integration tests (in-memory SQLite, no external services)
- All `demo-be-e2e` Playwright E2E tests pass against the Dockerized backend (PostgreSQL)
- API responses match the same JSON structure and HTTP status codes as existing implementations

### Quality Gates

- `test:quick` passes: unit + integration + cloverage LCOV + rhino-cli ≥90% + clj-kondo lint
- `test:unit` passes independently
- `test:integration` passes independently and is cacheable (`cache: true`)
- `lint` passes (clj-kondo with zero errors)
- `build` produces a runnable uberjar

### Infrastructure

- Docker Compose dev infra follows the established pattern (PostgreSQL 17, port 8201)
- E2E GitHub Actions workflow runs on schedule (6 AM / 6 PM WIB)
- Main CI includes Clojure setup and coverage upload to Codecov

### Documentation

- App README documents tech stack, local development, Nx targets
- Plan README, requirements, tech-docs, delivery checklist complete
- All cross-references updated (CLAUDE.md, root README, specs README, codecov.yml)
