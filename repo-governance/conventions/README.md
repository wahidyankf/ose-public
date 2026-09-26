---
description: Documentation conventions and standards for open-sharia-enterprise
when_to_use: Use when you need the repository's shared rules for writing, organizing, or checking documentation, or when routing to the specific conventions subdirectory (formatting, linking, writing, structure, tutorials, security) that governs a change.
---

# Conventions

Use this section when you need the repository's shared rules for writing, organizing, or checking documentation. These conventions make the platform easier to understand and safer to change without turning every decision into a new debate.

**Governance**: All conventions in this directory serve the [Vision](../vision/open-sharia-enterprise.md) (Layer 0) and implement the [Core Principles](../principles/README.md) (Layer 1) as part of the six-layer architecture. Each convention MUST include a "Principles Implemented/Respected" section that explicitly traces back to foundational principles. See [Repository Governance Architecture](../repository-governance-architecture.md) for complete governance model and [Convention Writing Convention](./writing/conventions.md) for structure requirements.

## 🧭 Find the right rule

- Starting a reader-facing page? Begin with [writing](./writing/README.md), then use [formatting](./formatting/README.md) and [linking](./linking/README.md) — apply writing standards first, then formatting and linking rules as needed.
- Deciding where a document belongs? Use [structure](./structure/README.md) — documentation organization frameworks, file naming, and project planning structure, including the Diátaxis convention it links to.
- Creating learning material? Use [tutorials](./tutorials/README.md) — standards for creating learning-oriented tutorial content.
- Handling environment or sensitive data guidance? Use [security](./security/README.md) — repository security conventions governing agent behaviour and data protection; check before making a change.

## Scope

**This directory contains conventions for DOCUMENTATION:**

**Belongs Here:**

- How to write and format markdown content
- Documentation organization and structure (Diataxis)
- File naming, linking, and cross-referencing
- Visual elements in docs (diagrams, colors, emojis, math notation)
- Content quality and accessibility standards
- Documentation file formats (tutorials, plans)
- Repository documentation standards (README, CONTRIBUTING)

**Does NOT Belong Here (use [Development](../development/README.md) instead):**

- Software development methodologies (BDD, testing, agile)
- Build processes and tooling workflows
- Development infrastructure (temporary files, build artifacts)
- Git workflows and commit practices
- AI agent development standards
- Code quality and testing practices

## The Layer Test for Conventions

**Question**: Does this document answer "**WHAT are the documentation rules?**"

**Belongs in conventions/** if it defines:

- HOW to write markdown content (formatting, syntax, structure)
- WHAT files should be named or organized
- WHAT visual standards to follow in docs (colors, diagrams, emojis)
- WHAT content quality standards apply to documentation

**Does NOT belong** if it defines:

- WHY we value something (that's a principle)
- HOW to develop software/themes (that's a development practice)
- HOW to solve a specific problem (that's a how-to guide)

**Examples**:

- "Files must use lowercase kebab-case names" - Convention (documentation rule)
- "Use 2-space indentation for nested lists" - Convention (documentation formatting)
- "Web app themes use Tailwind CSS" - Development (software practice)
- "Why plan documents carry no time estimates" - Principle (foundational value)

## Directory Structure

Conventions are organized into semantic categories. Each subdirectory has its own index; this page never lists an individual convention file directly — see the subdirectory's `README.md` for that.

- [Formatting Conventions](./formatting/README.md) — Markdown formatting, syntax, visual elements
- [Linking Conventions](./linking/README.md) — Cross-reference and internal linking standards
- [Writing Conventions](./writing/README.md) — Content quality, validation, writing standards
- [Structure Conventions](./structure/README.md) — Documentation organization, file naming, plans
- [Tutorial Conventions](./tutorials/README.md) — Tutorial creation and structure conventions
- [Security Conventions](./security/README.md) — Security conventions governing agent behaviour and data protection

## Related Documentation

- [Repository Governance Architecture](../repository-governance-architecture.md) — Complete six-layer architecture (Layer 2: Conventions)
- [Core Principles](../principles/README.md) — Layer 1: Foundational values that govern conventions
- [Development](../development/README.md) — Layer 3: Software practices (parallel governance with conventions)
- [Software Design Reference](../../docs/explanation/software-engineering/software-design-reference.md) — Cross-reference to authoritative software design and coding standards
