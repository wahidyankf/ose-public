---
title: "BDD Spec-to-Test Mapping Convention"
description: Every CLI command must have a corresponding Gherkin specification with matching integration tests
category: explanation
subcategory: development
tags:
  - bdd
  - gherkin
  - integration-testing
  - spec-coverage
created: 2026-03-06
updated: 2026-03-06
---

# BDD Spec-to-Test Mapping Convention

This convention defines the mandatory 1:1 mapping between CLI commands and their Gherkin specifications.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Every command's behavior is explicitly specified in Gherkin before implementation. No undocumented commands.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: `spec-coverage validate` automatically enforces the mapping at file, scenario, and step levels.

- **[Documentation First](../../principles/content/documentation-first.md)**: Specs are written alongside or before the command implementation, serving as living documentation.

## Conventions Implemented/Respected

- **[Acceptance Criteria Convention](./acceptance-criteria.md)**: Feature files follow Gherkin standards defined there.

## Core Rule

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
specs/apps/rhino-cli/doctor/doctor.feature                       <- single @doctor tag
specs/apps/rhino-cli/agents/agents-sync.feature                  <- @agents-sync + @agents-validate-sync
specs/apps/rhino-cli/agents/agents-validate-claude.feature       <- single @agents-validate-claude tag
```

### 3. Integration Test to Tag (mandatory)

Each command has a dedicated integration test file that filters scenarios by `@tag`:

```go
func TestIntegrationValidateSync(t *testing.T) {
    suite := godog.TestSuite{
        ScenarioInitializer: InitializeValidateSyncScenario,
        Options: &godog.Options{
            Paths: []string{specsDir},
            Tags:  "agents-validate-sync",  // filters to matching @tag
        },
    }
    // ...
}
```

## File Naming Convention

| Artifact         | Pattern                                          | Example                                               |
| ---------------- | ------------------------------------------------ | ----------------------------------------------------- |
| Parent cmd       | `{domain}.go`                                    | `agents.go`                                           |
| Command file     | `{domain}_{action}.go`                           | `agents_validate_sync.go`                             |
| Unit test        | `{domain}_{action}_test.go`                      | `agents_validate_sync_test.go`                        |
| Integration test | `{domain}_{action}.integration_test.go`          | `agents_validate_sync.integration_test.go`            |
| Feature file     | `specs/{app}/{domain}/{domain}-{action}.feature` | `specs/apps/rhino-cli/agents/agents-validate-sync.feature` |

**The universal rule**: All Go files (command, unit test, integration test) use underscores. Feature files and `@tag`s use hyphens. The `spec-coverage validate` tool normalises hyphens to underscores when matching feature stems to Go test files.

## Coverage Enforcement

The `spec-coverage validate` command enforces this mapping at three levels:

1. **File-level**: Every `.feature` file must have a matching `*_test.*` file
2. **Scenario-level**: Every `Scenario:` in the feature must appear as `// Scenario:` comment or `Scenario(...)` call in test code
3. **Step-level**: Every Given/When/Then step must have a matching step definition

Run the check:

```bash
rhino-cli spec-coverage validate specs/apps/rhino-cli apps/rhino-cli
```

## Adding a New Command

1. Create the parent command file `apps/{app}/cmd/{domain}.go` if the domain is new
2. Create the feature file `specs/{app}/{domain}/{domain}-{action}.feature`
3. Create `apps/{app}/cmd/{domain}_{action}.go` with the Cobra command (register with parent)
4. Create `apps/{app}/cmd/{domain}_{action}.integration_test.go` with godog steps
5. Verify: `rhino-cli spec-coverage validate specs/{app} apps/{app}`

## Related Documentation

- [Acceptance Criteria Convention](./acceptance-criteria.md) - Gherkin format standards
- [Nx Target Standards](./nx-targets.md) - `test:integration` target for godog suites
- [specs/README.md](../../../specs/README.md) - Spec directory organization
- [specs/apps/rhino-cli/README.md](../../../specs/apps/rhino-cli/README.md) - rhino-cli spec structure
