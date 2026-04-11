---
title: "Documentation Linking Convention"
description: Standards for linking between documentation files in open-sharia-enterprise
category: explanation
subcategory: conventions
tags:
  - linking
  - markdown
  - conventions
  - github-compatibility
created: 2025-11-22
updated: 2026-03-09
---

# Documentation Linking Convention

This document defines the standard syntax and practices for linking between documentation files in the open-sharia-enterprise project. Following these conventions ensures links render correctly on GitHub and work in any standard markdown viewer.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Uses explicit relative paths (`./path/to/file.md`) instead of implicit wiki-style links (`[[filename]]`). File extensions are always included, making it clear what type of file is being referenced. No magic linking behavior - every path is stated clearly.

- **[Accessibility First](../../principles/content/accessibility-first.md)**: Descriptive link text (not filenames) improves screen reader experience. Users hear meaningful context like "File Naming Convention" instead of cryptic identifiers like "ex-co\_\_file-naming-convention".

## Purpose

This convention establishes the standard linking format for all markdown files in the repository. It ensures links are GitHub-compatible, use relative paths with `.md` extensions, and follow consistent patterns across documentation and Hugo sites. This prevents broken links and maintains portability.

## Scope

### What This Convention Covers

- **Markdown link syntax** - `Display Text` format
- **Relative vs. absolute paths** - When to use each
- **Extension requirements** - `.md` extension for docs/, no extension for Hugo sites
- **Cross-directory linking** - How to link between different documentation areas
- **External link formatting** - How to format links to external resources

### What This Convention Does NOT Cover

- **Link validation** - Covered by docs-link-general-checker and apps-ayokoding-web-link-checker agents
- **Link text quality** - Descriptive link text is covered in [Content Quality Principles](../writing/quality.md)
- **Hugo site URLs** - Hugo-specific linking covered in Hugo content conventions
- **Anchor links** - Deep linking to specific sections (implementation detail)

## Why GitHub-Compatible Links?

We use standard markdown link syntax with explicit relative paths to ensure:

1. **GitHub Rendering** - GitHub does not render wiki-style `[[...]]` links; standard markdown links render correctly on GitHub web and anywhere else
2. **Universal Compatibility** - Links work in any standard markdown viewer, VS Code, and CI link checkers
3. **Explicit Paths** - Relative paths make it clear where files are located
4. **Version Control** - Easier to track changes and validate links in CI/CD
5. **No Ambiguity** - Full paths prevent confusion when files have similar names

## Link Syntax Standard

### Required Format

Use standard markdown link syntax with relative paths:

```markdown
`Display Text`
```

### Key Rules

1. **Always include the `.md` extension**

   ```markdown
   PASS: [Initial Setup](./tutorials/initial-setup.md)
   FAIL: [Initial Setup](./tutorials/initial-setup)
   ```

2. **Use relative paths from the current file's location**
   - Same directory: `./file.md`
   - Parent directory: `../file.md`
   - Subdirectory: `./subdirectory/file.md`
   - Multiple levels up: `../../path/to/file.md`
   - **Important**: The number of `../` depends on your file's nesting depth (see [Nested Directory Linking](#nested-directory-linking))

3. **Use descriptive link text instead of filename identifiers**
   - PASS: `[File Naming Convention](../structure/file-naming.md)`
   - FAIL: `[file-naming](../structure/file-naming.md)`

4. **Avoid wiki-link syntax**
   - FAIL: `[[filename]]`
   - FAIL: `[[filename|Display Text]]`
   - Reason: GitHub does not render `[[...]]` as links.

## Examples by Location

### Linking from Root README (`docs/README.md`)

```markdown
<!-- Link to category index files -->

[Tutorials](./README.md)
[How-To Guides](./README.md)
[Reference](./README.md)
[Explanation](./README.md)

<!-- Link to nested files -->

[File Naming Convention](../structure/file-naming.md)
[Conventions Index](../README.md)
```

### Linking from Category Index (`docs/tutorials/README.md`)

```markdown
<!-- Link to sibling files in same directory -->

[Initial Setup](./initial-setup.md)
[First Deployment](./first-deployment.md)

<!-- Link to parent directory -->

[Documentation Home](./README.md)

<!-- Link to other categories -->

[How-To Guides](./README.md)
[API Reference](./README.md)
```

### Linking from Nested Files (`governance/conventions/README.md`)

```markdown
<!-- Link to sibling files in same directory -->

[File Naming Convention](../structure/file-naming.md)
[Linking Convention](./linking.md)

<!-- Link to parent directory -->

[Explanation Index](../../docs/explanation/README.md)

<!-- Link to root -->

[Documentation Home](./README.md)

<!-- Link to other categories -->

[Tutorials](./README.md)
```

## Correct vs. Incorrect Examples

### PASS: Correct Examples

```markdown
<!-- Descriptive text with relative path and .md extension -->

[Understanding the Diátaxis Framework](../structure/diataxis-framework.md)
[Monorepo Structure](../../../docs/reference/monorepo-structure.md)
[AI Agents Convention](../../development/agents/ai-agents.md)

<!-- Links with context -->

See the [file naming convention](../structure/file-naming.md) for details.
For more information, refer to our [automation principle](../../principles/software-engineering/automation-over-manual.md).
```

