---
description: Indexes canonical agent and skill sources and repository tool policy
when_to_use: Use when locating canonical definitions or the repository-owned tool endpoint
---

# Canonical Agent Directory

- [`agents/`](../agents/README.md) contains canonical agent definitions, each declaring only a portable `tier`.
- [`skills/`](skills/README.md) contains canonical skill definitions, read directly by Muse, Codex, OpenCode, and
  Command Code. Claude Code reads only its generated `.claude/skills/` routes.
- The generated `agents/<id>/AGENT.md` adapters under this directory are read as project subagents only by Muse. No
  other harness reads that tree: Claude Code reads `.claude/agents/`, Codex `.codex/agents/*.toml`, OpenCode
  `.opencode/agents/`, and Command Code `.commandcode/agents/`. The generated `model:` and `effort:` pins are the
  `muse` profile's tier mapping rendered from the canonical `tier`, never authored content.
- [`agent-policy.json`](agent-policy.json) declares protected and permitted paths for the repository-owned
  [`agent-policy-hook.sh`](../scripts/agent-policy-hook.sh). Security and resource obligations remain in governance.
