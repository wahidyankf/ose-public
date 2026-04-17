---
title: Core Principles
description: Foundational principles that guide all conventions and development practices
category: explanation
subcategory: principles
tags:
  - principles
  - values
  - philosophy
  - index
created: 2025-12-15
updated: 2026-03-28
---

# Core Principles

Foundational principles that guide all conventions and development practices in the open-sharia-enterprise project. These principles represent the **why** behind our conventions and methodologies, and they serve the foundational [Vision](../vision/open-sharia-enterprise.md) of democratizing Shariah-compliant enterprise.

## 🎯 Purpose

Core principles establish the philosophical foundation for how we build software and write documentation. These principles are **Layer 1 in the six-layer architecture** - they serve the [Vision](../vision/open-sharia-enterprise.md) (Layer 0) and govern all conventions and development practices (Layers 2-3).

See [Repository Architecture](../repository-governance-architecture.md) for complete understanding of how principles fit into the governance hierarchy and how changes propagate through layers.

**Principles serve the vision and are stable values.** When creating or modifying any convention or practice, you must verify:

1. It serves the [Vision](../vision/open-sharia-enterprise.md) of democratizing Shariah-compliant enterprise
2. It aligns with these principles

If a proposed change conflicts with a principle, either revise the change or document why the principle itself needs reconsideration (rare). All principles must include a "Vision Supported" section showing HOW the principle serves the foundational vision.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% All colors are color-blind friendly and meet WCAG AA contrast standards
graph TD
 V[Vision]
 A[Core Principles]
 B[Conventions]
 C[Development]
 D[Implementation]

 V --> A
 A --> B
 A --> C
 B --> D
 C --> D

 style V fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:3px
 style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
 style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
 style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
 style D fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

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
- "Why we avoid time estimates in learning materials" → ✅ Principle (timeless belief)
- "File naming must use kebab-case identifiers" → ❌ Convention (specific rule)
- "Use git hooks for automated validation" → ❌ Development (implementation practice)

**Key Distinction**: Principles answer "why we care", conventions/development answer "what to do" or "how to do it".

## 📋 Principles Index

### General Principles

Universal principles that apply to all problem-solving contexts - beyond software, content, or any specific domain.

#### 1. [Deliberate Problem-Solving](./general/deliberate-problem-solving.md)

Think before coding. Don't assume. Don't hide confusion. Surface tradeoffs. Make assumptions explicit, present multiple interpretations, suggest simpler approaches, and stop to ask when unclear.

**Key applications**:

- State assumptions explicitly before implementation
- Present multiple valid approaches when they exist
- Suggest simpler alternatives to complex solutions
- Use verification tools (Read, Grep, WebSearch) to validate assumptions
- Ask questions rather than guessing requirements
- Advocate for simplicity and push back on unnecessary complexity

#### 2. [Simplicity Over Complexity](./general/simplicity-over-complexity.md)

Favor minimum viable abstraction and avoid over-engineering. Start simple and add complexity only when proven necessary.

**Key applications**:

