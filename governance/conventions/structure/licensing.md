---
title: "Per-Directory Licensing Convention"
description: Standards for the per-directory licensing strategy using FSL-1.1-MIT for product apps and MIT for shared libraries and reference implementations
category: explanation
subcategory: conventions
tags:
  - licensing
  - structure
  - fsl
  - mit
  - per-directory
created: 2026-04-04
updated: 2026-04-04
---

# Per-Directory Licensing Convention

This convention defines the per-directory licensing strategy for the open-sharia-enterprise repository. Instead of a single root license covering all code uniformly, each product application and shared library carries its own LICENSE file, making the licensing terms explicit at the directory level.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Each application directory contains its own LICENSE file, making licensing terms immediately visible without requiring readers to trace inheritance from the root. Contributors and users see the applicable license where the code lives.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: The standard, unmodified FSL-1.1-MIT template text naturally scopes "the Software" to the code distributed alongside it. This eliminates the need for custom license modifications, additional legal annotations, or complex per-file headers.

- **[Accessibility First](../../principles/content/accessibility-first.md)**: MIT licensing for shared libraries and reference implementations removes friction for contributors, learners, and downstream consumers. Anyone can use, modify, and redistribute shared code without restrictions.

## Purpose

This convention establishes clear rules for which license applies to which code in the repository. It solves the problem of a monorepo containing both proprietary product applications (which need competitive protection) and shared/educational code (which should be freely available). The per-directory approach makes license boundaries unambiguous and enforceable.

## Scope

### What This Convention Covers

- License type selection for new applications, libraries, and directories
- Per-directory LICENSE file placement rules
- FSL-1.1-MIT template usage requirements
- Copyright notice format
- Root LICENSE fallback behavior
- Rolling MIT conversion timeline

### What This Convention Does NOT Cover

