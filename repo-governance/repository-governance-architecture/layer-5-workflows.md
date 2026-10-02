---
description: "The orchestration layer: workflow families, requirements"
when_to_use: Use for Layer 5's scope and workflow requirements.
---

# Layer 5: Workflows (WHEN - Multi-Step Processes)

**Purpose**: Orchestrated multi-step processes that compose agents, procedures, and/or other workflows. Answers WHEN to orchestrate which steps and in what sequence.

**Location**: `repo-governance/workflows/`

**Key Document**: [Workflows Index](../workflows/README.md)

**Workflow Families**:

- **Maker-Checker-Fixer** - Three-stage content quality (create → validate → fix)
- **Quality Gate** - Bounded validation (check → propagate → re-check, at most three cycles)
- **Plan-Execute-Validate** - Planning workflow (plan → execute → validate → iterate)

**Workflow Characteristics**:

- **Sequences**: Define order (sequential, parallel, conditional)
- **State management**: Pass data between steps
- **Human approval**: Checkpoints for user review
- **Termination criteria**: Clear completion conditions

**Example Workflow**:

```
Maker-Checker-Fixer Workflow:
1. Maker creates content → draft
2. Checker validates → audit report in local-tmp/<agent-family>/
3. User reviews → approve/reject
4. Fixer applies fixes → corrected content
5. Terminate: all findings resolved
```

**Requirements**:

- Each workflow MUST document step sequence (agents, procedures, and/or nested workflows)
- Each workflow MUST define termination criteria
- Human approval checkpoints MUST be explicit
- Workflows must not create circular nesting (A calling B calling A)

**Relationship to Other Layers**:

- **Composes** Layer 4 (AI Agents), procedures, and/or other workflows
- **Implements** Layer 3 (Development patterns like Maker-Checker-Fixer)
- **No governance authority**: Workflows don't govern agents, they compose them
