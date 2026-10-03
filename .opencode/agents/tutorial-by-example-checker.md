---
description: |-
  Audits one By Example tutorial's examples, annotations, and progression against the By Example tutorial rules, with every product threshold read from the adopting repository's adapter, and returns criticality-rated findings without modifying anything.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/tutorial-by-example-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
