---
description: "Defines the planning-grade tier: agents that declare `tier: plan` for creative reasoning, architecture, and open-ended judgment."
when_to_use: Use when deciding whether a new agent should declare the planning-grade (`plan`) model tier.
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
- **pr-review-scout**, **pr-review-checker** — route risk and consolidate nine specialists' findings into one review
- **docs-tutorial-maker** — produces tutorial content requiring pedagogical reasoning, narrative flow, and learning progression design
- **swe-architect**, **swe-orchestrator** — decide boundaries and tradeoffs, and decompose a goal across the software-engineering family

**Frontmatter**: Declare `tier: plan` in the canonical agent. The Tier Registry maps `plan` to an
empty mapping, so `.claude/agents/` renders `model: inherit` and Codex pins no model.

```yaml
---
name: plan-maker
description: Creates project plans with requirements...
tier: plan
capabilities:
  - repository-read
  - repository-write
  - shell
---
```

## Why the Tier Is Declared but the Model Is Not Pinned

Every agent declares its tier explicitly. A tier that is spelled `<absent>` cannot be read: a reviewer
could not tell a deliberate planning-grade assignment from an author who forgot the field, so
declaring it satisfies
[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md), and
RHINO refuses an agent with no tier.

The model is a separate, deliberate choice made once in the registry. Mapping `plan` to an empty
entry lets the calling session's model run planning work, so a session on a stronger model gives its
planners that model. Pinning `plan` again is one registry edit followed by regeneration.
