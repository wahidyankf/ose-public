---
title: "Nx Target Standards"
description: Standardized Nx target definitions for apps and libs in the monorepo
category: explanation
subcategory: development
tags:
  - nx
  - targets
  - project-json
  - build
  - scripts
created: 2026-02-23
updated: 2026-03-04
---

# Nx Target Standards

Defines the standard Nx targets that apps and libs expose, what each target must do, and naming conventions that keep all projects consistent across the workspace.

## Execution Model

### Quality Gates (pre-push enforcement)

`typecheck`, `lint`, and `test:quick` run at two mandatory checkpoints — locally before push and
remotely before merge.

```mermaid
flowchart TD
    A[Developer pushes code] --> B[Pre-push hook]
    B --> C["typecheck<br/>nx affected -t typecheck"]
    B --> D["lint<br/>nx affected -t lint"]
    B --> E["test:quick<br/>nx affected -t test:quick"]
    C --> F{All pass?}
    D --> F
    E --> F
    F -- No --> G[Push blocked]
    F -- Yes --> H[Push succeeds]

    P[PR opened / updated] --> Q["GitHub Actions CI<br/>nx affected -t test:quick"]
    Q --> R{Pass?}
    R -- No --> S[PR merge blocked]
    R -- Yes --> T[PR merge allowed]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#029E73,color:#fff
    style D fill:#029E73,color:#fff
    style E fill:#029E73,color:#fff
    style F fill:#DE8F05,color:#fff
    style G fill:#CC78BC,color:#fff
    style H fill:#029E73,color:#fff
    style P fill:#0173B2,color:#fff
    style Q fill:#DE8F05,color:#fff
    style S fill:#CC78BC,color:#fff
    style T fill:#029E73,color:#fff
```

### Scheduled and On-Demand Testing

Deeper tests run outside the pre-push/PR cycle — on a schedule or triggered explicitly.

```mermaid
flowchart TD
    H["GitHub Actions<br/>cron 4× per day"] --> I["test:e2e<br/>per -e2e project"]

    J[On demand / CI matrix] --> K[test:unit]
    J --> L[test:integration]
    J --> M[test:e2e]

    style H fill:#0173B2,color:#fff
    style I fill:#CA9161,color:#fff
    style J fill:#0173B2,color:#fff
    style K fill:#CA9161,color:#fff
    style L fill:#CA9161,color:#fff
    style M fill:#CA9161,color:#fff
```

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Every project declares its capabilities through explicit targets. No implicit build or test mechanisms — if a project supports unit tests, it declares `test:unit`; if it has integration tests, it declares `test:integration`; if it has a dev server, it declares `dev`. The composition of `test:quick` is explicit in each project's `project.json`.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Targets integrate with Nx affected computation, caching, the pre-push hook, and the PR merge gate. Consistent naming allows workspace-level automation (`nx affected -t test:quick`) to work across all project types without special cases.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Each project exposes only the targets it actually needs. A Go CLI does not need `dev` or `start`. The full testing spectrum is composed from `test:quick`, `test:unit`, `test:integration`, and `test:e2e` — no aggregate wrapper target needed.

## Conventions Implemented/Respected

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: `project.json` follows Nx workspace conventions; target names follow the kebab-case + colon-variant pattern defined here.

- **[Reproducible Environments Convention](../workflow/reproducible-environments.md)**: Projects with local dependencies expose an `install` target so dependency state is always explicit and reproducible.

## Target Naming Standards

Use these canonical names. Aliases (`serve`, `start:dev`, `unit-test`) are anti-patterns.

