---
description: "The automated-implementer layer: color families, requirements"
when_to_use: Use for Layer 4's scope and agent requirements.
---

# Layer 4: AI Agents (WHO - Executors)

**Purpose**: Automated implementers enforcing conventions and development practices. Answers WHO enforces rules and automates tasks.

**Location**: `.agents/agents/`

**Key Document**: [Agents Index](../../.agents/agents/README.md)

**Agent Families by Color**:

- 🟦 **Makers (Blue)** - Create new content from scratch (has Write tool)
- 🟩 **Checkers (Green)** - Validate and generate audit reports (has Write, Bash; no Edit)
- 🟨 **Fixers (Yellow)** - Modify and propagate existing content (has Edit + Write for fix reports)
- 🟪 **Implementors (Purple)** - Execute plans with full tool access (has Write, Edit, Bash)

**Agent Characteristics**:

- **Atomic responsibility**: One clear purpose per agent
- **Frontmatter**: name, description, tools, model, color, skills
- **Enforce conventions**: Each agent enforces specific conventions/practices
- **Tool permissions**: Carefully scoped (Read-only, Write, Edit, Bash, Web)

**Example Agents**:

- `docs-checker` - Validates factual accuracy using web verification
- `docs-fixer` - Applies validated factual corrections
- `readme-maker` - Creates/updates README files
- `rules-checker` - Validates repository-wide consistency

**Requirements**:

- Agent `name` field MUST match filename (without .md)
- Agent description SHOULD mention enforced conventions/practices (via description field or Reference Documentation section)
- Agent MUST use appropriate tools for task (principle: least privilege)
- Agent color MUST use accessible palette

**Relationship to Other Layers**:

- **Governed by** Layer 2 (Conventions) and Layer 3 (Development)
- **Orchestrated by** Layer 5 (Workflows)
- **Served by** agent skills (delivery infrastructure)

**Example Traceability**:

```
Convention: Color Accessibility
    ↓ implemented by
Agent: docs-checker (validates diagram colors)
Agent: docs-fixer (applies color corrections)
```
