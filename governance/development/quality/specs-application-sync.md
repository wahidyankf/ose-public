---
title: Specs-Application Sync Convention
description: Bidirectional synchronization requirement between specs/ and application code in apps/, libs/, and apps-labs/
category: explanation
subcategory: development
tags:
  - specs
  - architecture
  - c4-diagrams
  - gherkin
  - synchronization
  - quality
created: 2026-03-24
updated: 2026-03-24
---

# Specs-Application Sync Convention

The `specs/` directory and application code in `apps/`, `libs/`, and `apps-labs/` must stay in sync. When one changes in a way that affects external behavior or architecture, the other must be updated in the same commit or pull request. This is a bidirectional requirement: code changes that alter observable behavior must be reflected in specs, and spec changes that describe new or modified behavior must be backed by code.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Documentation First](../../principles/content/documentation-first.md)**: Specs are living documentation of system behavior and architecture. Allowing them to drift from reality turns them into misleading artifacts rather than authoritative sources of truth. Keeping them current is an instance of treating documentation as a first-class deliverable, not an afterthought.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The system's architecture and behavior should be fully legible from the repository. When C4 diagrams or Gherkin feature files diverge from the actual implementation, the system's behavior becomes implicit — knowable only by reading source code. Synchronization keeps behavior explicit.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: Stale specs are a symptom of treating spec updates as optional. This convention addresses the root cause by making synchronization a mandatory part of every relevant change, not a periodic cleanup task.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Where synchronization can be enforced automatically — such as Nx cache inputs that include Gherkin specs, or `rhino-cli spec-coverage validate` for CLI apps — automation is preferred. Manual checking is reserved for architectural changes that require human judgment.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Three-Level Testing Standard](./three-level-testing-standard.md)**: All three test levels (unit, integration, E2E) consume Gherkin feature files from `specs/`. If feature files do not reflect current API behavior, tests consuming those specs validate the wrong contract.

- **[BDD Spec-to-Test Mapping](../infra/bdd-spec-test-mapping.md)**: The mandatory 1:1 mapping between CLI commands and feature file `@tags` requires that specs and code evolve together. Adding a command without a spec, or removing a command without removing its spec, violates this mapping.

## What Must Stay in Sync

### C4 Diagrams

C4 diagrams under `specs/apps/*/c4/` document architecture at the container and component levels. They must reflect the actual system at all times.

**Update C4 diagrams when:**

- Adding or removing an application (`apps/`, `apps-labs/`) or library (`libs/`)
- Changing the runtime technology of an existing app (e.g., Hugo → Next.js, Go/Gin → Go/Fiber)
- Introducing a new data store (PostgreSQL database, Redis cache, S3 bucket)
- Adding or removing a new external integration (third-party API, authentication provider, CDN)
- Changing how containers communicate (new HTTP boundary, new message queue, new tRPC procedure that crosses a container boundary)
- Changing the deployment target in a way that creates a new runtime boundary (e.g., a serverless function split off from a monolith)

**C4 scope per level:**

- **Context diagram**: Update when adding/removing actors, external systems, or top-level system boundaries
- **Container diagram**: Update when adding/removing deployable units, data stores, or major technology changes
- **Component diagram**: Update when adding/removing tRPC routers, REST resource groups, major page groups, or significant internal subsystems

### Gherkin Feature Files

Gherkin feature files define the observable behavior of the system from a stakeholder perspective. They must describe what the system actually does.

**Update Gherkin specs when:**

- Adding a new REST endpoint or tRPC procedure — add a scenario describing its behavior
- Removing an endpoint or procedure — remove or archive the corresponding scenario
- Changing the HTTP method, path, request shape, or response shape of an existing endpoint
- Changing authentication or authorization requirements for an endpoint
- Changing validation rules that affect the observable API contract (e.g., a field becomes required, a maximum length changes)
- Adding or removing a major UI page or flow that has acceptance criteria

**Do not add Gherkin scenarios for:**

- Internal implementation details (private functions, internal state machines)
- Framework-level behavior that is not part of the application's acceptance criteria

### specs/ README Files

README files inside `specs/apps/*/` and `specs/libs/*/` describe project structure, BDD framework in use, and how feature files are organized. They must reflect current reality.

**Update specs README files when:**

- Renaming an app or lib — rename the corresponding `specs/` folder and update its README
- Removing an app or lib — remove the corresponding `specs/` folder
- Changing the BDD framework for a project (e.g., Godog → Cucumber)
- Reorganizing feature files within a spec folder (new domain groupings, renamed subdirectories)

### specs/README.md

The root `specs/README.md` lists all projects with specs. Update it when:

- Adding a new project that requires specs
- Removing a project
- Renaming a project

## When to Check Synchronization

Check and update specs in the same commit as the application change for:

