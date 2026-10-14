---
description: |-
  Judges one pinned change or outgoing range against the three leak classes, reading every commit's additions, file names, messages, and ref names, and returns findings that never carry the value.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
  task: deny
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/leak-reviewer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