| Target             | Purpose                                                              | When Required                     |
| ------------------ | -------------------------------------------------------------------- | --------------------------------- |
| `build`            | Produce deployable or runnable artifacts                             | Compiled and bundled projects     |
| `typecheck`        | Verify type correctness without producing artifacts                  | Statically typed languages        |
| `lint`             | Static analysis and code style checks                                | All projects                      |
| `test:quick`       | Fast quality gate for pre-push and PR merge; composed of fast checks | All projects                      |
| `test:unit`        | Isolated unit tests with no external dependencies                    | Projects with unit tests          |
| `test:integration` | Tests that require external services (DB, APIs, filesystem)          | Projects with integration tests   |
| `test:e2e`         | Run E2E tests headlessly against a running app                       | E2E test projects (`*-e2e`)       |
| `test:e2e:ui`      | Run E2E tests with interactive Playwright UI                         | E2E test projects                 |
| `test:e2e:report`  | Open the last E2E HTML report                                        | E2E test projects                 |
| `dev`              | Start local development server with hot-reload                       | Apps with dev servers             |
| `start`            | Start server in production mode                                      | Apps with production server mode  |
| `run`              | Execute the application directly                                     | CLI applications                  |
| `install`          | Install project-local dependencies                                   | E2E suites, Flutter, Go CLIs      |
| `clean`            | Remove build artifacts and caches                                    | Projects with large build outputs |

### Naming Rules

- Use `dev` for the development server — never `serve`, never `start:dev`
- Use `start` for the production server — never `serve`
- Use `test:quick` for the fast pre-push gate; `test:unit` for isolated unit tests; `test:integration` for tests requiring external services; `test:e2e` for end-to-end tests — run targets individually rather than through an aggregate wrapper
- Separate target variants with a colon (`build:web`, `test:e2e:ui`), not a hyphen or underscore
- All target names use lowercase with hyphens for multi-word names (`run-pre-commit`)

## Tag Convention

Tags are the standard mechanism for attaching structured metadata to projects in `project.json`. Nx uses tags for boundary enforcement (`@nx/enforce-module-boundaries`), graph filtering (`nx graph --focus`), and `nx affected` scoping. Consistent tags across the workspace allow tooling to query by project kind, framework, language, or product domain without parsing project names.

### Four-Dimension Scheme

Every project declares tags along four dimensions. Each dimension uses a fixed prefix and a controlled vocabulary.

| Dimension | Prefix      | Allowed Values                                        | Required                       | Purpose                                                       |
| --------- | ----------- | ----------------------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| Type      | `type:`     | `app`, `lib`, `e2e`                                   | Always                         | Distinguishes deployable apps, reusable libs, and test suites |
| Platform  | `platform:` | `hugo`, `cli`, `nextjs`, `spring-boot`, `playwright`  | Apps and e2e projects          | Framework or runtime environment                              |
| Language  | `lang:`     | `golang`, `ts`, `java`                                | Projects with application code | Primary language of source code                               |
| Domain    | `domain:`   | `ayokoding`, `oseplatform`, `organiclever`, `tooling` | Always                         | Business or product domain                                    |

### Special Rules

**Hugo sites omit `lang:`**: Hugo sites consist of templates and markdown content; `go.mod` and `go.sum` present in a Hugo project are Hugo module dependency files, not application source code. No application code is written in Go, so `lang:` does not apply.

**Go libs omit `platform:`**: A Go library has no framework or runtime boundary — only a primary language. Declare `type:lib` and `lang:golang`; omit `platform:`.

**Use `domain:tooling` for general-purpose utilities**: Projects that are not tied to a specific product domain (e.g., `rhino-cli`) use `domain:tooling`. Use a product domain tag only when the project belongs exclusively to that product.

### Current Project Tags