- Adding, removing, or renaming an application (`apps/`, `libs/`, `apps-labs/`)
- Changing framework or runtime technology for an existing application
- Adding or removing a REST endpoint, tRPC procedure, GraphQL resolver, or equivalent API surface
- Adding or removing a major UI page or route
- Introducing a new data store or removing an existing one
- Adding or removing an external integration that appears in the C4 context or container diagram
- Adding or removing a CLI command (covered by mandatory `rhino-cli spec-coverage validate`)
- Changing deployment target in a way that creates a new architectural boundary

Do **not** update specs for:

- Bug fixes that do not change the observable API contract (the behavior described in specs was already the intended behavior)
- Styling changes, layout adjustments, or purely visual changes with no behavioral impact
- Internal refactors that do not change public interfaces, API contracts, or architectural boundaries
- Dependency version upgrades that do not change behavior visible to consumers
- Performance optimizations with unchanged interfaces
- Test-internal changes (renaming a test helper, restructuring mocks) that do not change what is tested

## Decision Guide: Architecture Change vs. Minor Change

Use this table when uncertain whether a change requires a spec update:

| Change Type                                                    | Spec Update Required?                                | Reasoning                                           |
| -------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| Add a new REST endpoint                                        | Yes — Gherkin + possibly C4 component                | New observable behavior                             |
| Remove a REST endpoint                                         | Yes — remove Gherkin scenarios                       | Observable behavior removed                         |
| Rename an endpoint path                                        | Yes — update Gherkin scenarios                       | Contract change                                     |
| Change request/response shape                                  | Yes — update Gherkin scenarios                       | Contract change                                     |
| Add optional query parameter with no behavioral change         | No                                                   | Internal implementation detail                      |
| Fix a bug where behavior now matches the existing spec         | No                                                   | Spec was already correct                            |
| Fix a bug by changing behavior (spec was wrong)                | Yes — update spec to match corrected behavior        | Spec was inaccurate                                 |
| Add a new tRPC router and procedures                           | Yes — Gherkin + C4 component diagram                 | New observable behavior and component               |
| Rename a tRPC procedure without changing its behavior          | Yes — update Gherkin tags/descriptions               | Name is part of the contract                        |
| Add a new database table or collection                         | Yes — C4 container diagram if it is a new data store | Architectural change                                |
| Add an index to an existing table                              | No                                                   | Internal implementation detail                      |
| Add a new third-party API integration                          | Yes — C4 context and container diagrams              | New external dependency                             |
| Replace one HTTP client library with another                   | No                                                   | Internal implementation detail, interface unchanged |
| Add a new Next.js page                                         | Yes — Gherkin scenario for user-facing behavior      | New observable behavior                             |
| Add a new internal React component                             | No                                                   | Internal implementation detail                      |
| Change a validation rule that clients can observe              | Yes — update Gherkin scenario                        | Contract change                                     |
| Change an internal validation rule that clients cannot observe | No                                                   | Internal implementation detail                      |
| Rename an app in `apps/`                                       | Yes — rename `specs/apps/` folder and update READMEs | Structural change                                   |
| Remove an app from `apps/`                                     | Yes — remove `specs/apps/` folder                    | Structural change                                   |
| Change Hugo to Next.js for an existing site                    | Yes — C4 container diagram technology label          | Architectural change                                |
| Upgrade Next.js from v15 to v16                                | No                                                   | Internal dependency, interface unchanged            |
| Add a new Nx library in `libs/` that is a public API           | Yes — add `specs/libs/` folder with feature files    | New public surface                                  |
| Add an internal utility used only within one app               | No                                                   | Not a public surface                                |

## Existing Patterns to Follow

### organiclever specs

`specs/apps/organiclever/` serves both the backend (`organiclever-be`) and frontend (`organiclever-fe`) from a shared set of specs:

- `specs/apps/organiclever/c4/` — C4 diagrams for the OrganicLever application architecture
- `specs/apps/organiclever-be/gherkin/` — Shared Gherkin scenarios consumed by the backend at unit, integration, and E2E levels
- `specs/apps/organiclever-fe/gherkin/` — Shared Gherkin scenarios consumed by the frontend
- `specs/apps/organiclever/contracts/` — OpenAPI 3.1 contract spec that both backend and frontend implement

When a new endpoint is added to the OpenAPI spec in `organiclever-contracts`, both the corresponding Gherkin scenarios and the C4 component diagram must be updated to reflect the new behavior and component.

### ayokoding-web specs

`specs/apps/ayokoding/` maintains C4 diagrams and Gherkin scenarios for the Next.js 16 fullstack platform:

- `specs/apps/ayokoding/c4/` — Architecture diagrams kept current with the Next.js App Router structure and tRPC routers
- `specs/apps/ayokoding/be/gherkin/` — Scenarios for tRPC procedures consumed by `ayokoding-web-be-e2e`

