---
description: Which surface (hook, settings.json, opencode.json, Codex config, staged-guard) carries the content-fixture exclusion, the Codex glob gotcha, and the accepted residual gap for non-dotfile real env files.
when_to_use: Use when adding or auditing a new agent-harness surface to confirm it correctly exempts content-tree env fixtures without reopening real .env files.
---

# Content-Fixture Exclusion — Enforcement Surfaces

| Surface                                  | Carries the exclusion as                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `.claude/hooks/block-env-file-access.sh` | Bash-branch allow for `apps/*/content/**` where the char before `.env` is not `/` or `.`  |
| `.claude/settings.json`                  | `Read`/`Edit` allow for `apps/*/content/**/*.env`; deny globs were dotfile-shaped already |
| `.opencode/opencode.json`                | `apps/*/content/**/*.env: allow` in the read and edit permission maps                     |
| `~/.codex/config.toml` (untracked)       | deny globs written `**/.env*`, **never** `**/*.env*`                                      |
| `the public-safety tree check`           | no change — already keys on a dotfile `.env*` basename                                    |

**The Codex surface is the one that bites.** Its deny globs were originally `**/*.env`; the leading
`*` matched `kata.env` and blocked the whole course. Adding a narrower `apps/<app>/content/** =
"write"` does **not** reopen the files — Codex keeps the broader deny in force, contrary to the
"more specific overrides broader" wording in its own documentation. It also rejects a glob with
`write` outright:

```
Error loading configuration: filesystem glob path `...` only supports `deny` access;
use an exact path or trailing `/**` for `write` subtree access
```

So the deny itself must be shaped correctly — `**/.env`, `**/.env.local`, `**/.env.*.local`,
`**/.env.development`, `**/.env.test`, `**/.env.production`, `**/.env.staging`, `**/.env.preview` —
which also brings that profile in line with the dotfile assumption the rest of this repo already
makes.

**Residual gap, accepted deliberately**: a real env file named without a leading dot (`prod.env`)
is not covered by any guard here. That gap predates the exclusion — every surface in the table was
already dotfile-keyed — and a 2026-08-03 sweep of both Codex workspace roots found no such file:
every non-dotfile `*.env` on disk was an ayokoding course fixture. Name real env files as dotfiles.

See also: [`env-file-access.md`](../env-file-access.md)
