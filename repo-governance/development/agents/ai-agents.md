---
description: "Standards for creating and managing AI agents in the platform binding directory (primary) and secondary agent directories"
when_to_use: Use when authoring, reviewing, or restructuring an agent definition file in .claude/agents/, or when deciding which sub-topic of agent standards applies.
---

# AI Agents Convention

Standards for creating, structuring, and managing AI agents in the platform binding directory (primary source of truth) and secondary agent directories (auto-generated). **Edit the primary platform binding directory first, then sync to secondary directories.**

## Overview, Principles, and File Structure

- [Overview](./ai-agents/overview.md) — what agents are.
- [Principles](./ai-agents/principles-implemented-respected.md) — principle list.
- [Token Budget](./ai-agents/token-budget-philosophy.md) — budget mindset.
- [Conventions](./ai-agents/conventions-implemented-respected.md) — sibling conventions.
- [Required Frontmatter](./ai-agents/agent-file-structure-required-frontmatter.md) — six fields.
- [Optional Frontmatter](./ai-agents/agent-file-structure-optional-frontmatter-fields.md) — optional fields.
- [Agent skills References](./ai-agents/agent-file-structure-skills-references.md) — skills field format.
- [Agent skills References (Continued)](./ai-agents/agent-file-structure-skills-usage-in-body.md) — DRY rule.
- [Document Structure](./ai-agents/agent-file-structure-document-structure.md) — body layout.

## Naming and Tool Access

- [Naming Guidance](./ai-agents/agent-naming-conventions.md) — scope prefixes.
- [Naming Guidelines](./ai-agents/agent-naming-conventions-guidelines-and-name-vs-description.md) — name vs. desc.
- [Tool Access Patterns](./ai-agents/tool-access-patterns.md) — four patterns.
- [Report-Generating Agents](./ai-agents/tool-access-patterns-report-generating-agents.md) — Write+Bash rule.
- [Report-Generating (Continued)](./ai-agents/tool-access-patterns-progressive-report-writing.md) — progressive write.
- [Writing to Bindings](./ai-agents/tool-access-patterns-writing-to-platform-binding-directories.md) — binding-dir tools.

## Model Selection and Color

- [Model Selection](./ai-agents/model-selection-guidelines.md) — model tiers.
- [Color Categorization](./ai-agents/agent-color-categorization.md) — color field.
- [Color Translation Table](./ai-agents/platform-binding-examples-color-translation-table.md) — full table.
- [Categorization Rationale](./ai-agents/platform-binding-examples-categorization-rationale-and-notes.md) — rationale note.
- [Research Agent Note](./ai-agents/platform-binding-examples-research-agent-note.md) — research note.
- [Assigning Colors](./ai-agents/platform-binding-examples-assigning-colors-to-new-agents.md) — assignment.
- [Color Accessibility](./ai-agents/platform-binding-examples-color-accessibility.md) — accessibility.
- [Identification Example](./ai-agents/platform-binding-examples-agent-identification.md) — example.
- [Colors in Documentation](./ai-agents/platform-binding-examples-using-colors-in-documentation.md) — usage.

## Responsibility, Invocation, and Referencing

- [Responsibility Boundaries](./ai-agents/agent-responsibility-boundaries.md) — responsibility.
- [Invocation Patterns](./ai-agents/agent-invocation-patterns-and-decision-matrix.md) — Task vs. direct.
- [Invocation Limitation](./ai-agents/agent-invocation-patterns-limitation-and-examples.md) — isolation.
- [Referencing Standards](./ai-agents/convention-referencing-standards.md) — reference.

## Complexity, Size, and Agent-Skill Separation

- [Complexity Tiers](./ai-agents/agent-complexity-tiers.md) — tier taxonomy.
- [Condensing and Splitting](./ai-agents/condensing-and-splitting-agents.md) — condensing.
- [Size Checking](./ai-agents/agent-size-checking-and-content-philosophy.md) — the gate reports it.
- [Skill Separation Purpose](./ai-agents/agent-skill-separation-purpose-and-knowledge-classification.md) — rationale.
- [Separation Patterns A-C](./ai-agents/agent-skill-separation-patterns-a-b-c.md) — patterns A-C.
- [Pattern D](./ai-agents/agent-skill-separation-pattern-d.md) — task logic.
- [Guidelines and Validation](./ai-agents/agent-skill-separation-guidelines-validation-frontmatter.md) — guidelines.
- [Duplication Patterns](./ai-agents/agent-skill-separation-duplication-and-example.md) — duplication.
- [Separation Benefits](./ai-agents/agent-skill-separation-benefits.md) — rationale.

## Documentation, Verification, and Creating Agents

- [Documentation Standards](./ai-agents/agent-documentation-standards.md) — elements.
- [Verification Principles](./ai-agents/information-accuracy-verification-principles.md) — principles.
- [Worktree Awareness](./ai-agents/information-accuracy-verification-git-worktree-awareness.md) — rel. paths.
- [Toolchain Init Rule](./ai-agents/information-accuracy-verification-git-worktree-toolchain-init.md) — init rule.
- [Default Push Behaviour](./ai-agents/information-accuracy-verification-default-push-behaviour.md) — push rule.
- [Verification Checklist](./ai-agents/information-accuracy-verification-checklist.md) — checklist.
- [When to Create](./ai-agents/creating-new-agents-when-to-create.md) — criteria.
- [Creation Checklist](./ai-agents/creating-new-agents-checklist.md) — checklist.
- [Agent Template](./ai-agents/creating-new-agents-template.md) — boilerplate.

## Relationship to AGENTS.md and Special Cases

- [Division of Responsibility](./ai-agents/relationship-to-agents-md-division-maintenance-isolation.md) — split.
- [What Belongs Where](./ai-agents/relationship-to-agents-md-what-belongs-where.md) — vs. agent.
- [Special Cases](./ai-agents/special-cases.md) — versioning.
- [Anti-Patterns](./ai-agents/anti-patterns.md) — mistakes.
- [Validation Compliance](./ai-agents/validation-and-compliance.md) — integration.

## Agent-Skill Separation in Practice

- [When to Use agent skills](./ai-agents/agent-skill-separation-when-and-what-belongs.md) — decision.
- [Separation Examples](./ai-agents/agent-skill-separation-examples-and-decision-tree.md) — examples.
- [Benefits and Metrics](./ai-agents/agent-skill-separation-benefits-implementation-measurement-vigilance.md) — metrics.
- [Related Documentation](./ai-agents/related-documentation.md) — reading.

## Multi-Harness Binding Operation

- [Multi-Harness Directory](./ai-agents/multi-harness-binding-directory-hierarchy-format.md) — directory.
- [Multi-Harness Sync](./ai-agents/multi-harness-binding-sync-references-history-troubleshooting.md) — sync.
