---
title: "BDD Spec-to-Test Mapping Convention"
description: Gherkin spec consumption rules for CLI apps (1:1 command mapping) and demo-be backends (three-level unit/integration/e2e)
category: explanation
subcategory: development
tags:
  - bdd
  - gherkin
  - integration-testing
  - spec-coverage
  - demo-be
created: 2026-03-06
updated: 2026-04-02
---

# BDD Spec-to-Test Mapping Convention

This convention defines how Gherkin specifications are consumed across the monorepo:

- **CLI apps**: Mandatory 1:1 mapping between commands and Gherkin specs via Godog at both unit and integration test levels
- **Demo-be backends**: Three-level consumption of shared Gherkin specs (unit/integration/e2e) with different step implementations at each level

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Every command's behavior is explicitly specified in Gherkin before implementation. No undocumented commands.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: `spec-coverage validate` automatically enforces the mapping at file, scenario, and step levels.

- **[Documentation First](../../principles/content/documentation-first.md)**: Specs are written alongside or before the command implementation, serving as living documentation.

## Conventions Implemented/Respected

- **[Acceptance Criteria Convention](./acceptance-criteria.md)**: Feature files follow Gherkin standards defined there.

## CLI Apps: Command-to-Spec Mapping

### Core Rule

**Every Cobra command file must have a corresponding `@tag` in a Gherkin feature file under `specs/`.**

Infrastructure files (`root.go`, `helpers.go`) and parent command files (e.g., `agents.go`, `docs.go`) that do not implement logic are exempt.

## Domain-Prefixed Subcommands

All CLI apps in this monorepo use **Cobra subcommands** grouped by domain. The domain is the prefix in every artifact:

```
rhino-cli {domain} {action}
ayokoding-cli {domain} {action}
oseplatform-cli {domain} {action}
```

## Mapping Layers

The mapping operates at three levels:

### 1. Command to Tag (mandatory)

The `@tag` is derived from the Go filename: replace underscores with hyphens.

| Command File                | Full Invocation          | Feature `@tag`            |
| --------------------------- | ------------------------ | ------------------------- |
| `agents_sync.go`            | `agents sync`            | `@agents-sync`            |
| `agents_validate_sync.go`   | `agents validate-sync`   | `@agents-validate-sync`   |
| `agents_validate_claude.go` | `agents validate-claude` | `@agents-validate-claude` |
| `docs_validate_links.go`    | `docs validate-links`    | `@docs-validate-links`    |
| `spec_coverage_validate.go` | `spec-coverage validate` | `@spec-coverage-validate` |
| `doctor.go`                 | `doctor`                 | `@doctor`                 |

### 2. Tag to Feature File (flexible)

A feature file may contain **multiple related commands** using separate `Rule` blocks with distinct `@tag` annotations. Semantically related commands (e.g., an action and its validator) can share a feature file:

```gherkin
Feature: Agent Configuration Synchronisation

  @agents-sync
  Rule: agents sync converts .claude/ configuration to .opencode/ format
    Scenario: Syncing converts agents and skills to OpenCode format
    ...

  @agents-validate-sync
  Rule: agents validate-sync confirms .claude/ and .opencode/ are equivalent
    Scenario: Directories that are in sync pass validation
    ...
```

Alternatively, a command with its own distinct domain gets its own feature file:

```
specs/apps/rhino/cli/gherkin/doctor.feature                       <- single @doctor tag
specs/apps/rhino/cli/gherkin/agents-sync.feature                  <- @agents-sync + @agents-validate-sync
specs/apps/rhino/cli/gherkin/agents-validate-claude.feature       <- single @agents-validate-claude tag
```

### 3. Unit & Integration Test to Tag (mandatory)

Each command has dedicated test files at both levels that filter scenarios by `@tag`. The same tag is used at both levels, pointing to the same feature file:

**Unit test** (no build tag — runs in `test:quick`):

```go
func TestUnitValidateSync(t *testing.T) {
    suite := godog.TestSuite{
        ScenarioInitializer: InitializeValidateSyncUnitScenario,
        Options: &godog.Options{
            Paths: []string{specsDir},
            Tags:  "agents-validate-sync",  // filters to matching @tag
        },
    }
    // ...
}
```

**Integration test** (`//go:build integration` — runs in `test:integration`):

