---
description: Applies validated fixes from readme-checker audit reports. Re-validates README findings before applying changes. Use after reviewing readme-checker output.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/readme-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
