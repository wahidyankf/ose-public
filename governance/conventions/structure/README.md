---
title: "Structure Conventions"
description: Documentation organization frameworks, file naming, and project planning structure
category: explanation
tags:
  - index
  - conventions
  - structure
  - organization
created: 2026-01-30
---

# Structure Conventions

Documentation organization frameworks, file naming, and project planning structure. These conventions answer the question: **"How do I ORGANIZE documentation?"**

## Purpose

This directory contains standards for how documentation is organized, named, and structured across the repository. These conventions establish the foundational frameworks that govern documentation architecture.

## Documents

- [Agent Naming Convention](./agent-naming.md) - Single exception-free filename rule for agent files in `.claude/agents/` and `.opencode/agent/`. Defines scope vocabulary, role vocabulary (maker, checker, fixer, dev, deployer, manager), and the audit command enforced by `repo-rules-checker`
- [Diataxis Framework](./diataxis-framework.md) - Understanding the four-category documentation organization framework we use (Tutorials, How-To, Reference, Explanation). Foundational framework for all documentation structure
- [File Naming Convention](./file-naming.md) - Kebab-case filename rules for docs/, governance/, and plans/ directories
- [ose-primer Sync Convention](./ose-primer-sync.md) - Directional classification, transforms, and safety invariants governing content flow between `ose-public` (upstream) and `ose-primer` (downstream MIT-only template). Consumed by the two sync-maker agents and audited by `repo-rules-checker`
- [Per-Directory Licensing](./licensing.md) - Standards for the per-directory licensing strategy using MIT for all code in this repository
- [Plans Organization](./plans.md) - Standards for organizing project planning documents in plans/ folder including structure (ideas.md, backlog/, in-progress/, done/), naming patterns (YYYY-MM-DD\_\_identifier/), lifecycle stages, and project identifiers
- [Programming Language Documentation Separation](./programming-language-docs-separation.md) - Establishes clear separation between repository-specific programming language style guides (docs/explanation/) and educational content (ayokoding-web). Defines scope boundaries, prerequisite requirements, cross-referencing patterns, and DRY principle application
- [Specs Directory Structure](./specs-directory-structure.md) - Canonical directory structure for Gherkin feature files, C4 architecture diagrams, and OpenAPI contracts in the specs/ directory. Defines path patterns, domain subdirectory rules (required for BE/FE, flat for CLI), and lib spec organization
- [Workflow Naming Convention](./workflow-naming.md) - Single exception-free filename rule for workflow files under `governance/workflows/` (except `meta/` reference docs). Defines scope vocabulary, type vocabulary (quality-gate, execution, setup), and the audit command enforced by `repo-rules-checker` and `rhino-cli workflows validate-naming`

## Key Concepts

### Diataxis Categories

| Category    | Purpose              | User Need            |
| ----------- | -------------------- | -------------------- |
| Tutorials   | Learning-oriented    | "Help me learn"      |
| How-To      | Problem-solving      | "Help me do X"       |
| Reference   | Information-oriented | "Give me the facts"  |
| Explanation | Understanding        | "Help me understand" |

### File Naming Pattern

Files use kebab-case names describing their content (e.g., `getting-started.md`, `configure-api.md`). Category is conveyed by directory location, not filename prefixes. `README.md` is used for directory index files.

### Plans Lifecycle

```
ideas.md → backlog/ → in-progress/ → done/
```

## Related Documentation

- [Writing Conventions](../writing/README.md) - Content quality standards
- [Formatting Conventions](../formatting/README.md) - Markdown syntax and visual elements
- [Tutorials Conventions](../tutorials/README.md) - Tutorial creation standards
- [Repository Governance Architecture](../../repository-governance-architecture.md) - Six-layer governance model

## Principles Implemented/Respected

This set of conventions implements/respects the following core principles:

- **[Documentation First](../../principles/content/documentation-first.md)**: The Diataxis Framework establishes a systematic four-category documentation structure, making documentation a primary deliverable rather than an afterthought. Plans Organization convention ensures planning work is documented in structured, discoverable locations.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Plans naming patterns (`YYYY-MM-DD__identifier/`) make lifecycle stage and date explicit in folder names. File Naming Convention uses descriptive kebab-case names so a filename clearly communicates the content without abbreviation lookups.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: The four Diataxis categories provide a complete, minimal taxonomy that covers all documentation types without overlap or excessive granularity. File naming uses a single simple kebab-case rule with no prefix encoding to memorize.
