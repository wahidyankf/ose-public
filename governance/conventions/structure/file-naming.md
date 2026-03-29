---
title: "Documentation File Naming Convention"
description: Systematic file naming for open-sharia-enterprise documentation
category: explanation
subcategory: conventions
tags:
  - naming-convention
  - file-structure
  - organization
  - documentation
created: 2025-11-19
updated: 2026-01-25
---

# Documentation File Naming Convention

A systematic approach to naming files in the open-sharia-enterprise documentation that ensures clarity, organization, and discoverability while maintaining a logical hierarchy.

## Overview

The naming convention serves three critical purposes:

1. **Hierarchical Organization** - File names encode the folder path, making it possible to identify a file's location just by reading the filename
2. **Discoverability** - Consistent prefixes make it easy to find related files across the documentation
3. **Global Uniqueness** - Hierarchical prefixes ensure no two files have the same name, preventing ambiguity across the entire documentation vault

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)** - making the organizational hierarchy visible without requiring users to navigate folders. No hidden conventions or magic - the full path is transparent in the filename itself.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)** - Avoids complex encoding schemes or multiple separator types. The pattern is easy to learn, remember, and apply consistently.

## Purpose

This convention establishes a systematic file naming pattern that encodes directory hierarchy in filenames, ensuring global uniqueness and discoverability across the documentation. It prevents naming conflicts, makes file locations transparent, and enables efficient file management without relying on directory structure alone.

## Scope

This naming convention applies to **all files in the `docs/` directory** (the Obsidian vault):

- `docs/tutorials/` - Learning-oriented guides
- `docs/how-to/` - Problem-solving guides
- `docs/reference/` - Technical reference documentation
- `docs/explanation/` - Conceptual documentation

**File types covered:**

- Markdown files (`.md`)
- Images (`.png`, `.jpg`, `.svg`, `.gif`, etc.)
- Diagrams (`.excalidraw`, `.mmd`, `.drawio`)
- Any other documentation assets

## The Universal Pattern

All documentation files (except index files) follow this pattern:

```
[hierarchical-prefix]__[content-identifier].[extension]
```

**Example**: `file-naming.md`

Breaking this down:

- `ex-ru-co-me` = hierarchical prefix (explanation → conventions → meta)
- `__` = double underscore separator
- `file-naming` = content identifier (the actual name)
- `.md` = file extension

**Why this pattern?**

By encoding the folder hierarchy in the filename, we make all files globally unique and self-documenting. This prevents naming conflicts and makes it immediately clear where a file belongs in the documentation structure.

**Exception**: Index files use `README.md` for GitHub compatibility (see Special Cases below).

## How to Build a Prefix

The prefix encodes the folder path using abbreviations separated by single hyphens. Each level of nesting adds another abbreviation segment.

### Root Directory Prefixes

The four main Diátaxis categories use consistent 4-character prefixes:

- `tu` - Tutorials (`docs/tutorials/`) - Common/short root: 2 chars
- `hoto` - How-To (`docs/how-to/`) - Compound root: 4 chars (2 from each word)
- `re` - Reference (`docs/reference/`) - Common/short root: 2 chars
- `ex` - Explanation (`docs/explanation/`) - Common/short root: 2 chars

**Note on Directory Naming:**

The directory names follow semantic conventions from the Diátaxis framework:

- `tutorials/` - **Plural** (collection of discrete tutorial documents)
- `how-to/` - **Singular category name** (the folder contains "how-to guides", matching the category name)
- `reference/` - **Singular/mass noun** (reference material as a collective whole, like "reference library")
- `explanation/` - **Singular/mass noun** (explanatory material as a collective whole)

This apparent inconsistency is intentional and follows standard documentation conventions. Only `tutorials/` is plural because tutorials are naturally countable discrete units, while the other categories represent types of content that are better expressed as mass nouns.

### Subdirectory Encoding

**CRITICAL**: The 3-phase reorganization (completed 2026-01-01) introduced **subdirectory-based prefixes** for better organization. Files now encode their subdirectory in the prefix.

**Pattern**: `[root]-[subdirectory]__[content-name].md`

**Subdirectory codes** use 2-4 letter abbreviations based on directory characteristics:

**For Subdirectories:**

