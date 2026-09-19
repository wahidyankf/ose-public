---
description: "Summarizes the Skill context architecture rules in one closing statement."
when_to_use: Use when you need a one-paragraph recap of the Skill context architecture rules.
---

# Summary

**The Rule**: agent skills in `.agents/skills/` support both inline and fork modes.

**The Reason**: Delegated agents cannot spawn other delegated agents (architectural constraint).

**The Impact**: Universal skill compatibility across main conversation and delegated agent contexts.

**Key distinction**: When writing skills for agents that may run as delegated agents, use inline mode for guaranteed compatibility.

This architectural decision ensures skills work predictably everywhere, enabling confident skill composition and delegated agent usage throughout the repository.

---

**Status**: Active Standard
