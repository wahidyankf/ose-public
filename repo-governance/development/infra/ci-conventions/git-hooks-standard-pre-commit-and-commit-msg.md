---
description: Pre-commit gate steps and the commit-msg format.
when_to_use: Use when debugging the pre-commit hook or commit format.
---

# Git Hooks Standard — Pre-Commit and Commit-msg

All developer machines run three Husky hooks. Each hook is a thin adapter that calls
`./rhino gate run --surface <surface>`, and the gates live once, in the `gates` section of `repo-config.yml`.
Each local hook holds only the work its surface allows, and every other check runs at the pull-request surface.

## pre-commit

The pre-commit hook delegates entirely to `./rhino gate run --surface pre-commit`, which runs the declared
`pre-commit` entries. Today that is one entry, `format-staged`, which formats the staged files and restages them.
Query the registry for the live inventory instead of keeping a second list here:

```bash
rtk ./rhino gate list
```

Use `rtk ./rhino gate validate` to check that the hook and registry remain conformant. Language formatter and
file-selection details belong to the `format-staged` entry and project targets, not this overview.

Pre-commit holds only staged-file formatting, because that work rewrites files and restages them. It runs no check,
test, or scan: no Markdown lint, no validator, no environment check, and no `test:*` target. Those run in the
pull-request gate.

## commit-msg

The commit-msg hook runs `./rhino gate run --surface commit-msg --message-file "$1"`. Its only declared gate,
`commit-message`, runs Commitlint with `commitlint.config.js` on the message, so a message that breaks the format
below stops the commit. The pull-request gate runs the same lint over each commit in the range. The message-safety
screen runs at the pull-request surface and over the pushed range at pre-push.

**Required format**: `<type>(<scope>): <description>`

Valid types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.

The scope is optional but recommended. The description must use imperative mood and must not end with a period.
