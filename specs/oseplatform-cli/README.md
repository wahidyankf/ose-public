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

| Directory | Command(s)    |
| --------- | ------------- |
| `links/`  | `links check` |

## Running the Tests

Integration tests live in `apps/oseplatform-cli/cmd/` and run in-process against
controlled filesystem fixtures using [godog](https://github.com/cucumber/godog).

```bash
# Run all 4 BDD integration tests
nx run oseplatform-cli:test:integration

# Run a specific suite during development
cd apps/oseplatform-cli
go test -v -tags=integration -run TestIntegrationLinksCheck ./cmd/...
```

The `test:integration` target is cached — it only re-runs when source files in
`cmd/**/*.go` or `specs/oseplatform-cli/**/*.feature` change.

## Adding New Specs

1. Create `specs/oseplatform-cli/<domain>/<command>.feature`
2. Create `apps/oseplatform-cli/cmd/<command>.integration_test.go` (co-located in `cmd/`, not a
   separate folder — the file must be in `package cmd` to access unexported flag variables):
   - Add `//go:build integration` and `package cmd` at the top
   - Include `// Scenario: <title>` comments for every scenario
   - Register step definitions with `sc.Step(\`^pattern$\`, stepFunc)`
   - Name the test function `TestIntegration<Command>(t *testing.T)`
3. Update the `inputs` list in `test:integration` in `apps/oseplatform-cli/project.json` if needed

## Convention

See
[BDD Spec-to-Test Mapping Convention](../../governance/development/infra/bdd-spec-test-mapping.md)
for the mandatory 1:1 mapping between commands and `@tags`, file naming patterns, and coverage
enforcement rules.
