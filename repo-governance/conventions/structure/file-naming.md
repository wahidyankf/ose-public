---
description: Standard markdown + GitHub-compatible kebab-case naming for all files
when_to_use: Use when naming a new file under docs/, repo-governance/, or a similar repository location.
---

# File Naming Convention

Files in `docs/`, `repo-governance/`, and similar locations follow one rule, designed for **standard markdown and GitHub compatibility**.

## Why This Rule Exists

Files here are read through two surfaces: GitHub web (which renders markdown and turns filenames into URL slugs) and standard markdown tooling. Both expect:

- Lowercase URL slugs (GitHub URLs are case-sensitive on Linux hosting)
- ASCII-only filenames (no mojibake in URLs or cross-OS clones)
- No shell or URL metacharacters (prevents link breakage and quoting bugs)
- Case-insensitive uniqueness inside a directory (so macOS/Windows clones do not collide)

One rule satisfying both keeps documentation portable and tooling simple.

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
- Filenames in one directory must be unique after lowercasing (macOS/Windows clone safety)

## Exceptions

### Index files

Each directory's index file is named `README.md`, because GitHub renders it as the directory landing page.

### Skill definition files

Skill definition files under `.agents/skills/*/` are named `SKILL.md` — uppercase for immediate visual distinction, and the canonical name referenced throughout governance.

### Operational metadata

Files under `docs/metadata/` are operational artifacts (caches, validation data); the directory supplies the context, so only machine-parseability matters.

### Assets co-located with documentation

Co-located images and diagrams follow the same kebab-case rule:

```text
diagrams.md
diagrams-example.png
```

### Date-based files

Date-prefixed files use ISO 8601 (`YYYY-MM-DD`) and remain kebab-case overall:

```text
2025-12-14-phase-0-week-4-initial-commit.md
```

## Withdrawn Rules

Three filename rules once bound here and no longer do: the **agent role suffix**, **workflow type
suffix**, and **workflow scope prefix**. No filename changed. See Withdrawn Rules Detail below for
what each covered and whether the third's removal was deliberate.

## Principles Implemented/Respected

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)** - Kebab-case is the simplest viable naming scheme; avoid abbreviations and hierarchical encoding. Leading `NN-` ordinals are governed by [Ordinal Filename Prefixes](./ordinal-filename-prefixes.md)
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)** - Filenames describe content; the directory hierarchy encodes category
- **[Documentation First](../../principles/content/documentation-first.md)** - Predictable naming supports discoverability across GitHub web and markdown tooling

## Children

- [App Naming Types](./file-naming/app-naming-types.md) — the `[domain]-[type]` naming convention and type-suffix vocabulary for apps under `apps/`.
- [Withdrawn Rules Detail](./file-naming/withdrawn-rules.md) — what each withdrawn rule checked, and whether the scope-prefix drop was deliberate.

## Related Documentation

- [Ordinal Filename Prefixes](./ordinal-filename-prefixes.md)
- [Linking Convention](../formatting/linking.md)
- [Diátaxis Framework](../structure/diataxis-framework.md)
- [Conventions Index](../README.md)
