---
description: Which surface (hook, settings.json, opencode.json, Codex config, staged-guard) carries the content-fixture exclusion, the Codex glob gotcha, and the accepted residual gap for non-dotfile real env files.
when_to_use: Use when adding or auditing a new agent-harness surface to confirm it correctly exempts content-tree env fixtures without reopening real .env files.
---

# Content-Fixture Exclusion — Enforcement Surfaces

| Surface                     | Fixture exclusion                                           |
| --------------------------- | ----------------------------------------------------------- |
| Repository env hook         | Keeps non-dotfile course env fixtures open                  |
| Claude settings             | Explicit read/edit allow for content-tree env fixtures      |
| `.opencode/` config         | Explicit read/edit allow for content-tree env fixtures      |
| Repo endpoint and Serena    | Dotfile patterns preserve non-dotfile teaching fixtures     |
| Codex existing user profile | Retained dotfile-shaped deny globs; Serena remains deferred |
| Public-safety tree check    | Already keys on a dotfile `.env*` basename                  |

**Codex profile pitfall.** The retained user-global profile previously used deny globs shaped as `**/*.env`; the leading
`*` matched `kata.env` and blocked the whole course. Adding a narrower `apps/<app>/content/** =
"write"` does **not** reopen the files — Codex keeps the broader deny in force, contrary to the
"more specific overrides broader" wording in its own documentation. It also rejects a glob with
`write` outright:

```
Error loading configuration: filesystem glob path `...` only supports `deny` access;
use an exact path or trailing `/**` for `write` subtree access
```

Those deny globs must stay shaped correctly — `**/.env`, `**/.env.local`, `**/.env.*.local`,
`**/.env.development`, `**/.env.test`, `**/.env.production`, `**/.env.staging`, `**/.env.preview` —
The endpoint for `.claude/`, `.opencode/`, and `.commandcode/` bindings and the Serena configuration
for `.claude/` and `.commandcode/` preserve the same dotfile assumption. Serena registration
for `.opencode/` is deferred.
Codex retains its existing user-global profile and native guards; new routing and Serena registration are deferred.

**Residual gap, accepted deliberately**: a real env file named without a leading dot (`prod.env`)
is not covered by any guard here. That gap predates the exclusion — every surface in the table was
already dotfile-keyed — and a 2026-08-03 sweep of both Codex workspace roots found no such file:
every non-dotfile `*.env` on disk was an ayokoding course fixture. Name real env files as dotfiles.

See also: [`env-file-access.md`](../env-file-access.md)