1. **Hyphenated compounds** - Concatenate first 2 letters of each word WITHOUT dash (`ayokoding-fs` → `aywe`, `software-engineering` → `se`)
2. **Single words** - First 2 characters (`formatting` → `fo`, `content` → `co`, `meta` → `me`)

**Current Subdirectory Structure:**

### Conventions Subdirectories (`governance/conventions/`)

| Subdirectory  | Code | Example File                       |
| ------------- | ---- | ---------------------------------- |
| `formatting/` | `fo` | `indentation.md`                   |
| `writing/`    | `wr` | `quality.md`                       |
| `structure/`  | `st` | `file-naming.md`                   |
| `tutorials/`  | `tu` | `naming.md`                        |
| `hugo/`       | `hu` | `shared.md`                        |
| `linking/`    | `li` | `internal-ayokoding-references.md` |

### Development Subdirectories (`governance/development/`)

| Subdirectory | Code | Example File                |
| ------------ | ---- | --------------------------- |
| `workflow/`  | `wo` | `commit-messages.md`        |
| `agents/`    | `ag` | `ai-agents.md`              |
| `quality/`   | `qu` | `code.md`                   |
| `pattern/`   | `pa` | `functional-programming.md` |
| `hugo/`      | `hu` | `development.md`            |
| `infra/`     | `in` | `temporary-files.md`        |

### Workflows Subdirectories (`governance/workflows/`)

| Subdirectory    | Code   | Example File                           |
| --------------- | ------ | -------------------------------------- |
| `ayokoding-fs/` | `aywe` | `ayokoding-fs-general-quality-gate.md` |
| `docs/`         | `do`   | `quality-gate.md`                      |
| `meta/`         | `me`   | `workflow-identifier.md`               |
| `plan/`         | `pl`   | `plan-execution.md`                    |
| `repository/`   | `re`   | `repository-rules-validation.md`       |

### Principles Subdirectories (`governance/principles/`)

| Subdirectory            | Code | Example File                    |
| ----------------------- | ---- | ------------------------------- |
| `general/`              | `ge` | `simplicity-over-complexity.md` |
| `content/`              | `co` | `accessibility-first.md`        |
| `software-engineering/` | `se` | `explicit-over-implicit.md`     |

### Abbreviation Strategy

Use a systematic encoding rule based on directory characteristics:

**For Root Directories:**

1. **Common/short roots** - 2 characters (`tutorials` → `tu`, `explanation` → `ex`, `reference` → `re`)
2. **Compound roots** - 4 characters, 2 from each word (`how-to` → `hoto`)

**For Subdirectories:**

1. **Hyphenated compounds** - Concatenate first 2 letters of each word WITHOUT dash (`ayokoding-fs` → `aywe`, `software-engineering` → `se`)
2. **Single words** - First 2 characters (`formatting` → `fo`, `content` → `co`, `meta` → `me`, `workflow` → `wo`, `agents` → `ag`, `quality` → `qu`, `pattern` → `pa`, `hugo` → `hu`, `infra` → `in`, `docs` → `do`, `plan` → `pl`, `repository` → `re`, `general` → `ge`, `tutorial` → `tu`, `project` → `pr`)

**Key Rule**: For hyphenated directory names, take first 2 letters of EACH word and concatenate them WITHOUT inserting a dash. The dash in the directory name does NOT appear in the abbreviation.

**Real Examples:**

```
indentation.md          (explanation/governance/conventions/formatting)
ai-agents.md            (explanation/governance/development/agents)
ayokoding-fs-general-quality-gate.md  (explanation/governance/workflows/ayokoding-fs)
explicit-over-implicit.md  (explanation/governance/principles/software-engineering)
```

## The `__` Separator

The double underscore creates a critical visual boundary:

- **Left side** = Where the file lives (organizational structure)
- **Right side** = What the file actually is (content identifier)

**Why double underscore?**

- Creates obvious visual clarity when scanning filenames
- Distinguishes from single hyphens used in content names
- Makes parsing trivial: split on `__` to separate structure from content

## PASS: General Naming Rules

### Kebab-Case Format

All filenames use lowercase with hyphens as separators (no spaces, mixed case, or underscores):

