---
description: |-
  Audits a complete plan draft against the plan specification and returns criticality-rated findings to the plan quality gate, without modifying anything it audits.
mode: subagent
permission:
  bash: allow
  glob: allow
  grep: allow
  read: allow
  webfetch: allow
  websearch: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/plan-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
