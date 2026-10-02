---
description: "Walks through worked examples of good agent-skill separation and a decision tree for judging a split."
when_to_use: Use when you need a worked example or decision tree to judge whether an agent-skill split is done well.
---

# Agent-Skill Separation — Examples and Decision Tree

## Examples of Good Separation

### Example 1: Checker Agent

**Before Simplification** (800+ lines):

```markdown
# docs-checker Agent

## UUID Generation

[200 lines of UUID chain logic, timestamp generation]

## Criticality Levels

[150 lines defining CRITICAL/HIGH/MEDIUM/LOW]

## Report Template

[100 lines of report structure examples]

## Validation Workflow

[350 lines of task-specific validation logic]
```

**After Simplification** (350 lines):

```markdown
---
skills:
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - docs-applying-content-quality
---

# docs-checker Agent

## Report Generation

See `repo-generating-validation-reports` Skill for UUID chains, timestamps, progressive writing.

## Criticality Assessment

See `repo-assessing-criticality-confidence` Skill for level definitions.

## Validation Workflow

[350 lines of task-specific validation logic - RETAINED]
```

**Result**: 450 lines removed (56%), all functionality preserved.

### Example 2: Ayokoding Content Agent

**Before Simplification** (1,100+ lines):

```markdown
# apps-ayokoding-www-by-example-maker

## Weight System

[150 lines explaining level-based weights]

## Annotation Standards

[200 lines defining 1-2.25 comment ratio]

## Bilingual Strategy

[100 lines of Indonesian/English patterns]

## Five-Part Example Structure

[150 lines of example format]

## Creation Workflow

[500 lines of task-specific content creation]
```

**After Simplification** (500 lines):

```markdown
---
skills:
  - apps-ayokoding-www-developing-content
  - docs-creating-by-example-tutorials
---

# apps-ayokoding-www-by-example-maker

## Content Patterns

See `apps-ayokoding-www-developing-content` Skill for weight system, bilingual strategy.

## Example Structure

See `docs-creating-by-example-tutorials` Skill for five-part format, annotation density.

## Creation Workflow

[500 lines of task-specific content creation - RETAINED]
```

**Result**: 600 lines removed (55%), all patterns available via agent skills.

## Decision Tree Examples

**Scenario 1**: Adding color palette to diagram-creating agent

```
Knowledge: Accessible color palette (Blue #0173B2, Orange #DE8F05, etc.)

Q: Used by 3+ agents?
A: YES (8+ agents create diagrams)

Q: Reusable domain expertise?
A: YES (color accessibility is universal)

Decision: Extract to `docs-creating-accessible-diagrams` Skill
```

**Scenario 2**: Adding custom validation logic for plan structure

```
Knowledge: Plan must have README.md, brd.md, prd.md, tech-docs.md, delivery.md

Q: Used by 3+ agents?
A: NO (only plan-checker validates plan structure)

Q: Agent-specific workflow?
A: YES (unique to plan validation)

Decision: Keep in plan-checker agent
```

**Scenario 3**: Adding mode parameter handling to fixer agents

```
Knowledge: lax/normal/strict/all modes filter findings by criticality

Q: Used by 3+ agents?
A: YES (all fixer agents use mode parameter)

Q: Reusable domain expertise?
A: YES (mode handling is standardized)

Decision: Extract to `repo-applying-maker-checker-fixer` Skill
```
