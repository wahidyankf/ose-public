---
description: "Standards for AI agents that work safely and predictably in this repository"
when_to_use: Use when defining or changing an AI agent, or when deciding where an agent-development topic belongs.
---

# AI Agents Development

Use this section when defining or changing an AI agent. It explains how to give an agent a clear, safe job and how its canonical definition is kept compatible with supported harnesses.

## Purpose

These standards define **HOW to develop AI agents**, covering agent file structure, naming conventions, frontmatter requirements, tool access patterns, model selection, and complexity tiers. All agents must follow these standards.

## Scope

**✅ Belongs Here:**

- AI agent development standards
- Agent file structure and frontmatter
- Agent naming and categorization
- Tool access and security patterns
- Model selection guidelines

**❌ Does NOT Belong:**

- Why we automate (that's a principle)
- General development workflow (that's workflow/)
- Content writing standards (that's conventions/)

## Documents

- [AI Agents Convention](./ai-agents.md) — Standards for creating and managing canonical AI agents in `.agents/agents/` and their generated harness routes. Use when authoring, reviewing, or restructuring an agent definition file in `.claude/agents/`, or when deciding which sub-topic of agent standards applies.
- [Agent Workflow Orchestration Convention](./agent-workflow-orchestration.md) — Standards for how AI agents plan, execute, verify, and self-improve during multi-step tasks. Use when planning, delegating, verifying, or self-improving during a multi-step agent task.
- [Anti-Patterns in AI Agents Development](./anti-patterns.md) — Common mistakes to avoid when developing AI agents, with problem, cause, and solution for each anti-pattern. Use when reviewing an agent definition for a common authoring mistake, or naming which anti-pattern a finding matches.
- [Best Practices for AI Agents Development](./best-practices.md) — Proven practices for developing maintainable, secure, and effective AI agents in the `.agents/agents/` directory. Use when authoring a new agent and checking it against proven practices, or citing a best practice in a review.
- [AI Agent Model Selection Convention](./model-selection.md) — Standards for selecting the appropriate model grade (ultra, planning-grade, execution-grade, fast) for AI agents based on task complexity. Use when deciding which model grade a new or existing agent should declare, or translating a grade to a concrete model ID.
- [Planning Capabilities](./planning-capabilities.md) — Defines the planning capability roster a repository must expose and the uniform contract every workflow, skill, and agent in it satisfies. Use when adopting the plan system, auditing planning capabilities, or resolving which form a new planning capability should take.
- [Skill Context Architecture](./skill-context-architecture.md) — Architectural guidance on skill context modes in `.agents/skills/`. Inline skills work universally; fork skills work from main conversation only. Use when authoring a Skill and deciding its context mode, or when a Skill needs to spawn or delegate work.
- [Subagent Orchestration Convention](./subagent-orchestration.md) — Standards for concurrency caps and stuck-detection when a main agent spawns subagents via the Agent tool, capping concurrent background subagents at two (three total including the main agent/thread) to control token burn and avoid Claude API rate-limit hits. Use when spawning, polling, or capping background subagents, or diagnosing a stuck subagent.

## Related Documentation

- [Development Index](../README.md) - All development practices
- [Automation Over Manual Principle](../../principles/software-engineering/automation-over-manual.md) - Why we build agents
- [Agents Index](../../../.agents/agents/README.md) - All available agents
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model

## Principles Implemented/Respected

This set of development practices implements/respects the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: AI agents automate repetitive tasks like content validation, file management, and quality checks, ensuring consistency and reducing manual effort.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Agent development conventions require explicit tool permissions, clear descriptions, and defined scopes, making agent behaviour transparent and predictable.

## Conventions Implemented/Respected

This set of development practices respects the following conventions:

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Agent frontmatter and documentation follow active voice, proper heading hierarchy, and accessibility standards.

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Agent files use lowercase kebab-case basenames (e.g., `docs-maker.md`, `rules-checker.md`) following the repository naming convention.
