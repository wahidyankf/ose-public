# Requirements

## User Stories

### US-1: Unified Demo Spec Directory

As a developer working on demo apps,
I want backend and frontend specs under a single `specs/apps/demo/` root,
So that I can find all demo-related specifications in one place.

**Acceptance Criteria:**

```gherkin
Feature: Unified demo spec directory

  Scenario: New directory structure exists
    Given the specs consolidation is complete
    Then the directory "specs/apps/demo/" exists
    And the directory "specs/apps/demo/c4/" exists
    And the directory "specs/apps/demo/be/" exists
    And the directory "specs/apps/demo/be/gherkin/" exists
    And the directory "specs/apps/demo/fe/" exists
    And the directory "specs/apps/demo/fe/gherkin/" exists

  Scenario: Old directories are removed
    Given the specs consolidation is complete
    Then the directory "specs/apps/demo-be/" does not exist
    And the directory "specs/apps/demo-fe/" does not exist

  Scenario: Every directory has a README
    Given the specs consolidation is complete
    Then "specs/apps/demo/README.md" exists
    And "specs/apps/demo/c4/README.md" exists
    And "specs/apps/demo/be/README.md" exists
    And "specs/apps/demo/be/gherkin/README.md" exists
    And "specs/apps/demo/fe/README.md" exists
    And "specs/apps/demo/fe/gherkin/README.md" exists
```

### US-2: Unified C4 Architecture Diagrams

As a developer reviewing the demo system architecture,
I want C4 diagrams that show both backend and frontend as one system,
So that I understand how the full demo application fits together.

**Acceptance Criteria:**

```gherkin
Feature: Unified C4 diagrams

  Scenario: Context diagram shows full system
    Given the C4 context diagram at "specs/apps/demo/c4/context.md"
    Then it shows the "Demo Application" as the main system
    And it shows 4 external actors (End User, Administrator, Operations Engineer, Service Integrator)
    And it shows the frontend and backend as parts of one system

  Scenario: Container diagram shows all containers
    Given the C4 container diagram at "specs/apps/demo/c4/container.md"
    Then it shows the SPA container
    And it shows the Static File Server
    And it shows the REST API container
    And it shows the Database
    And it shows the File Storage
    And it shows how the SPA communicates with the REST API

  Scenario: Component diagrams remain separate
    Given "specs/apps/demo/c4/component-be.md" exists
    And "specs/apps/demo/c4/component-fe.md" exists
    Then the BE component diagram shows handlers, middleware, services, repositories
    And the FE component diagram shows pages, state, API client, guards
```

### US-3: Specs Validation Gate Before Rewiring

As a developer consolidating specs,
I want the merged specs validated in OCD mode before rewiring app references,
So that any structural, content, or consistency issues are fixed while the blast radius is small.

**Acceptance Criteria:**

```gherkin
Feature: Specs validation gate

  Scenario: Merged specs pass OCD validation
    Given the directory restructuring is complete (Phases 1-3)
    And the merged specs are at "specs/apps/demo/"
    When the specs-validation workflow runs in ocd mode for "specs/apps/demo"
    Then zero findings remain at all criticality levels

  Scenario: Cross-spec consistency between be and fe
    Given both "specs/apps/demo/be/" and "specs/apps/demo/fe/" contain gherkin specs
    When cross-folder consistency is checked
    Then shared domains (authentication, expenses, health, etc.) align between be and fe
    And C4 diagrams reference consistent actors across L1, L2, and L3

  Scenario: Specs fixes committed before rewiring
    Given the specs validation produced fixes
    Then those fixes are committed before any application path updates begin
```

### US-4: All Backend References Updated

As a developer building a demo-be backend,
I want all paths pointing to `specs/apps/demo-be/gherkin/` updated to `specs/apps/demo/be/gherkin/`,
So that test discovery, Docker mounts, and build configs continue to work.

**Acceptance Criteria:**

```gherkin
Feature: Backend path migration

  Scenario: No stale references remain
    Given the consolidation is complete
    When I search the codebase for "specs/apps/demo-be"
    Then no results are found outside of "plans/done/"

  Scenario: All 11 backend project.json files updated
    Given each demo-be-* app has a project.json
    Then every "specs/apps/demo-be" path is replaced with "specs/apps/demo/be"

  Scenario: Docker volume mounts updated
    Given each backend has docker-compose files
    Then volume mounts use "specs/apps/demo/be/gherkin" instead of "specs/apps/demo-be/gherkin"

  Scenario: Test runners discover specs at new path
    Given the path migration is complete
    Then "nx run demo-be-java-springboot:test:quick" passes
    And "nx run demo-be-golang-gin:test:quick" passes
    And "nx run demo-be-python-fastapi:test:quick" passes
    And "nx run demo-be-rust-axum:test:quick" passes
    And "nx run demo-be-ts-effect:test:quick" passes
    And "nx run demo-be-elixir-phoenix:test:quick" passes
    And "nx run demo-be-fsharp-giraffe:test:quick" passes
    And "nx run demo-be-csharp-aspnetcore:test:quick" passes
    And "nx run demo-be-kotlin-ktor:test:quick" passes
    And "nx run demo-be-java-vertx:test:quick" passes
    And "nx run demo-be-clojure-pedestal:test:quick" passes
```