```markdown
PASS: Good:

- tu\_\_getting-started-with-authentication.md
- hoto\_\_configure-rate-limiting.md
- re\_\_transaction-endpoints.md
- ex-ru-co-me\_\_file-naming.md

FAIL: Bad:

- Getting_Started.md (mixed case, underscores)
- configure Rate Limiting.md (spaces, mixed case)
- TransactionEndpoints.md (camelCase)
```

### File Extensions

Keep the original file extension on all files:

- Markdown: `.md`
- Images: `.png`, `.jpg`, `.svg`, `.gif`
- Diagrams: `.excalidraw`, `.mmd`, `.drawio`
- PDFs: `.pdf`

### Sequential Numbering

For ordered content, use zero-padded numeric prefixes within the content identifier:

```
tu-qu__00-introduction.md
tu-qu__01-setup-environment.md
tu-qu__02-first-transaction.md
tu-qu__10-advanced-concepts.md
```

### Date-Based Files

**Required Format:** All dates must use **ISO 8601 format** (`YYYY-MM-DD`):

- `YYYY` = 4-digit year
- `MM` = 2-digit month (01-12)
- `DD` = 2-digit day (01-31)

**Examples:**

```
hoto__release-process-2025-11.md
```

**Frontmatter dates:** Frontmatter fields (`created`, `updated`) also use ISO 8601 format:

```yaml
---
created: 2025-11-19
updated: 2026-01-25
---
```

## Special Cases

### Index Files (README.md)

**GitHub Compatibility Exception:**

Each category and subcategory should have an index file named `README.md`. This is a special exception to the prefix naming convention to ensure GitHub automatically displays the index when browsing directories on the web.

```
docs/tutorials/README.md                          # Main category index
docs/how-to/README.md                            # Main category index
docs/reference/README.md                         # Main category index
docs/explanation/README.md                       # Main category index
governance/conventions/README.md           # Subcategory index (conventions)
governance/development/README.md           # Subcategory index (development)
governance/principles/README.md            # Subcategory index (principles)
governance/workflows/README.md             # Subcategory index (workflows)
```

**Key Points:**

- Main category indices (`tutorials/`, `how-to/`, `reference/`, `explanation/`) use `README.md`
- Subcategory indices also use `README.md` for consistency
- `README.md` files are **exempt from the prefix requirement**
- This ensures GitHub web interface displays indices automatically
- Works seamlessly with Obsidian and other markdown viewers

### Metadata Files (docs/metadata/)

The `docs/metadata/` directory stores operational metadata files about documentation (not documentation content itself):

**Location**: `docs/metadata/` at docs root

**Purpose**: Cache files, operational data, validation artifacts

**Naming**: No prefix (folder provides context)

**Examples**:

```
docs/metadata/external-links-status.yaml     # Link validation cache
docs/metadata/frontmatter-validation.json    # Frontmatter check results
docs/metadata/search-index.json              # Generated search index
```

**Rationale**: Similar to files in the `plans/` folder, the directory structure provides sufficient organizational context, making prefixes unnecessary and redundant.

**Key Points:**

- Metadata files are exempt from the prefix requirement
- These are operational files, not documentation content
- They are committed to git for sharing across the team
- They relate to the documentation but are not part of the Diátaxis framework

### Images and Assets

Images follow the same prefix pattern as their related documentation:

```
governance/conventions/formatting/diagrams.md
governance/conventions/formatting/diagrams-example.png
```

## Maintenance and Scalability

### Adding New Directories

When creating a new subdirectory:

1. Apply the 2-letter rule to create the abbreviation
2. Add this abbreviation to the prefix of all files in that directory
3. Update any related index files

**Example**: Creating a hypothetical `governance/conventions/[new-category]/`:

- Directory pattern: `governance/conventions/[new-category]/`
- Subdirectory code: First 2 letters (e.g., `ne` for `new-category`)
- Prefix pattern: `` (ex = explanation, co = conventions, ne = new-category)
- Files pattern: `[content-name].md`

### Renaming Directories

When renaming a directory in `docs/`, you **must rename all files within that directory** to update their prefixes accordingly. This is because the file naming convention encodes the directory path in the filename prefix.

**Exception**: Files in `docs/metadata/` store operational files without prefixes and are exempt from this requirement.

**Process**:

1. Rename the directory
2. Rename all files in that directory to update their prefix
3. Update any markdown links that reference those files
4. Update related index files (`README.md`)