| Project                | Tags                                                                       |
| ---------------------- | -------------------------------------------------------------------------- |
| `ayokoding-web`        | `["type:app", "platform:hugo", "domain:ayokoding"]`                        |
| `ayokoding-cli`        | `["type:app", "platform:cli", "lang:golang", "domain:ayokoding"]`          |
| `rhino-cli`            | `["type:app", "platform:cli", "lang:golang", "domain:tooling"]`            |
| `organiclever-be`      | `["type:app", "platform:spring-boot", "lang:java", "domain:organiclever"]` |
| `organiclever-be-e2e`  | `["type:e2e", "platform:playwright", "lang:ts", "domain:organiclever"]`    |
| `organiclever-web`     | `["type:app", "platform:nextjs", "lang:ts", "domain:organiclever"]`        |
| `organiclever-web-e2e` | `["type:e2e", "platform:playwright", "lang:ts", "domain:organiclever"]`    |
| `oseplatform-cli`      | `["type:app", "platform:cli", "lang:golang", "domain:oseplatform"]`        |
| `oseplatform-web`      | `["type:app", "platform:hugo", "domain:oseplatform"]`                      |
| `hugo-commons`         | `["type:lib", "lang:golang"]`                                              |
| `golang-commons`       | `["type:lib", "lang:golang"]`                                              |

### Example: Complete Tag Declaration

A Spring Boot app for the OrganicLever domain declares all four dimensions:

```json
{
  "name": "organiclever-be",
  "tags": ["type:app", "platform:spring-boot", "lang:java", "domain:organiclever"]
}
```

A Go lib has no platform boundary and no domain, so it omits both:

```json
{
  "name": "golang-commons",
  "tags": ["type:lib", "lang:golang"]
}
```

### Anti-Patterns

- **Omitting required dimensions**: Every project must declare `type:` and `domain:`. Omitting them breaks graph queries and boundary rules that rely on these dimensions.
- **Inventing non-standard values**: Adding values outside the controlled vocabulary (e.g., `platform:express`, `lang:javascript`, `domain:internal`) fragments the tag space. Add new values only by updating this convention.
- **Using a non-prefixed format**: Tags must use the `dimension:value` prefix format (e.g., `type:app`). Bare tags such as `app` or `golang` are not queryable by dimension.
- **Adding a `stack:` dimension**: The four-dimension scheme captures type, platform, language, and domain. A separate `stack:` field duplicates `platform:` and `lang:` without adding information. Use the defined dimensions instead.
- **Tagging apps with `domain:tooling` when they belong to a product**: `domain:tooling` is for general-purpose dev utilities with no product affiliation. An app that serves a specific product must carry that product's domain tag.

## Mandatory Targets by Project Type

### All Projects

Every project in `apps/` and `libs/` must expose:

