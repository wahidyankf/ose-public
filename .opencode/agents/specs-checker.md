---
description: |-
  Audits explicitly listed specification folders for index quality, scenario format, cross-folder consistency, architecture views, references, and implementation alignment, and returns rated findings without modifying anything.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/specs-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
