---
description: "Covers agent directory structure, agent versioning, and deprecating agents."
when_to_use: Use when versioning, deprecating, or restructuring an agent's directory placement.
---

# Special Cases

## Agent Directory Structure

The canonical agent directory `.agents/agents/` (harness directories hold only generated routes):

- **Contains** a `README.md` file for agent index and workflow guidance
- **Contains** agent definition files (`.md` files)
- **Follows** flat structure (no subdirectories)

The agent definition `README.md` files (`.agents/agents/README.md` primary and `.opencode/agents/README.md` secondary):

- Lists all available agents with descriptions
- Explains agent workflow and best practices
- Provides guidance on when to use each agent
- Follows the naming exception for README.md files (documented in [File Naming Convention](../../../conventions/structure/file-naming.md))

## Agent Versioning

Currently, we don't version agents. If significant changes are needed:

1. **Update in place** for minor improvements
2. **Document changes** in the agent file (update metadata comment)
3. **Consider** creating a new agent if the purpose changes significantly

## Deprecating Agents

If an agent is no longer needed:

1. **Don't delete immediately** - may be referenced
2. **Add deprecation notice** at the top of the agent file
3. **Point to replacement** agent (if applicable)
4. **Remove after** confirming no references exist
