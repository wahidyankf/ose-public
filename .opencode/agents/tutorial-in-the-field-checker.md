---
description: |-
  Audits one in-the-field guide set's scenario, built-in-first order, and production code against the in-the-field guide rules, with every product threshold read from the adopting repository's adapter, and returns criticality-rated findings without modifying anything.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/tutorial-in-the-field-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
