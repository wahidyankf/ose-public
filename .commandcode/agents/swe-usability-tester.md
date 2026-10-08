---
description: |-
  Evaluates a running web interface or command-line tool as a first-time user would, without its specifications, source, or designs, judging frozen tasks by named usability principles and recording severity-rated findings.
disallowedTools: |-
  agent, agent_output
name: swe-usability-tester
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell, web_search, web_fetch
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/swe-usability-tester.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
