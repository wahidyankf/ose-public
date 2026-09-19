# Let the agent converter preserve frontmatter fields it does not own

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: the Claude→OpenCode agent converter emits a fixed field set, so an OpenCode-only
frontmatter key on a mirrored agent would be silently dropped the moment that agent gained a
`.claude/` source — which is one of two reasons a needed mirror currently cannot have one.

> Surfaced 2026-08-17 during `optimize-gov` execution.

## Problem / context

The private sibling carries `.opencode/agents/ci-monitor-subagent.md` with no `.claude/` counterpart, so
Phase 0 Invariant 4 reports it as an orphan on every run. It declares `mode: subagent`, which is how
OpenCode distinguishes a subagent from an ordinary agent.

Authoring a `.claude/` counterpart to close that gap was attempted and reverted. Two independent
problems surfaced, both measured rather than predicted:

1. **The converter drops the field.** `validate_agent_equivalence` requires every `.claude/` source
   to have a YAML-equivalent `.opencode/` file, so adding a source forces the mirror to be
   regenerated. Measured before/after:

   ```diff
   -mode: subagent
   +model: zai-coding-plan/glm-5.2
   +permission:
   +  bash: allow
   +  read: allow
   +color: warning
   ```

   The instruction body survived unchanged. `converter.rs` emits description, model, permission,
   color, steps, and skills, with no passthrough for unrecognized keys — so this is not specific to
   `mode` or to this agent. Note the mirror also _gained_ a `permission` map where it previously had
   none; OpenCode enables all tools when `permission` is omitted, so that is a narrowing whose
   practical effect is unverified.

2. **The filename cannot be conformant.** The agent-naming role vocabulary is closed — the last
   filename token must be one of `maker|checker|fixer|dev|deployer|manager|tester|researcher`.
   `subagent` is not among them, so a `.claude/` twin cannot both satisfy the naming convention and
   carry the filename that filename-set parity requires. The two requirements are mutually
   exclusive.

The orphan is therefore recorded as a documented intentional skip on Invariant 4 rather than closed.

## Why now

Nothing is broken today, which is why this can wait: the mirror still works, and the invariant now
names the skip instead of reporting a finding. But the converter limitation is latent for every
future harness-native key, and the naming collision will resurface the next time someone tries to
close this orphan without reading why it is open.

## Prior art / precedents

- **[private-sibling-opencode-ci-monitor-orphan](./private-sibling-opencode-ci-monitor-orphan.md)** — read
  this first; it owns the prior question of where the mirror file came from, and records that
  `list_agent_files` hardcodes a skip for this exact filename. It proposes three outcomes, one of
  which — restore the `.claude/` source and regenerate — the attempt described above **empirically
  rules out**. That narrows its decision to delete-or-declare, and the two briefs should be settled
  together.
- **`.amazonq` emitter** (`bindings.rs`) — models the opposite discipline: it tracks which
  definitions it manages and removes only stale ones it owns.
- **`.codex/config.toml`** — carries a hand-maintained `[agents.ci-monitor-subagent]` entry kept
  outside the generated block; the archived `plan-domain-parity` work documents preserving _that_
  Codex entry. It does not discuss the `.opencode/` agent file, whose hand-maintained status is
  evident from its content rather than from that plan.
- **`.prettierignore` for generated files in this repo** — the same "do not reformat what you do not
  own" instinct, applied to a formatter instead of a generator.

## Proposed direction (sketch)

1. Give the converter a passthrough so unrecognized source-side keys survive into the mirror.
2. Or model an explicit exemption list of harness-native files the generator must not rewrite.
3. Separately, decide whether the role vocabulary should admit a token for non-role helper agents,
   or whether harness-native agents are simply expected to have no Claude twin.

## Rough scope & non-goals

In scope: the converter's field handling, the sync validator's equivalence check, and the naming
vocabulary's treatment of harness-native agents.

**Out of scope (for now)**: broader Claude↔OpenCode schema translation; changing Invariant 4
itself, which behaved correctly throughout.

> Narrowed by `update-harness-support`: the Amazon Q and Cursor tiers this brief set aside no longer
> exist. The Codex tier added in their place shares the same field-policy walk, so the dropped-field
> risk this brief describes now spans OpenCode **and** Codex rather than OpenCode alone.

## Risks & open questions

- Does OpenCode actually degrade without `mode: subagent`, or infer subagent status another way?
  Unverified — this decides whether the converter gap is a real defect or a cosmetic one.
- Does a partial `permission` map deny unlisted tools in OpenCode, including MCP? If it does, any
  generated mirror of this agent is a functional narrowing.
- `apps/rhino-cli/**` is the parity boundary across both repos, so a converter change is a
  coordinated multi-repo change with a manifest regen.
- A blanket passthrough could let genuinely stale keys survive regeneration — the behaviour the
  generator exists to prevent.

## What success looks like + promotion signal

An agent can carry a harness-native key that survives `generate:bindings`, or the field is confirmed
unnecessary and that is written down. Promotion signal: someone confirms OpenCode's real behaviour
for an agent lacking `mode` and for one with a partial `permission` map — those two answers decide
whether this is a bug fix or a documentation note.
