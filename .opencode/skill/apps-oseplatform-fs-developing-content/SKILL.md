---
name: apps-oseplatform-fs-developing-content
description: Guide for creating content on oseplatform-fs Next.js 16 content platform. Covers English-only landing page structure, update posts with date-prefixed filenames, markdown frontmatter (title, date, tags, summary, showtoc), simple flat organization, and oseplatform-fs specific conventions. Essential for oseplatform-fs content creation tasks
---

# OSE Platform Web Content Development Skill

## Purpose

This Skill provides guidance for creating and managing content on the **oseplatform-fs** Next.js 16 content platform which serves as an English-only project landing page.

**When to use this Skill:**

- Creating platform updates on oseplatform-fs
- Writing about page content
- Managing landing page structure
- Configuring markdown frontmatter
- Understanding oseplatform-fs specific patterns

## Core Concepts

### Site Overview

**oseplatform-fs** (`apps/oseplatform-fs/`):

- **Site**: oseplatform.com
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

**Contrast with ayokoding-fs**:

- ayokoding-fs (Next.js): Bilingual with complex fullstack structure
- oseplatform-fs: English-only with flat structure

## Content Structure

```
apps/oseplatform-fs/content/
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

### Required Fields

```yaml
---
title: "Post Title"
date: 2025-12-07T14:30:00+07:00
draft: false
---
```

**Minimal frontmatter** - Next.js 16 has fewer required fields than Next.js content metadata.

### Recommended Fields

```yaml
---
title: "OSE Platform Beta Release"
date: 2025-12-07T14:30:00+07:00
draft: false
description: "Brief description for meta tags and summaries"
summary: "Summary text for list pages"
tags: ["release", "beta", "announcement"]
categories: ["updates"]
showtoc: true # Enable table of contents
cover:
  image: "/images/beta-release.png"
  alt: "OSE Platform Dashboard Screenshot"
  caption: "New dashboard interface"
---
```

### Next.js 16-Specific Fields

**Table of Contents**:

```yaml
showtoc: true # Show ToC
tocopen: false # ToC collapsed by default
```

**Metadata Display**:

```yaml
hidemeta: false # Show post metadata (date, reading time)
comments: true # Show comments section (if enabled)
```

**Search & SEO**:

```yaml
searchHidden: false # Include in site search
hideSummary: false # Show in list pages
robotsNoIndex: false # Allow search engine indexing
```

**Cover Image**:

```yaml
cover:
  image: "/images/cover.png" # Path to image
  alt: "Image description" # REQUIRED for accessibility
  caption: "Optional caption" # Displayed under image
  relative: false # Use absolute paths from /static/
  responsiveImages: true # Generate responsive variants
  hidden: false # Show on current page
```

### Author Field Rules

**FLEXIBLE** (unlike ayokoding-fs):

- `author:` field allowed per-post
- Can be single author or multiple authors
- No site-level default restriction

**Examples**:

```yaml
# Single author
author: "OSE Platform Team"

# Multiple authors
author: ["John Doe", "Jane Smith"]
```

**Contrast with ayokoding-fs**: ayokoding-fs restricts `author` field to rants/celoteh only. oseplatform-fs has no such restriction.

## Content Types

### Update Posts

**Location**: `content/updates/`

**Purpose**: Platform progress, feature releases, announcements

**Frontmatter example**:

```yaml
---
title: "OSE Platform Beta Release"
date: 2025-12-07T14:30:00+07:00
draft: false
tags: ["release", "beta", "announcement"]
categories: ["updates"]
summary: "Introducing the beta version of Open Sharia Enterprise Platform"
showtoc: true
cover:
  image: "/images/beta-release.png"
  alt: "OSE Platform Dashboard Screenshot"
---
```

### About Page

**Location**: `content/about.md`

**Purpose**: Project information, team details, contact info

**Frontmatter example**:

```yaml
---
title: "About OSE Platform"
url: "/about/"
summary: "Learn about Open Sharia Enterprise Platform"
showtoc: false
---
```

## Internal Links

**Format**: Absolute paths without `.md` extension

**Next.js shortcodes available**:

```markdown
# Using ref shortcode for content references

Check out our [getting started guide]({{< ref "/updates/getting-started" >}})

# Direct absolute paths

[Beta Release](/updates/2025-12-07-beta-release)
```

**Contrast with ayokoding-fs**:

- ayokoding-fs: MUST use absolute paths with language prefix (`/en/`, `/id/`)
- oseplatform-fs: Absolute paths without language prefix (English-only)

## Asset Organization

**Location**: `apps/oseplatform-fs/static/`

**Structure**:

```
static/
├── images/
│   ├── updates/
│   └── about/
└── casts/                    # Asciinema recordings
```

**Image References**:

```markdown
# Markdown image

