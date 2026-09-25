---
description: "Explains when a Skill needs fork behaviour and lists fork-skill use cases outside the repository."
when_to_use: Use when a Skill needs to run in an isolated context outside the current conversation.
---

# Fork agent skills: Main Conversation Only

## When You Need Fork Behaviour

**Option 1: Create fork skills in the canonical skills directory (recommended)**

Fork skills in `.agents/skills/` work from main conversation:

```
.claude/
└─ skills/
   ├─ inline-skill/     # ✅ Inline skill (universal compatibility)
   │  └─ SKILL.md      # context: inline (default)
   └─ fork-skill/       # ✅ Fork skill (main conversation only)
      └─ SKILL.md      # context: fork
```

**Characteristics**:

- Only usable from main conversation
- Clearly separated from universal skills
- Documented as "main conversation only"

**Option 2: Use agent workflows**

For complex orchestration, use workflow documents (Layer 5) that coordinate multiple agents in sequence rather than nesting:

```markdown
## Workflow Steps

1. Main conversation uses agent-maker
2. Main conversation uses agent-checker (separate invocation)
3. Main conversation uses agent-fixer (separate invocation)
```

This avoids delegated agent nesting while achieving similar orchestration goals.

## Fork Skill Use Cases (Outside Repository)

Valid use cases for fork skills (in project-specific directories):

- **Deep research** - Spawn Explore agent for focused investigation
- **Specialized analysis** - Delegate complex analysis to specific agent type
- **Parallel exploration** - Multiple fork skills explore different aspects
- **Workflow delegation** - Main conversation orchestrates multiple delegated agents

**Key constraint**: These must be used from main conversation, never from delegated agents.
