---
description: The run/install targets required on CLI applications, the install/test:e2e/test:e2e:ui/test:e2e:report targets required on Playwright *-e2e projects, and the test:e2e/test:coverage:e2e/test:coverage:behaviour/serve targets required on Dotnet/Reqnroll *-be-e2e projects.
when_to_use: Use when scaffolding a new CLI application or a new *-e2e project, whether a Playwright runner or a Dotnet/Reqnroll runner.
---

# Mandatory Targets — CLI and E2E Test Projects

## CLI Applications

Executable CLIs and similar tools:

| Target    | Requirement                                           |
| --------- | ----------------------------------------------------- |
| `run`     | Execute the application through its project toolchain |
| `install` | Restore or sync project dependencies                  |

## E2E Test Projects

Playwright suites (`*-e2e`) — see [Dotnet/Reqnroll E2E Test Projects](#dotnetreqnroll-e2e-test-projects)
below for the non-Playwright `*-be-e2e` shape:

| Target            | Requirement                  |
| ----------------- | ---------------------------- |
| `install`         | Install npm dependencies     |
| `test:e2e`        | Run all tests headlessly     |
| `test:e2e:ui`     | Run tests with Playwright UI |
| `test:e2e:report` | Open the HTML test report    |

**Execution strategy**: `test:e2e` never runs through pre-commit, pre-push, PR/main gates,
`test:quick`, or a static coverage target. Developers run impacted scenarios manually; scheduled
full-quality workflows run complete Integration suites before complete unfiltered E2E suites.

**BDD suites**: When the E2E project uses playwright-bdd, `test:e2e` runs
`npx bddgen && npx playwright test`. The `bddgen` step regenerates `.features-gen/`
spec files from the Gherkin feature files before Playwright executes them.
See `apps/organiclever-be-e2e/project.json` for a canonical product-app example.

An E2E project also exposes `test:coverage:e2e` and `test:coverage:behaviour`. These validators
statically prove adapter completeness and exemption validity without running Playwright. The owning
corpus is an explicit Nx input of both coverage and runtime targets.

### Dotnet/Reqnroll E2E Test Projects

A `*-be-e2e` project binding Gherkin with Reqnroll/xUnit instead of Playwright (its backend's own
implementation language, not the test framework, drives this choice — see
`apps/ose-id-be-e2e/project.json` for the canonical example):

| Target                    | Requirement                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `test:e2e`                | Run all Reqnroll/xUnit scenarios headlessly (`dotnet test`)                                                                                      |
| `test:coverage:e2e`       | Statically prove adapter completeness, same as the Playwright shape                                                                              |
| `test:coverage:behaviour` | Statically prove exemption validity, same as the Playwright shape                                                                                |
| `serve`                   | Sanctioned exception — see `target-naming-rules.md`; orchestrates a multi-process local stack with fixture profiles for manual HTTP verification |

`install` and `test:e2e:ui`/`test:e2e:report` are Playwright/npm-specific and inapplicable here
(omitted per `target-naming-rules.md`'s "omit an inapplicable target" rule); dependency restore is
implicit in `dotnet test`, and there is no Playwright UI runner or HTML report to open.
