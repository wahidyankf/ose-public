---
description: The canonical path pattern and domain-subdirectory rules for placing .feature files under behaviour/, plus the simpler layout used for library specs
when_to_use: Read this when adding or locating a Gherkin .feature file for an app or a library.
---

# Gherkin Feature File Placement, and Lib Spec Structure

## Gherkin Feature File Placement

Gherkin feature files live inside the `behaviours/` tree of a
[logical owner corpus](./logical-owner-corpus.md).

### Canonical Path Pattern

```
specs/apps/<product>/<owner>/behaviours/{domain}/{feature}.feature
```

Where:

- **`<product>`** = the product family name
- **`<owner>`** = one deployed surface of that product, named for the surface it deploys (`be`,
  `www`, `app-web`, `cli`)
- **`{domain}`** = business domain grouping folder (all surfaces, including CLI)
- **`{feature}`** = feature file name in kebab-case

The owner segment is already inside `specs/apps/<product>/`, so it carries the bare surface name:
`crane/cli/`, not `crane/crane-cli/`. A backend is always `be`, never `api`.

### Domain Subdirectory Rules

**Every surface** (BE, web, CLI) uses domain subdirectories under its owner's `behaviours/`. Each domain folder groups related feature files by business domain or command group, not by technical concern. Single-feature domains are permitted when the surface area is small.

```
specs/apps/organiclever/be/behaviours/journal/journal-entries.feature
specs/apps/organiclever/be/behaviours/health/health.feature
specs/apps/organiclever/app-web/behaviours/settings/dark-mode.feature
specs/apps/organiclever/www/behaviours/frontend/home/home.feature
```

AyoKoding's build-time features once sat in their own `ayokoding-build-tools/` surface. They now
live at `specs/apps/ayokoding/www/behaviours/build-tools/`, inside the site's own corpus, because
they belong to the site they build.

A domain folder may contain one or many feature files.

**CLI specs** use the same domain subdirectory rule as BE and web. Group features by command domain (e.g., `system/`, `media/`, `pdf/`). Single-feature domains are fine when the CLI surface area is small:

```
specs/apps/crane/cli/behaviours/system/version.feature
specs/apps/crane/cli/behaviours/media/figure-check.feature
specs/apps/crane/cli/behaviours/pdf/pdf-commands.feature
```

A `behaviours/` tree is recursive, so `the declared spec-tree check` accepts a feature file at its root; the domain subdirectory is what keeps a growing surface navigable, not what the validator counts.

## Lib Spec Structure

A library owns exactly one surface, so it has no product directory to separate. The three
[logical owner corpus](./logical-owner-corpus.md) entries therefore sit directly under the library
root:

```
specs/libs/<lib-name>/
├── README.md
├── architecture.md          # the current, as-built library
└── behaviours/
    └── <domain>/            # domain, package, or component subdirectories
        └── <feature>.feature
```

**Examples:**

```
specs/libs/web-ui-token/behaviours/tokens/tokens-export.feature
specs/libs/ts-env-loader/behaviours/env-loader/env-loader.feature
```
