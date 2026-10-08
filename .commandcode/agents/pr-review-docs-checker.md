---
description: |-
  Reviews one pinned change for the documentation discipline, judging substantive completeness, clarity, mode fit, drift from the code, accessibility, and whether the change description matches the diff, and returns anchored findings.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: pr-review-docs-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/pr-review-docs-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
