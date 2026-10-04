---
description: |-
  Creates new canonical AI agent files in .agents/agents/ following AI Agents Convention, then routes them to every harness via ./rhino harness adapters generate. Ensures proper structure, skills integration, and documentation.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/agent-maker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