![OSE Platform Dashboard](/images/updates/dashboard.png)

# Next.js figure shortcode

{{< figure src="/images/updates/architecture.png" alt="System Architecture" caption="OSE Platform Architecture" >}}
```

**Paths from `/static/`**:

- `static/images/dashboard.png` → `/images/dashboard.png`
- `static/casts/demo.cast` → `/casts/demo.cast`

## Next.js 16 Features

### Navigation

Next.js 16 provides:

- **Breadcrumbs**: Automatic breadcrumb navigation
- **Archive**: Chronological post listing
- **Smooth scrolling**: Anchor link behavior
- **Table of contents**: Per-page ToC (configurable)

### Theme Toggle

```yaml
# Site config (hugo.yaml)
params:
  defaultTheme: auto # Options: light, dark, auto
```

**User preference**: Stored in localStorage, persists across sessions.

### Social Sharing

```yaml
# Site config (hugo.yaml)
params:
  ShareButtons:
    - twitter
    - linkedin
    - reddit
```

**Per-page control**:

```yaml
---
ShowShareButtons: true # Enable share buttons for this post
---
```

### Home Page Configuration

```yaml
# Site config (hugo.yaml)
params:
  homeInfoParams:
    Title: "Welcome to OSE Platform"
    Content: "Open Sharia Enterprise Platform documentation and updates"

  socialIcons:
    - name: github
      url: "https://github.com/wahidyankf/open-sharia-enterprise"
    - name: twitter
      url: "https://twitter.com/oseplatform"
```

## Comparison with ayokoding-fs

| Aspect               | oseplatform-fs                   | ayokoding-fs                                      |
| -------------------- | -------------------------------- | ------------------------------------------------- |
| **Theme**            | Next.js 16                       | Next.js 16 (App Router, tRPC)                     |
| **Languages**        | English only                     | Bilingual (Indonesian/English)                    |
| **Structure**        | Flat (updates/, about.md)        | Deep hierarchy (learn/archived/crash-courses/...) |
| **Archetypes**       | 1 (default)                      | N/A (Next.js App Router)                          |
| **Weight Ordering**  | Optional (date-prefix for posts) | Managed by Next.js routing                        |
| **Navigation**       | Breadcrumbs, archive             | Auto-sidebar, 3-layer nav                         |
| **Author Field**     | Per-post (flexible)              | Site-level default (exceptions for rants/celoteh) |
| **Complexity**       | Simple, minimal                  | Feature-rich, complex                             |
| **Content Types**    | Updates, about                   | Tutorials, essays, videos                         |
| **Overview Files**   | Not required                     | Required (overview.md, ikhtisar.md)               |
| **Internal Links**   | Absolute paths                   | Absolute paths with language prefix               |
| **Primary Purpose**  | Landing page & updates           | Educational platform                              |
| **Target Audience**  | Enterprise users                 | Indonesian developers (bilingual)                 |
| **Tutorial Content** | No                               | Yes (detailed programming tutorials)              |

**Key Takeaway**: oseplatform-fs is MUCH simpler than ayokoding-fs.

## Common Patterns

### Creating Update Post

```bash
# 1. Create file with date prefix
hugo new content/updates/2025-12-07-feature-release.md

# 2. Edit frontmatter
# (add title, date, tags, cover image)

# 3. Write content
# (markdown content)

# 4. Set draft: false when ready to publish
```

### Creating About Page

```bash
# 1. Create file
hugo new content/about.md

# 2. Edit frontmatter
# (add title, url, summary)

# 3. Write content
# (project info, team details)

# 4. Set draft: false to publish
```

## Content Validation Checklist

Before publishing:

- [ ] Frontmatter uses YAML format (2-space indentation)
- [ ] Date format is `YYYY-MM-DDTHH:MM:SS+07:00`
- [ ] Description length is 150-160 characters (if present)
- [ ] Internal links use absolute paths without `.md`
- [ ] All images have descriptive alt text
- [ ] Update posts use date-prefixed filenames (`YYYY-MM-DD-title.md`)
- [ ] Cover images have alt text
- [ ] Summary field provided for list pages
- [ ] Draft status set correctly (`draft: true/false`)
- [ ] Tags and categories are arrays (if present)

## Common Mistakes

### ❌ Mistake 1: Using language prefixes

**Wrong**: `/en/updates/post` (oseplatform-fs is English-only)

**Right**: `/updates/post`

### ❌ Mistake 2: Forgetting date prefix for updates

**Wrong**: `feature-release.md` (no chronological ordering)

**Right**: `2025-12-07-feature-release.md`

### ❌ Mistake 3: Missing cover image alt text

```yaml
# Wrong
cover:
  image: "/images/cover.png"
  # No alt text - accessibility violation

