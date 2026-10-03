---
description: Applies validated fixes from docs-tutorial-checker audit reports. Re-validates pedagogical findings before applying changes. Use after reviewing docs-tutorial-checker output.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-tutorial-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
