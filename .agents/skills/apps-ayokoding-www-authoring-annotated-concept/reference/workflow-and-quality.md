# Content Creation Workflow and Quality Standards

## Content Creation Workflow

### Step 1: Determine Mode and Content Path

Read the course `_index.md` `format` field to select standard mode or the no-code sub-mode
(see Mode Selection; for a new course, the content plan states it) before writing any file.

### Step 2: Create Content Metadata

```yaml
title: "Topic Title (Annotated-concept)"
```

### Step 3: Write Overview

State the mental model for the topic, how the worked examples/scenarios progress, and (standard
mode) Editor Setup links.

### Step 4: Create Per-Theme Clusters

Group 45-60 worked examples (or 20-30 scenarios) into per-theme clusters — not fixed
beginner/intermediate/advanced tiers.

### Step 5: Write Each Worked Example or Scenario

Follow the structure above. Choose the medium (code/pseudocode/config/diagram, or scenario +
artifact) per concept, not uniformly.

### Step 6: Ensure Annotation Density (Standard Mode)

Verify 1.0-2.25 comment lines per code/pseudocode line on every code-bearing worked example.

### Step 7: Add Diagrams (Both Modes)

Use `docs-creating-accessible-diagrams` Skill for color-blind friendly Mermaid diagrams wherever a
visual materially aids understanding.

## Quality Standards

The `docs-applying-content-quality` Skill provides general content quality standards (active voice,
heading hierarchy, accessibility).

**Annotated-concept specific**:

- 45-60 worked examples (standard mode) or 20-30 scenarios (no-code sub-mode) — floors, not caps
- 1.0-2.25 annotation density on every code-bearing block (standard mode)
- Worked-example structure present for every example/scenario
- Per-theme clustering, incremental simple → real-world progression
- Accessible Mermaid palette on every diagram
