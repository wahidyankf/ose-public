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

| Directory        | Command(s)                                                      |
| ---------------- | --------------------------------------------------------------- |
| `agents/`        | `agents sync`, `agents validate-claude`, `agents validate-sync` |
| `docs/`          | `docs validate-links`, `docs validate-naming`                   |
| `doctor/`        | `doctor`                                                        |
| `java/`          | `java validate-annotations`                                     |
| `spec-coverage/` | `spec-coverage validate`                                        |
| `test-coverage/` | `test-coverage validate`                                        |

## Running the Tests

Integration tests live in `apps/rhino-cli/cmd/` and run in-process against
controlled filesystem fixtures using [godog](https://github.com/cucumber/godog).

```bash
# Run all BDD integration tests
nx run rhino-cli:test:integration

# Run a specific suite during development
cd apps/rhino-cli
go test -v -tags=integration -run TestIntegrationDoctor ./cmd/...
```

The `test:integration` target is cached — it only re-runs when source files in
`cmd/**/*.go` or `specs/apps/rhino-cli/**/*.feature` change.

## Adding New Specs

1. Create `specs/apps/rhino-cli/<domain>/<domain>-<action>.feature`
2. Create `apps/rhino-cli/cmd/<domain>_<action>.integration_test.go` (co-located in `cmd/`, not a
   separate folder — the file must be in `package cmd` to access unexported flag variables):
   - Add `//go:build integration` and `package cmd` at the top
   - Include `// Scenario: <title>` comments for every scenario
   - Register step definitions with `sc.Step(\`^pattern$\`, stepFunc)`
   - Name the test function `TestIntegration<Command>(t *testing.T)`
3. Verify with:

   ```bash
   cd apps/rhino-cli
   go run main.go spec-coverage validate specs/rhino-cli apps/rhino-cli
   ```

## Convention

See
[BDD Spec-to-Test Mapping Convention](../../governance/development/infra/bdd-spec-test-mapping.md)
for the mandatory 1:1 mapping between commands and `@tags`, file naming patterns, and coverage
enforcement rules.
