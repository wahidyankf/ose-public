---
description: "Covers the registry-driven per-harness model-ID mapping for all four grades, why one generated mirror pins no model, and the caveats that make a grade mean different things per vendor."
when_to_use: Use when translating a model grade to a concrete model ID for a specific harness.
---

# Platform Binding Examples

Agents in the primary binding directory are auto-synced to every generated binding by Rhino
(`./rhino harness adapters generate`). The sync translates the primary binding's grade alias into whatever
each harness expects. Never hand-edit a generated binding — change the grade in `.claude/` and
regenerate.

## Model ID Mapping

| Grade     | Claude Code (`.claude/agents/`) | OpenCode (`.opencode/agents/`) | Codex (`.codex/agents/*.toml`) |
| --------- | ------------------------------- | ------------------------------ | ------------------------------ |
| Ultra     | `model: fable`                  | key omitted                    | `model = "gpt-6-astra"`        |
| Planning  | `model: opus`                   | key omitted                    | `model = "gpt-5.6-sol"`        |
| Execution | `model: sonnet`                 | key omitted                    | `model = "gpt-5.6-terra"`      |
| Fast      | `model: haiku`                  | key omitted                    | `model = "gpt-5.6-luna"`       |
| `inherit` | `model: inherit`                | key omitted                    | key omitted — vendor default   |

Every column is read from `repo-config.yml` at generate time: `model-grades:` names the four
grades, and each `harness:` entry's `model-map:` gives its ID per grade. An entry declaring no
`model-map:` emits no `model` key. Changing an ID is a registry edit plus
`./rhino harness adapters generate` — never a code change.

The Codex column pairs each grade with the model the vendor's own catalog positions at that level:
its top-of-lineup model for ultra, its most capable current-generation model for planning, its
"balanced, everyday work" model for execution, and its "lowest cost in the family" model for fast.
Verified against the vendor's published model catalog on 2026-09-06.

## Effort Mapping

Claude Code's `effort` also reaches the Codex binding, as `model_reasoning_effort`:

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

The `opencode` entry declares no `model-map:` deliberately. That harness treats `model:` as
optional and resolves an omitted one from the developer's own configuration; it has no `inherit`
sentinel, so omission is the only way to express inheritance. Pinning an ID would override every
developer's choice and would need re-verifying on each vendor roster change. A grade still travels
to that mirror — it stays visible in the `.claude/` source — but it selects nothing.

## Where a Grade Does Not Mean the Same Thing

A grade names a _role in this repository_, not a guaranteed cost or context window. Three
cross-vendor mismatches are known and must not be papered over:

- **Fast is not like-for-like.** The Codex fast model is roughly five times cheaper per token than
  the Claude fast model and carries a ~1M-token context against 200k. An agent placed at fast for
  context reasons on one harness is not constrained the same way on the other.
- **Planning-grade cost parity is promotional.** The Codex planning model's list output price is
  currently discounted; at base rate it is more expensive per output token than its Claude
  counterpart.
- **The ultra Codex model may not be reachable.** The vendor is staging its rollout through a
  restricted-access programme, so `model = "gpt-6-astra"` can fail on an account without that
  access. This costs nothing today because no agent declares the ultra grade — but the first ultra
  agent must be smoke-tested on the Codex binding before it lands, not after.
