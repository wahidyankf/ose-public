---
description: "Defines the planning-grade tier: agents that declare opus for creative reasoning, architecture, and open-ended judgment."
when_to_use: Use when deciding whether a new agent should declare the planning-grade (opus) model tier.
---

# Model Tiers — Planning-Grade

**When to use**: Tasks requiring creative reasoning, architectural decisions, code generation,
multi-step judgment calls, or nuanced content creation. This is the default grade for open-ended
work and the grade a promotion to ultra must argue its way past.

**Cognitive profile**: Deep analytical reasoning, novel problem-solving, multi-step planning,
creative synthesis across domains, nuanced judgment under ambiguity.

**Task characteristics**:

- Open-ended problems without a single correct answer
- Architectural decisions requiring trade-off analysis
- Code generation across multiple languages and paradigms
- Content creation requiring domain expertise and originality
- Multi-step planning with conditional branching
- Tasks where the agent must invent approaches, not follow templates

**Agent examples**:

- **plan-maker** — creates project plans requiring scope analysis, dependency mapping, and strategic sequencing
- **rules-\***, **harness-\***, **specs-\*** — reason about governance surfaces where a wrong call propagates across the repository
- **pr-review-scout-maker**, **pr-review-synthesis-maker** — route risk and consolidate nine specialists' findings into one review
- **docs-tutorial-maker** — produces tutorial content requiring pedagogical reasoning, narrative flow, and learning progression design
- **swe-ui-maker** — creates UI components requiring CVA variants, Radix composition, accessibility, tests, and stories in one pass

**Frontmatter**: Specify `model: opus` explicitly.

```yaml
---
name: plan-maker
description: Creates project plans with requirements...
tools: [Read, Write, Edit, Glob, Grep, Bash]
model: opus
effort: high
color: blue
---
```

## Why This Grade Is Declared, Not Inherited

This grade was previously defined as _omitting_ the `model` field so that the agent inherited the
session's model and adapted to the caller's account tier. That definition has been retired. Every
agent now declares its grade explicitly, for two reasons:

1. **A grade that is spelled `<absent>` cannot be read.** A reviewer opening an agent file could not
   tell a deliberate planning-grade assignment from an author who forgot the field. Declaring the
   grade satisfies [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md).
2. **Inheritance made the grade non-deterministic.** The same agent ran at a different capability on
   different accounts, so an agent could pass review on one machine and fail on another. Grades now
   mean the same thing everywhere.

Budget adaptation has not disappeared; it moved to the caller. A session may still override any
subagent's model, and `inherit` remains a valid frontmatter value for an agent that genuinely should
track its caller. What is no longer permitted is leaving `model` blank and calling the absence a
grade.
