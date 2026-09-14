---
description: Why agent skills aren't a governance layer, and inline delivery
when_to_use: Use when explaining inline skill delivery.
---

# Agent skills: Delivery Infrastructure (Not a Governance Layer)

**CRITICAL**: agent skills are **delivery infrastructure**, NOT a governance layer.

**Purpose**: Package and deliver knowledge/capabilities to agents in two distinct modes.

**Location**: `.claude/skills/`

**Documentation**: See [`.claude/skills/README.md`](../../.claude/skills/README.md) for skills catalog, or [AGENTS.md](../../AGENTS.md) for root instruction file including skills integration overview

**Two Delivery Modes**:

## Inline agent skills (Knowledge Delivery)

**Default behaviour** - Progressive knowledge injection:

```mermaid
flowchart LR
    accTitle: Inline agent skills (Knowledge Delivery)
    accDescr: L2: Conventions leads to CLAUDE.md or AGENTS.md via startup; L3: Development leads to CLAUDE.md or AGENTS.md via startup; CLAUDE.md or AGENTS.md leads to Claude or OpenCode; and 6 more links.
    L2["L2: Conventions"] -->|startup| CM["CLAUDE.md or<br/>AGENTS.md"]
    L3["L3: Development"] -->|startup| CM
    CM --> H["Claude or<br/>OpenCode"]
    L2 -->|on-demand| SK["Inline agent<br/>skills"]
    L3 -->|on-demand| SK
    SK --> CC["Current<br/>conversation"]
    L2 -->|explicit| DR["Direct references"]
    L3 -->|explicit| DR
    DR --> L4["L4: Agents"]
```

**Characteristics**:

- Progressive disclosure (name/description → full content on-demand)
- Inject convention/development knowledge into current conversation
- Enable knowledge composition (multiple skills work together)
- Serve agents but don't govern them
