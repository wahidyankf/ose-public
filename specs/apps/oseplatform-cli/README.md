# oseplatform-cli Specs

Gherkin behavioral specifications for
[oseplatform-cli](../../apps/oseplatform-cli/README.md) — the CLI tool for
oseplatform-web Hugo site maintenance.

## Purpose

These specs define the **observable behavior** of every oseplatform-cli command:
what inputs the command accepts, what it writes to stdout, and what exit code
it returns. They are the single source of truth for correctness and serve as
the contract between the CLI implementation and its consumers.

## Structure

All feature files live under a single `cli/gherkin/` directory:

```
specs/apps/oseplatform-cli/
├── README.md
└── cli/
    └── gherkin/    # All oseplatform-cli Gherkin feature files
```

See [cli/gherkin/README.md](./cli/gherkin/README.md) for the full file inventory.

## Running the Tests

Both unit and integration tests consume these specs via [godog](https://github.com/cucumber/godog).
Unit tests use mocked I/O; integration tests use real filesystem fixtures.

```bash
# Run unit tests (includes godog BDD scenarios with mocked I/O)
nx run oseplatform-cli:test:quick

# Run unit tests directly
cd apps/oseplatform-cli
go test -v -run TestUnit ./cmd/...

# Run all BDD integration tests (real filesystem fixtures)
nx run oseplatform-cli:test:integration

# Run a specific integration suite during development
cd apps/oseplatform-cli
go test -v -tags=integration -run TestIntegrationLinksCheck ./cmd/...
```

The `test:integration` target is cached — it only re-runs when source files in
`cmd/**/*.go` or `specs/apps/oseplatform-cli/**/*.feature` change. The `test:unit`
target (via `test:quick`) is also cache-invalidated when these spec files change.

This pattern will be implemented as part of the CLI testing alignment plan.

## Adding New Specs

1. Create `specs/apps/oseplatform-cli/cli/gherkin/<domain>-<action>.feature`
2. Create `apps/oseplatform-cli/cmd/<command>_test.go` (no build tag — unit test with godog):
   - Add `package cmd` at the top
   - Include `// Scenario: <title>` comments for every scenario
   - Register step definitions using package-level mock function variables for all I/O
   - Name the test function `TestUnit<Command>(t *testing.T)`
3. Create `apps/oseplatform-cli/cmd/<command>.integration_test.go` (integration test with godog):
   - Add `//go:build integration` and `package cmd` at the top
   - Include `// Scenario: <title>` comments for every scenario
   - Register step definitions that drive `cmd.RunE()` against real `/tmp` fixtures
   - Name the test function `TestIntegration<Command>(t *testing.T)`
4. Update the `inputs` list in `test:unit` and `test:integration` in `apps/oseplatform-cli/project.json` if needed

## Dual Consumption

Every feature file in this directory is consumed at two test levels. The step implementations
differ but the Gherkin scenarios are identical:

| Level       | Test File Pattern                   | Step Implementation                             | Nx Target          |
| ----------- | ----------------------------------- | ----------------------------------------------- | ------------------ |
| Unit        | `cmd/{command}_test.go`             | Mocked I/O via package-level function variables | `test:unit`        |
| Integration | `cmd/{command}.integration_test.go` | Real filesystem via `/tmp` fixtures             | `test:integration` |

Coverage is measured at the unit level only (≥95% line coverage).

## Convention

See
[BDD Spec-to-Test Mapping Convention](../../../governance/development/infra/bdd-spec-test-mapping.md)
for the mandatory 1:1 mapping between commands and `@tags`, file naming patterns, and coverage
enforcement rules.
