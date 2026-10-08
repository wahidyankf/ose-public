---
description: |-
  Reviews one pinned change for the instruction currency discipline, finding toolchain, dependency-manager, environment, or pipeline changes the agent instruction files no longer describe, and filler that adds no rule.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: pr-review-instruction-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/pr-review-instruction-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
