# Frontmatter, Tags, and AGENTS.md Philosophy

## Frontmatter Template

```yaml
title: Document Title
description: Brief description for search and context
category: tutorial # tutorial | how-to | reference | explanation
tags:
  - primary-topic # IMPORTANT: 2 spaces before dash, NOT tab
  - secondary-topic # IMPORTANT: 2 spaces before dash, NOT tab
created: YYYY-MM-DD
```

**CRITICAL**: Frontmatter MUST use 2 spaces for indentation (not tabs) — the one exception to
tab indentation within `docs/`. All nested fields (tags, lists, objects) must use spaces.

**Date Fields**: get today's date with `TZ='Asia/Jakarta' date +"%Y-%m-%d"` (e.g., `2026-01-03`);
use for both `created` and `updated`. See
[Timestamp Format Convention](../../../../repo-governance/conventions/formatting/timestamp.md).

## Tags

Use `#tag-name` throughout documents — creates automatic back-links and enables searching by
topic (e.g., `#authentication`, `#api`, `#setup`, `#configuration`).

## AGENTS.md Content Philosophy

**CRITICAL**: `AGENTS.md` is a navigation document, NOT a knowledge dump.

1. **Maximum section length**: 3-5 lines + link to detailed documentation
2. **Content rule**: brief summary only — comprehensive details belong in convention docs
3. **Workflow**: write detailed documentation in `repo-governance/conventions/` or
   `repo-governance/development/`, then add a brief 2-5 line summary to `AGENTS.md` with a
   prominent link. Never duplicate detailed examples, explanations, or comprehensive lists in
   `AGENTS.md`.
4. **What belongs in AGENTS.md**: what the convention is (1 sentence), where the detailed docs
   live (link), why it matters (1 sentence, if critical). Detailed examples, comprehensive
   explanations, and complete rule lists belong in convention docs instead.
5. **Size awareness**: `AGENTS.md` is held to the Governance Word-Budget Convention, whose
   thresholds live in `repo-config.yml` and are checked on demand by `./rhino governance word-budget validate`. Every addition must
   remain minimal and essential — when in doubt, link rather than duplicate.
