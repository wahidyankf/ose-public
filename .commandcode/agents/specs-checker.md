---
description: |-
  Audits explicitly listed specification folders for index quality, scenario format, cross-folder consistency, architecture views, references, and implementation alignment, and returns rated findings without modifying anything.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: specs-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/specs-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