```go
func TestIntegrationValidateSync(t *testing.T) {
    suite := godog.TestSuite{
        ScenarioInitializer: InitializeValidateSyncScenario,
        Options: &godog.Options{
            Paths: []string{specsDir},
            Tags:  "agents-validate-sync",  // same @tag, different step implementations
        },
    }
    // ...
}
```

## File Naming Convention

| Artifact         | Pattern                                     | Example                                       |
| ---------------- | ------------------------------------------- | --------------------------------------------- |
| Parent cmd       | `{domain}.go`                               | `agents.go`                                   |
| Command file     | `{domain}_{action}.go`                      | `agents_validate_sync.go`                     |
| Unit test        | `{domain}_{action}_test.go`                 | `agents_validate_sync_test.go`                |
| Integration test | `{domain}_{action}.integration_test.go`     | `agents_validate_sync.integration_test.go`    |
| Feature file     | `specs/{app}/cli/gherkin/{command}.feature` | `specs/apps/rhino/cli/gherkin/doctor.feature` |

**Unit test files** (`{domain}_{action}_test.go`) serve dual purpose: they contain both godog BDD step definitions (consuming Gherkin specs via `TestUnit*` functions) and any non-BDD pure function tests for edge cases not covered by the Gherkin scenarios. The godog step definitions in unit test files use mocked I/O function variables instead of real filesystem access.

**The universal rule**: All Go files (command, unit test, integration test) use underscores. Feature files and `@tag`s use hyphens. The `spec-coverage validate` tool normalises hyphens to underscores when matching feature stems to Go test files.

## Coverage Enforcement

The `spec-coverage validate` command enforces this mapping at three levels:

1. **File-level**: Every `.feature` file must have a matching `*_test.*` file
2. **Scenario-level**: Every `Scenario:` in the feature must appear as `// Scenario:` comment or `Scenario(...)` call in test code
3. **Step-level**: Every Given/When/Then step must have a matching step definition

Run the check:

```bash
rhino-cli spec-coverage validate specs/apps/rhino apps/rhino-cli
```

**Scope**: Spec-coverage enforcement is currently active for **CLI apps only** (Go + Godog naming
conventions). Enforcement for demo-be backends is **planned but deferred** — the tool needs
enhancement to support demo-be test file naming conventions (e.g., `health_steps_test.go` for Go,
`HealthSteps.java` for Java) which differ from the CLI app naming patterns the tool currently
expects. This will be addressed in a follow-up plan.

## Adding a New Command

1. Create the parent command file `apps/{app}/cmd/{domain}.go` if the domain is new
2. Create the feature file `specs/{app}/{domain}/{domain}-{action}.feature`
3. Create `apps/{app}/cmd/{domain}_{action}.go` with the Cobra command (register with parent)
4. Create `apps/{app}/cmd/{domain}_{action}_test.go` with godog unit step definitions — use package-level function variables to mock all I/O, no build tag (runs in `test:quick`)
5. Create `apps/{app}/cmd/{domain}_{action}.integration_test.go` with godog integration steps — add `//go:build integration`, drive via `cmd.RunE()` against real `/tmp` fixtures
6. Verify: `rhino-cli spec-coverage validate specs/{app} apps/{app}`

## CLI Apps: Dual-Level Spec Consumption

Go CLI apps (`rhino-cli`, `ayokoding-cli`, `oseplatform-cli`) consume Gherkin specs at both the unit and integration test levels. The same feature files serve as the contract for both levels — only the step implementations differ.

### Architecture

| Level       | Nx Target          | Test File Pattern                       | Step Implementation                          | Dependencies    |
| ----------- | ------------------ | --------------------------------------- | -------------------------------------------- | --------------- |
| Unit        | `test:unit`        | `{domain}_{action}_test.go` (no tag)    | Package-level mock function vars replace I/O | All mocked      |
| Integration | `test:integration` | `{domain}_{action}.integration_test.go` | `cmd.RunE()` against real `/tmp` fixtures    | Real filesystem |

### Unit-Level Step Definitions

Unit steps call command logic directly with mocked dependencies. Package-level function variables (e.g., `readFileFn`, `writeFileFn`, `statFn`) are overridden in step setup to inject controlled behavior without touching the real filesystem.

- No build tag — included in `go test ./...` and `test:quick`
- Coverage is measured at this level (≥90% line coverage)
- Must run all Gherkin scenarios for the command's `@tag`

### Integration-Level Step Definitions

Integration steps drive commands in-process via `cmd.RunE()` against controlled `/tmp` filesystem fixtures. Steps create temporary directory structures, invoke the command, and assert on stdout/stderr and exit code.

