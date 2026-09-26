---
description: Foundational principles that guide all conventions and development practices
when_to_use: Use when deciding whether a document belongs under principles/, or looking up which principle governs a decision.
---

# Core Principles

These principles explain why the repository makes the choices it does. They connect day-to-day documentation and engineering decisions to the [Vision](../vision/open-sharia-enterprise.md): making trustworthy, Shariah-compliant enterprise systems more accessible.

## 🎯 Purpose

Core principles are the stable values behind how we build software and write documentation. In the six-layer architecture, they are **Layer 1**: they serve the [Vision](../vision/open-sharia-enterprise.md) and guide conventions and development practices.

See [Repository Architecture](../repository-governance-architecture.md) for complete understanding of how principles fit into the governance hierarchy and how changes propagate through layers.

**Principles serve the vision and are stable values.** When creating or modifying any convention or practice, you must verify:

1. It serves the [Vision](../vision/open-sharia-enterprise.md) of democratizing Shariah-compliant enterprise
2. It aligns with these principles

If a proposed change conflicts with a principle, either revise the change or document why the principle itself needs reconsideration (rare). All principles must include a "Vision Supported" section showing HOW the principle serves the foundational vision.

**Principle Hierarchy**:

- **Vision** (Layer 0) - Foundational purpose (WHY we exist, WHAT change we seek)
- **Core Principles** (Layer 1 - this section) - Foundational values that serve the vision and guide everything
- **Conventions** (Layer 2) - Documentation standards embodying these principles
- **Development** (Layer 3) - Software practices embodying these principles
- **Implementation** (Layer 4+) - Actual code, agents, workflows, and content following conventions and practices

## 🧪 The Layer Test for Principles

**Question**: Does this document answer "**WHY do we value this?**"

✅ **Belongs in principles/** if it defines:

- A foundational VALUE that governs decision-making
- A philosophical stance that applies across multiple contexts
- A timeless belief that guides conventions and practices
- The REASON behind multiple related standards

❌ **Does NOT belong** if it defines:

- WHAT specific rules to follow (that's a convention)
- HOW to implement something (that's a development practice)
- Step-by-step instructions (that's a how-to guide)
- Technical specifications (that's a reference)

**Examples**:

- "Why we value simplicity in all solutions" → ✅ Principle (foundational value)
- "Why accessibility must be built in from day one" → ✅ Principle (philosophical stance)
- "Why plan documents carry no time estimates" → ✅ Principle (timeless belief)
- "File naming must use kebab-case identifiers" → ❌ Convention (specific rule)
- "Use git hooks for automated validation" → ❌ Development (implementation practice)

**Key Distinction**: Principles answer "why we care", conventions/development answer "what to do" or "how to do it".

## 📋 Principles Index

Principles are grouped by domain into three subdirectories, each with its own index. Two direct
documents provide traceability guidance that spans all groups.

### Domain Groups

- [General Principles](./general/README.md) — Foundational problem-solving values that apply across the repository. Use when deciding whether a cross-cutting, domain-independent value belongs here, or looking up a specific general principle.
- [Content Principles](./content/README.md) — Values that make platform documentation and learning materials accessible and useful. Use when deciding whether a content or documentation value belongs here, or looking up a specific content principle.
- [Software Engineering Principles](./software-engineering/README.md) — Values behind dependable, understandable software development in the platform. Use when deciding whether a software-development value belongs here, or looking up a specific software-engineering principle.

### Traceability and Process

- [Traceability: From Principles to Implementation](./traceability-examples.md) — Worked examples tracing a principle through convention/practice into concrete implementation. Use when you need a concrete worked example of how a principle should trace through a convention or practice into enforced implementation.
- [Using These Principles](./using-principles.md) — Process guidance for applying core principles when creating conventions, making decisions, or reviewing changes. Use when creating a new convention or practice, resolving a conflict between principles, or reviewing a change for principle alignment.

## 📚 Related Documentation

- [Repository Architecture](../repository-governance-architecture.md) - Complete six-layer architecture explanation
- [Vision](../vision/open-sharia-enterprise.md) - Layer 0: Foundational purpose that inspires all principles
- [Conventions Index](../conventions/README.md) - Layer 2: Documentation conventions embodying these principles
- [Development Index](../development/README.md) - Layer 3: Development practices embodying these principles
- [Explanation Index](../../docs/explanation/README.md) - All conceptual documentation
