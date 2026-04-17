---
title: "Dynamic Collection References Convention"
description: Standards for referencing dynamic collections (agents, principles, conventions, practices, skills) in documentation without hardcoding counts that become stale
category: explanation
subcategory: conventions
tags:
  - conventions
  - documentation
  - maintenance
  - collections
created: 2026-02-22
updated: 2026-02-22
---

# Dynamic Collection References Convention

This convention defines how to reference dynamic collections in documentation. A dynamic collection is any group whose membership changes over time as items are added or removed. Hardcoding a count for such a collection creates a maintenance burden: every addition or removal requires finding and updating every document that mentions the count. Instead, reference collections by name and link, letting readers find the current count themselves.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Hardcoded counts require manual updates across multiple files whenever the collection changes. Removing counts eliminates a recurring manual maintenance task and prevents documentation drift.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Removing counts simplifies documentation. A count adds no navigational or conceptual value - readers who need the count can follow the link to the index.

- **[Documentation First](../../principles/content/documentation-first.md)**: Documentation must remain accurate. Stale counts undermine trust in the documentation. This convention prevents a class of inaccuracy that is difficult to detect and easy to introduce.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: When a count is present, its staleness is implicit (there is no signal that it is out of date). Removing counts makes the reference pattern explicit: the link is the authoritative source of membership and size.

## Purpose

The repository contains several collections that grow as the project evolves: AI agents, skills, conventions, development practices, principles, and workflows. Documentation files frequently describe these collections with phrases like "N specialized AI agents" or "N conventions". When a new agent is added, every document containing that count must be found and updated. In practice this update is frequently missed, leaving counts that are wrong.

This convention establishes that documentation MUST NOT hardcode counts for dynamic collections. Instead, documentation SHOULD reference the collection by name with a link to its index, where the current count is always accurate.

## Scope

### What This Convention Covers

- Counts of AI agents in the repository
- Counts of skills in the repository
- Counts of conventions in the repository
- Counts of development practices in the repository
- Counts of principles in the repository
- Counts of workflows in the repository
- Any other dynamic collection whose membership changes as the project evolves

### What This Convention Does NOT Cover

- Counts in generated reports (these are snapshots in time, intentionally exact)
- Counts in commit messages (these describe a specific change at a moment in time)
- Version numbers, file sizes, or other non-collection numeric values
- Counts that are part of a code example or configuration file
- Counts of static sets that do not change (e.g., "four Diátaxis categories")

## Standards

### Rule 1: Never Hardcode Dynamic Collection Counts in Documentation

**FAIL: Hardcoded count**:

```markdown
The repository contains 57 specialized AI agents.
```

**PASS: Reference by name with link**:

```markdown
The repository contains [specialized AI agents](./.claude/agents/README.md).
```

> **Note**: The path `./.claude/agents/README.md` in the example above is illustrative. Use the correct relative path based on your file's actual location. For example, from `governance/conventions/writing/`, the correct path would be `../../../.claude/agents/README.md`.

**PASS: Omit the count entirely**:

```markdown
Specialized AI agents automate documentation creation, validation, and content generation.
```

### Rule 2: Layer Descriptions Must Not Include Counts

The six-layer architecture is frequently summarized in documentation. Layer descriptions MUST NOT include counts of the items within that layer.

**FAIL: Layer description with count**:

```markdown
- **Layer 1: Principles** - WHY we value approaches (11 core principles)
- **Layer 2: Conventions** - WHAT documentation rules (30 standards)
- **Layer 3: Development** - HOW we develop (30 practices)
- **Layer 4: AI Agents** - WHO enforces rules (57 specialized agents)
```

**PASS: Layer description without count**:

```markdown
- **Layer 1: Principles** - WHY we value approaches
- **Layer 2: Conventions** - WHAT documentation rules
- **Layer 3: Development** - HOW we develop
- **Layer 4: AI Agents** - WHO enforces rules
```

### Rule 3: Collection Descriptions in Index Documents Must Not Use Counts in Headers or Summaries

Index documents (README files and architecture documents) that list collections MUST NOT embed counts in summaries that appear outside the collection itself.

**FAIL: Count in summary description**:

```markdown
- **Conventions Index** - 30 documentation standards
- **Development Index** - 17 software practices
- **Agents Index** - 57 specialized agents
```

**PASS: Description without count**:

```markdown
- **Conventions Index** - Documentation writing and organization standards
- **Development Index** - Software development practices and workflows
- **Agents Index** - Specialized agents organized by role and responsibility
```

### Rule 4: Directory Tree Comments Must Not Include Counts

Code blocks showing repository structure often include comments that describe what a directory contains. These comments MUST NOT include counts of the directory's contents.

**FAIL: Count in directory comment**:

```
├── .claude/
│   ├── agents/    # 57 specialized AI agents
│   └── skills/    # 34 skill packages
```

**PASS: Description without count**:

```
├── .claude/
│   ├── agents/    # specialized AI agents
│   └── skills/    # skill packages
```

