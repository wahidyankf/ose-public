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

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: `validate-spec-coverage` automatically enforces the mapping at file, scenario, and step levels.

- **[Documentation First](../../principles/general/documentation-first.md)**: Specs are written alongside or before the command implementation, serving as living documentation.

## Conventions Implemented/Respected

- **[Acceptance Criteria Convention](./acceptance-criteria.md)**: Feature files follow Gherkin standards defined there.

## Core Rule

**Every Cobra command file must have a corresponding `@tag` in a Gherkin feature file under `specs/`.**

Infrastructure files (`root.go`, `helpers.go`) that do not register commands are exempt.

## Mapping Layers

The mapping operates at three levels:

### 1. Command to Tag (mandatory)

Each command registers exactly one `@tag` in a feature file. The tag matches the Cobra `Use` field:

| Command File                | Cobra `Use`       | Feature `@tag`     |
| --------------------------- | ----------------- | ------------------ |
| `agents_sync.go`            | `sync-agents`     | `@sync-agents`     |
| `agents_validate_sync.go`   | `validate-sync`   | `@validate-sync`   |
| `agents_validate_claude.go` | `validate-claude` | `@validate-claude` |
| `doctor.go`                 | `doctor`          | `@doctor`          |

### 2. Tag to Feature File (flexible)

A feature file may contain **multiple related commands** using separate `Rule` blocks with distinct `@tag` annotations. Semantically related commands (e.g., an action and its validator) can share a feature file:

```gherkin
Feature: Agent Configuration Synchronisation

  @sync-agents
  Rule: sync-agents converts .claude/ configuration to .opencode/ format
    Scenario: Syncing converts agents and skills to OpenCode format
    ...

  @validate-sync
  Rule: validate-sync confirms .claude/ and .opencode/ are equivalent
    Scenario: Directories that are in sync pass validation
    ...
```

Alternatively, a command with its own distinct domain gets its own feature file:

```
specs/rhino-cli/doctor/doctor.feature          ← single @doctor tag
specs/rhino-cli/agents/sync-agents.feature     ← @sync-agents + @validate-sync tags
specs/rhino-cli/agents/validate-claude.feature ← single @validate-claude tag
```

### 3. Integration Test to Tag (mandatory)

Each command has a dedicated integration test file that filters scenarios by `@tag`:

```go
func TestIntegrationValidateSync(t *testing.T) {
    suite := godog.TestSuite{
        ScenarioInitializer: InitializeValidateSyncScenario,
        Options: &godog.Options{
            Paths: []string{specsDir},
            Tags:  "validate-sync",  // filters to matching @tag
        },
    }
    // ...
}
```

## File Naming Convention

| Artifact         | Pattern                                       | Example                                      |
| ---------------- | --------------------------------------------- | -------------------------------------------- |
| Command file     | `{domain}_{action}.go`                        | `agents_validate_sync.go`                    |
| Unit test        | `{domain}_{action}_test.go`                   | `agents_validate_sync_test.go`               |
| Integration test | `{command-name}.integration_test.go`          | `validate-sync.integration_test.go`          |
| Feature file     | `specs/{app}/{domain}/{command-name}.feature` | `specs/rhino-cli/agents/sync-agents.feature` |

Note the naming differences:

- **Command and unit test files** use **domain-first underscores** (Go convention): `agents_sync.go`
- **Integration test and feature files** use **command names with hyphens**: `sync-agents.integration_test.go`, `sync-agents.feature`
- The stem must match between feature file and integration test for `validate-spec-coverage` to pass

## Coverage Enforcement

The `validate-spec-coverage` command enforces this mapping at three levels:

1. **File-level**: Every `.feature` file must have a matching `*_test.*` file
2. **Scenario-level**: Every `Scenario:` in the feature must appear as `// Scenario:` comment or `Scenario(...)` call in test code
3. **Step-level**: Every Given/When/Then step must have a matching step definition

Run the check:

```bash
rhino-cli validate-spec-coverage specs/rhino-cli apps/rhino-cli
```

## Adding a New Command

1. Create the feature file (or add a `Rule` block with `@tag` to an existing file)
2. Create `apps/{app}/cmd/{domain}_{action}.go` with the Cobra command
3. Create `apps/{app}/cmd/{domain}-{action}.integration_test.go` with godog steps
4. Verify: `rhino-cli validate-spec-coverage specs/{app} apps/{app}`

## Related Documentation

- [Acceptance Criteria Convention](./acceptance-criteria.md) - Gherkin format standards
- [Nx Target Standards](./nx-targets.md) - `test:integration` target for godog suites
- [specs/README.md](../../../specs/README.md) - Spec directory organization
- [specs/rhino-cli/README.md](../../../specs/rhino-cli/README.md) - rhino-cli spec structure
