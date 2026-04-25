---
title: "Per-Directory Licensing Convention"
description: Standards for the per-directory licensing strategy using MIT for all code in this repository
category: explanation
subcategory: conventions
tags:
  - licensing
  - structure
  - mit
  - per-directory
created: 2026-04-04
---

# Per-Directory Licensing Convention

This convention defines the per-directory licensing strategy for the open-sharia-enterprise
repository. All code, documentation, specifications, and AI agent configuration in this repository
is licensed under the **MIT License**. Per-directory LICENSE files are preserved so future
maintainers can relicense specific subdirectories independently if needed.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**:
  Each application directory contains its own LICENSE file, making licensing terms immediately
  visible without requiring readers to trace inheritance from the root.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: A
  single MIT license throughout eliminates the dual-license split model and the "HOW vs WHAT"
  distinction. Simpler licensing reduces contributor friction and legal overhead.

- **[Accessibility First](../../principles/content/accessibility-first.md)**: MIT removes all
  restrictions for contributors, learners, and downstream consumers. Anyone can use, modify,
  and redistribute any part of the repository without restriction.

## Purpose

This convention establishes clear rules for which license applies to which code in the
repository. All code is MIT. The per-directory LICENSE file structure is retained as a future
escape hatch — if a specific directory ever needs different terms, the mechanism exists without
requiring a root LICENSE change.

## Scope

### What This Convention Covers

- License type selection for new applications, libraries, and directories
- Per-directory LICENSE file placement rules
- Copyright notice format
- Root LICENSE fallback behavior

### What This Convention Does NOT Cover

- Third-party dependency license compliance (e.g., LGPL, Apache 2.0 obligations)
- Contributor License Agreements (CLAs)
- Trademark or patent policies

## Standards

### One License Type

The repository uses the MIT License throughout. All directories carry MIT LICENSE files.

### Per-Directory LICENSE File Placement

Every product application and shared library MUST contain an MIT `LICENSE` file at its directory
root. This applies uniformly — product apps, behavioral specs, shared libraries, and CLI tools
all use the same MIT text.

#### Current Directory LICENSE Inventory

| Directory                | License |
| ------------------------ | ------- |
| `LICENSE` (root)         | MIT     |
| `apps/ayokoding-cli/`    | MIT     |
| `apps/ayokoding-web/`    | MIT     |
| `apps/organiclever-be/`  | MIT     |
| `apps/organiclever-web/` | MIT     |
| `apps/oseplatform-cli/`  | MIT     |
| `apps/oseplatform-web/`  | MIT     |
| `apps/wahidyankf-web/`   | MIT     |
| `specs/`                 | MIT     |
| `libs/golang-commons/`   | MIT     |
| `libs/hugo-commons/`     | MIT     |
| `libs/ts-ui/`            | MIT     |
| `libs/ts-ui-tokens/`     | MIT     |

Third-party code in `archived/` retains its original license (see LICENSING-NOTICE.md).

### Root LICENSE Fallback

The root `LICENSE` file is MIT. It covers any code or content not covered by a more specific
per-directory LICENSE file, including:

- Internal CLI tools without their own LICENSE file (e.g., `apps/rhino-cli/`)
- E2E test suites (`apps/*-e2e/`)
- Documentation (`docs/`, `governance/`, `plans/`)
- AI agent configuration (`.claude/`, `.opencode/`)

### MIT License Text Requirements

All MIT LICENSE files MUST use the standard MIT License text with the following values:

- **Copyright year**: `2025-2026`
- **Licensor name**: `wahidyankf`

Canonical source: `libs/ts-ui/LICENSE`.

### Copyright Notice Format

All LICENSE files authored by the project team MUST use this copyright notice format:

```
Copyright (c) 2025-2026 wahidyankf
```

The year range starts from the first year of the project and extends to the current year of
publication. Update the end year when committing new code in a new calendar year.

## Rules for New Directories

### New Product Applications

When adding a new product application to `apps/`:

1. Create a `LICENSE` file in the application directory using standard MIT text
2. Use the copyright notice format: `Copyright (c) 2025-2026 wahidyankf`

### New Shared Libraries

When adding a new library to `libs/`:

1. Create a `LICENSE` file in the library directory using standard MIT text
2. Use the copyright notice format: `Copyright (c) 2025-2026 wahidyankf`

### Internal CLI Tools and E2E Suites

Internal CLI tools and E2E test suites do NOT require a per-directory LICENSE file. They inherit
the root MIT license by default.

## Examples

### Good: Per-Directory LICENSE Placement

```
apps/
  organiclever-web/
    LICENSE          <-- MIT (product app)
    src/
    ...
  ayokoding-cli/
    LICENSE          <-- MIT (CLI tool)
    cmd/
    ...
libs/
  golang-commons/
    LICENSE          <-- MIT (shared library)
    ...
```

### Bad: Missing LICENSE for New Product App

```
apps/
  new-product-app/
    src/             <-- No LICENSE file! Falls back to root MIT
    ...              <-- but explicit per-directory file preferred
```

Even though root MIT covers this, prefer placing an explicit LICENSE file for clarity.

## Validation

To verify licensing compliance across the repository:

1. Every directory listed as a product application has an MIT LICENSE file
2. Every `libs/*` directory has an MIT LICENSE file
3. No LICENSE file contains FSL or Functional Source License text
4. All LICENSE files use the correct copyright notice format
5. `LICENSING-NOTICE.md` accurately reflects the current licensing state

```bash
# Verify no FSL text remains in any LICENSE file
grep -r "Functional Source License" --include="LICENSE" .
# Expect: zero results
```

## References

**Related Repository Files:**

- [Root LICENSE](../../../LICENSE) — MIT license
- [LICENSING-NOTICE.md](../../../LICENSING-NOTICE.md) — Human-readable licensing summary
- [MIT License Rationale](../../../docs/explanation/software-engineering/licensing/mit-license-rationale.md) — Why MIT

**Related Conventions:**

- [File Naming Convention](./file-naming.md) — Directory and file organization standards
- [Plans Organization](./plans.md) — Directory structure for planning documents

**External Resources:**

- [MIT License — Open Source Initiative](https://opensource.org/licenses/MIT)

**Agents:**

- `repo-rules-checker` — Validates licensing compliance
- `repo-rules-fixer` — Fixes licensing violations
