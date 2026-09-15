# No Codex equivalent to the Claude Code env-file guard hook

One-line summary: `block-env-file-access.sh` (a Claude Code `PreToolUse` hook) is the only technical
enforcement of the restricted-tier agent-access rule, and OpenCode and Codex have no equivalent
mechanism, so an agent session on either of those harnesses is unguarded.

> Idea, added 2026-08-13 — captured from `restrict-env-access-to-prod-and-stag`'s Phase 10 Knowledge
> Capture (`plans/done/2026-08-13__restrict-env-access-to-prod-and-stag/tech-docs.md` DD-9,
> `plans/done/2026-08-13__restrict-env-access-to-prod-and-stag/learnings.md`).
> Relocated from private-sibling/plans/ideas/harness-level-env-file-enforcement-gap.md on 2026-08-19 by plan-ideas-grooming.

## Problem / context

`guard-env-file-access` (documented in
`repo-governance/conventions/security/secrets-and-env-standards.md §9`) is enforced entirely by
`.claude/hooks/block-env-file-access.sh`, wired into `.claude/settings.json`'s `PreToolUse` hooks.
This is a Claude-Code-specific mechanism: `.claude/settings.json`'s hook system has no equivalent in
OpenCode's `.opencode/` or Codex's `.codex/`. The `.claude/settings.json` `permissions.deny` list is
likewise Claude-Code-only. An agent operating through either of the other two supported harnesses
today has no technical block on reading, writing, or editing
`.env.prod`/`.env.stag` — only the written policy in `AGENTS.md`/`secrets-and-env-standards.md`,
which depends on the agent choosing to follow it.

## Why now

Not urgent — Claude Code is this repo's primary harness today, and no incident has occurred through
either of the other two. It carries a real stake because the multi-harness compatibility work
(`CLAUDE.md §Multi-harness configuration`) treats OpenCode and Codex as first-class secondary
bindings, and a security control that silently doesn't apply to two of three supported harnesses is
a gap worth closing before one of them sees real usage on this repo.

> Narrowed by `update-harness-support`. The Cursor and Amazon Q Developer halves of the original
> premise are moot — neither harness is supported and neither binding tree exists. The Codex half
> survives unchanged, and OpenCode joins it: the original framing excused OpenCode on the unrelated
> ground that it reads `.claude/skills/` natively, which says nothing about tool-call policy. Note
> also that a Codex permission profile lives in the user's own `~/.codex/config.toml`, outside this
> repository, so no repo-side declaration can enforce it — that asymmetry is part of what any survey
> has to establish.

## Prior art / precedents

- **[`block-env-file-access.sh`](../../../.claude/hooks/block-env-file-access.sh) / `.claude/settings.json`** — the existing Claude Code mechanism this
  idea would need an equivalent of, or an alternative enforcement layer for.
- **Multi-harness configuration** —
  [`CLAUDE.md §Multi-harness configuration`](../../../CLAUDE.md) — the existing parity model
  (`.claude/` primary, `.opencode/`/`.codex/`/`.agents/` generated mirrors) this idea would extend
  or explicitly carve an exception into.
- **`rhino-cli env staged-guard validate`** — a harness-independent enforcement point (runs in the
  pre-commit path regardless of which agent staged the change) that already limits blast radius: even
  an unguarded agent cannot commit a restricted-tier file, only read/write/edit it locally.

## Proposed direction (sketch)

- Survey whether OpenCode or Codex exposes any pre-tool-use / policy-hook mechanism at all
  (web-researcher task — this is unconfirmed, not assumed absent). OpenCode's `permission` model
  (`allow`/`ask`/`deny`, bash sub-patterns, last matching rule wins) is the leading candidate and is
  already emitted per agent by this repository's generator.
- If one exists for a given harness, port an equivalent guard; if none exists for a harness, document
  the residual gap explicitly in that harness's binding section rather than leaving it silently
  unstated.
- Consider whether a harness-independent enforcement layer (e.g. a filesystem-level permission or a
  git pre-commit-adjacent check that fires regardless of which agent is driving) could close the gap
  for harnesses with no hook system at all.

## Rough scope & non-goals

In scope: OpenCode and Codex — the two supported harnesses with no current env-file guard.

Out of scope: the `rhino-cli env staged-guard` commit-time gate (already harness-independent,
unaffected).

## Risks & open questions

- Does either of the two harnesses support a hook/policy mechanism at all today? Unconfirmed — needs
  research before scoping a fix. (open)
- If no harness offers a hook mechanism, is a documented-gap-only outcome (relying on the written
  policy plus the commit-time gate) an acceptable final state, or does this need a harness-independent
  technical control regardless? (open)

## What success looks like + promotion signal

Success: either every supported harness has a technical block matching Claude Code's, or the gap is
explicitly documented per-harness (not silently absent) with the commit-time gate named as the
residual safety net. Promote to a full `backlog/` plan once the harness survey confirms which of the
two outcomes is achievable for each of OpenCode and Codex.
