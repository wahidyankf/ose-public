---
description: "Files touched by markdown-quality setup, and directories excluded from it."
when_to_use: "Use when auditing which files or directories implement markdown quality tooling."
---

# Configuration Details

## Files Modified During Setup

- `.markdownlint-cli2.jsonc` - Linting rules
- `.markdownlintignore` - Files to ignore (deprecated, use `ignores` in config)
- `.prettierignore` - Files to ignore for formatting
- `package.json` - Added npm scripts
- `.claude/settings.json` - PostToolUse hook configuration
- `.claude/hooks/format-lint-markdown.sh` - Hook execution script

## Ignored Directories

The following directories are excluded from linting and formatting:

- `node_modules/`
- `dist/`, `build/`, `.next/`, `.nx/`
- `apps/*/public/`
- `generated-reports/`
- `.vscode/`, `.idea/` (IDE files)
