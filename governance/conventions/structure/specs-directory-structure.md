---
title: "Specs Directory Structure Convention"
description: Canonical directory structure for Gherkin feature files, C4 architecture diagrams, and OpenAPI contracts in the specs/ directory
category: explanation
subcategory: conventions
tags:
  - conventions
  - specs
  - gherkin
  - directory-structure
  - organization
  - c4-diagrams
  - openapi
created: 2026-04-02
updated: 2026-04-02
---

# Specs Directory Structure Convention

The `specs/` directory contains all behavioral specifications (Gherkin feature files), architectural diagrams (C4), and API contracts (OpenAPI) for the monorepo. This convention codifies the canonical directory structure that all projects must follow.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The directory structure communicates spec scope through path segments. Reading a path like `specs/apps/organiclever/be/gherkin/expenses/expense-management.feature` immediately reveals the project, layer, domain, and feature without any external metadata or configuration.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: CLI specs use a flat structure under `gherkin/` because CLI commands are independent operations that do not group into business domains. Adding domain subdirectories with one or two files each would create indirection without value.

- **[Documentation First](../../principles/content/documentation-first.md)**: The specs directory serves as living documentation of system behavior. Gherkin features describe what the system does in human-readable language, C4 diagrams describe architectural context, and OpenAPI contracts describe API surfaces.

## Conventions Implemented/Respected

This convention implements/respects the following conventions:

- **[Specs-Application Sync Convention](../../development/quality/specs-application-sync.md)**: The directory structure enables bidirectional sync between specs and application code. The path pattern mirrors the app/lib structure in the workspace.

- **[BDD Spec-Test Mapping](../../development/infra/bdd-spec-test-mapping.md)**: The Gherkin directory structure directly supports the mapping between feature files and test implementations across all three testing levels.

- **[Three-Level Testing Standard](../../development/quality/three-level-testing-standard.md)**: All three test levels (unit, integration, E2E) consume the same Gherkin specs from this directory structure. Only step implementations differ.

## Purpose

This convention establishes the canonical directory layout for the `specs/` directory. It defines how Gherkin feature files, C4 architecture diagrams, and OpenAPI contracts are organized across apps and libs, ensuring consistency, discoverability, and correct tool integration.

## Scope

### What This Convention Covers

- **Gherkin feature file placement** for apps (BE, FE, CLI, build-tools) and libs
- **Domain subdirectory rules** for grouping related feature files
- **C4 diagram placement** within app spec directories
- **OpenAPI contract placement** within app spec directories
- **README.md index files** at each navigational level

### What This Convention Does NOT Cover

- **Gherkin writing standards** (covered by [Acceptance Criteria Convention](../../development/infra/acceptance-criteria.md))
- **C4 diagram content** (covered by C4 model documentation within each project)
- **OpenAPI spec authoring** (covered by contract project documentation)
- **Test implementation** (covered by [Three-Level Testing Standard](../../development/quality/three-level-testing-standard.md))

## Canonical Path Pattern

### Gherkin Feature Files

The canonical path pattern for Gherkin feature files is:

```
specs/{scope}/{name}/{layer}/gherkin/{domain}/{feature}.feature
```

Where:

- **`{scope}`** = `apps` or `libs`
- **`{name}`** = project name (e.g., `ayokoding`, `oseplatform`, `rhino`, `organiclever`, `golang-commons`, `ts-ui`)
- **`{layer}`** = `be`, `fe`, `cli`, or `build-tools` (apps only; omitted for libs)
- **`{domain}`** = business domain grouping folder (e.g., `expenses/`, `authentication/`, `health/`)
- **`{feature}`** = feature file name describing the behavior

### Domain Subdirectory Rules

The rules for domain subdirectories vary by layer type:

**BE and FE specs** ALWAYS use domain subdirectories under `gherkin/`. Each domain folder groups related feature files:

```
specs/apps/organiclever/be/gherkin/expenses/expense-management.feature
specs/apps/organiclever/be/gherkin/expenses/attachments.feature
specs/apps/organiclever/be/gherkin/authentication/password-login.feature
specs/apps/ayokoding/fe/gherkin/accessibility/accessibility.feature
specs/apps/organiclever/fe/gherkin/authentication/google-login.feature
```

A domain folder may contain one or many feature files. Group features by business domain, not by technical concern.

**CLI specs** use a flat structure under `gherkin/` with NO domain subdirectories. Each feature file corresponds to one CLI command:

```
specs/apps/rhino/cli/gherkin/doctor.feature
specs/apps/rhino/cli/gherkin/env-backup.feature
specs/apps/rhino/cli/gherkin/spec-coverage-validate.feature
specs/apps/ayokoding/cli/gherkin/links-check.feature
specs/apps/oseplatform/cli/gherkin/links-check.feature
```

**Rationale for CLI exception**: CLI commands are independent operations, not grouped into business domains. Domain folders containing one or two files each would add indirection without value. The flat structure communicates that each file is an independent command specification.

**Build-tools specs** use domain subdirectories under `gherkin/`:

```
specs/apps/ayokoding/build-tools/gherkin/index-generation/index-generation.feature
```

**Lib specs** use package or module subdirectories under `gherkin/` (no layer segment because libs do not have BE/FE/CLI layers):

```
specs/libs/golang-commons/gherkin/testutil/capture-stdout.feature
specs/libs/golang-commons/gherkin/timeutil/timestamp.feature
specs/libs/ts-ui/gherkin/button/button.feature
specs/libs/ts-ui/gherkin/dialog/dialog.feature
specs/libs/hugo-commons/gherkin/links/check-links.feature
```

