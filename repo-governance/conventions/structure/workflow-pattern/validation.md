---
description: The six checks a workflow document must pass before execution — frontmatter schema, agent references, input/output types, dependencies, state references, and file naming.
when_to_use: Use when checking whether a workflow document is ready for execution.
---

# Validation

Workflows must be validated before execution:

- PASS: **Frontmatter schema**: `description` and `when_to_use` present, and no other key
- PASS: **Agent references**: All agents exist in the canonical agent directory (`.agents/agents/`)
- PASS: **Input/output types**: Valid type declarations in the Inputs and Outputs body sections
- PASS: **Step dependencies**: No circular dependencies
- PASS: **State references**: All references resolve
- PASS: **File naming**: Plain name in correct subdirectory of `repo-governance/workflows/`

Validation performed by `workflow-validator` (future agent).