### FAIL: Incorrect Examples

```markdown
<!-- Wiki-link syntax (GitHub does not render these) -->

[[diataxis-framework]]
[[diataxis-framework|Diátaxis Framework]]

<!-- Missing .md extension -->

[Diátaxis Framework](./diataxis-framework)

<!-- Absolute paths -->

[Conventions](../README.md)

<!-- Using filename as link text -->

[file-naming.md](../structure/file-naming.md)

<!-- Wrong number of ../ for nesting depth -->
<!-- From governance/conventions/formatting/linking.md (3 levels deep) -->

[Documentation Home](./README.md) <!-- Should be ../../../README.md -->
[Tutorials](./README.md) <!-- Only 1 ../ instead of 3 -->

<!-- From governance/conventions/README.md (2 levels deep) -->

[Documentation Home](./README.md) <!-- Too many ../ (3 instead of 2) -->
```

## External Links

For links to external resources:

```markdown
<!-- Standard markdown links -->

[Diátaxis Framework](https://diataxis.fr/)
[GitHub](https://github.com/wahidyankf/open-sharia-enterprise)
```

## Nested Directory Linking

Understanding relative paths is crucial when linking from files at different nesting depths. The number of `../` you need depends on how deep your current file is nested.

### How to Calculate Relative Paths

1. **Count how many directories deep your current file is** from the `docs/` root
2. **Use that many `../` to reach the `docs/` root**
3. **Then navigate down** to your target file

### Nesting Depth Reference

| File Location                                     | Depth from `docs/` | To reach `docs/` root |
| ------------------------------------------------- | ------------------ | --------------------- |
| `docs/README.md`                                  | 0 (at root)        | `.` (current dir)     |
| `docs/tutorials/README.md`                        | 1 level deep       | `../`                 |
| `governance/conventions/README.md`                | 2 levels deep      | `../../`              |
| `governance/conventions/formatting/linking.md`    | 3 levels deep      | `../../../`           |
| `governance/principles/software-engineering/*.md` | 3 levels deep      | `../../../`           |

### Common Linking Patterns

#### From 1-Level Deep Files (`docs/explanation/README.md`)

```markdown
<!-- To sibling directories (same level) -->

[Conventions](./README.md)
[Development](./README.md)

<!-- To parent (docs/ root) -->

[Documentation Home](./README.md)

<!-- To other categories (up 1, down 1) -->

[Tutorials](./README.md)
[How-To](./README.md)
```

#### From 3-Level Deep Files (`governance/conventions/formatting/linking.md`)

```markdown
<!-- To docs/ root (up 3 levels) -->

[Documentation Home](./README.md)

<!-- To other categories (up 3, down 1) -->

[Tutorials](./README.md)
[How-To](./README.md)

<!-- To sibling files (same directory) -->

[File Naming Convention](../structure/file-naming.md)
```

#### From 3-Level Deep Files (`governance/principles/software-engineering/explicit-over-implicit.md`)

```markdown
<!-- To docs/ root (up 3 levels) -->

[Documentation Home](./README.md)

<!-- To other categories (up 3, down 1 or 2) -->

[Tutorials](./README.md)
[Conventions](./README.md)

<!-- To parent categories (up 1, 2, or 3) -->

[Software Engineering Principles](./README.md) <!-- Parent directory -->
[All Principles](./README.md) <!-- Grandparent directory -->
[Explanation Index](../../docs/explanation/README.md) <!-- Great-grandparent -->
```

### Verification Tip

To verify your relative path is correct:

1. **Start at your current file's location**
2. **Count each `../` as going up one directory level**
3. **Count each `/dirname/` as going down one level**
4. **Verify you end at the target file**

Example from `governance/conventions/structure/file-naming.md` to `docs/tutorials/README.md`:

```
Start:  governance/conventions/structure/file-naming.md
  ../   governance/conventions/structure/ → governance/conventions/   (up 1)
  ../   governance/conventions/ → governance/                         (up 2)
  ../   governance/ → / (repo root)                                   (up 3)
  docs/tutorials/README.md                                            (down into target)

Final path: ../../../docs/tutorials/README.md
```

## Historical: Hugo Content Linking (DEPRECATED)

**Note**: Both `apps/ayokoding-web/` and `apps/oseplatform-web/` have migrated to Next.js 16. The Hugo-specific linking rules below no longer apply to active sites. This section is preserved for historical reference only.

**Previous Hugo rules** (no longer applicable):

- **Hugo internal links** used absolute paths starting with `/` (e.g., `/learn/ai/chat-with-pdf`)
- **Hugo links omitted** the `.md` extension
- **Why different**: Hugo rendered the same navigation content in different page contexts (sidebar, mobile menu, homepage), so relative paths would resolve incorrectly

Both sites now follow standard GitHub-compatible markdown linking with `.md` extension. See [Hugo Content Convention - Shared](../hugo/shared.md) for historical Hugo standards.