### Rule 5: Where Counts Are Acceptable

Counts are acceptable in the following contexts:

- **Index documents themselves** (e.g., the README in `.claude/agents/` may state the count as a footer note, but this single location becomes the authoritative source)
- **Generated audit reports** in `generated-reports/` (these are point-in-time snapshots)
- **Commit messages** describing a specific change ("add 3 new agents for organiclever")
- **Technical specifications** where the count is a constraint, not a description (e.g., "each agent has exactly 1 name field")
- **Diátaxis category counts** and other truly static sets (4 categories, 2 delivery modes, etc.)

### Rule 6: Index Documents as Single Source of Truth for Counts

If a count is needed anywhere, the index document for that collection is the single source of truth. All other documents MUST reference the index rather than repeat the count.

**The authoritative sources for collection sizes**:

| Collection       | Authoritative Index                      |
| ---------------- | ---------------------------------------- |
| AI Agents        | `.claude/agents/README.md`               |
| Skills           | `.claude/skills/README.md`               |
| Conventions      | `governance/conventions/README.md`       |
| Principles       | `governance/principles/README.md`        |
| Dev Practices    | `governance/development/README.md`       |
| Workflows        | `governance/workflows/README.md`         |
| BE Gherkin Specs | `specs/apps/a-demo/be/gherkin/README.md` |
| FE Gherkin Specs | `specs/apps/a-demo/fe/gherkin/README.md` |

## Examples

### Converting Existing References

**Before (FAIL)**:

```markdown
## AI Agents (57 Specialized Agents)

**Skills Infrastructure**: Agents leverage 34 skills providing two modes:
```

**After (PASS)**:

```markdown
## AI Agents

**Skills Infrastructure**: Agents leverage skills providing two modes:
```

---

**Before (FAIL)**:

```markdown
- **Conventions Index**: [governance/conventions/README.md](./governance/conventions/README.md) - 30 documentation standards
- **Development Index**: [governance/development/README.md](./governance/development/README.md) - 17 software practices
- **Principles Index**: [governance/principles/README.md](./governance/principles/README.md) - 11 foundational principles
- **Agents Index**: [.claude/agents/README.md](./.claude/agents/README.md) - 57 specialized agents
```

**After (PASS)**:

```markdown
- **Conventions Index**: [governance/conventions/README.md](./governance/conventions/README.md) - Documentation writing and organization standards
- **Development Index**: [governance/development/README.md](./governance/development/README.md) - Software development practices and workflows
- **Principles Index**: [governance/principles/README.md](./governance/principles/README.md) - Foundational values governing all layers
- **Agents Index**: [.claude/agents/README.md](./.claude/agents/README.md) - Specialized agents organized by role
```

---

**Before (FAIL)**:

```markdown
**Current State**: 34 skills serving 57 agents
```

**After (PASS)**:

```markdown
**Current State**: Skills serving agents across multiple families
```

### Recognizing the Pattern

Any phrase matching these patterns is a violation of this convention:

- `[number] specialized AI agents`
- `[number] skills`
- `[number] conventions` / `[number] standards`
- `[number] practices`
- `[number] principles` (when referring to the collection as a whole)
- `[number] agents` in a summary context
- `([number] [collection-name])` parenthetical after a layer description

## Special Considerations

### The "Total Agents: N" Footer Pattern

Index documents (the READMEs that list all items in a collection) may maintain a `**Total Agents**: N` line at the bottom as a convenience. This is acceptable because:

1. The index is the single source of truth for counts
2. Maintainers updating the index will see the footer and update it in the same commit
3. The count is local to the document that owns the collection

All other documents MUST NOT replicate this count.

### Workflow Counts and Category Counts

Workflow counts in documentation are covered by this convention and must be removed. However, a count of workflow categories or directory structure categories describes a static organizational structure, not the number of workflow documents, and is acceptable when those categories are not expected to change frequently.

### When Refactoring Existing Documents

When you encounter a hardcoded count in an existing document, update it to remove the count. Do not leave it for later. The convention applies to all documents, not just new ones. If the update is large in scope, create a plan in `plans/` and address it systematically.

## Tools and Automation

The following agents check and enforce this convention:

- **repo-rules-checker** - Validates repository-wide consistency including hardcoded counts
- **repo-rules-fixer** - Applies fixes for governance violations including count removal

## References

**Related Conventions:**

- [Content Quality Principles](./quality.md) - Universal quality standards; accuracy is a quality requirement
- [Conventions Writing Convention](./conventions.md) - Meta-convention for writing convention documents

**Related Development Practices:**

- [AI Agents Convention](../../development/agents/ai-agents.md) - Defines how agents are structured and maintained

**Agents:**

- `repo-rules-maker` - Creates governance documents following this convention
- `repo-rules-checker` - Validates convention compliance across the repository
- `repo-rules-fixer` - Fixes convention violations

---

**Last Updated**: 2026-02-22
