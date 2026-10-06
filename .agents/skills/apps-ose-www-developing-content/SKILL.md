---
name: apps-ose-www-developing-content
description: Guide for creating content on ose-web Next.js 16 content platform. Covers English-only landing page structure, update posts with date-prefixed filenames, markdown frontmatter (title, date, tags, summary, showtoc), simple flat organization, and ose-web specific conventions. Essential for ose-web content creation tasks
---

# OSE Platform Web Content Development Skill

## Purpose

This Skill provides guidance for creating and managing content on the **ose-web** Next.js 16 content platform which serves as an English-only project landing page.

**When to use this Skill:**

- Creating platform updates on ose-web
- Writing about page content
- Managing landing page structure
- Configuring markdown frontmatter
- Understanding ose-web specific patterns

## Core Concepts

### Site Overview

**ose-web** (`apps/ose-www/`):

- **Site**: www.oseplatform.com
- **Theme**: Next.js 16 (App Router, TypeScript, tRPC)
- **Purpose**: English-only project landing page
- **Content Types**: Platform updates, about page
- **Structure**: Flat, simple organization

### English-Only Content

**NO Multi-Language Structure**:

- All content in English
- No language subdirectories
- Simple, flat content organization
- No bilingual content management

## Content Structure

```
apps/ose-www/content/
├── updates/                               # Platform updates
│   ├── _index.md
│   ├── 2025-12-07-initial-release.md    # Date-prefixed
│   └── 2025-11-20-announcement.md        # Date-prefixed
└── about.md                               # About page
```

**Simplicity principle**: No deep hierarchies, no complex organization.

## Date-Prefixed Filenames

### Update Post Naming

**CRITICAL**: All update posts use date prefix for automatic chronological sorting

**Format**: `YYYY-MM-DD-title.md`

**Examples**:

- `2025-12-07-beta-release.md`
- `2025-11-20-platform-announcement.md`
- `2025-10-15-architecture-overview.md`

**Rationale**:

- Automatic chronological ordering (no weight management needed)
- Clear publication date from filename
- Easy sorting in file system

### About Page Naming

**Format**: Simple slug without date prefix

**Example**: `about.md`

## Next.js 16 Frontmatter

See [Next.js 16 Frontmatter](./reference/frontmatter.md) for the required fields, recommended
fields, Next.js-16-specific fields (ToC, metadata display, search/SEO, cover image), and the
per-post author field rules.

## Content Types, Links, and Assets

See [Content Types, Links, and Assets](./reference/content-structure-and-links.md) for
update-post and about-page frontmatter examples, internal-link format, and static asset
organization.

## Next.js 16 Features and Comparison

See [Next.js 16 Features and ayokoding-web Comparison](./reference/features-and-comparison.md)
for navigation, theme toggle, social sharing, home page configuration, and the full
ose-web-vs-ayokoding-web comparison table.

## Common Patterns and Best Practices

See [Common Patterns and Best Practices](./reference/patterns-and-best-practices.md) for the
update-post and about-page creation steps, plus the update-post workflow and about-page
maintenance checklists.

## Content Validation Checklist and Common Mistakes

See [Validation Checklist and Common Mistakes](./reference/validation-checklist-and-mistakes.md)
for the pre-publish checklist and the four most common ose-web content mistakes with correct
fixes.

## Deployment Workflow

See [Deployment Workflow](./reference/deployment-workflow.md) for the `prod-ose-www` production
branch, the scheduled automated-deployment GitHub Actions workflow, the emergency force-push
procedure, and why force-push is safe for deployment branches.

## Reference Documentation

**Related Conventions**: [Content Quality Principles](../../../repo-governance/conventions/writing/quality.md)

**Related Skills**: `apps-ayokoding-www-developing-content`, `docs-creating-accessible-diagrams`

**Related Agents**: `apps-ose-www-content-maker`, `content-checker`, `swe-releaser` (Deploy mode, `ose-www` target)

**External Resources**: [Next.js 16 Documentation](https://nextjs.org/docs)

---

This Skill packages essential ose-web development knowledge for creating simple, effective landing page content. For comprehensive details, consult the primary convention document.