## Anchor Links (Same Page)

For linking to headings within the same document:

```markdown
[See Examples](#examples-by-location)
[Jump to Key Rules](#key-rules)
```

## Image Links

For embedding images:

```markdown
<!-- Same directory -->

![Diagram](./diagram.png)

<!-- Subdirectory -->

![Architecture](./images/architecture-diagram.png)
```

## PASS: Verification Checklist

Before committing documentation with links:

- [ ] All links use `Text` syntax
- [ ] All internal links include `.md` extension
- [ ] All paths are relative (not absolute)
- [ ] Link text is descriptive (not filename-based)
- [ ] No wiki-link syntax (`[[...]]`) used
- [ ] Manually verified links point to existing files
- [ ] Paths tested from the current file's location

## Link Validation

When creating documentation, verify links by:

1. **Manual Testing**: Click links in your markdown viewer
2. **File Existence**: Use `ls` or `find` to verify target files exist
3. **Path Correctness**: Count `../` levels to ensure correct relative path
4. **Extension Check**: Confirm `.md` is present in all internal links

## Related Documentation

- [File Naming Convention](../structure/file-naming.md) - How to name documentation files
- [Conventions Index](../README.md) - Overview of all documentation conventions

---

**Last Updated**: 2026-03-09

## When to Link Rule References

When referencing repository rules (visions, principles, conventions, development practices, workflows), use a **two-tier formatting approach**:

### First Mention: MUST Use Markdown Link

The **first mention** of a rule in any document section MUST use a markdown link:

```markdown
[Rule Name](./path/to/rule.md)
```

**Rule categories requiring this treatment:**

- Vision documents (`governance/vision/`)
- Core Principles (`governance/principles/`)
- Conventions (`governance/conventions/`)
- Development practices (`governance/development/`)
- Workflows (`governance/workflows/`)

### Subsequent Mentions: MUST Use Inline Code

**Subsequent mentions** of the same rule within the same section MUST use inline code formatting:

```markdown
`rule-name`
```

### Examples

#### PASS: Correct - Two-Tier Formatting

```markdown
## Implementation Details

This feature implements the [Linking Convention](./linking.md) by using relative paths. The `Linking Convention` requires `.md` extensions, which helps maintain compatibility across viewers. When applying `Linking Convention` rules, verify all paths are relative.
```

**Analysis:**

- First mention: `[Linking Convention](./linking.md)` PASS: (markdown link)
- Second mention: `` `Linking Convention` `` PASS: (inline code)
- Third mention: `` `Linking Convention` `` PASS: (inline code)

#### PASS: Correct - Multiple Rules

```markdown
## Standards Compliance

All documentation follows the [File Naming Convention](../structure/file-naming.md) and [Linking Convention](./linking.md). The `File Naming Convention` defines kebab-case filename rules, while the `Linking Convention` specifies link syntax. Both `File Naming Convention` and `Linking Convention` are validated by docs-checker.
```

**Analysis:**

- File Naming Convention: First mention (link) , subsequent mentions (inline code)
- Linking Convention: First mention (link) , subsequent mentions (inline code)

#### FAIL: Incorrect - All Plain Text

```markdown
## Standards Compliance

All documentation follows the Linking Convention. The Linking Convention requires .md extensions. When applying Linking Convention rules, verify paths.
```

**Issue:** No links or inline code formatting - readers cannot navigate to convention document.

#### FAIL: Incorrect - All Links

```markdown
## Standards Compliance

All documentation follows the [Linking Convention](./linking.md). The [Linking Convention](./linking.md) requires .md extensions. When applying [Linking Convention](./linking.md) rules, verify paths.
```

**Issue:** Redundant links create visual clutter and maintenance burden.

#### FAIL: Incorrect - All Inline Code

```markdown
## Standards Compliance

All documentation follows the `Linking Convention`. The `Linking Convention` requires .md extensions. When applying `Linking Convention` rules, verify paths.
```

**Issue:** First mention lacks navigable link - readers cannot discover the convention document.

### Exclusions

This two-tier formatting does NOT apply to:

- **Code blocks** - Already formatted as code
- **Quoted text** - Preserve original formatting
- **File path specifications** - Use literal paths
- **Meta-discussion about naming** - When discussing rule names as strings

**Example exclusions:**

````markdown
<!-- Code block - already formatted -->

```bash
# Apply linking-convention rules
validate_docs_links
```
````

<!-- Quoted text - preserve original -->

> The author wrote "see linking convention for details"

<!-- File path - literal path -->

The rule is defined in `governance/conventions/formatting/linking.md`

<!-- Meta-discussion - discussing the name itself -->

We renamed "link-convention" to "linking-convention" for clarity

```

### Validation

The [docs-checker agent](../../../.claude/agents/docs-checker.md) validates this two-tier formatting requirement:

- **First mention without link** → CRITICAL issue (breaks navigation)
- **Subsequent mention without inline code** → HIGH issue (convention violation)
- **All mentions improperly formatted** → CRITICAL issue (complete non-compliance)

```
