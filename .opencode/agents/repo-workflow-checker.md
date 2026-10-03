---
description: Validates workflow documentation quality and compliance with workflow pattern convention.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/repo-workflow-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
