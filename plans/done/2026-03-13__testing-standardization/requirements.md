# Requirements: Testing Standardization

## Acceptance Criteria

```gherkin
Feature: Testing Standardization

  # === Demo-be Backend Tests ===

  Scenario: Demo-be unit tests consume Gherkin specs with mocked dependencies
    Given a demo-be backend with unit tests configured
    When the unit test suite runs
    Then all 76 Gherkin scenarios from specs/apps/demo/be/gherkin/ execute
    And all dependencies (database, HTTP, external APIs) are mocked
    And no real database connections are created
    And no HTTP requests are made
    And application code is called directly (not through HTTP)

  Scenario: Demo-be integration tests use real PostgreSQL via docker-compose
    Given a demo-be backend with integration tests configured
    When the integration test suite runs
    Then docker-compose starts a fresh PostgreSQL container
    And a test runner container starts after PostgreSQL is healthy
    And all migrations are executed against the fresh database
    And seed files are executed if present
    And all 76 Gherkin scenarios from specs/apps/demo/be/gherkin/ execute
    And no HTTP requests are made
    And no external API calls are made
    And application code is called directly (not through HTTP)
    And docker-compose tears down all containers and volumes after tests

  Scenario: Demo-be E2E tests use Playwright with no restrictions
    Given the demo-be-e2e project
    When the E2E test suite runs against a backend
    Then all 76 Gherkin scenarios from specs/apps/demo/be/gherkin/ execute
    And Playwright makes real HTTP requests to the running backend
    And no infrastructure restrictions are enforced

  Scenario: All three test levels pass for each demo-be backend
    Given a demo-be backend with all test levels implemented
    When test:unit runs
    Then all scenarios pass with mocked dependencies
    When test:integration runs
    Then all scenarios pass with real PostgreSQL database
    When test:e2e runs against the backend
    Then all scenarios pass via Playwright HTTP calls

  # === Non-Demo-be Projects ===

  Scenario: organiclever-web tests pass at unit and integration levels
    Given the organiclever-web project
    When test:quick runs
    Then unit tests pass via Vitest (without MSW)
    And coverage >= 90% from unit tests alone
    When test:integration runs
    Then integration tests pass via Vitest + MSW

  Scenario: Go CLI apps pass unit and integration tests (Rule 1+2)
    Given a Go CLI app project
    When test:quick runs
    Then unit tests pass via Go testing
    And coverage >= 90%
    When test:integration runs
    Then BDD scenarios pass via Godog

  Scenario: Libraries pass unit tests (Rule 1 only)
    Given a library project
    When test:quick runs
    Then unit tests pass
    And coverage >= 90%
    And integration tests are not required

  Scenario: Hugo static sites pass link validation
    Given a Hugo static site project
    When test:quick runs
    Then link validation passes

  # === test:quick (Local Quality Gate) ===

  Scenario: test:quick includes unit tests and coverage only
    Given any project with test:quick configured (not Hugo sites)
    When test:quick runs
    Then test:unit passes with all scenarios
    And line coverage is >= 90% via rhino-cli test-coverage validate (from unit tests alone)
    And specs coverage check passes (where applicable)
    And lint is NOT run (separate target)
    And typecheck is NOT run (separate target)
    And test:integration is NOT run
    And test:e2e is NOT run

  # === CI Schedules ===

  Scenario: Integration tests run 4 times daily via CI
    Given the CI integration schedule
    Then test:integration runs at WIB 04:00, 10:00, 16:00, 22:00
    And it covers all apps that have test:integration
    And each run uses fresh docker-compose containers (demo-be backends)

  Scenario: E2E tests run 2 times daily via CI
    Given the CI E2E schedule
    Then test:e2e runs at WIB 06:00 and 18:00
    And it covers all web apps (API backends + web UIs)
    And each run uses Playwright against running services

  # === Cross-Cutting ===

  Scenario: Only test:unit is cacheable
    Given any project with no code or spec changes
    When test:unit runs a second time
    Then Nx serves the result from cache
    When test:integration runs a second time
    Then Nx does NOT serve from cache (always re-runs)
    When test:e2e runs a second time
    Then Nx does NOT serve from cache (always re-runs)

  Scenario: Every project has mandatory Nx targets derived from three rules
    Given the three rules and mandatory targets table
    Then each API backend has test:unit, test:integration, test:quick, lint, build (Rule 1+2+3)
    And each web UI app has test:unit, test:integration, test:quick, lint, build (Rule 1+2+3)
    And each CLI app has test:unit, test:integration, test:quick, lint, build (Rule 1+2)
    And each library has test:unit, test:quick, lint (Rule 1 only)
    And each Hugo site has test:quick, build (exempt from rules)
    And each E2E runner has test:e2e, test:quick, lint

  Scenario: CI runs correct checks for direct push to main
    Given code is pushed directly to main
    Then main-ci.yml runs test:quick for all projects
    And coverage is uploaded to Codecov from unit test output
    And lint and typecheck are NOT run by main-ci.yml

  Scenario: CI runs correct checks for PR workflow
    Given a PR is opened or updated
    Then pr-quality-gate.yml runs typecheck for affected projects
    And pr-quality-gate.yml runs lint for affected projects
    And pr-quality-gate.yml runs test:quick for affected projects
    When the PR is merged to main
    Then main-ci.yml runs test:quick for all projects

  Scenario: Documentation reflects new standard
    Given the testing standardization is complete
    Then CLAUDE.md describes the three-level testing standard for all project types
    And nx-targets.md defines mandatory targets per project type and CI schedules
    And bdd-spec-test-mapping.md covers demo-be backends
    And specs/apps/demo/be/README.md documents three-level consumption
    And each demo-be backend README describes its test architecture
    And each demo-be project.json has correct test targets
    And root README.md shows Integration, E2E, and Coverage badges per project
```
