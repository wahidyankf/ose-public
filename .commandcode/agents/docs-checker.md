---
description: |-
  Audits documentation for factual accuracy against authoritative sources and the repository, for contradictions within and across documents, and for references to things that no longer exist, returning rated findings; as a combined validator it also checks structure and links.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: docs-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell, web_search, web_fetch
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/docs-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
