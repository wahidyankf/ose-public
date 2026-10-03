---
description: "Covers the registry-driven per-harness model-ID mapping for all four grades, why one generated mirror pins no model, and the caveats that make a grade mean different things per vendor."
when_to_use: Use when translating a model grade to a concrete model ID for a specific harness.
---

# Platform Binding Examples

Canonical agents in `.agents/agents/` are rendered into every generated binding by Rhino
(`./rhino harness adapters generate`). Each profile's `tiers` map translates the canonical `tier` into whatever
each harness expects. Never hand-edit a generated binding — change the `tier` in `.agents/agents/` and
regenerate.

## Model ID Mapping

| Tier        | Claude Code (`.claude/agents/`)  | OpenCode (`.opencode/agents/`) | Codex (`.codex/agents/*.toml`)                                |
| ----------- | -------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| `ultra`     | `model: inherit`                 | key omitted                    | keys omitted — vendor default                                 |
| `plan`      | `model: inherit`                 | key omitted                    | keys omitted — vendor default                                 |
| `execution` | `model: sonnet`, `effort: xhigh` | key omitted                    | keys omitted — vendor default                                 |
| `fast`      | `model: haiku`, `effort: xhigh`  | key omitted                    | newest `gpt-*-luna` model, `model_reasoning_effort = "xhigh"` |

Every column is read at generate time from the Tier Registry, the `tiers` map of each
`harness.profiles[]` entry in `repo-config.yml`. A tier with an empty mapping pins nothing: Claude
Code renders its profile's `empty-tier` value, `model: inherit`, and Codex writes neither key, so the
harness applies its own default. A profile with no `tiers` map, as OpenCode's, pins no model at all.
Changing a model is an edit to one `tiers` entry plus `./rhino harness adapters generate` — never a
code change, and never an edit to a canonical agent.

The Codex `fast` entry resolves its model rather than naming one: generate runs `codex debug models`,
keeps the highest-versioned `gpt-*-luna` slug, and falls back to the last model it recorded, or the
seed `gpt-6-luna`, when the command fails. Codex accepts no versionless alias, so a pinned ID would go
stale within weeks.

## Effort Mapping

Each pinned tier carries its effort beside its model. Codex writes it as `model_reasoning_effort`,
which today only the `fast` tier sets; the values correspond as follows:

| Claude `effort` | Codex `model_reasoning_effort`     |
| --------------- | ---------------------------------- |
| `low`           | `low`                              |
| `medium`        | `medium`                           |
| `high`          | `high`                             |
| `xhigh`         | `xhigh`                            |
| `max`           | `xhigh` — saturates at the ceiling |

Codex additionally accepts `minimal`, which has no Claude Code counterpart and is never emitted.
OpenCode declares no per-agent effort, so the field is dropped there.

## Why One Mirror Pins No Model

The `opencode` profile declares no `tiers` map deliberately. That harness treats `model:` as
optional and resolves an omitted one from the developer's own configuration; it has no `inherit`
sentinel, so omission is the only way to express inheritance. Pinning an ID would override every
developer's choice and would need re-verifying on each vendor roster change. A grade still travels
to that mirror — it stays visible in the `.claude/` source — but it selects nothing.

## Where a Grade Does Not Mean the Same Thing

A grade names a _role in this repository_, not a guaranteed cost or context window. Three
cross-vendor mismatches are known and must not be papered over:

- **Fast is not like-for-like.** The Codex fast model is cheaper per token than the Claude fast
  model and carries a larger context. An agent placed at fast for context reasons on one harness is
  not constrained the same way on the other.
- **Unpinned tiers follow the session.** `ultra` and `plan` run on whatever model the calling session
  or harness default selects, and `execution` does so on Codex. Two sessions can therefore run the
  same agent on different models; pin the tier in the registry when that matters.
- **Ultra pins no frontier model.** No harness maps `ultra` to a model today. This costs nothing while
  no agent declares the tier — but the first ultra agent must have its tier pinned and smoke-tested on
  each harness before it lands, not after.
