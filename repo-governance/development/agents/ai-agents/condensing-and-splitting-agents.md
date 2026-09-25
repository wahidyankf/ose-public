---
description: "Gives the criteria for deciding whether an oversized agent should be condensed in place or split into separate agents."
when_to_use: Use when the word-budget gate flags an agent definition and you need to decide whether to condense or split it.
---

# Condensing and Splitting Agents

## When to Condense or Split Agents

**Warning Signs (approaching limits)**:

- The word-budget gate reports the agent over target
- Agent has multiple unrelated responsibilities
- Documentation becoming hard to navigate
- Users confused about when to use the agent

**Condensation Strategies**:

1. **Move details to conventions OR development docs (PRIMARY STRATEGY)** - **CRITICAL:** MOVE content to appropriate docs, NOT DELETE.

   **Destinations**:
   - `repo-governance/conventions/` (content/format standards)
   - `repo-governance/development/` (process/workflow standards)

   Create or expand documents with comprehensive details, then replace with brief summary + link. Zero content loss required.

2. **Remove redundant examples** - Keep 1-2 clear examples per pattern
3. **Consolidate similar sections** - Merge related guidelines
4. **Use tables instead of lists** - More compact for comparisons
5. **Remove "nice to have" guidance** - Focus on essential requirements

**When to split an agent**:

- The word-budget gate fails the agent and no redundancy is left to remove
- Agent has two clearly separable responsibilities
- Agent requires different tool sets for different tasks
- Users would benefit from specialized agents

**Example split scenarios**:

- Agent that both creates and validates → Split into maker + checker
- Agent handling multiple unrelated domains → Split by domain
- Agent with basic + advanced modes → Split by complexity level

**Where the roster lives**: no document enumerates which agent sits in which complexity tier. The
[agent catalog](../../../../.agents/agents/README.md) is the only authoritative roster, and a tier
is read off an agent's own scope using
[Agent Complexity Tiers](./agent-complexity-tiers.md) — never off a hand-maintained table.
