---
description: "Provides a diagram of the Skill context architecture."
when_to_use: Use when you need a visual reference for how Skill context modes relate to each other.
---

# Architecture Diagram

```mermaid
graph TD
    accTitle: Architecture Diagram
    accDescr: Main Conversation leads to Subagent Forked Context via spawns; Main Conversation leads to Inline agent skills.claude/skills/ via uses; Main Conversation leads to Fork agent skills project-specific dir via uses; and 3 more links.
    MC[Main Conversation] -->|spawns| SA[Subagent Forked<br/>Context]
    MC -->|uses| IS[Inline agent skills<br/>.claude/skills/]
    MC -->|uses| FS[Fork agent skills<br/>project-specific dir]
    SA -->|uses| IS
    SA -->|CANNOT use| FS
    IS -->|references| CONV[Convention Documents<br/>repo-governance/]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:3px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    class MC blue
    class SA purple
    class IS teal
    class FS orange
    class CONV brown

    linkStyle 4 stroke-width:3px,stroke-dasharray:5
```

**Key**:

- Blue: Main conversation context
- Purple: Delegated agent (forked) context
- Green: Universal inline skills (works everywhere)
- Orange: Fork skills (main conversation only)
- Brown: Convention documents (governance layer)
- Dashed: Architectural constraint (cannot do)
