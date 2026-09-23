---
description: "What pre-commit and pre-push do for markdown, and where configured."
when_to_use: "Use when a markdown git hook misbehaves or you need its config location."
---

# Git Hooks

## Pre-Commit Hook

Formats staged markdown files with Prettier through the `format-staged` registry gate, then runs
the Markdown gates.

**Location**: `.husky/pre-commit`, which runs `./rhino gate run --surface pre-commit` over the
gates declared in `repo-config.yml`

**Action**: Applies Prettier formatting to staged `.md` files in the index, then blocks the commit
on any `markdownlint`, `md-mermaid`, `md-heading-hierarchy`, `md-naming`, or `md-frontmatter`
failure. The same gates run on the pull-request surface in CI.

## Pre-Push Hook

Runs no Markdown gate; markdownlint runs at pre-commit and in the PR quality gate.

**Location**: `.husky/pre-push`

**To fix markdownlint violations**:

```bash
npm run lint:md:fix
```