**Example**: Renaming `governance/conventions/formatting/` to `governance/conventions/style/`:

**Before**:

```
governance/conventions/formatting/
├── README.md
├── linking.md
└── indentation.md
```

**After**:

```
governance/conventions/style/
├── README.md
├── linking.md
└── indentation.md
```

**Changes required**:

- Directory: `meta/` → `standards/`
- Subdirectory code: `me` → `st` (first 2 letters)
- Prefix: ``
- All files: `*.md`
- Links: Update all references from `./meta/*.md` to `./standards/*.md`
- Index: Update `governance/conventions/README.md` to reflect new directory name

### Reorganizing Directories

When moving files between directories:

1. Rename all moved files to update their prefix for the new location
2. Update any markdown links that reference those files
3. Update related index files in both source and destination directories

### Scaling to Arbitrary Depth

This system scales to any nesting depth:

```
explicit-over-implicit.md
└─ explanation → principles → software-engineering
   (ex+pr+se)

ayokoding-fs-general-quality-gate.md
└─ explanation → workflows → ayokoding-fs
   (ex+wf+aywe)
```

## Quick Reference

### Root Categories

| Category    | Prefix   | Example                  |
| ----------- | -------- | ------------------------ |
| Tutorials   | `tu__`   | `tu__getting-started.md` |
| How-To      | `hoto__` | `hoto__deploy-docker.md` |
| Reference   | `re__`   | `re__api-reference.md`   |
| Explanation | `ex__`   | _(see subdirectories)_   |

### Explanation Subdirectories (Complete Reference)

| Directory Path                                         | Prefix            | Example                                |
| ------------------------------------------------------ | ----------------- | -------------------------------------- |
| explanation/governance/conventions/formatting          | `ex-go-co-fo__`   | `indentation.md`                       |
| explanation/governance/conventions/writing             | `ex-go-co-wr__`   | `quality.md`                           |
| explanation/governance/conventions/structure           | `ex-go-co-st__`   | `file-naming.md`                       |
| explanation/governance/conventions/tutorials           | `ex-go-co-tu__`   | `naming.md`                            |
| explanation/governance/conventions/hugo                | `ex-go-co-hu__`   | `shared.md`                            |
| explanation/governance/conventions/linking             | `ex-go-co-li__`   | `internal-ayokoding-references.md`     |
| explanation/governance/development/workflow            | `ex-go-de-wo__`   | `commit-messages.md`                   |
| explanation/governance/development/agents              | `ex-go-de-ag__`   | `ai-agents.md`                         |
| explanation/governance/development/quality             | `ex-go-de-qu__`   | `code.md`                              |
| explanation/governance/development/pattern             | `ex-go-de-pa__`   | `functional-programming.md`            |
| explanation/governance/development/hugo                | `ex-go-de-hu__`   | `development.md`                       |
| explanation/governance/development/infra               | `ex-go-de-in__`   | `temporary-files.md`                   |
| explanation/governance/workflows/ayokoding-fs          | `ex-go-wo-ayfs__` | `ayokoding-fs-general-quality-gate.md` |
| explanation/governance/workflows/docs                  | `ex-go-wo-do__`   | `quality-gate.md`                      |
| explanation/governance/workflows/meta                  | `ex-go-wo-me__`   | `workflow-identifier.md`               |
| explanation/governance/workflows/plan                  | `ex-go-wo-pl__`   | `plan-execution.md`                    |
| explanation/governance/workflows/repository            | `ex-go-wo-re__`   | `repository-rules-validation.md`       |
| explanation/governance/principles/general              | `ex-go-pr-ge__`   | `simplicity-over-complexity.md`        |
| explanation/governance/principles/content              | `ex-go-pr-co__`   | `accessibility-first.md`               |
| explanation/governance/principles/software-engineering | `ex-go-pr-se__`   | `explicit-over-implicit.md`            |
| explanation/vision                                     | `ex-vi__`         | `open-sharia-enterprise.md`            |

## Migration History

### 3-Phase Reorganization (2026-01-01)

The repository underwent a comprehensive 3-phase reorganization to introduce subdirectory-based naming:

**Phase 1: Conventions Reorganization**