| Target       | Requirement                                                                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test:quick` | Complete in a few minutes (not tens of minutes); enforced by the pre-push hook and as a required GitHub Actions status check before PR merge                                                             |
| `lint`       | Exit non-zero on violations; enforced by the pre-push hook; **exception: Dart/Flutter omits this target** (see note below)                                                                               |
| `typecheck`  | Required for statically typed projects (TypeScript, Python/mypy, Dart/Flutter, Java with JSpecify + NullAway); enforced by the pre-push hook; skipped by Nx for projects that do not declare this target |

**Dart/Flutter exception — `lint` intentionally omitted**: `flutter analyze` combines type
checking and linting into a single pass. The pre-push hook runs `typecheck` → `lint`
sequentially — declaring both with the same `flutter analyze` command would execute it twice per
push with zero additional coverage. Flutter projects declare only `typecheck`; Nx silently skips
them for `nx affected -t lint`.

**`test:quick` composition** — each project decides which fast checks form its gate. The target runs its checks directly (calling the underlying tools, not other Nx targets) to avoid double execution when `lint` or `typecheck` are also run standalone by the pre-push hook. Common compositions:

| Project type       | Typical `test:quick` composition                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript app     | unit tests via vitest (typecheck and lint run separately in pre-push); Next.js/React apps with Gherkin specs also run integration tests in parallel — both vitest project names (`--project unit`, `--project integration`) execute concurrently, integration tests use `@amiceli/vitest-cucumber` reading the same feature files as the E2E suite with all dependencies fully mocked (no running service required) |
| Go app             | `go test -coverprofile=cover.out ./... && go tool go-test-coverage` — compiles and runs unit tests, then enforces ≥80% total coverage. The `go-test-coverage` tool is declared via the Go 1.24+ `tool` directive in each module's `go.mod` and configured via `.testcoverage.yml` at each project root.                                                                                                             |
| Java/Spring Boot   | unit tests (`mvn test`, includes `**/unit/**/*Test.java`) + integration tests (`mvn test -Pintegration`, includes `**/integration/**/*Test.java`) in parallel; the two Surefire include lists are mutually exclusive — neither profile runs the other tier's tests                                                                                                                                                  |
| Python app         | typecheck (mypy) + unit tests                                                                                                                                                                                                                                                                                                                                                                                       |
| Hugo site          | link check via the site's CLI tool (build runs separately via `nx build`)                                                                                                                                                                                                                                                                                                                                           |
| Flutter/Dart       | unit tests (`flutter test`); `flutter analyze` runs via `typecheck`, not `lint`                                                                                                                                                                                                                                                                                                                                     |
| Playwright `*-e2e` | run the linter directly (no unit tests to add beyond linting)                                                                                                                                                                                                                                                                                                                                                       |

The rule: include only checks that complete fast. If `test:unit` is slow for a project, exclude it from `test:quick` and run it separately. **The target must always exist** — even if it only runs the type checker — so the pre-push hook covers every project.

### Statically Typed Projects

TypeScript, Python (with mypy), Dart/Flutter:

| Target      | Requirement                                                                |
| ----------- | -------------------------------------------------------------------------- |
| `typecheck` | Run the type checker without emitting artifacts (`tsc --noEmit`, `mypy .`) |

**Not required for dynamically typed languages** (plain JavaScript, Ruby) or languages where compilation already enforces types and `build` covers it (Go, plain Java). **Exception**: Java projects that use JSpecify + NullAway declare `typecheck` because NullAway runs as a separate Error Prone plugin pass (via a dedicated Maven profile) that is not part of the standard `build`. The `typecheck` target also runs `rhino-cli validate-java-annotations` to enforce that every Java package has a `package-info.java` annotated with `@NullMarked` — packages without it are silently skipped by NullAway.

### Compiled and Bundled Projects

Projects that produce artifacts from a compilation or bundling step (Go, Java, Hugo, Next.js, Flutter):

| Target  | Requirement                                                          |
| ------- | -------------------------------------------------------------------- |
| `build` | Produce production-ready artifacts; declare `outputs` for Nx caching |

**Not required for interpreted languages** (Python, Ruby, plain Node.js scripts) where the source is the deployable artifact.

### Apps with Development Servers

Hugo sites, Next.js, Flutter web, Spring Boot, Python web apps:

| Target | Requirement                                       |
| ------ | ------------------------------------------------- |
| `dev`  | Start local server with live-reload or watch mode |

### Apps with Production Server Mode

Spring Boot, Next.js, Python web apps:

| Target  | Requirement                |
| ------- | -------------------------- |
| `start` | Serve the production build |

### Projects with Unit Tests

Spring Boot, Flutter, Python apps, TypeScript apps:

| Target      | Requirement                                                          |
| ----------- | -------------------------------------------------------------------- |
| `test:unit` | Run only isolated unit tests; must not require any external services |

### Projects with Integration Tests

Spring Boot, Python apps, TypeScript apps that test against DB/APIs, Go CLIs with BDD suites:

| Target             | Requirement                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `test:integration` | Run integration tests using in-process execution or mocking (MockMvc / MSW / godog `RunE`); no external services required; always cacheable |

**Go CLIs** expose `test:integration` for godog BDD tests: each command has a
`{stem}.integration_test.go` file with `//go:build integration` that drives the command in-process
via `cmd.RunE()` against controlled filesystem fixtures. The `test:integration` Nx target uses
`-tags=integration -run TestIntegration` to isolate these from unit tests. Tests are co-located in
the same `cmd/` package (not a separate folder) because they need direct access to unexported
package-level flag variables (`output`, `quiet`, `verbose`) — the idiomatic Go pattern for this
situation is `//go:build integration` in the same package. See
[BDD Spec-to-Test Mapping Convention](./bdd-spec-test-mapping.md) for the mandatory 1:1 mapping
between commands and feature file `@tags`.