- Flat library structure (no deep nesting)
- Single-purpose agents (not multi-role)
- Minimal frontmatter fields (only what's needed)
- Direct markdown (not complex templating)
- Convention documents (not frameworks)

#### 3. [Root Cause Orientation](./general/root-cause-orientation.md)

Find root causes and fix them properly. No temporary patches. Changes touch only what is necessary to solve the actual problem. Hold all work to the standard a senior engineer would approve.

**Key applications**:

- Diagnose before acting - understand the actual cause before writing a fix
- Minimal impact - every changed line traces directly to the task
- Senior engineer test - ask "would a senior engineer approve this?" before declaring done
- Mention unrelated code improvements (style, refactoring) found during work; do not silently apply them
- Proactively fix preexisting errors encountered during work — do not mention and defer

### Content Principles

Principles specific to documentation, education, and communication - how we write, teach, and share knowledge.

#### 4. [Accessibility First](./content/accessibility-first.md)

Design for universal access from the start - WCAG compliance, color-blind friendly palettes, alt text, screen reader support. Accessibility benefits everyone.

**Key applications**:

- Color-blind friendly palette in all diagrams
- Alt text required for all images
- Proper heading hierarchy
- Semantic HTML
- WCAG AA contrast standards

#### 5. [Documentation First](./content/documentation-first.md)

Documentation is not optional - it is mandatory. Every system, convention, feature, and architectural decision must be documented. Undocumented knowledge is lost knowledge.

**Key applications**:

- All code requires README, API docs, inline comments
- All conventions require explanation documents
- All features require how-to guides
- All architectural decisions require explanation documents
- No "self-documenting code" excuse
- Documentation written BEFORE or WITH code

#### 6. [No Time Estimates](./content/no-time-estimates.md)

People work and learn at vastly different speeds. Focus on outcomes and deliverables, not arbitrary time constraints.

**Key applications**:

- No time estimates in tutorials
- No "X hours" in educational content
- Coverage percentages instead (depth, not duration)
- Outcomes-focused language
- Plan deliverables (not timelines)

#### 7. [Progressive Disclosure](./content/progressive-disclosure.md)

Start simple and layer complexity gradually. Beginners see simple patterns, experts access advanced features when needed.

**Key applications**:

- Tutorial levels (Initial Setup → Quick Start → Beginner → Intermediate → Advanced)
- Diátaxis framework (Tutorials vs Reference)
- Documentation hierarchy (Overview → Details)
- File naming (directory-encoded kebab-case)
- Convention documents (basic principles → advanced patterns)

### Software Engineering Principles

Principles specific to software development practices - configuration, automation, and code organization.

#### 8. [Automation Over Manual](./software-engineering/automation-over-manual.md)

Automate repetitive tasks to ensure consistency and reduce human error. Humans should focus on creative work, machines on repetitive tasks.

**Key applications**:

- Git hooks (pre-commit, commit-msg)
- AI agents (docs-checker, plan-checker)
- Prettier (code formatting)
- Commitlint (message validation)
- Link verification cache

#### 9. [Explicit Over Implicit](./software-engineering/explicit-over-implicit.md)

Choose explicit composition and configuration over magic, convenience, and hidden behavior. Code should be transparent and understandable.

**Key applications**:

- Explicit tool permissions in AI agents (not "all tools")
- Explicit file naming with readable kebab-case basenames (not "clever" abbreviations)
- Explicit frontmatter fields (not defaults)
- Explicit color hex codes (not CSS color names)

#### 10. [Immutability Over Mutability](./software-engineering/immutability.md)

Prefer immutable data structures over mutable state. Modifications create new values instead of changing existing ones.

**Key applications**:

- const by default, avoid let and var
- Spread operators for object/array updates
- Immutable array methods (map, filter, reduce)
- Immer library for complex nested updates
- Object.freeze for runtime immutability

#### 11. [Pure Functions Over Side Effects](./software-engineering/pure-functions.md)

Prefer pure functions (deterministic, no side effects) over functions with side effects. Same inputs always produce same outputs.

**Key applications**:

- Business logic as pure functions
- Functional Core, Imperative Shell pattern
- Side effects isolated at system boundaries
- Easy testing without mocks
- Composable function pipelines

#### 12. [Reproducibility First](./software-engineering/reproducibility.md)

Development environments and builds should be reproducible from the start. Eliminate "works on my machine" problems.

**Key applications**:

- Volta for Node.js/npm version pinning
- package-lock.json for deterministic installs
- .env.example for environment configuration
- Docker for complex service dependencies
- Documented setup processes

## 🔗 Traceability: From Principles to Implementation

Every principle should be traceable through three layers:

1. **Principle** (WHY) - The foundational value
2. **Convention or Practice** (WHAT/HOW) - The concrete rule implementing the principle
3. **Implementation** (ENFORCE) - Agents, code, or automation enforcing the rule

When documenting a new convention or practice, ALWAYS reference which principles it implements. When creating an agent, ALWAYS reference which conventions/practices it enforces.

### Complete Traceability Examples

#### Example 1: Color Accessibility Principle

**Core Principle**: Accessibility First

**Convention**: [Color Accessibility Convention](../conventions/formatting/color-accessibility.md)

- Verified accessible palette (Blue, Orange, Teal, Purple, Brown)
- WCAG AA compliance required
- Color-blind testing mandatory

**Development**: [AI Agents Convention](../development/agents/ai-agents.md)

- Agent color categorization uses accessible palette
- Colored square emojis (🟦 🟩 🟨 🟪)
- Color is supplementary, not sole identifier

**Implementation**: Actual agent files

- Frontmatter `color` field uses accessible colors
- README displays colored emojis
- Text labels primary, color secondary

#### Example 2: Explicit Over Implicit Principle

**Principle**: Explicit Over Implicit (software engineering)

**Practice**: [AI Agents Convention](../development/agents/ai-agents.md)

- Explicit `tools` field listing allowed tools
- No default tool access
- Security through explicit whitelisting

**Implementation**: Multiple agents enforce this

- **agent-maker**: Validates new agents have explicit `tools` field in frontmatter
- **repo-rules-checker**: Audits agents for missing or incomplete tool declarations
- **repo-rules-fixer**: Can add missing frontmatter fields

**Result**: All agent files contain explicit tool lists:

```yaml
---
tools: Read, Glob, Grep
---
```

#### Example 3: Automation Over Manual Principle

**Principle**: Automation Over Manual (software engineering)

**Practice**: [Code Quality Convention](../development/quality/code.md)

- Automated formatting via Prettier
- Automated validation via git hooks
- Automated commit message checking

**Implementation**: Multiple systems enforce this

- **Husky + lint-staged**: Pre-commit hook formats code automatically
- **Commitlint**: Commit-msg hook validates message format
- **Various checker agents**: Automated quality validation (docs-checker, repo-rules-checker, etc.)

**Result**: Code quality maintained automatically without manual intervention

## 🧭 Using These Principles

### When Creating Conventions or Practices

Every new convention (documentation rule) or practice (software standard) must trace back to one or more core principles.

**Process**:

1. **Identify the need**: What problem are you solving?
2. **Choose the principle**: Which principle(s) does this implement?
3. **Document the connection**: In the convention/practice document, explicitly reference which principles it embodies
4. **Verify alignment**: Does the proposed rule conflict with any principles?
5. **Plan enforcement**: Which agents or automation will implement this rule?

**Template for new conventions/practices**:

```markdown
## Principles Implemented/Respected

This convention implements the following core principles:

- **Principle Name**: Explain how this rule embodies the principle
- **Another Principle**: Explain the connection
```

**Questions to ask**:

- Does this convention embody our core principles?
- Which principle does it support?
- Does it create unnecessary complexity? (violates Simplicity Over Complexity)
- Is it explicit and understandable? (violates Explicit Over Implicit)
- Is it accessible to all users? (violates Accessibility First)
- Can it be automated? (supports Automation Over Manual)

### When Making Decisions

Prioritize principles in order of importance:

1. **Deliberate Problem-Solving** - Think before acting; surface assumptions and tradeoffs first
2. **Root Cause Orientation** - Fix root causes, not symptoms; minimal impact; senior engineer standard
3. **Accessibility First** - Never compromise accessibility
4. **Explicit Over Implicit** - Clarity beats convenience
5. **Simplicity Over Complexity** - Simple solutions first
6. **Automation Over Manual** - Automate when proven repetitive
7. **Progressive Disclosure** - Support all skill levels
8. **No Time Estimates** - Focus on outcomes

> **Note**: This priority ordering applies when principles appear to conflict. All principles apply in normal circumstances - this list guides conflict resolution, not principle selection. Items 1-2 are general problem-solving principles that apply universally; items 3-8 are content, documentation, and software-engineering principles.

### When Adding New Conventions or Practices

After creating a new convention or practice document:

1. **Use docs-maker** to create the convention/practice document with principles section
2. **Use repo-rules-maker** to make the change effective across repository:
   - Update AGENTS.md with brief summary
   - Update relevant README files (conventions/development index)
   - Update agents that should enforce the new rule
   - Add validation checks to appropriate checker agents
3. **Use repo-rules-checker** to validate consistency after changes
4. **Use repo-rules-fixer** if issues found (after user review)

**Workflow**: docs-maker (create) → repo-rules-maker (propagate) → repo-rules-checker (validate) → repo-rules-fixer (fix if needed)

### When Reviewing Changes

Check that changes:

- ✅ Respect accessibility standards
- ✅ Use explicit configuration
- ✅ Maintain simplicity
- ✅ Leverage automation appropriately
- ✅ Support progressive learning
- ✅ Avoid artificial time constraints
- ✅ Trace back to core principles (documented in convention/practice)

## 📚 Related Documentation

- [Repository Architecture](../repository-governance-architecture.md) - Complete six-layer architecture explanation
- [Vision](../vision/open-sharia-enterprise.md) - Layer 0: Foundational purpose that inspires all principles
- [Conventions Index](../conventions/README.md) - Layer 2: Documentation conventions embodying these principles
- [Development Index](../development/README.md) - Layer 3: Development practices embodying these principles
- [Explanation Index](../../docs/explanation/README.md) - All conceptual documentation

---

**Last Updated**: 2026-03-28
