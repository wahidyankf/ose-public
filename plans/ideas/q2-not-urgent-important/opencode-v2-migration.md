# OpenCode v2 migration

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: OpenCode v2 renames eleven configuration keys the generator emits today, so plan
the migration before the beta is promoted rather than after a release breaks the mirrors.

> Idea, added 2026-08-19 — captured from `update-harness-support` Phase 9, which established the v1
> facts this repository's catalog now states and deliberately left v2 out of scope.

## Problem / context

OpenCode ships **two concurrent majors**. The stable binary is `opencode`, at 1.18.18 at the time of
writing. The v2 beta ships as a separate binary, `opencode2`, and is opt-in — installing it does not
replace v1. This repository targets v1 exclusively: `./rhino harness adapters generate` emits
`.opencode/agents/*.md` in v1 shape, and `.opencode/opencode.json` is a vendored v1 config.

v2 is not a superset. It renames configuration keys, and every rename below is a key this repository
either emits or vendors:

| v1           | v2            |
| ------------ | ------------- |
| `agent`      | `agents`      |
| `prompt`     | `system`      |
| `disable`    | `disabled`    |
| `bash`       | `shell`       |
| `task`       | `subagent`    |
| `mcp`        | `mcp.servers` |
| `command`    | `commands`    |
| `snapshot`   | `snapshots`   |
| `attachment` | `media`       |
| `provider`   | `providers`   |
| `plugin`     | `plugins`     |

The `bash` → `shell` rename sits inside the `permission` map, which is exactly what the converter
generates per agent — so it is not a config-file-only concern. A repository that emits v1 keys into a
v2 installation produces mirrors the harness silently ignores rather than files it rejects, which is
the same invisible-failure shape the binding parity guard exists to prevent.

## Why now

Not urgent: v1 is stable, is what the repository targets, and the v2 binary is opt-in with no
announced v1 end-of-life. The reason to capture it now is that the rename set is **known and
finite today**. Re-deriving it after a promotion, under pressure, from a changelog rather than from
a migration guide, costs more than writing it down while it is in front of us.

## Prior art / precedents

- **[Platform Bindings Catalog](../../../docs/reference/platform-bindings.md)** — the OpenCode row
  and the Tool Translation section that state the v1 facts this migration would supersede.
- **[Multi-Harness Binding Convention](../../../repo-governance/conventions/structure/multi-harness-binding.md)** —
  Rules 4-5 (mechanical generation, parity guard) and Rule 9 (divergence triage) are the machinery a
  version bump would run through.
- **[harness-converter-preserve-agent-mode](./harness-converter-preserve-agent-mode.md)** — the
  adjacent brief about the converter's fixed field set; a v2 bump changes which fields that set
  should contain.

## Proposed direction (sketch)

- Gate the work on a promotion signal, not a date: v2 becoming the default `opencode` binary, or v1
  receiving an end-of-life announcement. Until then this stays an idea.
- Make the emitted schema version an explicit declaration in `repo-config.yml`'s OpenCode entry
  rather than a fact implied by the emitter's source, so the target version is visible where the
  registry already is.
- Migrate the vendored `.opencode/opencode.json` and the generated agent frontmatter in the same
  commit, since the `permission.bash` → `permission.shell` rename spans both.
- Verify against a real `opencode2` installation before landing — the rename table is a starting
  point for a migration, not a substitute for running the harness.

## Rough scope & non-goals

In scope: the OpenCode emitter in `apps/rhino-cli/src/application/agents/`, the vendored
`.opencode/opencode.json`, the catalog's OpenCode row, and the OpenCode conformance scenarios.

Out of scope: the Claude Code and Codex bindings, which share no schema with OpenCode; supporting
both majors simultaneously, which would double the emitter surface for no current consumer.

## Risks & open questions

- Is the rename table complete? It was compiled from v2 beta documentation, and a beta's schema can
  still move. Re-verify at migration time. (open)
- Does v2 keep reading `.claude/skills/` natively? That capability is why Phase 6 of
  `update-harness-support` could delete `.opencode/skills/` outright; losing it would reopen a
  decision this repository already closed. (open)
- Does the repository want to track v2 at all before it is the default, given that every supported
  harness is a maintenance cost? (open)

## What success looks like + promotion signal

Success: the generated `.opencode/` tree loads correctly under whichever major the repository
declares, with the declared version visible in `repo-config.yml` rather than buried in emitter code.
Promote to a `backlog/` plan when v2 becomes the default `opencode` binary or v1 gets an end-of-life
date — whichever comes first.
