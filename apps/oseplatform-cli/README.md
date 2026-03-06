# oseplatform-cli

Go CLI tool for oseplatform-web Hugo site maintenance. Validates internal links
across all markdown content files.

## Usage

```sh
oseplatform-cli <command> [flags]
```

### Commands

| Command       | Description                                        |
| ------------- | -------------------------------------------------- |
| `links check` | Validate internal links in oseplatform-web content |

### Global Flags

| Flag         | Short | Default | Description                               |
| ------------ | ----- | ------- | ----------------------------------------- |
| `--verbose`  | `-v`  | `false` | Verbose output with timestamps            |
| `--quiet`    | `-q`  | `false` | Quiet mode (errors only)                  |
| `--output`   | `-o`  | `text`  | Output format: `text`, `json`, `markdown` |
| `--no-color` |       | `false` | Disable colored output                    |

### `links check` Flags

| Flag        | Default                        | Description            |
| ----------- | ------------------------------ | ---------------------- |
| `--content` | `apps/oseplatform-web/content` | Content directory path |

### Exit codes

| Code | Meaning                        |
| ---- | ------------------------------ |
| 0    | All links valid                |
| 1    | One or more broken links found |
| 2    | Usage error or I/O failure     |

## Examples

```sh
# Check links (default content path, run from workspace root)
./apps/oseplatform-cli/dist/oseplatform-cli links check

# Check links with explicit content path
oseplatform-cli links check --content apps/oseplatform-web/content

# Output as JSON
oseplatform-cli links check -o json

# Output as markdown report
oseplatform-cli links check -o markdown

# Verbose output with timestamp
oseplatform-cli links check -v
```

## Testing

Two test tiers cover different concerns:

### Unit Tests

```sh
# Via Nx (includes 95% line coverage check)
nx run oseplatform-cli:test:quick
```

Coverage threshold: ≥95% line coverage.

### Integration Tests

```sh
# Run all 4 BDD integration tests
nx run oseplatform-cli:test:integration

# Run the suite directly during development
cd apps/oseplatform-cli
go test -v -tags=integration -run TestIntegrationLinksCheck ./cmd/...
```

Integration tests use [godog](https://github.com/cucumber/godog) to run Gherkin
scenarios from `specs/apps/oseplatform-cli/`. They are co-located in `cmd/` (same
package) to access unexported flag variables.

| Test function               | Feature file                                      | Scenarios |
| --------------------------- | ------------------------------------------------- | --------- |
| `TestIntegrationLinksCheck` | `specs/apps/oseplatform-cli/links/links-check.feature` | 4         |

The `test:integration` target is cached — it only re-runs when `cmd/**/*.go` or
`specs/apps/oseplatform-cli/**/*.feature` files change.

## Development

```sh
# Build
nx build oseplatform-cli

# Test
nx run oseplatform-cli:test:quick

# Integration tests
nx run oseplatform-cli:test:integration

# Lint
nx lint oseplatform-cli

# Run directly
nx run oseplatform-cli:run -- links check
```

## Why this exists

`oseplatform-web` needs internal link validation as a quality gate before build.
This CLI runs as a `dependsOn` step in `oseplatform-web`'s `test:quick` target,
ensuring broken links are caught before the Hugo build runs.

Keeping it as a standalone binary prevents unrelated changes from triggering
unnecessary rebuild cascades across other projects.
