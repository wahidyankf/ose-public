---
description: The foundational purpose and change we seek through Open Sharia Enterprise
when_to_use: Use when orienting to why the project exists, or deciding whether a document belongs under vision/.
---

# Vision

Open Sharia Enterprise exists to make trustworthy, Shariah-compliant enterprise systems easier to understand, build, and use. This vision keeps product purpose ahead of process.

## Purpose

This directory holds the statement of **why** Open Sharia Enterprise exists and **what change** it seeks. Vision is Layer 0 of the governance architecture: everything else should be able to trace its purpose back here.

See [Repository Architecture](../repository-governance-architecture.md) for complete understanding of how vision fits into the governance hierarchy and how it inspires all other layers.

**Vision Hierarchy:**

- **Vision** (Layer 0) - Foundational purpose that inspires all principles
- **Principles** (Layer 1) - Values that serve the vision
- **Conventions** (Layer 2) - Standards implementing principles
- **Development** (Layer 3) - Practices implementing principles
- **Agents** (Layer 4) - Tools enforcing conventions and practices
- **Workflows** (Layer 5) - Processes composing agents, procedures, and/or other workflows

See [Repository Governance Architecture](../repository-governance-architecture.md) for the authoritative reference on all layer relationships, governance flows, and traceability examples.

## The Layer Test for Vision

**Question**: Does this document answer "**WHY do we exist and WHAT CHANGE do we seek?**"

✅ **Belongs in vision/** if it defines:

- The fundamental PURPOSE of the project
- The PROBLEM we exist to solve
- The CHANGE we want to create in the world
- WHO we serve and HOW they benefit
- WHAT SUCCESS looks like when we achieve our vision

❌ **Does NOT belong** if it defines:

- WHY we value something (that's a principle)
- WHAT specific rules to follow (that's a convention)
- HOW to implement something (that's a development practice)

**Examples:**

- "Democratize Shariah-compliant enterprise for everyone" → ✅ Vision (foundational purpose)
- "Traditional Islamic finance is locked in closed systems - we exist to open it" → ✅ Vision (problem and change)
- "Why we value simplicity in all solutions" → ❌ Principle (operational value)
- "File naming must use kebab-case identifiers" → ❌ Convention (specific rule)

## Vision Documents

This directory carries one **ecosystem** vision — why Open Sharia Enterprise exists at all — plus two documents on how that vision governs day-to-day work. Individual products do not get their own Layer 0 document: a product's purpose, scope, and deliberate constraints belong with its own specifications, where the behaviour they justify already lives.

- [Open Sharia Enterprise Vision](./open-sharia-enterprise.md) — The foundational purpose and change we seek in democratizing Shariah-compliant enterprise. Use when orienting to why Open Sharia Enterprise exists, who it serves, or what success looks like — the ecosystem's Layer 0 vision.
- [How Vision Governs Everything](./how-vision-governs.md) — How the vision propagates through principles, conventions, development, and agents. Use when tracing how the foundational vision shapes principles, conventions, development practices, or agent automation.
- [Questions the Vision Answers](./questions-vision-answers.md) — Answers the vision gives to contributors, users, and the project itself. Use when explaining to a contributor, user, or reviewer why the project exists or what it offers them.

## Related Documentation

- [Repository Architecture](../repository-governance-architecture.md) - Complete six-layer architecture (Layer 0: Vision)
- [Core Principles](../principles/README.md) - Layer 1: Values serving this vision
- [Conventions](../conventions/README.md) - Layer 2: Standards supporting the vision
- [Development](../development/README.md) - Layer 3: Practices aligned with the vision
- [AI Agents](../../.agents/agents/README.md) - Layer 4: Automation serving the mission
- [Workflows](../workflows/README.md) - Layer 5: Processes supporting our goals
- [Explanation Index](../../docs/explanation/README.md) - All conceptual documentation
- [AGENTS.md](../../AGENTS.md) - Project guidance for all agents