- Build tag: `//go:build integration`
- Runs via `go test -tags=integration -run TestIntegration ./cmd/...`
- Coverage is NOT measured at this level
- Must run all Gherkin scenarios for the command's `@tag`

### Example: Same Spec, Two Step Implementations

The `@agents-validate-sync` tag lives inside `agents-sync.feature` (shared feature file) and is consumed at both levels:

```
specs/apps/rhino/cli/gherkin/agents-sync.feature  (contains @agents-sync + @agents-validate-sync)
  -> Unit steps in:       apps/rhino-cli/cmd/agents_validate_sync_test.go
  -> Integration steps in: apps/rhino-cli/cmd/agents_validate_sync.integration_test.go
```

## Demo-be Backend: Three-Level Spec Consumption

All 11 demo-be backends consume the **same shared Gherkin scenarios** from [`specs/apps/a-demo/be/gherkin/`](../../../specs/apps/a-demo/be/gherkin/README.md) at three test levels. The feature files are the shared contract — only the step implementations change per level.

### Shared Specs

```
specs/apps/a-demo/be/gherkin/
├── auth/
│   ├── login.feature
│   ├── register.feature
│   └── ...
├── users/
│   ├── list-users.feature
│   └── ...
└── ... (see gherkin README for full list)
```

### Three Levels

| Level           | Nx Target          | Step Implementations                                        | Dependencies             | What's Real            |
| --------------- | ------------------ | ----------------------------------------------------------- | ------------------------ | ---------------------- |
| **Unit**        | `test:unit`        | Call service/repository functions directly with mocked deps | All mocked               | Application logic only |
| **Integration** | `test:integration` | Call service/repository functions directly with real DB     | Real PostgreSQL (Docker) | Application + database |
| **E2E**         | `test:e2e`         | Playwright HTTP requests to running server                  | Full running server      | Everything             |

### Unit-Level Step Definitions

Unit steps call application service/repository functions directly. All dependencies (database, external APIs) are mocked via in-memory implementations or test doubles.

- No Spring context, no HTTP framework, no database connections
- Steps instantiate services with mocked repositories
- Coverage is measured at this level (≥90% line coverage)
- Must run all shared scenarios

### Integration-Level Step Definitions

Integration steps call application service/repository functions directly against a real PostgreSQL database via docker-compose. No HTTP layer.

- `docker-compose.integration.yml` starts PostgreSQL + test runner
- `Dockerfile.integration` contains language runtime + test execution
- Steps connect to PostgreSQL, run migrations, execute all shared scenarios
- Coverage is NOT measured at this level
- Must run all shared scenarios

### E2E-Level Step Definitions

E2E tests live in `apps/a-demo-be-e2e/` (shared Playwright suite). Steps make real HTTP requests to a running backend via `playwright-bdd`.

- Runs against any of the 11 backends
- Tests the full HTTP API contract
- Must run all shared scenarios
- Managed by `a-demo-be-e2e` project, not individual backends

### Validation

To verify all scenarios pass at each level for a given backend:

```bash
# Unit tests (mocked dependencies)
nx run a-demo-be-{lang}-{framework}:test:unit

# Integration tests (real PostgreSQL via docker-compose)
nx run a-demo-be-{lang}-{framework}:test:integration

# E2E tests (Playwright HTTP against running backend)
nx run a-demo-be-e2e:test:e2e
```

All three commands must report all scenarios passing. The Gherkin feature files serve as the single source of truth — if a scenario fails at any level, the backend is non-compliant.

## Related Documentation

- [Acceptance Criteria Convention](./acceptance-criteria.md) - Gherkin format standards
- [Specs Directory Structure Convention](../../conventions/structure/specs-directory-structure.md) - Canonical path patterns and domain subdirectory rules
- [Three-Level Testing Standard](../quality/three-level-testing-standard.md) - Mandatory isolation boundaries for unit, integration, and E2E levels where Gherkin specs are consumed
- [Nx Target Standards](./nx-targets.md) - `test:integration` target definitions and caching rules
- [specs/README.md](../../../specs/README.md) - Spec directory organization
- [specs/apps/rhino/README.md](../../../specs/apps/rhino/README.md) - rhino-cli spec structure
- [specs/apps/a-demo/be/README.md](../../../specs/apps/a-demo/be/README.md) - Demo-be spec structure and three-level consumption
