# Repository Architecture — Traceability Example and Where Skills Fit

## Complete Traceability Example

### Color Accessibility (Vision → Agents)

**L0 - Vision**: Democratize Islamic enterprise → accessible to everyone

**L1 - Principle**: Accessibility First

- Vision supported: Accessible tools enable global participation
- Key value: Universal access from start

**L2 - Convention**: Color Accessibility Convention

- Implements: Accessibility First
- Rule: Verified color-blind friendly palette
- WCAG AA compliance required

**L3 - Development**: AI Agents Convention

- Respects: Color Accessibility Convention
- Practice: Agent colors use accessible palette
- Implementation: Frontmatter `color` field limited

**L4 - Agents**:

- docs-checker - Validates diagram colors
- docs-fixer - Applies color corrections
- agent-maker - Validates agent frontmatter colors

**L5 - Workflow**: Maker-Checker-Fixer

- Orchestrates: maker → checker → fixer
- Ensures: All diagrams use accessible colors

## Where Skills Fit in the Architecture

**IMPORTANT**: Skills are **delivery infrastructure**, NOT a governance layer.

Skills sit alongside CLAUDE.md, AGENTS.md and direct references as delivery mechanisms, operating in two distinct modes:

### Inline Skills (Knowledge Delivery)

**Default behaviour** - Progressive knowledge injection:

```mermaid
flowchart LR
    accTitle: Inline Skills Knowledge Delivery
    accDescr: L2 Conventions and L3 Development each reach Claude or OpenCode through CLAUDE.md and AGENTS.md at startup, the current conversation through inline skills on demand, and L4 Agents through explicit direct references.
    L2["L2 Conventions"] --> A["CLAUDE.md, AGENTS.md<br/>at startup"]
    L3["L3 Development"] --> A
    L2 --> S["Skills inline<br/>on demand"]
    L3 --> S
    L2 --> R["Direct refs<br/>explicit"]
    L3 --> R
    A --> CO["Claude or OpenCode"]
    S --> CV["Current<br/>conversation"]
    R --> AG["L4 Agents"]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Characteristics**:

- Progressive disclosure (name/description → full content on-demand)
- Inject convention/development knowledge into current conversation
- Enable knowledge composition (multiple skills work together)
- Serve agents but don't govern them

### Fork Skills (Task Delegation)

**Delegation behaviour** with `context: fork`:

```mermaid
flowchart LR
    accTitle: Fork Skills Task Delegation
    accDescr: A fork skill delegates to an isolated agent context, which returns summarized results to the main conversation.
    S["Fork skill<br/>context: fork"] -->|delegates to| I["Isolated agent<br/>context"]
    I -->|returns| R["Summarized<br/>results"]
    R -->|to| M["Main<br/>conversation"]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Characteristics**:

- Spawn isolated subagent contexts for focused work
- Delegate specialized tasks (research, analysis, exploration)
- Act as lightweight orchestrators
- Return results to main conversation
- Still service relationship (not governance)

**Key insight**: Skills SERVE agents through two modes:

- **Inline skills** - Deliver knowledge from L2/L3 to current conversation
- **Fork skills** - Delegate tasks to agents in isolated contexts
- Neither mode governs agents (service relationship, not governance)

**Governance test**:

- Conventions → Agents: Yes (agents MUST follow conventions)
- Development → Agents: Yes (agents MUST follow practices)
- Skills (inline) → Agents: **No** (inject knowledge, serve agents)
- Skills (fork) → Agents: **No** (delegate tasks, serve agents)
