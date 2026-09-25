---
description: "Introduces the tool-access patterns table (Read-Only, Checker, Documentation, Development) that governs which tools an agent's frontmatter should request."
when_to_use: Use when deciding the baseline tool-access pattern for a new agent.
---

# Tool Access Patterns

Tool permissions follow the **principle of least privilege**: agents should only have access to tools they actually need.

| Pattern           | Tools                               | Use For                                       | Example          | Rationale                                                                   |
| ----------------- | ----------------------------------- | --------------------------------------------- | ---------------- | --------------------------------------------------------------------------- |
| **Read-Only**     | Read, Glob, Grep                    | Analysis without reports                      | (none currently) | Pure read operations without file output                                    |
| **Checker**       | Read, Glob, Grep, Write, Bash       | Validation with audit report generation       | rules-checker    | Needs Write for reports in `local-tmp/<agent-family>/`, Bash for timestamps |
| **Documentation** | Read, Write, Edit, Glob, Grep       | Creating/editing docs, managing doc structure | docs-maker       | Needs file creation/editing but no shell access                             |
| **Development**   | Read, Write, Edit, Glob, Grep, Bash | Code generation, tests, builds, deployment    | swe-code-maker   | Requires command execution (powerful, only when necessary)                  |
