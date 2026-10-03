---
description: |-
  Designs module boundaries, dependencies, and tradeoffs before implementation, judges finished work against that design, and serves as the architecture lens of a review pass, writing nothing but decision records.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  webfetch: allow
  websearch: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/swe-architect.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
