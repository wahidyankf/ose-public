---
description: "Which codegen tool runs for each app, and the Nx targets that invoke codegen and spec linting."
when_to_use: "Use when running codegen for an app or looking up which tool generates its client/server types."
---

# Codegen Tooling and Nx Targets

## Codegen Tooling

| Consumer                                          | Tool                    | Output Path                | Notes                                   |
| ------------------------------------------------- | ----------------------- | -------------------------- | --------------------------------------- |
| TS client (`organiclever-app-web`, `ose-app-web`) | `@hey-api/openapi-ts`   | `src/generated-contracts/` | Emits typed fetch client + schema types |
| F# server (`organiclever-be`, `ose-be`)           | `openapi-generator-cli` | `generated-contracts/`     | Emits Giraffe handler types + models    |
| Java server (`ose-lms-be`)                        | `openapi-generator-cli` | `generated-contracts/`     | Emits Spring handler types + models     |
| Go server (`roots-be`)                            | `go tool oapi-codegen`  | `generated-contracts/`     | Emits Gin `ServerInterface` + models    |

Generated directories are **not** committed. The root `.gitignore` ignores `**/generated-contracts/`
and `**/generated_contracts/`, so every fresh clone and worktree starts without them and
materializes them by running the app's `codegen` target. The `dependsOn: ["codegen"]` chain means
no Nx target ever consumes stale generated code, which is why there is no committed-output drift
gate to keep green. See
[Per-Project Generated Sources](../../workflow/worktree-setup/per-project-generated-sources.md)
for the one-time step a new worktree needs.

## Nx Targets

Each app that participates in contract-first development exposes these Nx targets in its `project.json`:

| Target    | Project                  | Command                                                            |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `codegen` | each consumer above      | Runs that row's tool against the bundled spec                      |
| `bundle`  | `<owner>-contracts`      | Bundles `openapi.yaml`; every `codegen` declares `dependsOn` on it |
| `lint`    | `<owner>-contracts`      | Validates and bundles the OpenAPI spec (Redocly or Spectral)       |
| `docs`    | `organiclever-contracts` | Generates browsable API documentation                              |

Run codegen for a specific app:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run <app>:codegen
```

Validate the spec itself:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-contracts:lint
```
