---
description: |-
  Checks one pinned change for the pr-review family by coordinating one review pass: after the lens checkers report, it deduplicates, re-categorizes, filters, verifies, and rates raw findings for criticality, then publishes the one review bound to the pinned head, editing no file.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: pr-review-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/pr-review-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
