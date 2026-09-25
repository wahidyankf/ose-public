---
description: "Defines single-responsibility, overlap-avoidance, and specialization-vs-generalization rules for agents."
when_to_use: Use when deciding whether a new or existing agent's responsibilities overlap with another agent's.
---

# Agent Responsibility Boundaries

## Single Responsibility Principle

Each agent should have **one clear, focused purpose**.

**PASS: Good - Single Responsibility:**

```yaml
name: docs-maker
description: Expert documentation writer specializing in GitHub-compatible markdown and Diátaxis framework. Use when creating, editing, or organizing project documentation.
```

**FAIL: Bad - Multiple Responsibilities:**

```yaml
name: doc-and-code-helper
description: Writes documentation, generates code, runs tests, and deploys applications.
```

## Avoiding Overlap

Before creating a new agent, check if existing agents already cover the domain:

1. **Review** the agent definition directory (primary source of truth)
2. **Check** each agent's `description` field
3. **Consider** if you can extend an existing agent
4. **Create new** only if there's no overlap

**Decision Matrix: New Agent vs Extend Existing**

| Scenario                     | Create New Agent | Extend Existing Agent  |
| ---------------------------- | ---------------- | ---------------------- |
| Completely different domain  | PASS: Yes        | FAIL: No               |
| Different tool requirements  | PASS: Yes        | FAIL: No               |
| Different model needs        | PASS: Yes        | FAIL: No               |
| Slight variation in workflow | FAIL: No         | PASS: Yes              |
| Similar expertise area       | FAIL: No         | PASS: Yes              |
| Experimental/temporary       | Maybe            | PASS: Prefer extending |

## Agent Specialization vs Generalization

**Prefer specialization over generalization.**

**PASS: Good - Specialized Agents:**

- `docs-maker` - Documentation only
- `rules-checker` - Consistency validation only
- `swe-code-maker` - Application code only

**FAIL: Bad - Over-Generalized:**

- `helper` - Too vague, unclear purpose
- `assistant` - No specific expertise
- `general-agent` - Defeats the purpose of specialization
