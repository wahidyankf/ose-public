---
description: Audits finished plan execution in fixed order and returns the terminal verdict that permits or blocks archival.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/plan-execution-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
