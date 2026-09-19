---
description: The canonical target-name reference table for the remaining targets — E2E UI/report variants, dev/start/run, and codegen/docs/install/clean — with purpose and when-required columns.
when_to_use: Use when checking whether an E2E, server, or utility target name already exists in the canonical vocabulary before adding a new one to project.json.
---

# Target Naming Standards — Canonical Target Reference (E2E and Utility Targets)

Continued from
[Canonical Target Reference (Lifecycle Targets)](./target-naming-canonical-names.md).
Aliases (`serve` as a `dev`/`start` stand-in, `start:dev`, `unit-test`) are anti-patterns. The sole
exception is `serve` on a no-own-app E2E orchestrator project — see
[Nx Target Naming Rules](./target-naming-rules.md).

| Target            | Purpose                                                              | When Required                     |
| ----------------- | -------------------------------------------------------------------- | --------------------------------- |
| `test:e2e:ui`     | Run E2E tests with interactive Playwright UI                         | E2E test projects                 |
| `test:e2e:report` | Open the last E2E HTML report                                        | E2E test projects                 |
| `dev`             | Start local development server with hot-reload                       | Apps with dev servers             |
| `start`           | Start server in production mode                                      | Apps with production server mode  |
| `run`             | Execute the application directly                                     | CLI applications                  |
| `codegen`         | Generate code from OpenAPI contract spec into `generated-contracts/` | Demo apps with contract types     |
| `docs`            | Generate browsable API documentation from contract spec              | Contract spec projects            |
| `install`         | Install project-local dependencies                                   | E2E suites, Rust CLIs             |
| `clean`           | Remove build artifacts and caches                                    | Projects with large build outputs |
