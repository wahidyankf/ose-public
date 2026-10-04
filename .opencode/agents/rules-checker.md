---
description: |-
  Audits a repository's rules as a whole for contradictions across levels, inaccurate references, inconsistent terms and strengths, missing traceability, and duplicated bodies, and returns rated findings without editing.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/rules-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