When a new tRPC router is added to `apps/ayokoding-web/`, a new component entry appears in the C4 component diagram and new scenarios are added to the Gherkin directory.

### CLI apps

CLI apps (`rhino-cli`, `ayokoding-cli`, `oseplatform-cli`) use the automated enforcement path:

- Each Cobra command file maps to a `@tag` in a Gherkin feature file
- `rhino-cli spec-coverage validate` enforces the 1:1 mapping automatically
- Adding a command without a spec causes `test:quick` to fail

See [BDD Spec-to-Test Mapping](../infra/bdd-spec-test-mapping.md) for the full CLI mapping rules.

## Examples

### PASS: Adding an endpoint with synchronized specs

A developer adds a `GET /api/products/:id` endpoint to `organiclever-be`.

They:

1. Update `specs/apps/organiclever/contracts/` (OpenAPI spec) with the new endpoint definition
2. Run `nx run organiclever-contracts:codegen` and related codegen targets
3. Add a Gherkin scenario to `specs/apps/organiclever-be/gherkin/products/get-product.feature`
4. Update the C4 component diagram in `specs/apps/organiclever/c4/` if the endpoint belongs to a new component
5. Implement the endpoint in `apps/organiclever-be/`

All changes are in a single commit or PR.

### FAIL: Adding an endpoint without updating specs

A developer adds `GET /api/products/:id` to `apps/organiclever-be/` but does not update the OpenAPI contract, Gherkin feature files, or C4 diagrams.

The `codegen` target dependency fails at `typecheck` because the generated types are stale. Even if `codegen` is run, the missing Gherkin scenario means the behavior is unspecified, and the C4 diagram no longer reflects what the system does.

This is a violation of the sync convention.

### PASS: Removing an app with synchronized cleanup

An app is removed from the monorepo.

The developer also:

1. Removes any app-specific references from the relevant `specs/apps/<app-name>/README.md`
2. Updates the root `specs/README.md` if it listed the app explicitly
3. Verifies no Gherkin scenarios reference app-specific step definitions

The C4 diagram is updated to remove the container if it was represented separately.

### FAIL: Renaming an app without updating specs

The team renames `apps/organiclever-fe` to `apps/organiclever-landing`. The `specs/apps/organiclever-fe/` folder is not renamed.

CI now has a mismatch: the app path and the spec path use different names. Reviewers and new contributors cannot determine whether `specs/apps/organiclever-fe/` refers to the current `organiclever-landing` app or a removed app. This is a violation.

### PASS: Bug fix with no spec change

A developer fixes a null pointer dereference in a Go repository function. The bug caused a 500 response where a 200 was expected. The existing Gherkin scenario for that endpoint already described the expected 200 behavior — the bug caused a deviation from the spec, and the fix restores compliance.

No spec changes are needed: the spec was correct and the code was wrong.

### PASS: Internal refactor with no spec change

A developer extracts a large tRPC router into two smaller routers for maintainability. The API surface (procedure names, input shapes, output shapes) is unchanged. No new procedures are added.

No Gherkin or C4 changes are needed: external behavior and container/component boundaries are unchanged.

## Scope

This convention applies to:

- All directories under `apps/`
- All directories under `libs/`
- All directories under `apps-labs/`
- All directories under `specs/`

It does not apply to:

- `docs/` — documentation follows its own conventions; spec synchronization is a code-and-architecture concern
- `governance/` — governance documents are not application code or acceptance specs
- `plans/` — planning documents describe intentions, not observable system behavior
- `generated-contracts/` — auto-generated code is not maintained manually; update the source spec instead

## Tools and Automation

- **`rhino-cli spec-coverage validate`**: Enforces spec-to-test mapping for CLI apps. Integrated into `test:quick`. Violations cause CI to fail.
- **Nx cache inputs**: `test:unit` and `test:quick` targets for API backends declare the project's Gherkin specs as inputs, so Nx invalidates cached results when Gherkin specs change.
- **Contract codegen target**: Generates types from the OpenAPI spec. Declared as a dependency of `typecheck` and `build`, so stale contracts are caught in CI before merge.
- **`repo-rules-checker`**: Validates that specs folders exist for apps that require them. Flags missing or misnamed spec folders.

## Related Documentation

- [Three-Level Testing Standard](./three-level-testing-standard.md) - How all three test levels consume shared Gherkin specs
- [BDD Spec-to-Test Mapping](../infra/bdd-spec-test-mapping.md) - Mandatory 1:1 mapping for CLI apps; three-level consumption for demo-be backends
- [Nx Target Standards](../infra/nx-targets.md) - Cache input declarations that include Gherkin specs
- [specs/README.md](../../../specs/README.md) - Spec directory organization and per-app spec structure
- [specs/README.md](../../../specs/README.md) - Spec directory organization and per-app spec structure
