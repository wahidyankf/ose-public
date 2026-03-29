---
name: apps-ayokoding-fs-developing-content
description: Comprehensive guide for creating content on ayokoding-fs, a Next.js 16 fullstack content platform (ayokoding-fs). Covers bilingual content strategy (default English), tRPC API, content workflow, and ayokoding-fs specific patterns. Essential for content creation tasks on ayokoding-fs
---

# ayokoding-fs Content Development Skill

## Purpose

This Skill provides comprehensive knowledge for creating and managing content on **ayokoding-fs**, a Next.js 16 fullstack content platform that serves as a bilingual educational platform for Indonesian developers.

**When to use this Skill:**

- Creating educational content on ayokoding-fs
- Setting up programming language tutorials
- Managing bilingual content (English/Indonesian)
- Writing by-example tutorials with proper annotation density
- Following ayokoding-fs specific conventions

## Core Concepts

### Site Overview

**ayokoding-fs** (`apps/ayokoding-fs/`):

- **Site**: ayokoding.com
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

**CRITICAL**: ayokoding-fs content MUST NOT include ANY H1 headings (`# ...`) in markdown content body.

**Rationale**: The page title is rendered as the H1 from content metadata. Each page should have exactly ONE H1.

**Rule**: Content should start with introduction text or H2 headings (`## ...`).

## Deployment Workflow

Deploy ayokoding-fs to production using automated CI or the deployer agent.

### Production Branch

**Branch**: `prod-ayokoding-fs`
**Purpose**: Deployment-only branch that Vercel monitors
**Build System**: Vercel (Next.js)

### Automated Deployment (Primary)

The `test-and-deploy-ayokoding-fs.yml` GitHub Actions workflow handles routine deployment:

- **Schedule**: Runs at 6 AM and 6 PM WIB (UTC+7) every day
- **Change detection**: Diffs `HEAD` vs `prod-ayokoding-fs` scoped to `apps/ayokoding-fs/` — skips build/deploy when nothing changed
- **Build**: Runs `nx build ayokoding-fs` (Next.js build)
- **Deploy**: Force-pushes `main` to `prod-ayokoding-fs`; Vercel auto-builds

**Manual trigger**: From the GitHub Actions UI, trigger `test-and-deploy-ayokoding-fs.yml` with `force_deploy=true` to deploy immediately regardless of changes.

### Emergency / On-Demand Deployment

For immediate deployment outside the scheduled window:

```bash
git push origin main:prod-ayokoding-fs --force
```

Or use the `apps-ayokoding-fs-deployer` agent for a guided deployment.

### Why Force Push

**Safe for deployment branches**:

- prod-ayokoding-fs is deployment-only (no direct commits)
- Always want exact copy of main branch
- Trunk-based development: main is source of truth

## References

**Related Conventions**:

- [Programming Language Tutorial Structure](../../../governance/conventions/tutorials/programming-language-structure.md) - Dual-path organization
- [By Example Tutorial Convention](../../../governance/conventions/tutorials/by-example.md) - Annotation standards
- [Content Quality Principles](../../../governance/conventions/writing/quality.md) - Universal quality standards

**Related Skills**:

- `docs-creating-by-example-tutorials` - Detailed by-example tutorial guidance
- `docs-creating-accessible-diagrams` - Accessible diagram creation for tutorials

---

This Skill packages critical ayokoding-fs development knowledge for progressive disclosure.