## Full Directory Structure

The complete `specs/` directory follows this layout:

```
specs/
├── README.md
├── apps/
│   └── {app-name}/
│       ├── README.md
│       ├── c4/                              # C4 architecture diagrams
│       │   ├── README.md
│       │   ├── context.md                   # System Context diagram
│       │   ├── container.md                 # Container diagram
│       │   ├── component-be.md              # Backend Component diagram
│       │   └── component-fe.md              # Frontend Component diagram
│       ├── contracts/                       # OpenAPI specs (if applicable)
│       │   ├── README.md
│       │   ├── openapi.yaml                 # Root OpenAPI document
│       │   ├── paths/                       # Path definitions
│       │   ├── schemas/                     # Schema definitions
│       │   ├── examples/                    # Request/response examples
│       │   └── generated/                   # Bundled output (gitignored content)
│       ├── be/                              # Backend layer
│       │   ├── README.md
│       │   └── gherkin/
│       │       ├── README.md
│       │       └── {domain}/               # Domain subdirectories (required)
│       │           └── {feature}.feature
│       ├── fe/                              # Frontend layer
│       │   ├── README.md
│       │   └── gherkin/
│       │       ├── README.md
│       │       └── {domain}/               # Domain subdirectories (required)
│       │           └── {feature}.feature
│       ├── cli/                             # CLI layer
│       │   └── gherkin/
│       │       ├── README.md
│       │       └── {command}.feature        # Flat structure (no domain dirs)
│       └── build-tools/                     # Build tools layer
│           └── gherkin/
│               └── {domain}/               # Domain subdirectories (required)
│                   └── {feature}.feature
├── libs/
│   └── {lib-name}/
│       ├── README.md
│       └── gherkin/
│           └── {package}/                   # Package subdirectories
│               └── {feature}.feature
└── apps-labs/
    └── README.md                            # Placeholder for experimental apps
```

### Which Projects Have Which Directories

Not every project has all directories. The presence of `c4/`, `contracts/`, or specific layer directories depends on the project:

- **`c4/`**: Present for multi-layer app groups (e.g., `ayokoding`, `oseplatform`, `organiclever`)
- **`contracts/`**: Present only for apps with OpenAPI contract specs (e.g., `organiclever`)
- **Layer directories** (`be/`, `fe/`, `cli/`, `build-tools/`): Present only for layers that exist in the app group

## README Index Files

Each navigational directory level should contain a `README.md` file that indexes its contents. This follows the same GitHub compatibility pattern used throughout the repository (see [File Naming Convention](./file-naming.md)).

README files serve as entry points when browsing the specs directory on GitHub, providing context about what specifications exist at each level.

## Adding New Specs

### Adding a Feature File to an Existing Project

1. Identify the correct layer (`be`, `fe`, `cli`, or `build-tools`)
2. For BE/FE/build-tools: place the file in the appropriate domain subdirectory, creating the domain folder if it does not exist
3. For CLI: place the file directly under `gherkin/` with no domain subdirectory
4. Update the relevant `README.md` index file

### Adding Specs for a New Project

1. Create the project directory under `specs/apps/{name}/` or `specs/libs/{name}/`
2. Create a `README.md` at the project level
3. Create the appropriate layer directories with `gherkin/` subdirectories
4. For apps with multiple layers, create `c4/` with the standard C4 diagram files
5. For apps with API contracts, create `contracts/` with the OpenAPI structure

### Adding Specs for a New Lib

1. Create `specs/libs/{lib-name}/`
2. Create a `README.md` at the lib level
3. Create `gherkin/` directly under the lib name (no layer segment)
4. Create package subdirectories under `gherkin/` matching the lib's module structure

## Enforcement

### Automated Validation

The `rhino-cli spec-coverage validate` command validates that all Gherkin feature files under `specs/` have corresponding test implementations. It uses recursive globs (`**/*.feature`) to discover feature files, so it works correctly with both:

- **Nested structures** (BE/FE/build-tools/libs with domain subdirectories)
- **Flat structures** (CLI with no domain subdirectories)

The `spec-coverage` target runs as part of the pre-push hook for projects that have it configured. It ensures specs and application code stay synchronized.

### Manual Verification

When reviewing changes to the `specs/` directory, verify:

- [ ] Feature files follow the canonical path pattern for their layer type
- [ ] BE and FE specs use domain subdirectories (never flat under `gherkin/`)
- [ ] CLI specs are flat under `gherkin/` (never use domain subdirectories)
- [ ] Lib specs use package subdirectories under `gherkin/`
- [ ] README.md index files exist at each navigational level
- [ ] New projects include the appropriate directory scaffolding

## Related Documentation

- [Specs-Application Sync Convention](../../development/quality/specs-application-sync.md) - Bidirectional sync between specs and application code
- [BDD Spec-Test Mapping](../../development/infra/bdd-spec-test-mapping.md) - How specs map to test implementations
- [Three-Level Testing Standard](../../development/quality/three-level-testing-standard.md) - Unit, integration, and E2E testing levels consuming these specs
- [Acceptance Criteria Convention](../../development/infra/acceptance-criteria.md) - Gherkin writing standards for feature files
- [File Naming Convention](./file-naming.md) - General file naming patterns (README.md exception applies here)
- [Plans Organization Convention](./plans.md) - Similar convention for plans/ directory structure

---

**Last Updated**: 2026-04-02
