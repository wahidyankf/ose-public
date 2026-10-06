---
name: apps-ayokoding-www-developing-content
description: Guide for creating content on ayokoding-web, a Next.js 16 fullstack content platform (ayokoding-web). Covers bilingual content strategy (default English), tRPC API, content workflow, and ayokoding-web specific patterns. Essential for content creation tasks on ayokoding-web
---

# ayokoding-web Content Development Skill

## Purpose

This Skill provides comprehensive knowledge for creating and managing content on **ayokoding-web**, a Next.js 16 fullstack content platform that serves as a bilingual educational platform for Indonesian developers.

**When to use this Skill:**

- Creating educational content on ayokoding-web
- Setting up programming language tutorials
- Managing bilingual content (English/Indonesian)
- Writing by-example tutorials with proper annotation density
- Following ayokoding-web specific conventions

## Core Concepts

### Site Overview

**ayokoding-web** (`apps/ayokoding-www/`):

- **Site**: www.ayokoding.com
- **Framework**: Next.js 16 (App Router, TypeScript, tRPC)
- **Purpose**: Bilingual educational platform
- **Languages**: Indonesian (id) and English (en)
- **Content Types**: Learning content, personal essays (celoteh/rants), video content

### Bilingual Strategy

**Default Language**: English (`en`)

**Critical Rule**: Content does NOT have to be mirrored between languages

- ✅ Content can exist in English only
- ✅ Content can exist in Indonesian only
- ✅ Content can exist in both (if explicitly created)
- ❌ Do NOT automatically create mirror content in other language

**Workflow**: Create English content first → Review → Decide if Indonesian version needed → Create Indonesian as separate task

## Canonical Content Tree Shape

See [Canonical Content Tree Shape](./reference/canonical-content-tree-shape.md) for the mandatory four-layer hierarchy, track-naming rules, and current top-level domain census.

## By-Example Tutorial Standards

### Annotation Density Requirement

**CRITICAL**: All code examples MUST meet annotation density standards

**Target**: 1.0-2.25 comment lines per code line **PER EXAMPLE**

- **Minimum**: 1.0 (examples below need enhancement)
- **Optimal**: 1-2.25 (target range)
- **Upper bound**: 2.5 (examples exceeding need reduction)

### Annotation Pattern

Use `// =>` or `# =>` notation to document:

```java
int x = 10;                      // => x is 10 (type: int)
String result = transform(x);    // => Calls transform with 10
                                 // => result is "10-transformed" (type: String)
System.out.println(result);      // => Output: 10-transformed
```

**Simple lines get 1 annotation, complex lines get 2 annotations**

## No H1 Headings in Content

**CRITICAL**: ayokoding-web content MUST NOT include ANY H1 headings (`# ...`) in markdown content body.

**Rationale**: The page title is rendered as the H1 from content metadata. Each page should have exactly ONE H1.

**Rule**: Content should start with introduction text or H2 headings (`## ...`).

## Deployment Workflow

See [Deployment Workflow](./reference/deployment-workflow.md) for the production branch, automated CI schedule, emergency deployment, and force-push rationale.

## References

**Related Conventions**:

- [Programming Language Tutorial Structure](../../../repo-governance/conventions/tutorials/programming-language-structure.md) - Dual-path organization
- [By Example Tutorial Convention](../../../repo-governance/conventions/tutorials/swe-by-example.md) - Annotation standards
- [Content Quality Principles](../../../repo-governance/conventions/writing/quality.md) - Universal quality standards

**Related Skills**:

- `docs-creating-by-example-tutorials` - Detailed by-example tutorial guidance
- `docs-creating-accessible-diagrams` - Accessible diagram creation for tutorials

---

This Skill packages critical ayokoding-web development knowledge for progressive disclosure.
