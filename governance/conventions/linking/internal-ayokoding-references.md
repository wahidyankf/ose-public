---
title: "Internal AyoKoding Reference Links Convention"
description: Standards for linking from docs/ to apps/ayokoding-web/ content using relative paths instead of public web URLs
category: explanation
subcategory: conventions
tags:
  - linking
  - cross-reference
  - relative-paths
  - portability
  - ayokoding-web
created: 2026-02-07
---

# Internal AyoKoding Reference Links Convention

This document defines standards for linking from documentation in `docs/` to educational content in `apps/ayokoding-web/` using repository-relative paths instead of public web URLs. This ensures links work during local development, testing, and remain portable across environments.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Uses explicit relative file paths instead of implicit external URLs. When a docs/ file references ayokoding-web content, the relative path `../../../../../apps/ayokoding-web/content/en/learn/...` makes the relationship explicit and visible. No hidden assumptions about domain availability or DNS resolution.

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: Relative paths work consistently across all environments (local development, CI/CD, offline testing, cloned repositories). External URLs depend on network availability, domain ownership, and DNS configuration. Relative paths eliminate these external dependencies for reproducible local builds.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: One linking pattern works everywhere in the repository. No special cases for "internal but looks external" links. No need to configure domain mappings or link rewriting. Just count the directory levels and use relative paths.

## Purpose

This convention ensures documentation references to AyoKoding educational content remain functional and portable across all development contexts. It prevents broken links when:

- Working offline or without internet access
- Testing in local development environments
- Running CI/CD pipelines in isolated containers
- Cloning the repository to different systems
- Migrating domains or hosting infrastructure
- Archiving or backing up documentation

**Key insight**: Content in `apps/ayokoding-web/` is part of the **same repository**. References from `docs/` to AyoKoding content should use repository-internal linking (relative paths), not public web linking (external URLs).

## Scope

### What This Convention Covers

