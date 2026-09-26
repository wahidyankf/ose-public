---
name: docs-creating-tutorial-structure
description: The docs-tutorial-maker agent's structural methodology - the seven tutorial types and coverage levels, the tutorial-specific diagram orientation override (LR default, not the general TD default), the seven-section tutorial template (frontmatter through troubleshooting), and the create/update workflows with tutorial-specific quality requirements. Use when creating or updating tutorial documentation under docs/tutorials/.
---

# Creating Tutorial Structure

## Overview

This Skill packages `docs-tutorial-maker`'s structural methodology for learning-oriented
tutorials, distinct from the universal `docs-applying-content-quality` and
`docs-applying-diataxis-framework` skills it also uses.

## Reference Modules

- [Tutorial Types and Diagram Orientation](reference/tutorial-types-and-diagrams.md) — the
  seven types with coverage percentages, and the tutorial-specific diagram orientation override
- [Tutorial Structure Template](reference/tutorial-structure-template.md) — the seven-section
  template (frontmatter, introduction, prerequisites, steps, validation, next steps,
  troubleshooting)
- [Workflow and Quality Requirements](reference/workflow-and-quality.md) — the create/update
  workflows and the tutorial-specific quality bar beyond general content quality

## Core Principles

- **Coverage percentages indicate depth, never duration** — state any time estimate separately, labelled as an estimate.
- **Explain WHY before HOW** — tutorials teach, they don't just narrate steps.
- **By Example tutorials use a separate, fully-specified skill** — see
  `docs-creating-by-example-tutorials` for the 75-90-example annotation methodology; this Skill
  does not duplicate it.

## Related Skills

- `docs-applying-content-quality` — universal active voice, heading hierarchy, accessibility
- `docs-applying-diataxis-framework` — the four documentation categories
- `docs-creating-accessible-diagrams` — Mermaid diagram standards (note the orientation override
  in reference module 01)
- `docs-creating-by-example-tutorials` — full methodology for the By Example tutorial type
