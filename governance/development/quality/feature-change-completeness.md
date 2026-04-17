---
title: "Feature Change Completeness Convention"
description: Practice requiring all related specs, contracts, tests, and documentation to be updated as part of any feature change
category: explanation
subcategory: development
tags:
  - feature-completeness
  - specs
  - contracts
  - testing
  - documentation
  - quality
created: 2026-04-04
updated: 2026-04-04
---

# Feature Change Completeness Convention

A feature change is **not complete** until all related artifacts are updated. Code change + spec change + contract change + test change + documentation change = one atomic unit of work. Partial updates -- shipping code without updating specs, contracts, tests, or documentation -- are incomplete work and must not be treated as done.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Documentation First](../../principles/content/documentation-first.md)**: Documentation is a first-class deliverable, not an afterthought. When a feature changes, its documentation must change in the same unit of work. Stale documentation is worse than no documentation because it misleads.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The system's behavior should be fully legible from the repository at all times. When specs, contracts, and tests diverge from code, the actual behavior becomes implicit -- knowable only by reading source code. Keeping all artifacts synchronized preserves explicitness.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: Stale specs, outdated contracts, and missing tests are symptoms of treating artifact updates as separate, deferrable tasks. The root cause is a workflow that permits code changes without companion artifact updates. This convention addresses the root cause by making completeness a requirement, not a suggestion.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Where completeness can be enforced automatically -- Nx cache inputs that include Gherkin specs, codegen targets that fail on stale contracts, spec-coverage validation for CLI apps -- automation is preferred. Manual checking is reserved for documentation and architectural changes that require human judgment.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Specs-Application Sync Convention](./specs-application-sync.md)**: This convention mandates bidirectional synchronization between specs/ and application code. Feature Change Completeness extends that mandate to also include contracts, tests, and documentation.

- **[Three-Level Testing Standard](./three-level-testing-standard.md)**: All three test levels consume shared artifacts (Gherkin specs, contracts). When a feature changes, the tests at all affected levels must be updated.

- **[Code Quality Convention](./code.md)**: Quality gates (typecheck, lint, test:quick, spec-coverage) catch many forms of incompleteness automatically. This convention defines the complete set of artifacts that constitute a "done" change.

## The Rule

**When creating, updating, or deleting features in projects, apps, or libs, you MUST also update all related artifacts in the same commit or pull request.**

The related artifacts are:

1. **Specs** -- Gherkin feature files in `specs/`
2. **Contracts** -- OpenAPI specs in `specs/apps/*/contracts/`
3. **Tests** -- Unit, integration, E2E, and accessibility tests
4. **Documentation** -- READMEs, docs/, governance/, and inline documentation

A feature change is not complete until all four categories are addressed.

## What Must Be Updated

### 1. Specs (Gherkin Feature Files)

**Location**: `specs/apps/*/be/gherkin/`, `specs/apps/*/fe/gherkin/`, `specs/libs/*/`

**Update when:**

- Adding a new endpoint, procedure, command, or user-facing behavior -- add scenarios
- Modifying request/response shapes, validation rules, or error handling -- update scenarios
- Removing an endpoint, procedure, or command -- remove or archive scenarios
- Changing authentication or authorization requirements -- update scenarios

**Automated enforcement**: `rhino-cli spec-coverage validate` catches missing step definitions. Nx cache inputs include Gherkin specs so stale specs invalidate test caches.

### 2. Contracts (OpenAPI Specs)

**Location**: `specs/apps/*/contracts/`

**Update when:**

- Adding a new REST endpoint -- add path and schema definitions
- Changing request or response shapes -- update schema definitions
- Adding or removing query parameters, headers, or authentication schemes
- Changing status codes or error response formats
- Deprecating or removing an endpoint

**Automated enforcement**: `codegen` targets generate types from contracts. Stale contracts cause `typecheck` to fail because generated types do not match the implementation.

### 3. Tests

**Update when:**

- **Unit tests**: Any logic change requires updated unit tests. Coverage thresholds (90% for backends, 70-80% for frontends) enforce this.
- **Integration tests**: Changes to database interactions, external service calls, or cross-component behavior require updated integration tests.
- **E2E tests**: Changes to user-facing flows, API contracts, or full-stack behavior require updated E2E tests.
- **Accessibility tests**: UI changes require accessibility verification (static analysis via oxlint jsx-a11y plugin, manual WCAG AA checks).

**Automated enforcement**: Coverage thresholds in `test:quick` catch missing unit tests. `spec-coverage` catches missing step definitions.

### 4. Documentation

**Update when:**

- Adding a new feature that users or developers need to know about
- Changing API behavior that is documented in READMEs or docs/
- Adding or removing configuration options
- Changing architectural boundaries (C4 diagrams in specs/)
- Adding or removing dependencies that affect setup instructions

