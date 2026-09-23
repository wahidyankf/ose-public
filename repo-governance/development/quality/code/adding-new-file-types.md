---
description: "How to add a new file type to the pipeline."
when_to_use: "Use when a new file type needs lint coverage."
---

# Adding New File Types

To add formatting for a new file type:

1. Add its extension to the `case` statement in `scripts/format-staged`, routing it to the
   formatter (for a Prettier-supported type, add it to the Prettier branch)
2. Add a case to `scripts/format-staged.test.mjs` proving the new path is formatted
3. Declare a new native formatter binary under `toolchains` in `repo-config.yml`, so
   `npm run doctor` reports it when missing; tools installed through the npm lockfile stay
   undeclared, as the comment there explains
4. Stage a sample file and run `./rhino gate run --surface pre-commit`

**Example** (routing a new extension to Prettier):

```bash
case "$path" in
  *.md | *.json | *.yml | *.yaml | *.toml)
    prettier_paths+=("$path")
    ;;
esac
```

No new registry gate is needed: the `format-staged` gate already receives every staged and
changed path. A new file-type **linter** is a new registry gate with a `files` input — see the
[Staged-Path Gate Membership Rule](../../infra/nx-target-naming/staged-path-gate-membership-rule.md).
