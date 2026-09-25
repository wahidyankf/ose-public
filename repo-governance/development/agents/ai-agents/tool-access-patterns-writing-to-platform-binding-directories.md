---
description: "Defines which tools an agent needs when it writes to a canonical source directory such as .agents/agents/."
when_to_use: Use when an agent's frontmatter tools list needs to support writing to a platform binding directory.
---

# Tool Access Patterns — Writing to Platform Binding Directories

Use normal file-editing tools for paths that `repo-config.yml` classifies as `source` or `vendored`.
Platform authorization permits the operation; it does not override ownership. Never hand-edit a
`generated` path or generated delimited region. Use bulk substitution only for mechanical changes
within editable paths.

**Applies to**:

- Creating or updating canonical agents in `.agents/agents/`
- Creating or updating canonical skills and references in `.agents/skills/`
- Updating source-owned indexes
- Maintaining an exact registry-declared vendored path in place

**Sync requirement**: After editing canonical sources, run `./rhino harness adapters generate` and commit
every changed generated mirror with its source. The generator preserves registry-declared vendored
paths.
