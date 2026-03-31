# rhino-cli Specs

Gherkin behavioral specifications for
[rhino-cli](../../apps/rhino-cli/README.md) — the Repository Hygiene &
INtegration Orchestrator CLI.

## Purpose

These specs define the **observable behavior** of every rhino-cli command:
what inputs the command accepts, what it writes to stdout, and what exit code
it returns. They are the single source of truth for correctness and serve as
the contract between the CLI implementation and its consumers.

## Structure

All feature files live under a single `cli/gherkin/` directory:

```
specs/apps/rhino-cli/
├── README.md
└── cli/
    └── gherkin/    # All rhino-cli Gherkin feature files
```

See [cli/gherkin/README.md](./cli/gherkin/README.md) for the full file inventory.

## Running the Tests

Both unit and integration tests consume these specs. Unit tests use godog with mocked
dependencies; integration tests use godog with real filesystem fixtures.

```bash
# Run all unit tests (includes godog BDD scenarios with mocked I/O)
nx run rhino-cli:test:quick

# Run unit tests directly
cd apps/rhino-cli
go test -v -run TestUnit ./cmd/...

# Run all BDD integration tests (real filesystem fixtures)
nx run rhino-cli:test:integration

# Run a specific integration suite during development
cd apps/rhino-cli
go test -v -tags=integration -run TestIntegrationDoctor ./cmd/...
```

The `test:integration` target is cached — it only re-runs when source files in
`cmd/**/*.go` or `specs/apps/rhino-cli/**/*.feature` change. The `test:unit` target
(via `test:quick`) is also cache-invalidated when these spec files change.

## Adding New Specs

1. Create `specs/apps/rhino-cli/cli/gherkin/<domain>-<action>.feature`
2. Create `apps/rhino-cli/cmd/<domain>_<action>_test.go` (no build tag — unit test with godog):
   - Add `package cmd` at the top
   - Include `// Scenario: <title>` comments for every scenario
   - Register step definitions using package-level mock function variables for all I/O
   - Name the test function `TestUnit<Command>(t *testing.T)`
3. Create `apps/rhino-cli/cmd/<domain>_<action>.integration_test.go` (integration test with godog):
   - Add `//go:build integration` and `package cmd` at the top
   - Include `// Scenario: <title>` comments for every scenario
   - Register step definitions that drive `cmd.RunE()` against real `/tmp` fixtures
   - Name the test function `TestIntegration<Command>(t *testing.T)`
4. Verify with:

   ```bash
   cd apps/rhino-cli
   go run main.go spec-coverage validate specs/rhino-cli apps/rhino-cli
   ```

## Dual Consumption

Every feature file in this directory is consumed at two test levels. The step implementations
differ but the Gherkin scenarios are identical:

| Level       | Test File Pattern                           | Step Implementation                             | Nx Target          |
| ----------- | ------------------------------------------- | ----------------------------------------------- | ------------------ |
| Unit        | `cmd/{domain}_{action}_test.go`             | Mocked I/O via package-level function variables | `test:unit`        |
| Integration | `cmd/{domain}_{action}.integration_test.go` | Real filesystem via `/tmp` fixtures             | `test:integration` |

Coverage is measured at the unit level only (≥95% line coverage).

## Convention

See
[BDD Spec-to-Test Mapping Convention](../../../governance/development/infra/bdd-spec-test-mapping.md)
for the mandatory 1:1 mapping between commands and `@tags`, file naming patterns, and coverage
enforcement rules.
