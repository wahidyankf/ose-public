---
description: >-
  Indexes this repository's canonical agent definitions, each declaring what it needs and what it must not do before a
  harness adapter routes to it.
when_to_use: >-
  Use when locating a canonical agent definition or deciding what a new one must declare.
---

# Canonical Agents

Agent definitions in their canonical, harness-neutral form, one Markdown file per agent. Each declares what it needs
from a closed vocabulary in fixed order — `repository-read`, `repository-write`, `shell`, `network`, `subagent` — and
records what it must not do under `constraints`.

The canonical file is the one a human edits. So far only the plan agents are canonical here: their Claude Code sources
under `.claude/agents/plan/` keep the harness-native keys and route to the files below, and every other agent stays a
Claude-native source.

## Directory Map

- [plan-checker](plan-checker.md) — auditing a plan draft against the plan specification
- [plan-execution-checker](plan-execution-checker.md) — auditing finished plan execution before archival
- [plan-maker](plan-maker.md) — authoring a formal plan through both decision gates