**Go libs** (`hugo-commons`, `golang-commons`) also expose `test:integration` using the same Godog
BDD pattern. Because libs have no CLI commands, integration tests call the public package API
directly and use external test packages (`package foo_test`). They test complete library pipelines
(e.g., `CheckLinks` → `OutputLinksText/JSON/Markdown`) and realistic consumer scenarios rather than
isolated functions. Mock filesystem fixtures (tmpdir with controlled `.md` files) replace real Hugo
sites; `testutil.CaptureStdout` captures stdout from output functions. Feature files live in
`specs/{lib-name}/{package}/`.

### CLI Applications

Go CLIs and similar tools:

| Target    | Requirement                                              |
| --------- | -------------------------------------------------------- |
| `run`     | Execute the application (`go run main.go` or equivalent) |
| `install` | Sync dependencies (`go mod tidy` or equivalent)          |

### E2E Test Projects

Playwright suites (`*-e2e`):

| Target            | Requirement                  |
| ----------------- | ---------------------------- |
| `install`         | Install npm dependencies     |
| `test:e2e`        | Run all tests headlessly     |
| `test:e2e:ui`     | Run tests with Playwright UI |
| `test:e2e:report` | Open the HTML test report    |

**Execution strategy**: `test:e2e` is **not** part of the pre-push hook. It runs on a scheduled GitHub Actions cron job (twice daily per workflow) targeting each `*-e2e` project individually. This keeps pre-push fast while ensuring continuous E2E coverage against deployed or locally running services.

**BDD suites**: When the E2E project uses playwright-bdd, `test:e2e` runs
`npx bddgen && npx playwright test`. The `bddgen` step regenerates `.features-gen/`
spec files from the Gherkin feature files before Playwright executes them.
See `apps/organiclever-be-e2e/project.json` for the canonical example.

**`test:integration` with Cucumber JVM**: `organiclever-be` also exposes `test:integration` which
runs `mvn test -Pintegration`. This activates Cucumber JVM 7+ with MockMvc — the same Gherkin
feature files from `specs/organiclever-be/` are executed via a full Spring context but without a
running server. Unlike `test:e2e`, no live service is required.

### Hugo Sites

| Target  | Requirement                                            |
| ------- | ------------------------------------------------------ |
| `clean` | Remove `public/`, `resources/`, and `.hugo_build.lock` |

`ayokoding-web` also exposes `run-pre-commit` — a pre-commit hook target that rebuilds the CLI, updates titles from filenames, and regenerates navigation. This is site-specific automation, not a general Hugo convention.

## Workspace-Level Defaults

