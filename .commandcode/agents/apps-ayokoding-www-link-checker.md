---
description: Validates links in ayokoding-web content. Checks internal and external links for correctness and accessibility.
disallowedTools: |-
  agent, agent_output
name: apps-ayokoding-www-link-checker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell, web_search, web_fetch
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/apps-ayokoding-www-link-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