- Created 6 subdirectories in `governance/conventions/`
- Migrated 24 convention files to new subdirectory structure
- Updated all prefixes from `ex-co__` to ``

**Phase 2: Development Reorganization**

- Created 6 subdirectories in `governance/development/`
- Migrated 15 development files to new subdirectory structure
- Updated all prefixes from `ex-de__` to ``

**Phase 3: Workflows Reorganization**

- Created 5 subdirectories in `governance/workflows/`
- Migrated 7 workflow files to new subdirectory structure
- Updated all prefixes from `ex-wf__` to ``

**Total Impact**: 46 files reorganized, 111+ links updated, zero broken links

**Benefits**:

- Better organization with clearer categorization
- Improved discoverability through logical grouping
- Maintained global uniqueness through subdirectory encoding
- All traceability sections preserved

### Directory Rename (2026-01-25)

Renamed software documentation directories for semantic clarity:

**Changes**:

- `stack-lang/` → `programming-languages/` (prefix: `ex-soen-stla` → `ex-soen-prla`)
- `stack-libs/` → `platform-web/` (prefix: `ex-soen-stli` → `ex-soen-plwe`)

**Impact**: 258 files renamed, 40 reference files updated, 2,150+ internal references

**Rationale**:

- `prog-lang` - Clearer abbreviation for "programming languages"
- `platform-web` - Aligns with platform web technology focus (Spring Boot, Phoenix, React)

**Prefix Abbreviations**:

- `prla` = `pr` (prog) + `la` (lang) - hyphenated compound rule
- `plwe` = `pl` (platform) + `we` (web) - hyphenated compound rule

### Programming Language Abbreviations

Files in `docs/explanation/software-engineering/programming-languages/` use a 2-character language code in their prefix (`ex-soen-prla-[lang]__[topic].md`). The language codes follow the first-2-characters rule:

| Language    | Code | Rationale                                                            |
| ----------- | ---- | -------------------------------------------------------------------- |
| Dart        | `da` | First 2 characters of "dart"                                         |
| Elixir      | `el` | First 2 characters of "elixir"                                       |
| Go (Golang) | `go` | First 2 characters of "golang"                                       |
| Java        | `ja` | First 2 characters of "java"                                         |
| Python      | `py` | First 2 characters of "python"                                       |
| TypeScript  | `ty` | First 2 characters of "type" (from "TypeScript")                     |
| Kotlin      | `ko` | First 2 characters of "kotlin"                                       |
| Rust        | `rs` | Common file extension abbreviation (`rs`), consistent with ecosystem |
| Clojure     | `cl` | First 2 characters of "clojure"                                      |
| F#          | `fs` | Common file extension abbreviation (`fs`), consistent with ecosystem |
| C#          | `cs` | Common file extension abbreviation (`cs`), consistent with ecosystem |

**Note on TypeScript**: Uses `ty` (not `ts`) to apply the first-2-characters-of-word rule consistently ("Type-Script" → `ty`). Using `ts` would conflict with the TypeScript file extension convention.

**Example files**:

- `ex-soen-prla-da__idioms.md` - Dart idioms
- `ex-soen-prla-el__best-practices.md` - Elixir best practices
- `ex-soen-prla-go__antipatterns.md` - Go antipatterns
- `ex-soen-prla-ja__idioms.md` - Java idioms
- `ex-soen-prla-py__best-practices.md` - Python best practices
- `ex-soen-prla-ty__antipatterns.md` - TypeScript antipatterns

**Topic Naming Flexibility**: Topic names in the content identifier are flexible. Two naming patterns are both acceptable within this repository:

- **Without `-standards` suffix** (Python, TypeScript, Dart): `idioms`, `best-practices`, `testing`, `anti-patterns` — topic names stand alone
- **With `-standards` suffix** (Java, Elixir, Go): `coding-standards`, `testing-standards`, `error-handling-standards` — topic names emphasize these are OSE Platform style guides

Both patterns are internally consistent within each language group and acceptable. When adding files to an existing language directory, follow the pattern already established for that language.

## Related Documentation

- [Linking Convention](../formatting/linking.md) - How to link between documentation files
- [Diátaxis Framework](./diataxis-framework.md) - Understanding the documentation organization framework
- [Conventions Index](../README.md) - Index of all documentation conventions

---

**Last Updated**: 2026-01-25
