---
description: |-
  Audits a repository's harness bindings for internal parity with their canonical sources and for drift from each harness's current documented conventions, and returns rated findings without editing.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/harness-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
