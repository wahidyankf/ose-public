---
description: |-
  Audits documentation for factual accuracy against authoritative sources and the repository, for contradictions within and across documents, and for references to things that no longer exist, returning rated findings; as a combined validator it also checks structure and links.
mode: subagent
permission:
  bash: allow
  edit: deny
  glob: allow
  grep: allow
  read: allow
  webfetch: allow
  websearch: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/docs-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
