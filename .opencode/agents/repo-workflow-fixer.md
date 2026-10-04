---
description: Applies validated fixes from workflow-checker audit reports. Re-validates before applying changes.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/repo-workflow-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
