---
description: Workflow files use plain kebab-case names (no prefix) in the subdirectory that encodes their category.
when_to_use: Use when naming a new workflow file or its subdirectory location.
---

# File Naming Convention

All workflow files follow the plain-name pattern (no prefix), organized by group subdirectory:

```
[workflow-name].md
```

- **No prefix**: Workflow files use plain descriptive names
- **Subdirectory**: Location in `repo-governance/workflows/[category]/` encodes the context
- **Identifier**: Lowercase, hyphen-separated
- **Extension**: `.md`

**Examples**:

- `rules-quality-gate.md` (in `repo-governance/workflows/quality/`)
- `plan-execution.md` (in `repo-governance/workflows/plan/`)
- `dev-artifact-clean-up.md` (in `repo-governance/workflows/maintenance/`)

**Note**: Workflow files use plain kebab-case names in their respective subdirectories. See [File Naming Convention](../file-naming.md) for the current naming rules.
