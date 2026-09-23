---
description: Step-by-step procedures for adding a feature file to an existing project, scaffolding specs for a brand-new project, or scaffolding specs for a new library
when_to_use: Read this when adding a Gherkin feature file, onboarding a new app's specs, or onboarding a new library's specs.
---

# Adding New Specs

## Adding a Feature File to an Existing Project

1. Identify the correct `<product>-<surface>` slug (e.g., `organiclever-be`, `ayokoding-www`,
   `crane-cli`). For ayokoding build-time features, use the `ayokoding-www` `build-tools/` domain
2. Place the file in the appropriate domain subdirectory under
   `<owner>/behaviours/<domain>/`, creating the domain folder if it does not exist
3. For CLI: choose a domain that matches the command group (e.g., `system/`, `media/`, `pdf/`); single-feature domains are permitted
4. Update the relevant `README.md` index file

## Adding Specs for a New Project

1. Create the project directory under `specs/apps/<app-family>/`
2. Create `README.md` at the project level
3. Determine the surface profile (full-stack, web-only, CLI-only, multi-CLI)
4. Create only the folders the project needs — see per-surface variant table
5. Create `README.md` index files at each folder level
6. Run `the declared spec-tree check` to verify the layout

## Adding Specs for a New Lib

1. Create `specs/libs/<lib-name>/`
2. Create `README.md` at the lib level
3. Create `behaviours/` directly under the lib name, beside its `README.md` and `architecture.md`
4. Create package subdirectories under `gherkin/` matching the lib's module structure
