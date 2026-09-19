---
description: The concrete MIT-everywhere rule, the current per-directory LICENSE inventory, root LICENSE fallback coverage, required license text values, and the copyright notice format.
when_to_use: Read this when placing or verifying a LICENSE file for a directory, or when checking the required copyright notice text and year range.
---

# Licensing Standards

The concrete rules for which directories carry LICENSE files, what they must say, and how the root
LICENSE fills gaps. Part of the [Per-Directory Licensing Convention](../licensing.md).

## One License Type

The repository uses the MIT License throughout. All directories carry MIT LICENSE files.

## Per-Directory LICENSE File Placement

Every product application and shared library MUST contain an MIT `LICENSE` file at its directory
root. This applies uniformly — product apps, behavioural specs, shared libraries, and CLI tools
all use the same MIT text.

### Current Directory LICENSE Inventory

| Directory                    | License | Notes |
| ---------------------------- | ------- | ----- |
| `LICENSE` (root)             | MIT     |       |
| `apps/ayokoding-www/`        | MIT     |       |
| `apps/crane-cli/`            | MIT     |       |
| `apps/organiclever-app-web/` | MIT     |       |
| `apps/organiclever-be/`      | MIT     |       |
| `apps/organiclever-www/`     | MIT     |       |
| `apps/ose-be/`               | MIT     |       |
| `apps/ose-app-web/`          | MIT     |       |
| `apps/ose-www/`              | MIT     |       |
| `specs/`                     | MIT     |       |
| `libs/fsharp-crane-core/`    | MIT     |       |
| `libs/fsharp-env-loader/`    | MIT     |       |
| `libs/ts-env-loader/`        | MIT     |       |
| `libs/web-ui/`               | MIT     |       |
| `libs/web-ui-token/`         | MIT     |       |

Any third-party code that is vendored or archived retains its original license (see LICENSING-NOTICE.md).

## Root LICENSE Fallback

The root `LICENSE` file is MIT. It covers any code or content not covered by a more specific
per-directory LICENSE file, including:

- E2E test suites (`apps/*-e2e/`) — the only directories currently without a per-directory
  LICENSE file; every internal CLI tool (such as `apps/crane-cli/`) carries one
- Documentation (`docs/`, `repo-governance/`, `plans/`)
- AI agent configuration (`.claude/`, `.opencode/`)

## MIT License Text Requirements

All MIT LICENSE files MUST use the standard MIT License text with the following values:

- **Copyright year**: `2025-2026`
- **Licensor name**: `wahidyankf`

Canonical source: `libs/web-ui/LICENSE`.

## Copyright Notice Format

All LICENSE files authored by the project team MUST use this copyright notice format:

```
Copyright (c) 2025-2026 wahidyankf
```

The year range starts from the first year of the project and extends to the current year of
publication. Update the end year when committing new code in a new calendar year.
