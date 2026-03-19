# Demo API Contract

OpenAPI 3.1 specification for the OrganicLever demo expense tracker REST API.

## Purpose

This contract defines the exact shape of every request and response across all demo backends
(11 languages) and frontends (3 frameworks). It is the **single source of truth** for API types —
code generators produce language-specific types, encoders, and decoders from this spec.

## Quick Start

```bash
# Lint the contract (bundles first, then runs Spectral)
nx run demo-contracts:lint

# Bundle into single resolved YAML + JSON
nx run demo-contracts:bundle

# Generate browsable API documentation
nx run demo-contracts:docs
# Open specs/apps/demo/contracts/generated/docs/index.html
```

## File Structure

```
contracts/
├── openapi.yaml          # Root spec with $ref mappings
├── .spectral.yaml        # Linting rules (camelCase enforcement)
├── redocly.yaml          # Documentation theme config
├── project.json          # Nx project targets
├── paths/                # Endpoint definitions by domain
├── schemas/              # Data type definitions
├── examples/             # Example request/response pairs
└── generated/            # Output (gitignored)
    ├── openapi-bundled.yaml
    ├── openapi-bundled.json
    └── docs/index.html
```

## Modifying the Contract

1. Edit the relevant file in `schemas/` or `paths/`
2. Run `nx run demo-contracts:lint` to validate
3. Run `nx run demo-contracts:bundle` to regenerate the bundled spec
4. Run codegen for affected apps: `nx affected -t codegen`
5. Fix any compile errors in affected apps
6. Commit the contract changes (generated code is gitignored)

## Nx Cache Integration

Generated contract paths are explicit Nx cache inputs for `test:unit` and `test:quick` in all 11
backends and all 3 frontends. This ensures that re-running codegen (which changes the generated
files) triggers a cache miss and re-runs affected test targets.

The canonical input pattern used in backend `project.json` files:

```
"{projectRoot}/generated-contracts/**/*"
```

Python and Clojure backends use underscores (`generated_contracts`) to follow language naming
conventions. TypeScript frontends include `{projectRoot}/src/generated-contracts/**/*`. The
`codegen` target is also a `dependsOn` for both `typecheck` and `build` in every demo app.

## Adoption Status

The contract is consumed by all demo apps (11 backends, 3 frontends):

| App                       | Codegen target | generated-contracts in inputs |
| ------------------------- | :------------: | :---------------------------: |
| demo-be-golang-gin        |      yes       |              yes              |
| demo-be-java-springboot   |      yes       |              yes              |
| demo-be-java-vertx        |      yes       |              yes              |
| demo-be-elixir-phoenix    |      yes       |              yes              |
| demo-be-python-fastapi    |      yes       |              yes              |
| demo-be-rust-axum         |      yes       |              yes              |
| demo-be-fsharp-giraffe    |      yes       |              yes              |
| demo-be-ts-effect         |      yes       |              yes              |
| demo-be-kotlin-ktor       |      yes       |              yes              |
| demo-be-csharp-aspnetcore |      yes       |              yes              |
| demo-be-clojure-pedestal  |      yes       |              yes              |
| demo-fe-ts-nextjs         |      yes       |              yes              |
| demo-fe-ts-tanstack-start |      yes       |              yes              |
| demo-fe-dart-flutterweb   |      yes       |              yes              |

## Rules

- All JSON field names use **strict camelCase** — zero exceptions
- Every schema must have a `description`
- Changes to this contract trigger codegen for all demo apps via Nx dependency graph