- Legal interpretation of FSL-1.1-MIT terms (see [FSL official site](https://fsl.software/))
- Third-party dependency license compliance (e.g., LGPL, Apache 2.0 obligations)
- Contributor License Agreements (CLAs)
- Trademark or patent policies

## Standards

### Two License Types

The repository uses exactly two license types:

| License         | Purpose                                  | Competing-Use Restriction                    |
| --------------- | ---------------------------------------- | -------------------------------------------- |
| **FSL-1.1-MIT** | Product applications                     | Yes (domain-specific, expires after 2 years) |
| **MIT**         | Shared libraries and reference/demo apps | None                                         |

### Per-Directory LICENSE File Placement

Every product application and shared library MUST contain a `LICENSE` file at its directory root. The license type depends on the directory category:

#### Product Applications (FSL-1.1-MIT)

These directories contain product-specific code with competing-use restrictions scoped to each application's domain:

| Application           | Directory               | Domain Protected                                           |
| --------------------- | ----------------------- | ---------------------------------------------------------- |
| AyoKoding Web         | `apps/ayokoding-web/`   | Educational coding platform                                |
| AyoKoding CLI         | `apps/ayokoding-cli/`   | Educational coding platform tooling                        |
| OrganicLever Frontend | `apps/organiclever-fe/` | Non-enterprise productivity (individual, family, personal) |
| OrganicLever Backend  | `apps/organiclever-be/` | Non-enterprise productivity (individual, family, personal) |
| OSE Platform Web      | `apps/oseplatform-web/` | Enterprise platform site                                   |
| OSE Platform CLI      | `apps/oseplatform-cli/` | Enterprise platform site tooling                           |

The standard FSL-1.1-MIT template defines "the Software" as the code included with the license. Placing the LICENSE file inside a specific application directory naturally scopes the competing-use restriction to that application's domain without modifying the template text.

#### Behavioral Specifications (FSL-1.1-MIT)

Anything that describes **what the product does** (behavioral specifications) MUST be FSL-licensed, because these materials can be used to clean-room engineer a competing product. The guiding principle: implementation code (HOW) can be MIT; behavioral specifications (WHAT) must be FSL.

This includes:

- **`specs/`** -- MUST have its own FSL-1.1-MIT LICENSE file at the root. Contains Gherkin features, OpenAPI contracts, and C4 architecture models that define product behavior. Product specs are FSL by default. **Exception**: demo app specs (`specs/apps/a-demo/`) MUST have their own MIT LICENSE file — they are part of the educational package, consistent with demo implementation code being MIT.
- **E2E test suites** -- E2E tests are executable behavioral specifications. They describe expected HTTP responses, UI states, user flows, and error handling. All E2E test apps MUST be FSL-licensed:
  - Product E2E tests (`*-e2e` apps for product families) inherit root FSL
  - Demo E2E tests (`apps/a-demo-be-e2e/`, `apps/a-demo-fe-e2e/`) MUST have their own FSL-1.1-MIT LICENSE file (even though the demo implementation code they test is MIT)

#### Shared Libraries (MIT, unless overridden)

Directories under `libs/` default to the MIT license, unless explicitly overridden by a per-directory LICENSE file stating otherwise:

- `libs/golang-commons/`, `libs/hugo-commons/` -- Go utility libraries
- `libs/ts-ui/`, `libs/ts-ui-tokens/` -- TypeScript UI component libraries
- `libs/clojure-openapi-codegen/`, `libs/elixir-openapi-codegen/` -- Code generation libraries
- `libs/elixir-cabbage/`, `libs/elixir-gherkin/` -- Elixir testing libraries (MIT, original authors)

A new library defaults to MIT. To override, place a different LICENSE file (e.g., FSL-1.1-MIT) in the library directory and document the reason in LICENSING-NOTICE.md.

#### Demo and Reference Implementation Code (MIT)

All demo application **implementation** directories (`apps/a-demo-be-*`, `apps/a-demo-fe-*`, `apps/a-demo-fs-*`, excluding `*-e2e`) MUST use the MIT license. These are reference implementations meant for learning and have no competing-use restrictions. Their specs (`specs/apps/a-demo/`) are also MIT. Note: their E2E tests are FSL (see Behavioral Specifications above).

### Root LICENSE Fallback

The root `LICENSE` file MUST remain FSL-1.1-MIT. It serves as the fallback for any code or content not covered by a more specific per-directory LICENSE file, including:

- Internal CLI tools without their own LICENSE file (e.g., `apps/rhino-cli/`)
- E2E test suites (`apps/*-e2e/`)
- Documentation (`docs/`, `governance/`, `plans/`)
- AI agent configuration (`.claude/`, `.opencode/`)

### FSL-1.1-MIT Template Requirements

The FSL-1.1-MIT LICENSE files MUST use the exact template from the [FSL template repository](https://github.com/getsentry/fsl.software/blob/main/FSL-1.1-MIT.template.md). Only the following fields may be filled in:

- **Copyright year**: `2025-2026`
- **Licensor name**: `wahidyankf`

Do NOT modify, add, remove, or rephrase any other part of the template text. The template's standard language is intentionally relied upon for the per-directory scoping mechanism.

### Copyright Notice Format

All LICENSE files authored by the project team MUST use this copyright notice format:

**FSL-1.1-MIT files:**

```
Copyright 2025-2026 wahidyankf
```

**MIT files:**

```
Copyright (c) 2025-2026 wahidyankf
```

The year range starts from the first year of the project and extends to the current year of publication. Update the end year when committing new code in a new calendar year.

### Rolling MIT Conversion

Each FSL-1.1-MIT-licensed version of the software converts to MIT on a per-version (per-commit) rolling basis:

- Each commit becomes MIT-licensed 2 years after its first public distribution
- Code committed on 2026-04-04 becomes MIT on 2028-04-04
- Older code progressively becomes fully open-source while new code remains protected

This rolling conversion is an inherent property of the FSL-1.1-MIT license and requires no action from maintainers.

## Rules for New Directories

### New Product Applications

When adding a new product application to `apps/`:

1. Create a `LICENSE` file in the application directory
2. Use the exact FSL-1.1-MIT template with only copyright year and licensor name filled in
3. Update `LICENSING-NOTICE.md` at the repository root to list the new application, its directory, and its protected domain
4. Document the protected domain clearly (e.g., "non-enterprise productivity", "educational coding platform", "enterprise platform site")

### New Shared Libraries

When adding a new library to `libs/`:

1. Create a `LICENSE` file in the library directory
2. Use the standard MIT license text
3. Use the copyright notice format: `Copyright (c) 2025-2026 wahidyankf`

### New Demo or Reference Applications

When adding a new demo or reference application matching `apps/a-demo-*`:

1. Create a `LICENSE` file in the application directory
2. Use the standard MIT license text
3. Use the copyright notice format: `Copyright (c) 2025-2026 wahidyankf`

### New Product-Supporting CLI Tools

When adding a CLI tool that supports a product application (e.g., `ayokoding-cli` supports `ayokoding-web`, `oseplatform-cli` supports `oseplatform-web`):

1. Create a `LICENSE` file in the CLI tool directory
2. Use the exact FSL-1.1-MIT template with only copyright year and licensor name filled in
3. Update `LICENSING-NOTICE.md` at the repository root to list the CLI tool, its directory, and its protected domain
4. Document the protected domain clearly, matching the parent product domain (e.g., "educational coding platform tooling", "enterprise platform site tooling")

### Internal CLI Tools, E2E Suites, and Other Directories

Internal CLI tools (e.g., `apps/rhino-cli/`), E2E test suites, and other supporting directories do NOT require a per-directory LICENSE file. They inherit the root FSL-1.1-MIT license by default.

## Examples

### Good: Per-Directory LICENSE Placement

```
apps/
  organiclever-fe/
    LICENSE          <-- FSL-1.1-MIT (product app)
    src/
    ...
  ayokoding-cli/
    LICENSE          <-- FSL-1.1-MIT (product-supporting CLI tool)
    cmd/
    ...
  a-demo-be-golang-gin/
    LICENSE          <-- MIT (reference implementation)
    cmd/
    ...
libs/
  golang-commons/
    LICENSE          <-- MIT (shared library)
    ...
```

### Bad: Missing LICENSE for Product App

```
apps/
  new-product-app/
    src/             <-- No LICENSE file! Falls back to root FSL-1.1-MIT
    ...              <-- but domain scoping is ambiguous
```

This fails because without a per-directory LICENSE file in a product app, the root FSL-1.1-MIT applies but its "the Software" scope is unclear for that specific application.

### Bad: Modified FSL Template

```markdown
# Functional Source License, Version 1.1, MIT Future License

## Notice

Copyright 2025-2026 wahidyankf

## Additional Terms <-- WRONG: Do not add custom sections

This license only applies to the frontend code...
```

Do not modify the template text. The standard template's "the Software" definition handles scoping through directory placement.

## Validation

To verify licensing compliance across the repository:

1. Every directory listed as a product application has a FSL-1.1-MIT LICENSE file
2. Every `libs/*` directory has an MIT LICENSE file
3. Every `apps/a-demo-*` **implementation** directory (excluding `*-e2e`) has an MIT LICENSE file
4. Every `apps/a-demo-*-e2e` directory has a FSL-1.1-MIT LICENSE file (E2E tests are behavioral specifications)
5. The `specs/` root directory has a FSL-1.1-MIT LICENSE file
6. The `specs/apps/a-demo/` directory has an MIT LICENSE file (demo specs are educational)
7. The root LICENSE file is FSL-1.1-MIT
8. FSL-1.1-MIT files use the unmodified template text
9. All LICENSE files use the correct copyright notice format
10. `LICENSING-NOTICE.md` accurately reflects the current licensing state

## References

**Related Repository Files:**

- [Root LICENSE](../../../LICENSE) -- FSL-1.1-MIT fallback license
- [LICENSING-NOTICE.md](../../../LICENSING-NOTICE.md) -- Human-readable licensing summary

**Related Conventions:**

- [File Naming Convention](./file-naming.md) -- Directory and file organization standards
- [Plans Organization](./plans.md) -- Directory structure for planning documents

**External Resources:**

- [FSL official site](https://fsl.software/) -- FSL license documentation and FAQ
- [FSL-1.1-MIT template](https://github.com/getsentry/fsl.software/blob/main/FSL-1.1-MIT.template.md) -- Canonical template source

**Agents:**

- `repo-governance-checker` -- Validates licensing compliance
- `repo-governance-fixer` -- Fixes licensing violations

---

**Last Updated**: 2026-04-04
