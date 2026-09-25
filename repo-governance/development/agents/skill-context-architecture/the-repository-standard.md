---
description: "Defines the Skill context modes used in the canonical `.agents/skills/` directory, including inline context mode."
when_to_use: Use when authoring a new Skill and deciding which context mode it declares.
---

# The Repository Standard

## Skill Context Modes in the Canonical Skills Directory

**Standard**: agent skills in `.agents/skills/` support two context modes:

- **Inline skills** (default): Omit `context` field or set `context: inline`. Work in BOTH main conversation AND delegated agent contexts.
- **Fork skills** (`context: fork`): Work from MAIN CONVERSATION ONLY (delegated agents cannot spawn delegated agents).

**Rationale**:

1. **Universal compatibility** - Work in both main conversation and delegated agent contexts
2. **Predictable behaviour** - agent skills always inject knowledge, never fail
3. **Composability** - Agents can freely compose multiple skills
4. **Delegated agent safety** - Delegated agents can use any skill without errors

## Inline Context Mode

**Default behaviour** when `context` field is omitted or set to `inline`:

```yaml
---
description: Knowledge about X for agents
# context: inline is implicit (default)
---
```

**Characteristics**:

- **Progressive disclosure** - Name/description at startup, full content on-demand
- **Knowledge injection** - Add standards and guidance to current conversation
- **Convention packaging** - Bundle governance knowledge for efficient consumption
- **Universal compatibility** - Work in main conversation AND delegated agent contexts
- **Composition** - Multiple skills work together seamlessly

**Tool usage**: agent skills can use `Read`, `Grep`, `Glob` to reference convention documents but should not modify files.
