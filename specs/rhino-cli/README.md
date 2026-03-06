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

| Directory        | Command(s)                                        |
| ---------------- | ------------------------------------------------- |
| `test-coverage/` | `validate-test-coverage`                          |
| `doctor/`        | `doctor`                                          |
| `java/`          | `validate-java-annotations`                       |
| `docs/`          | `validate-docs-links`, `validate-docs-naming`     |
| `agents/`        | `validate-claude`, `validate-sync`, `sync-agents` |
| `spec-coverage/` | `validate-spec-coverage`                          |

## Running the Tests

Integration tests live in `apps/rhino-cli/cmd/` and run in-process against
controlled filesystem fixtures using [godog](https://github.com/cucumber/godog).

```bash
# Run all 39 BDD integration tests
nx run rhino-cli:test:integration

# Run a specific suite during development
cd apps/rhino-cli
go test -v -tags=integration -run TestIntegrationDoctor ./cmd/...
```

The `test:integration` target is cached — it only re-runs when source files in
`cmd/**/*.go` or `specs/rhino-cli/**/*.feature` change.

## Adding New Specs

1. Create `specs/rhino-cli/<domain>/<command>.feature`
2. Create `apps/rhino-cli/cmd/<command>.integration_test.go` (co-located in `cmd/`, not a
   separate folder — the file must be in `package cmd` to access unexported flag variables):
   - Add `//go:build integration` and `package cmd` at the top
   - Include `// Scenario: <title>` comments for every scenario
   - Register step definitions with `sc.Step(\`^pattern$\`, stepFunc)`
   - Name the test function `TestIntegration<Command>(t *testing.T)`
3. Verify with:

   ```bash
   cd apps/rhino-cli
   go run main.go validate-spec-coverage specs/rhino-cli apps/rhino-cli
   ```

## Convention

See
[BDD Spec-to-Test Mapping Convention](../../governance/development/infra/bdd-spec-test-mapping.md)
for the mandatory 1:1 mapping between commands and `@tags`, file naming patterns, and coverage
enforcement rules.
