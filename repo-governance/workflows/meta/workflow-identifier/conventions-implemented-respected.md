---
description: Traces this convention's design back to the File Naming, AI Agents, and Linking conventions it implements.
when_to_use: Use when auditing this convention for traceability back to other repo-governance conventions.
---

# Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices back to conventions.

This convention implements/respects:

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Workflow files follow plain name pattern (no prefix) in `repo-governance/workflows/` subdirectories, as defined by the file naming convention
- **[Ordinal Filename Prefixes](../../../conventions/structure/ordinal-filename-prefixes.md)**: split shards of a workflow are plain-named; a genuine numbered step keeps an ordinal only when the ordinal is that step's own number
- **[AI Agents Convention](../../../development/agents/ai-agents.md)**: Workflows orchestrate agents defined and governed by the AI Agents Convention; agent names referenced in workflow files must match agent names in `.agents/agents/`
- **[Linking Convention](../../../conventions/formatting/linking.md)**: All workflow cross-references use GitHub-compatible markdown links with `.md` extension and relative paths
