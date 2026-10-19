---
name: repo-understanding-repository-architecture
description: Six-layer governance hierarchy (Vision → Principles → Conventions → Development → Agents → Workflows). Use when understanding repository structure, tracing rules to foundational values, explaining architectural decisions, or navigating layer relationships.
---

# Repository Architecture - Six-Layer Hierarchy

This Skill provides guidance on the six-layer architecture governing the open-sharia-enterprise repository. Each layer builds on the foundation above, creating complete traceability from vision to workflows.

## Purpose

Use this Skill when:

- Understanding repository governance structure
- Tracing rules back to foundational values
- Explaining architectural decisions
- Navigating layer relationships
- Creating new conventions or practices
- Understanding where Skills fit in the architecture

## The Six Layers

See [The Six Layers Overview](./reference/layers-overview.md) for the layer diagram, key relationships, and a quick-reference table (location, purpose, change frequency, and what question each layer answers).

## Layer 0-2: Vision, Principles, Conventions

See [Layers 0-2](./reference/layers-0-2-vision-principles-conventions.md) for WHY the project exists, the foundational values that govern conventions/development, and WHAT documentation rules those values imply.

## Layer 3-5: Development, AI Agents, Workflows

See [Layers 3-5](./reference/layers-3-5-development-agents-workflows.md) for HOW software is built, WHO the atomic executors are, and WHEN multi-step orchestration composes agents into processes.

## Complete Traceability Example and Where Skills Fit

See [Traceability and Skills](./reference/traceability-and-skills.md) for a worked Vision→Agents example (Color Accessibility) and why Skills are delivery infrastructure - not a governance layer - across their inline and fork modes.

## Best Practices and Common Misconceptions

See [Best Practices and Misconceptions](./reference/best-practices-and-misconceptions.md) for checklists when creating new conventions/practices/agents/workflows, and four common misconceptions about how the layers relate.

## References

- **[Repository Architecture](../../../repo-governance/repository-governance-architecture.md)** - Complete architectural documentation with all traceability examples
- **[Core Principles Index](../../../repo-governance/principles/README.md)** - Foundational principles
- **[Conventions Index](../../../repo-governance/conventions/README.md)** - Documentation conventions
- **[Development Index](../../../repo-governance/development/README.md)** - Development practices
- **[Agents Index](../../../agents/README.md)** - All AI agents and responsibilities
- **[Workflows Index](../../../repo-governance/workflows/README.md)** - All orchestrated processes

## Related Skills

- `repo-applying-maker-checker-fixer` - Understanding the three-stage quality workflow (fits in L3 Development)
- `docs-creating-accessible-diagrams` - Example of L2 Convention implemented through Skills delivery
- `repo-practicing-trunk-based-development` - Example of L3 Development practice

---

**Note**: This Skill provides architectural overview. The authoritative Repository Architecture document contains complete traceability examples, detailed layer characteristics, and usage guidance.

See the `reference/` directory in this Skill for detailed layer characteristics and governance relationships.
