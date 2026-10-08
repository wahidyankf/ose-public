---
description: |-
  Audits each project's test targets, local hooks, and pipeline definitions against the adopted gate standards and returns rated findings, without modifying anything.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: ci-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/ci-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
