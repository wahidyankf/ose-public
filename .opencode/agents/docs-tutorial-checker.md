---
description: |-
  Validates tutorial quality focusing on pedagogical structure, narrative flow, visual completeness, hands-on elements, and tutorial type compliance. Complements docs-checker (accuracy) and docs-link-checker (links).
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
  task: deny
  webfetch: allow
  websearch: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-tutorial-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
