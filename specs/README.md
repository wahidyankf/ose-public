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

- **[organiclever-be/](./organiclever-be/README.md)** — Backend REST API specifications (Spring Boot,
  Cucumber JVM)
- **[organiclever-web/](./organiclever-web/README.md)** — Web landing page specifications (Next.js,
  Cucumber.js)

## Standards

All feature files follow the OSE Platform BDD standards:

- [BDD Standards](../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md) —
  framework requirements, Three Amigos process, coverage rules
- [Gherkin Standards](../docs/explanation/software-engineering/development/behavior-driven-development-bdd/ex-soen-de-bedrdebd__gherkin-standards.md) —
  feature file structure, naming, ubiquitous language
- [Scenario Standards](../docs/explanation/software-engineering/development/behavior-driven-development-bdd/ex-soen-de-bedrdebd__scenario-standards.md) —
  scenario independence, naming, assertions

## Adding Specs for a New App

1. Create a folder matching the app name: `specs/[app-name]/`
2. Add a `README.md` describing the app, BDD framework, and feature file organization
3. Organize `.feature` files by bounded context or user journey (kebab-case names)
4. Update this README with a link to the new folder
