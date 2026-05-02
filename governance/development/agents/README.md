# AI Agents Development

Standards and conventions for creating and managing AI agents in the `.claude/agents/` directory (source of truth), synced to `.opencode/agents/`.

## Purpose

These standards define **HOW to develop AI agents**, covering agent file structure, naming conventions, frontmatter requirements, tool access patterns, model selection, and size limits. All agents must follow these standards.

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

- [AI Agents Convention](./ai-agents.md) - Complete standards for creating and managing AI agents including naming, file structure, frontmatter requirements, tool access patterns, and model selection
- [Skill Context Architecture](./skill-context-architecture.md) - Architectural constraint requiring all repository skills to use inline context for universal delegated agent compatibility
- [Agent Workflow Orchestration Convention](./agent-workflow-orchestration.md) - Standards for how AI agents plan, execute, verify, and self-improve during multi-step tasks. Covers plan mode, delegated agent strategy, verification before done, autonomous bug fixing, and the self-improvement loop
- [Model Selection Convention](./model-selection.md) - Standards for selecting the appropriate model tier (planning-grade, execution-grade, fast) for AI agents based on task complexity, with justification requirements and tier comparison

## Companion Documents

- [Anti-Patterns](./anti-patterns.md) - Common agent development mistakes to avoid (with examples and corrections)
- [Best Practices](./best-practices.md) - Recommended agent development patterns and techniques

## Related Documentation

- [Development Index](../README.md) - All development practices
- [Automation Over Manual Principle](../../principles/software-engineering/automation-over-manual.md) - Why we build agents
- [Agents Index](../../../.claude/agents/README.md) - All available agents
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model

## Principles Implemented/Respected

This set of development practices implements/respects the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: AI agents automate repetitive tasks like content validation, file management, and quality checks, ensuring consistency and reducing manual effort.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Agent development conventions require explicit tool permissions, clear descriptions, and defined scopes, making agent behavior transparent and predictable.

## Conventions Implemented/Respected

This set of development practices respects the following conventions:

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Agent frontmatter and documentation follow active voice, proper heading hierarchy, and accessibility standards.

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Agent files use lowercase kebab-case basenames (e.g., `docs-maker.md`, `repo-rules-checker.md`) following the repository naming convention.