`nx.json` `targetDefaults` provide inherited behaviour for standard targets. Individual `project.json` files override these when the project differs (e.g., Hugo sites output to `public/` not `dist/`).

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"],
      "cache": true
    },
    "typecheck": {
      "cache": true
    },
    "lint": {
      "cache": true
    },
    "test:quick": {
      "cache": true
    },
    "test:unit": {
      "cache": true
    },
    "test:integration": {
      "cache": true
    },
    "test:e2e": {
      "cache": false
    }
  }
}
```

### Caching Rules

| Target             | Cached | Notes                                                                                                                         |
| ------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `build`            | Yes    | Declare `outputs` in `project.json` for cache restoration                                                                     |
| `typecheck`        | Yes    | Pure analysis; safe to cache against source changes                                                                           |
| `lint`             | Yes    | Pure static analysis; safe to cache                                                                                           |
| `test:quick`       | Yes    | Cache hit skips redundant pre-push runs                                                                                       |
| `test:unit`        | Yes    | Deterministic; safe to cache against source changes                                                                           |
| `test:integration` | Yes    | Uses in-process execution or mocking (MockMvc / MSW / godog `RunE`); fully deterministic; no external service state to detect |
| `dev`              | No     | Long-running process                                                                                                          |
| `start`            | No     | Long-running process                                                                                                          |
| `run`              | No     | Side-effectful execution                                                                                                      |
| `test:e2e`         | No     | Requires live app state; run via scheduled cron, not pre-push                                                                 |
| `test:e2e:ui`      | No     | Interactive process                                                                                                           |
| `test:e2e:report`  | No     | Reads filesystem state at invocation time                                                                                     |
| `install`          | No     | Must always run to ensure dep state                                                                                           |
| `clean`            | No     | Destructive operation                                                                                                         |

## Build Output Conventions

Declare the output directory in `project.json` `outputs` to enable Nx cache restoration.

| Project Type | Output Directory           |
| ------------ | -------------------------- |
| Go CLI       | `{projectRoot}/dist/`      |
| Hugo site    | `{projectRoot}/public/`    |
| Next.js      | `{projectRoot}/.next/`     |
| Flutter web  | `{projectRoot}/build/web/` |
| Spring Boot  | `{projectRoot}/target/`    |

Example override for a Hugo site:

```json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{projectRoot}/public"],
      "options": { "command": "bash build.sh" }
    }
  }
}
```

## Anti-Patterns

- **Non-standard target names**: `serve` instead of `dev`/`start`, `unit-test` instead of `test:unit`, `integration-test` instead of `test:integration`, `check` instead of `lint` or `typecheck`, bare `test` or `test:full` instead of a specific `test:*` variant
- **Missing `test:quick`**: Omitting the pre-push gate target silently excludes the project from `nx affected -t test:quick` — this breaks the workspace-wide hook
- **Missing `lint`**: Projects without `lint` cannot participate in workspace-wide lint runs or the pre-push hook lint gate
- **Heavy `test:quick`**: Including slow integration tests or E2E in `test:quick` defeats its purpose — keep the total to a few minutes, not tens of minutes
- **Mixing concerns in `test:unit`**: `test:unit` must not spin up databases, external APIs, or network services — those belong in `test:integration`
- **Disabling cache on `test:integration`**: Setting `cache: false` wastes CI time when integration tests use only in-process mocking (MockMvc / MSW) and are fully deterministic. Only disable if tests depend on live external services
- **`build` on interpreted-language projects**: Adding a no-op `build` to Python or Ruby just to appear consistent — if there is no compile step, there is no `build` target
- **`typecheck` on compile-enforced languages without additional analysis**: Go and plain Java enforce types through `build`; a separate `typecheck` that only re-runs the compiler is redundant. **Exception**: Java with JSpecify + NullAway warrants `typecheck` because NullAway is a distinct null-safety pass not included in `build`
- **Undeclared outputs**: Omitting `outputs` on `build` disables caching and forces full rebuilds on every run
- **Apps-only targets on libs**: Libs do not expose `dev` or `start`; those are app-specific concepts
- **Creating a `test:full` wrapper**: Adding a `test:full` that just chains other targets adds indirection without value — run `test:unit`, `test:integration`, and `test:e2e` directly or via CI matrix steps

## Principles Traceability

| Decision                                                                              | Principle                                                                                 |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Consistent target names across all projects                                           | [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) |
| `typecheck`, `lint`, `test:quick` enforced at pre-push; `test:quick` at PR merge gate | [Automation Over Manual](../../principles/software-engineering/automation-over-manual.md) |
| Minimum required targets per project type                                             | [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)      |
| `outputs` required for cacheable targets                                              | [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) |
| Four-dimension tag scheme with controlled vocabulary declared in every `project.json` | [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) |
