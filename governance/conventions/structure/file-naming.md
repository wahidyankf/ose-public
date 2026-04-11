---
title: "File Naming Convention"
description: Standard markdown + GitHub-compatible kebab-case naming for all files
category: explanation
subcategory: conventions
tags:
  - naming
  - files
  - conventions
  - github
created: 2025-11-19
updated: 2026-04-11
---

# File Naming Convention

Files in `docs/`, `governance/`, and similar repository locations follow a single rule designed for **standard markdown and GitHub compatibility**.

## Why This Rule Exists

Files in this repository are read through two primary surfaces: GitHub web (which renders markdown and turns filenames into URL slugs) and standard markdown tooling (VS Code, markdown linters, static site generators). Both surfaces have the same expectations:

- Lowercase URL slugs (GitHub URLs are case-sensitive on Linux hosting)
- ASCII-only filenames (avoid mojibake in URLs and cross-OS clones)
- No shell or URL metacharacters (prevents link breakage and quoting bugs)
- Case-insensitive uniqueness inside a directory (so clones to macOS/Windows filesystems do not collide)

Picking a rule that satisfies both surfaces keeps the documentation portable and the tooling simple.

## The Rule

**Lowercase kebab-case with a standard extension.**

```text
file-naming.md
three-level-testing-standard.md
monorepo-structure.md
```

### What this means

- Lowercase ASCII letters (`a`–`z`), digits (`0`–`9`), and hyphens (`-`) only in the basename
- Words separated by single hyphens
- One standard file extension (`.md`, `.png`, `.svg`, `.mmd`, `.excalidraw`, `.drawio`)
- No spaces, no uppercase, no camelCase, no underscores in the basename
- No leading or trailing hyphens
- No characters that break GitHub URLs or shell quoting: `:` `?` `*` `<` `>` `|` `"` backslash
- Filenames in the same directory must be unique after lowercasing (for macOS/Windows clone safety)

## Exceptions

### Index files

Each directory's index file is named `README.md`. This exception exists because GitHub automatically renders `README.md` as the directory landing page on the web.

### Operational metadata

Files under `docs/metadata/` are operational artifacts (caches, validation data). The directory itself provides the context, so only machine-parseability matters.

### Assets co-located with documentation

Images and diagrams co-located with a markdown file follow the same kebab-case rule:

```text
diagrams.md
diagrams-example.png
```

### Date-based files

Date-prefixed files use ISO 8601 (`YYYY-MM-DD`) and remain kebab-case overall:

```text
2025-12-14-phase-0-week-4-initial-commit.md
```

## Principles Implemented/Respected

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)** - Kebab-case is the simplest viable naming scheme; no prefixes, abbreviations, or hierarchical encoding
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)** - Filenames explicitly describe content; directory hierarchy explicitly encodes category
- **[Documentation First](../../principles/content/documentation-first.md)** - Consistent, predictable naming supports discoverability across GitHub web and standard markdown tooling

## Related Documentation

- [Linking Convention](../formatting/linking.md)
- [Diátaxis Framework](./diataxis-framework.md)
- [Conventions Index](../README.md)

---

**Last Updated**: 2026-04-11
