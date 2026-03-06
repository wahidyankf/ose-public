# ayokoding-cli Specs

Gherkin behavioral specifications for
[ayokoding-cli](../../apps/ayokoding-cli/README.md) — the CLI tool for
ayokoding-web Hugo site maintenance and automation.

## Purpose

These specs define the **observable behavior** of every ayokoding-cli command:
what inputs the command accepts, what it writes to stdout, and what exit code
it returns. They are the single source of truth for correctness and serve as
the contract between the CLI implementation and its consumers.

## Structure

| Directory | Command(s)      |
| --------- | --------------- |
| `nav/`    | `nav regen`     |
| `titles/` | `titles update` |
| `links/`  | `links check`   |

## Running the Tests

Integration tests live in `apps/ayokoding-cli/cmd/` and run in-process against
controlled filesystem fixtures using [godog](https://github.com/cucumber/godog).

```bash
# Run all 13 BDD integration tests
nx run ayokoding-cli:test:integration

# Run a specific suite during development
cd apps/ayokoding-cli
go test -v -tags=integration -run TestIntegrationNavRegen ./cmd/...
go test -v -tags=integration -run TestIntegrationTitlesUpdate ./cmd/...
go test -v -tags=integration -run TestIntegrationLinksCheck ./cmd/...
```

The `test:integration` target is cached — it only re-runs when source files in
`cmd/**/*.go` or `specs/ayokoding-cli/**/*.feature` change.

## Adding New Specs

1. Create `specs/ayokoding-cli/<domain>/<command>.feature`
2. Create `apps/ayokoding-cli/cmd/<command>.integration_test.go` (co-located in `cmd/`, not a
   separate folder — the file must be in `package cmd` to access unexported flag variables):
   - Add `//go:build integration` and `package cmd` at the top
   - Include `// Scenario: <title>` comments for every scenario
   - Register step definitions with `sc.Step(\`^pattern$\`, stepFunc)`
   - Name the test function `TestIntegration<Command>(t *testing.T)`
3. Update the `inputs` list in `test:integration` in `apps/ayokoding-cli/project.json` if needed

## Convention

See
[BDD Spec-to-Test Mapping Convention](../../governance/development/infra/bdd-spec-test-mapping.md)
for the mandatory 1:1 mapping between commands and `@tags`, file naming patterns, and coverage
enforcement rules.
