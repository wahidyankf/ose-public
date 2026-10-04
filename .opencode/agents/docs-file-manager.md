---
description: |-
  Expert at managing files and directories in docs/ directory. Use for renaming, moving, or deleting files/directories while maintaining kebab-case conventions, fixing links, and preserving git history.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-file-manager.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
