# OSE LMS API Contract

OpenAPI 3.1 specification for the OSE Learning Management System backend REST API.

## Purpose

This contract defines the exact shape of every request and response for `ose-lms-be`. It is the
**single source of truth** for API types — the service generates its response models from this
spec rather than hand-writing them, so a handler cannot quietly diverge from the published shape.

## Quick Start

```bash
# Lint the contract (bundles first, then runs Spectral)
nx run ose-lms-contracts:lint

# Bundle into single resolved YAML + JSON
nx run ose-lms-contracts:bundle

# Generate browsable API documentation
nx run ose-lms-contracts:docs
# Open specs/apps/ose/lms-be/contracts/generated/docs/index.html
```

## File Structure

```
contracts/
├── openapi.yaml          # Root spec with $ref mappings
├── .spectral.yaml        # Linting rules (camelCase enforcement)
├── project.json          # Nx project targets
├── paths/                # Endpoint definitions by domain
│   ├── health.yaml       # GET /api/v1/health
│   └── hello.yaml        # GET /api/v1/hello
├── schemas/              # Data type definitions
│   ├── health.yaml       # HealthResponse
│   └── hello.yaml        # HelloResponse
└── generated/            # Bundle output (ignored, rebuilt by the bundle target; README is tracked)
    ├── openapi-bundled.yaml
    ├── openapi-bundled.json
    └── docs/index.html
```

## Modifying the Contract

1. Edit the relevant file in `schemas/` or `paths/`
2. Run `nx run ose-lms-contracts:lint` to validate
3. Run `nx run ose-lms-contracts:bundle` to regenerate the bundled spec
4. Run codegen for the service: `nx run ose-lms-be:codegen`
5. Fix any compile errors in the service
6. Commit the contract changes only. Both generated trees are ignored: this folder's
   `generated/` bundle output (apart from its tracked directory README) and the service's
   `generated-contracts/` model output.

## Nx Cache Integration

The bundled contract path is an explicit Nx cache input for `ose-lms-be`'s test targets, so
re-running codegen triggers a cache miss and re-runs the affected tests rather than serving a
stale green result.

## Adoption Status

| App        | Codegen target | generated-contracts in inputs |
| ---------- | :------------: | :---------------------------: |
| ose-lms-be |      yes       |              yes              |

## Rules

- All JSON field names use **strict camelCase** — zero exceptions
- Every schema must have a `description`
- Changes to this contract trigger codegen for `ose-lms-be` via the Nx dependency graph

- [paths](./paths/README.md) — one file per endpoint, keyed by the URL path
- [schemas](./schemas/README.md) — the response payload shapes the endpoints refer to
- [generated](./generated/README.md) — rebuilt OpenAPI bundles and browsable API documentation