- **docs/ → apps/ayokoding-web/** - Linking from documentation to AyoKoding educational content
- **Relative path calculation** - How to determine correct `../` depth
- **URL pattern recognition** - Identifying when to use relative paths vs external URLs
- **Path examples by location** - Common linking scenarios and correct paths
- **Enforcement mechanisms** - Manual review and automated validation

### What This Convention Does NOT Cover

- **General markdown linking** - Covered by [Linking Convention](../formatting/linking.md)
- **Hugo internal navigation** - Covered by [Hugo Content Convention - ayokoding](../hugo/ayokoding.md)
- **External web resources** - Public URLs to third-party sites (Stack Overflow, GitHub, etc.)
- **Cross-repository references** - Links to content in separate git repositories
- **apps/ayokoding-web/ → docs/** - Reverse direction (educational content linking to docs)

## Standards

### Core Rule: Use Relative Paths for Repository-Internal References

When documentation in `docs/` references educational content in `apps/ayokoding-web/`, use **relative file paths** within the repository, not public web URLs.

**Rationale:**

1. **Works during local development** - No web server or domain required
2. **Environment independence** - Same link works in dev, test, CI/CD, production
3. **Offline capability** - Developers can work without internet access
4. **Domain portability** - Links remain valid if domain changes
5. **Explicit relationship** - Path shows repository structure clearly

### Pattern Recognition

#### ❌ WRONG: Public Web URL

```markdown
[Java Explanation](https://ayokoding.com/en/learn/software-engineering/programming-languages/java/)
```

**Problems:**

- Breaks during offline development
- Fails if domain changes or is unavailable
- Creates external dependency on DNS and web server
- Obscures that content is in same repository

#### ✅ CORRECT: Relative Repository Path

```markdown
[Java Explanation](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/)
```

**Benefits:**

- Works in all environments (local, CI/CD, offline)
- No external dependencies
- Portable across domain changes
- Explicit repository relationship

### Path Calculation Method

To calculate the correct relative path from `docs/` to `apps/ayokoding-web/`:

1. **Count your depth in docs/** - How many directories deep is your current file?
2. **Navigate to repository root** - Use that many `../` to reach the root
3. **Navigate down to target** - `apps/ayokoding-web/content/[lang]/[path]/`

**Formula:** `[../]×depth + apps/ayokoding-web/content/[lang]/[path]/`

### Common Path Examples

#### From docs/explanation/software-engineering/programming-languages/java/

**Depth:** 5 levels deep (`docs` → `explanation` → `software-engineering` → `programming-languages` → `java`)

**Target:** `apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/`

**Path:**

```markdown
../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/
```

**Breakdown:**

```
Start:  docs/explanation/software-engineering/programming-languages/java/README.md
../     docs/explanation/software-engineering/programming-languages/  (up 1)
../     docs/explanation/software-engineering/                        (up 2)
../     docs/explanation/                                             (up 3)
../     docs/                                                          (up 4)
../     [repository root]                                              (up 5)
apps/ayokoding-web/                                                    (down 1)
content/en/learn/software-engineering/programming-languages/java/     (down to target)
```

#### From docs/explanation/software-engineering/platform-web/tools/jvm-spring/

**Depth:** 6 levels deep

**Target:** `apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/`

**Path:**

```markdown
../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/
```

#### From docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/

**Depth:** 6 levels deep

**Target:** `apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/`

**Path:**

```markdown
../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/
```

### Language Selection

AyoKoding content is bilingual (English and Indonesian). When linking from `docs/` (English-only), use the **English path** (`/en/`):

**Pattern:**

```markdown
apps/ayokoding-web/content/en/learn/[topic-path]/
```

**Not:**

```markdown
apps/ayokoding-web/content/id/learn/[topic-path]/ ← Indonesian version
```

**Rationale:** Documentation in `docs/` is written in English, so references should point to English educational content for consistency.

### Link Text Guidelines

Use **descriptive, context-appropriate link text** that follows [Content Quality Principles](../writing/quality.md):

**Good examples:**

```markdown
[Java programming language explanation](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/)

[Spring Framework fundamentals](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/)

[Complete Spring Boot tutorial series](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/)
```

**Avoid:**

```markdown
[here](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/) ← Vague

[Click this link](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/) ← Non-descriptive

[ayokoding-web](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/) ← Technical, not semantic
```

## Examples

### Example 1: Java Documentation Cross-Reference

**Context:** docs/explanation/software-engineering/programming-languages/java/README.md references AyoKoding Java tutorials

**Scenario:** Pointing readers to comprehensive Java learning content

❌ **WRONG:**

```markdown
For hands-on Java tutorials, see our [Java learning path](https://ayokoding.com/en/learn/software-engineering/programming-languages/java/).
```

✅ **CORRECT:**

```markdown
For hands-on Java tutorials, see our [Java learning path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/).
```

### Example 2: Spring Framework Reference

**Context:** docs/explanation/software-engineering/platform-web/tools/jvm-spring/README.md references AyoKoding Spring content

**Scenario:** Directing readers to framework tutorials

❌ **WRONG:**

```markdown
Learn Spring Framework basics at [ayokoding.com](https://ayokoding.com/en/learn/software-engineering/platform-web/tools/jvm-spring/).
```

✅ **CORRECT:**

```markdown
Learn Spring Framework basics in our [comprehensive Spring tutorial series](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/).
```

### Example 3: Spring Boot Deep Dive

**Context:** docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/README.md references Spring Boot tutorials

**Scenario:** Cross-referencing detailed Spring Boot educational content

❌ **WRONG:**

```markdown
Check out our [Spring Boot tutorials](https://ayokoding.com/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/) for practical examples.
```

✅ **CORRECT:**

```markdown
Check out our [Spring Boot tutorials](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/) for practical examples.
```

### Example 4: Multiple Cross-References in One Document

**Context:** docs/explanation/software-engineering/programming-languages/java/README.md references multiple AyoKoding sections

**Scenario:** Comprehensive navigation to related educational content

✅ **CORRECT:**

```markdown
## Learning Resources

This documentation provides reference material for Java in the open-sharia-enterprise project. For comprehensive learning content, explore:

- **[Java Fundamentals](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/)** - Core language concepts, syntax, and basic programming
- **[Spring Framework](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/)** - Dependency injection, AOP, and enterprise patterns
- **[Spring Boot](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/)** - Rapid application development with Spring ecosystem
```

## Path Verification Checklist

Before committing documentation with AyoKoding references:

- [ ] All AyoKoding links use relative paths (no `https://ayokoding.com/...`)
- [ ] Path depth matches file location in docs/ hierarchy
- [ ] Paths use `/en/` language directory (not `/id/`)
- [ ] Paths point to existing directories in apps/ayokoding-web/content/
- [ ] Link text is descriptive and context-appropriate
- [ ] Links tested locally (navigate in file explorer or markdown preview)

## Enforcement

### Manual Code Review

During pull request review, verify:

1. **Pattern recognition** - Flag any `https://ayokoding.com/` URLs in docs/
2. **Path correctness** - Verify relative paths match file location depth
3. **Link functionality** - Test that paths resolve to existing content

### Automated Validation (Future)

**Link validation in CI/CD:**

```bash
# Detect public AyoKoding URLs in docs/
grep -r "https://ayokoding.com" docs/ && exit 1

# Validate relative path targets exist
find docs/ -name "*.md" -exec markdown-link-check {} \;
```

### Agent Validation

The [docs-checker agent](../../../.claude/agents/docs-checker.md) should validate:

- **CRITICAL:** docs/ files containing `https://ayokoding.com/` URLs
- **HIGH:** Relative paths with incorrect depth (path doesn't resolve)
- **MEDIUM:** Missing AyoKoding cross-references where expected

## Edge Cases and Special Considerations

### When to Use Public URLs

Use public `https://ayokoding.com/` URLs **only when:**

1. **External documentation** - Content published outside this repository
2. **Marketing materials** - Promotional content referencing the live site
3. **Blog posts or social media** - Public-facing content
4. **User-facing documentation** - End-user help that assumes deployed site

**Within docs/ directory:** Default to relative paths unless there's explicit reason to use public URL.

### Cross-Language References

If referencing **Indonesian content** specifically (rare from English docs):

```markdown
[Konten Bahasa Indonesia](../../../../../apps/ayokoding-web/content/id/learn/...)
```

**But:** Prefer English (`/en/`) for consistency when linking from English documentation.

### Broken Path Migration

If AyoKoding content structure changes (directory reorganization):

1. **Update relative paths** in docs/ to match new structure
2. **Run link validation** to catch broken references
3. **Document breaking changes** in pull request
4. **Update this convention** if patterns change systematically

## Real-World Context

**Historical issue:** This convention was created after discovering 50+ instances where public web links (`https://ayokoding.com/...`) were incorrectly used instead of relative paths in Java, Spring Framework, and Spring Boot explanation documentation.

**Impact:** These external URLs created false external dependencies for repository-internal content, breaking offline development workflows and obscuring the repository structure.

**Resolution:** Systematic replacement of all `https://ayokoding.com/` URLs in docs/explanation/ with correct relative paths following this convention.

## References

**Related Conventions:**

- [Linking Convention](../formatting/linking.md) - General markdown linking standards (GitHub-compatible paths with `.md`)
- [Hugo Content Convention - ayokoding](../hugo/ayokoding.md) - How AyoKoding content itself handles internal navigation
- [Hugo Content Convention - Shared](../hugo/shared.md) - Adapted linking conventions for Hugo sites

**Related Principles:**

- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) - Why explicit relative paths over implicit external URLs
- [Reproducibility First](../../principles/software-engineering/reproducibility.md) - Why links must work across all environments
- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) - One pattern for repository-internal references

**Agents:**

- `docs-checker` - Validates docs/ links follow this convention
- `docs-fixer` - Applies corrections to convert public URLs to relative paths