# Right
cover:
  image: "/images/cover.png"
  alt: "OSE Platform Dashboard showing metrics"
```

### ❌ Mistake 4: Using ayokoding-fs conventions

**Wrong**: Applying ayokoding-fs conventions (not applicable to Next.js Next.js 16 site)

**Right**: Use simple Next.js 16 conventions (date-prefix for posts, minimal frontmatter)

## Best Practices

### Update Post Workflow

1. **Plan content**: Outline key points
2. **Create file**: Use date-prefixed filename
3. **Write frontmatter**: Title, date, tags, cover image
4. **Write content**: Clear, concise updates
5. **Add visuals**: Cover image, diagrams if needed
6. **Validate**: Check frontmatter, links, alt text
7. **Publish**: Set `draft: false`

### About Page Maintenance

1. **Keep current**: Update as project evolves
2. **Clear structure**: Sections for vision, team, contact
3. **No date needed**: About page is timeless
4. **Link to updates**: Reference update posts for news

## Reference Documentation

**Primary Convention**: [Next.js Content Convention - oseplatform-fs](../../../governance/conventions/hugo/ose-platform.md)

**Related Conventions**:

- [Next.js Content Shared](../../../governance/conventions/hugo/shared.md) - Shared Next.js patterns
- [Content Quality Principles](../../../governance/conventions/writing/quality.md) - Universal quality standards

**Related Skills**:

- `apps-ayokoding-fs-developing-content` - Comparison with ayokoding-fs patterns (Next.js)
- `docs-creating-accessible-diagrams` - Accessible diagrams for technical content

**Related Agents**:

- `apps-oseplatform-fs-content-maker` - Creates oseplatform-fs content
- `apps-oseplatform-fs-content-checker` - Validates oseplatform-fs content
- `apps-oseplatform-fs-deployer` - Deploys oseplatform-fs

**External Resources**:

- [Next.js 16 Official Documentation](https://adityatelange.github.io/hugo-Next.js 16/)
- [Next.js 16 GitHub Repository](https://github.com/adityatelange/hugo-Next.js 16)

---

This Skill packages essential oseplatform-fs development knowledge for creating simple, effective landing page content. For comprehensive details, consult the primary convention document.

## Deployment Workflow

Deploy oseplatform-fs to production using automated CI or the deployer agent.

### Production Branch

**Branch**: `prod-oseplatform-fs`
**Purpose**: Deployment-only branch that Vercel monitors
**Build System**: Vercel (Next.js SSG with Next.js 16 theme)

### Automated Deployment (Primary)

The `test-and-deploy-oseplatform-fs.yml` GitHub Actions workflow handles routine deployment:

- **Schedule**: Runs at 6 AM and 6 PM WIB (UTC+7) every day
- **Change detection**: Diffs `HEAD` vs `prod-oseplatform-fs` scoped to `apps/oseplatform-fs/` — skips build/deploy when nothing changed
- **Build**: Runs `nx build oseplatform-fs` (Next.js extended build with Next.js 16 theme)
- **Deploy**: Force-pushes `main` to `prod-oseplatform-fs`; Vercel auto-builds

**Manual trigger**: From the GitHub Actions UI, trigger `test-and-deploy-oseplatform-fs.yml` with `force_deploy=true` to deploy immediately regardless of changes.

### Emergency / On-Demand Deployment

For immediate deployment outside the scheduled window:

```bash
git push origin main:prod-oseplatform-fs --force
```

Or use the `apps-oseplatform-fs-deployer` agent for a guided deployment.

### Why Force Push

**Safe for deployment branches**:

- prod-oseplatform-fs is deployment-only (no direct commits)
- Always want exact copy of main branch
- Trunk-based development: main is source of truth

## References

**Primary Convention**: [Next.js Content Convention - oseplatform-fs](../../../governance/conventions/hugo/ose-platform.md)

**Related Conventions**:

- [Next.js Content Shared](../../../governance/conventions/hugo/shared.md) - Shared Next.js patterns
- [Content Quality Principles](../../../governance/conventions/writing/quality.md) - Universal quality standards

**Related Skills**:

- `apps-ayokoding-fs-developing-content` - Comparison with ayokoding-fs patterns
- `docs-creating-accessible-diagrams` - Accessible diagrams for technical content
