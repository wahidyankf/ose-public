---
description: "Introduces what AI agents are in this repository, why agent conventions exist, the scope of this convention, and platform-binding directories."
when_to_use: Use when orienting to what an AI agent is in this repo or checking whether a topic is in scope for the AI Agents Convention.
---

# Overview

## What are AI Agents?

AI agents in this project are specialized AI assistants defined in the canonical agent directory,
with target-format mirrors generated for secondary harnesses. Each agent has:

- **Specific expertise** in a particular domain or task
- **Defined tool permissions** limiting what operations it can perform
- **Clear responsibilities** to avoid overlap with other agents
- **Integration with project conventions** through references to AGENTS.md and convention documents
- **Durable execution state** - Focus on quality while persisting active decisions and progress across compaction

## Why We Need Agent Conventions

Without standards, agents can become:

- **Inconsistent** in structure and quality
- **Overlapping** in responsibilities, causing confusion
- **Insecure** through tool permission creep
- **Unmaintainable** as the project grows

This convention ensures all agents are:

- PASS: Well-structured and documented
- PASS: Single-purpose and focused
- PASS: Secure through explicit tool permissions
- PASS: Consistent with project standards

## Scope

This convention applies to:

- All canonical agent files in `.agents/agents/` and their generated harness routes
- References to agents in `AGENTS.md`
- Agent validation rules in `rules-checker`

## Platform Bindings

This repository maintains **multi-harness compatibility** across multiple AI coding agent platforms.
`.agents/agents/` is the agent source of truth. Every harness agent directory, `.claude/agents/`
included, holds generated routes, while registry-declared configuration and plugin paths remain vendored.

- **Source of Truth**: The canonical agent directory `.agents/agents/` — edit agents here
- **Harness routes (Generated)**: Synced from the canonical sources using `./rhino harness adapters generate`
- **Secondary exceptions (Vendored)**: Maintained in place as declared by `repo-config.yml`

**Workflow**: For a generated mirror, edit its declared source and run the binding generator. For a
vendored path with no in-repository source, edit that path in place. `repo-config.yml` decides which
case applies.

**See**: [CLAUDE.md](../../../../CLAUDE.md) and [AGENTS.md](../../../../AGENTS.md) for platform-specific documentation.

### Platform Binding Examples

```binding-example
Claude Code (.claude/agents/) — GENERATED ROUTE:
  - Tool format: comma string rendered from capabilities and constraints
  - Model selection: model and effort rendered from the tier

OpenCode (.opencode/agents/) — SECONDARY:
  - Tool format: permission object { read: allow, write: allow }
    (boolean flags { read: true, write: true } are deprecated/legacy)
  - Model selection: no model key is emitted — the developer's active model applies

Codex (.codex/agents/) — SECONDARY:
  - File format: TOML with name, description, and developer_instructions
  - Tool and model frontmatter: not emitted per agent
```
