---
description: "Explains the core limitation on Skill context and its impact on agent skills."
when_to_use: Use when a Skill needs to spawn or delegate work and you must check whether its context mode allows it.
---

# The Architectural Constraint

## Core Limitation

**Delegated agents cannot spawn other delegated agents.**

This is a fundamental architectural constraint of AI coding agent systems:

```mermaid
flowchart TD
    accTitle: Core Limitation
    accDescr: Main conversation leads to Subagent: forked context via can spawn; Subagent: forked context leads to Inline skills via can use; Subagent: forked context leads to Conventions via can reference; and 1 more links.
    M["Main conversation"] -->|can spawn| S["Subagent:<br/>forked context"]
    S -->|can use| IS["Inline skills"]
    S -->|can reference| CV["Conventions"]
    S -.->|cannot spawn| X["Further subagents"]
```

## Impact on agent skills

Since skills with `context: fork` spawn delegated agents:

1. **Main conversation** can use fork skills ✅ (spawns delegated agent successfully)
2. **Delegated agents** cannot use fork skills ❌ (would require spawning nested delegated agent)

If `.agents/skills/` contains fork skills:

- ✅ Work in main conversation
- ❌ Break when used by delegated agents
- ❌ Reduce skill composability
- ❌ Create confusing "works sometimes" behaviour