**Manual enforcement**: Documentation updates require human judgment about what is relevant. AI agents should identify documentation that references the changed feature and update it proactively.

## The Completeness Checklist

Before declaring a feature change complete, verify:

- [ ] **Gherkin specs** reflect the new/changed/removed behavior
- [ ] **OpenAPI contracts** reflect the new/changed/removed API surface (if applicable)
- [ ] **Unit tests** cover the new/changed logic (coverage thresholds met)
- [ ] **Integration tests** cover cross-component interactions (if applicable)
- [ ] **E2E tests** cover user-facing flows (if applicable)
- [ ] **Documentation** reflects the new/changed behavior (READMEs, docs/, inline)
- [ ] **C4 diagrams** reflect architectural changes (if applicable)
- [ ] **specs/README.md** updated (if project structure changed)

## What This Applies To

This convention applies to ALL changes that alter observable behavior:

| Change Type                                | Requires Artifact Updates?    | Which Artifacts?                       |
| ------------------------------------------ | ----------------------------- | -------------------------------------- |
| New feature                                | Yes                           | All applicable                         |
| Feature modification                       | Yes                           | All affected artifacts                 |
| Feature deletion                           | Yes                           | Remove/archive related artifacts       |
| Refactor that changes behavior             | Yes                           | Specs, tests, possibly contracts       |
| Refactor that preserves behavior           | No (behavior unchanged)       | None (unless tests need restructuring) |
| Bug fix that matches existing spec         | No (spec was already correct) | Tests only (add regression test)       |
| Bug fix that changes spec                  | Yes                           | Spec + tests + possibly contracts      |
| Dependency upgrade with no behavior change | No                            | None                                   |
| Dependency upgrade with behavior change    | Yes                           | All affected artifacts                 |

## Examples

### PASS: Complete feature addition

A developer adds a `GET /api/products/:id` endpoint to a demo backend.

They update, in the same commit or PR:

1. `specs/apps/a-demo/contracts/` -- add path and response schema
2. `specs/apps/a-demo/be/gherkin/products/get-product.feature` -- add scenarios
3. Unit tests -- test service function with mocked repository
4. Integration tests -- test with real database
5. E2E tests -- test full HTTP flow
6. `specs/apps/a-demo/c4/` -- update component diagram if new component

### FAIL: Code without specs

A developer adds the endpoint but does not add Gherkin scenarios or update the OpenAPI contract. `spec-coverage` fails. `codegen` produces stale types. The change is incomplete.

### FAIL: Code and specs without tests

A developer adds the endpoint and updates specs and contracts but does not write tests. Coverage drops below 90%. `test:quick` fails. The change is incomplete.

### PASS: Complete feature deletion

A developer removes the `DELETE /api/products/:id` endpoint.

They update, in the same commit or PR:

1. `specs/apps/a-demo/contracts/` -- remove path definition
2. `specs/apps/a-demo/be/gherkin/products/delete-product.feature` -- remove scenarios
3. Remove related unit, integration, and E2E tests
4. Update any documentation that referenced the endpoint

### PASS: Bug fix with no spec change

A developer fixes a null pointer in the product service. The existing Gherkin scenario already described the correct behavior. The fix restores compliance with the spec.

They add a regression unit test but do not change specs, contracts, or documentation. The spec was already correct.

## Scope

This convention applies to:

- All directories under `apps/`
- All directories under `libs/`
- All directories under `apps-labs/`
- All related artifacts in `specs/`, `docs/`, and `governance/`

It does not apply to:

- `plans/` -- planning documents describe intentions, not implementation artifacts
- `generated-contracts/` -- auto-generated; update the source spec instead
- Governance documents that are not tied to specific features

## Tools and Automation

- **`rhino-cli spec-coverage validate`**: Enforces Gherkin spec-to-test mapping. Integrated into `test:quick`.
- **`codegen` Nx target**: Generates types from OpenAPI specs. Stale contracts cause `typecheck` to fail.
- **Coverage thresholds**: `rhino-cli test-coverage validate` enforces minimum line coverage per project.
- **Nx cache inputs**: Gherkin specs are declared as inputs for test targets, invalidating caches when specs change.
- **`repo-rules-checker`**: Validates that specs folders exist for apps that require them.

## Related Documentation

- [Specs-Application Sync Convention](./specs-application-sync.md) -- Bidirectional sync between specs/ and application code
- [Three-Level Testing Standard](./three-level-testing-standard.md) -- Unit, integration, and E2E testing architecture
- [Code Quality Convention](./code.md) -- Automated quality gates
- [BDD Spec-to-Test Mapping](../infra/bdd-spec-test-mapping.md) -- Gherkin spec consumption at each test level
- [Nx Target Standards](../infra/nx-targets.md) -- Canonical target names and caching rules
- [Implementation Workflow Convention](../workflow/implementation.md) -- Three-stage workflow where completeness is verified at each stage
