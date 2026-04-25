---
title: "Repository Governance Architecture"
description: Six-layer governance hierarchy defining how repository rules, conventions, and practices are organized
category: explanation
subcategory: architecture
tags:
  - architecture
  - governance
  - six-layer
  - structure
created: 2026-02-09
---

# Repository Governance Architecture

**Document Type**: Explanation
**Purpose**: Comprehensive architectural overview of the six-layer governance hierarchy governing the open-sharia-enterprise repository
**Audience**: All contributors, AI agents, governance designers

---

## Table of Contents

- [Repository Governance Architecture](#repository-governance-architecture)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Architectural Principles](#architectural-principles)
  - [The Six Layers](#the-six-layers)
    - [Quick Reference Table](#quick-reference-table)
  - [Layer 0: Vision (WHY WE EXIST)](#layer-0-vision-why-we-exist)
  - [Layer 1: Principles (WHY - Values)](#layer-1-principles-why---values)
  - [Layer 2: Conventions (WHAT - Documentation Rules)](#layer-2-conventions-what---documentation-rules)
  - [Layer 3: Development (HOW - Software Practices)](#layer-3-development-how---software-practices)
  - [Layer 4: AI Agents (WHO - Executors)](#layer-4-ai-agents-who---executors)
  - [Layer 5: Workflows (WHEN - Multi-Step Processes)](#layer-5-workflows-when---multi-step-processes)
  - [Skills: Delivery Infrastructure (Not a Governance Layer)](#skills-delivery-infrastructure-not-a-governance-layer)
  - [Complete Traceability Example](#complete-traceability-example)
  - [Governance Relationships](#governance-relationships)
  - [Best Practices](#best-practices)
  - [Common Misconceptions](#common-misconceptions)
  - [Future Evolution](#future-evolution)
  - [Principles Implemented/Respected](#principles-implementedrespected)
  - [Conventions Implemented/Respected](#conventions-implementedrespected)

---

## Overview

The **open-sharia-enterprise** repository employs a six-layer governance architecture that provides complete traceability from foundational vision to executable workflows. Each layer builds on the foundation above, creating a coherent system where every rule, practice, and automation can be traced back to core values.

**Architectural Questions Answered**:

- **Layer 0 (Vision)**: WHY does this project exist?
- **Layer 1 (Principles)**: WHY do we value certain approaches?
- **Layer 2 (Conventions)**: WHAT documentation rules must we follow?
- **Layer 3 (Development)**: HOW do we develop software and automation?
- **Layer 4 (AI Agents)**: WHO enforces rules and automates tasks?
- **Layer 5 (Workflows)**: WHEN do we run which agents in what order?

**Delivery Infrastructure** (Skills): HOW do we package and deliver knowledge to agents? (Service infrastructure, not governance)

**Key Insight**: This architecture creates bidirectional traceability:

- **Top-down**: Vision → Principles → Conventions/Development → Agents → Workflows
- **Bottom-up**: Every workflow/agent/practice can be traced to principles and vision

---

## Architectural Principles

This governance architecture itself follows core repository principles:

**Simplicity Over Complexity**:

- Flat layer hierarchy (no sub-layers)
- Clear governance relationships (higher layers govern lower)
- Single responsibility per layer

**Explicit Over Implicit**:

- Required traceability sections in each document
- Explicit "Principles Implemented/Respected" declarations
- Documented governance relationships

**Documentation First**:

- Each layer comprehensively documented
- Relationships explicitly stated
- Examples provided for traceability

**Progressive Disclosure**:

- Quick reference table for rapid orientation
- Detailed layer descriptions for deep understanding
- Complete examples for implementation guidance

---

## The Six Layers

```
Layer 0: Vision       WHY WE EXIST       (foundational purpose)
    ↓ inspires
Layer 1: Principles   WHY - Values       (governs L2, L3)
    ↓ governs
Layer 2: Conventions  WHAT - Doc Rules   (governs L3, L4)
    ↓ governs (with L2)
Layer 3: Development  HOW - Practices    (governs L4)
    ↓ governs (implemented by)
Layer 4: AI Agents    WHO - Executors    (atomic tasks)
    ↓ orchestrated by
Layer 5: Workflows    WHEN - Orchestrate (multi-step processes)
```

**Skills Infrastructure** (Delivery):

- Inline skills (default): Progressive knowledge injection
- Fork skills (context: fork): Task delegation to isolated agents
- Service relationship: Skills serve agents, don't govern them

### Quick Reference Table

| Layer | Location                | Purpose                       | Changes?        | Answers?                  |
| ----- | ----------------------- | ----------------------------- | --------------- | ------------------------- |
| **0** | governance/vision/      | WHY we exist                  | Extremely rare  | Why does project exist?   |
| **1** | governance/principles/  | WHY we value approaches       | Rarely          | Why value this approach?  |
| **2** | governance/conventions/ | WHAT documentation rules      | Occasionally    | What documentation rules? |
| **3** | governance/development/ | HOW we develop software       | More frequently | How develop software?     |
| **4** | .claude/agents/         | WHO enforces rules            | Often           | Who enforces rules?       |
| **5** | governance/workflows/   | WHEN run agents in what order | As needed       | When run which agents?    |

**Skills**: `.claude/skills/` - Delivery infrastructure serving agents (inline knowledge injection or fork-based delegation)

---

## Layer 0: Vision (WHY WE EXIST)

**Purpose**: Foundational purpose - WHY the project exists and WHAT change we seek in the world.

**Location**: `governance/vision/`

**Key Document**: [Vision - Open Sharia Enterprise](./vision/open-sharia-enterprise.md)

**Core Vision**:

> Democratize Shariah-compliant enterprise systems by making Islamic finance and halal business solutions accessible to everyone through open-source tools and comprehensive education.

**Vision Pillars**:

1. **Accessibility**: Enterprise-grade tools available to all, regardless of budget
2. **Education**: Comprehensive knowledge base for Islamic finance principles and implementation
3. **Community**: Open-source ecosystem fostering collaboration and shared innovation
4. **Compliance**: Accurate Shariah-compliant implementations verified by scholars

**Characteristics**:

- Immutable foundational purpose
- Changes extremely rarely (only if fundamental mission shifts)
- All other layers serve this vision
- Answers: "Why does this project exist?"

**Relationship to Other Layers**:

- **Inspires** Layer 1 (Principles)
- **NOT governance**: Does not directly govern conventions or development practices
- **North Star**: Provides direction for all architectural decisions

---

## Layer 1: Principles (WHY - Values)

**Purpose**: Foundational values that govern all conventions and development practices. Explains WHY we value certain approaches.

**Location**: `governance/principles/`

**Key Document**: [Core Principles Index](./principles/README.md)

**Principles**:

**General Principles:**

- **Deliberate Problem-Solving** - Think before coding, surface assumptions, ask questions rather than guessing
- **Simplicity Over Complexity** - Minimum viable abstraction, avoid over-engineering
- **Root Cause Orientation** - Fix root causes, not symptoms; minimal impact; senior engineer standard

**Content Principles:**

- **Accessibility First** - WCAG compliance, universal design from the start
- **Documentation First** - Documentation is mandatory, not optional
- **No Time Estimates** - Outcomes over duration, respect different paces
- **Progressive Disclosure** - Layer complexity gradually

**Software Engineering Principles:**

- **Automation Over Manual** - Git hooks, AI agents for consistency
- **Explicit Over Implicit** - Transparent configuration, no magic
- **Immutability Over Mutability** - Prefer immutable data structures
- **Pure Functions Over Side Effects** - Deterministic, composable functions
- **Reproducibility First** - Eliminate "works on my machine" problems

**Characteristics**:

- Stable values that rarely change
- Each principle must include "Vision Supported" section
- Answers: "Why do we value this approach?"
- Governs both conventions (documentation) and development (software)

**Example Traceability**:

```
Vision: "Accessible to everyone"
    ↓ inspires
Principle: Accessibility First
    ↓ governs
Convention: Color Accessibility Convention
Development: AI Agents Convention — agent colors use accessible palette
```

**Requirements**:

- Each principle MUST include "Vision Supported" section linking to Layer 0
- Principles govern Layer 2 (Conventions) and Layer 3 (Development)
- Changes require careful consideration of downstream impact

---

## Layer 2: Conventions (WHAT - Documentation Rules)

**Purpose**: Documentation standards implementing core principles. Defines WHAT rules govern writing, organizing, and formatting documentation.

**Location**: `governance/conventions/`

**Key Document**: [Conventions Index](./conventions/README.md)

**Scope**:

- **docs/** directory (all documentation)
- **Hugo sites (historical)** (conventions preserved for reference)
- **plans/** directory (project planning)
- **README files** (repository root and project READMEs)

**Convention Categories** (among others):

- **Structure**: File naming, Diátaxis framework, plans organization, programming language docs separation
- **Formatting**: Linking, indentation, emoji usage, diagrams, color accessibility, mathematical notation, timestamp, nested code fences
- **Writing**: Content quality, README quality, factual validation, conventions writing, dynamic collection references, OSS documentation
- **Linking**: Internal AyoKoding references and cross-repository linking patterns
- **Hugo-Specific (historical)**: AyoKoding content, OSE Platform content, shared patterns, Indonesian content policy
- **Tutorials**: Tutorial types, naming, programming language content and structure

**Example Conventions**:

- [File Naming Convention](./conventions/structure/file-naming.md)
- [Linking Convention](./conventions/formatting/linking.md)
- [Color Accessibility Convention](./conventions/formatting/color-accessibility.md)
- [Content Quality Principles](./conventions/writing/quality.md)

**Requirements**:

- Each convention MUST include "Principles Implemented/Respected" section
- Implemented by Layer 4 (AI Agents)
- Changes impact both documentation and agent behavior

**Relationship to Other Layers**:

- **Governed by** Layer 1 (Principles)
- **Governs** Layer 3 (Development) and Layer 4 (AI Agents)
- **Implemented by** Layer 4 (AI Agents)

---

## Layer 3: Development (HOW - Software Practices)

**Purpose**: Software practices implementing core principles. Defines HOW we develop, test, deploy software and automation.

**Location**: `governance/development/`

**Key Document**: [Development Index](./development/README.md)

**Scope**:

- **Source code** (TypeScript, Go, Java, Kotlin, Python, Elixir, F#, Rust, C#, Clojure, Dart)
- **Hugo themes and layouts (historical)** (Go templates)
- **Build systems** (Nx, npm, Volta)
- **AI agents** (.claude/agents/)
- **Git workflows** (commits, branches, hooks)

**Practice Categories**:

- **Patterns**: Maker-Checker-Fixer, functional programming
- **Quality**: Code quality, criticality levels, fixer confidence, repository validation
- **Workflows**: Trunk-based development, commit messages, implementation workflow, reproducible environments
- **Infrastructure**: Temporary files, AI agents convention
- **Hugo-Specific (historical)**: Development practices for Hugo sites
- **Frontend**: Design tokens, component patterns, accessibility, styling conventions
- **Practices**: Proactive Preexisting Error Resolution (and future practice-level guidance)

**Example Practices**:

- [Trunk Based Development](./development/workflow/trunk-based-development.md)
- [Code Quality Convention (Git Hooks)](./development/quality/code.md)
- [AI Agents Convention](./development/agents/ai-agents.md)
- [Maker-Checker-Fixer Pattern](./development/pattern/maker-checker-fixer.md)

**Requirements**:

- Each practice MUST include BOTH "Principles Implemented/Respected" AND "Conventions Implemented/Respected" sections
- Implemented by Layer 4 (AI Agents) and automation (git hooks)
- Changes more frequently than conventions

**Relationship to Other Layers**:

- **Governed by** Layer 1 (Principles) and Layer 2 (Conventions)
- **Governs** Layer 4 (AI Agents)
- **Implemented by** Layer 4 (AI Agents) and automation

---

## Layer 4: AI Agents (WHO - Executors)

**Purpose**: Automated implementers enforcing conventions and development practices. Answers WHO enforces rules and automates tasks.

**Location**: `.claude/agents/`

**Key Document**: [Agents Index](../.claude/agents/README.md)

**Agent Families by Color**:

- 🟦 **Makers (Blue)** - Create new content from scratch (has Write tool)
- 🟩 **Checkers (Green)** - Validate and generate audit reports (has Write, Bash; no Edit)
- 🟨 **Fixers (Yellow)** - Modify and propagate existing content (has Edit + Write for fix reports)
- 🟪 **Implementors (Purple)** - Execute plans with full tool access (has Write, Edit, Bash)

**Agent Characteristics**:

- **Atomic responsibility**: One clear purpose per agent
- **Frontmatter**: name, description, tools, model, color, skills
- **Enforce conventions**: Each agent enforces specific conventions/practices
- **Tool permissions**: Carefully scoped (Read-only, Write, Edit, Bash, Web)

**Example Agents**:

- `docs-checker` - Validates factual accuracy using web verification
- `docs-fixer` - Applies validated factual corrections
- `readme-maker` - Creates/updates README files
- `repo-rules-checker` - Validates repository-wide consistency

**Requirements**:

- Agent `name` field MUST match filename (without .md)
- Agent description SHOULD mention enforced conventions/practices (via description field or Reference Documentation section)
- Agent MUST use appropriate tools for task (principle: least privilege)
- Agent color MUST use accessible palette

**Relationship to Other Layers**:

- **Governed by** Layer 2 (Conventions) and Layer 3 (Development)
- **Orchestrated by** Layer 5 (Workflows)
- **Served by** Skills (delivery infrastructure)

**Example Traceability**:

```
Convention: Color Accessibility
    ↓ implemented by
Agent: docs-checker (validates diagram colors)
Agent: docs-fixer (applies color corrections)
```

---

## Layer 5: Workflows (WHEN - Multi-Step Processes)

**Purpose**: Orchestrated multi-step processes composing AI agents. Answers WHEN to run which agents in what order.

**Location**: `governance/workflows/`

**Key Document**: [Workflows Index](./workflows/README.md)

**Workflow Families**:

- **Maker-Checker-Fixer** - Three-stage content quality (create → validate → fix)
- **Check-Fix** - Iterative validation (check → fix → re-check until clean)
- **Plan-Execute-Validate** - Planning workflow (plan → execute → validate → iterate)

**Workflow Characteristics**:

- **Sequences**: Define order (sequential, parallel, conditional)
- **State management**: Pass data between steps
- **Human approval**: Checkpoints for user review
- **Termination criteria**: Clear completion conditions

**Example Workflow**:

```
Maker-Checker-Fixer Workflow:
1. Maker creates content → draft
2. Checker validates → audit report in generated-reports/
3. User reviews → approve/reject
4. Fixer applies fixes → corrected content
5. Terminate: all findings resolved
```

**Requirements**:

- Each workflow MUST document agent sequence
- Each workflow MUST define termination criteria
- Human approval checkpoints MUST be explicit

**Relationship to Other Layers**:

- **Orchestrates** Layer 4 (AI Agents)
- **Implements** Layer 3 (Development patterns like Maker-Checker-Fixer)
- **No governance authority**: Workflows don't govern agents, they compose them

---

## Skills: Delivery Infrastructure (Not a Governance Layer)

**CRITICAL**: Skills are **delivery infrastructure**, NOT a governance layer.

**Purpose**: Package and deliver knowledge/capabilities to agents in two distinct modes.

**Location**: `.claude/skills/`

**Documentation**: See [`.claude/skills/README.md`](../.claude/skills/README.md) for skills catalog, or [AGENTS.md](../AGENTS.md) for OpenCode configuration including skills integration overview

**Two Delivery Modes**:

### Inline Skills (Knowledge Delivery)

**Default behavior** - Progressive knowledge injection:

```
Knowledge Flow (Inline):
L2: Conventions ──┬── CLAUDE.md/AGENTS.md (startup) ──> Claude/OpenCode
                  ├── Skills inline (on-demand) ────> Current conversation
                  └── Direct refs (explicit) ───────> L4: Agents

L3: Development ──┬── CLAUDE.md/AGENTS.md (startup) ──> Claude/OpenCode
                  ├── Skills inline (on-demand) ────> Current conversation
                  └── Direct refs (explicit) ───────> L4: Agents
```

**Characteristics**:

- Progressive disclosure (name/description → full content on-demand)
- Inject convention/development knowledge into current conversation
- Enable knowledge composition (multiple skills work together)
- Serve agents but don't govern them

### Fork Skills (Task Delegation)

**Delegation behavior** with `context: fork`:

```
Delegation Flow (Fork):
Skills (context: fork) ──delegates to──> Isolated Agent Context
                         ──returns──> Summarized Results
                         ──to──> Main Conversation
```

**Characteristics**:

- Spawn isolated subagent contexts for focused work
- Delegate specialized tasks (research, analysis, exploration)
- Act as lightweight orchestrators
- Return results to main conversation
- Still service relationship (not governance)

**Skills Available**:

- **docs-\*** - Documentation creation and quality
- **readme-\*** - README file patterns
- **repo-\*** - Repository-wide patterns
- **swe-programming-\*** - Language/framework expertise
- **swe-developing-\*** - Application development patterns
- **apps-\*** - Application-specific patterns
- **agent-\*** - Agent development and selection
- **plan-\*** - Project planning patterns

**Why Skills Are NOT Layer 4.5**:

| Aspect                | Governance Layers (L1-L5) | Skills (Delivery)              |
| --------------------- | ------------------------- | ------------------------------ |
| **Authority**         | Govern behavior (MUST)    | Serve agents (provide support) |
| **Change Frequency**  | Stable, controlled        | Evolve with agent needs        |
| **Traceability**      | Required sections         | Optional references            |
| **Relationship**      | Hierarchical governance   | Service relationship           |
| **Agent Compliance**  | Agents MUST follow        | Agents MAY use                 |
| **Enforcement**       | Mandatory                 | Optional                       |
| **Purpose**           | Define rules              | Deliver knowledge/tasks        |
| **Delivery Modes**    | N/A                       | Inline or fork                 |
| **Orchestration**     | N/A                       | Fork mode only                 |
| **Context Isolation** | N/A                       | Fork creates isolated contexts |

**Key insight**: Skills SERVE agents through two modes:

- **Inline skills** - Deliver knowledge from L2/L3 to current conversation
- **Fork skills** - Delegate tasks to agents in isolated contexts
- Neither mode governs agents (service relationship, not governance)

**Governance test**:

- Conventions → Agents: Yes (agents MUST follow conventions)
- Development → Agents: Yes (agents MUST follow practices)
- Skills (inline) → Agents: **No** (inject knowledge, serve agents)
- Skills (fork) → Agents: **No** (delegate tasks, serve agents)

**Delivery Mechanisms Comparison**:

| Mechanism               | When Loaded              | Purpose                        | Authority |
| ----------------------- | ------------------------ | ------------------------------ | --------- |
| **CLAUDE.md/AGENTS.md** | Conversation startup     | Initial context and quick refs | None      |
| **Inline skills**       | On-demand (progressive)  | Deep knowledge injection       | None      |
| **Fork skills**         | On-demand (delegation)   | Task delegation to subagents   | None      |
| **Direct references**   | Explicit document reads  | Authoritative source           | Full      |
| **Conventions (L2)**    | Via any above mechanisms | Governance rules               | Full      |
| **Development (L3)**    | Via any above mechanisms | Governance practices           | Full      |

---

## Complete Traceability Example

### Color Accessibility (Vision → Agents)

**L0 - Vision**: Democratize Islamic enterprise → accessible to everyone

**L1 - Principle**: [Accessibility First](./principles/content/accessibility-first.md)

- **Vision supported**: Accessible tools enable global participation in Shariah-compliant business
- **Key value**: Universal access from the start, not as an afterthought

**L2 - Convention**: [Color Accessibility Convention](./conventions/formatting/color-accessibility.md)

- **Implements**: Accessibility First principle
- **Rule**: Use verified color-blind friendly palette
- **WCAG AA compliance required**

**L3 - Development**: [AI Agents Convention](./development/agents/ai-agents.md)

- **Respects**: Color Accessibility Convention
- **Practice**: Agent colors use accessible palette
- **Implementation**: Frontmatter `color` field limited to verified palette

**L4 - Agents**:

- `docs-checker` - Validates diagram colors in documentation
- `docs-fixer` - Applies color corrections to diagrams
- `agent-maker` - Validates agent frontmatter colors

**L5 - Workflow**: Maker-Checker-Fixer

- Orchestrates: maker → checker → fixer
- Ensures: All diagrams use accessible colors before publication

**Skills (Delivery)**:

- `docs-creating-accessible-diagrams` (inline) - Delivers Mermaid diagram patterns with WCAG colors
- Service relationship: Helps agents understand color conventions

**Complete Chain**:

```
Vision (Democratize access)
    ↓ inspires
Principle (Accessibility First)
    ↓ governs
Convention (Color Accessibility)
    ↓ governs
Development (AI Agents Convention)
    ↓ governs
Agents (docs-checker, docs-fixer, agent-maker)
    ↓ orchestrated by
Workflow (Maker-Checker-Fixer)
    ↓ served by
Skills (docs-creating-accessible-diagrams - inline knowledge delivery)
```

---

## Governance Relationships

### Hierarchical Governance

**Governance flows downward**:

```
Layer 0 (Vision)
    ↓ inspires (not governs)
Layer 1 (Principles)
    ↓ governs
Layer 2 (Conventions) + Layer 3 (Development)
    ↓ governs
Layer 4 (AI Agents)
    ↓ orchestrated by (not governed by)
Layer 5 (Workflows)
```

**Skills (Infrastructure)**:

```
Skills ──serves──> Agents (inline knowledge or fork delegation)
Skills ──does NOT govern──> Agents
```

### Cross-Layer Relationships

**Layer 1 → Layer 2 & Layer 3**:

- Principles govern BOTH conventions and development
- Both layers must trace back to principles

**Layer 2 ↔ Layer 3**:

- Conventions govern development practices
- Development practices implement conventions
- Bidirectional relationship (development respects conventions)

**Layer 3 → Layer 4**:

- Development practices govern agent implementation
- Agents must follow development conventions

**Layer 5 → Layer 4**:

- Workflows orchestrate agents (composition, not governance)
- Workflows don't create new rules for agents

**Skills ↔ Agents**:

- Skills serve agents (service relationship)
- Skills deliver knowledge (inline mode) or delegate tasks (fork mode)
- Skills don't govern agents

### Traceability Requirements

**Layer 0 (Vision)**:

- No required traceability (foundational)

**Layer 1 (Principles)**:

- MUST include "Vision Supported" section

**Layer 2 (Conventions)**:

- MUST include "Principles Implemented/Respected" section

**Layer 3 (Development)**:

- MUST include "Principles Implemented/Respected" section
- MUST include "Conventions Implemented/Respected" section

**Layer 4 (Agents)**:

- Frontmatter SHOULD reference relevant skills
- Description SHOULD mention enforced conventions/practices

**Layer 5 (Workflows)**:

- SHOULD document which agents are orchestrated
- SHOULD reference development patterns implemented

**Skills (Infrastructure)**:

- MAY reference conventions/development practices
- MAY reference related skills
- Optional (service infrastructure, not governance)

---

## Best Practices

### When Creating New Conventions

1. **Check principles first** - Which principle does this implement?
2. **Add traceability section** - "Principles Implemented/Respected"
3. **Document in Conventions Index** - Add to `conventions/README.md`
4. **Consider agent impact** - Which agents need to enforce this?
5. **Consider Skills delivery** - Should this be packaged as a Skill for agents?

### When Creating New Development Practices

1. **Check both principles AND conventions** - What do you implement/respect?
2. **Add both traceability sections** - Principles AND Conventions
3. **Document in Development Index** - Add to `development/README.md`
4. **Consider automation** - Git hooks? AI agents?
5. **Consider Skills delivery** - Should this be packaged as a Skill for agents?

### When Creating New Agents

1. **Identify governing layers** - Which conventions/practices does this enforce?
2. **Define atomic responsibility** - One clear purpose
3. **Choose tools carefully** - Match to task (Read-only, Write, Edit, Bash, Web)
4. **Document in Agents Index** - Add to `.claude/agents/README.md`
5. **Reference relevant Skills** - Which Skills will help this agent?

### When Creating Workflows

1. **Identify agent sequence** - What agents needed, in what order?
2. **Define termination criteria** - When does workflow complete?
3. **Add approval checkpoints** - Where does user review?
4. **Document state management** - How does state flow between steps?

### When Creating Skills

1. **Identify service need** - What knowledge/task do agents need repeatedly?
2. **Choose delivery mode** - Inline (knowledge) or fork (delegation)?
3. **Package clearly** - SKILL.md with purpose, patterns, examples
4. **Reference in agents** - Update agent frontmatter with new skill
5. **Avoid governance claims** - Skills serve, don't govern

---

## Common Misconceptions

### Misconception 1: "Skills are Layer 4.5"

❌ **Wrong**: Skills are not a layer between Development and Agents.

✅ **Correct**: Skills are delivery infrastructure (like CLAUDE.md), not governance layer. They serve agents through inline knowledge delivery or fork-based task delegation.

### Misconception 2: "Agents can ignore conventions if skilled"

❌ **Wrong**: Skills provide knowledge but don't override governance.

✅ **Correct**: Agents MUST follow conventions. Skills help agents understand conventions better and provide implementation patterns.

### Misconception 3: "Workflows replace agents"

❌ **Wrong**: Workflows don't replace agents, they orchestrate them.

✅ **Correct**: Workflows compose multiple agents into multi-step processes. Agents remain atomic, workflows handle sequencing.

### Misconception 4: "Principles can conflict"

❌ **Wrong**: Principles sometimes contradict each other.

✅ **Correct**: Principles complement each other. Apparent conflicts require nuanced application, not choosing one over another.

### Misconception 5: "Layer 2 and Layer 3 are the same"

❌ **Wrong**: Conventions and Development practices are interchangeable.

✅ **Correct**:

- **Layer 2 (Conventions)**: WHAT documentation rules (scope: docs/, plans/, web content)
- **Layer 3 (Development)**: HOW software practices (scope: source code, builds, git, agents)
- Layer 3 practices must respect Layer 2 conventions

---

## Future Evolution

### Potential Layer Additions

As the repository grows, additional layers might be considered:

**Layer 6 (WHEN - Scheduled Automation)**:

- Potential future layer for cron jobs, CI/CD pipelines
- Currently: Workflows are manually triggered
- Future: Scheduled, event-driven, or CI/CD-triggered workflows

**Not planned**: Additional intermediate layers between existing layers (maintains simplicity)

### Skill Evolution

**Growth Patterns**:

- **Programming language skills** - Additional language/framework skills as project expands
- **Domain-specific skills** - Business logic patterns (e.g., Islamic finance calculations)
- **Workflow automation skills** - Complex orchestration patterns
- **Fork skill patterns** - More sophisticated delegation strategies

**Principles guiding skill growth**:

- **Simplicity Over Complexity**: Don't create skills for one-off patterns
- **Progressive Disclosure**: Skills enable on-demand deep dives
- **Automation Over Manual**: Skills reduce agent duplication

### Convention/Development Growth

**As project matures**:

- **New languages**: Java, Kotlin, Python development conventions
- **New domains**: Islamic finance-specific patterns and rules
- **Enhanced validation**: More sophisticated checker/fixer agents
- **Performance conventions**: Optimization and scalability standards

**Stability expectations**:

- Layer 1 (Principles): Very stable, rare changes
- Layer 2 (Conventions): Occasional additions, rare removals
- Layer 3 (Development): More frequent additions as tech stack grows
- Layer 4 (Agents): Regular additions for new validation/automation needs
- Layer 5 (Workflows): New workflows as processes mature
- Skills: Most frequent additions to serve growing agent needs

---

## Principles Implemented/Respected

**From [Core Principles](./principles/README.md)**:

- **Simplicity Over Complexity** - Flat layer hierarchy, single responsibility per layer
- **Explicit Over Implicit** - Required traceability sections, explicit governance relationships
- **Documentation First** - Comprehensive documentation of all layers and relationships
- **Progressive Disclosure** - Quick reference → detailed layers → complete examples

---

## Conventions Implemented/Respected

**From [Conventions Index](./conventions/README.md)**:

- **[Content Quality Principles](./conventions/writing/quality.md)** - Active voice, heading hierarchy, accessibility compliance
- **[File Naming Convention](./conventions/structure/file-naming.md)** - Descriptive filenames, README.md for indices
- **[Linking Convention](./conventions/formatting/linking.md)** - GitHub-compatible markdown links with .md extension

---

**Maintained By**: Repository governance team
**Review Cycle**: Quarterly (ensure layer descriptions remain accurate)
