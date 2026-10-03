---
description: |-
  Researches current, verifiable information from the web in an isolated context. Use when you need facts beyond training data cutoff, latest API or library docs, current best practices, or verification of uncertain claims. Returns cited, structured findings without bloating main conversation context.
mode: subagent
permission:
  glob: allow
  grep: allow
  read: allow
  webfetch: allow
  websearch: allow
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/web-researcher.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
