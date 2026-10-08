---
description: |-
  Validates README.md for engagement, accessibility, and quality standards. Checks for jargon, scannability, proper structure, and consistency with documentation. Use when reviewing README changes or auditing README quality.
disallowedTools: |-
  agent, agent_output, edit_file
name: readme-checker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/readme-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
