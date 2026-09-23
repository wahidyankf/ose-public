---
description: "Version, config file, ignore patterns, and triggers for Prettier and markdownlint-cli2."
when_to_use: "Use when checking which config or script controls markdown formatting or linting."
---

# Tools

## Prettier (v3.6.2)

**Purpose**: Code formatter for consistent styling

**Configuration**: `.prettierrc.json`

```json
{
  "printWidth": 120,
  "proseWrap": "preserve"
}
```

**Ignore patterns**: `.prettierignore` (matches `.markdownlintignore`)

**When it runs**:

- Pre-commit hook (the `format-staged` registry gate, on staged files)
- coding agent hook (PostToolUse)
- Manual: `npm run format:md`

## markdownlint-cli2 (v0.20.0)

**Purpose**: Markdown linter for structural and syntactic quality

**Configuration**: `.markdownlint-cli2.jsonc`

**Ignore patterns**: Configured in `.markdownlint-cli2.jsonc` `ignores` array

**When it runs**:

- Pre-commit hook and PR quality gate (the `markdownlint` registry gate blocks on violations)
- coding agent hook (PostToolUse)
- Manual: `npm run lint:md`
