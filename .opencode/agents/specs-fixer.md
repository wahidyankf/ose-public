---
description: |-
  Applies specification checker findings inside the folders that audit covered, after re-validating each one, repairs only structure a rule settles, and records what it fixed, disproved, and left for a person.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/specs-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
