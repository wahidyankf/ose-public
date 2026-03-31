# Specs

Gherkin acceptance specifications for OSE Platform applications.

## What This Is

This directory holds executable specifications written in Gherkin — the shared language between
business stakeholders, developers, and QA engineers. These specs describe _what_ each app does,
not _how_ it is implemented.

## Why Specs Live Here

Acceptance specs belong at the monorepo root rather than inside app directories because:

- **Stakeholder access** — business owners and QA engineers read specs without navigating app internals
- **Shared ownership** — Three Amigos (business + development + QA) collectively own these files
- **Clear separation** — specs define behavior; implementation tests live inside the apps

## Testing Layers

| Layer                      | Location           | Purpose                               | When it runs            |
| -------------------------- | ------------------ | ------------------------------------- | ----------------------- |
| Acceptance specs (Gherkin) | `specs/`           | Define behavior from user perspective | CI full suite           |
| Unit / integration tests   | `apps/*/src/test/` | Verify internal implementation        | Pre-push (`test:quick`) |
| E2E tests                  | `apps/*-e2e/`      | Verify flows against running system   | CI E2E suite            |

## App Specs

- **[organiclever/](./apps/organiclever/README.md)** — OrganicLever specifications (backend REST API +
  frontend landing page)

- **[a-demo/](./apps/a-demo/README.md)** — Demo application specifications
  (platform-agnostic Gherkin — see [be/gherkin](./apps/a-demo/be/gherkin/README.md) and [fe/gherkin](./apps/a-demo/fe/gherkin/README.md) for details)
- **[rhino-cli/](./apps/rhino-cli/README.md)** — Repository management CLI specifications (Go, godog)
- **[ayokoding-cli/](./apps/ayokoding-cli/README.md)** — Content automation CLI specifications (Go, godog)
- **[oseplatform-cli/](./apps/oseplatform-cli/README.md)** — OSE Platform site CLI specifications (Go, godog)

## Experimental App Specs

- **[apps-labs/](./apps-labs/README.md)** — Specs for framework evaluations, POCs, and tech stack
  comparisons; graduates to `apps/` when the implementation is promoted

## Library Specs

- **[golang-commons/](./libs/golang-commons/)** — Shared Go utility specifications (godog)
- **[hugo-commons/](./libs/hugo-commons/)** — Hugo site utility specifications (godog)

## Standard Folder Pattern

Each application domain follows this layout under `specs/apps/{domain}/`:

```
specs/apps/{domain}/
├── README.md               # Describes app, BDD framework, and feature organization
├── contracts/              # OpenAPI 3.1 contract spec (bundled + source files)
├── be/gherkin/             # Backend acceptance specs (.feature files)
├── fe/gherkin/             # Frontend acceptance specs (.feature files)
├── fs/gherkin/             # Fullstack acceptance specs (.feature files, if applicable)
└── c4/                     # C4 architecture diagrams (if applicable)
```

Where `{role}` in `{domain}/{role}/gherkin/` is one of:

- `be` — backend service (REST API, GraphQL, etc.)
- `fe` — frontend application (Next.js, Flutter, etc.)
- `fs` — fullstack application (combined frontend + backend in one app)
- `cli` — CLI tool (Go, etc.)

**Contracts** live at `specs/apps/{domain}/contracts/` and are the source of truth for API
contracts shared between frontend and backend. The `{domain}-contracts` Nx project lints and
bundles the spec; downstream apps consume it via their `codegen` target.

**C4 diagrams** live at `specs/apps/{domain}/c4/` and describe the system architecture at the
context, container, and component levels.

## Standards

All feature files follow the OSE Platform BDD standards:

- [BDD Standards](../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md) —
  framework requirements, Three Amigos process, coverage rules
- [Gherkin Standards](../docs/explanation/software-engineering/development/behavior-driven-development-bdd/ex-soen-de-bedrdebd__gherkin-standards.md) —
  feature file structure, naming, ubiquitous language
- [Scenario Standards](../docs/explanation/software-engineering/development/behavior-driven-development-bdd/ex-soen-de-bedrdebd__scenario-standards.md) —
  scenario independence, naming, assertions
- [Spec-to-Test Mapping](../governance/development/infra/bdd-spec-test-mapping.md) —
  mandatory 1:1 mapping between CLI commands and feature file `@tags`

## Adding Specs

1. Choose the appropriate subdirectory: `specs/apps/` for production-bound applications,
   `specs/apps-labs/` for experimental/POC applications, `specs/libs/` for libraries
2. Create a folder matching the project name: `specs/apps/[app-name]/` or `specs/libs/[lib-name]/`
3. Add a `README.md` describing the project, BDD framework, and feature file organization
4. Organize `.feature` files by bounded context or user journey (kebab-case names)
5. Update this README with a link to the new folder
