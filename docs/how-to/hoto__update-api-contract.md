---
title: How to Update the API Contract
description: Step-by-step guide for modifying the OpenAPI spec, regenerating types, and verifying all demo apps
category: how-to
tags:
  - openapi
  - codegen
  - contracts
  - demo-be
  - demo-fe
created: 2026-03-22
updated: 2026-03-22
---

# How to Update the API Contract

This guide explains how to modify the shared OpenAPI 3.1 specification and propagate changes
to all demo apps via codegen.

## Overview

The contract lives at `specs/apps/demo/contracts/` and is consumed by all demo apps:

```
OpenAPI spec  -->  bundle  -->  codegen  -->  generated-contracts/
(YAML files)     (bundled)     (per app)    (language-specific types)
```

## Steps

### 1. Modify the OpenAPI Spec

Edit files under `specs/apps/demo/contracts/`:

- **`paths/`** — Endpoint definitions (one file per domain)
- **`schemas/`** — Data type definitions (request/response shapes)
- **`examples/`** — Example request/response pairs

Follow the existing conventions:

- camelCase for all property names
- Reusable schemas in `schemas/`
- `$ref` for shared components

### 2. Lint and Bundle

```bash
# Lint validates the spec and bundles it
nx run demo-contracts:lint

# Or bundle only (no lint)
nx run demo-contracts:bundle
```

This produces `specs/apps/demo/contracts/generated/openapi-bundled.yaml` — the single file
consumed by all codegen targets.

### 3. Regenerate Types for All Apps

```bash
# Regenerate for all demo apps at once
nx run-many -t codegen --projects=demo-*

# Or regenerate for a specific app
nx run demo-be-golang-gin:codegen
```

Each app's `codegen` target depends on `demo-contracts:bundle`, so Nx ensures the bundle
is up to date before generating.

### 4. Update Implementations

If you added or changed endpoints:

- Update service/handler code in each affected backend
- Update frontend API client code if applicable
- The `typecheck` target will catch type mismatches:

```bash
nx affected -t typecheck
```

### 5. Update Gherkin Scenarios (If Needed)

If the contract change adds new endpoints or modifies behavior, add or update Gherkin
scenarios in `specs/apps/demo/be/gherkin/` (and `fe/gherkin/` for frontend changes).

See [How to Add a Gherkin Scenario](./hoto__add-gherkin-scenario.md) for the step-by-step
process.

### 6. Verify

```bash
# Run all quality gates for affected projects
nx affected -t test:quick

# Verify types compile
nx affected -t typecheck
```

### 7. Generate API Documentation (Optional)

```bash
nx run demo-contracts:docs
```

This generates browsable HTML documentation at
`specs/apps/demo/contracts/generated/docs/index.html`.

## What Happens on Push

The pre-push hook runs `nx affected -t test:quick`, which includes:

1. `codegen` (regenerates types from bundled spec)
2. `typecheck` (catches type mismatches)
3. `test:unit` (runs all Gherkin scenarios with mocked repos)
4. Coverage validation (>=90% for backends, >=70% for frontends)

If the contract change breaks any app, the pre-push hook catches it.

## Related Documentation

- [OpenAPI Contract](../../specs/apps/demo/contracts/README.md) — Spec structure and conventions
- [Project Dependency Graph](../reference/re__project-dependency-graph.md) — How contract changes propagate
- [Nx Target Standards](../../governance/development/infra/nx-targets.md) — Codegen target requirements
