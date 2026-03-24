# Workflow Meta Documentation

Foundational workflow patterns and conventions defining how workflows are structured.

## Purpose

This documentation defines **HOW workflows should be designed and documented**, covering the workflow pattern convention that all workflows must follow including structure, frontmatter requirements, and composition patterns.

## Scope

**✅ Belongs Here:**

- Workflow pattern definitions
- Workflow structure conventions
- Workflow frontmatter schema
- Workflow composition rules
- Meta-workflow documentation

**❌ Does NOT Belong:**

- Specific workflow implementations (those are in domain folders)
- Agent development standards (that's development/agents/)
- General development patterns (that's development/pattern/)

## Documents

- [Workflow Pattern Convention](./workflow-identifier.md) - Complete workflow structure convention including frontmatter schema, step definition patterns, and composition rules
- [Workflow Execution Mode Convention](./execution-modes.md) - Defines execution modes — Agent Delegation (preferred via Agent tool) and Manual Orchestration (fallback when agents unavailable as subagent types)

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core quality workflow pattern
- [AI Agents Convention](../../development/agents/ai-agents.md) - Agent standards workflows orchestrate
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model (Layer 5: Workflows)

---

**Last Updated**: 2026-01-01