### US-5: All Frontend References Updated

As a developer preparing to build a demo-fe frontend,
I want all paths pointing to `specs/apps/demo-fe/` updated to `specs/apps/demo/fe/`,
So that future frontend implementations can consume specs from the new location.

**Acceptance Criteria:**

```gherkin
Feature: Frontend path migration

  Scenario: No stale references remain
    Given the consolidation is complete
    When I search the codebase for "specs/apps/demo-fe"
    Then no results are found outside of "plans/done/"

  Scenario: FE gherkin specs accessible at new path
    Given the consolidation is complete
    Then the directory "specs/apps/demo/fe/gherkin/" exists
    And it contains the same feature files as the old "specs/apps/demo-fe/gherkin/"

  Scenario: FE C4 component diagram at new path
    Given the consolidation is complete
    Then "specs/apps/demo/c4/component-fe.md" exists
    And it describes the frontend component architecture
```

### US-6: All CI Passes — Local and GitHub Actions

As a maintainer,
I want every CI pipeline to pass after the migration — both locally and on GitHub Actions,
So that nothing is broken across any test level.

**Acceptance Criteria:**

```gherkin
Feature: Full CI validation

  Scenario: Local lint passes
    Given the consolidation is complete
    Then "npm run lint:md" passes
    And "npm run format:md:check" passes
    And "nx affected -t lint" passes

  Scenario: Local typecheck passes
    Given the consolidation is complete
    Then "nx affected -t typecheck" passes

  Scenario: Local test:quick passes for all 11 backends
    Given the consolidation is complete
    Then "nx run demo-be-java-springboot:test:quick" passes
    And "nx run demo-be-java-vertx:test:quick" passes
    And "nx run demo-be-kotlin-ktor:test:quick" passes
    And "nx run demo-be-golang-gin:test:quick" passes
    And "nx run demo-be-python-fastapi:test:quick" passes
    And "nx run demo-be-rust-axum:test:quick" passes
    And "nx run demo-be-ts-effect:test:quick" passes
    And "nx run demo-be-fsharp-giraffe:test:quick" passes
    And "nx run demo-be-elixir-phoenix:test:quick" passes
    And "nx run demo-be-csharp-aspnetcore:test:quick" passes
    And "nx run demo-be-clojure-pedestal:test:quick" passes

  Scenario: GitHub Actions Main CI passes
    Given the consolidation is pushed to main
    Then the "Main CI" workflow succeeds (runs test:quick for all affected projects)

  Scenario: GitHub Actions integration + E2E CI passes for all 11 backends
    Given the consolidation is pushed to main
    Then "Test Integration + E2E Demo Backend (Java/Spring Boot)" succeeds
    And "Test Integration + E2E Demo Backend (Java/Vert.x)" succeeds
    And "Test Integration + E2E Demo Backend (Kotlin/Ktor)" succeeds
    And "Test Integration + E2E Demo Backend (Go/Gin)" succeeds
    And "Test Integration + E2E Demo Backend (Python/FastAPI)" succeeds
    And "Test Integration + E2E Demo Backend (Rust/Axum)" succeeds
    And "Test Integration + E2E Demo Backend (TypeScript/Effect)" succeeds
    And "Test Integration + E2E Demo Backend (F#/Giraffe)" succeeds
    And "Test Integration + E2E Demo Backend (Elixir/Phoenix)" succeeds
    And "Test Integration + E2E Demo Backend (C#/ASP.NET Core)" succeeds
    And "Test Integration + E2E Demo Backend (Clojure/Pedestal)" succeeds

  Scenario: GitHub Actions organiclever-fe CI passes
    Given the consolidation is pushed to main
    Then "Test Integration + E2E OrganicLever Web" succeeds

  Scenario: GitHub Actions PR workflows pass
    Given the consolidation is pushed to main
    Then "pr-validate-links" workflow finds no broken links
    And "pr-format" workflow finds no formatting issues
    And "pr-quality-gate" workflow passes
```

## Non-Functional Requirements

1. **Git history**: Use `git mv` where possible to preserve file history
2. **Atomic migration**: Complete the rename in as few commits as possible to minimize broken
   intermediate states
3. **No functional changes**: Only path/reference changes — no logic or spec content modifications
4. **README quality**: All new/updated READMEs follow existing conventions (active voice, proper
   heading nesting, links with .md extension)
