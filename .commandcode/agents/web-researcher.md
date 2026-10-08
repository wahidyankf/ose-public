---
description: |-
  Researches current, verifiable information from the web in an isolated context. Use when you need facts beyond training data cutoff, latest API or library docs, current best practices, or verification of uncertain claims. Returns cited, structured findings without bloating main conversation context.
disallowedTools: |-
  agent, agent_output
name: web-researcher
tools: |-
  read_file, read_directory, grep, glob, web_search, web_fetch
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/web-researcher.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
